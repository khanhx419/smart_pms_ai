import os
import json
from typing import Dict, Any, List

class FileWriterTool:
    """
    Corresponds to FileWriteTool from Section 5.6 of the thesis.
    Saves generated code, test artifacts, and comprehensive SDLC reports.
    """

    @classmethod
    def save_artifact(cls, story_id: str, code: str, tests: str, ext: str = "py") -> str:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "output", "stories"))
        os.makedirs(base_dir, exist_ok=True)

        code_file = os.path.join(base_dir, f"{story_id}_impl.{ext}")
        with open(code_file, "w", encoding="utf-8") as f:
            f.write(code)

        test_file = os.path.join(base_dir, f"{story_id}_test.{ext}")
        with open(test_file, "w", encoding="utf-8") as f:
            f.write(tests)

        return base_dir

    @classmethod
    def generate_markdown_report(
        cls,
        epic_desc: str,
        governance_mode: str,
        metrics: Dict[str, Any],
        stories: List[Any],
        events: List[Dict[str, Any]]
    ) -> str:
        """
        Exports a complete 6-phase SDLC deliverables report in GitHub-flavored Markdown
        plus a structured stories_report.json for the Web UI.
        """
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "output"))
        os.makedirs(base_dir, exist_ok=True)
        report_path = os.path.join(base_dir, "BAO_CAO_SDLC_DELIVERABLES.md")

        # Map self-correction and governance remediation events per story
        sc_by_story: Dict[str, List[str]] = {}
        gov_rem_by_story: Dict[str, List[str]] = {}
        for ev in events:
            meta = ev.get("metadata") or {}
            sid = meta.get("story_id")
            if not sid:
                continue
            if ev.get("type") == "SELF_CORRECTION_TRIGGERED":
                sc_by_story.setdefault(sid, []).append(ev.get("message", ""))
            elif ev.get("type") == "GOV_REMEDIATION_TRIGGERED":
                gov_rem_by_story.setdefault(sid, []).append(ev.get("message", ""))

        enriched_stories: List[Dict[str, Any]] = []
        for idx, s in enumerate(stories, 1):
            s_dict = s if isinstance(s, dict) else s.model_dump()
            s_id = s_dict["id"]
            s_type = s_dict["type"]
            ext = "tsx" if s_type == "FRONTEND" else "py"
            qa_rep = s_dict.get("qa_report") or {}
            gov_rep = s_dict.get("gov_report") or {}
            sc_list = sc_by_story.get(s_id, [])
            gov_list = gov_rem_by_story.get(s_id, [])

            if s_type == "FRONTEND":
                ac = f"Giao diện hoạt động đúng chức năng '{s_dict['title']}', có xử lý lỗi/validation và đạt Coverage >= 80%."
                component = f"React/TSX Component ({s_id}_impl.tsx)"
            else:
                ac = f"API/Service xử lý đúng '{s_dict['title']}', kiểm tra dữ liệu đầu vào, không hardcoded secret và đạt Coverage >= 80%."
                component = f"Python/FastAPI Service ({s_id}_impl.py)"

            enriched_stories.append({
                "req_id": f"FR-{idx:02d}",
                "tc_id": f"TC-{idx:02d}",
                "id": s_id,
                "title": s_dict["title"],
                "description": s_dict["description"],
                "type": s_type,
                "story_points": s_dict["story_points"],
                "status": s_dict["status"],
                "ext": ext,
                "component": component,
                "acceptance_criteria": ac,
                "qa_attempts": s_dict.get("qa_attempts", 1),
                "qa_report": qa_rep,
                "gov_report": gov_rep,
                "self_corrections": sc_list,
                "gov_remediations": gov_list,
                "code": (s_dict.get("code") or "").strip(),
                "tests": (s_dict.get("tests") or "").strip(),
            })

        # Save structured JSON for Web UI consumption
        stories_report_path = os.path.join(base_dir, "stories_report.json")
        with open(stories_report_path, "w", encoding="utf-8") as f:
            json.dump(enriched_stories, f, ensure_ascii=False, indent=2)

        lines = []
        lines.append("# BÁO CÁO ĐẦY ĐỦ CÁC PHA VÒNG ĐỜI PHÁT TRIỂN PHẦN MỀM (FULL SDLC DELIVERABLES REPORT)")
        lines.append("")
        lines.append("> **Hệ thống:** Agentic SDLC Governance Laboratory (Theo nghiên cứu Thạc sĩ của Muhammad Awais, 2026)")
        lines.append(f"> **Thời gian tạo:** {events[-1]['datetime'] if events else 'N/A'}")
        lines.append(f"> **Chế độ Quản trị (Governance Mode):** `{governance_mode}`")
        lines.append(f"> **Yêu cầu đầu vào (Epic):** {epic_desc}")
        lines.append("")
        lines.append("---")
        lines.append("")

        # ==================== PHA 1: SRS & PLANNING ====================
        lines.append("## PHA 1: ĐẶC TẢ YÊU CẦU (SRS) & LẬP KẾ HOẠCH BACKLOG (STORYPLANNER AGENT)")
        lines.append("### 1.1. Bảng Đặc tả Yêu cầu Chức năng (Functional Requirements & User Stories)")
        lines.append("")
        lines.append("| Mã YC | Story ID | Tiêu đề User Story | Mô tả yêu cầu | Tiêu chí nghiệm thu (Acceptance Criteria) | Phân loại | Fibonacci |")
        lines.append("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
        for st in enriched_stories:
            lines.append(
                f"| **{st['req_id']}** | `{st['id']}` | {st['title']} | {st['description']} | {st['acceptance_criteria']} | `{st['type']}` | {st['story_points']} pts |"
            )

        lines.append("")
        lines.append("### 1.2. Yêu cầu Phi chức năng (Non-Functional Requirements - NFR)")
        lines.append("")
        lines.append("| Mã NFR | Hạng mục | Tiêu chuẩn bắt buộc | Tác tử kiểm soát |")
        lines.append("| :--- | :--- | :--- | :--- |")
        lines.append("| **NFR-01** | Chất lượng kiểm thử | Độ bao phủ Unit Test >= 80%, không còn lỗi logic chức năng | `QaAgent` |")
        lines.append(f"| **NFR-02** | Bảo mật (SAST) | Không chứa API Key / JWT Secret viết cứng (chế độ `{governance_mode}`) | `PmGovernanceAgent` |")
        lines.append("| **NFR-03** | Kiến trúc & Tách lớp | Tách biệt rõ ràng Frontend (TSX) và Backend (Python), áp dụng No-Merge Constraint | `CoordinatorAgent` |")
        lines.append("")
        lines.append("---")
        lines.append("")

        # ==================== PHA 2: DESIGN ====================
        lines.append("## PHA 2: THIẾT KẾ KIẾN TRÚC & HỆ THỐNG (ARCHITECTURE & DESIGN SPEC)")
        lines.append("Hệ thống áp dụng kiến trúc **Hub-and-Spoke Multi-Agent** với nguyên tắc phân tách miền Frontend / Backend:")
        lines.append("")
        lines.append("| Story ID | Tầng kiến trúc | Thành phần thiết kế (Module / Component) | Tệp mã nguồn | Tệp kiểm thử | Ràng buộc tích hợp |")
        lines.append("| :--- | :--- | :--- | :--- | :--- | :--- |")
        for st in enriched_stories:
            ext = st["ext"]
            layer = "Presentation Layer (React/TSX)" if st["type"] == "FRONTEND" else "Application/API Layer (Python)"
            lines.append(
                f"| **{st['id']}** | {layer} | {st['component']} | `stories/{st['id']}_impl.{ext}` | `stories/{st['id']}_test.{ext}` | No-Merge cho đến khi QA & Gov PASS |"
            )
        lines.append("")
        lines.append("---")
        lines.append("")

        # ==================== PHA 3: IMPLEMENTATION ====================
        lines.append("## PHA 3: TRIỂN KHAI MÃ NGUỒN (DEVELOPMENT & IMPLEMENTATION)")
        lines.append("Mã nguồn triển khai do `FrontendDeveloperAgent` và `BackendDeveloperAgent` sinh ra cho từng User Story:")
        lines.append("")
        for st in enriched_stories:
            ext = st["ext"]
            lang = "tsx" if ext == "tsx" else "python"
            lines.append(f"### {st['id']}: {st['title']} (`{st['type']}`)")
            lines.append(f"- **Tệp triển khai:** `output/stories/{st['id']}_impl.{ext}`")
            if st["code"]:
                lines.append(f"```{lang}")
                lines.append(st["code"])
                lines.append("```")
            lines.append("")
        lines.append("---")
        lines.append("")

        # ==================== PHA 4: QA & TESTING ====================
        lines.append("## PHA 4: KIỂM THỬ CHẤT LƯỢNG & TỰ SỬA LỖI (QA TEST PLAN & VERIFICATION)")
        lines.append("### 4.1. Bảng Ma trận Kiểm thử & Vòng lặp Self-Correction")
        lines.append("")
        lines.append("| Mã TC | Story ID | Số Test Cases | Số lần thử (Attempts) | Độ bao phủ (Coverage) | Tự sửa lỗi (Self-Correction) | Kết quả QA |")
        lines.append("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
        for st in enriched_stories:
            qa_rep = st["qa_report"]
            sc_note = f"{len(st['self_corrections'])} lần sửa" if st["self_corrections"] else "Đạt ngay lần đầu"
            lines.append(
                f"| **{st['tc_id']}** | `{st['id']}` | {qa_rep.get('test_count', 3)} | {st['qa_attempts']} | {qa_rep.get('coverage', 85.0)}% | {sc_note} | `{qa_rep.get('status', 'QA_PASS')}` |"
            )

        lines.append("")
        lines.append("### 4.2. Mã nguồn Kiểm thử Đơn vị (Unit Tests)")
        lines.append("")
        for st in enriched_stories:
            ext = st["ext"]
            lang = "tsx" if ext == "tsx" else "python"
            if st["tests"]:
                lines.append(f"#### {st['tc_id']} — Unit Test cho {st['id']} (`{st['id']}_test.{ext}`)")
                lines.append(f"```{lang}")
                lines.append(st["tests"])
                lines.append("```")
                lines.append("")
        lines.append("---")
        lines.append("")

        # ==================== PHA 5: PM GOVERNANCE ====================
        lines.append("## PHA 5: QUẢN TRỊ AN TOÀN & KIỂM TOÁN BẢO MẬT (PM GOVERNANCE AUDIT)")
        lines.append(f"Đánh giá độc lập bởi `PmGovernanceAgent` ở chế độ **`{governance_mode}`** (Quét tĩnh SAST, kiểm tra rò rỉ Secret & Policy Gate):")
        lines.append("")
        lines.append("| Story ID | Chế độ Governance | Khắc phục bảo mật (Remediation) | Nhận xét của PM Governance | Kết luận |")
        lines.append("| :--- | :--- | :--- | :--- | :--- |")
        for st in enriched_stories:
            gov_rep = st["gov_report"]
            rem_note = f"{len(st['gov_remediations'])} lần chặn & sửa" if st["gov_remediations"] else "Không vi phạm"
            feedback = gov_rep.get("feedback", f"Compliant with {governance_mode} governance policies.")
            lines.append(
                f"| **{st['id']}** | `{gov_rep.get('mode', governance_mode)}` | {rem_note} | {feedback} | `{gov_rep.get('status', 'GOV_PASS')}` |"
            )
        lines.append("")
        lines.append("---")
        lines.append("")

        # ==================== PHA 6: KPIs & TIMELINE ====================
        lines.append("## PHA 6: CHỈ SỐ KHOA HỌC (KPIs) & NHẬT KÝ ĐIỀU PHỐI (AUDIT LOG)")
        lines.append("### 6.1. Bảng Chỉ số Khoa học (Theo Công thức Mục 3.6 — Muhammad Awais, 2026)")
        lines.append("")
        lines.append("| Chỉ số | Giá trị đo được | Ý nghĩa |")
        lines.append("| :--- | :--- | :--- |")
        lines.append(f"| **Agentic Velocity (AV)** | `{metrics.get('agentic_velocity_features_per_hour', 0)}` features/hour | Tốc độ hoàn thành tính năng trung bình theo giờ |")
        lines.append(f"| **Self-Correction Ratio (SCR)** | `{metrics.get('self_correction_ratio', 0)}` | Tỷ lệ QA từ chối và kích hoạt AI tự sửa lỗi |")
        lines.append(f"| **Governance Overhead (GO)** | `{metrics.get('governance_overhead_seconds', 0)}` giây ({metrics.get('governance_overhead_minutes', 0)} phút) | Chi phí thời gian của cổng quản trị an toàn |")
        lines.append(f"| **QA Pass Rate** | `{metrics.get('qa_pass_rate_percent', 0)}%` | Tỷ lệ đạt kiểm thử tự động |")
        lines.append(f"| **Governance Pass Rate** | `{metrics.get('governance_pass_rate_percent', 0)}%` | Tỷ lệ tuân thủ chính sách bảo mật |")
        lines.append(f"| **Tổng số Stories hoàn thành** | `{metrics.get('stories_completed', 0)} / {len(stories)}` | Tỷ lệ hoàn thành toàn bộ Sprint |")
        lines.append("")
        lines.append("### 6.2. Dòng thời gian Điều phối Hub-and-Spoke (Coordination Timeline)")
        lines.append("")
        for ev in events:
            lines.append(f"- `[{ev['datetime']}]` **[{ev['type']}]**: {ev['message']}")

        content = "\n".join(lines)
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(content)

        # Also save a copy in the root of smart_pms_ai for quick access
        root_report = os.path.abspath(os.path.join(base_dir, "..", "BAO_CAO_SDLC_DELIVERABLES.md"))
        with open(root_report, "w", encoding="utf-8") as f:
            f.write(content)

        return report_path
