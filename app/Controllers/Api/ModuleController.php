<?php
namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\ModuleModel;
use App\Models\FlowModel;
use App\Models\IssueModel;
use App\Models\TroubleshootingModel;
use App\Models\ContactModel;
use App\Models\SubmoduleModel;

class ModuleController extends ResourceController {
    protected $format = 'json';

    public function index() {
        $model = new ModuleModel();
        $modules = $model->orderBy('created_at', 'DESC')->findAll();
        return $this->respond($modules);
    }

    public function show($id = null) {
        $moduleModel = new ModuleModel();
        $module = $moduleModel->find($id);

        if (!$module) {
            return $this->failNotFound('Modul tidak dijumpai');
        }

        $flowModel = new FlowModel();
        $issueModel = new IssueModel();
        $tsModel = new TroubleshootingModel();
        $contactModel = new ContactModel();

        $submoduleModel = new SubmoduleModel();
        $submodules = $submoduleModel->where('module_id', $id)->orderBy('created_at', 'ASC')->findAll();
        $flows = $flowModel->where('module_id', $id)->orderBy('step_number', 'ASC')->findAll();
        $issues = $issueModel->where('module_id', $id)->orderBy('created_at', 'DESC')->findAll();

        foreach ($issues as &$issue) {
            $issue['solutions'] = $tsModel->where('issue_id', $issue['id'])->orderBy('step_number', 'ASC')->findAll();
        }

        $contacts = $contactModel->where('module_id', $id)->findAll();

        return $this->respond([
            'module' => $module,
            'flows' => $flows,
            'issues' => $issues,
            'submodules' => $submodules,
            'contacts' => $contacts
        ]);
    }

    public function create() {
        $model = new ModuleModel();
        $data = $this->request->getJSON(true);

        if (!$data || !isset($data['title']) || trim($data['title']) === '') {
            return $this->fail('Tajuk modul diperlukan', 400);
        }

        $id = $model->insert([
            'code' => isset($data['code']) && trim($data['code']) !== '' ? strtoupper(trim($data['code'])) : 'MOD-' . time(),
            'title' => trim($data['title']),
            'category' => $data['category'] ?? 'General',
            'description' => $data['description'] ?? '',
            'status' => $data['status'] ?? 'Active'
        ]);

        if ($id) {
            return $this->respondCreated(['id' => $id, 'message' => 'Modul berjaya dicipta']);
        }
        return $this->fail('Gagal mencipta modul', 500);
    }

    public function update($id = null) {
        $model = new ModuleModel();
        $data = $this->request->getJSON(true);

        if (!$model->find($id)) {
            return $this->failNotFound('Modul tidak dijumpai');
        }

        $model->update($id, $data);
        return $this->respond(['message' => 'Modul berjaya dikemaskini']);
    }

    public function delete($id = null) {
        $model = new ModuleModel();
        if (!$model->find($id)) {
            return $this->failNotFound('Modul tidak dijumpai');
        }

        $model->delete($id);
        return $this->respondDeleted(['message' => 'Modul berjaya dipadam']);
    }
}
