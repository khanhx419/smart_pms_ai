import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Clock, ShieldCheck, Zap, Award, BookOpen } from 'lucide-react';
import { api } from '../services/api';

export default function BenchmarkComparison() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBenchmarks()
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-500">
        Đang nạp dữ liệu đối chuẩn nghiên cứu khoa học...
      </div>
    );
  }

  const govTable = data.governance_modes_comparison;
  const pipelineTable = data.human_vs_agentic_pipeline;
  const experts = data.enterprise_experts;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Research Introduction Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
          <Award className="w-4 h-4" />
          Nghiên cứu Thực nghiệm: Vaasan Ammattikorkeakoulu (VAMK, 2026)
        </div>
        <h2 className="text-xl font-black text-white">
          Dữ liệu Đối chuẩn Thực nghiệm (Empirical Benchmarking Analysis)
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
          Số liệu so sánh trực tiếp giữa quy trình phần mềm doanh nghiệp truyền thống (con người) và hệ thống Agentic SDLC Governance Laboratory qua 3 chế độ kiểm soát (OFF, BASIC, STRICT).
        </p>
      </div>

      {/* Table 4: Governance Modes Comparison */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              {govTable.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              So sánh mức độ kiểm soát ảnh hưởng đến vận tốc (AV), tỷ lệ sửa lỗi (SCR) và chi phí quản trị (GO).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Chỉ số đo lường (KPI)</th>
                <th className="py-3 px-4 text-center">OFF Mode (Control)</th>
                <th className="py-3 px-4 text-center">BASIC Mode (Cân bằng)</th>
                <th className="py-3 px-4 text-center">STRICT Mode (Guardrails)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="py-3 px-4 font-medium">Số lượng Stories hoàn thành</td>
                <td className="py-3 px-4 text-center font-mono">1 / 2</td>
                <td className="py-3 px-4 text-center font-mono">5 / 5</td>
                <td className="py-3 px-4 text-center font-mono text-emerald-400 font-bold">6 / 6</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Agentic Velocity (AV)</td>
                <td className="py-3 px-4 text-center font-mono">29.56 feat/hr</td>
                <td className="py-3 px-4 text-center font-mono text-blue-300 font-bold">46.91 feat/hr (Highest)</td>
                <td className="py-3 px-4 text-center font-mono text-rose-300">24.71 feat/hr</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Self-Correction Ratio (SCR)</td>
                <td className="py-3 px-4 text-center font-mono text-rose-400">0.3333 (Kém nhất)</td>
                <td className="py-3 px-4 text-center font-mono text-emerald-400 font-bold">0.1667 (Tốt nhất)</td>
                <td className="py-3 px-4 text-center font-mono text-amber-300">0.2500</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Governance Overhead (GO)</td>
                <td className="py-3 px-4 text-center font-mono">0.0 sec</td>
                <td className="py-3 px-4 text-center font-mono">115.17 sec (~1.92 min)</td>
                <td className="py-3 px-4 text-center font-mono text-purple-300">136.60 sec (2.28 min)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Tổng thời gian chạy (Work Duration)</td>
                <td className="py-3 px-4 text-center font-mono">121.77 sec (~2 min)</td>
                <td className="py-3 px-4 text-center font-mono">383.70 sec (~6.4 min)</td>
                <td className="py-3 px-4 text-center font-mono">874.30 sec (~14.6 min)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">QA Pass Rate (%)</td>
                <td className="py-3 px-4 text-center font-mono">66.67%</td>
                <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">83.33%</td>
                <td className="py-3 px-4 text-center font-mono">75.00%</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Governance Pass Rate (%)</td>
                <td className="py-3 px-4 text-center font-mono text-rose-400">0.0% (Không kiểm)</td>
                <td className="py-3 px-4 text-center font-mono text-emerald-400">100.0%</td>
                <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">100.0%</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Lỗ hổng bảo mật thoát ra (Escaped Defects)</td>
                <td className="py-3 px-4 text-center font-mono text-rose-400">Cao (lọt secret key)</td>
                <td className="py-3 px-4 text-center font-mono text-amber-300">Thấp</td>
                <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">Zero (Triệt tiêu 100%)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 7: End-to-End Pipeline Duration Benchmark */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            {pipelineTable.title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            So sánh thời gian qua các giai đoạn SDLC cho 6 User Stories: Con người vs AI-Assisted vs Agentic Tool.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Giai đoạn SDLC</th>
                <th className="py-3 px-4">Con người thuần túy (No AI)</th>
                <th className="py-3 px-4">Kỹ sư dùng trợ lý AI (AI-Assisted)</th>
                <th className="py-3 px-4 text-emerald-400 font-bold">Agentic Tool (Nghiên cứu này)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {pipelineTable.stages.map((stg, i) => (
                <tr key={i} className={i === pipelineTable.stages.length - 1 ? 'bg-emerald-950/20 font-bold' : ''}>
                  <td className="py-3 px-4 font-sans text-slate-200">{stg.stage}</td>
                  <td className="py-3 px-4 text-slate-400">{stg.human_no_ai}</td>
                  <td className="py-3 px-4 text-blue-300">{stg.ai_assisted_human}</td>
                  <td className="py-3 px-4 text-emerald-300 font-bold">{stg.agentic_tool}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>* Ghi chú từ luận văn: Điểm nghẽn lớn nhất của Agile là <b>Hàng đợi xét duyệt (Review Queue)</b> kéo dài 4+ ngày.</span>
          <span className="text-emerald-400 font-bold">Tốc độ quản trị tăng ~3,000 lần</span>
        </div>
      </div>

      {/* Enterprise Interviews & Case Studies */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            Khảo sát Chuyên gia Doanh nghiệp Quốc tế (Section 4.2 & 4.3)
          </h3>
          <span className="text-xs text-slate-400">Phần Lan, UAE, Bahrain, Pakistan</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {experts.map((exp, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-sm font-bold text-white">{exp.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {exp.company}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-400 font-medium mb-2">{exp.role}</div>
                <blockquote className="text-xs text-slate-400 italic bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 mb-3">
                  "{exp.quote}"
                </blockquote>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">QA Pass:</span>
                  <span className="text-slate-300 font-mono">{exp.human_qa_pass}% (Con người) vs <b>{exp.tool_qa_pass}% (Tool)</b></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Governance Pass:</span>
                  <span className="text-slate-300 font-mono">{exp.human_gov_pass}% (Con người) vs <b className="text-emerald-400">100% (Tool)</b></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian duyệt:</span>
                  <span className="text-slate-300 font-mono">{exp.human_gov_review_min} min vs <b className="text-purple-300">{exp.tool_gov_review_min} min</b></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
