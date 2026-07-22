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
    // GET /items (Display Item List)
    // ----------------------------------------------------------------
    public function index()
    {
        return view('items/index', [
            'pageTitle'  => 'Item Management',
            'breadcrumb' => ['Items'],
            'items'      => $this->itemModel->getItemsWithUser(),
        ]);
    }

    // ----------------------------------------------------------------
    // GET /items/create (Display Add Form)
    // ----------------------------------------------------------------
    public function create()
    {
        return view('items/form', [
            'pageTitle'  => 'Add New Item',
            'breadcrumb' => [['label' => 'Items', 'url' => base_url('items')], 'Add'],
        ]);
    }

    // ----------------------------------------------------------------
    // POST /items/store (Process Store Item + LOG)
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

        ActivityLogModel::log(
            'Add Item',
            'Added new item: "' . $data['name'] . '" under category: ' . ($data['category'] ?: 'No Category')
        );

        return redirect()->to('items')->with('success', 'New item successfully registered.');
    }

    // ----------------------------------------------------------------
    // GET /items/show/:id (Display Item Details)
    // ----------------------------------------------------------------
    public function show(int $id)
    {
        $item = $this->itemModel->getItemWithUser($id);

        if (!$item) {
            return redirect()->to('items')->with('error', 'Item not found.');
        }

        return view('items/show', [
            'pageTitle'  => 'Item Details',
            'breadcrumb' => [['label' => 'Items', 'url' => base_url('items')], 'Details'],
            'item'       => $item
        ]);
    }

    // ----------------------------------------------------------------
    // GET /items/edit/:id (Display Edit Form)
    // ----------------------------------------------------------------
    public function edit(int $id)
    {
        $item = $this->itemModel->find($id);
        if (!$item) {
            return redirect()->to('items')->with('error', 'Item not found.');
        }

        return view('items/form', [
            'pageTitle'  => 'Edit Item',
            'breadcrumb' => [['label' => 'Items', 'url' => base_url('items')], 'Edit'],
            'item'       => $item,
        ]);
    }

    // ----------------------------------------------------------------
    // POST /items/update/:id (Process Update Item + LOG)
    // ----------------------------------------------------------------
    public function update(int $id)
    {
        $item = $this->itemModel->find($id);
        if (!$item) {
            return redirect()->to('items')->with('error', 'Item not found.');
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

        ActivityLogModel::log(
            'Update Item',
            'Updated item information (ID: ' . $id . '). Original name: "' . $item['name'] . '" -> New name: "' . $data['name'] . '"'
        );

        return redirect()->to('items')->with('success', 'Item details updated successfully.');
    }

    // ----------------------------------------------------------------
    // GET /items/delete/:id (Process Delete Item + LOG)
    // ----------------------------------------------------------------
    public function delete(int $id)
    {
        $item = $this->itemModel->find($id);
        if (!$item) {
            return redirect()->to('items')->with('error', 'Item not found or already deleted.');
        }

        $this->itemModel->delete($id);

        ActivityLogModel::log(
            'Delete Item',
            'Deleted item from system: "' . $item['name'] . '" (ID: ' . $id . ')'
        );

        return redirect()->to('items')->with('success', 'Item deleted successfully from system.');
    }
}
