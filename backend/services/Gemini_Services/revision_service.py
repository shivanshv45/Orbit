from google import genai
from pydantic import BaseModel
from typing import List, Optional, Literal
import json
import traceback

from services.Gemini_Services.key_manager import key_manager


class RevisionQuestion(BaseModel):
    id: str
    question: str
    questionType: Literal["mcq", "fill_in_blank"]
    options: Optional[List[str]] = None
    correctIndex: Optional[int] = None
    correctAnswer: Optional[str] = None
    acceptedAnswers: Optional[List[str]] = None
    explanation: str
    difficulty: Literal["easy", "medium", "hard"]
    relatedTopic: str


class RevisionNote(BaseModel):
    topic: str
    keyPoints: List[str]
    summary: str
    formulas: Optional[List[str]] = None
    tips: Optional[List[str]] = None


class RevisionResponse(BaseModel):
    notes: List[RevisionNote]
    questions: List[RevisionQuestion]


def generate_revision_content(
    weak_topics: List[dict],
    milestone: int,
    curriculum_title: str,
) -> RevisionResponse:
    print(f"[REVISION] Generating revision for milestone {milestone}%, {len(weak_topics)} weak topics")
    
    is_final_test = milestone == 100
    question_count = 15 if is_final_test else 8
    revision_type = "Final Comprehensive Test" if is_final_test else f"{milestone}% Progress Revision"
    
    topics_formatted = "\n".join([
        f"- {t['title']} (Score: {t['score']}%): {t['content'][:500]}..."
        for t in weak_topics
    ])
    
    prompt = f"""You are creating a {revision_type} for a student learning {curriculum_title}.

The student is struggling with these topics (sorted by lowest score):
{topics_formatted}

Generate revision content with:
1. NOTES: Short, focused revision notes for each weak topic. Include:
   - Key points (bullet points)
   - A brief summary
   - Important formulas if applicable
   - Study tips

2. QUESTIONS: Generate exactly {question_count} questions focusing on the weakest topics.
   - Mix of MCQ and fill-in-the-blank
   - Vary difficulty (more medium/hard for weaker topics)
   - Each question must reference which topic it tests
   - Provide clear explanations for correct answers
   - Generate unique IDs for each question (q1, q2, etc.)

{"This is the FINAL TEST - make questions more challenging and comprehensive." if is_final_test else "Focus on helping the student understand concepts they missed."}

Return as JSON with 'notes' and 'questions' arrays.
"""

    def _call_gemini(api_key: str):
        client = genai.Client(api_key=api_key)
        
        config = {
            "response_mime_type": "application/json",
            "response_schema": RevisionResponse,
            "temperature": 0.8,
            "safety_settings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
        }

        try:
            print(f"[REVISION] Attempting with gemini-2.5-flash...")
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=config
            )
            if not response.text:
                raise ValueError("Empty response from Gemini 2.5 Flash")
            return response.text
        except Exception as e:
            print(f"[REVISION] gemini-2.5-flash failed: {str(e)}, trying fallback...")
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt,
                config=config
            )
            if not response.text:
                raise ValueError("Empty response from fallback model")
            return response.text
    
    try:
        raw_response = key_manager.execute_with_retry(_call_gemini)
        parsed = json.loads(raw_response)
        result = RevisionResponse(**parsed)
        
        print(f"[REVISION] Generated {len(result.notes)} notes and {len(result.questions)} questions")
        return result
        
    except Exception as e:
        print(f"[REVISION] Generation failed: {str(e)}")
        print(traceback.format_exc())
        raise e
