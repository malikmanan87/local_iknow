<?php
/**
 * iKNOW Daily Backup CLI Runner (8:00 AM Daily Schedule & Catch-up)
 * Boleh dijalankan oleh Windows Task Scheduler setiap hari jam 8:00 AM,
 * atau dipanggil secara terus melalui command line / web service.
 */

date_default_timezone_set('Asia/Kuala_Lumpur');

$backupDir = __DIR__ . DIRECTORY_SEPARATOR . 'iknow_db_backup' . DIRECTORY_SEPARATOR;
if (!is_dir($backupDir)) {
    @mkdir($backupDir, 0777, true);
}

$now = time();
$today8am = strtotime(date('Y-m-d 08:00:00', $now));
$cycleDate = ($now >= $today8am) ? date('Y-m-d', $now) : date('Y-m-d', strtotime('-1 day', $now));

$dailyPath = $backupDir . "iknow_db_backup_{$cycleDate}.sql";
$rootPath  = __DIR__ . DIRECTORY_SEPARATOR . 'iknow_db_backup.sql';
$folderLatestPath = $backupDir . 'iknow_db_backup_latest.sql';
$legacyPath = __DIR__ . DIRECTORY_SEPARATOR . 'iknow_db_recovered_full.sql';

$logFile = $backupDir . 'backup_log.txt';

$timestampFormatted = date('Y-m-d H:i:s');
echo "[$timestampFormatted] Memulakan proses sandaran harian iKNOW (Kitaran 8:00 AM)...\n";

$mysqldumpPath = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';
if (!file_exists($mysqldumpPath)) {
    $mysqldumpPath = 'mysqldump';
}

$cmd = sprintf(
    '"%s" -h localhost -P 3306 -u root --skip-lock-tables --add-drop-table --routines --triggers --quick iknow_db 2>&1',
    $mysqldumpPath
);

$output = [];
$returnVar = -1;
@exec($cmd, $output, $returnVar);

$dumpContent = implode("\n", $output);

/**
 * Dasar Pembersihan Automatik (Retention Policy: 30 Hari)
 */
function applyRetentionPolicy($backupDir, $dailyPath, $logFile, $timestampFormatted, $retentionDays = 30) {
    $cutoff = time() - ($retentionDays * 86400);
    $files = glob($backupDir . 'iknow_db_backup_*.sql');
    if (!empty($files)) {
        foreach ($files as $file) {
            if (str_contains($file, '_latest.sql') || $file === $dailyPath) {
                continue;
            }
            if (filemtime($file) < $cutoff) {
                $base = basename($file);
                if (@unlink($file)) {
                    $cleanMsg = "[$timestampFormatted] RETENTION POLICY: Fail arkib dipadam (melebihi {$retentionDays} hari): $base\n";
                    echo $cleanMsg;
                    @file_put_contents($logFile, $cleanMsg, FILE_APPEND);
                }
            }
        }
    }
}

if ($returnVar === 0 && strlen($dumpContent) > 1000 && str_contains($dumpContent, 'Dump completed')) {
    @file_put_contents($dailyPath, $dumpContent);
    @file_put_contents($folderLatestPath, $dumpContent);
    @file_put_contents($rootPath, $dumpContent);
    @file_put_contents($legacyPath, $dumpContent);

    $msg = "[$timestampFormatted] BERJAYA: Sandaran pangkalan data disimpan ke $dailyPath (" . filesize($dailyPath) . " bytes)\n";
    echo $msg;
    @file_put_contents($logFile, $msg, FILE_APPEND);

    applyRetentionPolicy($backupDir, $dailyPath, $logFile, $timestampFormatted, 30);
    exit(0);
} else {
    // Fallback enjin PHP
    try {
        $mysqli = new mysqli('localhost', 'root', '', 'iknow_db');
        if ($mysqli->connect_error) {
            throw new Exception("Gagal berhubung ke MySQL: " . $mysqli->connect_error);
        }
        $mysqli->set_charset("utf8mb4");

        $sql = "-- iKNOW Database Daily Auto-Backup (Pure PHP Engine)\n";
        $sql .= "-- Tarikh Sandaran: " . date('Y-m-d H:i:s') . "\n";
        $sql .= "-- Pangkalan Data: iknow_db\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n";
        $sql .= "SET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\n\n";

        $res = $mysqli->query("SHOW TABLES");
        while ($row = $res->fetch_array()) {
            $table = $row[0];
            $tRes = $mysqli->query("SHOW CREATE TABLE `$table`");
            $tRow = $tRes->fetch_assoc();
            $sql .= "DROP TABLE IF EXISTS `$table`;\n" . $tRow['Create Table'] . ";\n\n";

            $dRes = $mysqli->query("SELECT * FROM `$table`");
            if ($dRes && $dRes->num_rows > 0) {
                $sql .= "LOCK TABLES `$table` WRITE;\n";
                while ($dRow = $dRes->fetch_assoc()) {
                    $escaped = array_map(function($v) use ($mysqli) {
                        return ($v === null) ? 'NULL' : "'" . $mysqli->real_escape_string($v) . "'";
                    }, array_values($dRow));
                    $sql .= "INSERT INTO `$table` VALUES (" . implode(", ", $escaped) . ");\n";
                }
                $sql .= "UNLOCK TABLES;\n\n";
            }
        }
        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";

        @file_put_contents($dailyPath, $sql);
        @file_put_contents($folderLatestPath, $sql);
        @file_put_contents($rootPath, $sql);
        @file_put_contents($legacyPath, $sql);

        $msg = "[$timestampFormatted] BERJAYA (PHP Engine): Sandaran disimpan ke $dailyPath (" . filesize($dailyPath) . " bytes)\n";
        echo $msg;
        @file_put_contents($logFile, $msg, FILE_APPEND);

        applyRetentionPolicy($backupDir, $dailyPath, $logFile, $timestampFormatted, 30);
        exit(0);
    } catch (Exception $e) {
        $msg = "[$timestampFormatted] GAGAL: " . $e->getMessage() . "\n";
        echo $msg;
        @file_put_contents($logFile, $msg, FILE_APPEND);
        exit(1);
    }
}
