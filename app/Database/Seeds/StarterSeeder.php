<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class StarterSeeder extends Seeder
{
    public function run(): void
    {
        $now = date('Y-m-d H:i:s');

        // ---- 1. Roles Data ----
        $roles = [
            ['name' => 'admin',   'display_name' => 'Administrator', 'description' => 'Full access to all system modules.', 'created_at' => $now],
            ['name' => 'manager', 'display_name' => 'Manager',       'description' => 'Access to management and report modules.', 'created_at' => $now],
            ['name' => 'user',    'display_name' => 'User',          'description' => 'Basic access to the system.', 'created_at' => $now],
        ];
        $this->db->table('roles')->insertBatch($roles);

        $adminRoleId   = $this->db->table('roles')->where('name', 'admin')->get()->getRow()->id;
        $managerRoleId = $this->db->table('roles')->where('name', 'manager')->get()->getRow()->id;
        $userRoleId    = $this->db->table('roles')->where('name', 'user')->get()->getRow()->id;

        // ---- 2. Users Data ----
        $users = [
            [
                'fullname'   => 'Super Admin',
                'username'   => 'admin',
                'email'      => 'admin@domain.com',
                'phone'      => '0123456789',
                'password'   => password_hash('Admin@1234', PASSWORD_DEFAULT),
                'role_id'    => $adminRoleId,
                'is_active'  => 1,
                'created_at' => $now,
                'deleted_at' => null,
            ],
            [
                'fullname'   => 'John Manager',
                'username'   => 'manager',
                'email'      => 'manager@domain.com',
                'phone'      => '0111234567',
                'password'   => password_hash('Manager@1234', PASSWORD_DEFAULT),
                'role_id'    => $managerRoleId,
                'is_active'  => 1,
                'created_at' => $now,
                'deleted_at' => null,
            ],
            [
                'fullname'   => 'Jane User',
                'username'   => 'user',
                'email'      => 'user@domain.com',
                'phone'      => '0197654321',
                'password'   => password_hash('User@1234', PASSWORD_DEFAULT),
                'role_id'    => $userRoleId,
                'is_active'  => 1,
                'created_at' => $now,
                'deleted_at' => null,
            ],
        ];
        $this->db->table('users')->insertBatch($users);

        // ---- 3. Sample Items Data ----
        $adminId = $this->db->table('users')->where('username', 'admin')->get()->getRow()->id;

        $statuses = ['active', 'pending', 'inactive'];
        $categories = ['Category A', 'Category B', 'Category C'];

        for ($i = 1; $i <= 12; $i++) {
            $this->db->table('items')->insert([
                'name'        => 'Sample Item ' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'category'    => $categories[($i - 1) % 3],
                'description' => 'Description for sample item number ' . $i . '.',
                'status'      => $statuses[($i - 1) % 3],
                'created_by'  => $adminId,
                'created_at'  => date('Y-m-d H:i:s', strtotime("-{$i} days")),
            ]);
        }

        // ---- 4. Default System Settings ----
        $settings = [
            ['key' => 'app_name',         'value' => 'My System', 'created_at' => $now],
            ['key' => 'app_tagline',      'value' => 'An efficient, secure, and user-friendly management system.', 'created_at' => $now],
            ['key' => 'company_name',     'value' => 'Your Organization', 'created_at' => $now],
            ['key' => 'timezone',         'value' => 'Asia/Kuala_Lumpur', 'created_at' => $now],
            ['key' => 'system_email',     'value' => 'noreply@domain.com', 'created_at' => $now],
            ['key' => 'email_protocol',   'value' => 'mail', 'created_at' => $now],
            ['key' => 'smtp_host',        'value' => 'smtp.mailtrap.io', 'created_at' => $now],
            ['key' => 'smtp_port',        'value' => '587', 'created_at' => $now],
            ['key' => 'maintenance_mode', 'value' => '0', 'created_at' => $now],
            ['key' => 'login_attempts',   'value' => '5', 'created_at' => $now],
            ['key' => 'session_timeout',  'value' => '7200', 'created_at' => $now],
        ];
        $this->db->table('settings')->insertBatch($settings);

        // Console Output
        echo "Seeder executed successfully!\n";
        echo "-----------------------------------\n";
        echo "Admin Login  : admin@domain.com / Admin@1234\n";
        echo "Manager Login: manager@domain.com / Manager@1234\n";
        echo "User Login   : user@domain.com / User@1234\n";
    }
}