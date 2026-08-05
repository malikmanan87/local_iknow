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

        // 1. Fetch channel statuses
        $r = $this->mirthRequest('/api/channels/statuses', 'GET', [], $cookieFile);
        if ($r['code'] !== 200) {
            return $this->fail("Mirth API error: HTTP {$r['code']}", 502);
        }

        // 2. Fetch channel groups
        $channelGroupMap = [];
        $rGroups = $this->mirthRequest('/api/channelgroups', 'GET', [], $cookieFile);
        if ($rGroups['code'] === 200 && !empty($rGroups['body'])) {
            $gXml = @simplexml_load_string($rGroups['body']);
            if ($gXml && isset($gXml->channelGroup)) {
                foreach ($gXml->channelGroup as $grp) {
                    $gName = (string)$grp->name;
                    if (isset($grp->channels->channel)) {
                        foreach ($grp->channels->channel as $ch) {
                            $channelGroupMap[(string)$ch->id] = $gName;
                        }
                    }
                }
            }
        }

        $data = $this->xmlToArray($r['body']);
        $channels = [];

        $list = $data['dashboardStatus'] ?? [];
        if (isset($list['name'])) {
            $list = [$list];
        }

        foreach ((array)$list as $ch) {
            $cid = (string)($ch['channelId'] ?? '');
            $channels[] = [
                'id'       => $cid,
                'name'     => (string)($ch['name'] ?? ''),
                'group'    => $channelGroupMap[$cid] ?? '[Default Group]',
                'state'    => (string)($ch['state'] ?? ''),
                'received' => (int)($ch['statistics']['received'] ?? 0),
                'sent'     => (int)($ch['statistics']['sent'] ?? 0),
                'error'    => (int)($ch['statistics']['error'] ?? 0),
                'queued'   => (int)($ch['statistics']['queued'] ?? 0),
                'filtered' => (int)($ch['statistics']['filtered'] ?? 0),
            ];
        }

        // Sort channels alphabetically by name (A→Z)
        usort($channels, fn($a, $b) => strcasecmp($a['name'], $b['name']));

        // Get unique groups
        $groups = array_values(array_unique(array_column($channels, 'group')));
        sort($groups);

        return $this->respond([
            'channels' => $channels,
            'groups'   => $groups,
            'total'    => count($channels)
        ]);
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
        $queryParams = [
            'limit'          => $limit,
            'offset'         => $offset,
            'includeContent' => 'true',
        ];

        if (!empty($mrnFilter)) {
            $queryParams['textSearch'] = $mrnFilter;
        }

        $params = http_build_query($queryParams);

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

            // Robustly extract raw HL7 content from connectorMessages
            if (!empty($msg['connectorMessages']['entry'])) {
                $entries = $msg['connectorMessages']['entry'];
                if (isset($entries['connectorMessage'])) {
                    $entries = [$entries]; // Wrap single entry
                }
                foreach ((array)$entries as $entry) {
                    $cMsg = $entry['connectorMessage'] ?? [];
                    $raw  = $cMsg['raw']['content'] ?? $cMsg['transformed']['content'] ?? '';
                    if (!empty($raw)) {
                        $rawContent = (string)$raw;
                        break;
                    }
                }
            }

            if (!empty($rawContent)) {
                // Parse MSH-9 for message type
                if (preg_match('/MSH\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|([^\|]+)/', $rawContent, $m)) {
                    $msgType = trim($m[1]);
                }
                // Parse PID-3 or PID-2 for MRN
                if (preg_match('/PID\|[^|]*\|[^|]*\|([^|^]+)/', $rawContent, $m)) {
                    $mrn = trim($m[1]);
                } elseif (preg_match('/PID\|[^|]*\|([^|^]+)/', $rawContent, $m)) {
                    $mrn = trim($m[1]);
                }
                // Parse ORC-2 / ORC-3 or OBR-2 / OBR-3 for Order ID
                if (preg_match('/ORC\|[^|]*\|([^|]+)/', $rawContent, $m)) {
                    $orderId = trim($m[1]);
                } elseif (preg_match('/OBR\|[^|]*\|([^|]+)/', $rawContent, $m)) {
                    $orderId = trim($m[1]);
                }
            }

            // Apply filters
            if (!empty($typeFilter)) {
                $matchType = false;
                if ($typeFilter === 'ORM' && str_contains($msgType, 'ORM')) $matchType = true;
                if ($typeFilter === 'ORR' && str_contains($msgType, 'ORR')) $matchType = true;
                if ($typeFilter === 'ORU' && str_contains($msgType, 'ORU')) $matchType = true;
                if ($typeFilter === 'P03' && (str_contains($msgType, 'P03') || str_contains($msgType, 'DFT'))) $matchType = true;
                if (!$matchType) continue;
            }

            if (!empty($statusFilter) && strtoupper($status) !== $statusFilter) {
                continue;
            }

            if (!empty($mrnFilter)) {
                $mrnMatch = (!empty($mrn) && str_contains($mrn, $mrnFilter)) || str_contains($rawContent, $mrnFilter);
                if (!$mrnMatch) continue;
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
