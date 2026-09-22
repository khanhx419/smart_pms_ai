import json
import os
import time
from typing import Dict, List, Any, Optional

class MetricsLogger:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(MetricsLogger, cls).__new__(cls, *args, **kwargs)
            cls._instance._init()
        return cls._instance

    def _init(self):
        self.events: List[Dict[str, Any]] = []
        self.qa_passes = 0
        self.qa_rejections = 0
        self.gov_passes = 0
        self.gov_failures = 0
        self.qa_pass_timestamps: Dict[str, float] = {}
        self.gov_approval_timestamps: Dict[str, float] = {}
        self.stories_completed = 0
        self.first_attempt_passes = 0
        self.total_tokens = 0
        self.start_time: float = 0.0
        self.end_time: float = 0.0
        self.output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "output"))
        os.makedirs(self.output_dir, exist_ok=True)

    def reset(self):
        self._init()

    def start_sprint(self):
        self.reset()
        self.start_time = time.time()
        self.log_event("SPRINT_START", "Sprint initialized and started")

    def end_sprint(self):
        self.end_time = time.time()
        self.log_event("SPRINT_END", "Sprint completed")
        self.persist_results()

    def log_event(self, event_type: str, message: str, metadata: Optional[Dict[str, Any]] = None):
        timestamp = time.time()
        entry = {
            "timestamp": timestamp,
            "datetime": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(timestamp)),
            "type": event_type,
            "message": message,
            "metadata": metadata or {}
        }
        self.events.append(entry)

        # Track QA and Governance metrics
        if event_type == "QA_PASS":
            self.qa_passes += 1
            story_id = (metadata or {}).get("story_id")
            if story_id:
                self.qa_pass_timestamps[story_id] = timestamp
            if (metadata or {}).get("attempts", 1) == 1:
                self.first_attempt_passes += 1

        elif event_type == "QA_FAIL":
            self.qa_rejections += 1

        elif event_type == "GOV_PASS":
            self.gov_passes += 1
            story_id = (metadata or {}).get("story_id")
            if story_id:
                self.gov_approval_timestamps[story_id] = timestamp

        elif event_type == "GOV_FAIL":
            self.gov_failures += 1

        elif event_type == "STORY_COMPLETED":
            self.stories_completed += 1

        return entry

    def calculate_metrics(self) -> Dict[str, Any]:
        total_time = (self.end_time or time.time()) - (self.start_time or time.time())
        if total_time <= 0:
            total_time = 0.001

        # 1. Agentic Velocity (AV): Completed Stories / (Total Duration (seconds) / 3600)
        hours = total_time / 3600.0
        av = round(self.stories_completed / hours, 2) if hours > 0 else 0.0

        # 2. Self-Correction Ratio (SCR): QA Rejections / Total Submissions (Pass + Fail)
        total_qa_submissions = self.qa_passes + self.qa_rejections
        scr = round(self.qa_rejections / total_qa_submissions, 4) if total_qa_submissions > 0 else 0.0

        # 3. Governance Overhead (GO): Sum(GOV_Approval Timestamp - QA_PASS Timestamp)
        total_go_seconds = 0.0
        for story_id, gov_time in self.gov_approval_timestamps.items():
            if story_id in self.qa_pass_timestamps:
                overhead = gov_time - self.qa_pass_timestamps[story_id]
                if overhead > 0:
                    total_go_seconds += overhead

        qa_pass_rate = round((self.qa_passes / total_qa_submissions) * 100, 2) if total_qa_submissions > 0 else 0.0
        total_gov_submissions = self.gov_passes + self.gov_failures
        gov_pass_rate = round((self.gov_passes / total_gov_submissions) * 100, 2) if total_gov_submissions > 0 else 100.0
        first_pass_rate = round((self.first_attempt_passes / max(1, self.stories_completed)) * 100, 2)

        return {
            "stories_completed": self.stories_completed,
            "total_duration_seconds": round(total_time, 2),
            "agentic_velocity_features_per_hour": av,
            "self_correction_ratio": scr,
            "governance_overhead_seconds": round(total_go_seconds, 2),
            "governance_overhead_minutes": round(total_go_seconds / 60.0, 2),
            "qa_pass_rate_percent": qa_pass_rate,
            "first_pass_quality_percent": first_pass_rate,
            "governance_pass_rate_percent": gov_pass_rate,
            "qa_failures": self.qa_rejections,
            "qa_passes": self.qa_passes,
            "total_tokens": self.total_tokens
        }

    def persist_results(self):
        metrics = self.calculate_metrics()

        # 1. events.json
        events_path = os.path.join(self.output_dir, "events.json")
        with open(events_path, "w", encoding="utf-8") as f:
            json.dump(self.events, f, indent=2, ensure_ascii=False)

        # 2. analysis_results.json
        analysis_path = os.path.join(self.output_dir, "analysis_results.json")
        with open(analysis_path, "w", encoding="utf-8") as f:
            json.dump(metrics, f, indent=2, ensure_ascii=False)

        # 3. aggregates.json
        aggregates_path = os.path.join(self.output_dir, "aggregates.json")
        aggregates = {
            "summary": metrics,
            "total_events": len(self.events),
            "last_updated": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        with open(aggregates_path, "w", encoding="utf-8") as f:
            json.dump(aggregates, f, indent=2, ensure_ascii=False)
