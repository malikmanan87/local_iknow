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

        if (!$data || !isset($data['module_id']) || !isset($data['title']) || trim($data['title']) === '') {
            return $this->fail('Maklumat isu tidak lengkap', 400);
        }

        $submoduleId = (!empty($data['submodule_id']) && $data['submodule_id'] !== '' && $data['submodule_id'] !== '0' && $data['submodule_id'] !== 0) ? (int)$data['submodule_id'] : null;

        $issueId = $issueModel->insert([
            'module_id' => (int)$data['module_id'],
            'submodule_id' => $submoduleId,
            'issue_code' => !empty($data['issue_code']) ? trim($data['issue_code']) : null,
            'title' => trim($data['title']),
            'symptoms' => $data['symptoms'] ?? ''
        ]);

        if (!$issueId) {
            return $this->fail('Gagal menyimpan isu ke pangkalan data', 500);
        }

        if (isset($data['solutions']) && is_array($data['solutions'])) {
            foreach ($data['solutions'] as $index => $sol) {
                if (isset($sol['instruction']) && trim($sol['instruction']) !== '') {
                    $tsModel->insert([
                        'issue_id' => $issueId,
                        'step_number' => $index + 1,
                        'instruction' => trim($sol['instruction']),
                        'image_path' => !empty($sol['image_path']) ? $sol['image_path'] : null
                    ]);
                }
            }
        }

        return $this->respondCreated(['id' => $issueId, 'message' => 'Isu & solution berjaya ditambah']);
    }

    public function update($id = null) {
        $issueModel = new IssueModel();
        $tsModel = new TroubleshootingModel();
        $data = $this->request->getJSON(true);

        if (!$issueModel->find($id)) return $this->failNotFound('Isu tidak dijumpai');

        $submoduleId = (!empty($data['submodule_id']) && $data['submodule_id'] !== '' && $data['submodule_id'] !== '0' && $data['submodule_id'] !== 0) ? (int)$data['submodule_id'] : null;

        $issueModel->update($id, [
            'submodule_id' => $submoduleId,
            'issue_code' => !empty($data['issue_code']) ? trim($data['issue_code']) : null,
            'title' => trim($data['title']),
            'symptoms' => $data['symptoms'] ?? ''
        ]);

        if (isset($data['solutions']) && is_array($data['solutions'])) {
            $tsModel->where('issue_id', $id)->delete();
            foreach ($data['solutions'] as $index => $sol) {
                if (isset($sol['instruction']) && trim($sol['instruction']) !== '') {
                    $tsModel->insert([
                        'issue_id' => $id,
                        'step_number' => $index + 1,
                        'instruction' => trim($sol['instruction']),
                        'image_path' => !empty($sol['image_path']) ? $sol['image_path'] : null
                    ]);
                }
            }
        }

        return $this->respond(['message' => 'Isu berjaya dikemaskini']);
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
