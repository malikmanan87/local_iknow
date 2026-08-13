<?php
namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\FlowchartModel;

class FlowchartController extends ResourceController
{
    protected $format = 'json';

    /**
     * GET api/flowcharts/{module_id}/{context_key}
     * Load flowchart data for a module + context (e.g. 'main', 'sub_12').
     * Returns empty shapes/connections if none saved yet.
     */
    public function load($module_id = null, $context_key = 'main')
    {
        $model  = new FlowchartModel();
        $record = $model
            ->where('module_id',   $module_id)
            ->where('context_key', $context_key)
            ->first();

        if (!$record) {
            return $this->respond([
                'module_id'   => (int) $module_id,
                'context_key' => $context_key,
                'shapes'      => [],
                'connections' => [],
            ]);
        }

        $data = json_decode($record['flowchart_data'], true) ?? [];

        return $this->respond([
            'module_id'   => (int) $module_id,
            'context_key' => $context_key,
            'shapes'      => $data['shapes']      ?? [],
            'connections' => $data['connections'] ?? [],
        ]);
    }

    /**
     * PUT api/flowcharts/{module_id}/{context_key}
     * Save (upsert) flowchart data for a module + context.
     * Body: { shapes: [...], connections: [...] }
     */
    public function save($module_id = null, $context_key = 'main')
    {
        $model = new FlowchartModel();
        $body  = $this->request->getJSON(true);

        if (!$module_id) {
            return $this->fail('module_id diperlukan', 400);
        }

        $payload = json_encode([
            'shapes'      => $body['shapes']      ?? [],
            'connections' => $body['connections'] ?? [],
        ]);

        $existing = $model
            ->where('module_id',   $module_id)
            ->where('context_key', $context_key)
            ->first();

        if ($existing) {
            $model->update($existing['id'], ['flowchart_data' => $payload]);
        } else {
            $model->insert([
                'module_id'      => (int) $module_id,
                'context_key'    => $context_key,
                'flowchart_data' => $payload,
            ]);
        }

        return $this->respond(['message' => 'Flow chart berjaya disimpan']);
    }
}
