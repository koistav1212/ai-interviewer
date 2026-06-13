from pydantic import BaseModel
from typing import Optional, List

class CompanyResearchOutput(BaseModel):
    mission: Optional[str] = None
    products: List[str] = []
    techStack: List[str] = []
    engineeringCulture: Optional[str] = None
    hiringPhilosophy: Optional[str] = None
    recentInitiatives: List[str] = []
    interviewFocusAreas: List[str] = []
