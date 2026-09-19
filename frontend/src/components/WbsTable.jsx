import React from 'react';
import { User, AlertTriangle, CheckCircle2, PlayCircle, Clock, ShieldAlert, Trash2, Edit3 } from 'lucide-react';

const STATUS_CONFIG = {
  TODO: { label: 'Cần làm', color: 'bg-slate-700 text-slate-300 border-slate-600', icon: Clock },
  IN_PROGRESS: { label: 'Đang làm', color: 'bg-blue-900/70 text-blue-300 border-blue-600', icon: PlayCircle },
  DONE: { label: 'Hoàn thành', color: 'bg-emerald-900/70 text-emerald-300 border-emerald-600', icon: CheckCircle2 },
  BLOCKED: { label: 'Bị chặn', color: 'bg-rose-900/70 text-rose-300 border-rose-600', icon: AlertTriangle },
};

export default function WbsTable({ tasks = [], onStatusChange, onDeleteTask, onEditTask }) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Bảng phân rã công việc (Work Breakdown Structure - WBS)</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Dữ liệu tính toán chi tiết từ thuật toán PERT/CPM và Working Calendar.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-300">
          Tổng cộng: {tasks.length} công việc
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700 uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4 w-14">ID</th>
              <th className="py-3.5 px-4 min-w-[220px]">Tên Công Việc</th>
              <th className="py-3.5 px-4 min-w-[150px]">Người Phụ Trách</th>
              <th className="py-3.5 px-3 text-center">Giờ</th>
              <th className="py-3.5 px-3">Bắt đầu (ES)</th>
              <th className="py-3.5 px-3">Kết thúc (EF)</th>
              <th className="py-3.5 px-3 text-center" title="Early Start / Early Finish">ES / EF</th>
              <th className="py-3.5 px-3 text-center" title="Late Start / Late Finish">LS / LF</th>
              <th className="py-3.5 px-3 text-center" title="Slack = LS - ES">Slack</th>
              <th className="py-3.5 px-3 text-center">Đường Găng</th>
              <th className="py-3.5 px-3 text-center">Phụ thuộc</th>
              <th className="py-3.5 px-3">Trạng thái</th>
              <th className="py-3.5 px-3 text-center">Version</th>
              <th className="py-3.5 px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {tasks.map((task) => {
              const isCritical = Boolean(task.is_critical);
              const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO;
              const StatusIcon = statusCfg.icon;

              return (
                <tr
                  key={task.id}
                  className={`transition-colors hover:bg-slate-800/40 ${
                    isCritical ? 'bg-rose-950/15' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-400">
                    #{task.id}
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-200">
                    <div className="flex items-center gap-2">
                      {isCritical && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0 animate-pulse" />
                      )}
                      <span>{task.name}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {task.assignee_name ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                          {task.assignee_name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-slate-200 font-medium leading-tight">{task.assignee_name}</div>
                          <div className="text-[10px] text-slate-400 leading-tight">{task.assignee_role}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Chưa phân công</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center font-semibold text-slate-300">
                    {task.duration_hours}h
                  </td>

                  <td className="py-3 px-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                    {task.start_date ? task.start_date.substring(5, 16) : '-'}
                  </td>

                  <td className="py-3 px-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                    {task.end_date ? task.end_date.substring(5, 16) : '-'}
                  </td>

                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    {task.early_start} / {task.early_finish}
                  </td>

                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    {task.late_start} / {task.late_finish}
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-semibold">
                    <span className={task.slack === 0 ? 'text-rose-400' : 'text-emerald-400'}>
                      {task.slack}h
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center">
                    {isCritical ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        CRITICAL
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">-</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {task.dependencies && task.dependencies.length > 0 ? (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {task.dependencies.map((depId) => (
                          <span
                            key={depId}
                            className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700"
                          >
                            #{depId}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[10px] italic">Gốc</span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    <button
                      onClick={() => onStatusChange && onStatusChange(task)}
                      title="Bấm để đổi trạng thái (với kiểm tra khóa Race Condition)"
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all hover:scale-105 ${statusCfg.color}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusCfg.label}
                    </button>
                  </td>

                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    v{task.version}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {onEditTask && (
                        <button
                          onClick={() => onEditTask(task)}
                          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                          title="Sửa công việc"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeleteTask && (
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Xóa công việc"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
