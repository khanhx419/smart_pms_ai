import time
from typing import Dict, Any
from app.core.session_state import Story
from app.core.metrics_logger import MetricsLogger
from app.tools.security_scanner import SecurityScanner

class PmGovernanceAgent:
    """
    Corresponds to PM Governance Agent in Section 5.4.5 & Snippet 1.7.
    Enforces organizational standards, safety guardrails, and compliance
    across 3 modes: OFF, BASIC, and STRICT.
    """

    def __init__(self, mode: str = "STRICT"):
        self.mode = mode.upper()  # "OFF", "BASIC", "STRICT"

    def review(self, story: Story) -> Dict[str, Any]:
        logger = MetricsLogger()
        logger.log_event("GOV_START", f"PM Governance reviewing {story.id} (Mode: {self.mode})")

        # In OFF mode, governance is bypassed
        if self.mode == "OFF":
            logger.log_event(
                "GOV_BYPASS",
                f"Governance bypassed for {story.id} (OFF Mode)",
                {"story_id": story.id, "mode": "OFF"}
            )
            return {
                "status": "GOV_BYPASS",
                "approved": True,
                "mode": "OFF",
                "issues": []
            }

        # Simulate small compute time for scanning to record realistic Governance Overhead (GO)
        # In STRICT mode, security scan takes ~0.1 - 0.2s of compute
        time.sleep(0.08 if self.mode == "STRICT" else 0.03)

        # Run Security / Architectural scanning
        scan_res = SecurityScanner.scan(
            code=story.code or "",
            story_type=story.type,
            mode=self.mode
        )

        if scan_res["passed"]:
            logger.log_event(
                "GOV_PASS",
                f"PM Governance Approved {story.id} under {self.mode} Mode (Guardrails satisfied)",
                {"story_id": story.id, "mode": self.mode}
            )
            return {
                "status": "GOV_PASS",
                "approved": True,
                "mode": self.mode,
                "issues": [],
                "feedback": f"Compliant with {self.mode} governance policies."
            }
        else:
            logger.log_event(
                "GOV_FAIL",
                f"PM Governance BLOCKED {story.id}: {'; '.join(scan_res['issues'])}",
                {"story_id": story.id, "mode": self.mode, "issues": scan_res["issues"]}
            )
            return {
                "status": "GOV_FAIL",
                "approved": False,
                "mode": self.mode,
                "issues": scan_res["issues"],
                "feedback": f"Blocked by PM Governance: {'; '.join(scan_res['issues'])}"
            }
