<?php
$mirthHost  = 'https://10.0.20.210:8443';
$mirthUser  = 'admin';
$mirthPass  = 'Adm1n@unisza';
$cookieFile = __DIR__ . '/writable/mirth_test_cookie.txt';

if (!is_dir(__DIR__ . '/writable')) mkdir(__DIR__ . '/writable', 0755, true);

function mirthCurl(string $url, string $method = 'GET', array $postFields = [], ?string $cookie = null): array {
    $ch = curl_init();
    $headers = ['X-Requested-With: XMLHttpRequest', 'Accept: application/xml'];
    if ($method === 'POST') {
        $headers[] = 'Content-Type: application/x-www-form-urlencoded';
    }
    $opts = [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_HEADER         => true,
    ];
    if ($cookie) {
        $opts[CURLOPT_COOKIEFILE] = $cookie;
        $opts[CURLOPT_COOKIEJAR]  = $cookie;
    }
    if ($method === 'POST') {
        $opts[CURLOPT_POST]       = true;
        $opts[CURLOPT_POSTFIELDS] = http_build_query($postFields);
    }
    curl_setopt_array($ch, $opts);
    $raw        = curl_exec($ch);
    $code       = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $body       = substr($raw, $headerSize);
    $err        = curl_error($ch);
    curl_close($ch);
    return ['code' => $code, 'body' => trim($body), 'error' => $err];
}

echo "=== Mirth Connect 4.0.1 — API Test ===\n";
echo "Host: $mirthHost\n\n";

// 1. Version (no auth)
$r = mirthCurl("$mirthHost/api/server/version");
echo "[1] Versi Mirth: HTTP {$r['code']} → {$r['body']}\n\n";

// 2. Login
echo "[2] Cuba login sebagai '$mirthUser'...\n";
$r = mirthCurl("$mirthHost/api/users/_login", 'POST', [
    'username' => $mirthUser,
    'password' => $mirthPass,
], $cookieFile);
echo "    HTTP: {$r['code']}\n";
echo "    Body: " . substr($r['body'], 0, 200) . "\n";

if ($r['code'] === 200) {
    echo "    ✅ LOGIN BERJAYA!\n\n";

    // 3. Get channels
    echo "[3] Memuatkan senarai Channel...\n";
    $r2 = mirthCurl("$mirthHost/api/channels/statuses", 'GET', [], $cookieFile);
    echo "    HTTP: {$r2['code']}\n";
    echo "    Body: " . substr($r2['body'], 0, 800) . "\n\n";

    // 4. Get server info
    echo "[4] Maklumat Server Mirth...\n";
    $r3 = mirthCurl("$mirthHost/api/server/id", 'GET', [], $cookieFile);
    echo "    HTTP: {$r3['code']}\n";
    echo "    Body: " . substr($r3['body'], 0, 200) . "\n\n";

} else {
    echo "    ❌ LOGIN GAGAL. Code: {$r['code']}\n";
    echo "    Body: {$r['body']}\n";
}

