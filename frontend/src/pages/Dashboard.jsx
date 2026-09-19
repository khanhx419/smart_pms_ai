import React, { useState, useEffect } from 'react';
import { FolderGit2, Plus, Calendar, Users, Cpu, ShieldCheck, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard({ onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    start_date: '2026-09-21 08:00:00',
    status: 'PLANNING',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [projRes, userRes] = await Promise.all([
        api.getProjects(),
        api.getUsers(),
      ]);
      setProjects(projRes.data || []);
      setUsers(userRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;

    try {
      const res = await api.createProject(newProject);
      setShowCreateModal(false);
      setNewProject({
        name: '',
        description: '',
        start_date: '2026-09-21 08:00:00',
        status: 'PLANNING',
      });
      loadData();
      if (res.data?.id) {
        onSelectProject(res.data.id);
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi tạo dự án');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
            <Cpu className="w-3.5 h-3.5" />
            AI-Powered Work Breakdown & PERT/CPM Scheduling
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Hệ thống Quản lý Dự án Thông minh (Smart PMS)
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Tự động bóc tách tài liệu Use Case thành WBS bằng AI, giải quyết bài toán ánh xạ ID tạm thời sang ID thực tế, quy đổi Working Calendar (8h/ngày, bỏ qua T7-CN) và tính toán đường găng chính xác.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              Tạo Dự án Mới
            </button>
          </div>
        </div>

        {/* Decorative Badge */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3 text-xs">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-300 backdrop-blur">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Pessimistic Locking & Versioning</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-300 backdrop-blur">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>Lịch làm việc thực tế (Working Calendar)</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-300 backdrop-blur">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Phân bổ tài nguyên theo chuyên môn</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{projects.length}</div>
            <div className="text-xs text-slate-400">Tổng số Dự án</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{users.length}</div>
            <div className="text-xs text-slate-400">Nhân sự thực thi (Roles)</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">PERT / CPM</div>
            <div className="text-xs text-slate-400">Kahn DAG & Forward/Backward Pass</div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-emerald-400" />
            Danh sách Dự án
          </h2>
          <span className="text-xs text-slate-400">Chọn một dự án để xem chi tiết & biểu đồ Gantt</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Đang tải danh sách dự án...</div>
        ) : projects.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
            <FolderGit2 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-base font-semibold">Chưa có dự án nào</p>
            <p className="text-xs text-slate-500 mt-1">Bấm nút "Tạo Dự án Mới" để bắt đầu thiết lập dự án đầu tiên.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      ID: #{p.id}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {p.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1 mb-2">
                    {p.name}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {p.description || 'Chưa có mô tả chi tiết cho dự án này.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{p.task_count || 0} công việc</span>
                  </div>

                  <span className="flex items-center gap-1 font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
                    Xem chi tiết <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Khởi tạo Dự án Mới</h3>
            <p className="text-xs text-slate-400 mb-5">
              Thiết lập thông tin ban đầu và ngày bắt đầu theo Working Calendar.
            </p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên Dự án *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Ví dụ: Nền tảng Fintech & Thanh toán..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mô tả Dự án
                </label>
                <textarea
                  rows={3}
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Mô tả phạm vi và mục tiêu triển khai..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ngày bắt đầu (Working Calendar)
                </label>
                <input
                  type="text"
                  value={newProject.start_date}
                  onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition"
                >
                  Tạo Dự án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
