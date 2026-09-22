import React from 'react';
import { Gauge, RefreshCcw, ShieldCheck, CheckCircle2, Clock, Zap } from 'lucide-react';

export default function KpiCards({ metrics }) {
  if (!metrics) return null;

  const av = metrics.agentic_velocity_features_per_hour ?? 0;
  const scr = metrics.self_correction_ratio ?? 0;
  const goSec = metrics.governance_overhead_seconds ?? 0;
  const goMin = metrics.governance_overhead_minutes ?? 0;
  const qaPassRate = metrics.qa_pass_rate_percent ?? 100;
  const govPassRate = metrics.governance_pass_rate_percent ?? 100;
  const storiesCompleted = metrics.stories_completed ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Agentic Velocity (AV) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Agentic Velocity (AV)
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-white font-mono">
          {av} <span className="text-xs font-normal text-slate-400 font-sans">features/hr</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 font-mono">
          Công thức: Completed / (Total_Sec / 3600)
        </p>
      </div>

      {/* 2. Self-Correction Ratio (SCR) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Self-Correction Ratio (SCR)
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RefreshCcw className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-amber-400 font-mono">
          {scr}
        </div>
        <p className="text-[11px] text-slate-500 mt-2 font-mono">
          Công thức: QA_Rejections / Total_Submissions
        </p>
      </div>

      {/* 3. Governance Overhead (GO) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-purple-500/50 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Governance Overhead (GO)
          </span>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-purple-300 font-mono">
          {goSec}s <span className="text-xs font-normal text-slate-400 font-sans">({goMin} min)</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 font-mono">
          Công thức: Σ(GOV_Approval - QA_PASS)
        </p>
      </div>

      {/* 4. QA & Governance Pass Rates */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-blue-500/50 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Compliance & Stories
          </span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <div className="text-2xl font-black text-white font-mono">
            {storiesCompleted} <span className="text-xs font-normal text-slate-400 font-sans">stories</span>
          </div>
          <span className="text-xs font-semibold text-emerald-400">
            {govPassRate}% Gov
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          QA Pass Rate: <b className="text-slate-300">{qaPassRate}%</b> • First-pass quality
        </p>
      </div>
    </div>
  );
}
