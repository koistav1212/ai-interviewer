from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.candidate_research import analyze_candidate_with_groq

router = APIRouter()

class CandidateResearchRequest(BaseModel):
    candidate_name: str
    resume_text: str
    github_results: str
    linkedin_results: str

@router.post("/analyze-candidate")
async def analyze_candidate(request: CandidateResearchRequest):
    """
    Receives candidate name, resume text, github search results, and linkedin search results, and runs Groq to parse them into structured candidate intelligence.
    """
    if not request.candidate_name:
        raise HTTPException(status_code=400, detail="candidate_name is required")
    
    try:
        result = analyze_candidate_with_groq(
            candidate_name=request.candidate_name,
            resume_text=request.resume_text,
            github_results=request.github_results,
            linkedin_results=request.linkedin_results
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
