from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
from llm import get_llm
from tools import (
    extract_go_number,
    extract_date,
    extract_department,
    generate_summary,
    execute_qa
)

# Define State Schema
class AgentState(TypedDict):
    document_text: str       # Full content of the uploaded markdown document
    language: str            # Auto-detected language: 'en' or 'ml'
    intent: str              # Classified user intent: GO_NUMBER, DATE, DEPARTMENT, SUMMARY, QUESTION_ANSWERING
    query: str               # User's chat query text
    response: str            # Final agent generated answer text
    progress_updates: List[str] # Tracker for streaming progress state updates

# 1. Language Detection Node
def detect_language_node(state: AgentState) -> Dict[str, Any]:
    print("[*] Node: Detecting document language...")
    text = state["document_text"]
    
    # Identify Malayalam by checking for characters in the Malayalam unicode block (0D00 - 0D7F)
    has_malayalam = any('\u0d00' <= char <= '\u0d7f' for char in text)
    detected_lang = "ml" if has_malayalam else "en"
    
    print(f"[+] Node: Language detected as '{detected_lang}'")
    return {
        "language": detected_lang,
        "progress_updates": state.get("progress_updates", []) + ["Detecting Language..."]
    }

# 2. Intent Classifier Node
def classify_intent_node(state: AgentState) -> Dict[str, Any]:
    print("[*] Node: Classifying user intent...")
    query = state["query"]
    llm = get_llm()
    
    system_prompt = (
        "You are an AI router. Classify the user query into one of the following exact categories:\n"
        "- GO_NUMBER: Extract the G.O. serial number, order reference, or serial code.\n"
        "- DATE: Extract the date when the order was officially signed or published.\n"
        "- DEPARTMENT: Extract the issuing government department or administrative office.\n"
        "- SUMMARY: Summarize, outline, or digest the document contents.\n"
        "- QUESTION_ANSWERING: General questions, QA, or queries needing context lookup.\n\n"
        f"User Query: {query}\n\n"
        "Classification (return ONLY the classification name):"
    )
    
    try:
        response = llm.invoke(system_prompt)
        intent = response.content.strip().upper()
    except Exception as e:
        print(f"[!] Node Warning: Intent classification LLM call failed: {e}")
        intent = "QUESTION_ANSWERING"
        
    # Standardize intent in case of extra whitespace or formatting
    valid_intents = {"GO_NUMBER", "DATE", "DEPARTMENT", "SUMMARY", "QUESTION_ANSWERING"}
    matched_intent = next((t for t in valid_intents if t in intent), "QUESTION_ANSWERING")
    
    print(f"[+] Node: Intent classified as '{matched_intent}'")
    return {
        "intent": matched_intent,
        "progress_updates": state.get("progress_updates", []) + ["Initializing Agent..."]
    }

# Router logic
def router_decision(state: AgentState) -> str:
    """
    Evaluates the intent field in state to dynamically route to the correct tool.
    """
    intent = state["intent"]
    print(f"[*] Router: Routing to tool for intent '{intent}'...")
    if intent == "GO_NUMBER":
        return "go_number_tool"
    elif intent == "DATE":
        return "date_tool"
    elif intent == "DEPARTMENT":
        return "department_tool"
    elif intent == "SUMMARY":
        return "summary_tool"
    else:
        return "qa_tool"

# 3. Tool Nodes
def go_number_node(state: AgentState) -> Dict[str, Any]:
    output = extract_go_number(state["document_text"], state["language"])
    return {
        "response": output,
        "progress_updates": state.get("progress_updates", []) + ["Selecting Tool...", "Generating Response..."]
    }

def date_node(state: AgentState) -> Dict[str, Any]:
    llm = get_llm()
    output = extract_date(state["document_text"], state["language"], llm)
    return {
        "response": output,
        "progress_updates": state.get("progress_updates", []) + ["Selecting Tool...", "Generating Response..."]
    }

def department_node(state: AgentState) -> Dict[str, Any]:
    llm = get_llm()
    output = extract_department(state["document_text"], state["language"], llm)
    return {
        "response": output,
        "progress_updates": state.get("progress_updates", []) + ["Selecting Tool...", "Generating Response..."]
    }

def summary_node(state: AgentState) -> Dict[str, Any]:
    llm = get_llm()
    output = generate_summary(state["document_text"], state["language"], llm)
    return {
        "response": output,
        "progress_updates": state.get("progress_updates", []) + ["Selecting Tool...", "Generating Response..."]
    }

def qa_node(state: AgentState) -> Dict[str, Any]:
    llm = get_llm()
    output = execute_qa(state["document_text"], state["query"], state["language"], llm)
    return {
        "response": output,
        "progress_updates": state.get("progress_updates", []) + ["Selecting Tool...", "Generating Response..."]
    }

# Build LangGraph workflow
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("detect_language", detect_language_node)
workflow.add_node("classify_intent", classify_intent_node)
workflow.add_node("go_number_tool", go_number_node)
workflow.add_node("date_tool", date_node)
workflow.add_node("department_tool", department_node)
workflow.add_node("summary_tool", summary_node)
workflow.add_node("qa_tool", qa_node)

# Set Entry Edge
workflow.set_entry_point("detect_language")

# Connect Nodes
workflow.add_edge("detect_language", "classify_intent")

# Add Routing Edge
workflow.add_conditional_edges(
    "classify_intent",
    router_decision,
    {
        "go_number_tool": "go_number_tool",
        "date_tool": "date_tool",
        "department_tool": "department_tool",
        "summary_tool": "summary_tool",
        "qa_tool": "qa_tool"
    }
)

# Connect Tools to END
workflow.add_edge("go_number_tool", END)
workflow.add_edge("date_tool", END)
workflow.add_edge("department_tool", END)
workflow.add_edge("summary_tool", END)
workflow.add_edge("qa_tool", END)

# Compile Graph
compiled_graph = workflow.compile()
