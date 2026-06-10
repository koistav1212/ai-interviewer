import os
import json
from groq import Groq
from models.resume_schema import ParsedResume

def parse_resume_with_groq(resume_text: str) -> dict:
    """
    Uses Groq Chat Completions API with JSON mode to extract structured resume fields.
    Validates output with Pydantic and returns a verified dictionary.
    """
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    if not api_key or api_key == "your_groq_api_key_here":
        raise Exception("GROQ_API_KEY is not set. Cannot perform structured resume extraction.")

    try:
        # Load prompt template from prompts/resume_prompt.txt
        prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "resume_prompt.txt")
        with open(prompt_path, "r", encoding="utf-8") as f:
            prompt_template = f.read()

        prompt = prompt_template.replace("{resume_text}", resume_text)
        
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
        parsed = ParsedResume(**extracted_data)
        
        return parsed.model_dump()
    except Exception as e:
        print(f"Error during Groq resume extraction: {str(e)}")
        raise Exception(f"Groq resume extraction failed: {str(e)}")
