import os
import json
from groq import Groq
from models.candidate_schema import CandidateIntelligenceOutput

def analyze_candidate_with_groq(candidate_name: str, resume_text: str, github_results: str, linkedin_results: str) -> dict:
    """
    Uses Groq Chat Completions API with JSON mode to analyze candidate footprints and resume.
    Validates output with Pydantic and returns a verified dictionary.
    """
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    if not api_key or api_key == "your_groq_api_key_here":
        raise Exception("GROQ_API_KEY is not set. Cannot perform candidate footprint analysis.")

    try:
        # Load prompt template
        prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "candidate_research_prompt.txt")
        with open(prompt_path, "r", encoding="utf-8") as f:
            prompt_template = f.read()

        prompt = prompt_template.replace("{candidate_name}", candidate_name)\
                                 .replace("{resume_text}", resume_text)\
                                 .replace("{github_results}", github_results)\
                                 .replace("{linkedin_results}", linkedin_results)
        
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            messages=[
                {"role": "user", "content": prompt}
            ],
            model=model,
            response_format={"type": "json_object"},
            temperature=0.0
        )
        
        # Parse output JSON
        extracted_data = json.loads(response.choices[0].message.content)
        
        # Validate using Pydantic schema
        parsed = CandidateIntelligenceOutput(**extracted_data)
        
        return parsed.model_dump()
    except Exception as e:
        print(f"Error during Groq candidate research: {str(e)}")
        raise Exception(f"Groq candidate research failed: {str(e)}")
