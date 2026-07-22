<?php

namespace App\Controllers;

use App\Models\ItemModel;
use App\Models\UserModel;

class DashboardController extends BaseController
{
    public function index()
    {
        $itemModel = new ItemModel();
        $userModel = new UserModel();
        $db = \Config\Database::connect();

        // 1. Ambil data ringkasan widget (Kekalkan logik asal anda)
        $totalItems = $itemModel->countAll();
        $activeItems = $itemModel->where('status', 'active')->countAllResults();
        $totalUsers = $userModel->countAll();

        // Contoh kira log aktiviti hari ini
        $todayLogs = $db->table('activity_logs')
            ->where('created_at >=', date('Y-m-d') . ' 00:00:00')
            ->countAllResults();

        // Contoh log aktiviti terkini untuk jadual bawah
        $recentLogs = $db->table('activity_logs al')
            ->select('al.*, u.username')
            ->join('users u', 'u.id = al.user_id', 'left')
            ->orderBy('al.created_at', 'DESC')
            ->limit(5)
            ->get()
            ->getResultArray();

        // 🚀 2. LOGIK DATA SEBENAR STATISTIK BULANAN
        $currentYear = date('Y');

        // Query untuk mengelompokkan jumlah item mengikut bulan bagi tahun semasa
        $monthlyQuery = $db->table('items')
            ->select('MONTH(created_at) as bulan, COUNT(id) as total')
            ->where('YEAR(created_at)', $currentYear)
            ->groupBy('MONTH(created_at)')
            ->get()
            ->getResultArray();

        // Sediakan tatasusunan asas untuk 12 bulan (Jan hingga Dis) dengan nilai awal 0
        $monthsDataStructure = array_fill(1, 12, 0);

        // Masukkan data sebenar dari DB ke dalam struktur 12 bulan tadi
        foreach ($monthlyQuery as $row) {
            $bulanIndex = (int)$row['bulan'];
            $monthsDataStructure[$bulanIndex] = (int)$row['total'];
        }

        // Nama-nama bulan untuk label carta
        $monthlyLabels = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];

        // Ambil hanya nilai (values) sahaja untuk dihantar ke Chart.js [0, 5, 12, ...]
        $monthlyData = array_values($monthsDataStructure);

        // 🚀 AMBIL 5 REKOD ITEM TERKINI BESERTA NAMA PENCIPTA
        $recentItems = $db->table('items i')
            ->select('i.*, u.fullname as creator_name')
            ->join('users u', 'u.id = i.created_by', 'left')
            ->orderBy('i.updated_at', 'DESC') // Urutkan mengikut kemaskini terbaru
            ->limit(5)
            ->get()
            ->getResultArray();

        // Masukkan 'recentItems' ke dalam tatasusunan hantaran view anda
        return view('dashboard', [
            'pageTitle'   => 'Dashboard Utama',
            'totalItems'  => $totalItems,
            'activeItems' => $activeItems,
            'totalUsers'  => $totalUsers,
            'todayLogs'   => $todayLogs,
            'recentLogs'  => $recentLogs,
            'monthlyLabels' => $monthlyLabels,
            'monthlyData' => $monthlyData,
            'recentItems' => $recentItems // 🚀 TAMBAH BARIS INI
        ]);

        // 3. Hantar semua data ke paparan view
        return view('dashboard', [
            'pageTitle'     => 'Dashboard Utama',
            'totalItems'    => $totalItems,
            'activeItems'   => $activeItems,
            'totalUsers'    => $totalUsers,
            'todayLogs'     => $todayLogs,
            'recentLogs'    => $recentLogs,
            'monthlyLabels' => $monthlyLabels,
            'monthlyData'   => $monthlyData
        ]);
    }
}
