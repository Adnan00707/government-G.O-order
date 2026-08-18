import os
import re
from typing import Any, List, Optional, Dict
from dotenv import load_dotenv

# Load local environment variables from backend/.env if present
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# Import LangChain core dependencies
try:
    from langchain_core.language_models.chat_models import BaseChatModel
    from langchain_core.messages import BaseMessage, AIMessage
    from langchain_core.outputs import ChatResult, ChatGeneration
    from langchain_core.callbacks import CallbackManagerForLLMRun
except ImportError:
    # Fallback placeholders in case packages are still installing
    BaseChatModel = object
    BaseMessage = object
    AIMessage = object
    ChatResult = object
    ChatGeneration = object
    CallbackManagerForLLMRun = object

class MockChatLLM(BaseChatModel):
    """
    A LangChain-compatible Mock Chat Model designed to run intent classification,
    summarization, and general QA without requiring external API keys.
    """
    def _generate(
        self,
        messages: List[Any],
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ) -> Any:
        # Extract the last user message and the system context
        user_query = ""
        system_context = ""
        
        for msg in reversed(messages):
            if msg.type == "human":
                user_query = msg.content
                break
                
        for msg in messages:
            if msg.type == "system":
                system_context = msg.content
                break
        
        response_text = self.mock_response(user_query, system_context)
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=response_text))])

    def mock_response(self, query: str, context: str) -> str:
        q_lower = query.lower()
        
        # 1. Intent Classifier Mocking
        # If the input query is itself the routing instruction, parse the actual embedded user query
        if "go_number" in q_lower and "question_answering" in q_lower:
            user_query_match = re.search(r'(?i)user query:\s*(.*)', query)
            actual_query = user_query_match.group(1).split('\n')[0].strip() if user_query_match else query
            aq_lower = actual_query.lower()
            
            if any(w in aq_lower for w in ["number", "go ref", "reference", "ref number"]):
                return "GO_NUMBER"
            elif any(w in aq_lower for w in ["date", "when", "day", "month", "year"]):
                return "DATE"
            elif any(w in aq_lower for w in ["department", "dept", "who issued", "who wrote", "office"]):
                return "DEPARTMENT"
            elif any(w in aq_lower for w in ["summary", "summarize", "outline", "bullet"]):
                return "SUMMARY"
            else:
                return "QUESTION_ANSWERING"

        # 2. Summary Tool Mocking
        if "summarize" in q_lower or "summary" in q_lower:
            # Parse abstract from context
            abstract_match = re.search(r'(?i)abstract\s*\n*(.*)', context)
            abstract = abstract_match.group(1)[:300] if abstract_match else "Official administrative order."
            return (
                f"**Document Summary**\n\n"
                f"* **Purpose**: Executive decision regarding department administration and sanction approvals.\n"
                f"* **Subject Area**: {abstract.strip()}\n"
                f"* **Financial Implications**: Sanctions are granted in accordance with standard budget rules.\n"
                f"* **Administrative Action**: Directions are issued to the corresponding treasury officer to release required resources."
            )

        # 3. QA Tool Mocking
        if "who" in q_lower or "issue" in q_lower:
            # Try to identify department from context
            dept_match = re.search(r'(?i)([A-Z\s]+DEPARTMENT)', context)
            dept = dept_match.group(1) if dept_match else "the Finance Department"
            return f"This Government Order was issued by the **{dept.strip()}**, Government of Kerala."
            
        if "when" in q_lower or "date" in q_lower:
            date_match = re.search(r'(?i)dated.*?,?\s*(\d{2}[.-]\d{2}[.-]\d{4})', context)
            date_val = date_match.group(1) if date_match else "the date printed on the header block"
            return f"This order was issued on **{date_val}**."
            
        if "purpose" in q_lower or "about" in q_lower:
            abstract_match = re.search(r'(?i)abstract\s*\n*(.*)', context)
            abstract = abstract_match.group(1)[:200] if abstract_match else "Government Order digitization"
            return f"This document details: *{abstract.strip()}*."

        # Default fallback QA answer
        return (
            f"Based on the provided Government Order document:\n\n"
            f"The query '{query}' was processed. The document contains official directives. "
            f"Please verify specific sections or upload a different markdown file if you need further details."
        )

    @property
    def _llm_type(self) -> str:
        return "mock-chat-model"

def get_llm() -> Any:
    """
    Returns the appropriate LangChain Chat Model.
    Prioritizes Gemini, then OpenAI, and falls back to MockLLM if no credentials exist.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    if gemini_key:
        print("[*] LLM Init: Found GEMINI_API_KEY. Loading ChatGoogleGenerativeAI...")
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=gemini_key)
        except Exception as e:
            print(f"[!] Warning: Failed to load ChatGoogleGenerativeAI: {e}. Falling back...")
            
    if openai_key:
        print("[*] LLM Init: Found OPENAI_API_KEY. Loading ChatOpenAI...")
        try:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(model="gpt-4o-mini", api_key=openai_key)
        except Exception as e:
            print(f"[!] Warning: Failed to load ChatOpenAI: {e}. Falling back...")
            
    print("[!] Warning: No API keys found (GEMINI_API_KEY/OPENAI_API_KEY is empty).")
    print("[+] Loading local MockChatLLM wrapper.")
    return MockChatLLM()
