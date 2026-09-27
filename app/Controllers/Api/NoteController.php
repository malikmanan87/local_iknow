<?php
namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\NoteModel;
use Config\Database;

class NoteController extends ResourceController {
    protected $format = 'json';

    protected function getModelInstance() {
        $model = new NoteModel();
        $model->ensureTableExists();
        return $model;
    }

    public function index() {
        $model = $this->getModelInstance();
        $db = Database::connect();

        $search = trim($this->request->getGet('search') ?? '');
        $category = trim($this->request->getGet('category') ?? '');

        $builder = $db->table('notes')
            ->orderBy('is_locked', 'DESC')
            ->orderBy('created_at', 'DESC');

        if (!empty($category) && $category !== 'Semua') {
            $builder->where('category', $category);
        }

        if (!empty($search)) {
            $builder->groupStart()
                ->like('title', $search)
                ->orLike('content', $search)
                ->orLike('category', $search)
                ->orLike('author', $search)
                ->groupEnd();
        }

        $notes = $builder->get()->getResultArray();
        return $this->respond($notes);
    }

    public function show($id = null) {
        $model = $this->getModelInstance();
        $note = $model->find($id);

        if (!$note) {
            return $this->failNotFound('Nota tidak dijumpai');
        }

        return $this->respond($note);
    }

    public function create() {
        $model = $this->getModelInstance();
        try {
            $data = $this->request->getJSON(true);
        } catch (\Throwable $th) {
            $data = null;
        }

        if (!$data) {
            $data = $this->request->getPost();
        }

        if (!$data || !isset($data['content']) || trim($data['content']) === '') {
            return $this->fail('Kandungan nota diperlukan', 400);
        }

        $title = isset($data['title']) && trim($data['title']) !== '' 
            ? trim($data['title']) 
            : 'Nota ' . date('d/m/Y H:i');

        $isLocked = !empty($data['is_locked']) ? 1 : 0;

        $id = $model->insert([
            'title'     => $title,
            'category'  => !empty($data['category']) ? trim($data['category']) : 'General',
            'content'   => trim($data['content']),
            'is_locked' => $isLocked,
            'author'    => !empty($data['author']) ? trim($data['author']) : 'Pengguna iKNOW'
        ]);

        if ($id) {
            return $this->respondCreated(['id' => $id, 'message' => 'Nota berjaya disimpan']);
        }

        return $this->fail('Gagal menyimpan nota', 500);
    }

    public function update($id = null) {
        $model = $this->getModelInstance();
        $note = $model->find($id);

        if (!$note) {
            return $this->failNotFound('Nota tidak dijumpai');
        }

        try {
            $data = $this->request->getJSON(true);
        } catch (\Throwable $th) {
            $data = null;
        }

        if (!$data) {
            $data = $this->request->getPost();
        }

        if (!$data) {
            return $this->fail('Data tidak sah', 400);
        }

        $updateData = [];
        if (isset($data['title'])) {
            $updateData['title'] = trim($data['title']);
        }
        if (isset($data['content'])) {
            $updateData['content'] = trim($data['content']);
        }
        if (isset($data['category'])) {
            $updateData['category'] = trim($data['category']);
        }
        if (array_key_exists('is_locked', $data)) {
            $updateData['is_locked'] = !empty($data['is_locked']) ? 1 : 0;
        }
        if (isset($data['author'])) {
            $updateData['author'] = trim($data['author']);
        }

        $model->update($id, $updateData);
        return $this->respond(['message' => 'Nota berjaya dikemaskini']);
    }

    public function toggleLock($id = null) {
        $model = $this->getModelInstance();
        $note = $model->find($id);

        if (!$note) {
            return $this->failNotFound('Nota tidak dijumpai');
        }

        $newLockStatus = $note['is_locked'] == 1 ? 0 : 1;
        $model->update($id, ['is_locked' => $newLockStatus]);

        $statusText = $newLockStatus == 1 ? 'dikunci' : 'dibuka kunci';
        return $this->respond([
            'is_locked' => $newLockStatus,
            'message'   => "Nota telah berjaya {$statusText}"
        ]);
    }

    public function delete($id = null) {
        $model = $this->getModelInstance();
        $note = $model->find($id);

        if (!$note) {
            return $this->failNotFound('Nota tidak dijumpai');
        }

        // KESELAMATAN: Jika dikunci, TIDAK BOLEH dipadam!
        if ((int)$note['is_locked'] === 1) {
            return $this->fail('Nota ini telah dikunci (Lock) dan tidak boleh dipadam. Sila buka kunci terlebih dahulu.', 400);
        }

        $model->delete($id);
        return $this->respondDeleted(['message' => 'Nota berjaya dipadam']);
    }
}
