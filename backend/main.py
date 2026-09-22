import argparse
import json
import sys
import os

# Ensure app package is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.coordinator import CoordinatorAgent

def print_banner():
    print("=" * 70)
    print(" AGENTIC SDLC GOVERNANCE LABORATORY - CLI RUNNER")
    print(" Master of Engineering in Project Management Research (2026)")
    print("=" * 70)

def run_single(epic: str, governance: str):
    print(f"\n[*] Executing Single Epic in '{governance}' Mode...")
    print(f"[*] Epic: '{epic}'")
    coordinator = CoordinatorAgent(governance_mode=governance)
    
    def on_event(ev):
        print(f"  [{ev['datetime']}] [{ev['type']:<22}] {ev['message']}")

    coordinator.register_event_listener(on_event)
    result = coordinator.run_sdlc_workflow(epic)
    metrics = result["metrics"]

    print("\n" + "-" * 70)
    print(f" SPRINT RESULTS ({governance} MODE)")
    print("-" * 70)
    print(f"  • Stories Completed           : {metrics['stories_completed']}")
    print(f"  • Agentic Velocity (AV)       : {metrics['agentic_velocity_features_per_hour']} features/hour")
    print(f"  • Self-Correction Ratio (SCR) : {metrics['self_correction_ratio']}")
    print(f"  • Governance Overhead (GO)    : {metrics['governance_overhead_seconds']} sec ({metrics['governance_overhead_minutes']} min)")
    print(f"  • QA Pass Rate                : {metrics['qa_pass_rate_percent']}%")
    print(f"  • Governance Pass Rate        : {metrics['governance_pass_rate_percent']}%")
    print(f"  • Output Directory            : {result['output_directory']}")
    print("=" * 70 + "\n")

def run_automated_sprints(epic: str):
    print("\n[*] Running 'Automated Sprints' across all 3 Governance Modes (OFF, BASIC, STRICT)...")
    modes = ["OFF", "BASIC", "STRICT"]
    summaries = []

    for m in modes:
        coordinator = CoordinatorAgent(governance_mode=m)
        res = coordinator.run_sdlc_workflow(epic)
        summaries.append((m, res["metrics"]))

    print("\n" + "=" * 80)
    print(" TABLE 4: COMPARATIVE ANALYSIS OF GOVERNANCE MODES (EMPIRICAL REPLICATION)")
    print("=" * 80)
    header = f"{'Metric':<30} | {'OFF':<14} | {'BASIC':<14} | {'STRICT':<14}"
    print(header)
    print("-" * 80)

    rows = [
        ("Stories Completed", lambda m: str(m["stories_completed"])),
        ("Agentic Velocity (AV)", lambda m: f"{m['agentic_velocity_features_per_hour']} feat/hr"),
        ("Self-Correction Ratio (SCR)", lambda m: f"{m['self_correction_ratio']}"),
        ("Governance Overhead (GO)", lambda m: f"{m['governance_overhead_seconds']} sec"),
        ("Total Work Duration", lambda m: f"{m['total_duration_seconds']} sec"),
        ("QA Pass Rate", lambda m: f"{m['qa_pass_rate_percent']}%"),
        ("Governance Pass Rate", lambda m: f"{m['governance_pass_rate_percent']}%"),
    ]

    for name, extractor in rows:
        off_val = extractor(summaries[0][1])
        basic_val = extractor(summaries[1][1])
        strict_val = extractor(summaries[2][1])
        print(f"{name:<30} | {off_val:<14} | {basic_val:<14} | {strict_val:<14}")

    print("=" * 80 + "\n")

def main():
    parser = argparse.ArgumentParser(description="Agentic SDLC Governance Laboratory CLI")
    parser.add_argument("--mode", choices=["single", "automated_sprints"], default="single", help="Execution mode")
    parser.add_argument("--epic", type=str, default="Create a user login page with email validation", help="Natural language Epic")
    parser.add_argument("--governance", choices=["OFF", "BASIC", "STRICT"], default="STRICT", help="Governance strictness level")

    args = parser.parse_args()
    print_banner()

    if args.mode == "single":
        run_single(args.epic, args.governance)
    else:
        run_automated_sprints(args.epic)

if __name__ == "__main__":
    main()
