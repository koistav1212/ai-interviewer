from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.company_research import analyze_company_with_groq

router = APIRouter()

class CompanyResearchRequest(BaseModel):
    company_name: str
    job_title: str
    search_results: str

@router.post("/analyze-company")
async def analyze_company(request: CompanyResearchRequest):
    """
    Receives company name, job title, and search results, and runs Groq to parse them into structured company intelligence.
    """
    if not request.company_name:
        raise HTTPException(status_code=400, detail="company_name is required")
    if not request.job_title:
        raise HTTPException(status_code=400, detail="job_title is required")
    
    try:
        result = analyze_company_with_groq(
            company_name=request.company_name,
            job_title=request.job_title,
            search_results=request.search_results
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
