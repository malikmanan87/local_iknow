<?php

namespace App\Controllers;

use App\Models\ActivityLogModel;

class ActivityLogsController extends BaseController
{
    protected $logModel;

    public function __construct()
    {
        $this->logModel = new ActivityLogModel();
    }

    // ----------------------------------------------------------------
    // GET /activity-logs (Admin Sahaja)
    // ----------------------------------------------------------------
    public function index()
    {
        // Mengambil semua log aktiviti, susun yang terbaru di atas
        $logs = $this->logModel->orderBy('created_at', 'DESC')->findAll();

        return view('activity_logs/index', [
            'pageTitle'  => 'Log Aktiviti',
            'breadcrumb' => ['Log Aktiviti'],
            'logs'       => $logs
        ]);
    }
}
