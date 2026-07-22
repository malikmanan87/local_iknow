<?php

namespace App\Controllers;

use App\Models\ItemModel;

class ReportsController extends BaseController
{
    protected ItemModel $itemModel;

    public function __construct()
    {
        $this->itemModel = new ItemModel();
        helper(['form', 'url']);
    }

    // GET /reports
    public function index()
    {
        return view('reports/index', [
            'pageTitle'  => 'System Reports',
            'breadcrumb' => ['Reports'],
            'categories' => $this->itemModel->getUniqueCategories(),
            'reportData' => null,
            'filters'    => []
        ]);
    }

    // POST /reports/generate
    public function generate()
    {
        $startDate = $this->request->getPost('start_date');
        $endDate   = $this->request->getPost('end_date');
        $category  = $this->request->getPost('category');
        $status    = $this->request->getPost('status');

        $reportData = $this->itemModel->generateReport($startDate, $endDate, $category, $status);

        $summary = [
            'total'    => count($reportData),
            'active'   => count(array_filter($reportData, fn($i) => $i['status'] === 'active')),
            'pending'  => count(array_filter($reportData, fn($i) => $i['status'] === 'pending')),
            'inactive' => count(array_filter($reportData, fn($i) => $i['status'] === 'inactive')),
        ];

        return view('reports/index', [
            'pageTitle'  => 'System Reports',
            'breadcrumb' => ['Reports'],
            'categories' => $this->itemModel->getUniqueCategories(),
            'reportData' => $reportData,
            'summary'    => $summary,
            'filters'    => [
                'start_date' => $startDate,
                'end_date'   => $endDate,
                'category'   => $category,
                'status'     => $status,
            ]
        ]);
    }
}