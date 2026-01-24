import os
from google import genai
from pydantic import BaseModel,ValidationError,Field
from typing import List,Union,Literal,Optional,Annotated

from services.Gemini_Services.teaching_prompt import teachingPrompt

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set")

client=genai.Client(api_key=GEMINI_API_KEY);



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

 #core gemini service

def generate_teaching_blocks(
        lesson_title: str,
        subtopic_title: str,
        lesson_content: str,
        learner_score: int,
        nearby_context: str = "",
) -> TeachingResponse:
    """
    Converts trusted lesson content into structured teaching blocks.
    """

    user_prompt = f"""
Lesson Title:
{lesson_title}

Subtopic Title:
{subtopic_title}

Lesson Content:
{lesson_content}

Nearby Context:
{nearby_context}

Learner Score:
{learner_score}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=user_prompt,
        config={
            "system_instruction": teachingPrompt,
            "response_mime_type": "application/json",
            "response_schema": TeachingResponse,
            "temperature": 0.4,
        },
    )

    print(f"[DEBUG] Gemini raw response text: {response.text[:500]}...")  # First 500 chars
    print(f"[DEBUG] Gemini response candidates: {len(response.candidates)}")

    try:
        teaching_data: TeachingResponse = response.parsed
        print(f"[DEBUG] Parsed teaching data: {teaching_data}")
        print(f"[DEBUG] Number of blocks: {len(teaching_data.blocks)}")
        if teaching_data.blocks:
            print(f"[DEBUG] First block type: {teaching_data.blocks[0].type}")
    except ValidationError as e:
        print(f"[ERROR] Validation error: {e}")
        print(f"[ERROR] Raw response: {response.text}")
        raise ValueError("Invalid Gemini teaching output") from e

    if not teaching_data.blocks:
        print(f"[ERROR] No blocks generated! Raw response: {response.text}")
        raise ValueError("No teaching blocks generated")

    return teaching_data