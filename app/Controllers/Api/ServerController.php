<?php
namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\ServerModel;

class ServerController extends ResourceController {
    protected $format = 'json';

    protected function getModelInstance() {
        $model = new ServerModel();
        $model->ensureTableExists();
        return $model;
    }

    /**
     * Get list of all monitored servers
     */
    public function index() {
        $model = $this->getModelInstance();
        $servers = $model->orderBy('id', 'ASC')->findAll();
        
        $onlineCount = 0;
        $offlineCount = 0;
        foreach ($servers as $s) {
            if ($s['status'] === 'online') $onlineCount++;
            else $offlineCount++;
        }

        return $this->respond([
            'status' => 'success',
            'total' => count($servers),
            'online_count' => $onlineCount,
            'offline_count' => $offlineCount,
            'data' => $servers
        ]);
    }

    /**
     * Register a new server
     */
    public function create() {
        $model = $this->getModelInstance();
        $data = $this->request->getJSON(true) ?? $this->request->getPost();

        if (empty($data['name']) || empty($data['ip_address'])) {
            return $this->failValidationErrors('Nama Pelayan dan Alamat IP diperlukan.');
        }

        $ip = trim($data['ip_address']);
        $port = !empty($data['port']) ? (int)$data['port'] : null;

        // Perform immediate health check
        $health = $this->checkServerHealth($ip, $port);

        $insertData = [
            'name' => trim($data['name']),
            'ip_address' => $ip,
            'port' => $port,
            'service_type' => !empty($data['service_type']) ? trim($data['service_type']) : 'General',
            'location' => !empty($data['location']) ? trim($data['location']) : 'Bilik Server',
            'description' => !empty($data['description']) ? trim($data['description']) : null,
            'status' => $health['status'],
            'latency_ms' => $health['latency_ms'],
            'last_checked_at' => date('Y-m-d H:i:s')
        ];

        $newId = $model->insert($insertData);
        if (!$newId) {
            return $this->fail('Gagal mendaftar pelayan baharu.');
        }

        $created = $model->find($newId);
        return $this->respondCreated([
            'status' => 'success',
            'message' => 'Pelayan berjaya didaftarkan!',
            'data' => $created
        ]);
    }

    /**
     * Update an existing server
     */
    public function update($id = null) {
        $model = $this->getModelInstance();
        $server = $model->find($id);
        if (!$server) {
            return $this->failNotFound('Pelayan tidak dijumpai.');
        }

        $data = $this->request->getJSON(true) ?? $this->request->getPost();
        $updateData = [];

        if (isset($data['name'])) $updateData['name'] = trim($data['name']);
        if (isset($data['ip_address'])) $updateData['ip_address'] = trim($data['ip_address']);
        if (array_key_exists('port', $data)) $updateData['port'] = !empty($data['port']) ? (int)$data['port'] : null;
        if (isset($data['service_type'])) $updateData['service_type'] = trim($data['service_type']);
        if (isset($data['location'])) $updateData['location'] = trim($data['location']);
        if (isset($data['description'])) $updateData['description'] = trim($data['description']);

        // Check if IP or port changed, re-ping
        $ip = $updateData['ip_address'] ?? $server['ip_address'];
        $port = array_key_exists('port', $updateData) ? $updateData['port'] : $server['port'];
        $health = $this->checkServerHealth($ip, $port);

        $updateData['status'] = $health['status'];
        $updateData['latency_ms'] = $health['latency_ms'];
        $updateData['last_checked_at'] = date('Y-m-d H:i:s');

        $model->update($id, $updateData);
        $updated = $model->find($id);

        return $this->respond([
            'status' => 'success',
            'message' => 'Maklumat pelayan berjaya dikemaskini.',
            'data' => $updated
        ]);
    }

    /**
     * Delete server
     */
    public function delete($id = null) {
        $model = $this->getModelInstance();
        $server = $model->find($id);
        if (!$server) {
            return $this->failNotFound('Pelayan tidak dijumpai.');
        }

        $model->delete($id);
        return $this->respondDeleted([
            'status' => 'success',
            'message' => 'Pelayan berjaya dipadam.'
        ]);
    }

    /**
     * Ping a single server
     */
    public function ping($id = null) {
        $model = $this->getModelInstance();
        $server = $model->find($id);
        if (!$server) {
            return $this->failNotFound('Pelayan tidak dijumpai.');
        }

        $health = $this->checkServerHealth($server['ip_address'], $server['port']);
        $model->update($id, [
            'status' => $health['status'],
            'latency_ms' => $health['latency_ms'],
            'last_checked_at' => date('Y-m-d H:i:s')
        ]);

        $updated = $model->find($id);
        return $this->respond([
            'status' => 'success',
            'health' => $health,
            'data' => $updated
        ]);
    }

    /**
     * Ping all servers and return updated list
     */
    public function pingAll() {
        $model = $this->getModelInstance();
        $servers = $model->findAll();

        foreach ($servers as &$s) {
            $health = $this->checkServerHealth($s['ip_address'], $s['port']);
            $model->update($s['id'], [
                'status' => $health['status'],
                'latency_ms' => $health['latency_ms'],
                'last_checked_at' => date('Y-m-d H:i:s')
            ]);
            $s['status'] = $health['status'];
            $s['latency_ms'] = $health['latency_ms'];
            $s['last_checked_at'] = date('Y-m-d H:i:s');
        }
        unset($s); // Break reference to prevent PHP loop overwrite

        $onlineCount = 0;
        $offlineCount = 0;
        foreach ($servers as $s) {
            if ($s['status'] === 'online') $onlineCount++;
            else $offlineCount++;
        }

        return $this->respond([
            'status' => 'success',
            'message' => 'Semua pelayan berjaya disemak.',
            'total' => count($servers),
            'online_count' => $onlineCount,
            'offline_count' => $offlineCount,
            'data' => $servers
        ]);
    }

    /**
     * Internal Health Check: Socket check or ICMP ping
     */
    private function checkServerHealth($ip, $port = null) {
        $ip = trim($ip);
        if (empty($ip)) {
            return ['status' => 'offline', 'latency_ms' => null];
        }

        // 1. Try Socket connection if port provided
        if (!empty($port) && (int)$port > 0) {
            $start = microtime(true);
            $errno = 0;
            $errstr = '';
            $fp = @fsockopen($ip, (int)$port, $errno, $errstr, 1.2);
            $latency = (int) round((microtime(true) - $start) * 1000);
            if ($fp) {
                fclose($fp);
                return [
                    'status' => 'online',
                    'latency_ms' => max(1, $latency),
                    'method' => 'socket'
                ];
            }
        }

        // 2. Fallback to ICMP ping (Windows format)
        $output = [];
        $resultCode = -1;
        $cmd = "ping -n 1 -w 1000 " . escapeshellarg($ip);
        @exec($cmd, $output, $resultCode);

        if ($resultCode === 0) {
            $outputText = implode(' ', $output);
            // Parse: time=12ms or time<1ms
            if (preg_match('/time[=<](\d+)ms/i', $outputText, $matches)) {
                $lat = (int)$matches[1];
                return [
                    'status' => 'online',
                    'latency_ms' => max(1, $lat),
                    'method' => 'icmp'
                ];
            }
            return [
                'status' => 'online',
                'latency_ms' => 1,
                'method' => 'icmp'
            ];
        }

        return [
            'status' => 'offline',
            'latency_ms' => null,
            'method' => 'failed'
        ];
    }
}
