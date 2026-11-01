<?php

namespace App\Models;

use CodeIgniter\Model;

class TaskModel extends Model
{
    protected $table = 'tasks';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;
    protected $returnType = 'array';
    protected $useSoftDeletes = false;
    protected $allowedFields = [
        'title',
        'priority',
        'status',
        'recurrence',
        'due_date',
        'last_notified_at',
        'created_at',
        'updated_at'
    ];

    protected $useTimestamps = true;
    protected $dateFormat = 'datetime';
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    /**
     * Memastikan jadual tasks wujud secara automatik dalam pangkalan data
     */
    public function ensureTableExists()
    {
        $db = \Config\Database::connect();
        $db->query("CREATE TABLE IF NOT EXISTS `tasks` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `title` VARCHAR(255) NOT NULL,
            `priority` ENUM('normal', 'urgent') DEFAULT 'normal',
            `status` ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
            `recurrence` ENUM('none', 'daily', 'weekly', 'monthly', 'yearly') DEFAULT 'none',
            `due_date` DATETIME NULL,
            `last_notified_at` DATETIME NULL,
            `created_at` DATETIME NULL,
            `updated_at` DATETIME NULL,
            INDEX idx_task_status (`status`),
            INDEX idx_task_priority (`priority`),
            INDEX idx_task_due_date (`due_date`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        // Pastikan enum priority dikemaskini kepada 'normal', 'urgent' jika jadual telah sedia ada
        try {
            $db->query("ALTER TABLE `tasks` MODIFY COLUMN `priority` ENUM('normal', 'urgent') NOT NULL DEFAULT 'normal'");
        } catch (\Throwable $e) {}

        // Pastikan lajur recurrence wujud jika jadual telah sedia ada
        $checkRecurrence = $db->query("SHOW COLUMNS FROM `tasks` LIKE 'recurrence'")->getRow();
        if (!$checkRecurrence) {
            $db->query("ALTER TABLE `tasks` ADD COLUMN `recurrence` ENUM('none', 'daily', 'weekly', 'monthly', 'yearly') NOT NULL DEFAULT 'none' AFTER `status`;");
        }

        // Pastikan lajur last_notified_at wujud jika jadual telah sedia ada
        $checkCol = $db->query("SHOW COLUMNS FROM `tasks` LIKE 'last_notified_at'")->getRow();
        if (!$checkCol) {
            $db->query("ALTER TABLE `tasks` ADD COLUMN `last_notified_at` DATETIME NULL;");
        }
    }
}
