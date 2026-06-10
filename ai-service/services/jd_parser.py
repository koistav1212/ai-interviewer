import os
import json
import fitz  # PyMuPDF
from groq import Groq

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts plain text from PDF file path using PyMuPDF (fitz).
    """
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        print(f"Error extracting PDF text: {str(e)}")
        raise e

def parse_jd_with_groq(jd_text: str) -> dict:
    """
    Uses Groq Chat Completions API with JSON mode to extract structured JD fields.
    Falls back to a structured placeholder response if GROQ_API_KEY is not set.
    """
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    # If the API key is placeholder or empty, fallback to mock response matching the schema
    if not api_key or api_key == "your_groq_api_key_here":
        print("⚠️ GROQ_API_KEY is not set or using placeholder. Returning mock parsed JD data.")
        return get_mock_jd_extraction(jd_text)

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
        return extracted_data
    except Exception as e:
        print(f"Error during Groq extraction: {str(e)}")
        # Graceful fallback on error
        return get_mock_jd_extraction(jd_text)

def get_mock_jd_extraction(jd_text: str) -> dict:
    """
    Returns default object with mock/heuristic details if Groq is missing.
    """
    lower_text = jd_text.lower()
    
    data = {
        "companyName": None,
        "title": None,
        "department": None,
        "location": None,
        "salaryRange": None,
        "vacancies": None,
        "experience": None,
        "employmentType": None,
        "description": None,
        "requirements": None,
        "benefits": [],
        "skills": [],
        "seniority": None,
        "responsibilities": []
    }

    # Populate basic heuristics for testing
    if "google" in lower_text:
        data["companyName"] = "Google"
    
    # Title heuristics
    if "data analyst" in lower_text:
        data["title"] = "Data Analyst"
        data["department"] = "Analytics"
        data["skills"] = ["SQL", "Python", "Data Visualization"]
        data["description"] = "A role focused on interpreting and analyzing complex datasets."
        data["requirements"] = "Strong proficiency in database queries and spreadsheet software."
        data["benefits"] = ["Health Insurance", "Retirement Plan"]
        data["responsibilities"] = ["Analyze raw data", "Design dashboard metrics", "Draft regular reporting updates"]
    elif "react" in lower_text or "frontend" in lower_text:
        data["title"] = "React Frontend Engineer"
        data["department"] = "Engineering"
        data["skills"] = ["React", "JavaScript", "HTML/CSS"]
        data["description"] = "A front-end development position building interactive web views."
        data["requirements"] = "Deep knowledge of React hooks and modern browser APIs."
        data["benefits"] = ["Remote work allowance", "Wellness stipend"]
        data["responsibilities"] = ["Develop UI modules", "Optimize state performance", "Collaborate on UI design plans"]
    else:
        data["title"] = "Software Engineer"
        data["description"] = "A general software development role."
        data["skills"] = ["Software Engineering"]

    # Experience heuristic (only if explicitly mentioned)
    if "years" in lower_text:
        import re
        match = re.search(r'(\d+[-–]\d+|\d+\+?)\s*years?', lower_text)
        if match:
            data["experience"] = f"{match.group(1)} Years"

    return data
