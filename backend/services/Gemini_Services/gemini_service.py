from google import genai
from pydantic import BaseModel
from typing import List, Union, Literal, Optional
import json
import traceback

from services.Gemini_Services.teaching_prompt import teachingPrompt
from services.Gemini_Services.key_manager import key_manager

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
    print(f"[DEBUG] Generating blocks for: {subtopic_title}, score: {learner_score}")
    
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
        
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": TeachingResponse,
                "temperature": 1.0,
            }
        )
        
        return response.text
    
    try:
        raw_response = key_manager.execute_with_retry(_call_content)
        print(f"[DEBUG] Received response from Gemini")
        
        parsed = json.loads(raw_response)
        result = TeachingResponse(**parsed)
        
        block_types = [block.type for block in result.blocks]
        print(f"[DEBUG] Block types generated: {block_types}")
        
        for i, block in enumerate(result.blocks):
            if isinstance(block, Simulation):
                html = block.html.strip()
                if html.startswith("```html"):
                    html = html[7:]
                if html.endswith("```"):
                    html = html[:-3]
                block.html = html.strip()
                print(f"[DEBUG] Simulation block {i}: {len(block.html)} chars")
                print(f"[DEBUG] First 300 chars: {block.html[:300]}")
        
        print(f"[DEBUG] Generated {len(result.blocks)} blocks successfully")
        return result
        
    except Exception as e:
        print(f"[ERROR] Generation failed with gemini-3-flash-preview: {str(e)}")
        print(traceback.format_exc())
        
        print(f"[DEBUG] Retrying with gemini-2.5-flash fallback...")
        
        try:
            def _call_fallback(api_key: str):
                client = genai.Client(api_key=api_key)
                
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json",
                        "response_schema": TeachingResponse,
                        "temperature": 1.0,
                    }
                )
                
                return response.text
            
            raw_response = key_manager.execute_with_retry(_call_fallback)
            print(f"[DEBUG] Fallback succeeded")
            
            parsed = json.loads(raw_response)
            result = TeachingResponse(**parsed)
            
            for i, block in enumerate(result.blocks):
                if isinstance(block, Simulation):
                    html = block.html.strip()
                    if html.startswith("```html"):
                        html = html[7:]
                    if html.endswith("```"):
                        html = html[:-3]
                    block.html = html.strip()
                    print(f"[DEBUG] Simulation block {i}: {len(block.html)} chars")
            
            print(f"[DEBUG] Generated {len(result.blocks)} blocks with fallback")
            return result
            
        except Exception as fallback_error:
            print(f"[ERROR] Fallback also failed: {str(fallback_error)}")
            print(traceback.format_exc())
            raise