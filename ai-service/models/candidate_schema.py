from pydantic import BaseModel
from typing import Optional, List

class CandidateIntelligenceOutput(BaseModel):
    summary: Optional[str] = None
    githubFootprint: Optional[str] = None
    linkedinFootprint: Optional[str] = None
    keyStrengths: List[str] = []
    interviewRecommendations: List[str] = []
