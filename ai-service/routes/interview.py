from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from services.interview_graph import interview_graph, generate_interview_report
from models.interview_schema import FirstQuestionRequest, FirstQuestionResponse
from services.first_question import generate_first_question_with_groq

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
    
    # State routing & historical variables
    answers: List[str] = []
    next_step: Optional[str] = None
    
    # Report evaluation metrics stored in graph
    technicalScore: Optional[float] = None
    communicationScore: Optional[float] = None
    overallScore: Optional[float] = None
    coverage: Optional[float] = None
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None
    feedback: Optional[str] = None

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

@router.post("/interview/first-question")
async def first_question(request: FirstQuestionRequest):
    """
    Generates the first interview question based on resume, job, and company context.
    """
    try:
        result = generate_first_question_with_groq(
            resume=request.resume,
            job=request.job,
            company=request.company
        )
        return result
    except Exception as e:
        print(f"Error in /interview/first-question: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
