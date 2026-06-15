import os
import json
from groq import Groq
from models.interview_schema import FirstQuestionResponse

def generate_first_question_with_groq(resume: str, job: str, company: str) -> dict:
    """
    Uses Groq Chat Completions API with JSON mode to generate the first interview question.
    Validates output with Pydantic and returns a verified dictionary.
    """
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    if not api_key or api_key == "your_groq_api_key_here":
        raise Exception("GROQ_API_KEY is not set. Cannot perform LLM generation.")

    try:
        # Load prompt template
        prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "first_question_prompt.txt")
        with open(prompt_path, "r", encoding="utf-8") as f:
            prompt_template = f.read()

        prompt = prompt_template.replace("{resume}", resume)\
                                 .replace("{job}", job)\
                                 .replace("{company}", company)
        
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            messages=[
                {"role": "user", "content": prompt}
            ],
            model=model,
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        # Parse output JSON
        extracted_data = json.loads(response.choices[0].message.content)
        
        # Validate using Pydantic schema
        parsed = FirstQuestionResponse(**extracted_data)
        
        return parsed.model_dump()
    except Exception as e:
        print(f"Error during Groq first question generation: {str(e)}")
        raise Exception(f"Groq generation failed: {str(e)}")
