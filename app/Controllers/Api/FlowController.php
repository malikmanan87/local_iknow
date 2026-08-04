<?php
namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\FlowModel;

class FlowController extends ResourceController {
    protected $format = 'json';

    public function create() {
        $model = new FlowModel();
        $data = $this->request->getJSON(true);

        if (!$data || !isset($data['module_id']) || !isset($data['step_title'])) {
            return $this->fail('Maklumat flow tidak lengkap', 400);
        }

        $id = $model->insert($data);
        return $this->respondCreated(['id' => $id, 'message' => 'Flow modul berjaya ditambah']);
    }

    public function delete($id = null) {
        $model = new FlowModel();
        if (!$model->find($id)) {
            return $this->failNotFound('Flow tidak dijumpai');
        }

        $model->delete($id);
        return $this->respondDeleted(['message' => 'Flow berjaya dipadam']);
    }
}
