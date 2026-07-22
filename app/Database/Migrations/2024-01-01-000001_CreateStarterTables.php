<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateStarterTables extends Migration
{
    public function up(): void
    {
        // ---- Roles ----
        $this->forge->addField([
            'id'           => ['type' => 'INT', 'auto_increment' => true],
            'name'         => ['type' => 'VARCHAR', 'constraint' => 50, 'unique' => true],
            'display_name' => ['type' => 'VARCHAR', 'constraint' => 100],
            'description'  => ['type' => 'TEXT', 'null' => true],
            'created_at'   => ['type' => 'DATETIME', 'null' => true],
            'updated_at'   => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('roles');

        // ---- Users ----
        $this->forge->addField([
            'id'           => ['type' => 'INT', 'auto_increment' => true],
            'fullname'     => ['type' => 'VARCHAR', 'constraint' => 100],
            'username'     => ['type' => 'VARCHAR', 'constraint' => 50, 'unique' => true],
            'email'        => ['type' => 'VARCHAR', 'constraint' => 150, 'unique' => true],
            'phone'        => ['type' => 'VARCHAR', 'constraint' => 20, 'null' => true],
            'avatar'       => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'password'     => ['type' => 'VARCHAR', 'constraint' => 255],
            'role_id'      => ['type' => 'INT'],
            'is_active'    => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1],
            'last_login'   => ['type' => 'DATETIME', 'null' => true],
            'created_at'   => ['type' => 'DATETIME', 'null' => true],
            'updated_at'   => ['type' => 'DATETIME', 'null' => true],
            'deleted_at'   => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('role_id', 'roles', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('users');

        // ---- Items (Generic CRUD module example) ----
        $this->forge->addField([
            'id'          => ['type' => 'INT', 'auto_increment' => true],
            'name'        => ['type' => 'VARCHAR', 'constraint' => 150],
            'category'    => ['type' => 'VARCHAR', 'constraint' => 100, 'null' => true],
            'description' => ['type' => 'TEXT', 'null' => true],
            'status'      => ['type' => 'ENUM', 'constraint' => ['active', 'inactive', 'pending'], 'default' => 'pending'],
            'created_by'  => ['type' => 'INT', 'null' => true],
            'created_at'  => ['type' => 'DATETIME', 'null' => true],
            'updated_at'  => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('created_by', 'users', 'id', 'SET NULL', 'SET NULL');
        $this->forge->createTable('items');

        // ---- Settings (Jadual Baru Ditambah) ----
        $this->forge->addField([
            'id'           => ['type' => 'INT', 'auto_increment' => true],
            'key'          => ['type' => 'VARCHAR', 'constraint' => 100, 'unique' => true],
            'value'        => ['type' => 'TEXT', 'null' => true],
            'created_at'   => ['type' => 'DATETIME', 'null' => true],
            'updated_at'   => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('settings');
    }

    public function down(): void
    {
        $this->forge->dropTable('settings', true);
        $this->forge->dropTable('items', true);
        $this->forge->dropTable('users', true);
        $this->forge->dropTable('roles', true);
    }
}