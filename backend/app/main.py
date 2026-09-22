import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api.routes_workflow import router as workflow_router
from app.api.routes_benchmark import router as benchmark_router

load_dotenv()

app = FastAPI(
    title="Agentic SDLC Governance Laboratory API",
    description="Backend API for multi-agent autonomous SDLC execution, guardrails enforcement, and scientific metrics extraction (AV, SCR, GO).",
    version="2.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workflow_router)
app.include_router(benchmark_router)

@app.get("/")
def read_root():
    return {
        "service": "Agentic SDLC Governance Laboratory",
        "status": "online",
        "framework": "Hub-and-Spoke Multi-Agent Architecture",
        "research": "Governing Agentic AI in SDLC (Muhammad Awais, 2026)"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "success",
        "data": {
            "service": "Agentic SDLC Governance Laboratory",
            "status": "healthy",
            "active_mode": "STRICT",
            "version": "2.0.0"
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
