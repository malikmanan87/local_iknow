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
            'pageTitle'  => 'System Settings',
            'breadcrumb' => ['Settings'],
            'settings'   => $settings
        ]);
    }

    // ----------------------------------------------------------------
    // POST /settings/update (Process Save Settings)
    // ----------------------------------------------------------------
    public function update()
    {
        $db = \Config\Database::connect();

        $allowedKeys = [
            'app_name', 'app_tagline', 'company_name', 'timezone',
            'system_email', 'email_protocol', 'smtp_host', 'smtp_port',
            'login_attempts', 'session_timeout'
        ];

        foreach ($allowedKeys as $key) {
            $value = $this->request->getPost($key);
            
            $db->table('settings')
               ->where('key', $key)
               ->update(['value' => $value, 'updated_at' => date('Y-m-d H:i:s')]);
        }

        $maintenanceMode = $this->request->getPost('maintenance_mode') ?? '0';
        $db->table('settings')
           ->where('key', 'maintenance_mode')
           ->update(['value' => $maintenanceMode, 'updated_at' => date('Y-m-d H:i:s')]);

        return redirect()->to('settings')->with('success', 'System settings saved successfully.');
    }
}