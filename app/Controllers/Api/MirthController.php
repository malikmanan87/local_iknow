<?php
namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;

class MirthController extends ResourceController
{
    protected $format = 'json';

    private function mirthHost(): string
    {
        return rtrim(env('MIRTH_HOST', 'https://10.0.20.210:8443'), '/');
    }

    private function mirthRequest(string $endpoint, string $method = 'GET', array $postFields = [], ?string $cookieFile = null): array
    {
        $url     = $this->mirthHost() . $endpoint;
        $timeout = (int) env('MIRTH_TIMEOUT', 15);

        $headers = ['X-Requested-With: XMLHttpRequest', 'Accept: application/xml'];
        if ($method === 'POST') {
            $headers[] = 'Content-Type: application/x-www-form-urlencoded';
        }

        $ch   = curl_init();
        $opts = [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_TIMEOUT        => $timeout,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_HEADER         => true,
        ];

        if ($cookieFile) {
            $opts[CURLOPT_COOKIEFILE] = $cookieFile;
            $opts[CURLOPT_COOKIEJAR]  = $cookieFile;
        }

        if ($method === 'POST') {
            $opts[CURLOPT_POST]       = true;
            $opts[CURLOPT_POSTFIELDS] = http_build_query($postFields);
        }

        curl_setopt_array($ch, $opts);
        $raw        = curl_exec($ch);
        $httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $body       = substr($raw, $headerSize);
        $curlErr    = curl_error($ch);
        curl_close($ch);

        return ['code' => $httpCode, 'body' => trim($body), 'error' => $curlErr];
    }

    // Plain GET with Accept: */* (for endpoints like /api/server/version that reject application/xml)
    private function mirthRequestRaw(string $endpoint): array
    {
        $url = $this->mirthHost() . $endpoint;
        $ch  = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_TIMEOUT        => (int) env('MIRTH_TIMEOUT', 15),
            CURLOPT_HTTPHEADER     => ['X-Requested-With: XMLHttpRequest', 'Accept: */*'],
            CURLOPT_HEADER         => true,
        ]);
        $raw        = curl_exec($ch);
        $code       = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $body       = substr($raw, $headerSize);
        $err        = curl_error($ch);
        curl_close($ch);
        return ['code' => $code, 'body' => trim($body), 'error' => $err];
    }

    // Get a session cookie file path (per-request temp)
    private function getCookieFile(): string
    {
        $dir = WRITEPATH . 'mirth_sessions';
        if (!is_dir($dir)) {
            mkdir($dir, 0700, true);
        }
        return $dir . '/mirth_session.txt';
    }

    // Login to Mirth and return cookie file path, or null on failure
    private function login(): ?string
    {
        $cookieFile = $this->getCookieFile();
        $user = env('MIRTH_USER', '');
        $pass = env('MIRTH_PASS', '');

        $r = $this->mirthRequest(
            '/api/users/_login',
            'POST',
            ['username' => $user, 'password' => $pass],
            $cookieFile
        );

        if ($r['code'] === 200) {
            return $cookieFile;
        }
        return null;
    }

    // Parse simple XML to array helper
    private function xmlToArray(string $xml): array
    {
        if (empty(trim($xml))) return [];
        try {
            $obj = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
            if ($obj === false) return [];
            return json_decode(json_encode($obj), true);
        } catch (\Throwable $e) {
            return [];
        }
    }

    // GET /api/mirth/status
    public function status()
    {
        // Version endpoint only accepts */* not application/xml
        $vr = $this->mirthRequestRaw('/api/server/version');
        $connected = ($vr['code'] === 200 && empty($vr['error']));

        if (!$connected) {
            // Try login anyway to double-check
            $cookieFile = $this->login();
            $connected  = $cookieFile !== null;
        }

        $version = $connected ? trim(strip_tags($vr['body'])) : null;

        // Try login to confirm credentials work
        $cookieFile    = $this->login();
        $authenticated = $cookieFile !== null;
        $connected     = $connected || $authenticated;

        // If login works but version failed (406), still show as connected
        if ($authenticated && empty($version)) {
            $vr2   = $this->mirthRequestRaw('/api/server/version');
            $version = trim(strip_tags($vr2['body'])) ?: '4.x';
        }

        return $this->respond([
            'connected'     => $connected || $authenticated,
            'authenticated' => $authenticated,
            'version'       => $version,
            'host'          => $this->mirthHost(),
        ]);
    }

    // GET /api/mirth/channels
    public function channels()
    {
        $cookieFile = $this->login();
        if (!$cookieFile) {
            return $this->fail('Gagal log masuk ke Mirth Connect. Semak credentials dalam .env', 401);
        }

        $r = $this->mirthRequest('/api/channels/statuses', 'GET', [], $cookieFile);

        if ($r['code'] !== 200) {
            return $this->fail("Mirth API error: HTTP {$r['code']}", 502);
        }

        $data = $this->xmlToArray($r['body']);
        $channels = [];

        $list = $data['dashboardStatus'] ?? [];
        if (isset($list['name'])) {
            // Single channel — wrap
            $list = [$list];
        }

        foreach ((array)$list as $ch) {
            $channels[] = [
                'id'             => (string)($ch['channelId'] ?? ''),
                'name'           => (string)($ch['name'] ?? ''),
                'state'          => (string)($ch['state'] ?? ''),
                'received'       => (int)($ch['statistics']['received'] ?? 0),
                'sent'           => (int)($ch['statistics']['sent'] ?? 0),
                'error'          => (int)($ch['statistics']['error'] ?? 0),
                'queued'         => (int)($ch['statistics']['queued'] ?? 0),
                'filtered'       => (int)($ch['statistics']['filtered'] ?? 0),
            ];
        }

        return $this->respond(['channels' => $channels, 'total' => count($channels)]);
    }

    // GET /api/mirth/messages?channel_id=X&type=ORU&status=ERROR&mrn=&date_from=&date_to=&limit=50&offset=0
    public function messages()
    {
        $cookieFile = $this->login();
        if (!$cookieFile) {
            return $this->fail('Gagal log masuk ke Mirth Connect. Semak credentials dalam .env', 401);
        }

        $channelId = $this->request->getGet('channel_id');
        $typeFilter = strtoupper($this->request->getGet('type') ?? '');
        $statusFilter = strtoupper($this->request->getGet('status') ?? '');
        $mrnFilter = $this->request->getGet('mrn') ?? '';
        $limit = max(1, min(200, (int)($this->request->getGet('limit') ?? 50)));
        $offset = max(0, (int)($this->request->getGet('offset') ?? 0));

        if (empty($channelId)) {
            return $this->fail('channel_id diperlukan', 400);
        }

        // Build query params for Mirth API
        $params = http_build_query([
            'limit'  => $limit,
            'offset' => $offset,
            'includeContent' => 'true',
        ]);

        $r = $this->mirthRequest("/api/channels/{$channelId}/messages?{$params}", 'GET', [], $cookieFile);

        if ($r['code'] !== 200) {
            return $this->fail("Mirth API error: HTTP {$r['code']}", 502);
        }

        $data = $this->xmlToArray($r['body']);
        $messages = [];

        $list = $data['message'] ?? [];
        if (isset($list['messageId'])) {
            $list = [$list]; // Single message wrap
        }

        foreach ((array)$list as $msg) {
            $rawContent = '';
            $msgType    = '';
            $mrn        = '';
            $orderId    = '';
            $status     = (string)($msg['processedResponse']['status'] ?? $msg['status'] ?? '');

            // Extract raw HL7 content
            $sourceContent = $msg['connectorMessages']['entry']['connectorMessage']['raw']['content'] ?? '';
            if (!empty($sourceContent)) {
                $rawContent = (string)$sourceContent;
                // Parse MSH-9 for message type
                if (preg_match('/MSH\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|([^\|]+)/', $rawContent, $m)) {
                    $msgType = trim($m[1]);
                }
                // Parse PID-3 for MRN
                if (preg_match('/PID\|[^|]*\|[^|]*\|([^|^]+)/', $rawContent, $m)) {
                    $mrn = trim($m[1]);
                }
                // Parse ORC-3 or OBR-3 for Order ID
                if (preg_match('/ORC\|[^|]*\|([^|]+)/', $rawContent, $m)) {
                    $orderId = trim($m[1]);
                }
            }

            // Apply filters
            if (!empty($typeFilter)) {
                $baseType = explode('^', $msgType)[0] ?? '';
                $hl7Event = explode('^', $msgType)[1] ?? '';
                $matchType = false;
                if ($typeFilter === 'ORM' && str_contains($msgType, 'ORM')) $matchType = true;
                if ($typeFilter === 'ORR' && str_contains($msgType, 'ORR')) $matchType = true;
                if ($typeFilter === 'ORU' && str_contains($msgType, 'ORU')) $matchType = true;
                if ($typeFilter === 'P03' && str_contains($msgType, 'P03')) $matchType = true;
                if (!$matchType) continue;
            }

            if (!empty($statusFilter) && strtoupper($status) !== $statusFilter) {
                continue;
            }

            if (!empty($mrnFilter) && !str_contains($mrn, $mrnFilter)) {
                continue;
            }

            $messages[] = [
                'message_id'  => (string)($msg['messageId'] ?? ''),
                'date_time'   => (string)($msg['receivedDate']['time'] ?? ''),
                'msg_type'    => $msgType,
                'status'      => $status,
                'mrn'         => $mrn,
                'order_id'    => $orderId,
                'raw_hl7'     => $rawContent,
            ];
        }

        return $this->respond([
            'channel_id' => $channelId,
            'total'      => count($messages),
            'messages'   => $messages,
        ]);
    }
}
