from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/api/benchmark", tags=["Benchmark"])

# Empirical data from Chapter 4 of the Master's Thesis
THESIS_BENCHMARK_DATA = {
    "governance_modes_comparison": {
        "title": "Table 4: Overall Comparison of Governance Modes (Thesis Chapter 4.1)",
        "modes": [
            {
                "mode": "OFF",
                "total_stories": 2,
                "frontend_assignments": 2,
                "backend_assignments": 0,
                "qa_pass_rate_percent": 66.67,
                "governance_pass_rate_percent": 0.0,
                "agentic_velocity_feat_hr": 29.56,
                "self_correction_ratio": 0.3333,
                "governance_overhead_seconds": 0.0,
                "total_work_duration_seconds": 121.77,
                "qa_failures": 1,
                "stories_completed": 1,
                "security_issues_detected": 0,
                "escaped_defects": "High (unverified backend & credentials)"
            },
            {
                "mode": "BASIC",
                "total_stories": 5,
                "frontend_assignments": 3,
                "backend_assignments": 2,
                "qa_pass_rate_percent": 83.33,
                "governance_pass_rate_percent": 100.0,
                "agentic_velocity_feat_hr": 46.91,
                "self_correction_ratio": 0.1667,
                "governance_overhead_seconds": 115.17,
                "total_work_duration_seconds": 383.70,
                "qa_failures": 1,
                "stories_completed": 5,
                "security_issues_detected": 0,
                "escaped_defects": "Low (basic unit testing verified)"
            },
            {
                "mode": "STRICT",
                "total_stories": 6,
                "frontend_assignments": 3,
                "backend_assignments": 3,
                "qa_pass_rate_percent": 75.0,
                "governance_pass_rate_percent": 100.0,
                "agentic_velocity_feat_hr": 24.71,
                "self_correction_ratio": 0.25,
                "governance_overhead_seconds": 136.6,
                "total_work_duration_seconds": 874.30,
                "qa_failures": 2,
                "stories_completed": 6,
                "security_issues_detected": 2,
                "escaped_defects": "Zero (100% blocked via Bandit SAST)"
            }
        ]
    },

    "human_vs_agentic_pipeline": {
        "title": "Table 7: End-to-End Pipeline Duration for 6 Stories (Thesis Section 4.4)",
        "stages": [
            {
                "stage": "Story Creation & Planning",
                "human_no_ai": "90 Minutes",
                "ai_assisted_human": "24 Minutes",
                "agentic_tool": "~0 Seconds (Instant)"
            },
            {
                "stage": "Code Development",
                "human_no_ai": "16 Hours",
                "ai_assisted_human": "7 Hours",
                "agentic_tool": "~50 Minutes (Total)"
            },
            {
                "stage": "Quality Assurance (QA) Check",
                "human_no_ai": "6–11 Hours / story",
                "ai_assisted_human": "30–40 Minutes / story",
                "agentic_tool": "Seconds per story"
            },
            {
                "stage": "Governance & Security Review",
                "human_no_ai": "4+ Day Wait Queue",
                "ai_assisted_human": "4+ Day Wait Queue",
                "agentic_tool": "2.28 Minutes (Total)"
            },
            {
                "stage": "Total End-to-End (E2E) Time",
                "human_no_ai": "18–30 Working Days",
                "ai_assisted_human": "8–14 Working Days",
                "agentic_tool": "14.6 Minutes"
            }
        ]
    },

    "enterprise_experts": [
        {
            "name": "Hatim Baloch",
            "role": "Project Manager",
            "company": "TechwareSoft UAE",
            "human_qa_pass": 85.0,
            "tool_qa_pass": 75.0,
            "human_gov_pass": 85.0,
            "tool_gov_pass": 100.0,
            "human_gov_review_min": 90.0,
            "tool_gov_review_min": 2.28,
            "quote": "Manual governance assessment for a login feature takes 1 to 1.5 hours in enterprise settings."
        },
        {
            "name": "Aaro Ahola",
            "role": "Data Engineer / Researcher",
            "company": "Wärtsilä (Finland)",
            "human_qa_pass": 80.0,
            "tool_qa_pass": 75.0,
            "human_gov_pass": 80.0,
            "tool_gov_pass": 100.0,
            "human_gov_review_min": 30.0,
            "tool_gov_review_min": 2.28,
            "quote": "Nearly 40% of human development efforts undergo self-rejections before production readiness."
        },
        {
            "name": "Abdul Raziq Advani",
            "role": "Principal Software Consultant",
            "company": "10Pearls (Pakistan)",
            "human_qa_pass": 70.0,
            "tool_qa_pass": 75.0,
            "human_gov_pass": 50.0,
            "tool_gov_pass": 100.0,
            "human_gov_review_min": 10.0,
            "tool_gov_review_min": 2.28,
            "quote": "Governance pass ratio is only ~50% initially due to improper requirements and manual testing gaps."
        },
        {
            "name": "Haider Ali Zaidi",
            "role": "Lead Software Developer",
            "company": "Abu Dhabi Ports Group (UAE)",
            "human_qa_pass": 80.0,
            "tool_qa_pass": 75.0,
            "human_gov_pass": 55.0,
            "tool_gov_pass": 100.0,
            "human_gov_review_min": 20.0,
            "tool_gov_review_min": 2.28,
            "quote": "A single user story can take 16 hours due to integrations and stakeholder review queues."
        },
        {
            "name": "Muhammad Usman",
            "role": "Lead Software Engineer",
            "company": "Hollywood Technologies (Bahrain)",
            "human_qa_pass": 90.0,
            "tool_qa_pass": 75.0,
            "human_gov_pass": 40.0,
            "tool_gov_pass": 100.0,
            "human_gov_review_min": 5.0,
            "tool_gov_review_min": 2.28,
            "quote": "Using AI assistants yields high velocity but low governance pass rate (40%) without automated guardrails."
        }
    ]
}

@router.get("")
def get_benchmarks() -> Dict[str, Any]:
    return {"status": "success", "data": THESIS_BENCHMARK_DATA}
