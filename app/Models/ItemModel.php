<?php

namespace App\Models;

use CodeIgniter\Model;

class ItemModel extends Model
{
    protected $table            = 'items';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;

    protected $allowedFields = [
        'name',
        'category',
        'description',
        'status',
        'created_by',
        'created_at',
        'updated_at'
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    // ----------------------------------------------------------------
    // Mendapatkan item berserta nama penuh pencipta (User)
    // ----------------------------------------------------------------
    public function getItemsWithUser(): array
    {
        return $this->db->table('items i')
            ->select('i.*, u.fullname AS creator_name')
            ->join('users u', 'u.id = i.created_by', 'left')
            ->orderBy('i.created_at', 'DESC')
            ->get()
            ->getResultArray();
    }

    // ----------------------------------------------------------------
    // KEMASKINI: Memulangkan list 1D kategori unik untuk dropdown Laporan
    // ----------------------------------------------------------------
    public function getUniqueCategories(): array
    {
        $result = $this->db->table('items')
            ->select('category')
            ->where('category IS NOT NULL')
            ->where('category !=', '')
            ->distinct()
            ->orderBy('category', 'ASC')
            ->get()
            ->getResultArray();

        // Menggunakan array_column untuk menukar format kepada ['Kategori A', 'Kategori B']
        return array_column($result, 'category');
    }

    // ----------------------------------------------------------------
    // KEMASKINI: Menerima & menapis 4 parameter penuh dari ReportsController
    // ----------------------------------------------------------------
    public function generateReport($startDate = null, $endDate = null, $category = null, $status = null): array
    {
        // Memulakan query pembina (Query Builder) bagi jadual items
        $builder = $this->builder();

        // Pilih lajur yang diperlukan termasuk gabungan nama pencipta daripada jadual users
        $builder->select('items.*, users.fullname as creator_name');
        $builder->join('users', 'users.id = items.created_by', 'left');

        // Penapis 1: Tarikh Mula (Mula jam 12:00 AM)
        if (!empty($startDate)) {
            $builder->where('items.created_at >=', $startDate . ' 00:00:00');
        }

        // Penapis 2: Tarikh Tamat (Sehingga jam 11:59 PM)
        if (!empty($endDate)) {
            $builder->where('items.created_at <=', $endDate . ' 23:59:59');
        }

        // Penapis 3: Kategori (Exact Match)
        if (!empty($category)) {
            $builder->where('items.category', $category);
        }

        // Penapis 4: Status (active / pending / inactive)
        if (!empty($status)) {
            $builder->where('items.status', $status);
        }

        // Susun laporan mengikut tarikh rekod terkini dimasukkan
        $builder->orderBy('items.created_at', 'DESC');

        // Kembalikan hasil carian sebagai tatasusunan (array)
        return $builder->get()->getResultArray();
    }
}
