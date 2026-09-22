import React, { useState } from 'react';
import { Play, Sparkles, Shield, ShieldAlert, ShieldCheck, Zap, Sliders } from 'lucide-react';

const EPIC_PRESETS = [
  {
    title: 'Epic Luận văn (Chapter 4.1)',
    text: 'Create a user login page with email validation',
  },
  {
    title: 'Epic E-Commerce Checkout',
    text: 'Implement checkout payment flow with order persistence and webhook confirmation',
  },
  {
    title: 'Epic CRM Pipeline',
    text: 'Build customer lead intake form with automated lead scoring and contact assignment',
  },
];

export default function WorkflowControlPanel({ onRun, isRunning }) {
  const [epic, setEpic] = useState('Create a user login page with email validation');
  const [governanceMode, setGovernanceMode] = useState('STRICT');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!epic.trim() || isRunning) return;
    onRun(epic.trim(), governanceMode);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header & Preset Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Thiết lập Sprint & Chế độ Quản trị (Section 3.5)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chọn Epic và cấp độ hàng rào bảo vệ (Guardrail level) trước khi kích hoạt Coordinator Agent.
            </p>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {EPIC_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setEpic(preset.text)}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        {/* Epic Text Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Mô tả Epic (Natural Language Product Requirement)
          </label>
          <textarea
            rows={2}
            value={epic}
            onChange={(e) => setEpic(e.target.value)}
            placeholder="Nhập yêu cầu cấp cao..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-sans resize-none"
            required
          />
        </div>

        {/* Governance Mode Selection Cards */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Chọn Chế độ Quản trị (Governance Mode)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* OFF Mode */}
            <div
              onClick={() => setGovernanceMode('OFF')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                governanceMode === 'OFF'
                  ? 'bg-slate-800 border-slate-500 ring-2 ring-slate-400 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-slate-400" />
                  OFF Mode
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Control
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Tốc độ tối đa, không kiểm tra QA/Security. Nguy cơ lọt lỗi bảo mật cao.
              </p>
            </div>

            {/* BASIC Mode */}
            <div
              onClick={() => setGovernanceMode('BASIC')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                governanceMode === 'BASIC'
                  ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-400 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  BASIC Mode
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-700">
                  Cân bằng
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Kiểm tra nhẹ: có unit test, cú pháp cơ bản. Đạt AV cao nhất (~46.9 feat/hr).
              </p>
            </div>

            {/* STRICT Mode */}
            <div
              onClick={() => setGovernanceMode('STRICT')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                governanceMode === 'STRICT'
                  ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-400 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                  STRICT Mode
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-900/40 text-rose-300 border border-rose-700">
                  Guardrails
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Quét bảo mật Bandit SAST, chặn hardcoded secret key, tỷ lệ duyệt quản trị 100%.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isRunning}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang vận hành Multi-Agent Workflow...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Chạy SDLC Workflow ({governanceMode})
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
