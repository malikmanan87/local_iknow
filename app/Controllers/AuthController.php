<?php

namespace App\Controllers;

use App\Models\UserModel;
use App\Models\ActivityLogModel; // Memuatkan Model Log Aktiviti

class AuthController extends BaseController
{
    protected UserModel $userModel;

    public function __construct()
    {
        $this->userModel = new UserModel();
        helper(['form', 'url']);
    }

    // ----------------------------------------------------------------
    // GET / (Halaman Utama / Root)
    // ----------------------------------------------------------------
    public function index()
    {
        if (session()->get('isLoggedIn')) {
            return redirect()->to('dashboard');
        }
        return redirect()->to('login');
    }

    // ----------------------------------------------------------------
    // GET /login (Paparan Halaman Log Masuk)
    // ----------------------------------------------------------------
    public function login()
    {
        if (session()->get('isLoggedIn')) {
            return redirect()->to('dashboard');
        }
        return view('auth/login');
    }

    // ----------------------------------------------------------------
    // POST /login (Proses Log Masuk + Throttling Dinamik)
    // ----------------------------------------------------------------
    public function loginProcess()
    {
        $rules = [
            'email'    => 'required|min_length[3]',
            'password' => 'required|min_length[6]',
        ];

        if (!$this->validate($rules)) {
            return redirect()->back()->withInput()->with('errors', $this->validator->getErrors());
        }

        $identifier = $this->request->getPost('email');
        $password   = $this->request->getPost('password');

        // Semak had login attempts dari database
        $db = \Config\Database::connect();
        $attemptsQuery = $db->table('settings')->where('key', 'login_attempts')->get()->getRow();
        $maxAttempts   = $attemptsQuery ? (int)$attemptsQuery->value : 5;

        // Throttler Check
        $throttler = service('throttler');
        $throttlerKey = md5($this->request->getIPAddress() . '_' . $identifier);

        if ($throttler->check($throttlerKey, $maxAttempts, 300) === false) {
            return redirect()->back()->withInput()->with('error', 'Terlalu banyak percubaan log masuk yang gagal. Sila cuba lagi dalam 5 minit.');
        }

        $user = $this->userModel->findByEmailOrUsername($identifier);

        if (!$user || !password_verify($password, $user['password'])) {
            return redirect()->back()->withInput()->with('error', 'E-mel atau kata laluan tidak sah.');
        }

        if (!$user['is_active']) {
            return redirect()->back()->withInput()->with('error', 'Akaun anda telah dinyahaktifkan. Sila hubungi pentadbir.');
        }

        // Set Session
        session()->set([
            'isLoggedIn' => true,
            'user_id'    => $user['id'],
            'fullname'   => $user['fullname'],
            'email'      => $user['email'],
            'username'   => $user['username'],
            'role'       => $user['role_name'] ?? 'user',
            'role_id'    => $user['role_id'],
            'avatar'     => $user['avatar'] ?? null
        ]);

        $this->userModel->update($user['id'], ['last_login' => date('Y-m-d H:i:s')]);

        // Rakam Log
        ActivityLogModel::log('Log Masuk', 'Pengguna berjaya log masuk ke dalam sistem.');

        return redirect()->to('dashboard')->with('success', 'Selamat datang semula, ' . $user['fullname'] . '!');
    }

    // ----------------------------------------------------------------
    // FUNGSI BARU: GET /register (Paparan Halaman Daftar Tetamu)
    // ----------------------------------------------------------------
    public function register()
    {
        if (session()->get('isLoggedIn')) {
            return redirect()->to('dashboard');
        }
        return view('auth/register'); // Memastikan fail app/Views/auth/register.php dipanggil
    }

    // ----------------------------------------------------------------
    // FUNGSI BARU: POST /register/process (Proses Simpan Tetamu)
    // ----------------------------------------------------------------
    public function registerProcess()
    {
        $rules = [
            'fullname'         => 'required|min_length[3]|max_length[100]',
            'username'         => 'required|alpha_dash|min_length[3]|max_length[50]|is_unique[users.username]',
            'email'            => 'required|valid_email|max_length[150]|is_unique[users.email]',
            'password'         => 'required|min_length[6]|max_length[255]',
            'password_confirm' => 'required|matches[password]',
        ];

        if (!$this->validate($rules)) {
            return redirect()->back()->withInput()->with('errors', $this->validator->getErrors());
        }

        // Cari ID peranan 'user' secara automatik dari jadual roles
        $db = \Config\Database::connect();
        $roleQuery = $db->table('roles')->where('name', 'user')->get()->getRow();
        $userRoleId = $roleQuery ? $roleQuery->id : 3; // Fallback ke ID 3 jika tiada

        $data = [
            'fullname'  => $this->request->getPost('fullname'),
            'username'  => strtolower($this->request->getPost('username')),
            'email'     => strtolower($this->request->getPost('email')),
            'phone'     => $this->request->getPost('phone'),
            'password'  => password_hash($this->request->getPost('password'), PASSWORD_DEFAULT),
            'role_id'   => $userRoleId,
            'is_active' => 1, // Tetamu aktif terus secara automatik
        ];

        $db->table('users')->insert($data);

        // Rakam Log Aktiviti menggunakan sesi Guest
        ActivityLogModel::log('Pendaftaran Awam', 'Tetamu mendaftar akaun baru dengan nama pengguna: @' . $data['username']);

        return redirect()->to('login')->with('success', 'Akaun anda berjaya dicipta! Sila log masuk dengan e-mel dan kata laluan anda.');
    }

    public function profile()
    {
        // Ambil ID dari session, lalu hantar ke UsersController::show
        return redirect()->to('users/show/' . session('user_id'));
    }

    // ----------------------------------------------------------------
    // GET /logout (Log Keluar)
    // ----------------------------------------------------------------
    public function logout()
    {
        if (session()->get('isLoggedIn')) {
            ActivityLogModel::log('Log Keluar', 'Pengguna telah mendaftar keluar daripada sistem.');
        }
        session()->destroy();
        return redirect()->to('login');
    }
}
