<?php

namespace Config;

use CodeIgniter\Events\Events;
use CodeIgniter\Exceptions\FrameworkException;
use CodeIgniter\HotReloader\HotReloader;

/*
 * --------------------------------------------------------------------
 * Application Events
 * --------------------------------------------------------------------
 * Events allow you to tap into the execution of the program without
 * modifying or extending core files. This file provides a central
 * location to define your events, though they can always be added
 * at run-time, also, if needed.
 *
 * You create code that can execute by subscribing to events with
 * the 'on()' method. This accepts any form of callable, including
 * Closures, that will be executed when the event is triggered.
 *
 * Example:
 *      Events::on('create', [$myInstance, 'myMethod']);
 */

Events::on('pre_system', static function (): void {
    if (ENVIRONMENT !== 'testing') {
        $value = ini_get('zlib.output_compression');

        if (filter_var($value, FILTER_VALIDATE_BOOLEAN) || (int) $value > 0) {
            throw FrameworkException::forEnabledZlibOutputCompression();
        }

        while (ob_get_level() > 0) {
            ob_end_flush();
        }

        ob_start(static fn ($buffer) => $buffer);
    }

    /*
     * --------------------------------------------------------------------
     * Debug Toolbar Listeners.
     * --------------------------------------------------------------------
     * If you delete, they will no longer be collected.
     */
    if (CI_DEBUG && ! is_cli()) {
        Events::on('DBQuery', 'CodeIgniter\Debug\Toolbar\Collectors\Database::collect');
        service('toolbar')->respond();
        // Hot Reload route - for framework use on the hot reloader.
        if (ENVIRONMENT === 'development') {
            service('routes')->get('__hot-reload', static function (): void {
                (new HotReloader())->run();
            });
        }
    }
});

// ── iCENTRAL SSO Token Auto-Login Listener ────────────────────────────
Events::on('pre_system', static function (): void {
    if (isset($_GET['ic_sso'])) {
        $token = $_GET['ic_sso'];
        $parts = explode('.', $token);
        if (count($parts) === 2) {
            [$payload, $sig] = $parts;
            $secret = 'icentral_master_sso_secret_key_2026';
            if (hash_equals(hash_hmac('sha256', $payload, $secret), $sig)) {
                $json = base64_decode(strtr($payload, '-_', '+/') . str_repeat('=', (4 - strlen($payload) % 4) % 4));
                $data = json_decode($json, true);
                if ($data && ($data['exp'] ?? 0) >= time()) {
                    $session = \Config\Services::session();
                    $role    = strtolower($data['role'] ?? 'admin');

                    $session->set([
                        'user_id'            => $data['uid'] ?? 1,
                        'username'           => $data['username'] ?? 'admin',
                        'fullname'           => $data['fullname'] ?? 'Admin',
                        'role'               => $role,
                        'isLoggedIn'         => true,
                        'is_logged_in'       => true,
                        'is_staff_logged_in' => true,
                    ]);

                    // Clean redirect to base landing URL without token in query string
                    $cleanUrl = strtok($_SERVER['REQUEST_URI'] ?? '', '?');
                    header('Location: ' . ($cleanUrl ?: './'));
                    exit;
                }
            }
        }
    }
});