# Smart Project Management System (Smart PMS)

Hệ thống quản lý dự án thông minh với khả năng tiếp nhận tài liệu đặc tả nghiệp vụ (Use Case), dùng AI bóc tách Work Breakdown Structure (WBS), giải quyết bài toán **ánh xạ ID tạm thời sang ID thực tế**, quy đổi thời gian sang **Lịch làm việc thực tế (Working Calendar)**, phân bổ **nhân sự (Resource Allocation)**, tính toán đường găng **PERT / CPM** trên đồ thị DAG, và quản lý trạng thái an toàn với **Database Locking & Versioning**.

---

## 🌟 Các Tính năng Cốt lõi

1. **Thuật toán Ánh xạ ID 2 Pha (Two-Phase ID Resolution Mapping)**:
   - Tiếp nhận WBS dạng DAG với các ID tạm thời (`T1`, `T2`, ...) từ AI.
   - **Pha 1**: Chèn các công việc vào MySQL và lưu lại Auto-increment ID thực tế trong từ điển bộ nhớ.
   - **Pha 2**: Duyệt mảng `depends_on`, tra cứu ID thực tế và chèn quan hệ khóa ngoại vào bảng `task_dependencies`.
   - Bảo toàn 100% tính toàn vẹn dữ liệu trong một **Database Transaction** (`START TRANSACTION ... COMMIT / ROLLBACK`).

2. **Lịch làm việc thực tế (Working Calendar Scheduling)**:
   - Quy định giờ làm việc tiêu chuẩn: 08:00 - 12:00 (4h) và 13:00 - 17:00 (4h) -> 8 giờ/ngày.
   - Tự động bỏ qua 1 giờ nghỉ trưa (12:00 - 13:00).
   - Tự động nhảy qua Thứ 7 và Chủ Nhật đến 08:00 sáng Thứ Hai tuần kế tiếp.
   - Triệt tiêu tình trạng nhân viên bị phân bổ làm việc vào đêm khuya hoặc ngày nghỉ cuối tuần.

3. **Thuật toán PERT / CPM (Critical Path Method)**:
   - **Kahn's Topological Sort**: Phát hiện chu trình (Cycle Detection) trên đồ thị có hướng.
   - **Forward Pass**: Tính toán Early Start ($ES$) và Early Finish ($EF$).
   - **Backward Pass**: Tính toán Late Start ($LS$) và Late Finish ($LF$).
   - **Slack & Đường găng (Critical Path)**: Tính $\text{Slack} = LS - ES$. Đánh dấu công việc găng ($\text{Slack} = 0$, `is_critical = true`).

4. **Phân bổ tài nguyên (Resource Allocation)**:
   - Phân tích vai trò gợi ý từ AI (`suggested_role`) và tự động gán cho nhân sự phù hợp (`users`).
   - Hiển thị thông tin người phụ trách trực tiếp trên biểu đồ Gantt và bảng WBS.

5. **Kiểm soát Xung đột Đồng thời (Concurrency Control)**:
   - Stored Procedure `sp_update_task_status` kết hợp **Pessimistic Row Locking (`FOR UPDATE`)** và **Optimistic Versioning (`version`)**.
   - Ngăn ngừa triệt để Race Condition khi nhiều quản trị viên hoặc thành viên cập nhật cùng lúc, phản hồi mã HTTP 409 Conflict.

---

## 🛠️ Ngăn xếp Công nghệ (Tech Stack)

- **Backend**: PHP 8.2+, PSR-4 Autoloading, PDO Prepared Statements, RESTful Controllers, DAO Pattern.
- **Cơ sở dữ liệu**: MySQL / MariaDB 10.4+, InnoDB Engine, Foreign Keys, Stored Procedures, Transactions.
- **Frontend**: React 18, Vite 5, Tailwind CSS, Lucide Icons.
- **AI Integration**: Google Gemini API / OpenAI API / Domain Heuristic Engine.

---

## 🚀 Hướng dẫn Cài đặt & Vận hành

### 1. Cơ sở dữ liệu
Khởi động MySQL server và nhập file schema:
```bash
mysql --default-character-set=utf8mb4 -u root < backend/database/schema.sql
```

### 2. Backend API
```bash
cd backend
composer dump-autoload
php -S 127.0.0.1:8000 -t public
```
Endpoint kiểm tra sức khỏe: `http://127.0.0.1:8000/api/health`

Chạy bộ kiểm thử tự động 13 test cases:
```bash
php backend/tests/VerificationTest.php
```

### 3. Frontend React SPA
```bash
cd frontend
npm install
npm run dev
```
Truy cập giao diện: `http://localhost:5173/`

---

## 📄 Bản quyền
Smart Project Management System © 2026.
