from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from services.interview_graph import interview_graph, generate_interview_report

router = APIRouter()

class InterviewStateModel(BaseModel):
    sessionId: str
    candidateId: str
    jobId: str
    resumeContext: str
    jobContext: str
    companyContext: str
    currentQuestion: str
    currentAnswer: str
    askedQuestions: List[str]
    coveredTopics: List[str]
    requiredSkills: List[str]
    scores: List[Dict[str, Any]]
    difficulty: str
    questionCount: int
    recommendation: Optional[str] = None
    completed: bool = False

@router.post("/interview/next")
async def interview_next(state: InterviewStateModel):
    """
    Executes a single transition step in the LangGraph interview state machine.
    """
    try:
        state_dict = state.model_dump()
        
        # Invoke LangGraph
        updated_state = interview_graph.invoke(state_dict)
        
        return updated_state
    except Exception as e:
        print(f"Error in /interview/next: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/interview/finalize")
async def interview_finalize(state: InterviewStateModel):
    """
    Runs the ReportGeneratorNode to synthesize all evaluations and build the final report.
    """
    try:
        state_dict = state.model_dump()
        report = generate_interview_report(state_dict)
        return report
    except Exception as e:
        print(f"Error in /interview/finalize: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
