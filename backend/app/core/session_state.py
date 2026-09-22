from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime

class Story(BaseModel):
    id: str
    title: str
    description: str
    type: str  # "FRONTEND" or "BACKEND"
    story_points: int  # Fibonacci: 1, 2, 3, 5, 8
    status: str = "PLANNING"  # PLANNING, IN_DEV, QA_PENDING, QA_FAILED, QA_PASSED, GOV_BLOCKED, COMPLETED
    code: Optional[str] = None
    tests: Optional[str] = None
    qa_report: Optional[Dict[str, Any]] = None
    qa_attempts: int = 0
    gov_report: Optional[Dict[str, Any]] = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    completed_at: Optional[str] = None

class SessionState(BaseModel):
    epic_desc: str
    governance_mode: str = "STRICT"  # "OFF", "BASIC", "STRICT"
    stories: List[Story] = []
    events: List[Dict[str, Any]] = []
    start_time: float = 0.0
    end_time: Optional[float] = None
    total_tokens: int = 0
    current_agent: str = "Idle"
    current_story_id: Optional[str] = None
