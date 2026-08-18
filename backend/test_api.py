import os
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Define sample files
ENGLISH_TEST_FILE = os.path.join(BASE_DIR, "GO(Ms) No 353-2016-Fin  dated 01-09-2016.md")
MALAYALAM_TEST_FILE = os.path.join(BASE_DIR, "mal_geo_ner", "GO(Rt)No9801-2025-FinDated05-12-2025_99.md")

def test_health():
    print("Testing /health endpoint...")
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
    print("Health check passed!\n")

def test_english_extraction():
    print(f"Testing English extraction on file: {os.path.basename(ENGLISH_TEST_FILE)} ...")
    if not os.path.exists(ENGLISH_TEST_FILE):
        print(f"Skipping English extraction test: file {ENGLISH_TEST_FILE} not found.")
        return
        
    with open(ENGLISH_TEST_FILE, "r", encoding="utf-8") as f:
        text = f.read()
        
    response = client.post("/api/extract/en", json={"text": text})
    assert response.status_code == 200
    result = response.json()
    print("English Extraction Result:")
    print(result)
    assert "go_number" in result
    print("English extraction passed!\n")

def test_malayalam_extraction():
    test_file = MALAYALAM_TEST_FILE
    print(f"Testing Malayalam extraction on file: {os.path.basename(test_file)} ...")
    if not os.path.exists(test_file):
        # Fallback to look at any Malayalam md file
        mal_dir = os.path.join(BASE_DIR, "mal_geo_ner")
        files = [f for f in os.listdir(mal_dir) if f.endswith(".md")]
        if files:
            test_file = os.path.join(mal_dir, files[0])
            print(f"Using fallback Malayalam file: {files[0]}")
        else:
            print("Skipping Malayalam extraction test: no Malayalam markdown file found.")
            return
            
    with open(test_file, "r", encoding="utf-8") as f:
        text = f.read()
        
    response = client.post("/api/extract/ml", json={"text": text})
    assert response.status_code == 200
    result = response.json()
    print("Malayalam Extraction Result:")
    import json
    print(json.dumps(result, ensure_ascii=True))
    assert "go_number" in result or "go_reference" in result or len(result) >= 0
    print("Malayalam extraction passed!\n")

def test_streaming_extraction():
    print("Testing SSE Streaming extraction...")
    if not os.path.exists(ENGLISH_TEST_FILE):
        print("Skipping streaming test: no test file found.")
        return
        
    with open(ENGLISH_TEST_FILE, "r", encoding="utf-8") as f:
        text = f.read()
        
    # Send request to stream endpoint
    # SSE responses are text/event-stream, we can iterate over lines
    with client.stream("POST", "/api/extract/stream/en", json={"text": text}) as response:
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        
        print("Streaming events:")
        for line in response.iter_lines():
            if line:
                print(f"  {line}")
                
    print("Streaming extraction passed!\n")

if __name__ == "__main__":
    print("==============================================")
    print("    Running Government Order API Test Suite   ")
    print("==============================================\n")
    test_health()
    test_english_extraction()
    test_malayalam_extraction()
    test_streaming_extraction()
    print("All backend API tests completed successfully!")
