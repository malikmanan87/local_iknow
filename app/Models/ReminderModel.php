<?php
namespace App\Models;

use CodeIgniter\Model;

class ReminderModel extends Model
{
    protected $table = 'reminders';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'title',
        'description',
        'category',
        'priority',
        'status',
        'due_date',
        'reminder_before_days',
        'assigned_to',
        'assigned_email',
        'send_email_notification',
        'last_email_sent_at',
        'is_recurring',
        'recurrence_cycle',
        'related_module_id',
        'created_by'
    ];
    protected $useTimestamps = true;

    /**
     * Memastikan jadual reminders wujud secara automatik
     */
    public function ensureTableExists()
    {
        $db = \Config\Database::connect();
        $db->query("CREATE TABLE IF NOT EXISTS reminders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NULL,
            category VARCHAR(50) NOT NULL DEFAULT 'general',
            priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
            status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
            due_date DATETIME NOT NULL,
            reminder_before_days INT DEFAULT 3,
            assigned_to VARCHAR(150) NULL,
            assigned_email TEXT NULL,
            send_email_notification TINYINT(1) DEFAULT 1,
            last_email_sent_at DATETIME NULL,
            is_recurring TINYINT(1) DEFAULT 0,
            recurrence_cycle ENUM('daily', 'weekly', 'monthly', 'yearly') NULL,
            related_module_id INT NULL,
            created_by VARCHAR(100) NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_status_due (status, due_date),
            INDEX idx_priority (priority),
            INDEX idx_category (category)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    }
}
