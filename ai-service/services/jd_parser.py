import os
import json
import fitz  # PyMuPDF
from groq import Groq
from models.jd_schema import ParsedJD

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text page-by-page from the PDF using PyMuPDF.
    """
    try:
        doc = fitz.open(file_path)
        pages = []
        for page in doc:
            pages.append(page.get_text("text"))
        return "\n".join(pages)
    except Exception as e:
        print(f"Error extracting PDF text: {str(e)}")
        raise e

def parse_jd_with_groq(jd_text: str) -> dict:
    """
    Uses Groq Chat Completions API with JSON mode to extract structured JD fields.
    Validates output with Pydantic and returns a verified dictionary.
    """
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    if not api_key or api_key == "your_groq_api_key_here":
        raise Exception("GROQ_API_KEY is not set. Cannot perform structured extraction.")

    try:
        # Load prompt template from prompts/jd_prompt.txt
        prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "jd_prompt.txt")
        with open(prompt_path, "r", encoding="utf-8") as f:
            prompt_template = f.read()

        prompt = prompt_template.replace("{jd_text}", jd_text)
        
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
        parsed = ParsedJD(**extracted_data)
        
        return parsed.model_dump()
    except Exception as e:
        print(f"Error during Groq extraction: {str(e)}")
        raise Exception(f"Groq extraction failed: {str(e)}")

def generate_job_intelligence(parsed_jd: dict) -> dict:
    """
    Runs a second LLM prompt to generate recruitment intelligence (difficulty, domain, technicalTopics, behavioralTopics).
    """
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    if not api_key or api_key == "your_groq_api_key_here":
        raise Exception("GROQ_API_KEY is not set. Cannot generate job intelligence.")

    try:
        # Load prompt template from prompts/intelligence_prompt.txt
        prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "intelligence_prompt.txt")
        with open(prompt_path, "r", encoding="utf-8") as f:
            prompt_template = f.read()

        # Remove rawText from parsed_jd for intelligence generation to prevent prompt bloat if large
        jd_copy = parsed_jd.copy()
        if "rawText" in jd_copy:
            del jd_copy["rawText"]

        parsed_jd_json = json.dumps(jd_copy, indent=2)
        prompt = prompt_template.replace("{parsed_jd_json}", parsed_jd_json)

        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            messages=[
                {"role": "user", "content": prompt}
            ],
            model=model,
            response_format={"type": "json_object"},
            temperature=0.0
        )
        
        intelligence_data = json.loads(response.choices[0].message.content)
        
        # Ensure correct keys exist in intelligence_data
        result = {
            "difficulty": intelligence_data.get("difficulty", "Medium"),
            "domain": intelligence_data.get("domain", "Technology"),
            "technicalTopics": intelligence_data.get("technicalTopics", []),
            "behavioralTopics": intelligence_data.get("behavioralTopics", [])
        }
        
        # Ensure list type compatibility
        if not isinstance(result["technicalTopics"], list):
            result["technicalTopics"] = []
        if not isinstance(result["behavioralTopics"], list):
            result["behavioralTopics"] = []
            
        return result
    except Exception as e:
        print(f"Error during job intelligence extraction: {str(e)}")
        raise Exception(f"Intelligence generation failed: {str(e)}")
