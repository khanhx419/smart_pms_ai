import React from 'react';
import { Network, Brain, Code, Server, ShieldCheck, CheckCircle, Cpu, RefreshCcw } from 'lucide-react';

const AGENT_NODES = [
  {
    id: 'StoryPlannerAgent',
    name: 'Story Planner',
    role: 'Requirements & Fibonacci',
    icon: Brain,
    color: 'text-purple-400 border-purple-500/40 bg-purple-950/30',
    pos: 'top-2 left-1/2 -translate-x-1/2',
  },
  {
    id: 'BackendDeveloperAgent',
    name: 'Backend Dev',
    role: 'FastAPI & Schemas',
    icon: Server,
    color: 'text-blue-400 border-blue-500/40 bg-blue-950/30',
    pos: 'top-20 right-4 sm:right-12',
  },
  {
    id: 'QaAgent',
    name: 'QA Agent',
    role: 'Tests & SCR Loop',
    icon: CheckCircle,
    color: 'text-amber-400 border-amber-500/40 bg-amber-950/30',
    pos: 'bottom-4 right-8 sm:right-16',
  },
  {
    id: 'PmGovernanceAgent',
    name: 'PM Governance',
    role: 'Guardrails & SAST',
    icon: ShieldCheck,
    color: 'text-rose-400 border-rose-500/40 bg-rose-950/30',
    pos: 'bottom-4 left-8 sm:left-16',
  },
  {
    id: 'FrontendDeveloperAgent',
    name: 'Frontend Dev',
    role: 'React & UI Tests',
    icon: Code,
    color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/30',
    pos: 'top-20 left-4 sm:left-12',
  },
];

export default function HubSpokeVisualizer({ activeAgent, isRunning, governanceMode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Network className="w-4 h-4 text-emerald-400" />
            Kiến trúc Hub-and-Spoke Multi-Agent (Section 5.1)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Coordinator đóng vai trò trung tâm (Hub), kết nối các Agent vệ tinh (Spokes) qua giao thức có trật tự.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Governance:</span>
          <span
            className={`font-mono font-bold px-2 py-0.5 rounded-full border ${
              governanceMode === 'STRICT'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : governanceMode === 'BASIC'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-slate-700 text-slate-300 border-slate-600'
            }`}
          >
            {governanceMode}
          </span>
        </div>
      </div>

      {/* Hub and Spoke Interactive Arena */}
      <div className="relative h-80 sm:h-96 w-full flex items-center justify-center">
        {/* Background Radar Rings */}
        <div className="absolute w-72 h-72 rounded-full border border-slate-800/80 pointer-events-none" />
        <div className="absolute w-52 h-52 rounded-full border border-slate-800/60 pointer-events-none" />

        {/* Central Hub Node */}
        <div
          className={`relative z-20 w-32 h-32 rounded-3xl border-2 flex flex-col items-center justify-center text-center p-2 transition-all duration-500 ${
            isRunning
              ? 'bg-emerald-950/50 border-emerald-400 shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-500/20'
              : 'bg-slate-950 border-slate-700 shadow-lg'
          }`}
        >
          <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-1">
            <Cpu className={`w-6 h-6 ${isRunning ? 'animate-pulse' : ''}`} />
          </div>
          <span className="text-xs font-black text-white leading-tight">Coordinator</span>
          <span className="text-[10px] font-medium text-slate-400">Hub Controller</span>
        </div>

        {/* Spoke Nodes */}
        {AGENT_NODES.map((agent) => {
          const Icon = agent.icon;
          const isActive = activeAgent === agent.id;

          return (
            <div
              key={agent.id}
              className={`absolute ${agent.pos} z-20 flex flex-col items-center transition-all duration-300`}
            >
              <div
                className={`w-28 p-2.5 rounded-2xl border flex flex-col items-center text-center transition-all ${
                  isActive
                    ? 'scale-110 shadow-xl ring-2 ring-emerald-400 bg-slate-800 border-emerald-400 text-white'
                    : `${agent.color} text-slate-300`
                }`}
              >
                <div className="p-1.5 rounded-xl bg-slate-900/80 mb-1">
                  <Icon className={`w-4 h-4 ${isActive ? 'animate-bounce text-emerald-400' : ''}`} />
                </div>
                <span className="text-xs font-bold leading-tight truncate w-full">{agent.name}</span>
                <span className="text-[10px] text-slate-400 truncate w-full">{agent.role}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Status Indicator */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
            }`}
          />
          <span>
            {isRunning ? (
              <>
                Đang thực thi: <b className="text-emerald-300 font-mono">{activeAgent || 'Coordinator'}</b>
              </>
            ) : (
              'Trạng thái: Sẵn sàng thực thi'
            )}
          </span>
        </div>

        <span className="text-[11px] text-slate-500">
          No-Merge Constraint Active • Self-Correction Loops Enabled
        </span>
      </div>
    </div>
  );
}
