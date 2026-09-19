-- =====================================================================
-- Smart Project Management System (Smart PMS)
-- Database Initialization Script (DDL, Foreign Keys, Stored Procedures, Seeds)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS smart_pms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_pms;

-- ---------------------------------------------------------------------
-- 1. Table: users (Quản lý phân bổ tài nguyên / Resource Allocation)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS task_dependencies;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(100) NOT NULL DEFAULT 'Developer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. Table: projects
-- ---------------------------------------------------------------------
CREATE TABLE projects (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    start_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'PLANNING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. Table: tasks
-- ---------------------------------------------------------------------
CREATE TABLE tasks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    assignee_id BIGINT UNSIGNED NULL,
    name VARCHAR(255) NOT NULL,
    duration_hours INT UNSIGNED NOT NULL DEFAULT 0,
    start_date DATETIME NULL,
    end_date DATETIME NULL,
    early_start INT NOT NULL DEFAULT 0,
    early_finish INT NOT NULL DEFAULT 0,
    late_start INT NOT NULL DEFAULT 0,
    late_finish INT NOT NULL DEFAULT 0,
    slack INT NOT NULL DEFAULT 0,
    is_critical BOOLEAN NOT NULL DEFAULT FALSE,
    status ENUM('TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED') NOT NULL DEFAULT 'TODO',
    version INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_tasks_project
        FOREIGN KEY (project_id) REFERENCES projects(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
        
    CONSTRAINT fk_tasks_assignee
        FOREIGN KEY (assignee_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_project_id (project_id),
    INDEX idx_assignee_id (assignee_id),
    INDEX idx_status (status),
    INDEX idx_is_critical (is_critical)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Table: task_dependencies
-- ---------------------------------------------------------------------
CREATE TABLE task_dependencies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task_id BIGINT UNSIGNED NOT NULL,
    depends_on_task_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_dep_task
        FOREIGN KEY (task_id) REFERENCES tasks(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
        
    CONSTRAINT fk_dep_depends_on
        FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
        
    CONSTRAINT uk_task_dependencies 
        UNIQUE KEY (task_id, depends_on_task_id),

    INDEX idx_task_id (task_id),
    INDEX idx_depends_on_task_id (depends_on_task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. Stored Procedure: sp_update_task_status
-- Áp dụng Pessimistic Locking (FOR UPDATE) & Version Check chống Race Condition
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_update_task_status;

DELIMITER //

CREATE PROCEDURE sp_update_task_status(
    IN in_task_id BIGINT UNSIGNED,
    IN in_new_status VARCHAR(50),
    IN in_expected_version INT UNSIGNED,
    OUT out_success BOOLEAN,
    OUT out_new_version INT UNSIGNED,
    OUT out_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE current_version INT UNSIGNED;
    DECLARE current_status VARCHAR(50);
    DECLARE task_exists INT DEFAULT 0;

    -- Xử lý ngoại lệ SQL
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET out_success = FALSE;
        SET out_new_version = 0;
        SET out_message = 'Database error occurred during task status update.';
    END;

    START TRANSACTION;

    -- 1. Pessimistic Row Locking: Khóa hàng của task cần cập nhật
    SELECT COUNT(*), version, status 
    INTO task_exists, current_version, current_status
    FROM tasks 
    WHERE id = in_task_id 
    FOR UPDATE;

    -- 2. Kiểm tra task có tồn tại không
    IF task_exists = 0 OR current_version IS NULL THEN
        ROLLBACK;
        SET out_success = FALSE;
        SET out_new_version = 0;
        SET out_message = 'Task does not exist.';
        LEAVE proc_label;
    END IF;

    -- 3. Kiểm tra Optimistic Version để phát hiện Race Condition
    IF current_version <> in_expected_version THEN
        ROLLBACK;
        SET out_success = FALSE;
        SET out_new_version = current_version;
        SET out_message = CONCAT('Race condition detected: Task has been modified by another process. Current version: ', current_version, ', expected: ', in_expected_version);
        LEAVE proc_label;
    END IF;

    -- 4. Thực hiện cập nhật trạng thái và tăng version
    UPDATE tasks 
    SET 
        status = in_new_status,
        version = current_version + 1,
        updated_at = NOW()
    WHERE id = in_task_id;

    COMMIT;

    SET out_success = TRUE;
    SET out_new_version = current_version + 1;
    SET out_message = 'Task status updated successfully.';
END //

DELIMITER ;

-- ---------------------------------------------------------------------
-- 6. Initial Seed Data (Nhân sự mẫu & Dự án mẫu)
-- ---------------------------------------------------------------------
INSERT INTO users (id, name, email, role) VALUES
(1, 'Nguyễn Văn Quản', 'pm@smartpms.local', 'Project Manager'),
(2, 'Trần Đức Hậu', 'backend@smartpms.local', 'Backend Developer'),
(3, 'Lê Thị Tiên', 'frontend@smartpms.local', 'Frontend Developer'),
(4, 'Phạm Hoàng Họa', 'designer@smartpms.local', 'UI/UX Designer'),
(5, 'Vũ Minh Kiểm', 'qa@smartpms.local', 'QA Engineer')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO projects (id, name, description, start_date, status) VALUES
(1, 'Xây dựng Hệ thống E-Commerce', 'Dự án phát triển nền tảng thương mại điện tử tích hợp thanh toán online.', '2026-09-21 08:00:00', 'PLANNING')
ON DUPLICATE KEY UPDATE name=VALUES(name);
