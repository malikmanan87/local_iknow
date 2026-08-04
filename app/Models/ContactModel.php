<?php
namespace App\Models;
use CodeIgniter\Model;

class ContactModel extends Model {
    protected $table = 'contact_persons';
    protected $primaryKey = 'id';
    protected $allowedFields = ['module_id', 'submodule_id', 'name', 'role', 'email', 'phone_no', 'department'];
    protected $useTimestamps = false;
}
