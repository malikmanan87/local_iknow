<?php
$mirthHost = 'https://10.0.20.210:8443';

function mirthGet($url, $accept = '*/*', $cookieFile = null) {
    $ch = curl_init();
    $opts = [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => [
            'X-Requested-With: XMLHttpRequest',
            "Accept: $accept",
        ],
        CURLOPT_HEADER => true,
    ];
    if ($cookieFile) {
        $opts[CURLOPT_COOKIEFILE] = $cookieFile;
        $opts[CURLOPT_COOKIEJAR] = $cookieFile;
    }
    curl_setopt_array($ch, $opts);
    $raw = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $body = substr($raw, $headerSize);
    $err = curl_error($ch);
    curl_close($ch);
    return ['code' => $code, 'body' => $body, 'error' => $err];
}

echo "=== Testing Mirth Connect API: $mirthHost ===\n\n";

$tests = [
    ['url' => "$mirthHost/api/server/version", 'accept' => '*/*'],
    ['url' => "$mirthHost/api/server/version", 'accept' => 'text/plain'],
    ['url' => "$mirthHost/api/server/jvm",     'accept' => '*/*'],
    ['url' => "$mirthHost/api/channels",       'accept' => '*/*'],
    ['url' => "$mirthHost/server/version",     'accept' => '*/*'],
];

foreach ($tests as $t) {
    $r = mirthGet($t['url'], $t['accept']);
    echo "URL: {$t['url']}\n";
    echo "Accept: {$t['accept']}\n";
    echo "HTTP: {$r['code']}\n";
    echo "Body: " . (empty($r['body']) ? '(empty)' : substr(trim($r['body']), 0, 200)) . "\n";
    echo str_repeat('-', 60) . "\n";
}

