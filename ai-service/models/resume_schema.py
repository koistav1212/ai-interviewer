from pydantic import BaseModel
from typing import Optional, List

class PersonalInfo(BaseModel):
    fullName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None

class Education(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    passingYear: Optional[str] = None
    score: Optional[str] = None

class Experience(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    duration: Optional[str] = None
    responsibilities: Optional[str] = None

class Project(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class ParsedResume(BaseModel):
    personalInfo: Optional[PersonalInfo] = None
    education: List[Education] = []
    experience: List[Experience] = []
    skills: List[str] = []
    projects: List[Project] = []
    certifications: List[str] = []
    achievements: List[str] = []
    languages: List[str] = []
