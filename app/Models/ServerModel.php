<?php
namespace App\Models;

use CodeIgniter\Model;

class ServerModel extends Model {
    protected $table = 'monitored_servers';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'name',
        'ip_address',
        'port',
        'service_type',
        'location',
        'description',
        'status',
        'latency_ms',
        'last_checked_at'
    ];
    protected $useTimestamps = true;

    public function ensureTableExists() {
        $db = \Config\Database::connect();
        $db->query("CREATE TABLE IF NOT EXISTS `monitored_servers` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(150) NOT NULL,
            `ip_address` VARCHAR(100) NOT NULL,
            `port` INT NULL,
            `service_type` VARCHAR(100) DEFAULT 'General',
            `location` VARCHAR(150) NULL,
            `description` TEXT NULL,
            `status` ENUM('online', 'offline', 'pending') DEFAULT 'pending',
            `latency_ms` INT NULL,
            `last_checked_at` DATETIME NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_status (`status`),
            INDEX idx_ip (`ip_address`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    }
}
