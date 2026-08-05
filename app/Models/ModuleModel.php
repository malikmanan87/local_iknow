<?php
namespace App\Models;
use CodeIgniter\Model;

class ModuleModel extends Model {
    protected $table = 'modules';
    protected $primaryKey = 'id';
    protected $allowedFields = ['code', 'title', 'category', 'description', 'notes', 'status'];
    protected $useTimestamps = true;
}

