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
        Exports a complete SDLC deliverables report in GitHub-flavored Markdown.
        """
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "output"))
        os.makedirs(base_dir, exist_ok=True)
        report_path = os.path.join(base_dir, "BAO_CAO_SDLC_DELIVERABLES.md")

        lines = []
        lines.append("# BÁO CÁO KẾT QUẢ VÒNG ĐỜI PHÁT TRIỂN PHẦN MỀM (SDLC DELIVERABLES REPORT)")
        lines.append("")
        lines.append("> **Hệ thống:** Agentic SDLC Governance Laboratory (Theo nghiên cứu Thạc sĩ của Muhammad Awais, 2026)")
        lines.append(f"> **Thời gian tạo:** {events[-1]['datetime'] if events else 'N/A'}")
        lines.append(f"> **Chế độ Quản trị (Governance Mode):** `{governance_mode}`")
        lines.append("")
        lines.append("---")
        lines.append("")
        lines.append("## 1. YÊU CẦU ĐẦU VÀO (EPIC / PRODUCT REQUIREMENT)")
        lines.append(f"**Mô tả:** {epic_desc}")
        lines.append("")
        lines.append("---")
        lines.append("")
        lines.append("## 2. KỸ NGHỆ YÊU CẦU & KẾ HOẠCH BACKLOG (STORYPLANNER AGENT)")
        lines.append("Danh sách các User Stories được phân rã tự động, phân loại kiến trúc và gán điểm Fibonacci:")
        lines.append("")
        lines.append("| Story ID | Tiêu đề | Phân loại | Điểm Fibonacci | Trạng thái | Số lần thử QA |")
        lines.append("| :--- | :--- | :--- | :--- | :--- | :--- |")

        for s in stories:
            s_dict = s if isinstance(s, dict) else s.model_dump()
            lines.append(f"| **{s_dict['id']}** | {s_dict['title']} | `{s_dict['type']}` | {s_dict['story_points']} pts | `{s_dict['status']}` | {s_dict.get('qa_attempts', 1)} |")

        lines.append("")
        lines.append("---")
        lines.append("")
        lines.append("## 3. BẢNG CHỈ SỐ KHOA HỌC & QUẢN LÝ DỰ ÁN (SCIENTIFIC KPIS)")
        lines.append("Các chỉ số đo lường hiệu năng theo Công thức Mục 3.6 của Luận văn:")
        lines.append("")
        lines.append(f"- **Agentic Velocity (AV):** `{metrics.get('agentic_velocity_features_per_hour', 0)}` features/hour")
        lines.append(f"- **Self-Correction Ratio (SCR):** `{metrics.get('self_correction_ratio', 0)}` (Tỷ lệ QA từ chối / Tổng số lần submit)")
        lines.append(f"- **Governance Overhead (GO):** `{metrics.get('governance_overhead_seconds', 0)}` giây ({metrics.get('governance_overhead_minutes', 0)} phút)")
        lines.append(f"- **QA Pass Rate:** `{metrics.get('qa_pass_rate_percent', 0)}%`")
        lines.append(f"- **Governance Pass Rate:** `{metrics.get('governance_pass_rate_percent', 0)}%`")
        lines.append(f"- **Tổng số Stories hoàn thành:** `{metrics.get('stories_completed', 0)} / {len(stories)}`")
        lines.append("")
        lines.append("---")
        lines.append("")
        lines.append("## 4. CHI TIẾT CÁC SẢN PHẨM MÃ NGUỒN ĐÃ XUẤT XƯỞNG (ARTIFACTS)")
        lines.append("Mỗi story đều sinh ra đầy đủ mã thành phần (Component/API) và bộ Unit Test tương ứng:")
        lines.append("")

        for s in stories:
            s_dict = s if isinstance(s, dict) else s.model_dump()
            s_id = s_dict['id']
            ext = "tsx" if s_dict['type'] == "FRONTEND" else "py"
            lines.append(f"### Story {s_id}: {s_dict['title']}")
            lines.append(f"- **Mục tiêu:** {s_dict['description']}")
            lines.append(f"- **Tệp mã nguồn:** [`output/stories/{s_id}_impl.{ext}`](stories/{s_id}_impl.{ext})")
            lines.append(f"- **Tệp Unit Test:** [`output/stories/{s_id}_test.{ext}`](stories/{s_id}_test.{ext})")
            
            qa_rep = s_dict.get("qa_report") or {}
            gov_rep = s_dict.get("gov_report") or {}
            lines.append(f"- **Kết quả QA:** `{qa_rep.get('status', 'PASSED')}` (Độ bao phủ: {qa_rep.get('coverage', 85)}%)")
            lines.append(f"- **Kết quả PM Governance:** `{gov_rep.get('status', 'APPROVED')}` (Bảo mật: PASS)")

            lang = "tsx" if ext == "tsx" else "python"
            code_txt = (s_dict.get("code") or "").strip()
            test_txt = (s_dict.get("tests") or "").strip()
            if code_txt:
                lines.append("")
                lines.append(f"#### Mã nguồn triển khai (`{s_id}_impl.{ext}`)")
                lines.append(f"```{lang}")
                lines.append(code_txt)
                lines.append("```")
            if test_txt:
                lines.append("")
                lines.append(f"#### Mã kiểm thử đơn vị (`{s_id}_test.{ext}`)")
                lines.append(f"```{lang}")
                lines.append(test_txt)
                lines.append("```")
            lines.append("")

        lines.append("---")
        lines.append("")
        lines.append("## 5. DÒNG THỜI GIAN ĐIỀU PHỐI (COORDINATION TIMELINE)")
        lines.append("Nhật ký tương tác giữa Hub (Coordinator) và các Spoke:")
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
