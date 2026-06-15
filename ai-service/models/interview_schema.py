from pydantic import BaseModel
from typing import Optional

class FirstQuestionRequest(BaseModel):
    resume: str
    job: str
    company: str

class FirstQuestionResponse(BaseModel):
    question: str
    topic: str
    difficulty: str = "medium"
