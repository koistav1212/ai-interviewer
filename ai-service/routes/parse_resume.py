import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.jd_parser import extract_text_from_pdf
from services.resume_parser import parse_resume_with_groq

router = APIRouter()

# Directory for file uploads
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    """
    Saves the uploaded resume PDF, extracts text, calls Groq resume parser,
    cleans up the file, and returns structured resume details.
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

        # 2. Extract text from the saved PDF using PyMuPDF (fitz)
        print(f"📄 Extracting text from local Resume PDF: {temp_file_path}")
        resume_text = extract_text_from_pdf(temp_file_path)

        if not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Resume PDF appears to be empty or contains no extractable text."
            )

        # 3. Perform Groq structured resume extraction
        print("🤖 Running resume extraction via Groq Llama...")
        parsed_data = parse_resume_with_groq(resume_text)

        return {
            "message": "Resume parsed successfully",
            "parsedResume": parsed_data,
            "rawText": resume_text
        }
    except Exception as e:
        print(f"❌ Failed to parse resume: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while parsing the resume: {str(e)}"
        )
    finally:
        # 4. Clean up the uploaded file to prevent disk fill-up
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
