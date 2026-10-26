<?php
namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\ReminderModel;
use Config\Database;
use Config\Services;

class ReminderController extends ResourceController
{
    protected $format = 'json';

    protected function getModelInstance()
    {
        $model = new ReminderModel();
        $model->ensureTableExists();
        return $model;
    }

    /**
     * Senarai semua peringatan dengan penapis & ringkasan statistik
     */
    public function index()
    {
        $model = $this->getModelInstance();
        $db = Database::connect();

        $search = trim($this->request->getGet('search') ?? '');
        $category = trim($this->request->getGet('category') ?? '');
        $priority = trim($this->request->getGet('priority') ?? '');
        $status = trim($this->request->getGet('status') ?? '');
        $timeBucket = trim($this->request->getGet('time_bucket') ?? 'all');

        $now = date('Y-m-d H:i:s');
        $endOfTomorrow = date('Y-m-d 23:59:59', strtotime('+1 day'));
        $endOfWeek = date('Y-m-d 23:59:59', strtotime('+7 days'));

        // Dapatkan ringkasan statistik (KPI Counts)
        $summary = [
            'total'       => (int) $db->table('reminders')->countAllResults(),
            'overdue'     => (int) $db->table('reminders')->where('status !=', 'completed')->where('due_date <', $now)->countAllResults(),
            'due_today'   => (int) $db->table('reminders')->where('status !=', 'completed')->where('due_date >=', $now)->where('due_date <=', $endOfTomorrow)->countAllResults(),
            'upcoming_7d' => (int) $db->table('reminders')->where('status !=', 'completed')->where('due_date >=', $now)->where('due_date <=', $endOfWeek)->countAllResults(),
            'completed'   => (int) $db->table('reminders')->where('status', 'completed')->countAllResults(),
        ];

        $builder = $db->table('reminders');

        // Susunan: Tugasan belum siap mengikut tarikh matang paling dekat
        $builder->orderBy("CASE WHEN status = 'completed' THEN 1 ELSE 0 END", 'ASC')
                ->orderBy('due_date', 'ASC');

        // Penapis Time Bucket
        if ($timeBucket === 'overdue') {
            $builder->where('status !=', 'completed')->where('due_date <', $now);
        } elseif ($timeBucket === 'due_today') {
            $builder->where('status !=', 'completed')->where('due_date >=', $now)->where('due_date <=', $endOfTomorrow);
        } elseif ($timeBucket === 'upcoming_7d') {
            $builder->where('status !=', 'completed')->where('due_date >=', $now)->where('due_date <=', $endOfWeek);
        } elseif ($timeBucket === 'completed') {
            $builder->where('status', 'completed');
        }

        // Penapis Kategori
        if (!empty($category) && $category !== 'all' && $category !== 'Semua') {
            $builder->where('category', $category);
        }

        // Penapis Keutamaan
        if (!empty($priority) && $priority !== 'all' && $priority !== 'Semua') {
            $builder->where('priority', $priority);
        }

        // Penapis Status
        if (!empty($status) && $status !== 'all' && $status !== 'Semua') {
            $builder->where('status', $status);
        }

        // Penapis Carian Teks
        if (!empty($search)) {
            $builder->groupStart()
                ->like('title', $search)
                ->orLike('description', $search)
                ->orLike('assigned_to', $search)
                ->orLike('assigned_email', $search)
                ->orLike('category', $search)
                ->groupEnd();
        }

        $reminders = $builder->get()->getResultArray();

        // Tambah medan pengiraan masa dinamik
        foreach ($reminders as &$item) {
            $dueTime = strtotime($item['due_date']);
            $diff = $dueTime - time();

            if ($item['status'] === 'completed') {
                $item['time_badge'] = 'Selesai';
                $item['time_badge_type'] = 'completed';
            } elseif ($diff < 0) {
                $daysOver = abs(ceil($diff / 86400));
                $item['time_badge'] = "Terlewat " . ($daysOver == 0 ? "Hari Ini" : "{$daysOver} Hari");
                $item['time_badge_type'] = 'overdue';
            } elseif ($diff <= 86400) {
                $hours = floor($diff / 3600);
                $mins = floor(($diff % 3600) / 60);
                $item['time_badge'] = $hours > 0 ? "Baki {$hours}j {$mins}m" : "Baki {$mins} Minit";
                $item['time_badge_type'] = 'urgent';
            } elseif ($diff <= 172800) {
                $item['time_badge'] = "Esok";
                $item['time_badge_type'] = 'due_soon';
            } else {
                $days = ceil($diff / 86400);
                $item['time_badge'] = "Baki {$days} Hari";
                $item['time_badge_type'] = 'upcoming';
            }
        }

        return $this->respond([
            'status'  => 'success',
            'summary' => $summary,
            'data'    => $reminders
        ]);
    }

    /**
     * Dapatkan satu rekod peringatan
     */
    public function show($id = null)
    {
        $model = $this->getModelInstance();
        $reminder = $model->find($id);

        if (!$reminder) {
            return $this->failNotFound('Peringatan tidak dijumpai.');
        }

        return $this->respond(['status' => 'success', 'data' => $reminder]);
    }

    /**
     * Cipta rekod peringatan baharu
     */
    public function create()
    {
        $model = $this->getModelInstance();
        try {
            $data = $this->request->getJSON(true);
        } catch (\Throwable $th) {
            $data = $this->request->getPost();
        }

        if (empty($data['title'])) {
            return $this->failValidationErrors('Tajuk peringatan wajib diisi.');
        }
        if (empty($data['due_date'])) {
            return $this->failValidationErrors('Tarikh & masa matang wajib diisi.');
        }

        $insertData = [
            'title'                   => trim($data['title']),
            'description'             => trim($data['description'] ?? ''),
            'category'                => $data['category'] ?? 'general',
            'priority'                => $data['priority'] ?? 'medium',
            'status'                  => 'pending',
            'due_date'                => date('Y-m-d H:i:s', strtotime($data['due_date'])),
            'reminder_before_days'    => (int) ($data['reminder_before_days'] ?? 3),
            'assigned_to'             => trim($data['assigned_to'] ?? ''),
            'assigned_email'          => trim($data['assigned_email'] ?? ''),
            'send_email_notification' => !empty($data['send_email_notification']) ? 1 : 0,
            'is_recurring'            => !empty($data['is_recurring']) ? 1 : 0,
            'recurrence_cycle'        => !empty($data['is_recurring']) ? ($data['recurrence_cycle'] ?? 'monthly') : null,
            'related_module_id'       => !empty($data['related_module_id']) ? (int) $data['related_module_id'] : null,
            'created_by'              => trim($data['created_by'] ?? 'Admin')
        ];

        $newId = $model->insert($insertData);
        if (!$newId) {
            return $this->fail('Gagal menyimpan rekod peringatan.');
        }

        $created = $model->find($newId);
        return $this->respondCreated(['status' => 'success', 'message' => 'Peringatan berjaya dicipta.', 'data' => $created]);
    }

    /**
     * Kemaskini rekod peringatan
     */
    public function update($id = null)
    {
        $model = $this->getModelInstance();
        $reminder = $model->find($id);

        if (!$reminder) {
            return $this->failNotFound('Peringatan tidak dijumpai.');
        }

        try {
            $data = $this->request->getJSON(true);
        } catch (\Throwable $th) {
            $data = $this->request->getRawInput();
        }

        $updateData = [];
        $fields = [
            'title', 'description', 'category', 'priority', 'status', 
            'reminder_before_days', 'assigned_to', 'assigned_email', 
            'send_email_notification', 'is_recurring', 'recurrence_cycle', 
            'related_module_id'
        ];

        foreach ($fields as $f) {
            if (isset($data[$f])) {
                $updateData[$f] = $data[$f];
            }
        }

        if (!empty($data['due_date'])) {
            $updateData['due_date'] = date('Y-m-d H:i:s', strtotime($data['due_date']));
        }

        $model->update($id, $updateData);
        return $this->respond(['status' => 'success', 'message' => 'Peringatan berjaya dikemaskini.', 'data' => $model->find($id)]);
    }

    /**
     * Padam rekod peringatan
     */
    public function delete($id = null)
    {
        $model = $this->getModelInstance();
        $reminder = $model->find($id);

        if (!$reminder) {
            return $this->failNotFound('Peringatan tidak dijumpai.');
        }

        $model->delete($id);
        return $this->respondDeleted(['status' => 'success', 'message' => 'Peringatan berjaya dipadam.']);
    }

    /**
     * Tukar status selesai / belum selesai
     */
    public function toggleComplete($id = null)
    {
        $model = $this->getModelInstance();
        $reminder = $model->find($id);

        if (!$reminder) {
            return $this->failNotFound('Peringatan tidak dijumpai.');
        }

        $currentStatus = $reminder['status'];
        if ($currentStatus === 'completed') {
            $model->update($id, ['status' => 'pending']);
            return $this->respond(['status' => 'success', 'message' => 'Tugasan ditandakan sebagai belum selesai.', 'data' => $model->find($id)]);
        }

        // Tandakan selesai
        $model->update($id, ['status' => 'completed']);

        // Jika berulang (recurring), cipta pusingan seterusnya secara automatik
        if (!empty($reminder['is_recurring']) && !empty($reminder['recurrence_cycle'])) {
            $cycle = $reminder['recurrence_cycle'];
            $currentDue = strtotime($reminder['due_date']);
            
            $nextDueTime = match ($cycle) {
                'daily'   => strtotime('+1 day', $currentDue),
                'weekly'  => strtotime('+1 week', $currentDue),
                'monthly' => strtotime('+1 month', $currentDue),
                'yearly'  => strtotime('+1 year', $currentDue),
                default   => strtotime('+1 month', $currentDue)
            };

            $nextData = $reminder;
            unset($nextData['id']);
            $nextData['due_date'] = date('Y-m-d H:i:s', $nextDueTime);
            $nextData['status'] = 'pending';
            $nextData['last_email_sent_at'] = null;
            $nextData['created_at'] = date('Y-m-d H:i:s');
            $nextData['updated_at'] = date('Y-m-d H:i:s');

            $newId = $model->insert($nextData);

            return $this->respond([
                'status'     => 'success',
                'message'    => "Tugasan ditandakan selesai. Pusingan seterusnya ({$cycle}) telah dijana bagi tarikh: " . date('d M Y', $nextDueTime),
                'data'       => $model->find($id),
                'next_task'  => $model->find($newId)
            ]);
        }

        return $this->respond(['status' => 'success', 'message' => 'Tugasan berjaya ditandakan selesai.', 'data' => $model->find($id)]);
    }

    /**
     * Hantar notifikasi emel segera bagi peringatan (1-Klik Send Email)
     */
    public function sendEmail($id = null)
    {
        $model = $this->getModelInstance();
        $reminder = $model->find($id);

        if (!$reminder) {
            return $this->failNotFound('Peringatan tidak dijumpai.');
        }

        $emailAddress = trim($reminder['assigned_email'] ?? '');
        if (empty($emailAddress) || !filter_var($emailAddress, FILTER_VALIDATE_EMAIL)) {
            return $this->failValidationErrors('Tiada alamat emel yang sah ditetapkan bagi tugasan ini.');
        }

        $db = Database::connect();
        $settingsRaw = $db->table('settings')->get()->getResultArray();
        $settings = [];
        foreach ($settingsRaw as $row) {
            $settings[$row['key']] = $row['value'];
        }

        $appName = $settings['app_name'] ?? 'iKNOW Knowledge Hub';
        $systemEmail = $settings['system_email'] ?? 'noreply@hosza.my';

        $dueFormatted = date('d M Y, h:i A', strtotime($reminder['due_date']));
        $categoryLabel = match ($reminder['category'] ?? '') {
            'system'      => 'Sistem & Pelayan',
            'procurement' => 'Perolehan & Dokumen',
            'issue'       => 'Isu & Troubleshooting',
            'staff_admin' => 'Rutin Harian / Staf',
            default       => 'Umum'
        };
        $priorityLabel = match ($reminder['priority'] ?? '') {
            'critical' => 'Kritikal',
            'high'     => 'Tinggi',
            'medium'   => 'Sederhana',
            'low'      => 'Rendah',
            default    => ucfirst($reminder['priority'] ?? 'Umum')
        };
        $assignedName = !empty($reminder['assigned_to']) ? htmlspecialchars($reminder['assigned_to']) : 'Pegawai Bertugas';
        $appUrl = 'http://localhost/iknow/';

        // Templat Emel Ringkas & Bersih (Monokrom / Tiada Elemen Warna)
        $htmlMessage = "
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset='utf-8'>
          <title>Peringatan Tugasan</title>
        </head>
        <body style='margin:0; padding:20px; background-color:#ffffff; font-family:Arial, sans-serif; font-size:14px; line-height:1.6; color:#111827;'>
          <div style='max-width:600px; margin:0 auto; border:1px solid #d1d5db; border-radius:4px; padding:24px; background:#ffffff;'>
            
            <div style='border-bottom:2px solid #111827; padding-bottom:10px; margin-bottom:18px;'>
              <h2 style='margin:0; font-size:16px; font-weight:bold; color:#111827; letter-spacing:0.3px;'>
                🔔 IKNOW — PERINGATAN TUGASAN
              </h2>
            </div>

            <p style='margin:0 0 14px 0;'>
              Salam sejahtera <strong>{$assignedName}</strong>,
            </p>

            <p style='margin:0 0 16px 0;'>
              Ini adalah peringatan bagi tugasan berikut yang memerlukan perhatian atau tindakan anda:
            </p>

            <table style='width:100%; border-collapse:collapse; margin-bottom:20px; font-size:13.5px;'>
              <tr>
                <td style='padding:8px 12px; border:1px solid #d1d5db; width:140px; font-weight:bold; background:#f9fafb;'>Tugasan</td>
                <td style='padding:8px 12px; border:1px solid #d1d5db; font-weight:bold;'>" . htmlspecialchars($reminder['title']) . "</td>
              </tr>
              <tr>
                <td style='padding:8px 12px; border:1px solid #d1d5db; font-weight:bold; background:#f9fafb;'>Kategori</td>
                <td style='padding:8px 12px; border:1px solid #d1d5db;'>{$categoryLabel}</td>
              </tr>
              <tr>
                <td style='padding:8px 12px; border:1px solid #d1d5db; font-weight:bold; background:#f9fafb;'>Keutamaan</td>
                <td style='padding:8px 12px; border:1px solid #d1d5db;'>{$priorityLabel}</td>
              </tr>
              <tr>
                <td style='padding:8px 12px; border:1px solid #d1d5db; font-weight:bold; background:#f9fafb;'>Tarikh Matang</td>
                <td style='padding:8px 12px; border:1px solid #d1d5db;'>{$dueFormatted}</td>
              </tr>
              <tr>
                <td style='padding:8px 12px; border:1px solid #d1d5db; font-weight:bold; background:#f9fafb;'>Pegawai Bertugas</td>
                <td style='padding:8px 12px; border:1px solid #d1d5db;'>{$assignedName}</td>
              </tr>
              " . (!empty($reminder['description']) ? "
              <tr>
                <td style='padding:8px 12px; border:1px solid #d1d5db; font-weight:bold; vertical-align:top; background:#f9fafb;'>Arahan / Catatan</td>
                <td style='padding:8px 12px; border:1px solid #d1d5db;'>" . nl2br(htmlspecialchars($reminder['description'])) . "</td>
              </tr>" : "") . "
            </table>

            <p style='margin:0 0 16px 0;'>
              Sila klik pautan di bawah untuk membuka sistem dan mengemaskini status tugasan ini:
              <br>
              <a href='{$appUrl}' style='color:#111827; font-weight:bold; text-decoration:underline;'>{$appUrl}</a>
            </p>

            <hr style='border:none; border-top:1px solid #e5e7eb; margin:20px 0 14px 0;'>

            <p style='margin:0; font-size:12px; color:#4b5563;'>
              Emel ini dijana secara automatik oleh modul Reminder sistem iKNOW. Sila jangan balas emel ini. Sekiranya tugasan telah selesai, sila tandakan selesai pada sistem.
            </p>

          </div>
        </body>
        </html>
        ";

        try {
            $email = Services::email();
            
            // Muat konfigurasi daripada Settings jika wujud
            $fromEmail = !empty($settings['system_email']) ? $settings['system_email'] : config('Email')->fromEmail;
            $fromName  = !empty($settings['app_name']) ? $settings['app_name'] : config('Email')->fromName;

            $email->setFrom($fromEmail ?: 'noreply@unisza.edu.my', $fromName ?: 'iKNOW Knowledge Hub');
            $email->setTo($emailAddress);
            $email->setSubject("🔔 Peringatan Tugasan: {$reminder['title']} [{$priorityLabel}]");
            $email->setMessage($htmlMessage);
            $email->setMailType('html');

            $sent = $email->send(false);
            if (!$sent) {
                $debugMsg = strip_tags($email->printDebugger(['headers']));
                log_message('error', "Ralat hantar emel: {$debugMsg}");
                return $this->fail([
                    'status'  => 'error',
                    'message' => 'Gagal menghantar emel kepada ' . $emailAddress . '. ' . ($debugMsg ?: 'Sila semak tetapan SMTP di app/Config/Email.php.')
                ]);
            }

            $model->update($id, ['last_email_sent_at' => date('Y-m-d H:i:s')]);

            return $this->respond([
                'status'  => 'success',
                'sent'    => true,
                'message' => "Emel peringatan berjaya dihantar ke {$emailAddress}."
            ]);
        } catch (\Throwable $e) {
            log_message('error', "Pengecualian emel: " . $e->getMessage());
            return $this->fail([
                'status'  => 'error',
                'message' => "Ralat penghantaran emel: " . $e->getMessage()
            ]);
        }
    }

    /**
     * Dapatkan bilangan amaran untuk lencana Navbar (Loceng 🔔)
     */
    public function getAlertsCount()
    {
        $this->getModelInstance();
        $db = Database::connect();
        $now = date('Y-m-d H:i:s');
        $endOfTomorrow = date('Y-m-d 23:59:59', strtotime('+1 day'));

        $overdueCount = (int) $db->table('reminders')
            ->where('status !=', 'completed')
            ->where('due_date <', $now)
            ->countAllResults();

        $dueSoonCount = (int) $db->table('reminders')
            ->where('status !=', 'completed')
            ->where('due_date >=', $now)
            ->where('due_date <=', $endOfTomorrow)
            ->countAllResults();

        return $this->respond([
            'status'        => 'success',
            'overdue'       => $overdueCount,
            'due_soon'      => $dueSoonCount,
            'total_alerts'  => $overdueCount + $dueSoonCount
        ]);
    }
}
