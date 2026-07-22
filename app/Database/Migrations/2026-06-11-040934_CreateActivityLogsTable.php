<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateActivityLogsTable extends Migration
{
    public function up(): void
    {
        $this->forge->addField([
            'id'          => ['type' => 'INT', 'auto_increment' => true],
            'user_id'     => ['type' => 'INT', 'null' => true],
            'username'    => ['type' => 'VARCHAR', 'constraint' => 50, 'null' => true],
            'action'      => ['type' => 'VARCHAR', 'constraint' => 100], // Cth: Login, Create User, Delete Item
            'description' => ['type' => 'TEXT', 'null' => true],         // Perincian tindakan
            'ip_address'  => ['type' => 'VARCHAR', 'constraint' => 45],
            'user_agent'  => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'created_at'  => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('user_id', 'users', 'id', 'SET NULL', 'CASCADE');
        $this->forge->createTable('activity_logs');
    }

    public function down(): void
    {
        $this->forge->dropTable('activity_logs', true);
    }
}