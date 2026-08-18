import os
import sys
import json
import re
import torch
from transformers import AutoTokenizer, AutoModelForTokenClassification

class GovernmentOrderExtractor:
    def __init__(self, model_dir):
        print(f"Loading trained XLM-RoBERTa model from: {model_dir} ...")
        self.model = AutoModelForTokenClassification.from_pretrained(model_dir).to('cpu').eval()
        self.tokenizer = AutoTokenizer.from_pretrained(model_dir)
        print("Model and tokenizer loaded successfully onto CPU!\n")

    def extract(self, text):
        import torch
        
        lines = text.split('\n')
        header_lines = [line.strip() for line in lines[:30] if line.strip()]
        
        dept_candidates = []
        go_candidates = []
        date_candidates = []
        
        for line in header_lines:
            # Clean markup signs commonly found in markdown documents
            line_clean = line.replace('#', ' ').replace('*', ' ').replace('_', ' ').replace('\\', ' ')
            line_clean = re.sub(r'\s+', ' ', line_clean).strip()
            if not line_clean or len(line_clean) < 4:
                continue
                
            # Predict token tags on the line
            inputs = self.tokenizer(line_clean, return_tensors='pt', return_offsets_mapping=True, truncation=True, max_length=64)
            with torch.no_grad():
                logits = self.model(input_ids=inputs['input_ids']).logits
                preds = torch.argmax(logits, dim=-1)[0].numpy()
            offsets = inputs['offset_mapping'][0].numpy()
            
            entities = {'DEPARTMENT': [], 'GO_NUMBER': [], 'DATE': []}
            current_entity = None
            entity_start = -1
            entity_end = -1
            
            for idx, pred in enumerate(preds):
                label = self.model.config.id2label[pred]
                start_char, end_char = offsets[idx]
                
                if start_char == 0 and end_char == 0:
                    continue
                    
                if label.startswith('B-'):
                    if current_entity:
                        entities[current_entity].append(line_clean[entity_start:entity_end].strip())
                    current_entity = label.split('-')[1]
                    entity_start = start_char
                    entity_end = end_char
                elif label.startswith('I-'):
                    label_entity = label.split('-')[1]
                    if current_entity and label_entity == current_entity:
                        entity_end = end_char
                    else:
                        if current_entity:
                            entities[current_entity].append(line_clean[entity_start:entity_end].strip())
                        current_entity = None
                else:
                    if current_entity:
                        entities[current_entity].append(line_clean[entity_start:entity_end].strip())
                    current_entity = None
                    
            if current_entity:
                entities[current_entity].append(line_clean[entity_start:entity_end].strip())
                
            # Collect candidates
            if entities['DEPARTMENT']:
                # Filter out lines that look like read/reference lines to avoid false department names
                if not any(x in line_clean.upper() for x in ['READ:', 'ORDER', 'ANNEXURE', 'TO:', 'SECTION OFFICER']):
                    dept_candidates.append(entities['DEPARTMENT'][0])
            if entities['GO_NUMBER']:
                if 'READ' not in line_clean.upper() and 'LETTER' not in line_clean.upper():
                    go_candidates.append(entities['GO_NUMBER'][0])
            if entities['DATE']:
                if 'READ' not in line_clean.upper() and 'LETTER' not in line_clean.upper():
                    date_candidates.append(entities['DATE'][0])
                    
        # Select final outputs from candidates (strictly derived from model classification)
        final_dept = dept_candidates[0] if dept_candidates else None
        final_go = go_candidates[0] if go_candidates else None
        
        # Clean any garbage prefix/suffix from final_dept
        if final_dept:
            final_dept = final_dept.strip(' *_-#,.:')
            
        # Select the first date candidate
        final_date = date_candidates[0] if date_candidates else None
        if final_date:
            final_date = final_date.strip(' *_-#,.:')
        
        result = {}
        if final_dept and str(final_dept).strip() not in ('', 'None', 'null'):
            result['department_name'] = str(final_dept).strip()
        if final_go and str(final_go).strip() not in ('', 'None', 'null'):
            result['go_number'] = str(final_go).strip()
        if final_date and str(final_date).strip() not in ('', 'None', 'null'):
            result['date'] = str(final_date).strip()
            
        return result

def main():
    model_dir = './fine_tuned_model_v3'
    
    if not os.path.exists(model_dir):
        print(f"Error: Fine-tuned model directory '{model_dir}' not found.")
        print("Please train the model first by running train_model.py.")
        return

    filepath = None
    if len(sys.argv) > 1:
        filepath = sys.argv[1]
        if not os.path.exists(filepath):
            print(f"Error: File '{filepath}' does not exist.")
            return
    else:
        # List files in current directory
        files = sorted([f for f in os.listdir('.') if f.endswith('.md')])
        files = [f for f in files if not f.startswith('Project_Report') and f != 'README.md']
        
        if not files:
            print("No markdown files found in current directory.")
            return
            
        print("==================================================")
        print("    Kerala GO NER Model Test Utility (Model-Only)  ")
        print("==================================================")
        print("Select a file to run prediction on:")
        show_files = files[:15]
        for idx, f in enumerate(show_files):
            print(f"[{idx + 1}] {f}")
        if len(files) > 15:
            print(f"... and {len(files) - 15} more files.")
        print("--------------------------------------------------")
        print("[C] Enter a custom file path")
        
        choice = input("\nEnter choice: ").strip()
        
        if choice.upper() == 'C':
            custom_path = input("Enter full path to unseen markdown file: ").strip()
            if os.path.exists(custom_path):
                filepath = custom_path
            else:
                print(f"Error: File '{custom_path}' does not exist.")
                return
        else:
            try:
                val = int(choice)
                if 1 <= val <= len(files):
                    filepath = files[val - 1]
                else:
                    print("Invalid choice index.")
                    return
            except ValueError:
                print("Invalid input.")
                return
            
    # Read text
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()
        
    # Extract entities
    extractor = GovernmentOrderExtractor(model_dir)
    result = extractor.extract(text)
    
    print("\n" + "=" * 50)
    print(f"PREDICTION RESULTS FOR: {os.path.basename(filepath)}")
    print("=" * 50)
    print(json.dumps(result, indent=4))
    print("=" * 50)

if __name__ == '__main__':
    main()
