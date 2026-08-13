<?php
namespace App\Models;
use CodeIgniter\Model;

class FlowchartModel extends Model
{
    protected $table         = 'module_flowcharts';
    protected $primaryKey    = 'id';
    protected $allowedFields = ['module_id', 'context_key', 'flowchart_data'];
    protected $useTimestamps = true;
}
