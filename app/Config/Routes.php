<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */

// ====================================================================
// 1. LALUAN TERBUKA / AWAM (Public Routes)
// ====================================================================
// Laluan ini boleh diakses oleh sesiapa sahaja (tetamu) tanpa perlu login.
// Wajib berada di luar dan di atas sebarang group filter 'auth'.

$routes->get('/',                 'AuthController::index');
$routes->get('login',             'AuthController::login');
$routes->post('login',            'AuthController::loginProcess');
$routes->get('logout',            'AuthController::logout');

// Laluan Borang & Proses Pendaftaran Tetamu Baru (Public Registration)
$routes->get('register',          'AuthController::register');
$routes->post('register/process', 'AuthController::registerProcess');


// ====================================================================
// 2. LALUAN TERKAWAL GLOBAL (Protected Routes)
// ====================================================================
// Pengguna WAJIB log masuk terlebih dahulu untuk mengakses laluan di bawah.
// Dilindungi oleh filter 'auth' global sistem.

$routes->group('', ['filter' => 'auth'], function ($routes) {

    // Halaman Utama Dalaman / Dashboard
    $routes->get('dashboard', 'DashboardController::index');

    // Laluan Pintas Profil Pengguna (Satu Level Dengan Dashboard)
    $routes->get('profile',   'AuthController::profile');

    // Modul Item (Boleh diakses oleh mana-mana peranan yang telah login)
    $routes->group('items', function ($routes) {
        $routes->get('/',              'ItemsController::index');
        $routes->get('create',         'ItemsController::create');
        $routes->post('store',         'ItemsController::store');
        $routes->get('show/(:num)',    'ItemsController::show/$1');
        $routes->get('edit/(:num)',    'ItemsController::edit/$1');
        $routes->post('update/(:num)', 'ItemsController::update/$1');
        $routes->get('delete/(:num)',  'ItemsController::delete/$1');
    });

    // 🚀 KEMASKINI MODUL LAPORAN (Menyokong GET, POST, & Sub-URL Jana Laporan)
    $routes->group('reports', function ($routes) {
        $routes->get('/',          'ReportsController::index');    // Papar halaman laporan (GET)
        $routes->post('/',         'ReportsController::index');    // Tapis tarikh/data pada halaman utama laporan (POST)
        $routes->get('generate',   'ReportsController::generate'); // Jika butang menembak ke URL generate (GET)
        $routes->post('generate',  'ReportsController::generate'); // Jika borang menembak ke URL generate (POST)
        $routes->get('print',      'ReportsController::print');    // Fungsi cetak laporan (Jika ada)
        $routes->get('export',     'ReportsController::export');   // Fungsi eksport Excel/PDF (Jika ada)
    });

    // ----------------------------------------------------------------
    // 3. KAWALAN KHUSUS ADMIN (Admin-Only Routes)
    // ----------------------------------------------------------------
    // Hanya pengguna yang mempunyai role 'admin' sahaja dibenarkan masuk.
    // Dilindungi tambahan oleh penapis argumen 'auth:admin'.

    // Pengurusan Pengguna (Menyokong SoftDeletes & Reset Throttle Sekatan)
    $routes->group('users', ['filter' => 'auth:admin'], function ($routes) {
        $routes->get('/',                     'UsersController::index');
        $routes->get('show/(:num)',           'UsersController::show/$1');
        $routes->get('create',                'UsersController::create');
        $routes->post('store',                'UsersController::store');
        $routes->get('edit/(:num)',           'UsersController::edit/$1');
        $routes->post('update/(:num)',         'UsersController::update/$1');
        $routes->get('delete/(:num)',         'UsersController::delete/$1');
        $routes->get('reset-throttle/(:num)', 'UsersController::resetThrottle/$1');
    });

    // Pengurusan Peranan & Kebenaran (Roles Management)
    $routes->group('roles', ['filter' => 'auth:admin'], function ($routes) {
        $routes->get('/',              'RolesController::index');
        $routes->get('create',         'RolesController::create');
        $routes->post('store',         'RolesController::store');
        $routes->get('edit/(:num)',    'RolesController::edit/$1');
        $routes->post('update/(:num)', 'RolesController::update/$1');
        $routes->get('delete/(:num)',  'RolesController::delete/$1');
    });

    // Jejak Audit Log Sistem (Activity Logs)
    $routes->group('activity-logs', ['filter' => 'auth:admin'], function ($routes) {
        $routes->get('/', 'ActivityLogsController::index');
    });

    // Konfigurasi Tetapan Sistem (Mod Penyelenggaraan, Throttling, dll)
    $routes->group('settings', ['filter' => 'auth:admin'], function ($routes) {
        $routes->get('/',       'SettingsController::index');
        $routes->post('update', 'SettingsController::update');
    });
});
