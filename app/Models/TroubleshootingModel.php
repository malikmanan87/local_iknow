<?php
namespace App\Models;
use CodeIgniter\Model;

class TroubleshootingModel extends Model {
    protected $table = 'troubleshooting_steps';
    protected $primaryKey = 'id';
    protected $allowedFields = ['issue_id', 'step_number', 'instruction', 'image_path'];
    protected $useTimestamps = false;
}
