<?php
$mirthHost  = 'https://10.0.20.210:8443';
$mirthUser  = 'admin';
$mirthPass  = 'Adm1n@unisza';
$cookieFile = __DIR__ . '/writable/mirth_test_cookie.txt';

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
    curl_setopt_array($ch, $opts);
    $raw        = curl_exec($ch);
    $code       = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $body       = substr($raw, $headerSize);
    $err        = curl_error($ch);
    curl_close($ch);
    return ['code' => $code, 'body' => trim($body), 'error' => $err];
}

mirthCurl("$mirthHost/api/users/_login", 'POST', ['username' => $mirthUser, 'password' => $mirthPass], $cookieFile);

$cid = '50d986f5-6d9d-433f-a462-009c3f1f7051'; // IN_ORU_LIS

$url = "$mirthHost/api/channels/$cid/messages?limit=100&includeContent=true";
echo "Testing $url...\n";
$r = mirthCurl($url, 'GET', [], $cookieFile);
echo "Code: " . $r['code'] . "\n";
echo "Body length: " . strlen($r['body']) . "\n";
echo "Body snippet:\n" . substr($r['body'], 0, 500) . "\n";





