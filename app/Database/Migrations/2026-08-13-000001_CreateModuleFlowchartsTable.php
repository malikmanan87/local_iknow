<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateModuleFlowchartsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'constraint'     => 11,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'module_id' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
            ],
            'context_key' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'default'    => 'main',
                'comment'    => 'main | sub_{submodule_id}',
            ],
            'flowchart_data' => [
                'type'    => 'LONGTEXT',
                'null'    => true,
                'comment' => 'JSON: { shapes: [], connections: [] }',
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey(['module_id', 'context_key']);
        $this->forge->createTable('module_flowcharts');
    }

    public function down()
    {
        $this->forge->dropTable('module_flowcharts');
    }
}
