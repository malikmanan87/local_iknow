<?php
namespace App\Models;
use CodeIgniter\Model;

class NoteModel extends Model {
    protected $table = 'notes';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'title',
        'category',
        'content',
        'is_locked',
        'author'
    ];
    protected $useTimestamps = true;

    /**
     * Pastikan jadual notes wujud secara automatik tanpa perlu migrasi manual
     */
    public function ensureTableExists() {
        $db = \Config\Database::connect();
        $db->query("CREATE TABLE IF NOT EXISTS notes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            category VARCHAR(100) DEFAULT 'General',
            content LONGTEXT NOT NULL,
            is_locked TINYINT(1) DEFAULT 0,
            author VARCHAR(100) DEFAULT 'Pengguna iKNOW',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_category (category),
            INDEX idx_is_locked (is_locked)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    }
}
