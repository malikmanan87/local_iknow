<?php
namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\ContactModel;

class ContactController extends ResourceController {
    protected $format = 'json';

    public function create() {
        $model = new ContactModel();
        $data = $this->request->getJSON(true);

        if (!$data || !isset($data['module_id']) || !isset($data['name'])) {
            return $this->fail('Maklumat PIC tidak lengkap', 400);
        }

        $id = $model->insert($data);
        return $this->respondCreated(['id' => $id, 'message' => 'PIC berjaya ditambah']);
    }

    public function delete($id = null) {
        $model = new ContactModel();
        if (!$model->find($id)) {
            return $this->failNotFound('PIC tidak dijumpai');
        }

        $model->delete($id);
        return $this->respondDeleted(['message' => 'PIC berjaya dipadam']);
    }
}
