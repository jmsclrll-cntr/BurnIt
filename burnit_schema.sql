-- ========================================================
-- BurnIt MySQL Database Schema for XAMPP / phpMyAdmin
-- Database: burnit_db
-- ========================================================

CREATE DATABASE IF NOT EXISTS `burnit_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `burnit_db`;

-- 1. Users Table (Authentication, Admin & Biometric Profile)
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `is_admin` TINYINT(1) DEFAULT 0,
    `name` VARCHAR(150) DEFAULT NULL,
    `age` INT DEFAULT NULL,
    `sex` VARCHAR(20) DEFAULT NULL,
    `weight` DOUBLE DEFAULT NULL,
    `height` DOUBLE DEFAULT NULL,
    `is_profile_completed` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Workout Sessions Table (Telemetry, Reps, Scores, Calories)
CREATE TABLE IF NOT EXISTS `sessions` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(100) DEFAULT NULL,
    `exercise` VARCHAR(64) NOT NULL,
    `start_time` VARCHAR(64) DEFAULT NULL,
    `end_time` VARCHAR(64) DEFAULT NULL,
    `total_reps` INT DEFAULT 0,
    `avg_form_score` DOUBLE DEFAULT 0.0,
    `duration_seconds` DOUBLE DEFAULT 0.0,
    `calories` DOUBLE DEFAULT 0.0,
    `common_errors` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user_created` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Dataset Metadata Table (Pose Recording & Model Training Data)
CREATE TABLE IF NOT EXISTS `dataset_metadata` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `exercise` VARCHAR(64) NOT NULL,
    `phase` VARCHAR(64) DEFAULT NULL,
    `form_label` VARCHAR(64) DEFAULT NULL,
    `error_type` VARCHAR(64) DEFAULT NULL,
    `subject_id` VARCHAR(64) DEFAULT NULL,
    `camera_view` VARCHAR(64) DEFAULT NULL,
    `frame_count` INT DEFAULT 0,
    `csv_path` VARCHAR(255) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

