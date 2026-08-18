import os
import json
from agent import compiled_graph

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGLISH_TEST_FILE = os.path.join(BASE_DIR, "GO(Ms) No 353-2016-Fin  dated 01-09-2016.md")

def run_test_query(doc_text: str, query: str):
    print("=" * 60)
    print(f"USER PROMPT: '{query}'")
    print("=" * 60)
    
    # Initialize the LangGraph state input
    initial_state = {
        "document_text": doc_text,
        "language": "",
        "intent": "",
        "query": query,
        "response": "",
        "progress_updates": []
    }
    
    # Run the graph synchronously
    try:
        final_state = compiled_graph.invoke(initial_state)
        print("\n[OK] Execution Complete!")
        print(f"Detected Language: {final_state.get('language')}")
        print(f"Classified Intent: {final_state.get('intent')}")
        print(f"Progress Milestones: {final_state.get('progress_updates')}")
        print("-" * 60)
        print("AGENT RESPONSE:")
        print(final_state.get("response"))
        print("=" * 60 + "\n")
    except Exception as e:
        print(f"[!] Execution failed: {e}\n")

def main():
    print("====================================================")
    print("     Government Order AI Assistant Agent Test       ")
    print("====================================================\n")
    
    if not os.path.exists(ENGLISH_TEST_FILE):
        print(f"Error: English test file '{ENGLISH_TEST_FILE}' not found.")
        return
        
    with open(ENGLISH_TEST_FILE, "r", encoding="utf-8") as f:
        doc_text = f.read()
        
    print(f"Loaded English document: {os.path.basename(ENGLISH_TEST_FILE)} ({len(doc_text)} characters)")
    
    # Test different intent categories
    run_test_query(doc_text, "Extract the GO Number")
    run_test_query(doc_text, "Extract the Date")
    run_test_query(doc_text, "Extract the Department")
    run_test_query(doc_text, "Summarize this document")
    run_test_query(doc_text, "Who issued this order and what is UGC scheme?")
    
if __name__ == "__main__":
    main()
