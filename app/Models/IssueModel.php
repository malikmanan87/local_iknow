<?php
namespace App\Models;
use CodeIgniter\Model;

class IssueModel extends Model {
    protected $table = 'module_issues';
    protected $primaryKey = 'id';
    protected $allowedFields = ['module_id', 'submodule_id', 'issue_code', 'title', 'symptoms'];
    protected $useTimestamps = false;
}
