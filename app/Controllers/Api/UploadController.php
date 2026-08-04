<?php
namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;

class UploadController extends ResourceController {
    protected $format = 'json';

    public function create() {
        $file = $this->request->getFile('image');
        $type = $this->request->getPost('type') ?? 'flows'; // flows or troubleshoot

        if (!$file || !$file->isValid()) {
            return $this->fail($file ? $file->getErrorString() : 'Tiada fail imej dimuat naik', 400);
        }

        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!in_array($file->getMimeType(), $allowedTypes)) {
            return $this->fail('Format imej mestilah JPG, PNG, WEBP, atau GIF', 400);
        }

        $targetFolder = ($type === 'troubleshoot') ? 'troubleshoot' : 'flows';
        $uploadPath = FCPATH . 'uploads/' . $targetFolder;

        if (!is_dir($uploadPath)) {
            mkdir($uploadPath, 0777, true);
        }

        $newName = $file->getRandomName();
        $file->move($uploadPath, $newName);

        $relativePath = 'uploads/' . $targetFolder . '/' . $newName;
        $fullUrl = base_url($relativePath);

        return $this->respondCreated([
            'image_path' => $relativePath,
            'full_url' => $fullUrl,
            'message' => 'Imej berjaya dimuat naik'
        ]);
    }
}
