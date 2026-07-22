<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class StarterSeeder extends Seeder
{
    public function run(): void
    {
        $now = date('Y-m-d H:i:s');

        // ---- 1. Data Peranan (Roles) ----
        $roles = [
            ['name' => 'admin',   'display_name' => 'Pentadbir', 'description' => 'Akses penuh kepada semua modul sistem.', 'created_at' => $now],
            ['name' => 'manager', 'display_name' => 'Pengurus',  'description' => 'Akses kepada modul pengurusan dan laporan.', 'created_at' => $now],
            ['name' => 'user',    'display_name' => 'Pengguna',  'description' => 'Akses asas kepada sistem.', 'created_at' => $now],
        ];
        $this->db->table('roles')->insertBatch($roles);

        // Mendapatkan ID bagi setiap peranan yang baru dimasukkan
        $adminRoleId   = $this->db->table('roles')->where('name', 'admin')->get()->getRow()->id;
        $managerRoleId = $this->db->table('roles')->where('name', 'manager')->get()->getRow()->id;
        $userRoleId    = $this->db->table('roles')->where('name', 'user')->get()->getRow()->id;

        // ---- 2. Data Pengguna (Users - Menyokong Soft Deletes) ----
        $users = [
            [
                'fullname'   => 'Super Admin',
                'username'   => 'admin',
                'email'      => 'admin@sistem.my',
                'phone'      => '0123456789',
                'password'   => password_hash('Admin@1234', PASSWORD_DEFAULT),
                'role_id'    => $adminRoleId,
                'is_active'  => 1,
                'created_at' => $now,
                'deleted_at' => null, // Wajib diletakkan null untuk Soft Delete standard
            ],
            [
                'fullname'   => 'Ahmad Pengurus',
                'username'   => 'pengurus',
                'email'      => 'pengurus@sistem.my',
                'phone'      => '0111234567',
                'password'   => password_hash('Pengurus@1234', PASSWORD_DEFAULT),
                'role_id'    => $managerRoleId,
                'is_active'  => 1,
                'created_at' => $now,
                'deleted_at' => null,
            ],
            [
                'fullname'   => 'Siti Pengguna',
                'username'   => 'pengguna',
                'email'      => 'pengguna@sistem.my',
                'phone'      => '0197654321',
                'password'   => password_hash('User@1234', PASSWORD_DEFAULT),
                'role_id'    => $userRoleId,
                'is_active'  => 1,
                'created_at' => $now,
                'deleted_at' => null,
            ],
        ];
        $this->db->table('users')->insertBatch($users);

        // ---- 3. Data Contoh Item ----
        $adminId = $this->db->table('users')->where('username', 'admin')->get()->getRow()->id;

        $statuses = ['active', 'pending', 'inactive'];
        $categories = ['Kategori A', 'Kategori B', 'Kategori C'];

        for ($i = 1; $i <= 12; $i++) {
            $this->db->table('items')->insert([
                'name'        => 'Item Contoh ' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'category'    => $categories[($i - 1) % 3],
                'description' => 'Penerangan untuk item contoh nombor ' . $i . '.',
                'status'      => $statuses[($i - 1) % 3],
                'created_by'  => $adminId,
                'created_at'  => date('Y-m-d H:i:s', strtotime("-{$i} days")),
            ]);
        }

        // ---- 4. Data Konfigurasi Lalai (Default Settings) ----
        $settings = [
            ['key' => 'app_name',         'value' => 'Sistem Saya', 'created_at' => $now],
            ['key' => 'app_tagline',      'value' => 'Sistem pengurusan yang cekap, selamat dan mudah digunakan.', 'created_at' => $now],
            ['key' => 'company_name',     'value' => 'Organisasi Anda', 'created_at' => $now],
            ['key' => 'timezone',         'value' => 'Asia/Kuala_Lumpur', 'created_at' => $now],
            ['key' => 'system_email',     'value' => 'noreply@sistem.my', 'created_at' => $now],
            ['key' => 'email_protocol',   'value' => 'mail', 'created_at' => $now],
            ['key' => 'smtp_host',        'value' => 'smtp.mailtrap.io', 'created_at' => $now],
            ['key' => 'smtp_port',        'value' => '587', 'created_at' => $now],
            ['key' => 'maintenance_mode', 'value' => '0', 'created_at' => $now],
            ['key' => 'login_attempts',   'value' => '5', 'created_at' => $now],
            ['key' => 'session_timeout',  'value' => '7200', 'created_at' => $now],
        ];
        $this->db->table('settings')->insertBatch($settings);

        // Makluman Konsol
        echo "Seeder berjaya dijalankan!\n";
        echo "-----------------------------------\n";
        echo "Login Admin   : admin@sistem.my / Admin@1234\n";
        echo "Login Pengurus: pengurus@sistem.my / Pengurus@1234\n";
        echo "Login Pengguna: pengguna@sistem.my / User@1234\n";
    }
}