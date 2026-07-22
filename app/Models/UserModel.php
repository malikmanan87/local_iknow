<?php

namespace App\Models;

use CodeIgniter\Model;

class UserModel extends Model
{
    protected $table            = 'users';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';

    // 1. AKTIFKAN SOFT DELETES DI SINI
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;

    protected $allowedFields = [
        'fullname',
        'username',
        'email',
        'phone',
        'avatar',
        'password',
        'role_id',
        'is_active',
        'last_login',
        'created_at',
        'updated_at',
        'deleted_at', // Tambah deleted_at di sini
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    // 2. TETAPKAN PADANG DELETED FIELD
    protected $deletedField  = 'deleted_at';

    protected $validationRules    = [];
    protected $validationMessages = [];
    protected $skipValidation     = false;

    // ----------------------------------------------------------------
    // Find by email or username (Diperkemas dengan semakan SoftDelete)
    // ----------------------------------------------------------------
    public function findByEmailOrUsername(string $identifier): array|null
    {
        return $this->db->table('users u')
            ->select('u.*, r.name AS role_name')
            ->join('roles r', 'r.id = u.role_id', 'left')
            // Memastikan pengguna yang di-softdelete tidak boleh login
            ->where('u.deleted_at', null)
            ->groupStart()
            ->where('u.email', $identifier)
            ->orWhere('u.username', $identifier)
            ->groupEnd()
            ->get()
            ->getRowArray();
    }

    // ----------------------------------------------------------------
    // Get users with role name (Diperkemas dengan semakan SoftDelete)
    // ----------------------------------------------------------------
    public function getUsersWithRole(): array
    {
        return $this->db->table('users u')
            ->select('u.*, r.name AS role_name')
            ->join('roles r', 'r.id = u.role_id', 'left')
            // Hanya paparkan pengguna yang belum dipadam
            ->where('u.deleted_at', null)
            ->orderBy('u.created_at', 'DESC')
            ->get()
            ->getResultArray();
    }

    // ----------------------------------------------------------------
    // Get single user with role (Diperkemas dengan semakan SoftDelete)
    // ----------------------------------------------------------------
    public function getUserWithRole(int $id): array|null
    {
        return $this->db->table('users u')
            ->select('u.*, r.name AS role_name, r.display_name AS role_display')
            ->join('roles r', 'r.id = u.role_id', 'left')
            ->where('u.id', $id)
            ->where('u.deleted_at', null) // Sekat capaian jika telah dipadam
            ->get()
            ->getRowArray();
    }
}
