from typing import Dict, Any
from app.core.session_state import Story
from app.core.metrics_logger import MetricsLogger
from app.tools.test_runner import TestRunner

class QaAgent:
    """
    Corresponds to QA Agent in Section 5.4.4 & Snippet 1.6.
    Executes automated tests, checks test coverage >= 80%,
    and triggers Self-Correction Loops upon failure.
    """

    def evaluate(self, story: Story) -> Dict[str, Any]:
        logger = MetricsLogger()
        logger.log_event("QA_START", f"QA Agent evaluating {story.id}: '{story.title}' (Attempt #{story.qa_attempts + 1})")

        result = TestRunner.evaluate(
            code=story.code or "",
            tests=story.tests or "",
            story_type=story.type,
            attempt=story.qa_attempts + 1
        )

        if result["passed"]:
            logger.log_event(
                "QA_PASS",
                f"QA Passed for {story.id} (Coverage: {result['coverage_percent']}%, {result['test_cases_count']} tests)",
                {
                    "story_id": story.id,
                    "attempts": story.qa_attempts + 1,
                    "coverage": result["coverage_percent"],
                    "tests_count": result["test_cases_count"]
                }
            )
            return {
                "status": "QA_PASS",
                "approved": True,
                "coverage": result["coverage_percent"],
                "test_count": result["test_cases_count"],
                "feedback": "All automated test cases and coverage constraints passed."
            }
        else:
            logger.log_event(
                "QA_FAIL",
                f"QA Rejected {story.id}: {'; '.join(result['errors'])}",
                {
                    "story_id": story.id,
                    "attempts": story.qa_attempts + 1,
                    "errors": result["errors"]
                }
            )
            return {
                "status": "QA_FAIL",
                "approved": False,
                "coverage": result["coverage_percent"],
                "test_count": result["test_cases_count"],
                "errors": result["errors"],
                "feedback": f"Fix Recommendations: {'; '.join(result['errors'])}"
            }
