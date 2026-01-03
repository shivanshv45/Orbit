import os
from google import genai
from pydantic import BaseModel,ValidationError,Field
from typing import List,Union,Literal,Optional,Annotated

from backend.services.Gemini_Services.teaching_prompt import teachingPrompt

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set")

client=genai.Client(api_key=GEMINI_API_KEY);



#Output Block Schema in Discriminated Union
class Paragraph(BaseModel):
    type: Literal["paragraph"]
    content: str


class Formula(BaseModel):
    type: Literal["formula"]
    formula: str
    explanation: str


class Simulation(BaseModel):
    type: Literal["simulation"]
    simulation_id: Literal[
        "force_mass_acceleration",
        "inertia_motion",
        "action_reaction_pairs",
    ]
    learning_goal: str


class ConceptCheck(BaseModel):
    type: Literal["concept_check"]
    question: str
    expected_thinking: str


class Misconception(BaseModel):
    type: Literal["misconception"]
    belief: str
    correction: str


class Tips(BaseModel):
    type: Literal["tip"]
    content: str


class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_option_index: int
    explanation: str


class Quiz(BaseModel):
    type: Literal["quiz"]
    questions: List[QuizQuestion]

TeachingBlock = Annotated[
    Union[
        Paragraph,
        Formula,
        Simulation,
        ConceptCheck,
        Misconception,
        Tips,
        Quiz,
    ],
    Field(discriminator="type"),
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
        model="gemini-2.0-flash",
        contents=user_prompt,
        config={
            "system_instruction": teachingPrompt,
            "response_mime_type": "application/json",
            "response_schema": TeachingResponse,
            "temperature": 0.4, #stable and predictable
        },
    )

    try:
        teaching_data: TeachingResponse = response.parsed
    except ValidationError as e:
        raise ValueError("Invalid Gemini teaching output") from e

    if not teaching_data.blocks:
        raise ValueError("No teaching blocks generated")

    return teaching_data