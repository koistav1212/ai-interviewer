import os
import json
from typing import TypedDict, List, Dict, Any, Optional
from groq import Groq
from langgraph.graph import StateGraph, START, END

# Define state schema
class InterviewState(TypedDict):
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
    scores: List[Dict[str, float]]
    difficulty: str  # "easy" | "medium" | "hard"
    questionCount: int
    recommendation: Optional[str]
    completed: bool

# Load Prompt Helper
def load_prompt_template(filename: str) -> str:
    prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", filename)
    with open(prompt_path, "r", encoding="utf-8") as f:
        return f.read()

# Agent 1: Question Generator Node
def generate_question_node(state: InterviewState) -> dict:
    print("🤖 Running Question Generator Agent...")
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    # Format the prompt
    template = load_prompt_template("question_prompt.txt")
    prompt = template.replace("{resume_context}", state.get("resumeContext", "N/A")) \
                     .replace("{job_context}", state.get("jobContext", "N/A")) \
                     .replace("{company_context}", state.get("companyContext", "N/A")) \
                     .replace("{asked_questions}", json.dumps(state.get("askedQuestions", []), indent=2)) \
                     .replace("{covered_topics}", json.dumps(state.get("coveredTopics", []), indent=2)) \
                     .replace("{difficulty}", state.get("difficulty", "medium"))
    
    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model=model,
        response_format={"type": "json_object"},
        temperature=0.7
    )
    
    result = json.loads(response.choices[0].message.content)
    question = result.get("question", "")
    topic = result.get("topic", "General")
    
    # Update askedQuestions, coveredTopics, currentQuestion and count
    asked = list(state.get("askedQuestions", []))
    asked.append(question)
    
    covered = list(state.get("coveredTopics", []))
    if topic and topic not in covered:
        covered.append(topic)
        
    return {
        "currentQuestion": question,
        "askedQuestions": asked,
        "coveredTopics": covered,
        "questionCount": state.get("questionCount", 0) + 1
    }

# Agent 2: Answer Evaluator Node
def evaluate_answer_node(state: InterviewState) -> dict:
    print("🤖 Running Answer Evaluator Agent...")
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    question = state.get("currentQuestion", "")
    answer = state.get("currentAnswer", "")
    
    template = load_prompt_template("eval_prompt.txt")
    prompt = template.replace("{question}", question).replace("{answer}", answer)
    
    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model=model,
        response_format={"type": "json_object"},
        temperature=0.1
    )
    
    eval_result = json.loads(response.choices[0].message.content)
    
    # Extract scores and wrap them
    score_entry = {
        "technical": float(eval_result.get("technical", 70)),
        "communication": float(eval_result.get("communication", 70)),
        "depth": float(eval_result.get("depth", 70)),
        "overall": float(eval_result.get("overall", 70)),
        "feedback": eval_result.get("strengths", []) + eval_result.get("weaknesses", [])
    }
    
    scores = list(state.get("scores", []))
    scores.append(score_entry)
    
    return {
        "scores": scores
    }

# Agent 3: Coverage Agent (Pure Code Node)
def coverage_node(state: InterviewState) -> dict:
    print("💻 Running Coverage Agent (Code-only)...")
    required = [s.lower() for s in state.get("requiredSkills", [])]
    covered = [t.lower() for t in state.get("coveredTopics", [])]
    
    # Find matching required skills that have been covered in topics
    matched = [s for s in required if any(s in c or c in s for c in covered)]
    
    # Calculate coverage
    coverage_percentage = int((len(matched) / len(required)) * 100) if required else 100
    
    print(f"Coverage: {coverage_percentage}% (Required: {required}, Covered: {covered})")
    
    # We can use coveredTopics list to dynamically save the list
    return {
        # Keep list of covered topics as is
        "coveredTopics": state.get("coveredTopics", [])
    }

# Agent 4: Difficulty Agent Node
def adjust_difficulty_node(state: InterviewState) -> dict:
    print("🤖 Running Difficulty Controller Agent...")
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    scores = state.get("scores", [])
    current_difficulty = state.get("difficulty", "medium")
    question_count = state.get("questionCount", 0)
    
    # Calculate averages
    avg_technical = sum(s.get("technical", 70.0) for s in scores) / len(scores) if scores else 70.0
    avg_depth = sum(s.get("depth", 70.0) for s in scores) / len(scores) if scores else 70.0
    
    template = load_prompt_template("difficulty_prompt.txt")
    prompt = template.replace("{avg_technical}", str(avg_technical)) \
                     .replace("{avg_depth}", str(avg_depth)) \
                     .replace("{current_difficulty}", current_difficulty) \
                     .replace("{question_count}", str(question_count))
    
    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model=model,
        response_format={"type": "json_object"},
        temperature=0.0
    )
    
    result = json.loads(response.choices[0].message.content)
    new_difficulty = result.get("difficulty", current_difficulty).lower()
    
    # Validation against schema constraint
    if new_difficulty not in ["easy", "medium", "hard"]:
        new_difficulty = current_difficulty
        
    print(f"Adjusted Difficulty from {current_difficulty} to {new_difficulty} (Reason: {result.get('reason')})")
    
    return {
        "difficulty": new_difficulty
    }

# Router Node
def router(state: InterviewState) -> str:
    if len(state.get("askedQuestions", [])) == 0:
        return "retrieve_context"
    else:
        return "evaluate_answer"

# Difficulty Checker to loop or terminate
def check_limit_router(state: InterviewState) -> str:
    # Terminate after 5 questions
    if state.get("questionCount", 0) >= 5:
        return "end_interview"
    else:
        return "generate_question"

# End Node
def end_interview_node(state: InterviewState) -> dict:
    print("🏁 Ending Interview Session...")
    return {
        "completed": True,
        "currentQuestion": ""
    }

# Retrieve Context Node
def retrieve_context_node(state: InterviewState) -> dict:
    print("📂 Running Retrieve Context Node...")
    return {
        "resumeContext": state.get("resumeContext", ""),
        "jobContext": state.get("jobContext", ""),
        "companyContext": state.get("companyContext", "")
    }

# Define the StateGraph Workflow
workflow = StateGraph(InterviewState)

# Add Nodes
workflow.add_node("retrieve_context", retrieve_context_node)
workflow.add_node("generate_question", generate_question_node)
workflow.add_node("evaluate_answer", evaluate_answer_node)
workflow.add_node("update_coverage", coverage_node)
workflow.add_node("adjust_difficulty", adjust_difficulty_node)
workflow.add_node("end_interview", end_interview_node)

# Add Edges with routing
workflow.set_conditional_entry_point(
    router,
    {
        "retrieve_context": "retrieve_context",
        "evaluate_answer": "evaluate_answer"
    }
)

workflow.add_edge("retrieve_context", "generate_question")
workflow.add_edge("generate_question", END)

workflow.add_edge("evaluate_answer", "update_coverage")
workflow.add_edge("update_coverage", "adjust_difficulty")

workflow.add_conditional_edges(
    "adjust_difficulty",
    check_limit_router,
    {
        "generate_question": "generate_question",
        "end_interview": "end_interview"
    }
)
workflow.add_edge("end_interview", END)

# Compile Graph
interview_graph = workflow.compile()

# Node 5/Agent 5: Interview Report Generator Node
def generate_interview_report(state: InterviewState) -> dict:
    print("🤖 Running Report Generator Agent...")
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    # Build transcript
    transcript = []
    asked = state.get("askedQuestions", [])
    answers = state.get("currentAnswer", "") # Note: final answer is evaluated, but transcript has historical ones.
    scores = state.get("scores", [])
    
    transcript_text = ""
    for idx, question in enumerate(asked):
        score_info = scores[idx] if idx < len(scores) else {}
        transcript_text += f"\nRound {idx + 1}:\n"
        transcript_text += f"Q: {question}\n"
        transcript_text += f"Scores: Technical={score_info.get('technical')}, Depth={score_info.get('depth')}, Communication={score_info.get('communication')}\n"
        transcript_text += f"Feedback: {', '.join(score_info.get('feedback', []))}\n"
        
    template = load_prompt_template("report_prompt.txt")
    prompt = template.replace("{resume_context}", state.get("resumeContext", "N/A")) \
                     .replace("{job_context}", state.get("jobContext", "N/A")) \
                     .replace("{transcript_and_scores}", transcript_text) \
                     .replace("{covered_topics}", ", ".join(state.get("coveredTopics", [])))
    
    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model=model,
        response_format={"type": "json_object"},
        temperature=0.2
    )
    
    return json.loads(response.choices[0].message.content)
