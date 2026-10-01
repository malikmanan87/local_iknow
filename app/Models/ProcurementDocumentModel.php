<?php
namespace App\Models;

use CodeIgniter\Model;

class ProcurementDocumentModel extends Model {
    protected $table = 'procurement_documents';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'title',
        'category',
        'reference_no',
        'description',
        'file_path',
        'file_name',
        'file_size',
        'effective_date',
        'tags'
    ];
    protected $useTimestamps = true;

    public function ensureTableExists() {
        $db = \Config\Database::connect();
        $db->query("CREATE TABLE IF NOT EXISTS procurement_documents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            category VARCHAR(100) DEFAULT 'Tatacara & Garis Panduan',
            reference_no VARCHAR(100) DEFAULT NULL,
            description TEXT DEFAULT NULL,
            file_path VARCHAR(255) DEFAULT NULL,
            file_name VARCHAR(255) DEFAULT NULL,
            file_size VARCHAR(50) DEFAULT NULL,
            effective_date DATE DEFAULT NULL,
            tags VARCHAR(255) DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_category (category),
            INDEX idx_title (title)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    }
}
