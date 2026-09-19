import React, { useState } from 'react';
import { X, Sparkles, Calendar, BookOpen, Layers, Cpu, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

const SAMPLES = {
  ecommerce: `Dự án phát triển Hệ thống Sàn Thương Mại Điện Tử (E-Commerce Platform):
1. Quản lý xác thực người dùng: Đăng ký tài khoản, đăng nhập JWT, phân quyền Khách hàng / Quản trị viên (Admin).
2. Thiết kế Cơ sở dữ liệu: Thiết kế Schema DDL danh mục sản phẩm, đơn hàng, người dùng và thiết lập chỉ mục (Indexes).
3. Quản lý sản phẩm và giỏ hàng: API CRUD sản phẩm, bộ lọc tìm kiếm và giao diện giỏ hàng thời gian thực.
4. Tích hợp cổng thanh toán trực tuyến: Kết nối VNPay / MoMo, xử lý webhook xác nhận giao dịch an toàn.
5. Quản lý đơn hàng & Báo cáo: Màn hình theo dõi trạng thái giao vận và Dashboard thống kê doanh thu theo thời gian.
6. Kiểm thử hộp đen (Black-box testing), kiểm thử bảo mật và triển khai UAT lên hệ thống Cloud.`,

  crm: `Dự án xây dựng Hệ thống Quản trị Quan hệ Khách hàng (CRM & Lead Management):
1. Phân tích tài liệu yêu cầu và thiết kế kiến trúc Microservices / REST API.
2. Thiết kế Wireframe UI/UX trên Figma cho toàn bộ quy trình chăm sóc khách hàng.
3. Module quản lý Lead & Pipeline kinh doanh: Thu thập thông tin khách hàng tiềm năng, phân loại trạng thái cơ hội.
4. Tích hợp gửi Email Marketing tự động & Tổng đài VoIP chăm sóc khách hàng.
5. Module Quản lý Hợp đồng & Doanh số nhân viên: Tự động tính hoa hồng (commission) cho Sales.
6. Kiểm thử tải (Load Testing), tối ưu hóa Stored Procedures CSDL và bàn giao đưa vào vận hành.`,
};

export default function AiRequirementModal({ projectId, currentStartDate, onClose, onSuccess }) {
  const [useCaseText, setUseCaseText] = useState(SAMPLES.ecommerce);
  const [startDate, setStartDate] = useState(currentStartDate || '2026-09-21 08:00:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!useCaseText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.decomposeAi(projectId, {
        use_case_text: useCaseText,
        start_date: startDate,
        replace_existing: true,
      });

      onSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi khi phân rã yêu cầu bằng AI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Phân rã WBS & Lập lịch tự động bằng AI
            </h3>
            <p className="text-xs text-slate-400">
              Chuyển đổi tài liệu nghiệp vụ thành đồ thị công việc (DAG) kèm Working Calendar và PERT/CPM.
            </p>
          </div>
        </div>

        {/* Quick Sample Selectors */}
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <span className="text-xs text-slate-400 font-medium">Tải mẫu:</span>
          <button
            type="button"
            onClick={() => setUseCaseText(SAMPLES.ecommerce)}
            className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <BookOpen className="w-3 h-3 text-emerald-400" /> E-Commerce Platform
          </button>
          <button
            type="button"
            onClick={() => setUseCaseText(SAMPLES.crm)}
            className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <BookOpen className="w-3 h-3 text-blue-400" /> CRM & Lead Pipeline
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          {/* Textarea */}
          <div className="flex-1 min-h-[160px] mb-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nội dung Đặc tả Nghiệp vụ (Use Case Document)
            </label>
            <textarea
              rows={8}
              value={useCaseText}
              onChange={(e) => setUseCaseText(e.target.value)}
              placeholder="Nhập mô tả các chức năng hoặc Use Case của dự án..."
              className="w-full h-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-sans leading-relaxed resize-none"
              required
            />
          </div>

          {/* Project Start Date */}
          <div className="mb-4 flex-shrink-0">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Mốc thời gian bắt đầu dự án thực tế
            </label>
            <input
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="YYYY-MM-DD HH:mm:ss"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              * Giờ làm việc tiêu chuẩn: 08:00 - 17:00 (Nghỉ trưa 12:00 - 13:00, Nghỉ Thứ 7 & Chủ Nhật).
            </p>
          </div>

          {/* Info Feature Box */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 mb-4 text-xs text-slate-400 flex items-start gap-2.5 flex-shrink-0">
            <Layers className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-slate-300">Quy trình tự động 2 pha:</span> AI sinh ID tạm thời (<code className="text-purple-300">T1, T2...</code>) $\to$ Ánh xạ sang Real Auto-increment IDs trong Database Transaction $\to$ Tính đường găng PERT/CPM $\to$ Gán nhân sự theo chuyên môn.
            </div>
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/20 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin text-purple-200" />
                  Đang phân tích & Lập lịch WBS...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  Bóc tách & Lập lịch ngay
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
