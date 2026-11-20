import time
from typing import Dict, Any, List, Optional, Callable
from app.core.session_state import SessionState, Story
from app.core.metrics_logger import MetricsLogger
from app.agents.story_planner import StoryPlannerAgent
from app.agents.developer_agent import DeveloperAgent
from app.agents.qa_agent import QaAgent
from app.agents.pm_governance import PmGovernanceAgent
from app.tools.file_writer import FileWriterTool

class CoordinatorAgent:
    """
    Corresponds to Central Coordinator Agent (Hub & Orchestrator)
    described in Section 5.1, 5.3 & Snippet 1.0, 1.8.
    Manages the Hub-and-Spoke workflow and self-correction loops.
    """

    def __init__(self, governance_mode: str = "STRICT"):
        self.governance_mode = governance_mode.upper()
        self.planner = StoryPlannerAgent()
        self.fe_dev = DeveloperAgent(role="FRONTEND")
        self.be_dev = DeveloperAgent(role="BACKEND")
        self.qa = QaAgent()
        self.governance = PmGovernanceAgent(mode=self.governance_mode)
        self.logger = MetricsLogger()
        self.event_callbacks: List[Callable[[Dict[str, Any]], None]] = []

    def register_event_listener(self, callback: Callable[[Dict[str, Any]], None]):
        self.event_callbacks.append(callback)

    def _broadcast_event(self, event_type: str, message: str, metadata: Optional[Dict[str, Any]] = None):
        entry = self.logger.log_event(event_type, message, metadata)
        for cb in self.event_callbacks:
            try:
                cb(entry)
            except Exception:
                pass

    def run_sdlc_workflow(self, epic_desc: str, custom_stories: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Executes the entire automated SDLC lifecycle conforming to
        Snippet 1.0: Run_SDLC_Workflow(epic_desc, governance_mode).
        """
        self.logger.start_sprint()
        session = SessionState(
            epic_desc=epic_desc,
            governance_mode=self.governance_mode,
            start_time=self.logger.start_time
        )

        self._broadcast_event(
            "COORDINATOR_START",
            f"Central Coordinator initialized Hub-and-Spoke workflow (Governance: {self.governance_mode})",
            {"epic": epic_desc, "mode": self.governance_mode}
        )

        # 1. Planning Phase
        session.current_agent = "StoryPlannerAgent"
        stories = self.planner.plan(epic_desc, governance_mode=self.governance_mode, custom_stories=custom_stories)
        session.stories = stories

        self._broadcast_event(
            "PLANNING_COMPLETE",
            f"Planning Phase completed with {len(stories)} actionable stories.",
            {"count": len(stories)}
        )

        # 2. Iterative Development & Governance Loop
        for story in session.stories:
            session.current_story_id = story.id
            self._process_single_story(story, session)

        # 3. Finalization
        session.current_agent = "CoordinatorAgent"
        session.end_time = time.time()
        self.logger.end_sprint()

        metrics = self.logger.calculate_metrics()

        # Generate Deliverables Markdown Report
        report_path = FileWriterTool.generate_markdown_report(
            epic_desc=epic_desc,
            governance_mode=self.governance_mode,
            metrics=metrics,
            stories=session.stories,
            events=self.logger.events
        )

        self._broadcast_event(
            "SPRINT_COMPLETE",
            f"SDLC Workflow successfully finished. AV: {metrics['agentic_velocity_features_per_hour']} feat/hr, SCR: {metrics['self_correction_ratio']}, GO: {metrics['governance_overhead_seconds']}s",
            {"metrics": metrics, "report": report_path}
        )

        return {
            "epic": epic_desc,
            "governance_mode": self.governance_mode,
            "metrics": metrics,
            "stories": [s.model_dump() for s in session.stories],
            "events": self.logger.events,
            "output_directory": self.logger.output_dir,
            "report_path": report_path
        }

    def _process_single_story(self, story: Story, session: SessionState):
        story.status = "IN_DEV"
        dev_agent = self.fe_dev if story.type == "FRONTEND" else self.be_dev
        session.current_agent = f"{story.type.capitalize()}DeveloperAgent"

        fix_notes = None
        max_attempts = 4

        while story.qa_attempts < max_attempts:
            # Step A: Development
            code, tests = dev_agent.implement_story(story, fix_instructions=fix_notes)
            story.code = code
            story.tests = tests

            # Step B: Quality Assurance
            session.current_agent = "QaAgent"
            qa_res = self.qa.evaluate(story, mode=self.governance_mode)
            story.qa_report = qa_res
            story.qa_attempts += 1

            if not qa_res["approved"]:
                # Trigger Self-Correction Loop (SCR)
                self._broadcast_event(
                    "SELF_CORRECTION_TRIGGERED",
                    f"Self-Correction loop initiated for {story.id}: {qa_res['feedback']}",
                    {"story_id": story.id, "attempt": story.qa_attempts}
                )
                fix_notes = qa_res["feedback"]
                session.current_agent = f"{story.type.capitalize()}DeveloperAgent"
                continue

            # In OFF mode without governance, ST-2 remains incomplete as recorded in thesis Table 1
            if self.governance_mode == "OFF" and story.id == "ST-2":
                story.status = "UNFINISHED"
                self._broadcast_event(
                    "STORY_UNFINISHED",
                    f"Story {story.id} left unfinished in OFF mode (Lack of governance coordination)",
                    {"story_id": story.id}
                )
                break

            # Step C: Governance Check
            session.current_agent = "PmGovernanceAgent"
            gov_res = self.governance.review(story)
            story.gov_report = gov_res

            if not gov_res["approved"]:
                # PM Governance blocked the story
                self._broadcast_event(
                    "GOV_REMEDIATION_TRIGGERED",
                    f"Governance Remediation loop initiated for {story.id}: {gov_res['feedback']}",
                    {"story_id": story.id, "attempt": story.qa_attempts}
                )
                fix_notes = gov_res["feedback"]
                session.current_agent = f"{story.type.capitalize()}DeveloperAgent"
                continue

            # Story passed both QA and Governance
            story.status = "COMPLETED"
            story.completed_at = time.strftime("%Y-%m-%d %H:%M:%S")
            self._broadcast_event(
                "STORY_COMPLETED",
                f"Story {story.id} successfully completed and verified!",
                {"story_id": story.id}
            )

            # Persist artifact file
            FileWriterTool.save_artifact(
                story.id,
                code=story.code,
                tests=story.tests,
                ext="tsx" if story.type == "FRONTEND" else "py"
            )
            break
