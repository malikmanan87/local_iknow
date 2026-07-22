<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class AuthFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        // Mendapatkan laluan URI semasa (cth: 'login', 'register', 'dashboard')
        $currentURI = $request->getUri()->getPath();

        // Bersihkan tanda herotan '/' di awal dan akhir string untuk ketepatan semakan
        $currentURI = trim($currentURI, '/');

        // Senarai laluan terbukan yang DIKECUALIKAN daripada sebarang sekatan (Login, Register & Public Home)
        $excludedURIs = ['login', 'logout', 'register', 'register/process', ''];

        // 1. SEMAK MOD PENYELENGGARAAN (MAINTENANCE MODE)
        try {
            $db = \Config\Database::connect();
            $maintenanceQuery = $db->table('settings')->where('key', 'maintenance_mode')->get()->getRow();
            $isMaintenance = $maintenanceQuery ? (int)$maintenanceQuery->value : 0;

            if ($isMaintenance === 1) {
                $userRole   = session()->get('role');
                $isLoggedIn = session()->get('isLoggedIn');

                // Jika mod penyelenggaraan aktif dan pengguna BUKAN admin, sekat semua kecuali halaman terbuka
                if ($userRole !== 'admin') {
                    if (!in_array($currentURI, $excludedURIs)) {

                        // Jika mereka sedia login sebagai user biasa, tarik balik sesi log masuk mereka
                        if ($isLoggedIn) {
                            session()->remove(['isLoggedIn', 'user_id', 'fullname', 'email', 'username', 'role', 'role_id']);
                        }

                        return redirect()->to(base_url('login'))
                            ->with('error', 'Sistem sedang diselenggara buat sementara waktu. Sila cuba lagi lewat.');
                    }
                }
            }
        } catch (\Exception $e) {
            // Abaikan jika pangkalan data belum sedia sewaktu migrasi awal dijalankan
        }

        // 2. LOGIK AUTHENTICATION & SEKATAN LOGIN BIASA
        // Jika pengguna cuba mengakses halaman dalaman (protected), mereka wajib login dahulu.
        if (!in_array($currentURI, $excludedURIs)) {

            if (!session()->get('isLoggedIn')) {
                return redirect()->to(base_url('login'))
                    ->with('error', 'Sila log masuk untuk mengakses halaman ini.');
            }

            // Role-based access control (Sekatan berdasarkan Arguments di Routes)
            if (!empty($arguments)) {
                $requiredRoles = $arguments;
                $userRole      = session()->get('role');

                if (!in_array($userRole, $requiredRoles)) {
                    return redirect()->to(base_url('dashboard'))
                        ->with('error', 'Anda tidak mempunyai kebenaran untuk mengakses halaman ini.');
                }
            }
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // Tidak diperlukan buat masa ini
    }
}
