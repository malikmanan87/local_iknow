<?php

namespace App\Controllers;

use App\Models\ItemModel;
use App\Models\ActivityLogModel; // Memuatkan Model Log Aktiviti

class ItemsController extends BaseController
{
    protected ItemModel $itemModel;

    public function __construct()
    {
        $this->itemModel = new ItemModel();
        helper(['form', 'url']);
    }

    // ----------------------------------------------------------------
    // GET /items (Paparan Senarai Item)
    // ----------------------------------------------------------------
    public function index()
    {
        return view('items/index', [
            'pageTitle'  => 'Pengurusan Item',
            'breadcrumb' => ['Item'],
            'items'      => $this->itemModel->getItemsWithUser(),
        ]);
    }

    // ----------------------------------------------------------------
    // GET /items/create (Paparan Borang Tambah)
    // ----------------------------------------------------------------
    public function create()
    {
        return view('items/form', [
            'pageTitle'  => 'Tambah Item Baru',
            'breadcrumb' => [['label' => 'Item', 'url' => base_url('items')], 'Tambah'],
        ]);
    }

    // ----------------------------------------------------------------
    // POST /items/store (Proses Simpan Item Baru + RAKAM LOG)
    // ----------------------------------------------------------------
    public function store()
    {
        $rules = [
            'name'     => 'required|min_length[3]|max_length[150]',
            'category' => 'permit_empty|max_length[100]',
            'status'   => 'required|in_list[active,inactive,pending]',
        ];

        if (!$this->validate($rules)) {
            return redirect()->back()->withInput()->with('errors', $this->validator->getErrors());
        }

        $data = [
            'name'        => $this->request->getPost('name'),
            'category'    => $this->request->getPost('category'),
            'description' => $this->request->getPost('description'),
            'status'      => $this->request->getPost('status'),
            'created_by'  => session('user_id'),
        ];

        $this->itemModel->insert($data);

        // 🚀 RAKAM LOG AKTIVITI: TAMBAH ITEM
        ActivityLogModel::log(
            'Tambah Item',
            'Menambah item baharu: "' . $data['name'] . '" di bawah kategori: ' . ($data['category'] ?: 'Tiada Kategori')
        );

        return redirect()->to('items')->with('success', 'Item baharu berjaya didaftarkan.');
    }

    // ----------------------------------------------------------------
    // GET /items/show/:id (Paparan Butiran Item)
    // ----------------------------------------------------------------
    public function show(int $id)
    {
        // Ambil data item berserta maklumat pencipta jika ada
        $item = $this->itemModel->getItemsWithUser() ?
            array_filter($this->itemModel->getItemsWithUser(), fn($i) => (int)$i['id'] === $id) :
            $this->itemModel->find($id);

        // Jika array_filter digunakan, reset key array
        if (is_array($item) && !isset($item['id'])) {
            $item = current($item);
        }

        if (!$item) {
            return redirect()->to('dashboard')->with('error', 'Item tidak ditemui.');
        }

        return view('items/show', [
            'pageTitle'  => 'Butiran Item',
            'breadcrumb' => [['label' => 'Dashboard', 'url' => base_url('dashboard')], 'Butiran Item'],
            'item'       => $item
        ]);
    }

    // ----------------------------------------------------------------
    // GET /items/edit/:id (Paparan Borang Kemaskini)
    // ----------------------------------------------------------------
    public function edit(int $id)
    {
        $item = $this->itemModel->find($id);
        if (!$item) {
            return redirect()->to('items')->with('error', 'Item tidak ditemui.');
        }

        return view('items/form', [
            'pageTitle'  => 'Kemaskini Item',
            'breadcrumb' => [['label' => 'Item', 'url' => base_url('items')], 'Kemaskini'],
            'item'       => $item,
        ]);
    }

    // ----------------------------------------------------------------
    // POST /items/update/:id (Proses Kemaskini Item + RAKAM LOG)
    // ----------------------------------------------------------------
    public function update(int $id)
    {
        $item = $this->itemModel->find($id);
        if (!$item) {
            return redirect()->to('items')->with('error', 'Item tidak ditemui.');
        }

        $rules = [
            'name'     => 'required|min_length[3]|max_length[150]',
            'category' => 'permit_empty|max_length[100]',
            'status'   => 'required|in_list[active,inactive,pending]',
        ];

        if (!$this->validate($rules)) {
            return redirect()->back()->withInput()->with('errors', $this->validator->getErrors());
        }

        $data = [
            'name'        => $this->request->getPost('name'),
            'category'    => $this->request->getPost('category'),
            'description' => $this->request->getPost('description'),
            'status'      => $this->request->getPost('status'),
        ];

        $this->itemModel->update($id, $data);

        // 🚀 RAKAM LOG AKTIVITI: KEMASKINI ITEM
        ActivityLogModel::log(
            'Kemaskini Item',
            'Mengemas kini maklumat item (ID: ' . $id . '). Nama asal: "' . $item['name'] . '" -> Nama baharu: "' . $data['name'] . '"'
        );

        return redirect()->to('items')->with('success', 'Maklumat item berjaya dikemaskini.');
    }

    // ----------------------------------------------------------------
    // GET /items/delete/:id (Proses Padam Item + RAKAM LOG)
    // ----------------------------------------------------------------
    public function delete(int $id)
    {
        $item = $this->itemModel->find($id);
        if (!$item) {
            return redirect()->to('items')->with('error', 'Item tidak ditemui atau telah dipadam sebelum ini.');
        }

        $this->itemModel->delete($id);

        // 🚀 RAKAM LOG AKTIVITI: PADAM ITEM
        ActivityLogModel::log(
            'Padam Item',
            'Memadam item secara kekal dari sistem: "' . $item['name'] . '" (ID: ' . $id . ')'
        );

        return redirect()->to('items')->with('success', 'Item berjaya dipadam daripada sistem.');
    }
}
