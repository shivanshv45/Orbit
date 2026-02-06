from google import genai
from pydantic import BaseModel
from typing import List, Union, Literal, Optional
import json
import traceback
import os
import uuid
import base64
from pathlib import Path



from services.Gemini_Services.teaching_prompt import teachingPrompt
from services.Gemini_Services.key_manager import key_manager
from services.db_services.db import get_session

GENERATED_DIR = Path(os.environ.get("GENERATED_DIR", "/tmp/generated"))
GENERATED_DIR.mkdir(parents=True, exist_ok=True)

class Paragraph(BaseModel):
    type: Literal["paragraph"]
    content: str

class Formula(BaseModel):
    type: Literal["formula"]
    formula: str
    explanation: str

class Insight(BaseModel):
    type: Literal["insight"]
    content: str

class ListBlock(BaseModel):
    type: Literal["list"]
    items: List[str]

class Simulation(BaseModel):
    type: Literal["simulation"]
    html: str
    description: str



class QuestionExplanations(BaseModel):
    correct: str
    incorrect: Optional[List[str]] = None

class Question(BaseModel):
    type: Literal["question"]
    questionType: Literal["mcq", "fill_in_blank"]
    question: str
    options: Optional[List[str]] = None
    correctIndex: Optional[int] = None
    correctAnswer: Optional[str] = None
    acceptedAnswers: Optional[List[str]] = None
    explanations: QuestionExplanations
    hint: str

TeachingBlock = Union[
    Paragraph,
    Formula,
    Insight,
    ListBlock,
    Simulation,
    Question,
]

class TeachingResponse(BaseModel):
    blocks: List[TeachingBlock]



def generate_teaching_blocks(
        lesson_title: str,
        subtopic_title: str,
        lesson_content: str,
        learner_score: int,
        nearby_context: str = "",
) -> TeachingResponse:
    print(f"Generating blocks for: {subtopic_title}, score: {learner_score}")
    
    prompt = f"""
{teachingPrompt}

LESSON: {lesson_title}
SUBTOPIC: {subtopic_title}
LEARNER SCORE: {learner_score}

CONTEXT (from nearby subtopics):
{nearby_context[:500] if nearby_context else "None"}

CONTENT TO TEACH:
{lesson_content}

Generate structured teaching blocks as JSON array.
"""
    
    def _call_content(api_key: str):
        client = genai.Client(api_key=api_key)
        
        config = {
            "response_mime_type": "application/json",
            "response_schema": TeachingResponse,
            "temperature": 1.0,
            "safety_settings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
        }

        try:
            
            print(f"[DEBUG] Attempting generation with gemini-3-flash-preview...")
            response = client.models.generate_content(
                model="gemini-3-flash-preview",
                contents=prompt,
                config=config
            )

            if not response.text:
                 raise ValueError("Gemini 3 Flash returned empty response (likely safety block or empty)")
            return response.text
        except Exception as e:
            print(f"[WARNING] gemini-3-flash-preview failed: {str(e)}")
            print(f"[DEBUG] Falling back to gemini-2.5-flash...")
            
            # Fallback to Gemini 2.5 Flash
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=config
            )
            if not response.text:
                 raise ValueError("Gemini 2.5 Flash returned empty response (likely safety block or empty)")
            return response.text
    
    try:
        raw_response = key_manager.execute_with_retry(_call_content)
        
        parsed = json.loads(raw_response)
        result = TeachingResponse(**parsed)
        
        for i, block in enumerate(result.blocks):
            if isinstance(block, Simulation):
                html = block.html.strip()
                if html.endswith("```"):
                    html = html[:-3]
                block.html = html.strip()

        return result
        
    except Exception as e:
        print(f"Generation failed: {str(e)}")
        print(traceback.format_exc())
        raise e