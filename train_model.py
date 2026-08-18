import os
import json
import random
import torch
import numpy as np
from transformers import (
    AutoTokenizer, 
    AutoModelForTokenClassification, 
    TrainingArguments, 
    Trainer,
    DataCollatorForTokenClassification
)
from datasets import Dataset
from sklearn.metrics import precision_recall_fscore_support


def train_model(directory='.'):
    print("Checking system resources...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on device: {device}")
    
    # 1. Load train.json and val.json (Document-Level Split)
    train_json_path = os.path.join(directory, 'train.json')
    val_json_path = os.path.join(directory, 'val.json')
    
    if not os.path.exists(train_json_path) or not os.path.exists(val_json_path):
        raise FileNotFoundError(
            "train.json or val.json not found. Please run auto_label.py first."
        )
        
    with open(train_json_path, 'r', encoding='utf-8') as f:
        train_examples = json.load(f)
    with open(val_json_path, 'r', encoding='utf-8') as f:
        val_examples = json.load(f)
        
    print(f"Loaded {len(train_examples)} train examples and {len(val_examples)} validation examples.")
    
    # 2. Mappings
    label_list = ["O", "B-DEPARTMENT", "I-DEPARTMENT", "B-GO_NUMBER", "I-GO_NUMBER", "B-DATE", "I-DATE"]
    label2id = {label: i for i, label in enumerate(label_list)}
    id2label = {i: label for i, label in enumerate(label_list)}
    
    # 3. Tokenizer
    model_checkpoint = "xlm-roberta-base"
    print(f"Loading tokenizer: {model_checkpoint}")
    tokenizer = AutoTokenizer.from_pretrained(model_checkpoint)
    
    # 4. Offset alignment
    def align_and_tokenize(examples_list):
        tokenized_inputs = {
            "input_ids": [],
            "attention_mask": [],
            "labels": []
        }
        for ex in examples_list:
            text = ex["text"]
            entities = ex["entities"]
            
            char_labels = ["O"] * len(text)
            for ent_text, ent_label in entities:
                start = text.find(ent_text)
                if start == -1:
                    continue
                end = start + len(ent_text)
                char_labels[start] = f"B-{ent_label}"
                for i in range(start + 1, end):
                    char_labels[i] = f"I-{ent_label}"
                    
            tokenized = tokenizer(
                text,
                truncation=True,
                max_length=32, # CPU-optimized max length (shorter for faster attention compute)
                return_offsets_mapping=True,
                padding=False
            )
            
            labels = []
            offsets = tokenized["offset_mapping"]
            for idx, (start, end) in enumerate(offsets):
                if start == 0 and end == 0:
                    labels.append(-100)
                else:
                    token_char_labels = char_labels[start:end]
                    non_o_labels = [l for l in token_char_labels if l != "O"]
                    if non_o_labels:
                        labels.append(label2id[non_o_labels[0]])
                    else:
                        labels.append(label2id["O"])
            tokenized_inputs["input_ids"].append(tokenized["input_ids"])
            tokenized_inputs["attention_mask"].append(tokenized["attention_mask"])
            tokenized_inputs["labels"].append(labels)
            
        return Dataset.from_dict(tokenized_inputs)
        
    def compute_metrics(eval_preds):
        logits, labels = eval_preds
        preds = np.argmax(logits, axis=-1)
        
        flat_preds = preds.flatten()
        flat_labels = labels.flatten()
        
        mask = flat_labels != -100
        flat_preds = flat_preds[mask]
        flat_labels = flat_labels[mask]
        
        # Exclude class 0 ('O') from precision/recall/F1 calculation to get true entity metrics
        precision, recall, f1, _ = precision_recall_fscore_support(
            flat_labels, 
            flat_preds, 
            average='micro', 
            labels=[1, 2, 3, 4, 5, 6],
            zero_division=0
        )
        
        accuracy = np.mean(flat_preds == flat_labels)
        
        return {
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "accuracy": accuracy
        }

    train_dataset = align_and_tokenize(train_examples)
    val_dataset = align_and_tokenize(val_examples)
    print("Dataset tokenization and subword alignment completed.")
    
    # 5. Load Model
    print(f"Instantiating model classification head: {model_checkpoint}")
    model = AutoModelForTokenClassification.from_pretrained(
        model_checkpoint,
        num_labels=len(label_list),
        id2label=id2label,
        label2id=label2id
    )
    
    # 6. Freeze backbone layers except the last 1 encoder layer for domain adaptation on CPU
    for param in model.roberta.parameters():
        param.requires_grad = False
        
    for layer in model.roberta.encoder.layer[-1:]:
        for param in layer.parameters():
            param.requires_grad = True
            
    print("XLM-RoBERTa base model backbone frozen except for the last 1 encoder layer.")
    
    # 7. Training Args (20 Epochs, no intermediate checkpoint saving to prevent MemoryError)
    output_model_dir = os.path.join(directory, 'fine_tuned_model_v3')
    training_args = TrainingArguments(
        output_dir=os.path.join(directory, 'results'),
        eval_strategy="epoch",
        save_strategy="no",
        learning_rate=3e-4,
        per_device_train_batch_size=16,
        per_device_eval_batch_size=16,
        num_train_epochs=20,  # 20 epochs as requested
        weight_decay=0.01,
        logging_steps=5,
        use_cpu=True,
        report_to="none"
    )
    
    data_collator = DataCollatorForTokenClassification(tokenizer=tokenizer)
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        processing_class=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics
    )
    
    print("Fine-tuning classifier head and top backbone layers on CPU for 20 epochs...")
    trainer.train()
    
    # Evaluate
    print("Evaluating best model checkpoint...")
    eval_results = trainer.evaluate()
    print("Best Model Evaluation Results:", eval_results)
    
    # Save
    print(f"Saving model and tokenizer to: {output_model_dir}")
    model.save_pretrained(output_model_dir)
    tokenizer.save_pretrained(output_model_dir)
    print("Training process finished successfully!")

if __name__ == '__main__':
    train_model()
