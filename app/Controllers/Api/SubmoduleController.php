<?php
namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\SubmoduleModel;

class SubmoduleController extends ResourceController {
    protected $format = 'json';

    public function create() {
        $model = new SubmoduleModel();
        $data = $this->request->getJSON(true);

        if (!$data || !isset($data['module_id']) || !isset($data['title'])) {
            return $this->fail('Tajuk submodul dan modul ID diperlukan', 400);
        }

        $id = $model->insert([
            'module_id' => $data['module_id'],
            'parent_id' => !empty($data['parent_id']) ? $data['parent_id'] : null,
            'title' => trim($data['title']),
            'description' => $data['description'] ?? ''
        ]);

        return $this->respondCreated(['id' => $id, 'message' => 'Submodul berjaya ditambah']);
    }

    public function delete($id = null) {
        $model = new SubmoduleModel();
        if (!$model->find($id)) {
            return $this->failNotFound('Submodul tidak dijumpai');
        }

        $model->delete($id);
        return $this->respondDeleted(['message' => 'Submodul berjaya dipadam']);
    }
}
