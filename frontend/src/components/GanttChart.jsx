import React, { useMemo } from 'react';
import { Calendar, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export default function GanttChart({ tasks = [], projectStartDate, onTaskClick }) {
  // Sort tasks by early start
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => (a.early_start || 0) - (b.early_start || 0));
  }, [tasks]);

  const maxHours = useMemo(() => {
    let max = 0;
    tasks.forEach((t) => {
      const finish = (t.early_finish || 0);
      if (finish > max) max = finish;
    });
    return Math.max(max, 40); // at least 40h
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
        <Clock className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <p className="text-lg font-medium">Chưa có công việc nào trong biểu đồ Gantt</p>
        <p className="text-sm text-slate-500 mt-1">
          Hãy nhập tài liệu Use Case hoặc thêm task để hệ thống tự động vẽ đường găng (Critical Path).
        </p>
      </div>
    );
  }

  // Calculate scale step so marks never overlap
  const workingDays = Math.ceil(maxHours / 8);
  const stepDays = workingDays > 14 ? 2 : 1;
  const dayMarks = [];
  for (let d = 0; d <= workingDays; d += stepDays) {
    dayMarks.push(d * 8);
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            Biểu đồ Tiến độ Gantt & Đường găng (PERT/CPM)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Các công việc bôi đỏ thuộc <span className="text-rose-400 font-semibold">Đường găng (Critical Path, Slack = 0)</span> quyết định thời hạn bàn giao dự án.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-500/80 border border-rose-400"></span>
            <span className="text-slate-300">Công việc găng (Critical)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-600/80 border border-emerald-400"></span>
            <span className="text-slate-300">Công việc có độ trễ (Slack &gt; 0)</span>
          </div>
        </div>
      </div>

      {/* Gantt Timeline Container */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[1050px]">
          {/* Header Scale (Working Days & Hours) */}
          <div className="flex border-b border-slate-800 pb-2 mb-4 text-xs font-semibold text-slate-400">
            <div className="w-64 flex-shrink-0 pr-4">Công việc & Người thực thi</div>
            <div className="flex-1 relative h-6">
              {dayMarks.map((hour) => {
                const leftPercent = (hour / maxHours) * 100;
                if (leftPercent > 100) return null;
                const dayNum = Math.round(hour / 8);
                return (
                  <div
                    key={hour}
                    className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${leftPercent}%` }}
                  >
                    <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap bg-slate-900/90 px-1 rounded">
                      {hour === 0 ? 'Start (0h)' : `Ngày ${dayNum} (${hour}h)`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task Rows */}
          <div className="space-y-3 relative">
            {/* Background vertical day grid lines */}
            <div className="absolute inset-0 left-64 pointer-events-none">
              {dayMarks.map((hour) => {
                const leftPercent = (hour / maxHours) * 100;
                if (leftPercent > 100) return null;
                return (
                  <div
                    key={hour}
                    className="absolute top-0 bottom-0 border-r border-slate-800/60"
                    style={{ left: `${leftPercent}%` }}
                  />
                );
              })}
            </div>

            {sortedTasks.map((task) => {
              const startHour = task.early_start || 0;
              const duration = task.duration_hours || 1;
              const leftPercent = (startHour / maxHours) * 100;
              const widthPercent = Math.max((duration / maxHours) * 100, 2);

              const isCritical = Boolean(task.is_critical);

              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick && onTaskClick(task)}
                  className="flex items-center group cursor-pointer hover:bg-slate-800/40 py-1.5 px-2 rounded-lg transition-colors relative z-10"
                >
                  {/* Left Label */}
                  <div className="w-60 flex-shrink-0 pr-4 truncate">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded font-mono ${
                          isCritical
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        #{task.id}
                      </span>
                      <span className="text-sm font-medium text-slate-200 truncate group-hover:text-white" title={task.name}>
                        {task.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      {task.assignee_name ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          {task.assignee_name}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Chưa gán</span>
                      )}
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 text-[11px]">{task.duration_hours}h</span>
                      {task.slack > 0 && (
                        <span className="text-amber-400 text-[10px]">Slack: {task.slack}h</span>
                      )}
                    </div>
                  </div>

                  {/* Right Bar Area */}
                  <div className="flex-1 relative h-8 flex items-center">
                    <div
                      className={`absolute h-7 rounded-md shadow-md flex items-center px-2 text-xs font-medium transition-all duration-200 group-hover:brightness-110 ${
                        isCritical
                          ? 'bg-gradient-to-r from-rose-600 to-red-500 text-white border border-rose-400/50 ring-1 ring-rose-500/30'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400/40'
                      }`}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        minWidth: '28px',
                      }}
                      title={`${task.name}\nBắt đầu: ${task.start_date || 'N/A'}\nKết thúc: ${task.end_date || 'N/A'}\nThời lượng: ${task.duration_hours}h\nSlack: ${task.slack}h ${isCritical ? '(CRITICAL)' : ''}`}
                    >
                      <span className="truncate text-[11px] select-none font-medium drop-shadow">
                        {task.duration_hours}h {isCritical && '★'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
