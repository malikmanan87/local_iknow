<?php

namespace App\Controllers;

use App\Models\UserModel;
use App\Models\RoleModel;
use App\Models\ActivityLogModel; // Memuatkan Model Log Aktiviti

class UsersController extends BaseController
{
    protected UserModel $userModel;
    protected RoleModel $roleModel;

    public function __construct()
    {
        $this->userModel = new UserModel();
        $this->roleModel = new RoleModel();
        helper(['form', 'url']);
    }

    // ----------------------------------------------------------------
    // GET /users (Paparan Senarai Pengguna)
    // ----------------------------------------------------------------
    public function index()
    {
        return view('users/index', [
            'pageTitle'  => 'Pengurusan Pengguna',
            'breadcrumb' => ['Pengguna'],
            'users'      => $this->userModel->getUsersWithRole(),
        ]);
    }

    // ----------------------------------------------------------------
    // GET /users/show/:id (Paparan Profil Pengguna)
    // ----------------------------------------------------------------
    public function show(int $id)
    {
        $user = $this->userModel->getUserWithRole($id);
        if (!$user) {
            return redirect()->to('users')->with('error', 'Pengguna tidak ditemui.');
        }

        return view('users/show', [
            'pageTitle'  => 'Profil Pengguna',
            'breadcrumb' => [['label' => 'Pengguna', 'url' => base_url('users')], 'Profil'],
            'user'       => $user,
        ]);
    }

    // ----------------------------------------------------------------
    // GET /users/create (Paparan Borang Tambah)
    // ----------------------------------------------------------------
    public function create()
    {
        return view('users/form', [
            'pageTitle'  => 'Tambah Pengguna Baru',
            'breadcrumb' => [['label' => 'Pengguna', 'url' => base_url('users')], 'Tambah'],
            'roles'      => $this->roleModel->findAll(),
        ]);
    }

    // ----------------------------------------------------------------
    // POST /users/store (Proses Simpan Pengguna Baru + RAKAM LOG)
    // ----------------------------------------------------------------
    public function store()
    {
        $rules = [
            'fullname'         => 'required|min_length[3]|max_length[100]',
            'username'         => 'required|alpha_dash|min_length[3]|max_length[50]|is_unique[users.username]',
            'email'            => 'required|valid_email|max_length[150]|is_unique[users.email]',
            'password'         => 'required|min_length[6]',
            'role_id'          => 'required|numeric',
            'avatar'           => 'permit_empty|is_image[avatar]|max_size[avatar,2048]|mime_in[avatar,image/jpg,image/jpeg,image/png]',
        ];

        if (!$this->validate($rules)) {
            return redirect()->back()->withInput()->with('errors', $this->validator->getErrors());
        }

        // 🚀 LOGIK SUIS AKTIF/NYAHAKTIF:
        // Jika suis ditanda, ambil nilai '1'. Jika dibiarkan kosong, set sebagai '0' (Dinyahaktifkan)
        $isActive = $this->request->getPost('is_active') ? 1 : 0;

        $data = [
            'fullname'  => $this->request->getPost('fullname'),
            'username'  => strtolower($this->request->getPost('username')),
            'email'     => strtolower($this->request->getPost('email')),
            'phone'     => $this->request->getPost('phone'),
            'role_id'   => $this->request->getPost('role_id'),
            'password'  => password_hash($this->request->getPost('password'), PASSWORD_DEFAULT),
            'is_active' => $isActive, // Masukkan nilai ke pangkalan data
        ];

        // Logik muat naik avatar jika ada...
        $avatarFile = $this->request->getFile('avatar');
        if ($avatarFile && $avatarFile->isValid() && !$avatarFile->hasMoved()) {
            $newName = $avatarFile->getRandomName();
            $avatarFile->move(FCPATH . 'uploads/avatars', $newName);
            $data['avatar'] = $newName;
        }

        $this->userModel->insert($data);

        \App\Models\ActivityLogModel::log('Tambah Pengguna', 'Mendaftar pengguna baru: @' . $data['username'] . ' [Status: ' . ($isActive ? 'Aktif' : 'Nyahaktif') . ']');

        return redirect()->to('users')->with('success', 'Pengguna baru berjaya didaftarkan.');
    }

    // ----------------------------------------------------------------
    // GET /users/edit/:id (Paparan Borang Kemaskini)
    // ----------------------------------------------------------------
    public function edit(int $id)
    {
        $user = $this->userModel->find($id);
        if (!$user) {
            return redirect()->to('users')->with('error', 'Pengguna tidak ditemui.');
        }

        return view('users/form', [
            'pageTitle'  => 'Kemaskini Pengguna',
            'breadcrumb' => [['label' => 'Pengguna', 'url' => base_url('users')], 'Kemaskini'],
            'user'       => $user,
            'roles'      => $this->roleModel->findAll(),
        ]);
    }

    // ----------------------------------------------------------------
    // POST /users/update/:id (Proses Kemaskini Pengguna + RAKAM LOG)
    // ----------------------------------------------------------------
    public function update(int $id)
    {
        $user = $this->userModel->find($id);
        if (!$user) {
            return redirect()->to('users')->with('error', 'Pengguna tidak ditemui.');
        }

        $rules = [
            'fullname' => 'required|min_length[3]|max_length[100]',
            'username' => "required|alpha_dash|min_length[3]|max_length[50]|is_unique[users.username,id,{$id}]",
            'email'    => "required|valid_email|max_length[150]|is_unique[users.email,id,{$id}]",
            'role_id'  => 'required|numeric',
            'avatar'   => 'permit_empty|is_image[avatar]|max_size[avatar,2048]|mime_in[avatar,image/jpg,image/jpeg,image/png]',
        ];

        if (!$this->validate($rules)) {
            return redirect()->back()->withInput()->with('errors', $this->validator->getErrors());
        }

        // 🚀 LOGIK SUIS AKTIF/NYAHAKTIF:
        $isActive = $this->request->getPost('is_active') ? 1 : 0;

        // Halang pengguna daripada menyahaktifkan atau menukar peranan akaun sendiri
        if ((int)session('user_id') === $id) {
            if ($isActive === 0) {
                return redirect()->back()->withInput()->with('error', 'Anda tidak boleh menyahaktifkan akaun anda sendiri.');
            }
            if ((int)$this->request->getPost('role_id') !== (int)$user['role_id']) {
                return redirect()->back()->withInput()->with('error', 'Anda tidak boleh menukar peranan akaun anda sendiri.');
            }
        }

        $data = [
            'fullname'  => $this->request->getPost('fullname'),
            'username'  => strtolower($this->request->getPost('username')),
            'email'     => strtolower($this->request->getPost('email')),
            'phone'     => $this->request->getPost('phone'),
            'role_id'   => $this->request->getPost('role_id'),
            'is_active' => $isActive, // Kemaskini nilai ke pangkalan data
        ];

        // Logik pemprosesan kata laluan & avatar...
        $avatarFile = $this->request->getFile('avatar');
        if ($avatarFile && $avatarFile->isValid() && !$avatarFile->hasMoved()) {
            if (!empty($user['avatar']) && file_exists(FCPATH . 'uploads/avatars/' . $user['avatar'])) {
                unlink(FCPATH . 'uploads/avatars/' . $user['avatar']);
            }
            $newName = $avatarFile->getRandomName();
            $avatarFile->move(FCPATH . 'uploads/avatars', $newName);
            $data['avatar'] = $newName;

            if ((int)session('user_id') === $id) {
                session()->set('avatar', $newName);
            }
        }

        if ($this->request->getPost('password')) {
            $data['password'] = password_hash($this->request->getPost('password'), PASSWORD_DEFAULT);
        }

        $this->userModel->update($id, $data);

        // Kemaskini data session kendiri jika pengguna sedang edit profil sendiri
        if ((int)session('user_id') === $id) {
            session()->set([
                'fullname' => $data['fullname'],
                'is_active' => $isActive
            ]);
        }

        \App\Models\ActivityLogModel::log('Kemaskini Pengguna', 'Mengemas kini data pengguna ID: ' . $id . ' [Status: ' . ($isActive ? 'Aktif' : 'Nyahaktif') . ']');

        return redirect()->to('users')->with('success', 'Maklumat pengguna berjaya dikemaskini.');
    }

    // ----------------------------------------------------------------
    // GET /users/delete/:id (Proses Padam Lembut + RAKAM LOG)
    // ----------------------------------------------------------------
    public function delete(int $id)
    {
        if ($id === (int) session('user_id')) {
            return redirect()->to('users')->with('error', 'Anda tidak boleh memadam akaun sendiri.');
        }

        $user = $this->userModel->find($id);
        if (!$user) {
            return redirect()->to('users')->with('error', 'Pengguna tidak ditemui atau telah dipadam.');
        }

        // Melakukan Soft Delete melalui model
        $this->userModel->delete($id);

        // 🚀 RAKAM LOG AKTIVITI: SOFT DELETE PENGGUNA
        ActivityLogModel::log(
            'Padam Pengguna',
            'Memadam (Soft Delete) pengguna: "' . $user['fullname'] . '" (@' . $user['username'] . ') (ID: ' . $id . ')'
        );

        return redirect()->to('users')->with('success', 'Pengguna berjaya dipadam daripada sistem.');
    }

    // ----------------------------------------------------------------
    // GET /users/reset-throttle/:id (Reset Sekatan Login + RAKAM LOG)
    // ----------------------------------------------------------------
    public function resetThrottle(int $id)
    {
        $user = $this->userModel->find($id);
        if (!$user) {
            return redirect()->to('users')->with('error', 'Pengguna tidak ditemui.');
        }

        // Membersihkan cache throttler global
        $cache = service('cache');
        $cache->clean();

        // Memastikan status akaun diaktifkan semula jika ter-nyahaktif
        if ((int)$user['is_active'] === 0) {
            $this->userModel->update($id, ['is_active' => 1]);
        }

        // 🚀 RAKAM LOG AKTIVITI: RESET THROTTLE
        ActivityLogModel::log(
            'Reset Sekatan Login',
            'Menetapkan semula (reset) sekatan had log masuk untuk akaun: ' . $user['fullname']
        );

        return redirect()->to('users')->with('success', 'Sekatan percubaan log masuk untuk pengguna tersebut telah dibersihkan.');
    }
}
