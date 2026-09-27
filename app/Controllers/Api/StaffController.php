<?php
namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;

class StaffController extends ResourceController
{
    protected $format = 'json';

    private function getApiUrl(): string
    {
        return env('UNISZA_STAFF_API_URL', 'https://portal.unisza.edu.my/api_staf/search');
    }

    private function getApiKey(): string
    {
        return env('UNISZA_STAFF_API_KEY', 'df288c53d7d9fd2b9a403597dc1d049d96c0535c0042275c0cab868a24893c48');
    }

    /**
     * Search staff by name
     * GET /api/staff/search?q={name}&page={page}&limit={limit}
     */
    public function search()
    {
        $query = trim($this->request->getGet('q') ?? '');
        $page  = max(1, (int) ($this->request->getGet('page') ?? 1));
        $limit = max(1, min(50, (int) ($this->request->getGet('limit') ?? 10)));

        if (empty($query)) {
            return $this->respond([
                'success'       => true,
                'total_found'   => 0,
                'total_pages'   => 0,
                'current_page'  => 1,
                'limit'         => $limit,
                'has_next'      => false,
                'next_page'     => null,
                'prev_page'     => null,
                'data'          => []
            ]);
        }

        $apiUrl = $this->getApiUrl();
        $apiKey = $this->getApiKey();

        $queryParams = http_build_query([
            'q'     => $query,
            'page'  => $page,
            'limit' => $limit
        ]);

        $fullUrl = $apiUrl . '?' . $queryParams;

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $fullUrl,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_HTTPHEADER     => [
                'Accept: application/json',
                'X-API-KEY: ' . $apiKey
            ]
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            return $this->fail('Gagal menyambung ke API Portal UniSZA: ' . $curlError, 502);
        }

        $decoded = json_decode($response, true);
        if ($httpCode >= 400 || !$decoded) {
            return $this->fail($decoded['message'] ?? 'Ralat semasa mendapatkan data staf daripada API.', $httpCode ?: 500);
        }

        return $this->respond($decoded);
    }
}
