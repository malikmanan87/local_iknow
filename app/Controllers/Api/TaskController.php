<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\TaskModel;

class TaskController extends ResourceController
{
    protected $format = 'json';

    protected function getModelInstance()
    {
        $model = new TaskModel();
        $model->ensureTableExists();
        return $model;
    }

    /**
     * Dapatkan senarai tugasan dengan statistik ringkasan dan tapisan
     */
    public function index()
    {
        $model = $this->getModelInstance();
        $db = \Config\Database::connect();
        $now = date('Y-m-d H:i:s');

        // Ringkasan Statistik
        $summary = [
            'total'       => (int) $db->table('tasks')->countAllResults(),
            'pending'     => (int) $db->table('tasks')->where('status', 'pending')->countAllResults(),
            'in_progress' => (int) $db->table('tasks')->where('status', 'in_progress')->countAllResults(),
            'completed'   => (int) $db->table('tasks')->where('status', 'completed')->countAllResults(),
            'overdue'     => (int) $db->table('tasks')
                                ->whereNotIn('status', ['completed', 'cancelled'])
                                ->where('due_date IS NOT NULL', null, false)
                                ->where('due_date <', $now)
                                ->countAllResults(),
        ];

        $builder = $db->table('tasks');

        // Carian tajuk tugasan
        $search = trim($this->request->getGet('search') ?? '');
        if ($search !== '') {
            $builder->like('title', $search);
        }

        // Tapisan Status
        $status = $this->request->getGet('status');
        if (!empty($status) && $status !== 'all') {
            $builder->where('status', $status);
        }

        // Tapisan Prioriti
        $priority = $this->request->getGet('priority');
        if (!empty($priority) && $priority !== 'all') {
            $builder->where('priority', $priority);
        }

        // Susunan: Tugasan belum siap dahulu, disusuli tarikh sasaran terdekat
        $builder->orderBy("CASE WHEN status = 'completed' THEN 2 ELSE 1 END", 'ASC', false);
        $builder->orderBy("CASE WHEN due_date IS NULL THEN 1 ELSE 0 END", 'ASC', false);
        $builder->orderBy('due_date', 'ASC');
        $builder->orderBy('id', 'DESC');

        $tasks = $builder->get()->getResultArray();

        // Tambah petunjuk is_overdue
        foreach ($tasks as &$task) {
            $task['is_overdue'] = false;
            if (!empty($task['due_date']) && !in_array($task['status'], ['completed', 'cancelled'])) {
                if ($task['due_date'] < $now) {
                    $task['is_overdue'] = true;
                }
            }
        }

        return $this->respond([
            'status'  => 'success',
            'summary' => $summary,
            'data'    => $tasks
        ]);
    }

    /**
     * Dapatkan perincian satu tugasan
     */
    public function show($id = null)
    {
        $model = $this->getModelInstance();
        $task = $model->find($id);

        if (!$task) {
            return $this->failNotFound("Tugasan #{$id} tidak dijumpai.");
        }

        return $this->respond([
            'status' => 'success',
            'data'   => $task
        ]);
    }

    /**
     * Tambah tugasan baharu (hanya tajuk, prioriti, tarikh sasaran, status tugas)
     */
    public function create()
    {
        $model = $this->getModelInstance();
        $data = $this->request->getJSON(true) ?? $this->request->getPost();

        if (empty($data['title'])) {
            return $this->failValidationErrors('Tajuk tugasan diperlukan.');
        }

        $insertData = [
            'title'      => trim($data['title']),
            'priority'   => (!empty($data['priority']) && strtolower($data['priority']) === 'urgent') ? 'urgent' : 'normal',
            'status'     => !empty($data['status']) ? $data['status'] : 'pending',
            'due_date'   => !empty($data['due_date']) ? date('Y-m-d H:i:s', strtotime($data['due_date'])) : null,
        ];

        $newId = $model->insert($insertData);
        if (!$newId) {
            return $this->failServerError('Gagal menyimpan tugasan baharu.');
        }

        // Hantar notifikasi emel automatik jika diminta
        $sentEmail = false;
        if (!empty($data['notify_email'])) {
            $this->dispatchEmailNotification($newId);
            $sentEmail = true;
        }

        $createdTask = $model->find($newId);

        return $this->respondCreated([
            'status'     => 'success',
            'message'    => 'Tugasan berjaya ditambah.' . ($sentEmail ? ' Notifikasi dihantar ke malikmanan@unisza.edu.my' : ''),
            'email_sent' => $sentEmail,
            'data'       => $createdTask
        ]);
    }

    /**
     * Kemaskini maklumat tugasan
     */
    public function update($id = null)
    {
        $model = $this->getModelInstance();
        $task = $model->find($id);

        if (!$task) {
            return $this->failNotFound("Tugasan #{$id} tidak dijumpai.");
        }

        $data = $this->request->getJSON(true) ?? $this->request->getRawInput();

        $updateData = [];
        if (isset($data['title'])) {
            $updateData['title'] = trim($data['title']);
        }
        if (isset($data['priority'])) {
            $updateData['priority'] = (strtolower($data['priority']) === 'urgent') ? 'urgent' : 'normal';
        }
        if (isset($data['status'])) {
            $updateData['status'] = $data['status'];
        }
        if (array_key_exists('due_date', $data)) {
            $updateData['due_date'] = !empty($data['due_date']) ? date('Y-m-d H:i:s', strtotime($data['due_date'])) : null;
        }

        if (!empty($updateData)) {
            $model->update($id, $updateData);
        }

        // Hantar notifikasi emel automatik sekiranya diminta semasa kemaskini
        $sentEmail = false;
        if (!empty($data['notify_email'])) {
            $this->dispatchEmailNotification($id);
            $sentEmail = true;
        }

        return $this->respond([
            'status'     => 'success',
            'message'    => 'Tugasan berjaya dikemaskini.' . ($sentEmail ? ' Notifikasi dihantar ke malikmanan@unisza.edu.my' : ''),
            'email_sent' => $sentEmail,
            'data'       => $model->find($id)
        ]);
    }

    /**
     * Padam tugasan
     */
    public function delete($id = null)
    {
        $model = $this->getModelInstance();
        $task = $model->find($id);

        if (!$task) {
            return $this->failNotFound("Tugasan #{$id} tidak dijumpai.");
        }

        $model->delete($id);

        return $this->respondDeleted([
            'status'  => 'success',
            'message' => 'Tugasan berjaya dipadam.'
        ]);
    }

    /**
     * Tukar status tugasan (selesai <-> belum selesai)
     */
    public function toggleStatus($id = null)
    {
        $model = $this->getModelInstance();
        $task = $model->find($id);

        if (!$task) {
            return $this->failNotFound("Tugasan #{$id} tidak dijumpai.");
        }

        $data = $this->request->getJSON(true) ?? $this->request->getPost();
        $newStatus = !empty($data['status']) ? $data['status'] : (($task['status'] === 'completed') ? 'pending' : 'completed');

        $model->update($id, ['status' => $newStatus]);

        return $this->respond([
            'status'  => 'success',
            'message' => "Status tugasan dikemaskini kepada {$newStatus}.",
            'data'    => $model->find($id)
        ]);
    }

    /**
     * Hantar notifikasi emel tunggal tugasan ke malikmanan@unisza.edu.my
     */
    public function sendNotification($id = null)
    {
        $result = $this->dispatchEmailNotification($id);

        if (!$result['success']) {
            return $this->fail([
                'status'  => 'error',
                'message' => $result['message']
            ]);
        }

        return $this->respond([
            'status'  => 'success',
            'message' => $result['message'],
            'data'    => $result['data']
        ]);
    }

    /**
     * Semakan Automatik Latar Belakang bagi tugasan 2 hari sebelum tarikh sasaran (due date).
     * Waktu amaran rasmi: 8:00 AM setiap hari.
     * Sekiranya terlepas (isu masalah internet, komputer/pelayan ditutup dsb.), sistem akan
     * segera menghantar notifikasi sebaik sahaja sistem dikesan aktif pada hari berkenaan.
     */
    public function checkDueAlerts()
    {
        $model = $this->getModelInstance();
        $db = \Config\Database::connect();
        $now = time();
        $today8am = strtotime(date('Y-m-d 08:00:00', $now));

        // Jika belum jam 8:00 AM hari ini, kitaran amaran hari ini belum bermula
        if ($now < $today8am) {
            return $this->respond([
                'status'   => 'skipped',
                'message'  => 'Kitaran amaran harian 8:00 AM belum bermula untuk hari ini.',
                'now'      => date('Y-m-d H:i:s', $now),
                'next_due' => date('Y-m-d 08:00:00', $now)
            ]);
        }

        $todayDate = date('Y-m-d', $now);
        $twoDaysAhead = date('Y-m-d 23:59:59', strtotime('+2 days', $now));

        // Cari tugasan aktif yang:
        // 1. Belum selesai (status != completed dan status != cancelled)
        // 2. Mempunyai tarikh sasaran yang due dalam tempoh 2 hari atau telah overdue
        // 3. Belum menerima amaran pada hari ini (DATE(last_notified_at) != todayDate)
        $builder = $db->table('tasks');
        $builder->whereNotIn('status', ['completed', 'cancelled'])
                ->where('due_date IS NOT NULL', null, false)
                ->where('due_date <=', $twoDaysAhead)
                ->groupStart()
                    ->where('last_notified_at IS NULL', null, false)
                    ->orWhere("DATE(last_notified_at) !=", $todayDate)
                ->groupEnd()
                ->orderBy('due_date', 'ASC')
                ->orderBy('priority', 'DESC');

        $dueTasks = $builder->get()->getResultArray();

        if (empty($dueTasks)) {
            return $this->respond([
                'status'  => 'success',
                'message' => 'Tiada tugasan memerlukan amaran atau notifikasi hari ini telah selesai dihantar.',
                'count'   => 0
            ]);
        }

        // Asingkan tugasan mengikut Priority: Urgent (Template Merah) vs Normal (Template Yellow)
        $urgentTasks = [];
        $normalTasks = [];
        foreach ($dueTasks as $task) {
            $p = strtolower($task['priority'] ?? 'normal');
            if ($p === 'urgent') {
                $urgentTasks[] = $task;
            } else {
                $normalTasks[] = $task;
            }
        }

        $allSuccess = true;
        $notifiedIds = [];
        $errors = [];

        // 1. Amaran Tugasan Urgent (Template Emel Merah)
        if (!empty($urgentTasks)) {
            $urgentResult = $this->dispatchConsolidatedDueAlert($urgentTasks, 'urgent');
            if ($urgentResult['success']) {
                $notifiedIds = array_merge($notifiedIds, array_column($urgentTasks, 'id'));
            } else {
                $allSuccess = false;
                $errors[] = 'Urgent: ' . $urgentResult['message'];
            }
        }

        // 2. Peringatan Tugasan Normal (Template Emel Yellow)
        if (!empty($normalTasks)) {
            $normalResult = $this->dispatchConsolidatedDueAlert($normalTasks, 'normal');
            if ($normalResult['success']) {
                $notifiedIds = array_merge($notifiedIds, array_column($normalTasks, 'id'));
            } else {
                $allSuccess = false;
                $errors[] = 'Normal: ' . $normalResult['message'];
            }
        }

        if (!empty($notifiedIds)) {
            $db->table('tasks')
               ->whereIn('id', $notifiedIds)
               ->update(['last_notified_at' => date('Y-m-d H:i:s')]);
        }

        if ($allSuccess) {
            return $this->respond([
                'status'         => 'success',
                'message'        => "Notifikasi amaran (Kitaran 8:00 AM) berjaya dihantar ke malikmanan@unisza.edu.my.",
                'tasks_count'    => count($dueTasks),
                'urgent_count'   => count($urgentTasks),
                'normal_count'   => count($normalTasks),
                'notified_tasks' => $notifiedIds
            ]);
        }

        return $this->fail([
            'status'         => 'error',
            'message'        => 'Gagal menghantar sebahagian atau semua emel: ' . implode(' | ', $errors),
            'notified_tasks' => $notifiedIds
        ]);
    }

    /**
     * Helper dalaman untuk menghantar ringkasan amaran berbilang tugasan (Kitaran 8:00 AM / Terlepas)
     * 2 Template Emel Berdasarkan Priority:
     * - Template Yellow untuk priority 'normal'
     * - Template Merah untuk priority 'urgent'
     * Jadual hanya memaparkan Tajuk Tugas, Priority, dan Tarikh Sasaran sahaja.
     */
    protected function dispatchConsolidatedDueAlert(array $dueTasks, ?string $priorityCategory = null)
    {
        $targetEmail = 'malikmanan@unisza.edu.my';
        $total = count($dueTasks);
        $now = time();
        $nowFormatted = date('d M Y, h:i A');

        if ($priorityCategory === null) {
            $hasUrgent = false;
            foreach ($dueTasks as $t) {
                if (strtolower($t['priority'] ?? '') === 'urgent') {
                    $hasUrgent = true;
                    break;
                }
            }
            $priorityCategory = $hasUrgent ? 'urgent' : 'normal';
        }

        $isUrgentGroup = ($priorityCategory === 'urgent');

        $rowsHtml = '';
        foreach ($dueTasks as $task) {
            $p = strtolower($task['priority'] ?? 'normal');
            $taskIsUrgent = ($p === 'urgent');

            $prioLabel = $taskIsUrgent ? 'Urgent' : 'Normal';
            $prioColor = $taskIsUrgent ? '#ef4444' : '#d97706';

            $dueTime = !empty($task['due_date']) ? strtotime($task['due_date']) : null;
            $isOverdue = ($dueTime && ($dueTime < $now));
            $dueFormatted = $dueTime
                ? date('d M Y, h:i A', $dueTime) . ($isOverdue ? " <span style='color: #ef4444; font-weight: bold;'>(OVERDUE)</span>" : "")
                : 'Tiada Tarikh';
            $rowBg = $isOverdue ? "background: rgba(239, 68, 68, 0.08);" : "background: transparent;";

            $rowsHtml .= "
            <tr style='border-bottom: 1px solid #334155; {$rowBg}'>
              <td style='padding: 10px 14px; font-weight: bold; color: #ffffff;'>" . htmlspecialchars($task['title']) . "</td>
              <td style='padding: 10px 14px;'>
                <span style='background: {$prioColor}; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 0.78rem;'>
                  {$prioLabel}
                </span>
              </td>
              <td style='padding: 10px 14px; color: " . ($isOverdue ? '#f87171' : '#cbd5e1') . "; font-size: 0.85rem; font-weight: " . ($isOverdue ? 'bold' : 'normal') . ";'>{$dueFormatted}</td>
            </tr>
            ";
        }

        // Header Emel Yellow untuk Normal, Header Emel Merah untuk Urgent
        if ($isUrgentGroup) {
            $headerBg = "linear-gradient(135deg, #b91c1c, #dc2626)"; // Template Merah
            $headerTitle = "AMARAN TUGASAN URGENT";
            $emailSubject = "🚨 [URGENT] iKNOW: {$total} Tugasan Perlu Tindakan Segera [Kitaran 8:00 AM]";
        } else {
            $headerBg = "linear-gradient(135deg, #d97706, #f59e0b)"; // Template Yellow
            $headerTitle = "Peringatan Tugasan Normal (Kitaran 8:00 AM)";
            $emailSubject = "🔔 Peringatan Tugasan iKNOW: {$total} Tugasan Normal [Kitaran 8:00 AM]";
        }

        $htmlMessage = "
        <div style='font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);'>
          <div style='background: {$headerBg}; padding: 18px 24px; text-align: left;'>
            <h2 style='margin: 0; color: #ffffff; font-size: 1.25rem; display: flex; align-items: center; gap: 8px; text-shadow: 0 1px 2px rgba(0,0,0,0.3);'>
              {$headerTitle}
            </h2>
            <div style='color: rgba(255,255,255,0.92); font-size: 0.85rem; margin-top: 4px; font-weight: 500;'>
              HoSZA &bull; Sistem iKNOW
            </div>
          </div>

          <div style='padding: 24px;'>
            <table style='width: 100%; border-collapse: collapse; font-size: 0.88rem; margin-bottom: 24px; text-align: left;'>
              <thead>
                <tr style='background: #1e293b; color: #94a3b8; border-bottom: 2px solid #334155; font-size: 0.78rem; text-transform: uppercase;'>
                  <th style='padding: 10px 14px;'>Tajuk Tugas</th>
                  <th style='padding: 10px 14px; width: 100px;'>Priority</th>
                  <th style='padding: 10px 14px; width: 160px;'>Tarikh Sasaran</th>
                </tr>
              </thead>
              <tbody>
                {$rowsHtml}
              </tbody>
            </table>

            <div style='border-top: 1px solid #334155; padding-top: 14px; font-size: 0.8rem; color: #94a3b8;'>
              Emel peringatan ini dihantar ke: <strong>{$targetEmail}</strong> pada {$nowFormatted}.<br>
              Sila layari portal <strong>iKNOW Knowledge Hub</strong> untuk mengemaskini atau menanda tugasan yang telah selesai.
            </div>
          </div>
        </div>
        ";

        try {
            $email = \Config\Services::email();
            $emailConfig = config('Email');

            $email->setFrom($emailConfig->fromEmail ?: 'malikmanan@unisza.edu.my', $emailConfig->fromName ?: 'iKNOW Knowledge Hub');
            $email->setTo($targetEmail);
            $email->setSubject($emailSubject);
            $email->setMessage($htmlMessage);
            $email->setMailType('html');

            $sent = $email->send(false);
            if (!$sent) {
                $dbg = strip_tags($email->printDebugger(['headers']));
                log_message('error', "Gagal hantar notifikasi kelompok 8:00 AM: {$dbg}");
                return [
                    'success' => false,
                    'message' => 'Gagal menghantar emel: ' . ($dbg ?: 'Ralat SMTP.')
                ];
            }

            return [
                'success' => true,
                'message' => "Emel amaran kelompok berjaya dihantar ke {$targetEmail}."
            ];
        } catch (\Throwable $e) {
            log_message('error', 'Pengecualian kelompok emel tugasan: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Ralat penghantaran emel: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Helper dalaman untuk membina dan menghantar notifikasi emel tunggal
     * 2 Template Emel Berdasarkan Priority:
     * - Template Yellow untuk priority 'normal'
     * - Template Merah untuk priority 'urgent'
     * Jadual hanya memaparkan Tajuk Tugas, Priority, dan Tarikh Sasaran sahaja.
     */
    protected function dispatchEmailNotification($id)
    {
        $model = $this->getModelInstance();
        $task = $model->find($id);

        if (!$task) {
            return ['success' => false, 'message' => 'Tugasan tidak dijumpai.'];
        }

        $targetEmail = 'malikmanan@unisza.edu.my';
        $priority = strtolower($task['priority'] ?? 'normal');
        $isUrgent = ($priority === 'urgent');

        $dueTime = !empty($task['due_date']) ? strtotime($task['due_date']) : null;
        $now = time();
        $isOverdue = ($dueTime && ($dueTime < $now));

        // 2 Template Emel:
        // 1. Template Merah untuk Urgent
        // 2. Template Yellow untuk Normal
        if ($isUrgent) {
            $priorityLabel = 'Urgent';
            $priorityColor = '#ef4444';
            $headerBg = 'linear-gradient(135deg, #b91c1c, #dc2626)'; // Merah
            $headerTitle = 'AMARAN TUGASAN URGENT';
            $emailSubject = "🚨 [URGENT] Tugasan: {$task['title']}";
        } else {
            $priorityLabel = 'Normal';
            $priorityColor = '#d97706';
            $headerBg = 'linear-gradient(135deg, #d97706, #f59e0b)'; // Yellow
            $headerTitle = 'Peringatan Tugasan iKNOW';
            $emailSubject = "🔔 Peringatan Tugasan: {$task['title']} [Normal]";
        }

        $dueFormatted = !empty($task['due_date'])
            ? date('d M Y, h:i A', strtotime($task['due_date'])) . ($isOverdue ? " <span style='color: #ef4444; font-weight: bold;'>(OVERDUE)</span>" : "")
            : 'Tiada Tarikh Ditetapkan';

        $htmlMessage = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);'>
          <div style='background: {$headerBg}; padding: 18px 24px; text-align: left;'>
            <h2 style='margin: 0; color: #ffffff; font-size: 1.25rem; display: flex; align-items: center; gap: 8px; text-shadow: 0 1px 2px rgba(0,0,0,0.3);'>
              {$headerTitle}
            </h2>
            <div style='color: rgba(255,255,255,0.92); font-size: 0.85rem; margin-top: 4px; font-weight: 500;'>
              HoSZA &bull; Sistem iKNOW
            </div>
          </div>
          
          <div style='padding: 24px;'>
            <table style='width: 100%; border-collapse: collapse; font-size: 0.88rem; margin-bottom: 24px; text-align: left;'>
              <thead>
                <tr style='background: #1e293b; color: #94a3b8; border-bottom: 2px solid #334155; font-size: 0.78rem; text-transform: uppercase;'>
                  <th style='padding: 10px 14px;'>Tajuk Tugas</th>
                  <th style='padding: 10px 14px; width: 100px;'>Priority</th>
                  <th style='padding: 10px 14px; width: 160px;'>Tarikh Sasaran</th>
                </tr>
              </thead>
              <tbody>
                <tr style='border-bottom: 1px solid #334155;'>
                  <td style='padding: 12px 14px; font-weight: bold; color: #ffffff;'>" . htmlspecialchars($task['title']) . "</td>
                  <td style='padding: 12px 14px;'>
                    <span style='background: {$priorityColor}; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 0.78rem;'>
                      {$priorityLabel}
                    </span>
                  </td>
                  <td style='padding: 12px 14px; color: " . ($isOverdue ? '#f87171' : '#cbd5e1') . "; font-size: 0.88rem; font-weight: " . ($isOverdue ? 'bold' : 'normal') . ";'>{$dueFormatted}</td>
                </tr>
              </tbody>
            </table>

            <div style='font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #334155; padding-top: 14px;'>
              Emel peringatan ini dijana secara automatik oleh modul TASKS sistem iKNOW.<br>
              Dihantar kepada: <strong>{$targetEmail}</strong> pada " . date('d M Y, h:i A') . ".
            </div>
          </div>
        </div>
        ";

        try {
            $email = \Config\Services::email();
            $emailConfig = config('Email');

            $email->setFrom($emailConfig->fromEmail ?: 'malikmanan@unisza.edu.my', $emailConfig->fromName ?: 'iKNOW Knowledge Hub');
            $email->setTo($targetEmail);
            $email->setSubject($emailSubject);
            $email->setMessage($htmlMessage);
            $email->setMailType('html');

            $sent = $email->send(false);
            if (!$sent) {
                $dbg = strip_tags($email->printDebugger(['headers']));
                log_message('error', "Gagal hantar notifikasi emel tugasan: {$dbg}");
                return [
                    'success' => false,
                    'message' => 'Gagal menghantar emel: ' . ($dbg ?: 'Sila semak konfigurasi SMTP.')
                ];
            }

            $model->update($id, ['last_notified_at' => date('Y-m-d H:i:s')]);

            return [
                'success' => true,
                'message' => "Notifikasi emel berjaya dihantar ke {$targetEmail}.",
                'data'    => $model->find($id)
            ];
        } catch (\Throwable $e) {
            log_message('error', 'Pengecualian emel tugasan: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Ralat penghantaran emel: ' . $e->getMessage()
            ];
        }
    }
}
