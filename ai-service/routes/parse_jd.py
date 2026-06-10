import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.jd_parser import extract_text_from_pdf, parse_jd_with_groq, generate_job_intelligence

router = APIRouter()

# Directory for file uploads
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/parse-jd")
async def parse_jd(file: UploadFile = File(...)):
    """
    Saves the uploaded PDF, extracts text, calls Groq parser,
    cleans up the file, and returns structured job details + intelligence.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only PDF files are supported."
        )

    # 1. Save uploaded file to uploads/ directory
    temp_file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. Extract text from the saved PDF
        print(f"📄 Extracting text from local PDF: {temp_file_path}")
        jd_text = extract_text_from_pdf(temp_file_path)

        if not jd_text.strip():
            raise HTTPException(
                status_code=400,
                detail="PDF appears to be empty or contains no extractable text."
            )

        # 3. Perform Groq structured extraction
        print("🤖 Running structured extraction via Groq...")
        structured_data = parse_jd_with_groq(jd_text)
        
        # Add raw text snippet for RAG purposes
        structured_data["rawText"] = jd_text[:15000]

        # 4. Generate Job Intelligence
        print("🤖 Running job intelligence extraction...")
        job_intelligence = generate_job_intelligence(structured_data)

        return {
            "message": "JD parsed successfully",
            "parsedJD": structured_data,
            "jobIntelligence": job_intelligence
        }
    except Exception as e:
        print(f"❌ Failed to parse JD: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while parsing the Job Description: {str(e)}"
        )
    finally:
        # 4. Clean up the uploaded file to prevent disk fill-up
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
