import os
import json
from groq import Groq
from models.company_schema import CompanyResearchOutput

def analyze_company_with_groq(company_name: str, job_title: str, search_results: str) -> dict:
    """
    Uses Groq Chat Completions API with JSON mode to analyze collected company information.
    Validates output with Pydantic and returns a verified dictionary.
    """
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    if not api_key or api_key == "your_groq_api_key_here":
        raise Exception("GROQ_API_KEY is not set. Cannot perform company intelligence analysis.")

    try:
        # Load prompt template
        prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "company_research_prompt.txt")
        with open(prompt_path, "r", encoding="utf-8") as f:
            prompt_template = f.read()

        prompt = prompt_template.replace("{company_name}", company_name)\
                                 .replace("{job_title}", job_title)\
                                 .replace("{search_results}", search_results)
        
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
        parsed = CompanyResearchOutput(**extracted_data)
        
        return parsed.model_dump()
    except Exception as e:
        print(f"Error during Groq company research: {str(e)}")
        raise Exception(f"Groq company research failed: {str(e)}")
