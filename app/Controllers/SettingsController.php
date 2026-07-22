<?php

namespace App\Controllers;

class SettingsController extends BaseController
{
    public function __construct()
    {
        helper(['form', 'url']);
    }

    // ----------------------------------------------------------------
    // GET /settings (Paparan Borang Tetapan)
    // ----------------------------------------------------------------
    public function index()
    {
        $db = \Config\Database::connect();
        
        // Mengambil semua data tetapan daripada pangkalan data
        $settingsData = $db->table('settings')->get()->getResultArray();
        
        // Menukarkan struktur tatasusunan (array) kepada format key => value mudahan
        $settings = [];
        foreach ($settingsData as $row) {
            $settings[$row['key']] = $row['value'];
        }

        return view('settings/index', [
            'pageTitle'  => 'Tetapan Sistem',
            'breadcrumb' => ['Tetapan'],
            'settings'   => $settings // Dihantar ke view
        ]);
    }

    // ----------------------------------------------------------------
    // POST /settings/update (Proses Simpan Tetapan)
    // ----------------------------------------------------------------
    public function update()
    {
        $db = \Config\Database::connect();

        // Senarai input yang dibenarkan daripada borang (form)
        $allowedKeys = [
            'app_name', 'app_tagline', 'company_name', 'timezone',
            'system_email', 'email_protocol', 'smtp_host', 'smtp_port',
            'login_attempts', 'session_timeout'
        ];

        // Memproses input biasa
        foreach ($allowedKeys as $key) {
            $value = $this->request->getPost($key);
            
            // Lakukan kemas kini sekiranya key tersebut wujud di dalam jadual
            $db->table('settings')
               ->where('key', $key)
               ->update(['value' => $value, 'updated_at' => date('Y-m-d H:i:s')]);
        }

        // Memproses input khusus berbentuk 'checkbox' / 'switch' (Maintenance Mode)
        // Checkbox tidak akan dihantar dalam POST jika tidak ditanda (unchecked)
        $maintenanceMode = $this->request->getPost('maintenance_mode') ?? '0';
        $db->table('settings')
           ->where('key', 'maintenance_mode')
           ->update(['value' => $maintenanceMode, 'updated_at' => date('Y-m-d H:i:s')]);

        // Mengembalikan maklum balas sukses ke halaman tetapan
        return redirect()->to('settings')->with('success', 'Tetapan sistem berjaya disimpan.');
    }
}