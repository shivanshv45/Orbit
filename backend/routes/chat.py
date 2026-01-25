from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from services.db_services.db import get_session
from services.Gemini_Services.key_manager import key_manager
from google import genai
import traceback

router = APIRouter(prefix="/api", tags=["AI Chat"])

class ChatRequest(BaseModel):
    message: str
    context: str

@router.post("/chat")
async def chat_with_ai(
    data: ChatRequest,
    db: Session = Depends(get_session)
):
    try:
        def _call_chat(api_key: str):
            client = genai.Client(api_key=api_key)
            
            prompt = f"""You are a helpful teaching assistant. Answer the student's question  and clearly.

Context from lesson:
"{data.context}"

Student's question:
{data.message}

Provide a short, focused answer (4-5 sentences max). Be encouraging and doubt-oriented."""
            
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=prompt,
                config={
                    "temperature": 0.7,
                    "max_output_tokens": 150,
                }
            )
            
            return response.text.strip()
        
        answer = key_manager.execute_with_retry(_call_chat)
        
        return {
            "response": answer,
            "success": True
        }
        
    except Exception as e:
        print(f"[ERROR] Chat failed: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
