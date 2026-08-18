import os
import json
from test_unseen import GovernmentOrderExtractor

def main():
    test_dir = './test'
    model_dir = './fine_tuned_model'
    
    if not os.path.exists(model_dir):
        print(f"Error: Model directory '{model_dir}' not found.")
        return
        
    if not os.path.exists(test_dir):
        print(f"Error: Test directory '{test_dir}' not found.")
        return
        
    files = sorted([f for f in os.listdir(test_dir) if f.endswith('.md')])
    if not files:
        print("No test markdown files found.")
        return
        
    extractor = GovernmentOrderExtractor(model_dir)
    results = []
    
    for f_name in files:
        filepath = os.path.join(test_dir, f_name)
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()
        res = extractor.extract(text)
        results.append({
            "filename": f_name,
            "predictions": res
        })
        
    print(json.dumps(results, indent=4))

if __name__ == '__main__':
    main()
