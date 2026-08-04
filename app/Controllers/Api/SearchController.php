<?php
namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use Config\Database;

class SearchController extends ResourceController {
    protected $format = 'json';

    public function index() {
        $q = trim($this->request->getGet('q') ?? '');
        if (empty($q) || strlen($q) < 2) {
            return $this->respond([
                'query' => $q,
                'modules' => [],
                'submodules' => [],
                'flows' => [],
                'issues' => [],
                'solutions' => [],
                'contacts' => [],
                'total_results' => 0
            ]);
        }

        $db = Database::connect();

        // 1. Modules
        $modules = $db->table('modules')
            ->groupStart()
                ->like('title', $q)
                ->orLike('code', $q)
                ->orLike('category', $q)
                ->orLike('description', $q)
            ->groupEnd()
            ->get()->getResultArray();

        // 2. Submodules
        $submodules = $db->table('submodules s')
            ->select('s.*, m.title as module_title, m.code as module_code')
            ->join('modules m', 'm.id = s.module_id', 'inner')
            ->groupStart()
                ->like('s.title', $q)
                ->orLike('s.description', $q)
            ->groupEnd()
            ->get()->getResultArray();

        // 3. Flows
        $flows = $db->table('module_flows f')
            ->select('f.*, m.title as module_title, m.code as module_code, s.title as submodule_title')
            ->join('modules m', 'm.id = f.module_id', 'inner')
            ->join('submodules s', 's.id = f.submodule_id', 'left')
            ->groupStart()
                ->like('f.step_title', $q)
                ->orLike('f.description', $q)
            ->groupEnd()
            ->get()->getResultArray();

        // 4. Issues
        $issues = $db->table('module_issues i')
            ->select('i.*, m.title as module_title, m.code as module_code, s.title as submodule_title')
            ->join('modules m', 'm.id = i.module_id', 'inner')
            ->join('submodules s', 's.id = i.submodule_id', 'left')
            ->groupStart()
                ->like('i.title', $q)
                ->orLike('i.issue_code', $q)
                ->orLike('i.symptoms', $q)
            ->groupEnd()
            ->get()->getResultArray();

        // 5. Troubleshooting Steps / Solutions
        $solutions = $db->table('troubleshooting_steps ts')
            ->select('ts.*, i.title as issue_title, i.issue_code, i.module_id, i.submodule_id, m.title as module_title, m.code as module_code')
            ->join('module_issues i', 'i.id = ts.issue_id', 'inner')
            ->join('modules m', 'm.id = i.module_id', 'inner')
            ->like('ts.instruction', $q)
            ->get()->getResultArray();

        // 6. Contact Persons / PIC
        $contacts = $db->table('contact_persons c')
            ->select('c.*, m.title as module_title, m.code as module_code, s.title as submodule_title')
            ->join('modules m', 'm.id = c.module_id', 'inner')
            ->join('submodules s', 's.id = c.submodule_id', 'left')
            ->groupStart()
                ->like('c.name', $q)
                ->orLike('c.role', $q)
                ->orLike('c.email', $q)
                ->orLike('c.phone_no', $q)
                ->orLike('c.department', $q)
            ->groupEnd()
            ->get()->getResultArray();

        $totalResults = count($modules) + count($submodules) + count($flows) + count($issues) + count($solutions) + count($contacts);

        return $this->respond([
            'query' => $q,
            'modules' => $modules,
            'submodules' => $submodules,
            'flows' => $flows,
            'issues' => $issues,
            'solutions' => $solutions,
            'contacts' => $contacts,
            'total_results' => $totalResults
        ]);
    }
}
