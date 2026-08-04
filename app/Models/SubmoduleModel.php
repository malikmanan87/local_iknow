<?php
namespace App\Models;
use CodeIgniter\Model;

class SubmoduleModel extends Model {
    protected $table = 'submodules';
    protected $primaryKey = 'id';
    protected $allowedFields = ['module_id', 'parent_id', 'title', 'description'];
    protected $useTimestamps = false;
}
