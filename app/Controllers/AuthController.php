<?php

namespace App\Controllers;

use App\Models\UserModel;
use App\Traits\LoggableTrait;

class AuthController extends BaseController
{
    use LoggableTrait;

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
            return redirect()->back()->withInput()->with('error', 'Too many failed login attempts. Please try again in 5 minutes.');
        }

        $user = $this->userModel->findByEmailOrUsername($identifier);

        if (!$user || !password_verify($password, $user['password'])) {
            return redirect()->back()->withInput()->with('error', 'Invalid email or password.');
        }

        if (!$user['is_active']) {
            return redirect()->back()->withInput()->with('error', 'Your account has been deactivated. Please contact the administrator.');
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

        // Record Log
        $this->logActivity('User Login', 'User successfully logged into the system.');

        return redirect()->to('dashboard')->with('success', 'Welcome back, ' . $user['fullname'] . '!');
    }

    // ----------------------------------------------------------------
    // GET /register (Display Registration Form)
    // ----------------------------------------------------------------
    public function register()
    {
        if (session()->get('isLoggedIn')) {
            return redirect()->to('dashboard');
        }
        return view('auth/register');
    }

    // ----------------------------------------------------------------
    // POST /register/process (Process Registration)
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

        // Find default 'user' role ID from roles table
        $db = \Config\Database::connect();
        $roleQuery = $db->table('roles')->where('name', 'user')->get()->getRow();
        $userRoleId = $roleQuery ? $roleQuery->id : 3;

        $data = [
            'fullname'  => $this->request->getPost('fullname'),
            'username'  => strtolower($this->request->getPost('username')),
            'email'     => strtolower($this->request->getPost('email')),
            'phone'     => $this->request->getPost('phone'),
            'password'  => password_hash($this->request->getPost('password'), PASSWORD_DEFAULT),
            'role_id'   => $userRoleId,
            'is_active' => 1,
        ];

        $db->table('users')->insert($data);

        // Record Activity Log
        $this->logActivity('Public Registration', 'New guest account registered with username: @' . $data['username']);

        return redirect()->to('login')->with('success', 'Your account has been successfully created! Please log in with your email and password.');
    }

    public function profile()
    {
        return redirect()->to('users/show/' . session('user_id'));
    }

    // ----------------------------------------------------------------
    // GET /logout (Logout)
    // ----------------------------------------------------------------
    public function logout()
    {
        if (session()->get('isLoggedIn')) {
            $this->logActivity('User Logout', 'User logged out of the system.');
        }
        session()->destroy();
        return redirect()->to('login');
    }
}
