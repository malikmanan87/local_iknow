<?php

namespace App\Controllers;

use App\Models\RoleModel;
use App\Models\ActivityLogModel; // Memuatkan Model Log Aktiviti

class RolesController extends BaseController
{
    protected RoleModel $roleModel;

    public function __construct()
    {
        $this->roleModel = new RoleModel();
        helper(['form', 'url']);
    }

    // ----------------------------------------------------------------
    // GET /roles (Paparan Senarai Peranan)
    // ----------------------------------------------------------------
    public function index()
    {
        return view('roles/index', [
            'pageTitle'  => 'Peranan & Kebenaran',
            'breadcrumb' => ['Peranan & Kebenaran'],
            'roles'      => $this->roleModel->findAll(),
        ]);
    }

    // ----------------------------------------------------------------
    // GET /roles/create (Paparan Borang Tambah)
    // ----------------------------------------------------------------
    public function create()
    {
        return view('roles/form', [
            'pageTitle'  => 'Tambah Peranan Baru',
            'breadcrumb' => [['label' => 'Peranan', 'url' => base_url('roles')], 'Tambah'],
        ]);
    }

    // ----------------------------------------------------------------
    // POST /roles/store (Proses Simpan Peranan Baru + RAKAM LOG)
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

        // Memastikan nama peranan disimpan dalam huruf kecil (English standard)
        $name = strtolower($this->request->getPost('name'));

        $data = [
            'name'         => $name,
            'display_name' => $this->request->getPost('display_name'),
            'description'  => $this->request->getPost('description'),
        ];

        $this->roleModel->insert($data);

        // 🚀 RAKAM LOG AKTIVITI: TAMBAH PERANAN
        ActivityLogModel::log(
            'Tambah Peranan',
            'Mencipta peranan baharu: "' . $data['display_name'] . '" dengan kod sistem: ' . $data['name']
        );

        return redirect()->to('roles')->with('success', 'Peranan baharu berjaya didaftarkan.');
    }

    // ----------------------------------------------------------------
    // GET /roles/edit/:id (Paparan Borang Kemaskini)
    // ----------------------------------------------------------------
    public function edit(int $id)
    {
        $role = $this->roleModel->find($id);
        if (!$role) {
            return redirect()->to('roles')->with('error', 'Peranan tidak ditemui.');
        }

        return view('roles/form', [
            'pageTitle'  => 'Kemaskini Peranan',
            'breadcrumb' => [['label' => 'Peranan', 'url' => base_url('roles')], 'Kemaskini'],
            'role'       => $role,
        ]);
    }

    // ----------------------------------------------------------------
    // POST /roles/update/:id (Proses Kemaskini Peranan + RAKAM LOG)
    // ----------------------------------------------------------------
    public function update(int $id)
    {
        $role = $this->roleModel->find($id);
        if (!$role) {
            return redirect()->to('roles')->with('error', 'Peranan tidak ditemui.');
        }

        $rules = [
            'display_name' => 'required|min_length[3]|max_length[100]',
        ];

        // Sekiranya peranan bukan default sistem, benarkan kemaskini nama kod unik
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

        // 🚀 RAKAM LOG AKTIVITI: KEMASKINI PERANAN
        ActivityLogModel::log(
            'Kemaskini Peranan',
            'Mengemas kini konfigurasi peranan (ID: ' . $id . '). Nama paparan dipindah kepada: "' . $data['display_name'] . '"'
        );

        return redirect()->to('roles')->with('success', 'Maklumat peranan berjaya dikemaskini.');
    }

    // ----------------------------------------------------------------
    // GET /roles/delete/:id (Proses Padam Peranan + RAKAM LOG)
    // ----------------------------------------------------------------
    public function delete(int $id)
    {
        $role = $this->roleModel->find($id);
        if (!$role) {
            return redirect()->to('roles')->with('error', 'Peranan tidak ditemui.');
        }

        // Sekatan keselamatan: Elakkan pemadaman peranan asas sistem
        if (in_array($role['name'], ['admin', 'manager', 'user'])) {
            return redirect()->to('roles')->with('error', 'Peranan sistem default tidak boleh dipadam.');
        }

        $this->roleModel->delete($id);

        // 🚀 RAKAM LOG AKTIVITI: PADAM PERANAN
        ActivityLogModel::log(
            'Padam Peranan',
            'Memadam peranan sistem secara kekal: "' . $role['display_name'] . '" (Kod: ' . $role['name'] . ') (ID: ' . $id . ')'
        );

        return redirect()->to('roles')->with('success', 'Peranan berjaya dipadam daripada sistem.');
    }
}
