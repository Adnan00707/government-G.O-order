import os
import json
import asyncio
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from agent import compiled_graph
from extractor import EnglishExtractor, MalayalamExtractor

class ExtractRequest(BaseModel):
    text: str

app = FastAPI(
    title="Government Order AI Assistant API",
    description="FastAPI backend to analyze G.O. documents via LangGraph and LLM tools.",
    version="2.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory cache to store the currently active parsed document
active_document = {
    "text": "",
    "filename": "",
    "language": ""
}

class ChatRequest(BaseModel):
    query: str

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        text = contents.decode("utf-8")
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
            
        # Detect language
        has_malayalam = any('\u0d00' <= char <= '\u0d7f' for char in text)
        lang = "ml" if has_malayalam else "en"
        
        # Save to session cache
        active_document["text"] = text
        active_document["filename"] = file.filename
        active_document["language"] = lang
        
        return {
            "status": "success",
            "filename": file.filename,
            "language": "Malayalam" if lang == "ml" else "English",
            "char_count": len(text),
            "preview": text[:500] + "..." if len(text) > 500 else text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat_query(req: ChatRequest):
    if not active_document["text"]:
        raise HTTPException(status_code=400, detail="No document has been uploaded yet. Please upload a file first.")
        
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query prompt cannot be empty.")
        
    async def event_generator():
        # Setup initial state for LangGraph
        state = {
            "document_text": active_document["text"],
            "language": active_document["language"],
            "intent": "",
            "query": req.query,
            "response": "",
            "progress_updates": []
        }
        
        try:
            # Step 1: Loading Document
            yield {"event": "progress", "data": "Loading Document..."}
            await asyncio.sleep(0.4)
            
            # Run LangGraph streaming in async loop
            # we iterate over step updates yielded bycompiled_graph.astream
            async for event in compiled_graph.astream(state, stream_mode="updates"):
                for node_name, state_update in event.items():
                    if node_name == "detect_language":
                        yield {"event": "progress", "data": "Detecting Language..."}
                        await asyncio.sleep(0.4)
                        if "language" in state_update:
                            state["language"] = state_update["language"]
                            
                    elif node_name == "classify_intent":
                        yield {"event": "progress", "data": "Initializing Agent..."}
                        await asyncio.sleep(0.4)
                        if "intent" in state_update:
                            state["intent"] = state_update["intent"]
                            
                    elif node_name in ("go_number_tool", "date_tool", "department_tool", "summary_tool", "qa_tool"):
                        yield {"event": "progress", "data": "Selecting Tool..."}
                        await asyncio.sleep(0.4)
                        
                        yield {"event": "progress", "data": "Generating Response..."}
                        await asyncio.sleep(0.4)
                        
                        if "response" in state_update:
                            state["response"] = state_update["response"]
                            
            # Final result payload
            yield {
                "event": "result",
                "data": json.dumps({
                    "response": state["response"],
                    "intent": state["intent"],
                    "language": state["language"]
                }, ensure_ascii=False)
            }
        except Exception as e:
            yield {"event": "error", "data": str(e)}
            
    return EventSourceResponse(event_generator())

@app.post("/api/extract/{lang}")
async def extract_metadata(lang: str, req: ExtractRequest):
    if lang not in ("en", "ml"):
        raise HTTPException(status_code=400, detail="Invalid language. Supported: en, ml")
    try:
        if lang == "en":
            extractor = EnglishExtractor()
        else:
            extractor = MalayalamExtractor()
        res = extractor.extract(req.text)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/extract/stream/{lang}")
async def extract_metadata_stream(lang: str, req: ExtractRequest):
    if lang not in ("en", "ml"):
        raise HTTPException(status_code=400, detail="Invalid language. Supported: en, ml")
    
    async def event_generator():
        try:
            queue = asyncio.Queue()
            
            def run_extraction():
                try:
                    def callback(progress_status):
                        asyncio.run_coroutine_threadsafe(queue.put({"event": "progress", "data": progress_status}), loop)
                    
                    if lang == "en":
                        extractor = EnglishExtractor()
                    else:
                        extractor = MalayalamExtractor()
                        
                    res = extractor.extract(req.text, progress_callback=callback)
                    asyncio.run_coroutine_threadsafe(queue.put({"event": "result", "data": json.dumps(res, ensure_ascii=False)}), loop)
                except Exception as e:
                    asyncio.run_coroutine_threadsafe(queue.put({"event": "error", "data": str(e)}), loop)
                finally:
                    asyncio.run_coroutine_threadsafe(queue.put(None), loop)

            loop = asyncio.get_running_loop()
            task = loop.run_in_executor(None, run_extraction)
            
            while True:
                item = await queue.get()
                if item is None:
                    break
                yield item
                
        except Exception as e:
            yield {"event": "error", "data": str(e)}

    return EventSourceResponse(event_generator())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
