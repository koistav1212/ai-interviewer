import os
import json
from typing import TypedDict, List, Dict, Any, Optional
from groq import Groq
from qdrant_client import QdrantClient
from qdrant_client.http import models
from langgraph.graph import StateGraph, START, END
from fastembed import TextEmbedding

try:
    embedding_model = TextEmbedding("BAAI/bge-small-en-v1.5")
except Exception as e:
    print("Failed to load embedding model:", e)
    embedding_model = None
import datetime
import random
class InterviewState(TypedDict):
    sessionId: str
    candidateId: str
    jobId: str
    
    # Level 1 Memory
    candidate_profile: dict
    resume_entities: dict
    jd_profile: dict
    interview_blueprint: dict
    company_profile: dict
    industry_profile: dict
    
    # Level 3 Memory
    current_question: str
    current_answer: str
    claims: list
    weaknesses: list
    technologies: list
    covered_topics: list
    uncovered_topics: list
    follow_up_depth: int
    
    # Internal Tracking
    askedQuestions: list
    answers: list
    scores: list
    difficulty: str
    questionCount: int
    completed: bool
    next_step: Optional[str]
    
    # Report metrics
    technicalScore: Optional[float]
    communicationScore: Optional[float]
    overallScore: Optional[float]
    coverage: Optional[float]
    strengths: Optional[list]
    feedback: Optional[str]

    # Temporary context
    question_plan: dict
    retrieved_context: str
    
    # Tracing
    turn_number: int
    current_trace: dict
    traces: list
    question_sources: list

def get_groq_client():
    return Groq(api_key=os.getenv("GROQ_API_KEY"))

def print_trace(trace_id: str, message: str, data: Any = None):
    print(f"\n[TRACE: {trace_id}] {message}")
    if data:
        if isinstance(data, dict) or isinstance(data, list):
            print(json.dumps(data, indent=2))
        else:
            print(data)
    print("=" * 48)

def evaluate_answer_node(state: InterviewState) -> dict:
    turn_number = state.get("turn_number", 0) + 1
    session_id = state.get("sessionId", "unknown_session")
    trace_id = f"trace_{session_id}_turn_{turn_number:02d}"
    
    current_trace = {
        "traceId": trace_id,
        "interviewId": session_id,
        "questionId": f"q_{turn_number:02d}",
        "turnNumber": turn_number,
        "candidateContext": state.get("candidate_profile", {}),
        "jobContext": state.get("jd_profile", {}),
        "companyContext": state.get("company_profile", {}),
        "previousQuestion": state.get("current_question", ""),
        "candidateAnswer": state.get("current_answer", ""),
        "agents": {},
        "retrieval": {},
        "finalContext": {},
        "generatedQuestion": {},
        "evaluation": {}
    }
    
    print_trace(trace_id, "Starting Answer Evaluator")
    
    if not state.get("current_answer"):
        current_trace["agents"]["answerEvaluator"] = {"status": "skipped"}
        return {"next_step": "decision_agent", "turn_number": turn_number, "current_trace": current_trace}
        
    client = get_groq_client()
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    question = state.get("current_question", "")
    answer = state.get("current_answer", "")
    
    prompt = f"""
    Evaluate the candidate's answer.
    Question: {question}
    Answer: {answer}
    
    Return a JSON object with:
    - technical (0-100)
    - communication (0-100)
    - depth (0-100)
    - overall (0-100)
    - strengths: list of strings
    - weaknesses: list of strings
    - concepts_detected: list of strings
    - claims_detected: list of dicts {{"claim": "...", "concept": "...", "type": "methodology|technical_method|experience"}}
    - missing_depth: list of strings
    - possible_followups: list of strings
    """
    
    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=model,
            response_format={"type": "json_object"},
            temperature=0.1
        )
        eval_result = json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error evaluating answer: {e}")
        eval_result = {}
        
    current_trace["agents"]["answerEvaluator"] = eval_result
    
    print_trace(trace_id, "ANSWER EVALUATOR AGENT", {
        "INPUT QUESTION": question,
        "CANDIDATE ANSWER": answer,
        "EXTRACTED CONCEPTS": eval_result.get("concepts_detected", []),
        "CLAIMS": eval_result.get("claims_detected", []),
        "AGENT OUTPUT": eval_result
    })

    scores = list(state.get("scores", []))
    score_entry = {
        "technical": float(eval_result.get("technical", 70)),
        "communication": float(eval_result.get("communication", 70)),
        "depth": float(eval_result.get("depth", 70)),
        "overall": float(eval_result.get("overall", 70)),
        "feedback": eval_result.get("weaknesses", [])
    }
    scores.append(score_entry)
    
    claims = [c.get("claim") for c in eval_result.get("claims_detected", []) if isinstance(c, dict)]
    
    return {
        "scores": scores,
        "claims": claims,
        "weaknesses": eval_result.get("weaknesses", []),
        "technologies": eval_result.get("concepts_detected", []),
        "turn_number": turn_number,
        "current_trace": current_trace
    }

def decision_agent_node(state: InterviewState) -> dict:
    current_trace = state.get("current_trace", {})
    trace_id = current_trace.get("traceId", "unknown_trace")
    print_trace(trace_id, "Running Follow-up Decision Agent")
    
    asked = state.get("askedQuestions", [])
    scores = state.get("scores", [])
    
    if state.get("completed"):
        return {"next_step": "generate_report"}
        
    if len(asked) >= 5:
        if not state.get("current_answer") or len(scores) >= len(asked):
            return {"next_step": "generate_report"}

    client = get_groq_client()
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    eval_result = current_trace.get("agents", {}).get("answerEvaluator", {})
    depth = state.get("follow_up_depth", 0)
    
    prompt = f"""
    You are the Follow-up Decision Agent.
    Based on the answer evaluation, decide if a follow-up is needed.
    Answer Evaluation: {json.dumps(eval_result)}
    Current follow up depth: {depth} (Max is 2)
    
    Return a JSON object with:
    - should_follow_up (boolean)
    - reason (string: explicit explanation WHY)
    - target_claim (string or null)
    - target_concept (string or null)
    - knowledge_gap (string or null)
    - follow_up_type (clarification|claim_validation|technical_depth|methodology|model_selection|tradeoff|implementation|metric_validation|business_impact|contradiction|example_request)
    - priority (float 0-1)
    """
    
    try:
        if depth >= 2:
            decision = {"should_follow_up": False, "reason": "Max depth reached", "priority": 0.0}
        else:
            response = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=model,
                response_format={"type": "json_object"},
                temperature=0.1
            )
            decision = json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error making decision: {e}")
        decision = {"should_follow_up": False, "reason": "Error", "priority": 0.0}
        
    current_trace["agents"]["followUpDecision"] = decision
    print_trace(trace_id, "FOLLOW-UP DECISION TRACE", decision)
    
    new_depth = depth + 1 if decision.get("should_follow_up") else 0

    return {
        "next_step": "question_planner",
        "follow_up_depth": new_depth,
        "current_trace": current_trace
    }

def question_planner_node(state: InterviewState) -> dict:
    current_trace = state.get("current_trace", {})
    trace_id = current_trace.get("traceId", "unknown_trace")
    print_trace(trace_id, "Running Question Planner Agent")
    
    client = get_groq_client()
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    decision = current_trace.get("agents", {}).get("followUpDecision", {})
    
    prompt = f"""
    You are the Question Planner Agent.
    Blueprint: {json.dumps(state.get("interview_blueprint", {}))}
    Follow-up Decision: {json.dumps(decision)}
    
    Determine the next question parameters. Return JSON:
    {{
      "selected_question_type": "string",
      "selected_topic": "string",
      "source_of_topic": ["list of sources (e.g. candidate_answer, resume_skill, jd_requirement)"],
      "trigger": "string reasoning",
      "competency": "string",
      "difficulty": "medium",
      "follow_up_depth": {state.get("follow_up_depth", 0)},
      "priority_score": 0.9,
      "alternative_topics_considered": [{{"topic": "...", "score": 0.0}}]
    }}
    """
    
    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=model,
            response_format={"type": "json_object"},
            temperature=0.1
        )
        plan = json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error planning question: {e}")
        plan = {
            "selected_question_type": "technical",
            "selected_topic": "general",
            "source_of_topic": ["fallback"],
            "trigger": "error fallback",
            "competency": "general",
            "difficulty": "medium",
            "follow_up_depth": 0,
            "priority_score": 0.5,
            "alternative_topics_considered": []
        }
        
    current_trace["agents"]["questionPlanner"] = plan
    print_trace(trace_id, "QUESTION PLANNER TRACE", plan)
        
    return {
        "question_plan": plan,
        "current_trace": current_trace
    }

OPENING_WEIGHTS = {
    "introduction": 0.18,
    "resume_walkthrough": 0.18,
    "best_project": 0.18,
    "tech_stack": 0.14,
    "company_knowledge": 0.10,
    "career_transition": 0.10,
    "role_interest": 0.07,
    "recent_experience": 0.03,
    "industry_interest": 0.02
}

def opening_question_selector_node(state: InterviewState) -> dict:
    turn_number = state.get("turn_number", 0) + 1
    session_id = state.get("sessionId", "unknown_session")
    trace_id = f"trace_{session_id}_turn_{turn_number:02d}"
    
    current_trace = {
        "traceId": trace_id,
        "interviewId": session_id,
        "questionId": f"q_{turn_number:02d}",
        "turnNumber": turn_number,
        "candidateContext": state.get("candidate_profile", {}),
        "jobContext": state.get("jd_profile", {}),
        "companyContext": state.get("company_profile", {}),
        "previousQuestion": "",
        "candidateAnswer": "",
        "agents": {},
        "retrieval": {},
        "finalContext": {},
        "generatedQuestion": {},
        "evaluation": {}
    }
    
    print_trace(trace_id, "INTERVIEW INITIALIZATION", {
        "Interview ID": session_id,
        "Candidate ID": state.get("candidateId"),
        "Job ID": state.get("jobId"),
        "RESUME SUMMARY": state.get("resume_entities"),
        "JD REQUIREMENTS": state.get("jd_profile"),
        "COMPANY KNOWLEDGE": state.get("company_profile"),
        "INTERVIEW BLUEPRINT": state.get("interview_blueprint")
    })
    
    selected_opening = random.choices(
        list(OPENING_WEIGHTS.keys()),
        weights=list(OPENING_WEIGHTS.values()),
        k=1
    )[0]
    
    plan = {
        "selected_question_type": "opening",
        "selected_topic": selected_opening,
        "source_of_topic": ["interview_start"],
        "trigger": "First turn of interview requires natural opening",
        "competency": "communication",
        "difficulty": "easy",
        "follow_up_depth": 0,
        "priority_score": 1.0,
        "alternative_topics_considered": []
    }
    
    current_trace["agents"]["openingSelector"] = plan
    print_trace(trace_id, "OPENING QUESTION SELECTOR", plan)
    
    return {
        "question_plan": plan,
        "turn_number": turn_number,
        "current_trace": current_trace
    }

def retrieval_router_node(state: InterviewState) -> dict:
    current_trace = state.get("current_trace", {})
    trace_id = current_trace.get("traceId", "unknown_trace")
    print_trace(trace_id, "Running Retrieval Router (Hybrid Search)")
    
    plan = state.get("question_plan", {})
    topic = plan.get("selected_topic", "")
    
    # Generating query for retrieval
    client = get_groq_client()
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    query_prompt = f"Given the planned topic: '{topic}', generate a search query and filters for a vector database to find relevant interview context. Return JSON: {{\"retrieve\": true, \"why\": \"...\", \"search_query\": \"...\", \"filters\": {{\"content_type\": \"technical_knowledge\"}}}}"
    
    try:
        query_res = client.chat.completions.create(
            messages=[{"role": "user", "content": query_prompt}],
            model=model,
            response_format={"type": "json_object"},
            temperature=0.1
        )
        retrieval_decision = json.loads(query_res.choices[0].message.content)
    except:
        retrieval_decision = {"retrieve": True, "why": "default", "search_query": topic, "filters": {}}
    
    retrieval_log = {
        "PLANNED TOPIC": topic,
        "QUESTION TYPE": plan.get("selected_question_type"),
        "RETRIEVAL DECISION": retrieval_decision.get("retrieve"),
        "WHY": retrieval_decision.get("why"),
        "SEARCH QUERY": retrieval_decision.get("search_query"),
        "SOURCE FILTERS": retrieval_decision.get("filters"),
        "SEARCH MODE": "dense_vector_search"
    }
    
    RETRIEVAL_MAP = {
        "resume_based": ["resume_knowledge"],
        "project": ["resume_knowledge"],
        "experience": ["resume_knowledge"],
        "technical": ["resume_knowledge", "technical_knowledge"],
        "industry": ["company_knowledge", "industry_knowledge"],
        "company": ["company_knowledge"],
        "business_case": ["technical_knowledge", "industry_knowledge"]
    }
    
    target_collections = RETRIEVAL_MAP.get(plan.get("selected_question_type"), ["resume_knowledge", "job_knowledge"])
    
    # Override source filters with the accurate mapping
    retrieval_log["TARGET_COLLECTIONS"] = target_collections
    print_trace(trace_id, "RETRIEVAL ROUTER", retrieval_log)
    
    results_log = []
    retrieved_text = "No context available."
    
    try:
        qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        qdrant_api_key = os.getenv("QDRANT_API_KEY")
        
        if qdrant_api_key and embedding_model:
            q_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
            
            search_query = retrieval_decision.get("search_query") or topic
            query_vector = list(embedding_model.embed([search_query]))[0].tolist()
            
            retrieved_results = []
            for coll in target_collections:
                try:
                    if coll == "resume_knowledge":
                        filter_criteria = models.Filter(
                            must=[
                                models.FieldCondition(key="candidateId", match=models.MatchValue(value=state.get("candidateId"))),
                                models.FieldCondition(key="content_type", match=models.MatchValue(value="resume_knowledge"))
                            ]
                        )
                    else:
                        filter_criteria = models.Filter(
                            must=[models.FieldCondition(key="content_type", match=models.MatchValue(value=coll))]
                        )
                        
                    hits = q_client.search(
                        collection_name=coll,
                        query_vector=("", query_vector),
                        query_filter=filter_criteria,
                        limit=3
                    )
                    
                    for hit in hits:
                        payload = hit.payload or {}
                        retrieved_results.append({
                            "collection": coll,
                            "score": hit.score,
                            "section": payload.get("section", "unknown"),
                            "topic": payload.get("topic", "unknown"),
                            "text": payload.get("text", "")
                        })
                except Exception as ex:
                    print(f"Error querying {coll}: {ex}")
            
            if retrieved_results:
                retrieved_text = json.dumps(retrieved_results, indent=2)
                results_log = retrieved_results
            else:
                retrieved_text = "No context available (no matches found)."
                results_log.append({"info": "No results found in Qdrant"})
        else:
            retrieved_text = "Skipped retrieval due to missing Qdrant config or embedding model."
            results_log.append({"error": "No Qdrant config or missing embedding model"})
    except Exception as e:
        print(f"Qdrant retrieval error: {e}")
        retrieved_text = "Error retrieving context."
        results_log.append({"error": str(e)})
        
    print_trace(trace_id, "TOP RETRIEVAL RESULTS", results_log)
    
    current_trace["retrieval"] = {
        "queries": [retrieval_decision.get("search_query")],
        "filters": target_collections,
        "searchType": "dense_vector_search",
        "results": results_log
    }
        
    return {
        "retrieved_context": retrieved_text,
        "current_trace": current_trace
    }

def generate_question_node(state: InterviewState) -> dict:
    current_trace = state.get("current_trace", {})
    trace_id = current_trace.get("traceId", "unknown_trace")
    print_trace(trace_id, "Running Question Generator Agent")
    
    client = get_groq_client()
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    plan = state.get("question_plan", {})
    
    final_context = {
        "role": {"value": state.get("interview_blueprint", {}).get("role", "Unknown"), "source": "job_description"},
        "candidate_skills": {"value": state.get("resume_entities", {}).get("skills", []), "source": "resume"},
        "previous_answer_context": {"value": current_trace.get("agents", {}).get("answerEvaluator", {}), "source": "candidate_answer"},
        "retrieved_knowledge": {"value": state.get("retrieved_context"), "source": "qdrant"},
        "question_plan": {"value": plan, "source": "question_planner"}
    }
    
    current_trace["finalContext"] = final_context
    print_trace(trace_id, "FINAL LLM CONTEXT", final_context)
    
    prompt = f"""
    Generate an interview question based on the final context.
    Context: {json.dumps(final_context)}
    
    Return JSON: {{"question": "the actual question text"}}
    """
    
    if os.getenv("DEBUG_AI_TRACE") == "true":
        print_trace(trace_id, "QUESTION GENERATOR - FINAL PROMPT", {
            "SYSTEM PROMPT": "You are an expert interviewer.",
            "USER CONTEXT": prompt,
            "Estimated input tokens": len(prompt) // 4
        })
    
    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an expert interviewer."},
                {"role": "user", "content": prompt}
            ],
            model=model,
            response_format={"type": "json_object"},
            temperature=0.7
        )
        result = json.loads(response.choices[0].message.content)
        question = result.get("question", "")
    except:
        question = "Could you tell me more about your experience?"
        
    print_trace(trace_id, "GENERATED QUESTION", {
        "GENERATED QUESTION": question,
        "QUESTION TYPE": plan.get("selected_question_type"),
        "PLANNED TOPIC": plan.get("selected_topic")
    })
    
    # Automatic Relevance Evaluator
    eval_prompt = f"""
    Evaluate the relevance of this generated interview question.
    Question: {question}
    Role: {final_context['role']['value']}
    Topic: {plan.get("selected_topic")}
    
    Return JSON:
    {{
      "resume_relevance": 90,
      "jd_relevance": 90,
      "company_relevance": 90,
      "previous_answer_relevance": 90,
      "retrieval_grounding": 90,
      "non_repetition": 90,
      "difficulty_fit": 90,
      "overall_question_quality": 90,
      "relevance_explanation": "..."
    }}
    """
    
    try:
        eval_res = client.chat.completions.create(
            messages=[{"role": "user", "content": eval_prompt}],
            model=model,
            response_format={"type": "json_object"},
            temperature=0.1
        )
        relevance_eval = json.loads(eval_res.choices[0].message.content)
    except:
        relevance_eval = {}
        
    current_trace["evaluation"] = relevance_eval
    print_trace(trace_id, "AUTOMATIC RELEVANCE EVALUATOR", relevance_eval)
    
    current_trace["generatedQuestion"] = {
        "question": question,
        "type": plan.get("selected_question_type"),
        "topic": plan.get("selected_topic")
    }
        
    asked = list(state.get("askedQuestions", []))
    asked.append(question)
    
    traces = list(state.get("traces", []))
    traces.append(current_trace)
    
    sources = list(state.get("question_sources", []))
    sources.append({
        "question": question,
        "source": plan.get("source_of_topic", [])
    })
    
    return {
        "current_question": question,
        "askedQuestions": asked,
        "questionCount": state.get("questionCount", 0) + 1,
        "current_answer": "",
        "current_trace": current_trace,
        "traces": traces,
        "question_sources": sources
    }

def generate_report_node(state: InterviewState) -> dict:
    print("🤖 Running Report Generator Node...")
    return {
        "technicalScore": 85.0,
        "communicationScore": 80.0,
        "overallScore": 82.5,
        "coverage": 90.0,
        "strengths": ["Strong technical", "Good communication"],
        "feedback": "Great candidate."
    }

def end_interview_node(state: InterviewState) -> dict:
    return {"completed": True}

workflow = StateGraph(InterviewState)

workflow.add_node("evaluate_answer", evaluate_answer_node)
workflow.add_node("decision_agent", decision_agent_node)
workflow.add_node("opening_question_selector", opening_question_selector_node)
workflow.add_node("question_planner", question_planner_node)
workflow.add_node("retrieval_router", retrieval_router_node)
workflow.add_node("generate_question", generate_question_node)
workflow.add_node("generate_report", generate_report_node)
workflow.add_node("end_interview", end_interview_node)

def route_start(state: InterviewState) -> str:
    # If no questions have been asked yet, go to opening question selector
    if state.get("questionCount", 0) == 0:
        return "opening_question_selector"
    return "evaluate_answer"

workflow.set_conditional_entry_point(
    route_start,
    {
        "opening_question_selector": "opening_question_selector",
        "evaluate_answer": "evaluate_answer"
    }
)

def route_from_decision(state: InterviewState) -> str:
    return state.get("next_step", "generate_report")

workflow.add_conditional_edges(
    "decision_agent",
    route_from_decision,
    {
        "question_planner": "question_planner",
        "generate_report": "generate_report"
    }
)

workflow.add_edge("evaluate_answer", "decision_agent")
workflow.add_edge("opening_question_selector", "generate_question")
workflow.add_edge("question_planner", "retrieval_router")
workflow.add_edge("retrieval_router", "generate_question")
workflow.add_edge("generate_question", END)
workflow.add_edge("generate_report", "end_interview")
workflow.add_edge("end_interview", END)

interview_graph = workflow.compile()

def generate_interview_report(state: dict) -> dict:
    return generate_report_node(state)
