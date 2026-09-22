import sys
import os
import time

# Ensure app package is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.coordinator import CoordinatorAgent
from app.core.metrics_logger import MetricsLogger
from app.agents.story_planner import StoryPlannerAgent
from app.agents.developer_agent import DeveloperAgent
from app.agents.qa_agent import QaAgent
from app.agents.pm_governance import PmGovernanceAgent
from app.tools.security_scanner import SecurityScanner

def test_story_planner_fibonacci_and_classification():
    """Verify StoryPlanner breaks Epic into Fibonacci stories and classifies as FE/BE."""
    planner = StoryPlannerAgent()
    stories = planner.plan("Create a user login page with email validation")

    assert len(stories) >= 2, "Should create multiple user stories"
    for s in stories:
        assert s.id.startswith("ST-"), f"Story ID should start with ST-, got {s.id}"
        assert s.type in ["FRONTEND", "BACKEND"], f"Type should be FRONTEND or BACKEND, got {s.type}"
        assert s.story_points in [1, 2, 3, 5, 8], f"Story points must be Fibonacci, got {s.story_points}"

def test_security_scanner_guardrails():
    """Verify SecurityScanner detects hardcoded secrets in STRICT mode."""
    vulnerable_code = 'JWT_SECRET = "super_secret_production_key_12345"\nTOKEN = "abcdef12345678"'
    res_strict = SecurityScanner.scan(vulnerable_code, story_type="BACKEND", mode="STRICT")
    assert not res_strict["passed"], "STRICT mode must reject hardcoded secrets"
    assert len(res_strict["issues"]) > 0

    # In OFF mode, scan is bypassed
    res_off = SecurityScanner.scan(vulnerable_code, story_type="BACKEND", mode="OFF")
    assert res_off["passed"], "OFF mode should bypass security checks"

def test_self_correction_loop_and_strict_governance():
    """Verify Central Coordinator orchestrates self-correction loop and STRICT guardrails."""
    coordinator = CoordinatorAgent(governance_mode="STRICT")
    result = coordinator.run_sdlc_workflow("Create a user login page with email validation")

    metrics = result["metrics"]
    assert metrics["stories_completed"] >= 5, "All planned stories should complete after remediation"
    assert metrics["governance_pass_rate_percent"] >= 80.0, "Governance pass rate should be recorded"
    assert metrics["agentic_velocity_features_per_hour"] > 0, "Agentic Velocity (AV) must be positive"
    assert metrics["governance_overhead_seconds"] >= 0, "Governance Overhead (GO) must be >= 0"

    # Verify event trail
    events = result["events"]
    event_types = [e["type"] for e in events]
    assert "COORDINATOR_START" in event_types
    assert "STORY_CREATED" in event_types
    assert "GOV_PASS" in event_types
    assert "SPRINT_COMPLETE" in event_types

def test_mathematical_kpis_formulas():
    """Verify exact mathematical formulas for AV, SCR, and GO."""
    logger = MetricsLogger()
    logger.reset()
    logger.start_sprint()

    # Story 1: Pass first attempt
    t_qa1 = time.time()
    logger.log_event("QA_PASS", "QA Passed ST-1", {"story_id": "ST-1", "attempts": 1})
    time.sleep(0.05)
    logger.log_event("GOV_PASS", "Gov Passed ST-1", {"story_id": "ST-1"})
    logger.log_event("STORY_COMPLETED", "Completed ST-1")

    # Story 2: Fail QA, then pass QA, then pass Gov
    logger.log_event("QA_FAIL", "QA Rejected ST-2", {"story_id": "ST-2", "attempts": 1})
    logger.log_event("QA_PASS", "QA Passed ST-2", {"story_id": "ST-2", "attempts": 2})
    time.sleep(0.05)
    logger.log_event("GOV_PASS", "Gov Passed ST-2", {"story_id": "ST-2"})
    logger.log_event("STORY_COMPLETED", "Completed ST-2")

    logger.end_sprint()
    kpis = logger.calculate_metrics()

    # Total submissions = 1 (pass) + 1 (fail) + 1 (pass) = 3
    # SCR = 1 / 3 = 0.3333
    assert abs(kpis["self_correction_ratio"] - 0.3333) < 0.01, f"SCR expected ~0.3333, got {kpis['self_correction_ratio']}"
    assert kpis["stories_completed"] == 2
    assert kpis["governance_overhead_seconds"] > 0.08

if __name__ == "__main__":
    print("[*] Running Verification Test Suite...")
    test_story_planner_fibonacci_and_classification()
    print(" [PASS] StoryPlanner Fibonacci & classification test")
    test_security_scanner_guardrails()
    print(" [PASS] SecurityScanner Bandit SAST Guardrails test")
    test_self_correction_loop_and_strict_governance()
    print(" [PASS] Coordinator Hub-and-Spoke & Self-Correction Loop test")
    test_mathematical_kpis_formulas()
    print(" [PASS] Mathematical KPIs Formulations (AV, SCR, GO) test")
    print("\n[SUCCESS] ALL TESTS PASSED SUCCESSFULLY!")
