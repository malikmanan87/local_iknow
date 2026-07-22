<?php

namespace App\Controllers;

use App\Models\RoleModel;
use App\Traits\LoggableTrait;

class RolesController extends BaseController
{
    use LoggableTrait;

    protected RoleModel $roleModel;

    public function __construct()
    {
        $this->roleModel = new RoleModel();
        helper(['form', 'url']);
    }

    // ----------------------------------------------------------------
    // GET /roles (Display Role List)
    // ----------------------------------------------------------------
    public function index()
    {
        return view('roles/index', [
            'pageTitle'  => 'Roles & Permissions',
            'breadcrumb' => ['Roles & Permissions'],
            'roles'      => $this->roleModel->findAll(),
        ]);
    }

    // ----------------------------------------------------------------
    // GET /roles/create (Display Add Form)
    // ----------------------------------------------------------------
    public function create()
    {
        return view('roles/form', [
            'pageTitle'  => 'Add New Role',
            'breadcrumb' => [['label' => 'Roles', 'url' => base_url('roles')], 'Add'],
        ]);
    }

    // ----------------------------------------------------------------
    // POST /roles/store (Process Store Role + LOG)
    // ----------------------------------------------------------------
    public function store()
    {
        $rules = [
            'name'         => 'required|alpha_dash|min_length[3]|max_length[50]|is_unique[roles.name]',
            'display_name' => 'required|min_length[3]|max_length[100]',
        ];

        if (!$this->validate($rules)) {
            return redirect()->back()->withInput()->with('errors', $this->validator->getErrors());
        }

        $name = strtolower($this->request->getPost('name'));

        $data = [
            'name'         => $name,
            'display_name' => $this->request->getPost('display_name'),
            'description'  => $this->request->getPost('description'),
        ];

        $this->roleModel->insert($data);

        $this->logActivity(
            'Add Role',
            'Created new role: "' . $data['display_name'] . '" with code: ' . $data['name']
        );

        return redirect()->to('roles')->with('success', 'New role successfully registered.');
    }

    // ----------------------------------------------------------------
    // GET /roles/edit/:id (Display Edit Form)
    // ----------------------------------------------------------------
    public function edit(int $id)
    {
        $role = $this->roleModel->find($id);
        if (!$role) {
            return redirect()->to('roles')->with('error', 'Role not found.');
        }

        return view('roles/form', [
            'pageTitle'  => 'Edit Role',
            'breadcrumb' => [['label' => 'Roles', 'url' => base_url('roles')], 'Edit'],
            'role'       => $role,
        ]);
    }

    // ----------------------------------------------------------------
    // POST /roles/update/:id (Process Update Role + LOG)
    // ----------------------------------------------------------------
    public function update(int $id)
    {
        $role = $this->roleModel->find($id);
        if (!$role) {
            return redirect()->to('roles')->with('error', 'Role not found.');
        }

        $rules = [
            'display_name' => 'required|min_length[3]|max_length[100]',
        ];

        if (!in_array($role['name'], ['admin', 'manager', 'user'])) {
            $rules['name'] = "required|alpha_dash|min_length[3]|max_length[50]|is_unique[roles.name,id,{$id}]";
        }

        if (!$this->validate($rules)) {
            return redirect()->back()->withInput()->with('errors', $this->validator->getErrors());
        }

        $data = [
            'display_name' => $this->request->getPost('display_name'),
            'description'  => $this->request->getPost('description'),
        ];

        if (!in_array($role['name'], ['admin', 'manager', 'user'])) {
            $data['name'] = strtolower($this->request->getPost('name'));
        }

        $this->roleModel->update($id, $data);

        $this->logActivity(
            'Update Role',
            'Updated role configuration (ID: ' . $id . '). Display name changed to: "' . $data['display_name'] . '"'
        );

        return redirect()->to('roles')->with('success', 'Role details updated successfully.');
    }

    // ----------------------------------------------------------------
    // GET /roles/delete/:id (Process Delete Role + LOG)
    // ----------------------------------------------------------------
    public function delete(int $id)
    {
        $role = $this->roleModel->find($id);
        if (!$role) {
            return redirect()->to('roles')->with('error', 'Role not found.');
        }

        if (in_array($role['name'], ['admin', 'manager', 'user'])) {
            return redirect()->to('roles')->with('error', 'Default system roles cannot be deleted.');
        }

        $this->roleModel->delete($id);

        $this->logActivity(
            'Delete Role',
            'Permanently deleted system role: "' . $role['display_name'] . '" (Code: ' . $role['name'] . ') (ID: ' . $id . ')'
        );

        return redirect()->to('roles')->with('success', 'Role deleted successfully from system.');
    }
}
