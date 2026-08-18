import os
import json
import re
import random

def auto_label_dataset(directory='.'):
    # 1. Gather all files
    md_files = sorted([f for f in os.listdir(directory) if f.endswith('.md')])
    md_files = [f for f in md_files if not f.startswith('Project_Report') and f != 'README.md']
    
    print(f"Scanning directory: {directory}")
    print(f"Found {len(md_files)} total markdown files.")
    
    # Define regex patterns for extraction
    go_pattern = r'G\.?\s*O\.?\s*(?:\(?\s*(?:Rt|Ms|P)\.?\s*\)?\s*)?(?:No\.|No:|No)\s*[:.]?\s*[\d/A-Za-z.-]+'
    date_pattern = r'\b(\d{1,2}[./-]\d{1,2}[./-]\d{4})\b'
    
    # Set seed for reproducible splitting
    random.seed(42)
    shuffled_files = md_files.copy()
    random.shuffle(shuffled_files)
    
    # 85/15 File Split
    split_idx = int(len(shuffled_files) * 0.85)
    train_files = shuffled_files[:split_idx]
    val_files = shuffled_files[split_idx:]
    
    print(f"File split: {len(train_files)} files for training, {len(val_files)} files for validation.")
    
    def process_files_list(files_list):
        data = []
        dept_count = 0
        go_count = 0
        date_count = 0
        
        for f_name in files_list:
            path = os.path.join(directory, f_name)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            lines = content.split('\n')
            
            # Document-level Entity Extraction using Regex
            dept_text = None
            for line in lines[:30]:
                if len(line) > 80:
                    continue
                if any(kw in line.upper() for kw in ['REPORT', 'COMMISSION', 'WP(C)', 'JUDGEMENT', 'COMPLIED']):
                    continue
                if 'DEPARTMENT' in line.upper() and ('FINANCE' in line.upper() or 'GOVERNMENT OF KERALA' in line.upper()):
                    cleaned = line.replace('#', '').replace('*', '').replace('_', '').strip()
                    m = re.search(r'(FINANCE\s*(?:\([^)]*\)\s*)?DEPARTMENT)', cleaned, re.IGNORECASE)
                    if m:
                        dept_text = m.group(1).strip()
                        break
                    elif cleaned.upper().startswith('FINANCE'):
                        dept_text = cleaned
                        break
                        
            go_text = None
            go_line_idx = -1
            for idx, line in enumerate(lines[:30]):
                cleaned = line.replace('#', '').replace('*', '').replace('_', '').strip()
                if any(x in cleaned.upper() for x in ['READ', 'LETTER', 'U.O. NOTE']):
                    continue
                m = re.search(go_pattern, cleaned, re.IGNORECASE)
                if m:
                    go_text = m.group(0).strip()
                    go_line_idx = idx
                    break
                    
            date_text = None
            if go_line_idx != -1:
                # First check same line as G.O. Number
                m = re.search(date_pattern, lines[go_line_idx])
                if m:
                    date_text = m.group(1)
            
            if not date_text and go_line_idx != -1:
                # Check adjacent lines
                for offset in [-1, 1, 2]:
                    idx = go_line_idx + offset
                    if 0 <= idx < len(lines[:30]):
                        if any(x in lines[idx].upper() for x in ['READ', 'LETTER', 'U.O.', 'WP(C)', 'JUDGEMENT', 'REFERENCE']):
                            continue
                        m = re.search(date_pattern, lines[idx])
                        if m:
                            date_text = m.group(1)
                            break
                            
            if not date_text:
                for line in lines[:30]:
                    if any(x in line.upper() for x in ['READ', 'LETTER', 'U.O.', 'WP(C)', 'JUDGEMENT', 'REFERENCE']):
                        continue
                    m = re.search(date_pattern, line)
                    if m:
                        date_text = m.group(1)
                        break
                            
            if not (dept_text or go_text or date_text):
                continue
                
            # Line-level label generation
            pos_lines = []
            neg_lines = []
            
            for line in lines[:30]:
                line_clean = line.replace('#', ' ').replace('*', ' ').replace('_', ' ').replace('\\', ' ')
                line_clean = re.sub(r'\s+', ' ', line_clean).strip()
                if not line_clean or len(line_clean) < 4:
                    continue
                    
                entities = []
                is_reference_line = any(x in line_clean.upper() for x in ['READ', 'LETTER', 'U.O.', 'WP(C)', 'JUDGEMENT', 'REFERENCE'])
                
                if dept_text:
                    m = re.search(re.escape(dept_text), line_clean, re.IGNORECASE)
                    if m:
                        entities.append([m.group(0), "DEPARTMENT"])
                        dept_count += 1
                if go_text and not is_reference_line:
                    m = re.search(re.escape(go_text), line_clean, re.IGNORECASE)
                    if m:
                        entities.append([m.group(0), "GO_NUMBER"])
                        go_count += 1
                if date_text and not is_reference_line:
                    m = re.search(re.escape(date_text), line_clean, re.IGNORECASE)
                    if m:
                        entities.append([m.group(0), "DATE"])
                        date_count += 1
                        
                if entities:
                    pos_lines.append({
                        "text": line_clean,
                        "entities": entities
                    })
                else:
                    if len(line_clean) > 8:
                        neg_lines.append({
                            "text": line_clean,
                            "entities": []
                        })
                        
            # Add all positive lines
            data.extend(pos_lines)
            
            # Sample 2 negative lines per file to expose the model to reference lines as negatives
            if neg_lines:
                sampled_negs = random.sample(neg_lines, min(len(neg_lines), 2))
                data.extend(sampled_negs)
                
        return data, dept_count, go_count, date_count

    print("\nProcessing training files...")
    train_data, t_dept, t_go, t_date = process_files_list(train_files)
    
    print("Processing validation files...")
    val_data, v_dept, v_go, v_date = process_files_list(val_files)
    
    # Save both files
    with open(os.path.join(directory, 'train.json'), 'w', encoding='utf-8') as f:
        json.dump(train_data, f, indent=4)
        
    with open(os.path.join(directory, 'val.json'), 'w', encoding='utf-8') as f:
        json.dump(val_data, f, indent=4)
        
    # Recalculate statistics
    t_pos = sum(1 for ex in train_data if len(ex["entities"]) > 0)
    t_neg = sum(1 for ex in train_data if len(ex["entities"]) == 0)
    
    v_pos = sum(1 for ex in val_data if len(ex["entities"]) > 0)
    v_neg = sum(1 for ex in val_data if len(ex["entities"]) == 0)
    
    print("\n" + "="*45)
    print("      DATASET SPLIT GENERATION STATISTICS      ")
    print("="*45)
    print(f"Total MD Files Processed:  {len(train_files) + len(val_files)}")
    print(f"  - Train Files:           {len(train_files)}")
    print(f"  - Validation Files:      {len(val_files)}")
    print(f"\nTraining Set Examples (train.json): {len(train_data)}")
    print(f"  - Positive Examples:     {t_pos}")
    print(f"  - Negative Examples:     {t_neg}")
    print(f"  - Labeled DEPARTMENT:    {t_dept}")
    print(f"  - Labeled GO_NUMBER:     {t_go}")
    print(f"  - Labeled DATE:          {t_date}")
    print(f"\nValidation Set Examples (val.json): {len(val_data)}")
    print(f"  - Positive Examples:     {v_pos}")
    print(f"  - Negative Examples:     {v_neg}")
    print(f"  - Labeled DEPARTMENT:    {v_dept}")
    print(f"  - Labeled GO_NUMBER:     {v_go}")
    print(f"  - Labeled DATE:          {v_date}")
    print("="*45 + "\n")
    
    return train_data, val_data

if __name__ == '__main__':
    auto_label_dataset()
