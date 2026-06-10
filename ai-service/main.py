import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import the routers
from routes.parse_jd import router as parse_jd_router
from routes.parse_resume import router as parse_resume_router

app = FastAPI(
    title="TalentIQ AI Service",
    description="Python FastAPI service handling PDF parsing and LLM structured extraction",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routes
app.include_router(parse_jd_router)
app.include_router(parse_resume_router)

@app.get("/health")
def health_check():
    """
    Simple health check endpoint.
    """
    return {
        "status": "OK",
        "service": "TalentIQ AI Service",
        "groq_configured": bool(os.getenv("GROQ_API_KEY") and os.getenv("GROQ_API_KEY") != "your_groq_api_key_here")
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8002))
    print(f"🚀 Launching TalentIQ AI Service on port {port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
