<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Services;

class TestEmail extends BaseCommand
{
    protected $group       = 'Custom';
    protected $name        = 'email:test';
    protected $description = 'Uji penghantaran emel notifikasi dan paparkan log SMTP debugger';
    protected $usage       = 'email:test [recipient_email]';
    protected $arguments   = [
        'recipient_email' => 'Alamat emel penerima (lalai: malikmanan@unisza.edu.my)',
    ];

    public function run(array $params)
    {
        $recipient = $params[0] ?? 'malikmanan@unisza.edu.my';
        CLI::write("===================================================", 'yellow');
        CLI::write(" UJIAN PENGHANTARAN EMEL NOTIFIKASI IKNOW", 'green');
        CLI::write("===================================================", 'yellow');
        CLI::write("Penerima: {$recipient}");

        $config = config('Email');
        CLI::write("\n[1] Konfigurasi Semasa (Config\\Email):", 'cyan');
        CLI::write(" - Protocol: " . ($config->protocol ?: '(kosong)'));
        CLI::write(" - From Email: " . ($config->fromEmail ?: '(kosong)'));
        CLI::write(" - From Name: " . ($config->fromName ?: '(kosong)'));
        CLI::write(" - SMTP Host: " . ($config->SMTPHost ?: '(kosong)'));
        CLI::write(" - SMTP Port: " . $config->SMTPPort);
        CLI::write(" - SMTP Crypto: " . ($config->SMTPCrypto ?: '(tiada)'));
        CLI::write(" - SMTP User: " . ($config->SMTPUser ? substr($config->SMTPUser, 0, 3) . '***' : '(kosong)'));

        CLI::write("\n[2] Memulakan Penghantaran Emel...", 'cyan');

        $email = Services::email();
        if (!empty($config->fromEmail)) {
            $email->setFrom($config->fromEmail, $config->fromName ?: 'iKNOW System');
        } else {
            $email->setFrom('noreply@unisza.edu.my', 'iKNOW Knowledge Hub');
        }
        $email->setTo($recipient);
        $email->setSubject('🔔 Ujian Notifikasi Emel - iKNOW Knowledge Hub (' . date('d/m/Y H:i:s') . ')');
        $email->setMessage("
            <div style='font-family: Arial, sans-serif; padding: 20px; background: #0b0f19; color: #f8fafc;'>
                <h2 style='color: #38bdf8;'>🏥 iKNOW Knowledge Hub</h2>
                <p>Ini adalah emel ujian bagi mengesahkan fungsi notifikasi emel peringatan tugasan sistem.</p>
                <div style='background: #1e293b; padding: 15px; border-radius: 8px; margin: 15px 0;'>
                    <strong>Penerima:</strong> {$recipient}<br>
                    <strong>Waktu Ujian:</strong> " . date('d M Y, h:i A') . "<br>
                    <strong>Status:</strong> Sistem sedia menghantar peringatan tugasan secara automatik.
                </div>
                <p style='color: #94a3b8; font-size: 12px;'>Dihantar daripada iKNOW Pusat Operasi Bersepadu.</p>
            </div>
        ");
        $email->setMailType('html');

        $sent = $email->send(false);

        CLI::write("\n[3] Keputusan:", 'cyan');
        if ($sent) {
            CLI::write(">>> BERJAYA! Emel telah berjaya dihantar ke {$recipient}. <<<", 'green');
        } else {
            CLI::write(">>> GAGAL! Emel tidak dapat dihantar. <<<", 'red');
            CLI::write("\n[4] Log Debugger (SMTP / Mail Handshake):", 'yellow');
            $debug = $email->printDebugger(['headers', 'subject', 'body']);
            CLI::write(strip_tags($debug));
        }
        CLI::write("===================================================", 'yellow');
    }
}
