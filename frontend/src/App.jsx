import React, { useState, useEffect } from 'react';
import { Layers, Activity, Users, Shield } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import { api } from './services/api';

export default function App() {
  const [currentProjectId, setCurrentProjectId] = useState(1); // Default to sample project 1
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setSystemHealth(data.data?.status === 'healthy'))
      .catch(() => setSystemHealth(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div
            onClick={() => setCurrentProjectId(null)}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                Smart PMS <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">AI + CPM</span>
              </div>
              <div className="text-[10px] text-slate-400">Hệ thống Quản lý Dự án & Đường găng</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* Health Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">
              <span
                className={`w-2 h-2 rounded-full ${
                  systemHealth === true
                    ? 'bg-emerald-400 animate-pulse'
                    : systemHealth === false
                    ? 'bg-rose-400'
                    : 'bg-amber-400 animate-ping'
                }`}
              />
              <span className="text-slate-300 font-medium">
                {systemHealth ? 'API & DB Sẵn sàng' : 'Đang kết nối...'}
              </span>
            </div>

            {currentProjectId && (
              <button
                onClick={() => setCurrentProjectId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                Tất cả Dự án
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentProjectId ? (
          <ProjectDetail
            projectId={currentProjectId}
            onBack={() => setCurrentProjectId(null)}
          />
        ) : (
          <Dashboard onSelectProject={(id) => setCurrentProjectId(id)} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>Smart Project Management System © 2026 — AI WBS Decomposition, Kahn DAG PERT/CPM, Working Calendar & Database Locking.</p>
      </footer>
    </div>
  );
}
