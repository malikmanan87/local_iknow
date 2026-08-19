<?php
namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;

/**
 * MirthController — READ-ONLY Proxy to Mirth Connect
 *
 * SECURITY CONTRACT:
 *   - This controller ONLY reads data from Mirth Connect.
 *   - The ONLY POST request allowed to Mirth is /api/users/_login (authentication).
 *   - All channel data, messages, and HL7 content are fetched via GET only.
 *   - No channel state changes, message sends, or config writes are permitted.
 *   - mirthRequest() enforces this: POST is blocked for all non-login endpoints.
 *
 * ALLOWED MIRTH ENDPOINTS (READ-ONLY):
 *   GET /api/server/version
 *   GET /api/channels/statuses
 *   GET /api/channelgroups
 *   GET /api/channels/{id}/messages
 *   GET /api/channels/{id}/messages/{msgId}
 *   POST /api/users/_login  ← authentication only, not a data write
 */
class MirthController extends ResourceController
{
    protected $format = 'json';

    // ── Config Helpers ────────────────────────────────────────────────────────

    private function mirthHost(): string
    {
        return rtrim(env('MIRTH_HOST', 'https://10.0.20.210:8443'), '/');
    }

    private function mirthTimeout(): int
    {
        return (int) env('MIRTH_TIMEOUT', 15);
    }

    // ── HTTP Helper ───────────────────────────────────────────────────────────

    private function mirthRequest(
        string $endpoint,
        string $method = 'GET',
        array $postFields = [],
        ?string $cookieFile = null,
        bool $wantXml = true
    ): array {
        // ── READ-ONLY SECURITY GUARD ──────────────────────────────────────────
        // POST is ONLY permitted for the Mirth login endpoint.
        // Any other write method (POST/PUT/DELETE/PATCH) is blocked here.
        if ($method !== 'GET' && $endpoint !== '/api/users/_login') {
            return [
                'code'  => 403,
                'body'  => 'Forbidden: read-only mode — only GET requests are permitted to Mirth',
                'error' => 'read_only_guard',
            ];
        }

        $url     = $this->mirthHost() . $endpoint;
        $headers = ['X-Requested-With: XMLHttpRequest'];
        $headers[] = $wantXml ? 'Accept: application/xml' : 'Accept: */*';

        if ($method === 'POST') {
            $headers[] = 'Content-Type: application/x-www-form-urlencoded';
        }

        $ch   = curl_init();
        $opts = [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_TIMEOUT        => $this->mirthTimeout(),
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_HEADER         => true,
            CURLOPT_FOLLOWLOCATION => true,
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
        $body       = ($raw && $headerSize) ? substr($raw, $headerSize) : '';
        $curlErr    = curl_error($ch);
        curl_close($ch);

        return ['code' => $httpCode, 'body' => trim($body), 'error' => $curlErr];
    }

    // ── Parallel Concurrent HTTP Helper (curl_multi) ──────────────────────────

    /**
     * Executes multiple GET requests concurrently to Mirth Connect.
     * Includes Windows-safe select loop handling and 45s timeout.
     *
     * @param array<string, string> $requests Map of [key => endpoint]
     * @param string|null $cookieFile
     * @return array<string, array{code: int, body: string, error: string}>
     */
    private function mirthMultiGet(array $requests, ?string $cookieFile = null): array
    {
        if (empty($requests)) {
            return [];
        }

        $mh      = curl_multi_init();
        $handles = [];
        $headers = [
            'X-Requested-With: XMLHttpRequest',
            'Accept: application/xml',
        ];

        foreach ($requests as $key => $endpoint) {
            $ch = curl_init();
            $url = $this->mirthHost() . $endpoint;
            $opts = [
                CURLOPT_URL            => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_TIMEOUT        => 45,
                CURLOPT_HTTPHEADER     => $headers,
                CURLOPT_HEADER         => true,
                CURLOPT_BUFFERSIZE     => 131072,
                CURLOPT_FOLLOWLOCATION => true,
            ];

            if ($cookieFile) {
                $opts[CURLOPT_COOKIEFILE] = $cookieFile;
                $opts[CURLOPT_COOKIEJAR]  = $cookieFile;
            }

            curl_setopt_array($ch, $opts);
            curl_multi_add_handle($mh, $ch);
            $handles[$key] = $ch;
        }

        $running = null;
        do {
            $status = curl_multi_exec($mh, $running);
            if ($running > 0) {
                if (curl_multi_select($mh, 0.05) === -1) {
                    usleep(10000); // 10ms fallback for Windows socket descriptors
                }
            }
        } while ($running > 0 && $status === CURLM_OK);

        $results = [];
        foreach ($handles as $key => $ch) {
            $raw        = curl_multi_getcontent($ch);
            $httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
            $body       = ($raw && $headerSize) ? substr($raw, $headerSize) : '';
            $curlErr    = curl_error($ch);

            $results[$key] = [
                'code'  => $httpCode,
                'body'  => trim((string)$body),
                'error' => $curlErr,
            ];

            curl_multi_remove_handle($mh, $ch);
            curl_close($ch);
        }

        curl_multi_close($mh);

        return $results;
    }

    // ── Session / Login ───────────────────────────────────────────────────────

    private function getCookieDir(): string
    {
        $dir = WRITEPATH . 'mirth_sessions';
        if (!is_dir($dir)) {
            mkdir($dir, 0700, true);
        }
        return $dir;
    }

    /**
     * Returns a valid cookie file path with an active Mirth session,
     * or null if login fails.
     */
    private function getSession(): ?string
    {
        $cacheKey = 'mirth_session_v1';

        // 1. Fast path — trust cached session
        $cached = cache($cacheKey);
        if ($cached && file_exists($cached)) {
            return $cached;
        }

        // 2. Fresh login — use file lock to prevent race conditions
        $lockFile = $this->getCookieDir() . '/login.lock';
        $lock     = fopen($lockFile, 'c');
        if (!$lock) {
            return $this->doLogin();
        }

        flock($lock, LOCK_EX);
        try {
            $cached = cache($cacheKey);
            if ($cached && file_exists($cached)) {
                return $cached;
            }
            return $this->doLogin();
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }

    /**
     * Perform actual Mirth login and cache the cookie path for 5 minutes.
     */
    private function doLogin(): ?string
    {
        $cookieFile = $this->getCookieDir() . '/mirth_' . uniqid() . '.txt';
        $r = $this->mirthRequest(
            '/api/users/_login',
            'POST',
            ['username' => env('MIRTH_USER', ''), 'password' => env('MIRTH_PASS', '')],
            $cookieFile
        );
        if ($r['code'] === 200) {
            cache()->save('mirth_session_v1', $cookieFile, 300);
            return $cookieFile;
        }
        return null;
    }

    /**
     * Force a fresh login (clears cache). Use when a request returns 401.
     */
    private function refreshSession(): ?string
    {
        cache()->delete('mirth_session_v1');
        return $this->getSession();
    }

    // ── XML Helper ────────────────────────────────────────────────────────────

    private function xmlToArray(string $xml): array
    {
        if (empty(trim($xml))) return [];
        try {
            $obj = @simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
            if ($obj === false) return [];
            return json_decode(json_encode($obj), true);
        } catch (\Throwable $e) {
            return [];
        }
    }

    // ── HL7 Parsing Helpers ───────────────────────────────────────────────────

    /**
     * Extract key fields from raw HL7 string.
     * Extracts Message Type, MRN (PID-3 / PID-2), and Order ID (ORC-2 / OBR-2 / OBR-3).
     *
     * @return array{0: string, 1: string, 2: string} [msgType, mrn, orderId]
     */
    private function parseHl7Fields(string $raw): array
    {
        $msgType = '';
        $mrn     = '';
        $orderId = '';

        if (empty($raw)) {
            return [$msgType, $mrn, $orderId];
        }

        $lines = preg_split('/[\r\n]+/', $raw);

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            $f   = explode('|', $line);
            $seg = $f[0] ?? '';

            if ($seg === 'MSH') {
                $msgType = $f[8] ?? '';
            } elseif ($seg === 'PID') {
                if (empty($mrn) && !empty($f[3])) {
                    $pid3 = $f[3];
                    $repParts = explode('~', $pid3);
                    foreach ($repParts as $rp) {
                        $compParts = explode('^', $rp);
                        $candidate = trim($compParts[0]);
                        if (!empty($candidate)) {
                            $mrn = $candidate;
                            break;
                        }
                    }
                }
                if (empty($mrn) && !empty($f[2])) {
                    $mrn = trim(explode('^', $f[2])[0]);
                }
                if (empty($mrn) && !empty($f[4])) {
                    $mrn = trim(explode('^', $f[4])[0]);
                }
            } elseif ($seg === 'ORC') {
                if (empty($orderId) && !empty($f[2])) {
                    $orderId = trim(explode('^', $f[2])[0]);
                } elseif (empty($orderId) && !empty($f[3])) {
                    $orderId = trim(explode('^', $f[3])[0]);
                }
            } elseif ($seg === 'OBR') {
                if (empty($orderId) && !empty($f[2])) {
                    $orderId = trim(explode('^', $f[2])[0]);
                } elseif (empty($orderId) && !empty($f[3])) {
                    $orderId = trim(explode('^', $f[3])[0]);
                }
            }
        }

        return [$msgType, $mrn, $orderId];
    }

    /**
     * Extract raw HL7 content string from a parsed Mirth message array.
     */
    private function extractRawContent(array $msg): string
    {
        if (empty($msg['connectorMessages']['entry'])) return '';

        $entries = $msg['connectorMessages']['entry'];
        if (isset($entries['connectorMessage'])) {
            $entries = [$entries];
        }

        // Collect all non-empty content candidates across ALL connectors.
        // For ORU messages (e.g. LIS Strateq with many OBX segments), the source
        // connector's 'raw' content may be partial/incomplete. The destination
        // connector's 'encoded' or 'sent' content often holds the full HL7.
        // We return the longest content found to ensure all result segments are captured.
        $best = '';
        foreach ((array)$entries as $entry) {
            $cMsg = $entry['connectorMessage'] ?? $entry;

            $candidates = [
                $cMsg['raw']['content']         ?? '',
                $cMsg['transformed']['content'] ?? '',
                $cMsg['encoded']['content']     ?? '',
                $cMsg['sent']['content']        ?? '',
                $cMsg['response']['content']    ?? '',
            ];

            foreach ($candidates as $candidate) {
                $candidate = (string)$candidate;
                if (!empty($candidate) && strlen($candidate) > strlen($best)) {
                    $best = $candidate;
                }
            }
        }

        return $best;
    }

    // ── Endpoints ─────────────────────────────────────────────────────────────

    // GET /api/mirth/status
    public function status()
    {
        $host          = $this->mirthHost();
        $version       = null;
        $connected     = false;
        $authenticated = false;

        $cookieFile = $this->getSession();

        if ($cookieFile) {
            $vr = $this->mirthRequest('/api/server/version', 'GET', [], $cookieFile, false);

            if ($vr['code'] === 200 || $vr['code'] === 406) {
                $connected     = true;
                $authenticated = true;
                $version       = trim(strip_tags($vr['body'])) ?: '4.x';
            } elseif ($vr['code'] === 401) {
                $connected  = true;
                $cookieFile = $this->refreshSession();
                if ($cookieFile) {
                    $vr2 = $this->mirthRequest('/api/server/version', 'GET', [], $cookieFile, false);
                    $authenticated = ($vr2['code'] === 200 || $vr2['code'] === 406);
                    if ($authenticated) {
                        $version = trim(strip_tags($vr2['body'])) ?: '4.x';
                    }
                }
            } elseif (!empty($vr['error'])) {
                $connected     = false;
                $authenticated = false;
            } else {
                $connected = ($vr['code'] > 0);
            }
        } else {
            $ping = $this->mirthRequest('/api/server/version', 'GET', [], null, false);
            $connected = ($ping['code'] > 0 && empty($ping['error']));
        }

        return $this->respond([
            'connected'     => $connected,
            'authenticated' => $authenticated,
            'version'       => $version,
            'host'          => $host,
        ]);
    }

    // Internal helper to get channel list (with 30-min cache)
    private function getCachedChannels(bool $forceRefresh = false): ?array
    {
        $cacheKey = 'mirth_channels_metadata_v1';
        if (!$forceRefresh) {
            $cached = cache($cacheKey);
            if ($cached && is_array($cached)) {
                return $cached;
            }
        }

        $cookieFile = $this->getSession();
        if (!$cookieFile) return null;

        // 1. Channel statuses
        $r = $this->mirthRequest('/api/channels/statuses', 'GET', [], $cookieFile);
        if ($r['code'] === 401) {
            $cookieFile = $this->refreshSession();
            if (!$cookieFile) return null;
            $r = $this->mirthRequest('/api/channels/statuses', 'GET', [], $cookieFile);
        }
        if ($r['code'] !== 200) return null;

        // 2. Channel groups
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
        if (isset($list['name'])) $list = [$list];

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

        usort($channels, fn($a, $b) => strcasecmp($a['name'], $b['name']));
        $groups = array_values(array_unique(array_column($channels, 'group')));
        sort($groups);

        $result = [
            'channels' => $channels,
            'groups'   => $groups,
            'total'    => count($channels),
        ];

        cache()->save($cacheKey, $result, 1800);

        return $result;
    }

    // GET /api/mirth/channels
    public function channels()
    {
        $refresh = $this->request->getGet('refresh') === '1';
        $data = $this->getCachedChannels($refresh);

        if ($data === null) {
            return $this->fail('Gagal memuatkan senarai channel Mirth. Semak sambungan/credentials.', 502);
        }

        return $this->respond($data);
    }

    // GET /api/mirth/search
    // Reliable parallel on-demand search across channels using curl_multi
    public function search()
    {
        $cookieFile = $this->getSession();
        if (!$cookieFile) {
            return $this->fail('Gagal log masuk ke Mirth Connect.', 401);
        }

        $groupFilter     = trim($this->request->getGet('group') ?? '');
        $channelId       = trim($this->request->getGet('channel_id') ?? '');
        $mrnFilter       = trim($this->request->getGet('mrn') ?? '');
        $orderIdFilter   = trim($this->request->getGet('order_id') ?? '');
        $startDateFilter = trim($this->request->getGet('start_date') ?? '');
        $endDateFilter   = trim($this->request->getGet('end_date') ?? '');
        $typeFilter      = strtoupper(trim($this->request->getGet('type') ?? ''));
        $statusFilter    = strtoupper(trim($this->request->getGet('status') ?? ''));
        $limitPerChan    = max(10, min(300, (int)($this->request->getGet('limit') ?? 100)));

        if (empty($mrnFilter) && empty($orderIdFilter) && empty($channelId) && empty($startDateFilter)) {
            return $this->fail('Sila masukkan sekurang-kurangnya No. MRN, Order ID, atau Tarikh untuk carian.', 400);
        }

        // Get cached channel metadata
        $chanData = $this->getCachedChannels();
        if (!$chanData) {
            return $this->fail('Tidak dapat memuatkan metadata channel.', 502);
        }

        $allChannels = $chanData['channels'] ?? [];

        // Determine target channels
        $targetChannels = [];
        if (!empty($channelId)) {
            $targetChannels = array_filter($allChannels, fn($c) => $c['id'] === $channelId);
        } elseif (!empty($groupFilter) && $groupFilter !== 'Semua') {
            $targetChannels = array_filter($allChannels, fn($c) => ($c['group'] ?? '[Default Group]') === $groupFilter);
        } else {
            $targetChannels = $allChannels;
        }

        $targetChannels = array_values($targetChannels);
        if (empty($targetChannels)) {
            return $this->respond([
                'total'    => 0,
                'messages' => [],
                'group'    => $groupFilter ?: 'Semua',
            ]);
        }

        // Date range boundaries for PHP-side validation (in ms)
        $startTimeMs = !empty($startDateFilter) ? strtotime($startDateFilter . ' 00:00:00') * 1000 : null;
        $endTimeMs   = !empty($endDateFilter)   ? strtotime($endDateFilter . ' 23:59:59') * 1000   : null;

        // 1. Build parallel requests map [channel_id => endpoint]
        $requests = [];
        $channelMap = [];
        foreach ($targetChannels as $ch) {
            $cid = $ch['id'];
            $channelMap[$cid] = $ch;

            $queryParams = [
                'offset'         => 0,
                'limit'          => $limitPerChan,
                'includeContent' => 'true',
            ];

            $searchTerm = !empty($mrnFilter) ? $mrnFilter : $orderIdFilter;
            if (!empty($searchTerm)) {
                $queryParams['textSearch'] = $searchTerm;
            }

            $params = http_build_query($queryParams);
            $requests[$cid] = "/api/channels/{$cid}/messages?{$params}";
        }

        // 2. Execute parallel queries via curl_multi
        $responses = $this->mirthMultiGet($requests, $cookieFile);

        // Session refresh on 401
        $firstResp = reset($responses);
        if ($firstResp && $firstResp['code'] === 401) {
            $cookieFile = $this->refreshSession();
            if ($cookieFile) {
                $responses = $this->mirthMultiGet($requests, $cookieFile);
            }
        }

        // 3. Parse and filter messages in PHP
        $results = [];
        foreach ($responses as $cid => $r) {
            if ($r['code'] !== 200 || empty($r['body'])) {
                continue;
            }

            $ch   = $channelMap[$cid] ?? ['name' => '', 'group' => '[Default Group]'];
            $data = $this->xmlToArray($r['body']);
            $list = $data['message'] ?? [];
            if (isset($list['messageId'])) $list = [$list];

            foreach ((array)$list as $msg) {
                $msgDateMs  = (int)($msg['receivedDate']['time'] ?? 0);
                $status     = (string)($msg['processedResponse']['status'] ?? $msg['status'] ?? '');
                $rawContent = $this->extractRawContent($msg);

                // Date filter check
                if ($startTimeMs !== null && $msgDateMs > 0 && $msgDateMs < $startTimeMs) continue;
                if ($endTimeMs !== null && $msgDateMs > 0 && $msgDateMs > $endTimeMs) continue;

                [$msgType, $mrn, $orderId] = $this->parseHl7Fields($rawContent);

                // Type filter
                if (!empty($typeFilter) && $typeFilter !== 'SEMUA') {
                    $matchType = false;
                    if ($typeFilter === 'ORM' && str_contains($msgType, 'ORM')) $matchType = true;
                    if ($typeFilter === 'ORR' && str_contains($msgType, 'ORR')) $matchType = true;
                    if ($typeFilter === 'ORU' && str_contains($msgType, 'ORU')) $matchType = true;
                    if ($typeFilter === 'P03' && (str_contains($msgType, 'P03') || str_contains($msgType, 'DFT'))) $matchType = true;
                    if (!$matchType) continue;
                }

                // Status filter
                if (!empty($statusFilter) && $statusFilter !== 'SEMUA' && strtoupper($status) !== $statusFilter) {
                    continue;
                }

                // MRN filter
                if (!empty($mrnFilter)) {
                    $hit = (!empty($mrn) && stripos($mrn, $mrnFilter) !== false)
                        || (!empty($rawContent) && stripos($rawContent, $mrnFilter) !== false);
                    if (!$hit) continue;
                }

                // Order ID filter
                if (!empty($orderIdFilter)) {
                    $hit = (!empty($orderId) && stripos($orderId, $orderIdFilter) !== false)
                        || (!empty($rawContent) && stripos($rawContent, $orderIdFilter) !== false);
                    if (!$hit) continue;
                }

                $results[] = [
                    'message_id'     => (string)($msg['messageId'] ?? ''),
                    'channel_id'     => $cid,
                    'channel_name'   => $ch['name'] ?? '',
                    'channel_group'  => $ch['group'] ?? '[Default Group]',
                    'date_time'      => (string)$msgDateMs,
                    'msg_type'       => $msgType,
                    'status'         => $status,
                    'mrn'            => $mrn,
                    'order_id'       => $orderId,
                    'has_hl7'        => true,
                ];
            }
        }

        // Sort results by date_time descending
        usort($results, fn($a, $b) => (int)($b['date_time'] ?? 0) <=> (int)($a['date_time'] ?? 0));

        return $this->respond([
            'total'    => count($results),
            'messages' => $results,
            'group'    => $groupFilter ?: 'Semua',
        ]);
    }

    // GET /api/mirth/messages?channel_id=X&limit=25&offset=0
    public function messages()
    {
        return $this->search();
    }

    // GET /api/mirth/message/{messageId}?channel_id=X
    public function messageDetail(string $messageId)
    {
        $cookieFile = $this->getSession();
        if (!$cookieFile) {
            return $this->fail('Gagal log masuk ke Mirth Connect.', 401);
        }

        $channelId = $this->request->getGet('channel_id');
        if (empty($channelId) || empty($messageId)) {
            return $this->fail('channel_id dan messageId diperlukan', 400);
        }

        $params = http_build_query(['includeContent' => 'true']);
        $r = $this->mirthRequest(
            "/api/channels/{$channelId}/messages/{$messageId}?{$params}",
            'GET', [], $cookieFile
        );

        if ($r['code'] === 401) {
            $cookieFile = $this->refreshSession();
            if (!$cookieFile) return $this->fail('Mirth session tamat.', 401);
            $r = $this->mirthRequest(
                "/api/channels/{$channelId}/messages/{$messageId}?{$params}",
                'GET', [], $cookieFile
            );
        }

        if ($r['code'] !== 200) {
            return $this->fail("Mirth API error: HTTP {$r['code']}", 502);
        }

        $data = $this->xmlToArray($r['body']);
        $msg  = $data['message'] ?? $data;
        $rawContent = $this->extractRawContent($msg);

        return $this->respond([
            'message_id' => $messageId,
            'raw_hl7'    => $rawContent,
        ]);
    }
}
