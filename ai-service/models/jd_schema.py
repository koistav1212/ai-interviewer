from pydantic import BaseModel, Field
from typing import List, Optional

class JDSchema(BaseModel):
    companyName: Optional[str] = Field(None, description="Name of the company if explicitly mentioned")
    title: Optional[str] = Field(None, description="Job Title")
    department: Optional[str] = Field(None, description="Department or business unit")
    location: Optional[str] = Field(None, description="Job location")
    salaryRange: Optional[str] = Field(None, description="Salary or compensation range if explicitly mentioned")
    vacancies: Optional[int] = Field(None, description="Number of openings if explicitly mentioned")
    experience: Optional[str] = Field(None, description="Required experience if explicitly mentioned")
    employmentType: Optional[str] = Field(None, description="Type of employment (e.g. Full-time, Contract)")
    description: Optional[str] = Field(None, description="General job description")
    requirements: Optional[str] = Field(None, description="Key requirements and qualifications")
    benefits: List[str] = Field(default_factory=list, description="Benefits and perks array")
    skills: List[str] = Field(default_factory=list, description="List of technical and business skills")
    seniority: Optional[str] = Field(None, description="Seniority level (e.g. Junior, Mid, Senior)")
    responsibilities: List[str] = Field(default_factory=list, description="List of key responsibilities as bullet points")
