<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;

class AiAssistantController extends BaseController
{
    use ResponseTrait;

    protected $db;

    public function __construct()
    {
        $this->db = \Config\Database::connect();
    }

    /**
     * POST /api/ai/chat
     * Handles user natural language query and returns intelligent contextual response
     */
    public function chat()
    {
        $input = $this->request->getJSON(true) ?? $this->request->getPost();
        $message = trim($input['message'] ?? '');

        if (empty($message)) {
            return $this->fail('Sila masukkan soalan atau arahan.', 400);
        }

        $lowerMsg = mb_strtolower($message, 'UTF-8');

        // Check if Gemini API key exists for optional neural enhancement
        $geminiApiKey = getenv('GEMINI_API_KEY') ?: env('GEMINI_API_KEY', '');

        // 1. Contextual Intent Matching against IKNOW local database
        $response = $this->generateContextualReply($lowerMsg, $message);

        // 2. If no exact match found in IKNOW local database -> SEARCH THE INTERNET!
        if (empty($response['matched_exact'])) {
            $webResult = $this->searchInternetAndSynthesize($message, $geminiApiKey);
            if (!empty($webResult)) {
                $response = $webResult;
            }
        }

        return $this->respond([
            'status' => 'success',
            'data'   => [
                'reply'       => $response['reply'],
                'suggestions' => $response['suggestions'] ?? [],
                'actions'     => $response['actions'] ?? [],
                'timestamp'   => date('Y-m-d H:i:s')
            ]
        ]);
    }

    /**
     * GET /api/ai/suggestions
     */
    public function suggestions()
    {
        return $this->respond([
            'status' => 'success',
            'data'   => [
                [
                    'icon'  => '⚡',
                    'label' => 'Status Pelayan',
                    'prompt' => 'Apakah status semua pelayan masa kini?'
                ],
                [
                    'icon'  => '🔔',
                    'label' => 'Peringatan Tugas',
                    'prompt' => 'Ada apa-apa peringatan tugasan yang belum selesai?'
                ],
                [
                    'icon'  => '🛠️',
                    'label' => 'Troubleshoot Mirth',
                    'prompt' => 'Bagaimana cara atasi isu ralat Mirth Channel terhenti?'
                ],
                [
                    'icon'  => '📝',
                    'label' => 'Skrip SQL Pantas',
                    'prompt' => 'Beri senarai skrip SQL yang disimpan dalam nota'
                ],
                [
                    'icon'  => '📄',
                    'label' => 'Dokumen Perolehan',
                    'prompt' => 'Apakah dokumen tatacara perolehan yang ada?'
                ]
            ]
        ]);
    }

    /**
     * Intelligent local RAG engine parsing real-time database context
     */
    private function generateContextualReply(string $lower, string $raw): array
    {
        $actions = [];
        $suggestions = [];
        $matchedExact = false;

        // Intent: Salam / Greetings
        if (preg_match('/^(hai|hello|salam|assalam|hi|selamat pagi|selamat petang|selamat tengahari|selamat malam)/i', $lower)) {
            $reply = "👋 **Salam & Hai!** Saya **Pembantu Maya IKNOW**.\n\nSaya bersedia membantu anda menyemak maklumat operasi sistem. Anda boleh tanya saya tentang:\n\n" .
                     "• ⚡ **Status & Ping Pelayan** (Server Monitor)\n" .
                     "• 🔔 **Peringatan Tugasan** & tarikh akhir (Reminders)\n" .
                     "• 🛠️ **Troubleshooting Ralat** modul sistem & Mirth\n" .
                     "• 📝 **Skrip SQL & Nota Pantas**\n" .
                     "• 📄 **Dokumen & Tatakelola Perolehan**\n\n" .
                     "Ada apa-apa yang boleh saya bantu anda semak sekarang?";
            
            $suggestions = [
                'Semak status semua pelayan',
                'Senarai peringatan tugas',
                'Cari skrip SQL dalam nota'
            ];
            return ['reply' => $reply, 'suggestions' => $suggestions, 'actions' => $actions, 'matched_exact' => true];
        }

        // 1. High-Priority Action Intent: Creation of Reminders / Tasks
        $isCreateReminderIntent = (
            preg_match('/(cipta|tambah|buat|rekod|daftar|set|create|add|new|baru)/i', $lower) &&
            preg_match('/(reminder|peringatan|tugasan|task|tugas|jadual)/i', $lower)
        ) || preg_match('/^(ingatkan saya|ingat saya|tolong ingatkan)/i', $lower);

        if ($isCreateReminderIntent) {
            return $this->processCreateReminder($lower, $raw);
        }

        // 2. Intent: Server Monitoring & Ping
        if (preg_match('/(server|pelayan|ping|latency|down|uptime|ip pelayan)/i', $lower)) {
            $matchedExact = true;
            $servers = [];
            if ($this->db->tableExists('servers')) {
                $servers = $this->db->table('servers')->orderBy('name', 'ASC')->get()->getResultArray();
            }

            if (empty($servers)) {
                $reply = "ℹ️ Tiada rekod pelayan dijumpai dalam pangkalan data.";
            } else {
                $total = count($servers);
                $onlineCount = 0;
                $details = [];

                foreach ($servers as $s) {
                    $status = strtolower($s['status'] ?? 'unknown');
                    $isUp = ($status === 'online' || $status === 'up');
                    if ($isUp) $onlineCount++;

                    $icon = $isUp ? '🟢' : ($status === 'warning' ? '🟡' : '🔴');
                    $latency = !empty($s['latency_ms']) ? "{$s['latency_ms']} ms" : 'N/A';
                    $ip = !empty($s['ip_address']) ? "`{$s['ip_address']}`" : '-';
                    $details[] = "{$icon} **{$s['name']}** ({$ip}) — Status: `{$status}` | Latency: **{$latency}**";
                }

                $reply = "⚡ **Status Semasa Pelayan ({$onlineCount}/{$total} Dalam Talian):**\n\n" .
                         implode("\n", $details) . "\n\n" .
                         "💡 *Anda boleh membuka modul Pelayan untuk melakukan ping penuh atau mengemas kini konfigurasi.*";

                $actions[] = [
                    'label'  => 'Buka Pengurus Pelayan',
                    'action' => 'navigate',
                    'target' => 'server-manager'
                ];
            }

            $suggestions = ['Ada server yang down?', 'Senarai peringatan tugas'];
            return ['reply' => $reply, 'suggestions' => $suggestions, 'actions' => $actions, 'matched_exact' => $matchedExact];
        }

        // 3. Intent: Reminders & Tasks List
        if (preg_match('/(reminder|peringatan|tugasan|task|tugas|deadline|jadual|due)/i', $lower)) {
            return $this->processListReminders();
        }

        // Intent: Mirth / HL7
        if (preg_match('/(mirth|hl7|channel|saluran|transformer|connector)/i', $lower)) {
            $matchedExact = true;
            $reply = "🏥 **Panduan & Status Integrasi Mirth Connect HL7:**\n\n" .
                     "1. **Semakan Saluran (Channels)**: Pastikan status saluran berada dalam keadaan `Started` di Mirth Viewer.\n" .
                     "2. **Isu Saluran Terhenti (Stopped)**: Biasanya disebabkan port terputus, kegagalan sambungan pangkalan data destinasi, atau format mesej HL7 tidak sah.\n" .
                     "3. **Skrip Pantas**: Buka modul **Mirth Viewer** untuk melihat statistik mesej, saluran aktif, dan mesej ralat terkini.";

            $actions[] = [
                'label'  => 'Buka Mirth Viewer',
                'action' => 'navigate',
                'target' => 'mirth-viewer'
            ];

            $suggestions = ['Semak status pelayan', 'Cari skrip SQL'];
            return ['reply' => $reply, 'suggestions' => $suggestions, 'actions' => $actions, 'matched_exact' => $matchedExact];
        }

        // Intent: Notes & SQL Scripts
        if (preg_match('/(sql|skrip|script|nota|note|kod|query|cheat sheet)/i', $lower)) {
            $matchedExact = true;
            $notes = [];
            if ($this->db->tableExists('notes')) {
                $notes = $this->db->table('notes')
                    ->like('title', 'sql')
                    ->orLike('content', 'SELECT')
                    ->orLike('content', 'UPDATE')
                    ->limit(3)
                    ->get()
                    ->getResultArray();

                if (empty($notes)) {
                    $notes = $this->db->table('notes')->orderBy('updated_at', 'DESC')->limit(3)->get()->getResultArray();
                }
            }

            if (!empty($notes)) {
                $noteItems = [];
                foreach ($notes as $n) {
                    $snippet = mb_substr(strip_tags($n['content'] ?? ''), 0, 100);
                    $noteItems[] = "📝 **{$n['title']}**\n```sql\n" . trim($snippet) . "...\n```";
                }
                $reply = "📚 **Skrip & Nota Pantas Ditemui:**\n\n" . implode("\n\n", $noteItems);
            } else {
                $reply = "📝 **Modul Papan Nota & Skrip:**\n\nAnda boleh menyimpan skrip SQL lazim, arahan terminal, dan nota troubleshooting di Modul Notes Manager untuk capaian pantas sepasukan.";
            }

            $actions[] = [
                'label'  => 'Buka Notes Manager',
                'action' => 'navigate',
                'target' => 'notes-manager'
            ];

            return ['reply' => $reply, 'suggestions' => ['Semak status pelayan', 'Peringatan tugas'], 'actions' => $actions, 'matched_exact' => $matchedExact];
        }

        // Intent: Procurement / Dokumen Perolehan
        if (preg_match('/(perolehan|procurement|tender|sebut harga|pekeliling|kewangan|kontrak)/i', $lower)) {
            $matchedExact = true;
            $docs = [];
            if ($this->db->tableExists('procurement_documents')) {
                $docs = $this->db->table('procurement_documents')->limit(4)->get()->getResultArray();
            }

            if (!empty($docs)) {
                $docList = [];
                foreach ($docs as $d) {
                    $docList[] = "📄 **{$d['title']}** (" . ($d['category'] ?? 'Am') . ")";
                }
                $reply = "🏛️ **Dokumen Tatacara Perolehan & Kewangan:**\n\n" . implode("\n", $docList);
            } else {
                $reply = "🏛️ **Modul Dokumen Perolehan & Kewangan:**\n\nMenyediakan arkib tatacara sebut harga, pekeliling bendahari, dan rujukan tatakelola perolehan ICT.";
            }

            $actions[] = [
                'label'  => 'Buka Modul Perolehan',
                'action' => 'navigate',
                'target' => 'finance-procurement'
            ];

            return ['reply' => $reply, 'suggestions' => ['Status pelayan', 'Peringatan tugas'], 'actions' => $actions, 'matched_exact' => $matchedExact];
        }

        // Intent: Troubleshooting & Issues Search in DB
        if ($this->db->tableExists('issues')) {
            $searchWord = preg_replace('/[^a-zA-Z0-9\s]/', '', $lower);
            $words = array_filter(explode(' ', $searchWord), fn($w) => strlen($w) > 3);

            if (!empty($words)) {
                $builder = $this->db->table('issues');
                foreach ($words as $w) {
                    $builder->orLike('title', $w);
                    $builder->orLike('description', $w);
                }
                $foundIssues = $builder->limit(3)->get()->getResultArray();

                if (!empty($foundIssues)) {
                    $issueItems = [];
                    foreach ($foundIssues as $iss) {
                        $issueItems[] = "⚠️ **{$iss['title']}**\n" . ($iss['description'] ?? '');
                    }

                    $reply = "🔍 **Padanan Isu & Penyelesaian Ditemui dalam IKNOW:**\n\n" .
                             implode("\n\n", $issueItems) . "\n\n" .
                             "💡 *Buka Modul Sistem untuk melihat carta alir penyelesaian penuh.*";

                    $actions[] = [
                        'label'  => 'Buka Dashboard Modul',
                        'action' => 'navigate',
                        'target' => 'dashboard'
                    ];

                    return ['reply' => $reply, 'suggestions' => ['Semak status pelayan', 'Peringatan tugas'], 'actions' => $actions, 'matched_exact' => true];
                }
            }
        }

        // Default General Helpful Reply
        $reply = "🤖 **Pembantu Maya IKNOW**:\n\n" .
                 "Saya telah menyemak soalan anda: *\"" . htmlspecialchars($raw) . "\"*.\n\n" .
                 "Untuk maklumat yang paling tepat, anda boleh memilih salah satu tindakan pantas di bawah atau tanya saya mengenai **Status Pelayan**, **Peringatan Tugas**, **Troubleshooting Ralat**, atau **Skrip SQL**.";

        $suggestions = [
            'Apakah status semua pelayan?',
            'Ada apa-apa peringatan tugasan?',
            'Beri skrip SQL yang disimpan',
            'Bagaimana atasi isu ralat Mirth?'
        ];

        return [
            'reply'         => $reply,
            'suggestions'   => $suggestions,
            'actions'       => [
                ['label' => 'Buka Pusat Carian', 'action' => 'navigate', 'target' => 'home']
            ],
            'matched_exact' => false
        ];
    }

    /**
     * Search the live internet for accurate answers when IKNOW DB has no matching data
     */
    private function searchInternetAndSynthesize(string $query, string $geminiApiKey = ''): array
    {
        // 1. Check curated verified technical knowledge base
        $curatedAdvice = $this->synthesizeTechnicalAdvice($query);

        // 2. Fetch live solution from StackOverflow official API
        $soItem = $this->fetchStackOverflowSolution($query);

        // 3. Fetch conceptual definition / overview from DuckDuckGo Instant Answer API
        $ddgItem = $this->fetchDuckDuckGoInstantAnswer($query);

        // 4. Fetch Wikipedia knowledge if relevant to the query terms
        $wikiItems = $this->fetchWikipediaSummary($query);

        // Prepare context text for AI Grounding
        $combinedSnippets = [];
        if (!empty($curatedAdvice)) {
            $combinedSnippets[] = "Panduan Teknikal Bersepadu:\n" . $curatedAdvice;
        }
        if (!empty($soItem)) {
            $combinedSnippets[] = "StackOverflow (Skor: {$soItem['score']}): {$soItem['title']}\nJawapan: {$soItem['answer']}\nPautan: {$soItem['link']}";
        }
        if (!empty($ddgItem)) {
            $combinedSnippets[] = "Definisi ({$ddgItem['source']}): {$ddgItem['title']}\n{$ddgItem['text']}\nPautan: {$ddgItem['url']}";
        }
        foreach ($wikiItems as $w) {
            $combinedSnippets[] = "Wikipedia: {$w['title']}\nRingkasan: {$w['snippet']}";
        }
        $snippetsContext = implode("\n\n---\n\n", $combinedSnippets);

        // Actions array for direct interactive buttons
        $actions = [
            [
                'label'  => '🌐 Buka Carian Google',
                'action' => 'open_url',
                'target' => 'https://www.google.com/search?q=' . urlencode($query)
            ],
            [
                'label'  => '💻 Buka StackOverflow',
                'action' => 'open_url',
                'target' => 'https://stackoverflow.com/search?q=' . urlencode($query)
            ]
        ];

        if (!empty($soItem['link'])) {
            $actions[] = [
                'label'  => '💡 Buka Catatan StackOverflow',
                'action' => 'open_url',
                'target' => $soItem['link']
            ];
        }

        if (!empty($ddgItem['url'])) {
            $actions[] = [
                'label'  => '📖 Rujuk Dokumentasi Rasmi',
                'action' => 'open_url',
                'target' => $ddgItem['url']
            ];
        }

        // 5. If Gemini API key is configured, synthesize with Google Gemini
        if (!empty($geminiApiKey)) {
            $systemInstruction = "Anda adalah Pembantu Maya Pintar IKNOW (Sistem Operasi Bersepadu IT). " .
                                 "Pengguna bertanyakan soalan yang tiada dalam pangkalan data setempat IKNOW. " .
                                 "Berdasarkan maklumat carian internet dan sumber teknikal berikut, rumuskan jawapan yang SANGAT TEPAT, lengkap, tersusun, " .
                                 "dan praktikal dalam Bahasa Melayu menggunakan format Markdown. " .
                                 "Berikan punca masalah, langkah-langkah penyelesaian (step-by-step), dan contoh arahan terminal atau kod jika berkaitan.";

            $geminiReply = $this->callGeminiApi($geminiApiKey, $query, $snippetsContext, $systemInstruction);
            if (!empty($geminiReply)) {
                return [
                    'reply'         => "🌐 **Jawapan Tepat daripada Carian Internet (AI Grounded):**\n\n" . $geminiReply,
                    'suggestions'   => ['Semak status pelayan', 'Senarai peringatan tugas', 'Cari skrip SQL'],
                    'actions'       => $actions,
                    'matched_exact' => true
                ];
            }
        }

        // 6. Direct Multi-Source Synthesis Engine (if no Gemini API key or fallback)
        $hasData = !empty($curatedAdvice) || !empty($soItem) || !empty($ddgItem) || !empty($wikiItems);

        $reply = "🌐 **Hasil Carian & Panduan Tepat Luar Sistem IKNOW:**\n\n" .
                 "Maklumat ini tiada dalam pangkalan data tempatan IKNOW. Berikut adalah maklumat dan penyelesaian tepat yang diperoleh secara langsung dari internet bagi: *\"" . htmlspecialchars($query) . "\"*:\n\n";

        if (!empty($curatedAdvice)) {
            $reply .= $curatedAdvice . "\n\n";
        }

        if (!empty($ddgItem)) {
            $reply .= "📌 **Definisi & Gambaran Keseluruhan (" . htmlspecialchars($ddgItem['title']) . "):**\n" .
                      htmlspecialchars($ddgItem['text']) . "\n\n";
        }

        if (!empty($soItem)) {
            $reply .= "💡 **Penyelesaian Komuniti Pembangun (StackOverflow - Skor: +" . $soItem['score'] . "):**\n" .
                      "**" . htmlspecialchars($soItem['title']) . "**\n\n";
            if (!empty($soItem['answer'])) {
                $reply .= "```text\n" . $soItem['answer'] . "\n```\n\n";
            }
        }

        if (!empty($wikiItems)) {
            foreach ($wikiItems as $w) {
                $reply .= "📚 **" . htmlspecialchars($w['title']) . " (Wikipedia):**\n" . htmlspecialchars($w['snippet']) . "\n\n";
            }
        }

        if (!$hasData) {
            $reply .= "Maklumat terperinci untuk topik ini tidak ditemui secara automatik dalam arkib pantas.\n\n" .
                      "💡 Anda boleh merujuk dokumentasi rasmi serta perbincangan komuniti pembangun secara langsung melalui butang pautan carian di bawah.\n\n";
        }

        $reply .= "💡 *Anda boleh klik butang tindakan di bawah untuk menyemak perbincangan penuh di Google atau StackOverflow.*";

        return [
            'reply'         => $reply,
            'suggestions'   => [
                'Semak status semua pelayan',
                'Senarai peringatan tugas',
                'Cari skrip SQL'
            ],
            'actions'       => $actions,
            'matched_exact' => true
        ];
    }

    /**
     * Provide structured technical troubleshooting steps based on query keywords
     */
    private function synthesizeTechnicalAdvice(string $query): ?string
    {
        $q = mb_strtolower($query, 'UTF-8');

        // 1. Port 80 / 443 in use / Apache / IIS
        if (preg_match('/(port 80|port 443|port.*in use|port.*digunakan|apache.*terhenti|apache.*cannot start)/i', $q)) {
            return "🛠️ **Langkah Penyelesaian Ralat 'Port 80/443 In Use' di Windows:**\n\n" .
                   "Ralat ini lazimnya berlaku apabila servis sistem Windows (seperti IIS, Skype, atau System PID 4) sedang memegang port 80 Apache.\n\n" .
                   "1. **Kesan Proses yang Memegang Port 80**:\n" .
                   "   Buka Command Prompt (Run as Administrator) dan jalankan:\n" .
                   "   ```cmd\n   netstat -ano | findstr :80\n   ```\n" .
                   "2. **Hentikan Windows World Wide Web Publishing Service (IIS)**:\n" .
                   "   • Buka `services.msc` pada Windows Run.\n" .
                   "   • Cari servis **World Wide Web Publishing Service**.\n" .
                   "   • Klik kanan ➔ pilih **Stop**, dan tetapkan Startup type kepada *Manual*.\n" .
                   "3. **Tukar Port Apache di XAMPP (Pilihan Alternatif)**:\n" .
                   "   • Buka XAMPP Control Panel ➔ klik **Config** pada Apache ➔ pilih `httpd.conf`.\n" .
                   "   • Ubah baris `Listen 80` kepada `Listen 8080` dan `ServerName localhost:80` kepada `localhost:8080`.\n" .
                   "   • Simpan fail dan tekan butang **Start** semula pada Apache.";
        }

        // 2. MySQL Error 1045 / 2002 / Connection issues
        if (preg_match('/(1045|2002|access denied|kata laluan mysql|password root|mysql.*sambungan|can\'t connect to.*mysql)/i', $q)) {
            return "🛠️ **Langkah Penyelesaian Ralat MySQL Error 1045 / 2002 (Sambungan Pangkalan Data):**\n\n" .
                   "Ralat ini berpunca daripada percanggahan nama pengguna, kata laluan, atau servis MySQL belum diaktifkan.\n\n" .
                   "1. **Semak Tetapan dalam `.env`**:\n" .
                   "   Pastikan nilai `database.default.username = root` dan `database.default.password = ` sepadan dengan tetapan XAMPP anda.\n" .
                   "2. **Uji Akses Melalui phpMyAdmin**:\n" .
                   "   Akses `http://localhost/phpmyadmin/` untuk mengesahkan bahawa servis MySQL sedang beroperasi dan akaun `root@localhost` tiada kata laluan sekatan.\n" .
                   "3. **Mulakan Semula Servis MySQL**:\n" .
                   "   Di XAMPP Control Panel, hentikan dan mulakan semula (*Stop & Start*) servis MySQL.";
        }

        // 3. Git Push Rejected / Authentication Failed / Personal Access Token
        if (preg_match('/(git.*push.*reject|non-fast-forward|failed to push|support for password authentication was removed|personal access token|fatal.*authentication failed|remote rejected)/i', $q)) {
            return "🛠️ **Langkah Penyelesaian Isu Git Push Rejected / Authentication:**\n\n" .
                   "1. **Isu Non-Fast-Forward (Remote mengandungi commit baharu)**:\n" .
                   "   Gabungkan perubahan terkini dari remote sebelum melakukan push:\n" .
                   "   ```bash\n   git pull --rebase origin main\n   git push origin main\n   ```\n" .
                   "2. **Isu Kata Laluan GitHub Ditolak (Token Diperlukan)**:\n" .
                   "   GitHub tidak lagi menyokong kata laluan akaun untuk git push. Gunakan Personal Access Token (Classic):\n" .
                   "   • Pergi ke **GitHub Settings ➔ Developer Settings ➔ Personal Access Tokens ➔ Tokens (classic)**.\n" .
                   "   • Cipta token baharu dengan skop `repo`.\n" .
                   "   • Jalankan push menggunakan token dalam URL atau masukkan token apabila diminta kata laluan:\n" .
                   "   ```bash\n   git push https://<TOKEN>@github.com/<USER>/<REPO>.git main\n   ```";
        }

        // 4. Mirth Connect / HL7 issues
        if (preg_match('/(mirth|hl7|fhir|connector.*timeout|saluran.*mirth)/i', $q)) {
            return "🏥 **Panduan Integrasi & Troubleshooting Mirth Connect HL7:**\n\n" .
                   "1. **Semakan Port Pendengar (TCP Listener)**:\n" .
                   "   Pastikan port destinasi (contoh: 6661, 8443) tidak disekat oleh Windows Defender Firewall di pelayan Mirth.\n" .
                   "2. **Status Saluran (Channel State)**:\n" .
                   "   Jika saluran berada dalam status `Paused` atau `Error`, buka konsol Mirth Administrator, klik **Undeploy**, kemudian **Deploy** semula saluran berkenaan.\n" .
                   "3. **Format Mesej HL7**:\n" .
                   "   Sahkan segmen wajib seperti `MSH|^~\\&|...` dan format pemisah baris `\\r` (*Carriage Return*) dipatuhi agar transformer Mirth dapat membaca segmen dengan tepat.";
        }

        // 5. PHP memory_limit / max_execution_time / upload
        if (preg_match('/(memory_limit|max_execution_time|upload_max_filesize|post_max_size)/i', $q)) {
            return "⚙️ **Panduan Konfigurasi `php.ini` di XAMPP:**\n\n" .
                   "1. Buka XAMPP Control Panel ➔ klik **Config** pada baris Apache ➔ pilih **PHP (php.ini)**.\n" .
                   "2. Cari dan ubah parameter berikut mengikut keperluan projek:\n" .
                   "   ```ini\n   upload_max_filesize = 64M\n   post_max_size = 64M\n   memory_limit = 512M\n   max_execution_time = 300\n   ```\n" .
                   "3. Simpan fail dan *Restart* Apache di XAMPP.";
        }

        // 6. CORS in CodeIgniter / API
        if (preg_match('/(cors|cross-origin|access-control-allow-origin)/i', $q)) {
            return "🛠️ **Langkah Penyelesaian Isu Ralat CORS di CodeIgniter 4:**\n\n" .
                   "Ralat CORS (*Cross-Origin Resource Sharing*) berlaku apabila frontend React membuat panggilan API ke domain/port berbeza tanpa kebenaran pengepala.\n\n" .
                   "1. **Aktifkan Penapis CORS Terbina Dalam**:\n" .
                   "   Buka `app/Config/Filters.php`, cari array `\$globals['after']`, dan pastikan `'cors'` didaftarkan.\n" .
                   "2. **Penyelesaian Pengepala Terus pada Controller**:\n" .
                   "   Tambahkan pengepala berikut sebelum menghantar respon:\n" .
                   "   ```php\n   return \$this->response\n       ->setHeader('Access-Control-Allow-Origin', '*')\n       ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')\n       ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');\n   ```\n" .
                   "3. **Tindak Balas Prapenerbangan (OPTIONS Pre-flight)**:\n" .
                   "   Pastikan laluan HTTP OPTIONS dibenarkan dalam `app/Config/Routes.php`.";
        }

        // 7. Windows Service Tersekat (Stuck Stopping / Starting)
        if (preg_match('/(windows.*service.*stuck|service.*stopping|service.*starting|hentikan servis windows)/i', $q)) {
            return "🛠️ **Langkah Memaksa Henti Servis Windows yang Tersekat (*Stuck Stopping*):**\n\n" .
                   "1. Buka Command Prompt (Run as Administrator).\n" .
                   "2. Dapatkan nama servis dan PID (Process ID):\n" .
                   "   ```cmd\n   sc queryex [NamaServis]\n   ```\n" .
                   "3. Matikan proses servis secara paksa menggunakan PID yang diperoleh:\n" .
                   "   ```cmd\n   taskkill /F /PID [NomborPID]\n   ```\n" .
                   "4. Buka semula `services.msc` dan hidupkan servis berkenaan.";
        }

        // 8. Buka Port Windows Defender Firewall
        if (preg_match('/(firewall.*port|buka port firewall|allow port windows|port blocked by firewall)/i', $q)) {
            return "🛡️ **Langkah Membuka Port Masuk (Inbound Rule) di Windows Firewall:**\n\n" .
                   "Jalankan arahan berikut di PowerShell (Run as Administrator) untuk membenarkan port (contoh: Port 80/8080):\n" .
                   "```powershell\n" .
                   "New-NetFirewallRule -DisplayName \"Buka Port Web 8080\" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow\n" .
                   "```\n" .
                   "Atau melalui Command Prompt:\n" .
                   "```cmd\n" .
                   "netsh advfirewall firewall add rule name=\"Allow Port 8080\" dir=in action=allow protocol=TCP localport=8080\n" .
                   "```";
        }

        // 9. PHP Extension Hilang (cURL / intl / gd / zip / mbstring)
        if (preg_match('/(extension.*php|curl extension|intl extension|mbstring extension|mysqli extension|gd extension)/i', $q)) {
            return "⚙️ **Cara Mengaktifkan Extension PHP di XAMPP:**\n\n" .
                   "1. Buka XAMPP Control Panel ➔ klik **Config** pada Apache ➔ pilih **PHP (php.ini)**.\n" .
                   "2. Cari baris extension berkenaan dan buang tanda koma bertitik (`;`) di hadapan baris:\n" .
                   "   ```ini\n   extension=curl\n   extension=intl\n   extension=mbstring\n   extension=mysqli\n   extension=gd\n   extension=zip\n   ```\n" .
                   "3. Simpan fail dan mulakan semula (*Restart*) servis Apache.";
        }

        // 10. NPM / Node Install Fail
        if (preg_match('/(npm.*error|node-gyp|eacces|npm.*fail|npm install.*ralat)/i', $q)) {
            return "📦 **Langkah Penyelesaian Ralat NPM Install:**\n\n" .
                   "1. Bersihkan cache npm:\n" .
                   "   ```bash\n   npm cache clean --force\n   ```\n" .
                   "2. Padam folder `node_modules` dan fail `package-lock.json`:\n" .
                   "   ```bash\n   rm -rf node_modules package-lock.json\n   npm install\n   ```\n" .
                   "3. Jika melibatkan ralat kebenaran (EACCES di Windows), pastikan terminal dibuka menggunakan *Run as Administrator*.";
        }

        // 11. DNS Flush / Resolve host issue
        if (preg_match('/(dns.*flush|ipconfig.*flushdns|tidak boleh resolve domain|cannot resolve host)/i', $q)) {
            return "🌐 **Langkah Membersihkan Cache DNS di Windows:**\n\n" .
                   "Buka Command Prompt atau PowerShell (Run as Administrator) dan jalankan arahan berikut:\n" .
                   "```cmd\n" .
                   "ipconfig /flushdns\n" .
                   "ipconfig /registerdns\n" .
                   "ipconfig /release\n" .
                   "ipconfig /renew\n" .
                   "```\n" .
                   "Arahan ini memperbaharui jadual resolusi nama hos dan memadam rekod DNS lama yang korup.";
        }

        return null;
    }

    /**
     * Fetch community-verified answers from StackOverflow API
     */
    private function fetchStackOverflowSolution(string $query): ?array
    {
        try {
            // Strip out common Malay question filler words for cleaner technical query
            $clean = preg_replace('/\b(bagaimana|cara|nak|selesaikan|baiki|atasi|ralat|masalah|isu|dalam|pada|di|kenapa|mengapa|apa|itu)\b/iu', '', $query);
            $clean = trim(preg_replace('/\s+/', ' ', $clean));
            if (strlen($clean) < 3) $clean = $query;

            $url = 'https://api.stackexchange.com/2.3/search/advanced?pagesize=2&order=desc&sort=relevance&q=' . urlencode($clean) . '&site=stackoverflow';
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
            curl_setopt($ch, CURLOPT_ENCODING, 'gzip');
            curl_setopt($ch, CURLOPT_TIMEOUT, 6);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $res = curl_exec($ch);
            curl_close($ch);

            if (!$res) return null;
            $data = json_decode($res, true);
            $items = $data['items'] ?? [];
            if (empty($items)) return null;

            $topQuestion = null;
            foreach ($items as $q) {
                if (!empty($q['is_answered']) && ($q['score'] ?? 0) >= 0) {
                    $topQuestion = $q;
                    break;
                }
            }
            if (!$topQuestion) $topQuestion = $items[0];

            $qId = $topQuestion['question_id'] ?? null;
            $answerText = '';
            if ($qId) {
                $ansUrl = "https://api.stackexchange.com/2.3/questions/{$qId}/answers?pagesize=1&order=desc&sort=votes&site=stackoverflow&filter=withbody";
                $ch = curl_init($ansUrl);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
                curl_setopt($ch, CURLOPT_ENCODING, 'gzip');
                curl_setopt($ch, CURLOPT_TIMEOUT, 6);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                $ansRes = curl_exec($ch);
                curl_close($ch);

                if ($ansRes) {
                    $ansData = json_decode($ansRes, true);
                    $topAns = $ansData['items'][0] ?? null;
                    if ($topAns && !empty($topAns['body'])) {
                        $rawBody = $topAns['body'];
                        $bodyWithMd = preg_replace('#<pre><code>(.*?)</code></pre>#is', "\n```\n$1\n```\n", $rawBody);
                        $answerText = trim(strip_tags($bodyWithMd));
                        $answerText = html_entity_decode($answerText, ENT_QUOTES, 'UTF-8');
                        if (mb_strlen($answerText) > 600) {
                            $answerText = mb_substr($answerText, 0, 600) . '...';
                        }
                    }
                }
            }

            return [
                'title'  => html_entity_decode($topQuestion['title'] ?? 'Perbincangan StackOverflow', ENT_QUOTES, 'UTF-8'),
                'link'   => $topQuestion['link'] ?? 'https://stackoverflow.com',
                'score'  => $topQuestion['score'] ?? 0,
                'answer' => $answerText
            ];
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Fetch technology definition or summary from DuckDuckGo Instant Answer API
     */
    private function fetchDuckDuckGoInstantAnswer(string $query): ?array
    {
        $clean = preg_replace('/\b(apa|itu|apakah|maksud|definisi|pengenalan|tentang|sistem|perisian|alat|cara|bagaimana|nak|selesaikan|baiki|atasi|ralat|masalah|isu|dalam|pada|di|kenapa|mengapa)\b/iu', '', $query);
        $clean = trim(preg_replace('/\s+/', ' ', $clean));

        $stopWords = ['atasi', 'ralat', 'masalah', 'panduan', 'langkah', 'bantuan', 'pantas', 'tanya', 'soalan', 'tolong', 'buat', 'ambil', 'fix', 'error', 'issue', 'help'];

        $candidates = [];
        if (!empty($clean)) {
            $candidates[] = $clean;
        }

        $words = array_values(array_filter(explode(' ', $clean), fn($w) => strlen($w) >= 3 && !in_array(mb_strtolower($w, 'UTF-8'), $stopWords)));
        if (!empty($words)) {
            $candidates[] = implode(' ', $words);
            if (count($words) > 1) {
                $candidates[] = $words[0];
            }
        }
        $candidates = array_unique(array_filter($candidates));

        foreach ($candidates as $cand) {
            try {
                $url = 'https://api.duckduckgo.com/?q=' . urlencode($cand) . '&format=json&no_html=1&skip_disambig=1';
                $ch = curl_init($url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
                curl_setopt($ch, CURLOPT_TIMEOUT, 4);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                $res = curl_exec($ch);
                curl_close($ch);

                if (!$res) continue;
                $data = json_decode($res, true);
                $abstract = trim($data['AbstractText'] ?? '');
                if (empty($abstract) && !empty($data['RelatedTopics'][0]['Text'])) {
                    $abstract = $data['RelatedTopics'][0]['Text'];
                }

                if (!empty($abstract)) {
                    $combined = mb_strtolower(($data['Heading'] ?? '') . ' ' . $abstract, 'UTF-8');
                    $candLower = mb_strtolower($cand, 'UTF-8');
                    if (str_contains($combined, $candLower) || (!empty($data['Heading']) && str_contains($candLower, mb_strtolower($data['Heading'], 'UTF-8')))) {
                        return [
                            'title'  => !empty($data['Heading']) ? $data['Heading'] : $cand,
                            'text'   => $abstract,
                            'source' => $data['AbstractSource'] ?? 'Dokumentasi Web',
                            'url'    => !empty($data['AbstractURL']) ? $data['AbstractURL'] : ($data['RelatedTopics'][0]['FirstURL'] ?? '')
                        ];
                    }
                }
            } catch (\Throwable $e) {}
        }

        return null;
    }

    /**
     * Fetch summary from Wikipedia with strict keyword relevance validation
     */
    private function fetchWikipediaSummary(string $query): array
    {
        try {
            $qClean = preg_replace('/\b(apa|itu|apakah|maksud|definisi|pengenalan|tentang|bagaimana|cara)\b/iu', '', $query);
            $qClean = trim(preg_replace('/\s+/', ' ', $qClean));
            if (strlen($qClean) < 3) $qClean = $query;

            $url = 'https://ms.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . urlencode($qClean) . '&format=json&utf8=1';
            $opts = [
                'http' => [
                    'header'  => "User-Agent: IKNOW-Bot/1.0 (contact@unisza.edu.my)\r\n",
                    'timeout' => 4
                ]
            ];
            $res = @file_get_contents($url, false, stream_context_create($opts));
            $data = !empty($res) ? json_decode($res, true) : null;
            $results = $data['query']['search'] ?? [];

            if (empty($results)) {
                $urlEn = 'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . urlencode($qClean) . '&format=json&utf8=1';
                $resEn = @file_get_contents($urlEn, false, stream_context_create($opts));
                $dataEn = !empty($resEn) ? json_decode($resEn, true) : null;
                $results = $dataEn['query']['search'] ?? [];
            }

            $items = [];
            if (!empty($results)) {
                $queryTerms = array_filter(explode(' ', mb_strtolower($qClean, 'UTF-8')), fn($w) => strlen($w) > 2);
                $limit = min(2, count($results));

                for ($i = 0; $i < $limit; $i++) {
                    $title = $results[$i]['title'] ?? '';
                    $rawSnippet = strip_tags(html_entity_decode($results[$i]['snippet'] ?? '', ENT_QUOTES, 'UTF-8'));
                    $combinedText = mb_strtolower($title . ' ' . $rawSnippet, 'UTF-8');

                    // Relevance check: ensure at least one substantive query term is in the title or snippet
                    $isRelevant = false;
                    foreach ($queryTerms as $term) {
                        if (str_contains($combinedText, $term)) {
                            $isRelevant = true;
                            break;
                        }
                    }

                    if ($isRelevant && !empty($rawSnippet)) {
                        $items[] = [
                            'title'   => $title,
                            'snippet' => $rawSnippet
                        ];
                    }
                }
            }
            return $items;
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Optional call to Google Gemini API
     */
    private function callGeminiApi(string $apiKey, string $userPrompt, string $context, string $customInstruction = ''): string
    {
        try {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . urlencode($apiKey);

            $systemInstruction = !empty($customInstruction) ? $customInstruction :
                "Anda adalah Pembantu Maya Pintar untuk sistem IKNOW (Pusat Operasi Bersepadu & Dokumentasi IT). " .
                "Jawab dengan sopan, mesra, padat, dan tersusun dalam Bahasa Melayu menggunakan format markdown. " .
                "Bantu pengguna dengan maklumat operasi berkaitan sistem, server, ralat, dan tugasan.";

            $payload = [
                'contents' => [
                    [
                        'role'  => 'user',
                        'parts' => [
                            ['text' => "Arahan Sistem: {$systemInstruction}\n\nKonteks Carian Internet: {$context}\n\nSoalan Pengguna: {$userPrompt}"]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature'     => 0.3,
                    'maxOutputTokens' => 800
                ]
            ];

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_TIMEOUT, 9);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

            $res = curl_exec($ch);
            $err = curl_error($ch);
            curl_close($ch);

            if ($err || empty($res)) return '';

            $json = json_decode($res, true);
            return $json['candidates'][0]['content']['parts'][0]['text'] ?? '';
        } catch (\Throwable $e) {
            return '';
        }
    }

    /**
     * Process list of active reminders
     */
    private function processListReminders(): array
    {
        $reminders = [];
        if ($this->db->tableExists('reminders')) {
            $reminders = $this->db->table('reminders')
                ->where('status !=', 'completed')
                ->orderBy('due_date', 'ASC')
                ->limit(5)
                ->get()
                ->getResultArray();
        }

        $countActive = count($reminders);
        if ($countActive === 0) {
            $reply = "🎉 **Bagus! Tiada tugasan peringatan tertunggak buat masa ini.**\n\n" .
                     "Semua peringatan telah selesai atau belum ada tugasan baharu didaftarkan.\n\n" .
                     "💡 *Jika ingin menambah peringatan baru, anda boleh terus beritahu saya (contoh: \"Cipta reminder mesyuarat esok jam 10 pagi\").*";
            $actions = [
                [
                    'label'  => '➕ Tambah Peringatan Baharu',
                    'action' => 'navigate',
                    'target' => 'reminder'
                ]
            ];
        } else {
            $list = [];
            foreach ($reminders as $r) {
                $prio = ucfirst($r['priority'] ?? 'Sederhana');
                $prioBadge = ($prio === 'Tinggi' || $prio === 'High') ? '🔴' : (($prio === 'Rendah' || $prio === 'Low') ? '🟢' : '🟡');
                $due = !empty($r['due_date']) ? date('d/m/Y, h:i A', strtotime($r['due_date'])) : 'Tiada tarikh';
                $assignee = !empty($r['assigned_email']) ? " | 📧 " . htmlspecialchars($r['assigned_email']) : '';
                $list[] = "{$prioBadge} **{$r['title']}**\n   📅 Tarikh Akhir: `{$due}` | Keutamaan: **{$prio}**{$assignee}";
            }

            $reply = "🔔 **Terdapat {$countActive} Tugasan Peringatan Aktif yang Belum Selesai:**\n\n" .
                     implode("\n\n", $list) . "\n\n" .
                     "💡 *Notifikasi emel automatik akan dihantar terus ke alamat pegawai bertugas sebelum tarikh akhir.*";

            $actions = [
                [
                    'label'  => 'Buka Modul Peringatan',
                    'action' => 'navigate',
                    'target' => 'reminder'
                ]
            ];
        }

        $suggestions = [
            'Cipta reminder mesyuarat esok jam 10 pagi',
            'Semak status pelayan',
            'Cari skrip SQL'
        ];

        return [
            'reply'         => $reply,
            'suggestions'   => $suggestions,
            'actions'       => $actions,
            'matched_exact' => true
        ];
    }

    /**
     * Process creation of a new reminder based on natural language input
     */
    private function processCreateReminder(string $lower, string $raw): array
    {
        // 1. Extract email addresses
        preg_match_all('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $raw, $emailMatches);
        $emails = !empty($emailMatches[0]) ? array_unique($emailMatches[0]) : [];

        // 2. Extract priority
        $priority = 'medium';
        $priorityLabel = 'Sederhana';
        $prioBadge = '🟡';
        if (preg_match('/(tinggi|high|urgent|penting|kritikal)/i', $lower)) {
            $priority = 'high';
            $priorityLabel = 'Tinggi';
            $prioBadge = '🔴';
        } elseif (preg_match('/(rendah|low)/i', $lower)) {
            $priority = 'low';
            $priorityLabel = 'Rendah';
            $prioBadge = '🟢';
        }

        // 3. Extract date
        $targetDate = null;
        if (preg_match('/lusa/i', $lower)) {
            $targetDate = date('Y-m-d', strtotime('+2 days'));
        } elseif (preg_match('/esok/i', $lower)) {
            $targetDate = date('Y-m-d', strtotime('+1 day'));
        } elseif (preg_match('/(hari ini|petang ini|malam ini)/i', $lower)) {
            $targetDate = date('Y-m-d');
        } elseif (preg_match('/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/', $raw, $mDate)) {
            $targetDate = sprintf('%04d-%02d-%02d', $mDate[3], $mDate[2], $mDate[1]);
        } elseif (preg_match('/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/', $raw, $mDate)) {
            $targetDate = sprintf('%04d-%02d-%02d', $mDate[1], $mDate[2], $mDate[3]);
        } else {
            $targetDate = date('Y-m-d', strtotime('+1 day'));
        }

        // 4. Extract time
        $targetTime = '09:00:00';
        if (preg_match('/(?:jam|pukul)\s*(\d{1,2})(?::(\d{2}))?\s*(pagi|petang|malam|tengahari|am|pm)?/i', $lower, $mTime)) {
            $hour = (int)$mTime[1];
            $min = !empty($mTime[2]) ? (int)$mTime[2] : 0;
            $ampm = strtolower($mTime[3] ?? '');

            if (($ampm === 'petang' || $ampm === 'malam' || $ampm === 'pm') && $hour < 12) {
                $hour += 12;
            } elseif (($ampm === 'pagi' || $ampm === 'am') && $hour === 12) {
                $hour = 0;
            }
            $targetTime = sprintf('%02d:%02d:00', $hour, $min);
        } elseif (preg_match('/(\d{1,2}):(\d{2})\s*(am|pm)?/i', $lower, $mTime)) {
            $hour = (int)$mTime[1];
            $min = (int)$mTime[2];
            $ampm = strtolower($mTime[3] ?? '');
            if ($ampm === 'pm' && $hour < 12) $hour += 12;
            if ($ampm === 'am' && $hour === 12) $hour = 0;
            $targetTime = sprintf('%02d:%02d:00', $hour, $min);
        }

        $dueDateTime = $targetDate . ' ' . $targetTime;

        // 5. Extract Title
        $cleaned = $raw;
        foreach ($emails as $em) {
            $cleaned = str_ireplace($em, '', $cleaned);
        }

        $patternsToRemove = [
            '/saya minta untuk/i',
            '/tolong ingatkan saya untuk/i',
            '/tolong ingatkan saya/i',
            '/ingatkan saya untuk/i',
            '/ingatkan saya/i',
            '/sila cipta/i',
            '/cipta satu reminder/i',
            '/cipta reminder/i',
            '/tambah satu reminder/i',
            '/tambah reminder/i',
            '/buat satu reminder/i',
            '/buat reminder/i',
            '/set satu reminder/i',
            '/set reminder/i',
            '/cipta satu peringatan/i',
            '/cipta peringatan/i',
            '/tambah satu peringatan/i',
            '/tambah peringatan/i',
            '/buat satu peringatan/i',
            '/buat peringatan/i',
            '/cipta satu tugasan/i',
            '/cipta tugasan/i',
            '/tambah tugasan/i',
            '/peringatan baharu/i',
            '/peringatan baru/i',
            '/reminder baru/i',
            '/pada tarikh/i',
            '/tarikh/i',
            '/keutamaan tinggi/i',
            '/keutamaan rendah/i',
            '/keutamaan sederhana/i',
            '/priority high/i',
            '/priority low/i',
            '/esok/i',
            '/lusa/i',
            '/hari ini/i',
            '/petang ini/i',
            '/malam ini/i',
            '/(?:jam|pukul)\s*\d{1,2}(?::\d{2})?\s*(?:pagi|petang|malam|tengahari|am|pm)?/i',
            '/\d{1,2}:\d{2}\s*(?:am|pm)?/i',
            '/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/',
            '/\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/',
            '/ke emel/i',
            '/kepada/i',
            '/untuk/i'
        ];

        foreach ($patternsToRemove as $pat) {
            $cleaned = preg_replace($pat, ' ', $cleaned);
        }

        $cleanTitle = trim(preg_replace('/[\s,;:\-]+/', ' ', $cleaned));
        $cleanTitle = trim(preg_replace('/\b(ke|pada|di|untuk|kepada|at|to|for|emel|email)\b\s*$/i', '', $cleanTitle));

        // If title is too short or empty (e.g. user just said "saya minta untuk cipta satu reminder")
        if (empty($cleanTitle) || mb_strlen($cleanTitle) < 3) {
            $reply = "📝 **Saya sedia membantu anda mencipta Peringatan baharu!**\n\n" .
                     "Sila nyatakan tajuk tugasan dan tarikhnya secara terus, contohnya:\n\n" .
                     "• *\"Cipta reminder mesyuarat perolehan ICT esok jam 10 pagi\"*\n" .
                     "• *\"Ingatkan saya semak pelayan Mirth lusa jam 2 petang ke malikmanan@unisza.edu.my\"*\n" .
                     "• *\"Set reminder semak backup pangkalan data keutamaan tinggi\"*\n\n" .
                     "Atau klik butang di bawah untuk membuka borang pendaftaran peringatan:";

            $actions = [
                [
                    'label'  => '➕ Buka Borang Tambah Peringatan',
                    'action' => 'navigate',
                    'target' => 'reminder'
                ]
            ];

            $suggestions = [
                'Cipta reminder mesyuarat esok jam 10 pagi',
                'Cipta reminder semak pelayan esok jam 9 pagi',
                'Senarai peringatan aktif'
            ];

            return [
                'reply'         => $reply,
                'suggestions'   => $suggestions,
                'actions'       => $actions,
                'matched_exact' => true
            ];
        }

        // Capitalize Title
        $cleanTitle = mb_strtoupper(mb_substr($cleanTitle, 0, 1, 'UTF-8'), 'UTF-8') . mb_substr($cleanTitle, 1, null, 'UTF-8');

        // Save directly to reminders table in database!
        $insertData = [
            'title'                   => $cleanTitle,
            'description'             => "Dicipta secara pintar oleh Pembantu Maya IKNOW berdasarkan arahan: \"{$raw}\"",
            'category'                => 'system',
            'priority'                => $priority,
            'status'                  => 'pending',
            'due_date'                => $dueDateTime,
            'reminder_before_days'    => 1,
            'assigned_to'             => 'Pegawai Bertugas',
            'assigned_email'          => !empty($emails) ? implode(', ', $emails) : null,
            'send_email_notification' => !empty($emails) ? 1 : 0,
            'created_by'              => 'IKNOW AI Assistant'
        ];

        $this->db->table('reminders')->insert($insertData);
        $newId = $this->db->insertID();

        $formattedDue = date('d/m/Y, h:i A', strtotime($dueDateTime));
        $emailInfo = !empty($emails) ? implode(', ', $emails) : '_Tiada emel (boleh dikemas kini dalam modul)_';

        $reply = "✅ **Peringatan Berjaya Dicipta & Disimpan ke Sistem!**\n\n" .
                 "• 📌 **Tajuk**: **{$cleanTitle}**\n" .
                 "• 📅 **Tarikh & Masa Akhir**: `{$formattedDue}`\n" .
                 "• ⚡ **Keutamaan**: {$prioBadge} **{$priorityLabel}**\n" .
                 "• 📧 **Emel Penerima**: {$emailInfo}\n" .
                 "• 🆔 **ID Peringatan**: `#{$newId}`\n\n" .
                 "💡 *Peringatan ini kini aktif dalam jadual sistem IKNOW dan notifikasi automatik akan dihantar sebelum tarikh akhir.*";

        $actions = [
            [
                'label'  => '🔔 Lihat di Modul Peringatan',
                'action' => 'navigate',
                'target' => 'reminder'
            ]
        ];

        $suggestions = [
            'Senarai peringatan aktif',
            'Semak status semua pelayan',
            'Cari skrip SQL'
        ];

        return [
            'reply'         => $reply,
            'suggestions'   => $suggestions,
            'actions'       => $actions,
            'matched_exact' => true
        ];
    }
}
