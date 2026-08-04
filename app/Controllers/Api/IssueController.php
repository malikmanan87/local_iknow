<?php
namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\IssueModel;
use App\Models\TroubleshootingModel;

class IssueController extends ResourceController {
    protected $format = 'json';

    public function create() {
        $issueModel = new IssueModel();
        $tsModel = new TroubleshootingModel();
        $data = $this->request->getJSON(true);

        if (!$data || !isset($data['module_id']) || !isset($data['title'])) {
            return $this->fail('Maklumat isu tidak lengkap', 400);
        }

        $issueId = $issueModel->insert([
            'module_id' => $data['module_id'],
            'issue_code' => $data['issue_code'] ?? null,
            'title' => $data['title'],
            'symptoms' => $data['symptoms'] ?? ''
        ]);

        if (isset($data['solutions']) && is_array($data['solutions'])) {
            foreach ($data['solutions'] as $index => $sol) {
                $tsModel->insert([
                    'issue_id' => $issueId,
                    'step_number' => $index + 1,
                    'instruction' => $sol['instruction'] ?? '',
                    'image_path' => $sol['image_path'] ?? null
                ]);
            }
        }

        return $this->respondCreated(['id' => $issueId, 'message' => 'Isu & solution berjaya ditambah']);
    }

    public function delete($id = null) {
        $model = new IssueModel();
        if (!$model->find($id)) {
            return $this->failNotFound('Isu tidak dijumpai');
        }

        $model->delete($id);
        return $this->respondDeleted(['message' => 'Isu berjaya dipadam']);
    }
}
