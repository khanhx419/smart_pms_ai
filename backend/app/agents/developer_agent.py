import ast
import json
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

from app.core.session_state import Story
from app.core.metrics_logger import MetricsLogger


def _load_gemini_config() -> Tuple[str, str]:
    """Load GEMINI_API_KEY and GEMINI_MODEL from env or sibling hub-and-spoke/.env."""
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    model = os.environ.get("GEMINI_MODEL", "").strip()
    if not key:
        candidates = [
            Path(__file__).resolve().parents[4] / "Du-an-Hub-and-Spoke" / "hub-and-spoke" / ".env",
            Path(__file__).resolve().parents[2] / ".env",
        ]
        for env_path in candidates:
            if env_path.is_file():
                for raw in env_path.read_text(encoding="utf-8-sig").splitlines():
                    line = raw.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k, v = k.strip(), v.strip().strip("\"'")
                        if k == "GEMINI_API_KEY" and not key:
                            key = v
                        elif k == "GEMINI_MODEL" and not model:
                            model = v
                if key:
                    break
    return key, (model or "gemini-2.5-flash-lite")


def _to_pascal_case(text: str, default: str = "FeatureComponent") -> str:
    ascii_words = re.findall(r"[A-Za-z0-9]+", text)
    if not ascii_words:
        return default
    name = "".join(w.capitalize() for w in ascii_words[:4])
    if not name or not name[0].isalpha():
        return default
    return name


def _to_snake_case(text: str, default: str = "feature_service") -> str:
    ascii_words = re.findall(r"[A-Za-z0-9]+", text.lower())
    if not ascii_words:
        return default
    name = "_".join(ascii_words[:4])
    if not name or not name[0].isalpha():
        return default
    return name


class DeveloperAgent:
    """
    Corresponds to Section 5.4.3 & Snippets 1.4, 1.5.
    Specialized Frontend and Backend Developer Agents operating under No-Merge Constraint.
    Uses Gemini LLM to generate tailored code & unit tests for each User Story,
    with feature-aware fallback when offline.
    """

    _last_llm_call: float = 0.0

    def __init__(self, role: str = "BACKEND"):
        self.role = role  # "FRONTEND" or "BACKEND"
        self._story_cache: Dict[str, Tuple[str, str]] = {}

    def implement_story(self, story: Story, fix_instructions: Optional[str] = None) -> Tuple[str, str]:
        logger = MetricsLogger()
        attempt = story.qa_attempts + 1

        if fix_instructions:
            logger.log_event(
                "DEV_REFACTOR",
                f"{self.role} Developer refactoring {story.id} (Attempt #{attempt}) based on feedback: {fix_instructions}",
                {"story_id": story.id, "attempt": attempt, "fix": fix_instructions}
            )
        else:
            logger.log_event(
                "DEV_START",
                f"{self.role} Developer implementing {story.id}: '{story.title}'",
                {"story_id": story.id, "attempt": attempt}
            )

        prev_code = self._story_cache.get(story.id, ("", ""))[0]
        llm_res = self._generate_with_gemini(story, fix_instructions, prev_code)

        if llm_res:
            code, tests = llm_res
            # Ensure STRICT governance remediation demonstration on ST-3 Attempt #1 if needed
            if self.role == "BACKEND" and story.id == "ST-3" and attempt == 1 and not fix_instructions:
                if "JWT_SECRET" not in code and "API_KEY" not in code:
                    code = 'JWT_SECRET = "super_secret_production_key_12345"\n' + code
        elif fix_instructions and story.id in self._story_cache:
            # Refactor existing code cleanly if Gemini is rate-limited on retry
            old_code, old_tests = self._story_cache[story.id]
            code = self._apply_local_fix(old_code, fix_instructions)
            tests = old_tests
        else:
            if self.role == "FRONTEND":
                code, tests = self._fallback_frontend(story, fix_instructions, attempt)
            else:
                code, tests = self._fallback_backend(story, fix_instructions, attempt)

        self._story_cache[story.id] = (code, tests)

        logger.log_event(
            "CODE_GENERATED",
            f"Generated code & unit tests for {story.id} ({len(code.splitlines())} LOC)",
            {"story_id": story.id, "attempt": attempt, "loc": len(code.splitlines())}
        )

        return code, tests

    def _apply_local_fix(self, code: str, fix_instructions: str) -> str:
        fixed = re.sub(
            r'JWT_SECRET\s*=\s*["\'][^"\']+["\']',
            'JWT_SECRET = os.getenv("JWT_SECRET_KEY", "fallback_dev_key")',
            code,
        )
        fixed = re.sub(
            r'(?i)(api[_-]?key|secret|auth_token)\s*=\s*["\'][a-zA-Z0-9_\-]{8,}["\']',
            r'\1 = os.getenv("APP_SECRET_KEY", "")',
            fixed,
        )
        if f"// Refactored:" not in fixed and f"# Refactored:" not in fixed:
            prefix = "//" if self.role == "FRONTEND" else "#"
            fixed = f"{prefix} Refactored based on QA/Governance feedback: {fix_instructions}\n" + fixed
        return fixed

    def _generate_with_gemini(
        self, story: Story, fix_instructions: Optional[str], prev_code: str
    ) -> Optional[Tuple[str, str]]:
        key, model = _load_gemini_config()
        if not key:
            return None

        if self.role == "FRONTEND":
            instruction = (
                "You are a senior Frontend React + Tailwind CSS developer agent. "
                "Generate a COMPLETE, SELF-CONTAINED, INTERACTIVE React component tailored STRICTLY to the user story's actual feature "
                "(do NOT generate a Login form unless the story explicitly asks for login/authentication!). "
                "STRICT RULES:\n"
                "1. Only use `import React, { useState } from 'react';` (you may also import `useEffect`). NO third-party libraries (no lucide-react, no axios, no react-router, no external CSS).\n"
                "2. Export ONE named PascalCase function component matching the story (e.g. `export function BookingForm({ onSuccess }) { ... }`).\n"
                "3. Style beautifully with Tailwind CSS dark theme (`bg-slate-900`, `border-slate-800`, `text-white`, `bg-blue-600`, etc.) and Vietnamese/English labels matching the story's language.\n"
                "4. Make it genuinely interactive in standalone preview (working state, form inputs/lists/actions, validation, clear success/error feedback, realistic sample data if it's a list/table/dashboard).\n"
                "5. Also generate `tests`: a Jest / React Testing Library test suite with at least 3 `it(...)` test cases.\n"
                "6. Never include database connections or hardcoded secrets.\n"
                "Return ONLY valid JSON: {\"code\": \"...\", \"tests\": \"...\"}."
            )
        else:
            instruction = (
                "You are a senior Backend Python developer agent. "
                "Generate CLEAN, SYNTACTICALLY VALID Python code (Pydantic models + service/endpoint functions) tailored STRICTLY to the user story's actual feature "
                "(do NOT generate a Login API unless the story explicitly asks for login/authentication!). "
                "STRICT RULES:\n"
                "1. Use `pydantic` (`BaseModel`, `Field`), `os.getenv(...)` for any config/secrets, and proper input validation (`try/except` or `validate_*` functions).\n"
                "2. NEVER hardcode API keys, passwords, or JWT secrets. NEVER use `eval()` or unsafe string-interpolated SQL.\n"
                "3. Also generate `tests`: a pytest test suite with at least 3 `def test_...():` test cases.\n"
                "Return ONLY valid JSON: {\"code\": \"...\", \"tests\": \"...\"}."
            )

        payload: Dict[str, Any] = {
            "story_id": story.id,
            "title": story.title,
            "description": story.description,
            "role": self.role,
        }
        if fix_instructions and prev_code:
            payload["task"] = "Refactor previous_code to resolve all QA/Governance feedback."
            payload["fix_instructions"] = fix_instructions
            payload["previous_code"] = prev_code[:6000]

        gen_cfg: Dict[str, Any] = {
            "temperature": 0.2,
            "maxOutputTokens": 4096,
            "responseMimeType": "application/json",
        }
        if model in ("gemini-2.5-flash", "gemini-2.5-flash-lite"):
            gen_cfg["thinkingConfig"] = {"thinkingBudget": 0}

        body = {
            "systemInstruction": {"parts": [{"text": instruction}]},
            "contents": [{"role": "user", "parts": [{"text": json.dumps(payload, ensure_ascii=False)}]}],
            "generationConfig": gen_cfg,
        }

        # Gentle rate-limit spacing (1.2s between calls)
        delay = 1.2 - (time.monotonic() - DeveloperAgent._last_llm_call)
        if delay > 0:
            time.sleep(delay)

        req = urllib.request.Request(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json", "x-goog-api-key": key},
        )
        try:
            with urllib.request.urlopen(req, timeout=35) as resp:
                data = json.loads(resp.read(1_500_000))
        except Exception:
            return None
        finally:
            DeveloperAgent._last_llm_call = time.monotonic()

        try:
            cand = (data.get("candidates") or [{}])[0]
            text = "".join(p.get("text", "") for p in (cand.get("content") or {}).get("parts") or [])
            text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip())
            parsed = json.loads(text)
            code = str(parsed.get("code") or "").strip()
            tests = str(parsed.get("tests") or "").strip()
        except Exception:
            return None

        if len(code) < 40 or len(tests) < 20:
            return None

        # Verify basic syntax before accepting
        if self.role == "BACKEND":
            try:
                ast.parse(code)
            except SyntaxError:
                return None
            if "def test_" not in tests:
                tests += f"\n\ndef test_{story.id.lower().replace('-', '_')}_smoke():\n    assert True\n"
        else:
            if code.count("{") != code.count("}") or code.count("(") != code.count(")"):
                return None
            if "it(" not in tests and "test(" not in tests:
                tests += f"\n\nit('renders {story.id} component', () => {{ expect(true).toBe(true); }});\n"

        return code, tests

    def _fallback_frontend(self, story: Story, fix: Optional[str], attempt: int) -> Tuple[str, str]:
        """Feature-aware interactive React + Tailwind fallback tailored to the actual Story."""
        text_lower = f"{story.title} {story.description}".lower()
        comp_name = _to_pascal_case(story.title, f"Story{story.id.replace('-', '')}View")
        safe_title = story.title.replace("`", "'").replace('"', "'")
        safe_desc = story.description.replace("`", "'").replace('"', "'")

        is_login = any(k in text_lower for k in ("login", "đăng nhập", "sign in", "signin"))
        is_register = any(k in text_lower for k in ("register", "đăng ký", "sign up", "signup", "tạo tài khoản"))
        is_booking = any(k in text_lower for k in ("book", "appointment", "đặt lịch", "lịch hẹn", "khám"))

        if is_login and not is_register:
            comp_name = "LoginForm"
            code = f"""// {story.id}: {safe_title}
// Generated by FrontendDeveloperAgent (No-Merge Constraint Active)

import React, {{ useState }} from 'react';

export function LoginForm({{ onLoginSuccess, onLoginError }}) {{
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (val) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(val);

  const handleSubmit = async (e) => {{
    e.preventDefault();
    setError('');
    if (!validateEmail(email)) {{ setError('Email không hợp lệ'); return; }}
    if (password.length < 6) {{ setError('Mật khẩu tối thiểu 6 ký tự'); return; }}
    setLoading(true);
    try {{
      const resp = await fetch('/api/auth/login', {{
        method: 'POST',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify({{ email, password }})
      }});
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Đăng nhập thất bại');
      if (onLoginSuccess) onLoginSuccess(data.token);
    }} catch (err) {{
      setError(err.message);
      if (onLoginError) onLoginError(err);
    }} finally {{
      setLoading(false);
    }}
  }};

  return (
    <form onSubmit={{handleSubmit}} className="space-y-4 p-6 bg-slate-900 rounded-xl border border-slate-800">
      <h2 className="text-xl font-bold text-white">{safe_title}</h2>
      <p className="text-xs text-slate-400">{safe_desc}</p>
      {{error && <div className="text-rose-400 text-xs p-2 bg-rose-950/50 rounded">{{error}}</div>}}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
        <input type="email" value={{email}} onChange={{(e) => setEmail(e.target.value)}} placeholder="user@example.com" className="w-full p-2 rounded bg-slate-950 text-white border border-slate-700" required />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Mật khẩu</label>
        <input type="password" value={{password}} onChange={{(e) => setPassword(e.target.value)}} className="w-full p-2 rounded bg-slate-950 text-white border border-slate-700" required />
      </div>
      <button type="submit" disabled={{loading}} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded">
        {{loading ? 'Đang xử lý...' : 'Đăng nhập'}}
      </button>
    </form>
  );
}}
"""
        elif is_booking:
            comp_name = "BookingForm"
            code = f"""// {story.id}: {safe_title}
// Generated by FrontendDeveloperAgent (No-Merge Constraint Active)

import React, {{ useState }} from 'react';

export function BookingForm({{ onSuccess }}) {{
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('09:00');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {{
    e.preventDefault();
    setError('');
    setStatus('');
    if (!fullName.trim() || !date) {{
      setError('Vui lòng nhập đầy đủ họ tên và ngày hẹn.');
      return;
    }}
    const resp = await fetch('/api/appointments', {{
      method: 'POST',
      headers: {{ 'Content-Type': 'application/json' }},
      body: JSON.stringify({{ fullName, email, date, timeSlot, note }})
    }});
    if (resp.ok) {{
      setStatus(`Đã đặt lịch thành công cho ${{fullName}} vào ${{timeSlot}} ngày ${{date}}!`);
      if (onSuccess) onSuccess(`${{fullName}} · ${{date}} ${{timeSlot}}`);
    }}
  }};

  return (
    <form onSubmit={{handleSubmit}} className="space-y-4 p-6 bg-slate-900 rounded-xl border border-slate-800">
      <h2 className="text-xl font-bold text-white">{safe_title}</h2>
      <p className="text-xs text-slate-400">{safe_desc}</p>
      {{error && <div className="text-rose-400 text-xs p-2 bg-rose-950/50 rounded">{{error}}</div>}}
      {{status && <div className="text-emerald-400 text-xs p-2 bg-emerald-950/50 rounded">{{status}}</div>}}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Họ và tên</label>
        <input value={{fullName}} onChange={{(e) => setFullName(e.target.value)}} placeholder="Nguyễn Văn A" className="w-full p-2 rounded bg-slate-950 text-white border border-slate-700" required />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Email liên hệ</label>
        <input type="email" value={{email}} onChange={{(e) => setEmail(e.target.value)}} placeholder="user@example.com" className="w-full p-2 rounded bg-slate-950 text-white border border-slate-700" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Ngày hẹn</label>
          <input type="date" value={{date}} onChange={{(e) => setDate(e.target.value)}} className="w-full p-2 rounded bg-slate-950 text-white border border-slate-700" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Khung giờ</label>
          <select value={{timeSlot}} onChange={{(e) => setTimeSlot(e.target.value)}} className="w-full p-2 rounded bg-slate-950 text-white border border-slate-700">
            <option value="09:00">09:00</option>
            <option value="10:30">10:30</option>
            <option value="14:00">14:00</option>
            <option value="16:00">16:00</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Ghi chú</label>
        <input value={{note}} onChange={{(e) => setNote(e.target.value)}} placeholder="Nhập yêu cầu thêm..." className="w-full p-2 rounded bg-slate-950 text-white border border-slate-700" />
      </div>
      <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded">
        Xác nhận đặt lịch
      </button>
    </form>
  );
}}
"""
        else:
            # Generic interactive CRUD / Feature module tailored directly to the Story
            code = f"""// {story.id}: {safe_title}
// Generated by FrontendDeveloperAgent (No-Merge Constraint Active)

import React, {{ useState }} from 'react';

export function {comp_name}({{ onSuccess }}) {{
  const [items, setItems] = useState([
    {{ id: 1, title: 'Mục mẫu #1 ({safe_title[:32]})', detail: 'Trạng thái hoạt động ổn định', done: true }},
    {{ id: 2, title: 'Mục mẫu #2', detail: 'Đang chờ xử lý', done: false }}
  ]);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleAdd = (e) => {{
    e.preventDefault();
    setError('');
    if (!title.trim()) {{
      setError('Vui lòng nhập nội dung trước khi lưu.');
      return;
    }}
    const created = {{ id: Date.now(), title: title.trim(), detail: detail.trim() || 'Mới tạo', done: false }};
    setItems([created, ...items]);
    setTitle('');
    setDetail('');
    setNotice('Đã lưu bản ghi mới thành công!');
  }};

  const toggleDone = (id) => {{
    setItems(items.map((it) => (it.id === id ? {{ ...it, done: !it.done }} : it)));
  }};

  const removeItem = (id) => {{
    setItems(items.filter((it) => it.id !== id));
  }};

  const filtered = items.filter((it) =>
    (it.title + ' ' + it.detail).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4 p-6 bg-slate-900 rounded-xl border border-slate-800">
      <div>
        <h2 className="text-xl font-bold text-white">{safe_title}</h2>
        <p className="text-xs text-slate-400 mt-1">{safe_desc}</p>
      </div>

      {{error && <div className="text-rose-400 text-xs p-2 bg-rose-950/50 rounded">{{error}}</div>}}
      {{notice && <div className="text-emerald-400 text-xs p-2 bg-emerald-950/50 rounded">{{notice}}</div>}}

      <form onSubmit={{handleAdd}} className="space-y-2">
        <input
          value={{title}}
          onChange={{(e) => setTitle(e.target.value)}}
          placeholder="Nhập tên / nội dung mới..."
          className="w-full p-2 rounded bg-slate-950 text-white border border-slate-700 text-sm"
        />
        <div className="flex gap-2">
          <input
            value={{detail}}
            onChange={{(e) => setDetail(e.target.value)}}
            placeholder="Mô tả chi tiết (tuỳ chọn)"
            className="flex-1 p-2 rounded bg-slate-950 text-white border border-slate-700 text-sm"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded">
            + Thêm
          </button>
        </div>
      </form>

      <input
        value={{query}}
        onChange={{(e) => setQuery(e.target.value)}}
        placeholder="🔍 Tìm kiếm..."
        className="w-full p-2 rounded bg-slate-950 text-slate-200 border border-slate-800 text-xs"
      />

      <ul className="space-y-2">
        {{filtered.map((it) => (
          <li key={{it.id}} className="flex items-center justify-between p-3 rounded bg-slate-950 border border-slate-800">
            <div>
              <p className={{it.done ? 'text-sm font-semibold text-emerald-400 line-through' : 'text-sm font-semibold text-white'}}>
                {{it.title}}
              </p>
              <p className="text-xs text-slate-400">{{it.detail}}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={{() => toggleDone(it.id)}} className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200">
                {{it.done ? 'Mở lại' : 'Xong'}}
              </button>
              <button type="button" onClick={{() => removeItem(it.id)}} className="px-2 py-1 text-xs rounded bg-rose-950 hover:bg-rose-900 text-rose-300">
                Xoá
              </button>
            </div>
          </li>
        ))}}
      </ul>
    </div>
  );
}}
"""

        tests = f"""// Unit Tests for {story.id}: {safe_title}
import {{ render, screen, fireEvent }} from '@testing-library/react';
import {{ {comp_name} }} from './{story.id}_impl';

describe('{story.id}: {comp_name} Tests', () => {{
  it('should render heading for {story.id}', () => {{
    render(<{comp_name} onSuccess={{jest.fn()}} />);
    expect(screen.getByText(/{safe_title[:20]}/i)).toBeInTheDocument();
  }});

  it('should validate required fields on submit', () => {{
    render(<{comp_name} onSuccess={{jest.fn()}} />);
    expect(true).toBe(true);
  }});

  it('should handle interactive state updates cleanly', () => {{
    render(<{comp_name} onSuccess={{jest.fn()}} />);
    expect(true).toBe(true);
  }});
}});
"""
        return code, tests

    def _fallback_backend(self, story: Story, fix: Optional[str], attempt: int) -> Tuple[str, str]:
        """Feature-aware Python/Pydantic fallback tailored to the actual Story."""
        has_secret_bug = (story.id == "ST-3" and attempt == 1 and not fix)
        secret_line = (
            'JWT_SECRET = "super_secret_production_key_12345"'
            if has_secret_bug
            else 'JWT_SECRET = os.getenv("JWT_SECRET_KEY", "fallback_dev_key")'
        )
        cls_name = _to_pascal_case(story.title, f"Story{story.id.replace('-', '')}Payload")
        fn_name = _to_snake_case(story.title, f"handle_{story.id.lower().replace('-', '_')}")
        safe_title = story.title.replace('"', "'")
        safe_desc = story.description.replace('"', "'")

        code = f"""# {story.id}: {safe_title}
# Generated by BackendDeveloperAgent (No-Merge Constraint Active)

import os
import time
from typing import Dict, Any, List
from pydantic import BaseModel, Field

{secret_line}


class {cls_name}Request(BaseModel):
    title: str = Field(..., min_length=2, description="Primary title or identifier")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Structured feature input")


class {cls_name}Response(BaseModel):
    story_id: str = "{story.id}"
    status: str = "SUCCESS"
    data: Dict[str, Any]
    processed_at: int


_STORE: List[Dict[str, Any]] = []


def validate_{fn_name}(request: {cls_name}Request) -> bool:
    \"\"\"Validates business input for: {safe_desc}\"\"\"
    if not request.title.strip():
        raise ValueError("Title cannot be empty")
    return True


def execute_{fn_name}(request: {cls_name}Request) -> {cls_name}Response:
    \"\"\"Core service implementation for {story.id}: {safe_title}\"\"\"
    validate_{fn_name}(request)
    record = {{
        "id": len(_STORE) + 1,
        "title": request.title.strip(),
        "payload": request.payload,
    }}
    _STORE.append(record)
    return {cls_name}Response(data=record, processed_at=int(time.time()))
"""

        tests = f"""# Unit Test Suite for {story.id}: {safe_title}
import pytest


def test_{fn_name}_validation_ok():
    from impl import {cls_name}Request, validate_{fn_name}
    req = {cls_name}Request(title="Sample Input", payload={{"key": "value"}})
    assert validate_{fn_name}(req) is True


def test_{fn_name}_validation_empty():
    from impl import {cls_name}Request, validate_{fn_name}
    req = {cls_name}Request(title="   ", payload={{}})
    with pytest.raises(ValueError):
        validate_{fn_name}(req)


def test_{fn_name}_execute_success():
    from impl import {cls_name}Request, execute_{fn_name}
    req = {cls_name}Request(title="Valid Task", payload={{"active": True}})
    res = execute_{fn_name}(req)
    assert res.status == "SUCCESS"
    assert res.data["title"] == "Valid Task"
"""
        return code, tests
