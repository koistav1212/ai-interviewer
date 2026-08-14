from fastapi import APIRouter, HTTPException, UploadFile, File
import os
import tempfile
from groq import Groq
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
    
    # Level 1 Memory (Stable Interview Context)
    candidate_profile: Dict[str, Any] = {}
    resume_entities: Dict[str, Any] = {}
    jd_profile: Dict[str, Any] = {}
    interview_blueprint: Dict[str, Any] = {}
    company_profile: Dict[str, Any] = {}
    industry_profile: Dict[str, Any] = {}
    
    # Level 3 Memory (Current Answer Context)
    current_question: str = ""
    current_answer: str = ""
    claims: List[str] = []
    weaknesses: List[str] = []
    technologies: List[str] = []
    covered_topics: List[str] = []
    uncovered_topics: List[str] = []
    follow_up_depth: int = 0
    
    # Internal LangGraph routing / historical tracking
    askedQuestions: List[str] = []
    answers: List[str] = []
    scores: List[Dict[str, Any]] = []
    difficulty: str = "medium"
    questionCount: int = 0
    completed: bool = False
    next_step: Optional[str] = None
    
    # Final Report metrics
    technicalScore: Optional[float] = None
    communicationScore: Optional[float] = None
    overallScore: Optional[float] = None
    coverage: Optional[float] = None
    strengths: Optional[List[str]] = None
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

@router.post("/interviews/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Transcribes audio using Groq Whisper API.
    Expects a webm audio file.
    """
    try:
        content = await audio.read()
        
        # Save temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            client = Groq() # Picks up GROQ_API_KEY from environment
            
            prompt = """
This is an MBA Business Analytics job interview.

Possible terms include:
Python
SQL
Power BI
Tableau
Snowflake
Machine Learning
Customer Churn
Customer Lifetime Value
Revenue
EBITDA
ROI
NPV
IRR
Accenture Strategy
HSBC
Tata Capital
Swiggy
Business Analytics
"""
            
            with open(tmp_path, "rb") as file:
                transcription = client.audio.transcriptions.create(
                    file=(audio.filename or "audio.webm", file.read()),
                    model="whisper-large-v3-turbo",
                    prompt=prompt,
                    response_format="json",
                    language="en",
                    temperature=0.0
                )
            
            transcript_text = transcription.text
            return {"transcript": transcript_text}
            
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
    except Exception as e:
        print(f"Error in /interviews/transcribe: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
