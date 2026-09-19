import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, RefreshCw, AlertTriangle, PlayCircle, Clock } from 'lucide-react';
import { api } from '../services/api';

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'Cần làm (TODO)', color: 'bg-slate-700 hover:bg-slate-600', icon: Clock },
  { value: 'IN_PROGRESS', label: 'Đang làm (IN PROGRESS)', color: 'bg-blue-700 hover:bg-blue-600', icon: PlayCircle },
  { value: 'DONE', label: 'Hoàn thành (DONE)', color: 'bg-emerald-700 hover:bg-emerald-600', icon: CheckCircle2 },
  { value: 'BLOCKED', label: 'Bị chặn (BLOCKED)', color: 'bg-rose-700 hover:bg-rose-600', icon: AlertTriangle },
];

export default function TaskStatusModal({ task, onClose, onUpdated }) {
  const [selectedStatus, setSelectedStatus] = useState(task.status);
  const [loading, setLoading] = useState(false);
  const [conflictError, setConflictError] = useState(null);
  const [simulateConflict, setSimulateConflict] = useState(false);

  if (!task) return null;

  const handleUpdate = async () => {
    setLoading(true);
    setConflictError(null);

    // If simulate conflict is checked, intentionally pass a stale version (e.g. current - 1 or current + 99)
    const versionToSend = simulateConflict ? task.version - 1 : task.version;

    try {
      const res = await api.updateTaskStatus(task.id, selectedStatus, versionToSend);
      onUpdated(res.data.task);
      onClose();
    } catch (err) {
      if (err.status === 409) {
        setConflictError({
          message: err.message,
          currentVersion: err.details?.current_version,
          currentTask: err.details?.current_task,
        });
      } else {
        alert(err.message || 'Lỗi khi cập nhật trạng thái');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Cập nhật Trạng thái Công việc</h3>
            <p className="text-xs text-slate-400">
              Kiểm soát xung đột với <span className="text-emerald-400 font-mono font-semibold">Pessimistic DB Lock</span> & <span className="text-emerald-400 font-mono font-semibold">Version v{task.version}</span>
            </p>
          </div>
        </div>

        {/* Task Info Summary */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 mb-5 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-400">Công việc:</span>
            <span className="text-slate-200 font-semibold text-right max-w-[280px] truncate">#{task.id} - {task.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Người thực hiện:</span>
            <span className="text-emerald-400 font-medium">{task.assignee_name || 'Chưa gán'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Phiên bản hiện tại (Version):</span>
            <span className="text-amber-400 font-mono font-bold">v{task.version}</span>
          </div>
        </div>

        {/* Status Selection */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Chọn trạng thái mới
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {STATUS_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedStatus(opt.value)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-blue-600/30 border-blue-500 text-white shadow-lg ring-1 ring-blue-400'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Race Condition Simulator Switch */}
        <div className="mb-5 p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-center justify-between">
          <div className="text-xs pr-2">
            <div className="font-semibold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Thử nghiệm Race Condition
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Cố ý gửi version cũ (v{task.version - 1}) để kiểm tra Stored Procedure ngăn chặn ghi đè.
            </p>
          </div>
          <input
            type="checkbox"
            checked={simulateConflict}
            onChange={(e) => setSimulateConflict(e.target.checked)}
            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-800 border-slate-600"
          />
        </div>

        {/* Conflict Error Message Alert */}
        {conflictError && (
          <div className="mb-5 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-200">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Xung đột cập nhật đồng thời (HTTP 409 Conflict)
            </div>
            <p className="text-[11px] leading-relaxed text-rose-300/90">
              {conflictError.message}
            </p>
            <div className="pt-1 flex items-center justify-between border-t border-rose-800/50 text-[11px]">
              <span>Phiên bản mới nhất trong DB: <b>v{conflictError.currentVersion}</b></span>
              <button
                onClick={() => {
                  if (conflictError.currentTask) {
                    onUpdated(conflictError.currentTask);
                  }
                  onClose();
                }}
                className="px-2.5 py-1 rounded bg-rose-700 hover:bg-rose-600 text-white font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Tải lại dữ liệu mới nhất
              </button>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Đang khóa & lưu...
              </>
            ) : (
              'Cập nhật trạng thái'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
