import React, { useState, useEffect } from 'react';
import { Cpu, Network, BarChart3, FlaskConical, BookOpen, ShieldCheck, CheckCircle2 } from 'lucide-react';
import LabDashboard from './pages/LabDashboard';
import ResearchBenchmark from './pages/ResearchBenchmark';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('lab'); // 'lab' | 'benchmarks'
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    api.getHealth()
      .then((res) => setSystemHealth(res.data?.status === 'healthy'))
      .catch(() => setSystemHealth(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 select-none">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-base tracking-tight text-white flex items-center gap-2">
                Agentic SDLC Governance Lab
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  VAMK Thesis 2026
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                A Project Management Framework for Control & Quality Assurance (Muhammad Awais)
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3 text-xs">
            {/* Health Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800">
              <span
                className={`w-2 h-2 rounded-full ${
                  systemHealth === true
                    ? 'bg-emerald-400 animate-pulse'
                    : systemHealth === false
                    ? 'bg-rose-400'
                    : 'bg-amber-400 animate-ping'
                }`}
              />
              <span className="text-slate-300 font-mono text-[11px]">
                {systemHealth ? 'FastAPI Agent Engine Sẵn sàng' : 'Đang kết nối Engine...'}
              </span>
            </div>

            {/* Tab Pills */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('lab')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'lab'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                Phòng Thí Nghiệm
              </button>

              <button
                onClick={() => setActiveTab('benchmarks')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'benchmarks'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Đối Chuẩn Nghiên Cứu
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'lab' ? <LabDashboard /> : <ResearchBenchmark />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500 space-y-1">
        <p>
          <b>Agentic SDLC Governance Laboratory</b> — Vaasan Ammattikorkeakoulu (VAMK) University of Applied Sciences.
        </p>
        <p className="text-[11px] text-slate-600">
          Hub-and-Spoke Orchestration • Self-Correction Loops • Scientific Guardrails • AV, SCR, GO Metrics
        </p>
      </footer>
    </div>
  );
}
