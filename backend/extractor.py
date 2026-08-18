import os
import re
import torch
from transformers import AutoTokenizer, AutoModelForTokenClassification

# Paths to the model directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGLISH_MODEL_DIR = os.path.join(BASE_DIR, "fine_tuned_model_v3")
MALAYALAM_MODEL_DIR = os.path.join(BASE_DIR, "mal_geo_ner", "fine_tuned_model")

class EnglishExtractor:
    def __init__(self):
        self.model_dir = ENGLISH_MODEL_DIR
        self.model = None
        self.tokenizer = None
        
    def load(self, progress_callback=None):
        if self.model is not None:
            return
        print(f"\n[*] EnglishExtractor: Initializing RoBERTa model from: {self.model_dir}...")
        if progress_callback:
            progress_callback("Initializing Model...")
        # Lazy load weights
        self.model = AutoModelForTokenClassification.from_pretrained(self.model_dir).to('cpu').eval()
        
        print("[*] EnglishExtractor: Loading tokenizer...")
        if progress_callback:
            progress_callback("Loading Tokenizer...")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_dir)
        
        print("[+] EnglishExtractor: Model & tokenizer loaded successfully onto CPU!")
        if progress_callback:
            progress_callback("Model Loaded Successfully!")

    def extract(self, text, progress_callback=None):
        print(f"\n[*] EnglishExtractor: Starting extraction request (Text length: {len(text)} chars)")
        self.load(progress_callback)
        
        print("[*] EnglishExtractor: Running inference on header block...")
        if progress_callback:
            progress_callback("Running Inference...")
            
        lines = text.split('\n')
        header_lines = [line.strip() for line in lines[:30] if line.strip()]
        
        dept_candidates = []
        go_candidates = []
        date_candidates = []
        
        for line in header_lines:
            line_clean = line.replace('#', ' ').replace('*', ' ').replace('_', ' ').replace('\\', ' ')
            line_clean = re.sub(r'\s+', ' ', line_clean).strip()
            if not line_clean or len(line_clean) < 4:
                continue
                
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
                
            if entities['DEPARTMENT']:
                if not any(x in line_clean.upper() for x in ['READ:', 'ORDER', 'ANNEXURE', 'TO:', 'SECTION OFFICER']):
                    dept_candidates.append(entities['DEPARTMENT'][0])
            if entities['GO_NUMBER']:
                if 'READ' not in line_clean.upper() and 'LETTER' not in line_clean.upper():
                    go_candidates.append(entities['GO_NUMBER'][0])
            if entities['DATE']:
                if 'READ' not in line_clean.upper() and 'LETTER' not in line_clean.upper():
                    date_candidates.append(entities['DATE'][0])
                    
        # -------------------------------------------------------------
        # PURE MODEL CLASSIFICATION SELECTION
        # We select the final G.O. Number candidate derived strictly 
        # from the XLM-RoBERTa model token classification tags.
        # -------------------------------------------------------------
        final_go = go_candidates[0] if go_candidates else None
        
        if progress_callback:
            progress_callback("Extracting GO Number...")
            
        result = {}
        if final_go:
            result['go_number'] = str(final_go).strip()
            
        return result


class MalayalamExtractor:
    def __init__(self):
        self.model_dir = MALAYALAM_MODEL_DIR
        self.model = None
        self.tokenizer = None
        
    def load(self, progress_callback=None):
        if self.model is not None:
            return
        print(f"\n[*] MalayalamExtractor: Initializing RoBERTa model from: {self.model_dir}...")
        if progress_callback:
            progress_callback("Initializing Model...")
        self.model = AutoModelForTokenClassification.from_pretrained(self.model_dir).to('cpu').eval()
        
        print("[*] MalayalamExtractor: Loading tokenizer...")
        if progress_callback:
            progress_callback("Loading Tokenizer...")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_dir)
        
        print("[+] MalayalamExtractor: Model & tokenizer loaded successfully onto CPU!")
        if progress_callback:
            progress_callback("Model Loaded Successfully!")

    def extract(self, text, progress_callback=None):
        print(f"\n[*] MalayalamExtractor: Starting extraction request (Text length: {len(text)} chars)")
        self.load(progress_callback)
        
        print("[*] MalayalamExtractor: Running inference on header block...")
        if progress_callback:
            progress_callback("Running Inference...")
            
        lines = [l.strip() for l in text.split('\n')[:30] if l.strip()]
        res = {}
        
        for line in lines:
            line_clean = re.sub(r'\s+', ' ', line.replace('#', ' ').replace('*', ' ').replace('_', ' ').replace('\\', ' ')).strip()
            if len(line_clean) < 4:
                continue
                
            inputs = self.tokenizer(line_clean, return_tensors='pt', return_offsets_mapping=True, truncation=True, max_length=64)
            with torch.no_grad():
                preds = torch.argmax(self.model(inputs['input_ids']).logits, dim=-1)[0].numpy()
            offsets = inputs['offset_mapping'][0].numpy()
            
            curr, start, end = None, -1, -1
            entities = {'GO_NUMBER': []}
            
            for idx, pred in enumerate(preds):
                label = self.model.config.id2label[pred]
                s, e = offsets[idx]
                if s == 0 and e == 0:
                    continue
                if label.startswith('B-'):
                    if curr:
                        entities[curr].append(line_clean[start:end].strip())
                    curr, start, end = label[2:], s, e
                elif label.startswith('I-') and curr == label[2:]:
                    end = e
                elif curr:
                    entities[curr].append(line_clean[start:end].strip())
                    curr = None
            if curr:
                entities[curr].append(line_clean[start:end].strip())
                
            for k in entities:
                key = k.lower()
                if entities[k] and key not in res:
                    val = entities[k][0].strip()
                    if val and val.lower() not in ('none', 'null'):
                        res[key] = val
                        
        if progress_callback:
            progress_callback("Extracting GO Reference...")
            
        return res
