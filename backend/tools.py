import os
import re
from typing import Any
from extractor import EnglishExtractor, MalayalamExtractor

# Reuse our existing XLM-RoBERTa extractors
english_extractor = EnglishExtractor()
malayalam_extractor = MalayalamExtractor()

def extract_go_number(text: str, lang: str) -> str:
    """
    Invokes the existing, untouched English and Malayalam XLM-RoBERTa models
    to extract the Government Order serial number.
    """
    print(f"[*] Tool: Running GO Number NER model for language '{lang}'...")
    if lang == "en":
        res = english_extractor.extract(text)
        return res.get("go_number", "G.O. Number not found by model.")
    else:
        res = malayalam_extractor.extract(text)
        # Malayalam model returns go_number or go_reference depending on tags
        return res.get("go_number", res.get("go_reference", "സ.ഉ. നമ്പർ കണ്ടെത്താനായില്ല."))

def extract_date(text: str, lang: str, llm: Any) -> str:
    """
    Extracts the official G.O. issue date from the header.
    Prioritizes dates directly associated with the G.O. Number header.
    """
    print("[*] Tool: Running Date Extraction tool...")
    
    # 1. Rule-based extraction (pre-processing to improve accuracy)
    lines = text.split('\n')
    header_block = "\n".join(lines[:30])
    
    # Look for dates in lines containing G.O., Dated, തീയതി etc.
    for line in lines[:30]:
        if "dated" in line.lower() or "തീയതി" in line:
            # Match formats like DD-MM-YYYY or DD.MM.YYYY
            match = re.search(r'(\d{2}[.-]\d{2}[.-]\d{4})', line)
            if match:
                return match.group(1)
                
    # 2. LLM-based verification
    prompt = (
        "You are an expert Government Order parser.\n"
        "Extract the official issue date of this Government Order from the header text below.\n"
        "Do NOT extract dates that appear in references, attachments, circulars, or previous letters.\n"
        "Return ONLY the date string (e.g., '01.09.2016' or '05-12-2025') without any extra words.\n\n"
        f"Header Context:\n{header_block}\n\n"
        "Date:"
    )
    try:
        response = llm.invoke(prompt)
        date_str = response.content.strip()
        # Clean any extra text if the LLM wrote complete sentences
        date_match = re.search(r'(\d{2}[.-]\d{2}[.-]\d{4})', date_str)
        if date_match:
            return date_match.group(1)
        return date_str
    except Exception as e:
        print(f"[!] Tool Warning: Date tool LLM invocation failed: {e}")
        # Final fallback regex matching on header block
        fallback_match = re.search(r'(\d{2}[.-]\d{2}[.-]\d{4})', header_block)
        return fallback_match.group(1) if fallback_match else "Date not found"

def extract_department(text: str, lang: str, llm: Any) -> str:
    """
    Identifies the issuing department from the Government Order header.
    """
    print("[*] Tool: Running Department Extraction tool...")
    lines = text.split('\n')
    header_block = "\n".join(lines[:30])
    
    prompt = (
        "Identify the issuing Government Department from the header block below.\n"
        "Return ONLY the official department name (e.g. 'FINANCE (PENSION-A) DEPARTMENT' or 'ധനകാര്യ വകുപ്പ്') and nothing else.\n\n"
        f"Header Block:\n{header_block}\n\n"
        "Department:"
    )
    try:
        response = llm.invoke(prompt)
        return response.content.strip()
    except Exception as e:
        print(f"[!] Tool Warning: Department tool LLM invocation failed: {e}")
        # Rule-based fallback
        for line in lines[:30]:
            if "department" in line.lower() or "വകുപ്പ്" in line:
                return line.strip(" #*_-:")
        return "Department not found"

def generate_summary(text: str, lang: str, llm: Any) -> str:
    """
    Generates a concise, structured human-readable summary of the G.O.
    """
    print("[*] Tool: Running Summarization tool...")
    # Find Abstract or main body section
    lines = text.split('\n')
    abstract_lines = []
    capture = False
    
    # Simple parser to find 'Abstract' section
    for line in lines:
        if "abstract" in line.lower() or "സംഗ്രഹം" in line:
            capture = True
            continue
        if capture:
            if len(abstract_lines) > 25:  # Capture a reasonable chunk of the abstract
                break
            abstract_lines.append(line)
            
    context_text = "\n".join(abstract_lines) if abstract_lines else "\n".join(lines[:60])
    
    prompt = (
        "You are an AI Government Assistant. Generate a concise, human-readable summary of this Government Order.\n"
        "Identify and format the summary to answer:\n"
        "1. What is the main purpose of the order?\n"
        "2. What administrative approvals, sanctions, or decisions were granted?\n"
        "3. Are there financial implications or actions ordered?\n\n"
        f"Document Section:\n{context_text}\n\n"
        "Summary:"
    )
    try:
        response = llm.invoke(prompt)
        return response.content.strip()
    except Exception as e:
        print(f"[!] Tool Warning: Summary tool LLM invocation failed: {e}")
        return "Error: Could not generate summary. Please check LLM API credentials."

def execute_qa(text: str, query: str, lang: str, llm: Any) -> str:
    """
    Answers user questions using the uploaded document context.
    """
    print(f"[*] Tool: Running QA tool for query: '{query}'...")
    # Provide the first 100 lines as context (fits well within LLM context windows)
    lines = text.split('\n')
    document_context = "\n".join(lines[:120])
    
    prompt = (
        "You are a helpful Government Order AI assistant.\n"
        "Answer the user's question using ONLY the provided document context below.\n"
        "If the answer cannot be found in the text, state politely that the information is not present in this document.\n\n"
        f"Document Context:\n{document_context}\n\n"
        f"User Question: {query}\n\n"
        "Answer:"
    )
    try:
        response = llm.invoke(prompt)
        return response.content.strip()
    except Exception as e:
        print(f"[!] Tool Warning: QA tool LLM invocation failed: {e}")
        return "Error: Could not process question. Please check LLM API credentials."
