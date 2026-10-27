<?php
namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;

class BackupController extends ResourceController {
    protected $format = 'json';

    /**
     * Dapatkan laluan direktori sandaran iknow_db_backup.
     */
    private function getBackupDir(): string {
        $dir = ROOTPATH . 'iknow_db_backup' . DIRECTORY_SEPARATOR;
        if (!is_dir($dir)) {
            @mkdir($dir, 0777, true);
        }
        return $dir;
    }

    /**
     * Dapatkan maklumat kitaran sandaran harian 24 jam (bermula jam 8:00 AM setiap hari).
     */
    private function getCycleInfo(): array {
        $now = time();
        $today8am = strtotime(date('Y-m-d 08:00:00', $now));

        if ($now >= $today8am) {
            // Sedang berada dalam kitaran hari ini (bermula 8:00 AM hari ini hingga 8:00 AM esok)
            $cycleStart = $today8am;
            $nextCycle = strtotime('+1 day', $today8am);
            $cycleDate = date('Y-m-d', $now);
        } else {
            // Sedang berada dalam kitaran semalam (bermula 8:00 AM semalam hingga 8:00 AM pagi ini)
            $cycleStart = strtotime('-1 day', $today8am);
            $nextCycle = $today8am;
            $cycleDate = date('Y-m-d', strtotime('-1 day', $now));
        }

        return [
            'now'                   => $now,
            'cycle_start'           => $cycleStart,
            'cycle_start_formatted' => date('d M Y, h:i A', $cycleStart),
            'next_cycle'            => $nextCycle,
            'next_cycle_formatted'  => date('d M Y, h:i A', $nextCycle),
            'cycle_date'            => $cycleDate
        ];
    }

    /**
     * Fail sandaran harian mengikut tarikh kitaran 8:00 AM.
     */
    private function getDailyBackupPath(): string {
        $cycle = $this->getCycleInfo();
        return $this->getBackupDir() . "iknow_db_backup_{$cycle['cycle_date']}.sql";
    }

    /**
     * Fail sandaran terkini di root directory (iknow_db_backup.sql).
     */
    private function getRootBackupPath(): string {
        return ROOTPATH . 'iknow_db_backup.sql';
    }

    /**
     * Semak status fail backup harian 24 jam (kitaran 8:00 AM).
     * Jika parameter ?auto=1 diberikan:
     * - Jika backup 8:00 AM kitaran ini terlepas, auto-backup serta-merta!
     * - Jika sudah ada tapi lebih lama dari 5 minit (300s), kemaskini senyap.
     */
    public function status() {
        $auto = $this->request->getGet('auto');
        $cycle = $this->getCycleInfo();
        $dailyPath = $this->getDailyBackupPath();

        if ($auto) {
            $shouldBackup = false;

            // 1. Jika fail kitaran belum wujud (terlepas sandaran 8:00 AM)
            if (!file_exists($dailyPath)) {
                $shouldBackup = true;
            } else {
                $lastModified = filemtime($dailyPath);
                // 2. Jika fail diubah sebelum waktu mula kitaran 8:00 AM (terlepas jadual 8:00 AM)
                if ($lastModified < $cycle['cycle_start']) {
                    $shouldBackup = true;
                }
            }

            if ($shouldBackup) {
                $this->performBackup();
            }
        }

        $this->cleanupOldBackups($dailyPath);

        return $this->respond($this->getBackupInfo());
    }

    /**
     * Jalankan backup manual serta-merta.
     */
    public function run() {
        $result = $this->performBackup();
        if ($result['success']) {
            return $this->respond([
                'success' => true,
                'message' => 'Sandaran pangkalan data harian (iknow_db_backup) berjaya dihasilkan!',
                'info'    => $this->getBackupInfo()
            ]);
        }

        return $this->fail([
            'success' => false,
            'message' => $result['error'] ?? 'Gagal membuat sandaran pangkalan data.'
        ], 500);
    }

    /**
     * Melaksanakan proses export SQL database dan menyimpannya ke:
     * 1. iknow_db_backup/iknow_db_backup_YYYY-MM-DD.sql (Sandaran harian arkib)
     * 2. iknow_db_backup/iknow_db_backup_latest.sql (Salinan terkini folder)
     * 3. iknow_db_backup.sql (Fail utama root)
     */
    private function performBackup(): array {
        $db = \Config\Database::connect();
        $dailyPath = $this->getDailyBackupPath();
        $rootPath = $this->getRootBackupPath();
        $folderLatestPath = $this->getBackupDir() . 'iknow_db_backup_latest.sql';

        $hostname = $db->hostname ?? 'localhost';
        $database = $db->database ?? 'iknow_db';
        $username = $db->username ?? 'root';
        $password = $db->password ?? '';
        $port     = $db->port ?? 3306;

        // 1. Cuba guna mysqldump.exe terlebih dahulu
        $mysqldumpPath = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';
        if (!file_exists($mysqldumpPath)) {
            $mysqldumpPath = 'mysqldump';
        }

        $pwdFlag = !empty($password) ? " -p" . escapeshellarg($password) : "";
        $cmd = sprintf(
            '"%s" -h %s -P %s -u %s%s --skip-lock-tables --add-drop-table --routines --triggers --quick %s 2>&1',
            $mysqldumpPath,
            escapeshellarg($hostname),
            escapeshellarg($port),
            escapeshellarg($username),
            $pwdFlag,
            escapeshellarg($database)
        );

        $output = [];
        $returnVar = -1;
        @exec($cmd, $output, $returnVar);

        $dumpContent = implode("\n", $output);

        // Semak jika mysqldump berjaya menghasilkan output SQL sah
        if ($returnVar === 0 && strlen($dumpContent) > 1000 && str_contains($dumpContent, 'Dump completed')) {
            @file_put_contents($dailyPath, $dumpContent);
            @file_put_contents($folderLatestPath, $dumpContent);
            @file_put_contents($rootPath, $dumpContent);
            $this->cleanupOldBackups($dailyPath);
            return ['success' => true];
        }

        // 2. Fallback: Eksport menggunakan enjin PHP tulen (Pure PHP Dump)
        try {
            $sql = "-- iKNOW Database Daily Auto-Backup (Pure PHP Engine)\n";
            $sql .= "-- Tarikh Sandaran: " . date('Y-m-d H:i:s') . "\n";
            $sql .= "-- Kitaran Harian: Setiap 24 Jam Bermula 8:00 AM\n";
            $sql .= "-- Pangkalan Data: {$database}\n\n";
            $sql .= "SET FOREIGN_KEY_CHECKS=0;\n";
            $sql .= "SET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\n\n";

            $tables = $db->listTables();
            foreach ($tables as $table) {
                // Dapatkan struktur CREATE TABLE
                $row = $db->query("SHOW CREATE TABLE `{$table}`")->getRowArray();
                $createTableSql = $row['Create Table'] ?? null;
                if ($createTableSql) {
                    $sql .= "DROP TABLE IF EXISTS `{$table}`;\n";
                    $sql .= $createTableSql . ";\n\n";
                }

                // Dapatkan rekod data
                $rows = $db->table($table)->get()->getResultArray();
                if (!empty($rows)) {
                    $sql .= "LOCK TABLES `{$table}` WRITE;\n";
                    foreach ($rows as $r) {
                        $escapedValues = array_map(function($v) use ($db) {
                            if ($v === null) return 'NULL';
                            return $db->escape($v);
                        }, $r);
                        $sql .= "INSERT INTO `{$table}` VALUES (" . implode(", ", $escapedValues) . ");\n";
                    }
                    $sql .= "UNLOCK TABLES;\n\n";
                }
            }

            $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";
            $sql .= "-- Sandaran Selesai pada " . date('Y-m-d H:i:s') . "\n";

            @file_put_contents($dailyPath, $sql);
            @file_put_contents($folderLatestPath, $sql);
            @file_put_contents($rootPath, $sql);
            $this->cleanupOldBackups($dailyPath);
            return ['success' => true];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'error'   => $e->getMessage()
            ];
        }
    }

    /**
     * Dasar Pembersihan Automatik (Retention Policy: Hanya Sandaran Terkini):
     * Memadam semua fail sandaran arkib lama dan hanya menyimpan fail sandaran harian terkini
     * selepas backup dibuat bagi menjimatkan ruang storan pelayan.
     */
    private function cleanupOldBackups(?string $keepDailyPath = null): array {
        $backupDir = $this->getBackupDir();
        $pruned = [];

        $files = glob($backupDir . 'iknow_db_backup_*.sql');
        if (!empty($files)) {
            // Jika $keepDailyPath tidak dinyatakan atau belum wujud, pilih fail paling baharu mengikut mtime
            if (empty($keepDailyPath) || !file_exists($keepDailyPath)) {
                $candidates = array_filter($files, fn($f) => !str_contains($f, '_latest.sql'));
                if (!empty($candidates)) {
                    usort($candidates, fn($a, $b) => filemtime($b) - filemtime($a));
                    $keepDailyPath = $candidates[0];
                }
            }

            foreach ($files as $file) {
                // Simpan fail terkini dan salinan _latest.sql
                if ($file === $keepDailyPath || str_contains($file, '_latest.sql')) {
                    continue;
                }

                $basename = basename($file);
                $mtime = filemtime($file);
                if (@unlink($file)) {
                    $pruned[] = [
                        'file' => $basename,
                        'date' => date('Y-m-d H:i:s', $mtime)
                    ];
                }
            }
        }

        // Padam juga sebarang fail sandaran lama di root directory (cth: iknow_db_backup_before_*)
        $rootOld = glob(ROOTPATH . 'iknow_db_backup_*.sql');
        if (!empty($rootOld)) {
            foreach ($rootOld as $rf) {
                if ($rf !== ROOTPATH . 'iknow_db_backup.sql') {
                    $base = basename($rf);
                    $mtime = filemtime($rf);
                    if (@unlink($rf)) {
                        $pruned[] = [
                            'file' => $base,
                            'date' => date('Y-m-d H:i:s', $mtime)
                        ];
                    }
                }
            }
        }

        return [
            'retention_policy' => 'latest_only',
            'pruned_count'     => count($pruned),
            'pruned_files'     => $pruned
        ];
    }

    /**
     * Dapatkan maklumat fail backup harian dan status jadual 8:00 AM
     */
    private function getBackupInfo(): array {
        $cycle = $this->getCycleInfo();
        $dailyPath = $this->getDailyBackupPath();
        $rootPath = $this->getRootBackupPath();
        $backupDir = $this->getBackupDir();

        $targetFile = null;
        if (file_exists($dailyPath)) {
            $targetFile = $dailyPath;
        } elseif (file_exists($rootPath)) {
            $targetFile = $rootPath;
        } else {
            $files = glob($backupDir . '*.sql');
            if (!empty($files)) {
                usort($files, function($a, $b) {
                    return filemtime($b) - filemtime($a);
                });
                $targetFile = $files[0];
            }
        }

        if (!$targetFile || !file_exists($targetFile)) {
            return [
                'exists'                 => false,
                'file_name'              => basename($dailyPath),
                'folder'                 => 'iknow_db_backup/',
                'file_size'              => '0 B',
                'file_size_bytes'        => 0,
                'last_backup_timestamp'  => null,
                'last_backup_formatted'  => 'Belum ada sandaran',
                'last_backup_relative'   => 'Tiada fail',
                'is_today'               => false,
                'is_cycle_covered'       => false,
                'cycle_start_formatted'  => $cycle['cycle_start_formatted'],
                'next_cycle_formatted'   => $cycle['next_cycle_formatted'],
                'schedule_label'         => 'Setiap 24 Jam (8:00 AM)',
                'status'                 => 'missing',
                'total_backups_count'    => 0,
                'history'                => []
            ];
        }

        $sizeBytes = filesize($targetFile);
        $mtime = filemtime($targetFile);
        $isCycleCovered = ($mtime >= $cycle['cycle_start']);

        // Senarai fail sejarah dalam folder iknow_db_backup
        $allSql = glob($backupDir . 'iknow_db_backup_*.sql');
        $history = [];
        if (!empty($allSql)) {
            usort($allSql, function($a, $b) {
                return filemtime($b) - filemtime($a);
            });
            foreach (array_slice($allSql, 0, 7) as $f) {
                $fTime = filemtime($f);
                $history[] = [
                    'file_name' => basename($f),
                    'size'      => $this->formatBytes(filesize($f)),
                    'date'      => date('d M Y, h:i A', $fTime)
                ];
            }
        }

        return [
            'exists'                 => true,
            'file_name'              => basename($targetFile),
            'folder'                 => 'iknow_db_backup/',
            'file_size'              => $this->formatBytes($sizeBytes),
            'file_size_bytes'        => $sizeBytes,
            'last_backup_timestamp'  => $mtime,
            'last_backup_formatted'  => date('d M Y, h:i A', $mtime),
            'last_backup_relative'   => $this->getRelativeTime($mtime),
            'is_today'               => (date('Y-m-d', $mtime) === date('Y-m-d')),
            'is_cycle_covered'       => $isCycleCovered,
            'cycle_start_formatted'  => $cycle['cycle_start_formatted'],
            'next_cycle_formatted'   => $cycle['next_cycle_formatted'],
            'schedule_label'         => 'Setiap 24 Jam (8:00 AM)',
            'status'                 => $isCycleCovered ? 'healthy' : 'warning',
            'daily_date'             => date('Y-m-d', $mtime),
            'total_backups_count'    => count($allSql),
            'retention_days'         => 1,
            'retention_label'        => 'Hanya Sandaran Terkini Disimpan (Pembersihan Automatik)',
            'history'                => $history
        ];
    }

    private function formatBytes(int $bytes): string {
        if ($bytes >= 1048576) {
            return round($bytes / 1048576, 2) . ' MB';
        }
        if ($bytes >= 1024) {
            return round($bytes / 1024, 1) . ' KB';
        }
        return $bytes . ' B';
    }

    private function getRelativeTime(int $timestamp): string {
        $diff = time() - $timestamp;
        if ($diff < 60) {
            return 'Baru sahaja';
        }
        if ($diff < 3600) {
            $mins = floor($diff / 60);
            return $mins . ' minit lalu';
        }
        if ($diff < 86400) {
            $hours = floor($diff / 3600);
            return $hours . ' jam lalu';
        }
        $days = floor($diff / 86400);
        if ($days == 1) {
            return 'Semalam (' . date('h:i A', $timestamp) . ')';
        }
        return $days . ' hari lalu';
    }
}
