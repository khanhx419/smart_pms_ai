import asyncio
import json
import os
from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from app.core.coordinator import CoordinatorAgent
from app.core.metrics_logger import MetricsLogger

router = APIRouter(prefix="/api/workflow", tags=["SDLC Workflow"])

class RunWorkflowRequest(BaseModel):
    epic: str = Field(default="Create a user login page with email validation")
    governance_mode: str = Field(default="STRICT", description="OFF, BASIC, or STRICT")

# Event queue for real-time SSE streaming
_event_subscribers: List[asyncio.Queue] = []

def notify_subscribers(event: Dict[str, Any]):
    for q in list(_event_subscribers):
        try:
            q.put_nowait(event)
        except Exception:
            pass

@router.post("/run")
async def run_workflow(payload: RunWorkflowRequest):
    mode = payload.governance_mode.upper()
    if mode not in ["OFF", "BASIC", "STRICT"]:
        raise HTTPException(status_code=400, detail="governance_mode must be OFF, BASIC, or STRICT")

    coordinator = CoordinatorAgent(governance_mode=mode)
    coordinator.register_event_listener(notify_subscribers)

    result = coordinator.run_sdlc_workflow(payload.epic)
    return {
        "status": "success",
        "message": f"SDLC Workflow completed in {mode} mode",
        "data": result
    }

@router.get("/stream")
async def stream_events():
    """SSE endpoint for streaming real-time multi-agent interactions."""
    queue = asyncio.Queue()
    _event_subscribers.append(queue)

    async def event_generator():
        try:
            while True:
                event = await queue.get()
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
        except asyncio.CancelledError:
            if queue in _event_subscribers:
                _event_subscribers.remove(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/latest")
def get_latest_results():
    logger = MetricsLogger()
    analysis_file = os.path.join(logger.output_dir, "analysis_results.json")
    events_file = os.path.join(logger.output_dir, "events.json")

    metrics = {}
    events = []

    if os.path.exists(analysis_file):
        with open(analysis_file, "r", encoding="utf-8") as f:
            metrics = json.load(f)

    if os.path.exists(events_file):
        with open(events_file, "r", encoding="utf-8") as f:
            events = json.load(f)

    return {
        "status": "success",
        "data": {
            "metrics": metrics,
            "events": events[-50:],  # last 50 events
            "total_events": len(events)
        }
    }
