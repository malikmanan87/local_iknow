<?php
namespace App\Models;
use CodeIgniter\Model;

class FlowModel extends Model {
    protected $table = 'module_flows';
    protected $primaryKey = 'id';
    protected $allowedFields = ['module_id', 'submodule_id', 'step_number', 'step_title', 'description', 'image_path'];
    protected $useTimestamps = false;
}
