<?php
namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\ProcurementDocumentModel;
use Config\Database;

class ProcurementDocumentController extends ResourceController {
    protected $format = 'json';

    protected function getModelInstance() {
        $model = new ProcurementDocumentModel();
        $model->ensureTableExists();
        return $model;
    }

    private function formatBytes($bytes, $precision = 2) {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }

    private function returnBytes($val) {
        $val = trim((string)$val);
        if (empty($val)) return 0;
        $last = strtolower($val[strlen($val)-1]);
        $val = (int) $val;
        switch($last) {
            case 'g': $val *= 1024 * 1024 * 1024; break;
            case 'm': $val *= 1024 * 1024; break;
            case 'k': $val *= 1024; break;
        }
        return $val;
    }

    private function checkUploadOverflow() {
        $contentLength = (int) ($this->request->getServer('CONTENT_LENGTH') ?? 0);
        $postMax = ini_get('post_max_size');
        $postMaxBytes = $this->returnBytes($postMax);

        if ($postMaxBytes > 0 && $contentLength > $postMaxBytes) {
            $sentMb = round($contentLength / 1048576, 1);
            $limitMb = round($postMaxBytes / 1048576, 1);
            return "Saiz fail yang dihantar ({$sentMb} MB) melebihi had muat naik pelayan ({$limitMb} MB). Sila kecilkan fail atau pastikan konfigurasi post_max_size dinaikkan.";
        }
        return null;
    }

    public function index() {
        $model = $this->getModelInstance();
        $db = Database::connect();

        $search = trim($this->request->getGet('search') ?? '');
        $category = trim($this->request->getGet('category') ?? '');

        $builder = $db->table('procurement_documents')
            ->orderBy('id', 'DESC');

        if (!empty($category) && $category !== 'Semua') {
            $builder->where('category', $category);
        }

        if (!empty($search)) {
            $builder->groupStart()
                ->like('title', $search)
                ->orLike('reference_no', $search)
                ->orLike('description', $search)
                ->orLike('tags', $search)
                ->orLike('category', $search)
                ->groupEnd();
        }

        $docs = $builder->get()->getResultArray();

        // Enhance with full URL
        foreach ($docs as &$doc) {
            if (!empty($doc['file_path'])) {
                $doc['full_url'] = base_url($doc['file_path']);
            } else {
                $doc['full_url'] = null;
            }
        }

        return $this->respond($docs);
    }

    public function show($id = null) {
        $model = $this->getModelInstance();
        $doc = $model->find($id);

        if (!$doc) {
            return $this->failNotFound('Dokumen tidak dijumpai');
        }

        if (!empty($doc['file_path'])) {
            $doc['full_url'] = base_url($doc['file_path']);
        } else {
            $doc['full_url'] = null;
        }

        return $this->respond($doc);
    }

    public function create() {
        if ($overflowError = $this->checkUploadOverflow()) {
            return $this->fail($overflowError, 413);
        }

        $model = $this->getModelInstance();

        $title = $this->request->getPost('title') ?? '';
        $category = $this->request->getPost('category') ?? 'Penilaian Perolehan';
        $refNo = $this->request->getPost('reference_no') ?? '';
        $desc = $this->request->getPost('description') ?? '';
        $effectiveDate = $this->request->getPost('effective_date') ?? null;
        $tags = $this->request->getPost('tags') ?? '';

        // If JSON payload was passed instead of multipart
        if (empty($title)) {
            $json = $this->request->getJSON(true);
            if (!empty($json)) {
                $title = $json['title'] ?? '';
                $category = $json['category'] ?? 'Penilaian Perolehan';
                $refNo = $json['reference_no'] ?? '';
                $desc = $json['description'] ?? '';
                $effectiveDate = $json['effective_date'] ?? null;
                $tags = $json['tags'] ?? '';
            }
        }

        if (empty($title)) {
            return $this->fail('Tajuk dokumen wajib diisi', 400);
        }

        $filePath = null;
        $fileName = null;
        $fileSize = null;

        $file = $this->request->getFile('file');
        if (!$file || $file->getError() === UPLOAD_ERR_NO_FILE) {
            return $this->fail('Sila pilih dan muat naik fail dokumen (PDF, Word, atau Excel)', 400);
        }

        if (!$file->isValid()) {
            return $this->fail('Ralat muat naik fail: ' . $file->getErrorString(), 400);
        }

        $allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
        $ext = strtolower($file->getClientExtension() ?: $file->getExtension());
        if (!in_array($ext, $allowedExts)) {
            return $this->fail('Hanya fail PDF, Word (.doc/.docx), atau Excel (.xls/.xlsx) dibenarkan. Format dikesan: ' . ($ext ?: 'tidak diketahui'), 400);
        }

        $uploadDir = FCPATH . 'uploads/documents';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fileName = $file->getClientName();
        $fileSize = $this->formatBytes($file->getSize());
        $newFileName = $file->getRandomName();
        $file->move($uploadDir, $newFileName);

        $filePath = 'uploads/documents/' . $newFileName;

        $insertData = [
            'title' => $title,
            'category' => $category,
            'reference_no' => $refNo,
            'description' => $desc,
            'file_path' => $filePath,
            'file_name' => $fileName,
            'file_size' => $fileSize,
            'effective_date' => !empty($effectiveDate) ? $effectiveDate : null,
            'tags' => $tags
        ];

        $newId = $model->insert($insertData);
        if (!$newId) {
            return $this->fail('Gagal menyimpan maklumat dokumen', 500);
        }

        $created = $model->find($newId);
        $created['full_url'] = !empty($created['file_path']) ? base_url($created['file_path']) : null;

        return $this->respondCreated([
            'message' => 'Dokumen berjaya didaftarkan',
            'data' => $created
        ]);
    }

    public function update($id = null) {
        if ($overflowError = $this->checkUploadOverflow()) {
            return $this->fail($overflowError, 413);
        }

        $model = $this->getModelInstance();
        $doc = $model->find($id);

        if (!$doc) {
            return $this->failNotFound('Dokumen tidak dijumpai');
        }

        $title = $this->request->getPost('title');
        $category = $this->request->getPost('category');
        $refNo = $this->request->getPost('reference_no');
        $desc = $this->request->getPost('description');
        $effectiveDate = $this->request->getPost('effective_date');
        $tags = $this->request->getPost('tags');

        // Check if JSON
        if ($title === null) {
            $json = $this->request->getJSON(true);
            if (!empty($json)) {
                $title = $json['title'] ?? null;
                $category = $json['category'] ?? null;
                $refNo = $json['reference_no'] ?? null;
                $desc = $json['description'] ?? null;
                $effectiveDate = $json['effective_date'] ?? null;
                $tags = $json['tags'] ?? null;
            }
        }

        $updateData = [];
        if ($title !== null) $updateData['title'] = $title;
        if ($category !== null) $updateData['category'] = $category;
        if ($refNo !== null) $updateData['reference_no'] = $refNo;
        if ($desc !== null) $updateData['description'] = $desc;
        if ($effectiveDate !== null) $updateData['effective_date'] = !empty($effectiveDate) ? $effectiveDate : null;
        if ($tags !== null) $updateData['tags'] = $tags;

        // Check file replacement
        $file = $this->request->getFile('file');
        if ($file && $file->getError() !== UPLOAD_ERR_NO_FILE) {
            if (!$file->isValid()) {
                return $this->fail('Ralat muat naik fail: ' . $file->getErrorString(), 400);
            }

            $allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
            $ext = strtolower($file->getClientExtension() ?: $file->getExtension());
            if (!in_array($ext, $allowedExts)) {
                return $this->fail('Hanya fail PDF, Word (.doc/.docx), atau Excel (.xls/.xlsx) dibenarkan. Format dikesan: ' . ($ext ?: 'tidak diketahui'), 400);
            }

            $uploadDir = FCPATH . 'uploads/documents';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            // Remove old file
            if (!empty($doc['file_path']) && file_exists(FCPATH . $doc['file_path'])) {
                @unlink(FCPATH . $doc['file_path']);
            }

            $newFileName = $file->getRandomName();
            $file->move($uploadDir, $newFileName);

            $updateData['file_path'] = 'uploads/documents/' . $newFileName;
            $updateData['file_name'] = $file->getClientName();
            $updateData['file_size'] = $this->formatBytes($file->getSize());
        }

        if (!empty($updateData)) {
            $model->update($id, $updateData);
        }

        $updated = $model->find($id);
        $updated['full_url'] = !empty($updated['file_path']) ? base_url($updated['file_path']) : null;

        return $this->respond([
            'message' => 'Dokumen berjaya dikemaskini',
            'data' => $updated
        ]);
    }

    public function delete($id = null) {
        $model = $this->getModelInstance();
        $doc = $model->find($id);

        if (!$doc) {
            return $this->failNotFound('Dokumen tidak dijumpai');
        }

        // Delete physical file
        if (!empty($doc['file_path']) && file_exists(FCPATH . $doc['file_path'])) {
            @unlink(FCPATH . $doc['file_path']);
        }

        $model->delete($id);

        return $this->respondDeleted([
            'message' => 'Dokumen berjaya dipadam'
        ]);
    }
}
