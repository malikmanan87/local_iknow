<?php

namespace App\Models;

use CodeIgniter\Model;

class ActivityLogModel extends Model
{
    protected $table            = 'activity_logs';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $protectFields    = true;

    protected $allowedFields = [
        'user_id',
        'username',
        'action',
        'description',
        'ip_address',
        'user_agent',
        'created_at'
    ];

    protected $useTimestamps = false; // Kita uruskan created_at secara manual

    // ----------------------------------------------------------------
    // Fungsi Pembantu: Rekod Log Aktiviti Secara Automatik
    // ----------------------------------------------------------------
    public static function log(string $action, string $description = '')
    {
        $db = \Config\Database::connect();
        $request = \Config\Services::request();

        $db->table('activity_logs')->insert([
            'user_id'     => session()->get('user_id') ?: null,
            'username'    => session()->get('username') ?: 'Guest',
            'action'      => $action,
            'description' => $description,
            'ip_address'  => $request->getIPAddress(),
            'user_agent'  => $request->getUserAgent()->getAgentString(),
            'created_at'  => date('Y-m-d H:i:s')
        ]);
    }
}
