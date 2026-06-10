from pydantic import BaseModel
from typing import Optional, List

class ParsedJD(BaseModel):
    companyName: Optional[str] = None
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    salaryRange: Optional[str] = None
    vacancies: Optional[int] = None
    experience: Optional[str] = None
    employmentType: Optional[str] = None
    industry: Optional[str] = None
    seniority: Optional[str] = None
    requiredSkills: List[str] = []
    preferredSkills: List[str] = []
    responsibilities: List[str] = []
    benefits: List[str] = []
    education: List[str] = []
    eligibility: List[str] = []
    backlogsAllowed: Optional[bool] = None
    certifications: List[str] = []
    tools: List[str] = []
    technologies: List[str] = []
    softSkills: List[str] = []
    keywords: List[str] = []
    interviewTopics: List[str] = []
    rawText: Optional[str] = ""
