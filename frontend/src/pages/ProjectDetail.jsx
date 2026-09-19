import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Calendar,
  Clock,
  AlertOctagon,
  CheckCircle2,
  FolderGit2,
  Plus,
  SlidersHorizontal,
  Table as TableIcon,
  BarChart3,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import GanttChart from '../components/GanttChart';
import WbsTable from '../components/WbsTable';
import AiRequirementModal from '../components/AiRequirementModal';
import TaskStatusModal from '../components/TaskStatusModal';

export default function ProjectDetail({ projectId, onBack }) {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('gantt'); // 'gantt' | 'wbs'
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedTaskForStatus, setSelectedTaskForStatus] = useState(null);
  const [recalculating, setRecalculating] = useState(false);

  const loadProject = async () => {
    try {
      setLoading(true);
      const res = await api.getProject(projectId);
      setProject(res.data);
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Lỗi khi tải thông tin dự án');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      const res = await api.recalculateSchedule(projectId);
      setTasks(res.data.tasks || []);
    } catch (err) {
      alert(err.message || 'Lỗi khi tính toán lại PERT/CPM');
    } finally {
      setRecalculating(false);
    }
  };

  const handleAiSuccess = (aiData) => {
    // aiData contains tasks, id_resolution_map, total_duration, critical_task_ids, etc.
    setTasks(aiData.tasks || []);
    loadProject();
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
    );
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa công việc #${taskId}?`)) return;
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      handleRecalculate();
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa công việc');
    }
  };

  // Metrics calculation
  const criticalCount = tasks.filter((t) => t.is_critical).length;
  const totalDuration = tasks.reduce((max, t) => Math.max(max, t.early_finish || 0), 0);
  const latestEndDate = tasks.reduce((latest, t) => {
    if (!t.end_date) return latest;
    return !latest || t.end_date > latest ? t.end_date : latest;
  }, null);

  if (loading && !project) {
    return (
      <div className="p-16 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-emerald-400" />
        Đang tải thông tin dự án #{projectId}...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 text-center text-rose-400">
        Không tìm thấy dự án #{projectId}.
        <div className="mt-4">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
          >
            Quay lại Danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Danh sách
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRecalculate}
              disabled={recalculating || tasks.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
              title="Tính lại ES, EF, LS, LF, Slack và Critical Path theo Working Calendar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin text-emerald-400' : ''}`} />
              Tính lại PERT/CPM
            </button>

            <button
              onClick={() => setShowAiModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/25 transition"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              AI Bóc tách WBS
            </button>
          </div>
        </div>

        {/* Project Title & Description */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
              #{project.id}
            </span>
            <h1 className="text-2xl font-black text-white">{project.name}</h1>
          </div>
          {project.description && (
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <div className="text-slate-400 flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Bắt đầu (Working Calendar)
            </div>
            <div className="text-slate-100 font-mono font-semibold">
              {project.start_date ? project.start_date.substring(0, 16) : 'N/A'}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <div className="text-slate-400 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Thời lượng Critical Path
            </div>
            <div className="text-emerald-400 font-mono font-bold text-sm">
              {totalDuration} giờ làm việc ({Math.ceil(totalDuration / 8)} ngày)
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <div className="text-slate-400 flex items-center gap-1.5 mb-1">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              Công việc găng (Critical)
            </div>
            <div className="text-rose-400 font-mono font-bold text-sm">
              {criticalCount} / {tasks.length} tasks
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <div className="text-slate-400 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              Dự kiến bàn giao (EF)
            </div>
            <div className="text-purple-300 font-mono font-semibold">
              {latestEndDate ? latestEndDate.substring(0, 16) : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('gantt')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'gantt'
              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Biểu đồ Tiến độ Gantt (PERT/CPM)
        </button>

        <button
          onClick={() => setActiveTab('wbs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'wbs'
              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          Bảng WBS chi tiết ({tasks.length})
        </button>
      </div>

      {/* Main Content by Tab */}
      {activeTab === 'gantt' ? (
        <GanttChart
          tasks={tasks}
          projectStartDate={project.start_date}
          onTaskClick={(task) => setSelectedTaskForStatus(task)}
        />
      ) : (
        <WbsTable
          tasks={tasks}
          onStatusChange={(task) => setSelectedTaskForStatus(task)}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {/* Modals */}
      {showAiModal && (
        <AiRequirementModal
          projectId={projectId}
          currentStartDate={project.start_date}
          onClose={() => setShowAiModal(false)}
          onSuccess={handleAiSuccess}
        />
      )}

      {selectedTaskForStatus && (
        <TaskStatusModal
          task={selectedTaskForStatus}
          onClose={() => setSelectedTaskForStatus(null)}
          onUpdated={handleTaskUpdated}
        />
      )}
    </div>
  );
}
