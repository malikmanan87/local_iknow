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
    // GET /users (Display User List)
    // ----------------------------------------------------------------
    public function index()
    {
        return view('users/index', [
            'pageTitle'  => 'User Management',
            'breadcrumb' => ['Users'],
            'users'      => $this->userModel->getUsersWithRole(),
        ]);
    }

    // ----------------------------------------------------------------
    // GET /users/show/:id (Display User Profile)
    // ----------------------------------------------------------------
    public function show(int $id)
    {
        $user = $this->userModel->getUserWithRole($id);
        if (!$user) {
            return redirect()->to('users')->with('error', 'User not found.');
        }

        return view('users/show', [
            'pageTitle'  => 'User Profile',
            'breadcrumb' => [['label' => 'Users', 'url' => base_url('users')], 'Profile'],
            'user'       => $user,
        ]);
    }

    // ----------------------------------------------------------------
    // GET /users/create (Display Add Form)
    // ----------------------------------------------------------------
    public function create()
    {
        return view('users/form', [
            'pageTitle'  => 'Add New User',
            'breadcrumb' => [['label' => 'Users', 'url' => base_url('users')], 'Add'],
            'roles'      => $this->roleModel->findAll(),
        ]);
    }

    // ----------------------------------------------------------------
    // POST /users/store (Process Store New User + LOG)
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

        $isActive = $this->request->getPost('is_active') ? 1 : 0;

        $data = [
            'fullname'  => $this->request->getPost('fullname'),
            'username'  => strtolower($this->request->getPost('username')),
            'email'     => strtolower($this->request->getPost('email')),
            'phone'     => $this->request->getPost('phone'),
            'role_id'   => $this->request->getPost('role_id'),
            'password'  => password_hash($this->request->getPost('password'), PASSWORD_DEFAULT),
            'is_active' => $isActive,
        ];

        $avatarFile = $this->request->getFile('avatar');
        if ($avatarFile && $avatarFile->isValid() && !$avatarFile->hasMoved()) {
            $newName = $avatarFile->getRandomName();
            $avatarFile->move(FCPATH . 'uploads/avatars', $newName);
            $data['avatar'] = $newName;
        }

        $this->userModel->insert($data);

        \App\Models\ActivityLogModel::log('Add User', 'Registered new user: @' . $data['username'] . ' [Status: ' . ($isActive ? 'Active' : 'Inactive') . ']');

        return redirect()->to('users')->with('success', 'New user successfully registered.');
    }

    // ----------------------------------------------------------------
    // GET /users/edit/:id (Display Edit Form)
    // ----------------------------------------------------------------
    public function edit(int $id)
    {
        $user = $this->userModel->find($id);
        if (!$user) {
            return redirect()->to('users')->with('error', 'User not found.');
        }

        return view('users/form', [
            'pageTitle'  => 'Edit User',
            'breadcrumb' => [['label' => 'Users', 'url' => base_url('users')], 'Edit'],
            'user'       => $user,
            'roles'      => $this->roleModel->findAll(),
        ]);
    }

    // ----------------------------------------------------------------
    // POST /users/update/:id (Process Update User + LOG)
    // ----------------------------------------------------------------
    public function update(int $id)
    {
        $user = $this->userModel->find($id);
        if (!$user) {
            return redirect()->to('users')->with('error', 'User not found.');
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

        $isActive = $this->request->getPost('is_active') ? 1 : 0;

        // Prevent self-lockout
        if ((int)session('user_id') === $id) {
            if ($isActive === 0) {
                return redirect()->back()->withInput()->with('error', 'You cannot deactivate your own account.');
            }
            if ((int)$this->request->getPost('role_id') !== (int)$user['role_id']) {
                return redirect()->back()->withInput()->with('error', 'You cannot change your own role.');
            }
        }

        $data = [
            'fullname'  => $this->request->getPost('fullname'),
            'username'  => strtolower($this->request->getPost('username')),
            'email'     => strtolower($this->request->getPost('email')),
            'phone'     => $this->request->getPost('phone'),
            'role_id'   => $this->request->getPost('role_id'),
            'is_active' => $isActive,
        ];

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

        if ((int)session('user_id') === $id) {
            session()->set([
                'fullname' => $data['fullname'],
                'is_active' => $isActive
            ]);
        }

        \App\Models\ActivityLogModel::log('Update User', 'Updated user data for ID: ' . $id . ' [Status: ' . ($isActive ? 'Active' : 'Inactive') . ']');

        return redirect()->to('users')->with('success', 'User details updated successfully.');
    }

    // ----------------------------------------------------------------
    // GET /users/delete/:id (Process Soft Delete + LOG)
    // ----------------------------------------------------------------
    public function delete(int $id)
    {
        if ($id === (int) session('user_id')) {
            return redirect()->to('users')->with('error', 'You cannot delete your own account.');
        }

        $user = $this->userModel->find($id);
        if (!$user) {
            return redirect()->to('users')->with('error', 'User not found or already deleted.');
        }

        $this->userModel->delete($id);

        ActivityLogModel::log(
            'Delete User',
            'Soft deleted user: "' . $user['fullname'] . '" (@' . $user['username'] . ') (ID: ' . $id . ')'
        );

        return redirect()->to('users')->with('success', 'User deleted successfully from system.');
    }

    // ----------------------------------------------------------------
    // GET /users/reset-throttle/:id (Reset Throttle + LOG)
    // ----------------------------------------------------------------
    public function resetThrottle(int $id)
    {
        $user = $this->userModel->find($id);
        if (!$user) {
            return redirect()->to('users')->with('error', 'User not found.');
        }

        $cache = service('cache');
        $cache->clean();

        if ((int)$user['is_active'] === 0) {
            $this->userModel->update($id, ['is_active' => 1]);
        }

        ActivityLogModel::log(
            'Reset Login Throttle',
            'Reset login throttle restriction for account: ' . $user['fullname']
        );

        return redirect()->to('users')->with('success', 'Login restriction for user has been cleared.');
    }
}
