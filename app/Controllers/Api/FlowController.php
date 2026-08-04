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

        if (isset($data['submodule_id']) && ($data['submodule_id'] === '' || $data['submodule_id'] === '0' || $data['submodule_id'] === 0)) {
            $data['submodule_id'] = null;
        } else if (isset($data['submodule_id'])) {
            $data['submodule_id'] = (int)$data['submodule_id'];
        }

        $id = $model->insert($data);
        return $this->respondCreated(['id' => $id, 'message' => 'Flow modul berjaya ditambah']);
    }

    public function update($id = null) {
        $model = new FlowModel();
        $data = $this->request->getJSON(true);
        if (!$model->find($id)) return $this->failNotFound('Flow tidak dijumpai');

        if (isset($data['submodule_id']) && ($data['submodule_id'] === '' || $data['submodule_id'] === '0' || $data['submodule_id'] === 0)) {
            $data['submodule_id'] = null;
        } else if (isset($data['submodule_id'])) {
            $data['submodule_id'] = (int)$data['submodule_id'];
        }

        $model->update($id, $data);
        return $this->respond(['message' => 'Flow berjaya dikemaskini']);
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
