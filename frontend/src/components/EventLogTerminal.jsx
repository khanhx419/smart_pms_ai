import React, { useRef, useEffect, useState } from 'react';
import { Terminal, Trash2, ArrowDownCircle } from 'lucide-react';

const EVENT_COLORS = {
  STORY_CREATED: 'text-purple-400 bg-purple-950/40 border-purple-800/60',
  DEV_START: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60',
  CODE_GENERATED: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
  DEV_REFACTOR: 'text-yellow-300 bg-yellow-950/40 border-yellow-800/60',
  QA_START: 'text-slate-400 bg-slate-900 border-slate-700',
  QA_PASS: 'text-emerald-300 bg-emerald-950/40 border-emerald-800/60',
  QA_FAIL: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
  SELF_CORRECTION_TRIGGERED: 'text-amber-300 bg-amber-950/60 border-amber-600',
  GOV_START: 'text-slate-400 bg-slate-900 border-slate-700',
  GOV_PASS: 'text-emerald-400 bg-emerald-950/60 border-emerald-600',
  GOV_FAIL: 'text-rose-400 bg-rose-950/60 border-rose-600',
  GOV_REMEDIATION_TRIGGERED: 'text-rose-300 bg-rose-950/80 border-rose-500 font-bold',
  STORY_COMPLETED: 'text-teal-300 bg-teal-950/60 border-teal-600 font-bold',
  SPRINT_COMPLETE: 'text-emerald-200 bg-emerald-900/60 border-emerald-400 font-black',
};

export default function EventLogTerminal({ events = [], onClear }) {
  const terminalRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-80 sm:h-96">
      {/* Terminal Header */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 ml-2">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            Live Agent Event Log Stream (Section 3.4 & 5.6)
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <span>Auto-scroll</span>
          </label>

          {onClear && (
            <button
              onClick={onClear}
              className="p-1 text-slate-500 hover:text-slate-300 transition"
              title="Clear terminal logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={terminalRef}
        className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2 select-text"
      >
        {events.length === 0 ? (
          <div className="text-slate-600 italic text-center pt-24">
            Chưa có sự kiện nào. Hãy nhấn "Chạy SDLC Workflow" để kích hoạt các Agent...
          </div>
        ) : (
          events.map((ev, i) => {
            const colorClass = EVENT_COLORS[ev.type] || 'text-slate-300 bg-slate-900 border-slate-800';
            const timeStr = ev.datetime ? ev.datetime.split(' ')[1] : '';

            return (
              <div
                key={i}
                className="flex items-start gap-2.5 py-1 px-2 rounded hover:bg-slate-900/50 transition-colors leading-relaxed"
              >
                <span className="text-[10px] text-slate-600 flex-shrink-0 select-none pt-0.5">
                  {timeStr}
                </span>

                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border flex-shrink-0 ${colorClass}`}
                >
                  {ev.type}
                </span>

                <span className="text-slate-200 text-xs break-words">
                  {ev.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
