<?php
$mysqli = new mysqli("localhost", "root", "", "iknow_db");

if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}

// 1. Create ghop_policies table
$sqlTable = "CREATE TABLE IF NOT EXISTS ghop_policies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pdf_filename VARCHAR(255) DEFAULT NULL,
    page_number INT DEFAULT 1,
    chapter_title VARCHAR(255) DEFAULT NULL,
    section_code VARCHAR(50) DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    content_text TEXT NOT NULL,
    keywords TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($mysqli->query($sqlTable) === TRUE) {
    echo "Table ghop_policies created or exists successfully.\n";
} else {
    echo "Error creating table ghop_policies: " . $mysqli->error . "\n";
}

// 2. Insert sample GHOP policy entries if table is empty
$res = $mysqli->query("SELECT COUNT(*) as cnt FROM ghop_policies");
$row = $res->fetch_assoc();

if ($row['cnt'] == 0) {
    $sampleData = [
        [
            'pdf_filename' => 'GHOP_Hospital_Policy_2026.pdf',
            'page_number' => 12,
            'chapter_title' => 'Bab 4: Pengurusan Pesakit Dalam Wad',
            'section_code' => 'GHOP-WAD-01',
            'title' => 'Polisi Kehadiran Peneman Pesakit',
            'content_text' => 'Setiap pesakit dalam wad dibenarkan seorang peneman mengikut kelulusan Pegawai Perubatan / Ketua Jururawat Wad. Peneman bagi pesakit wanita diutamakan peneman wanita atau ahli keluarga terdekat. Peneman di Wad Bersalin (Labor Room) hanya dibenarkan bagi suami sah dengan pendaftaran rasmi.',
            'keywords' => 'peneman, suami, wad bersalin, labor room, perempan, kebenaran'
        ],
        [
            'pdf_filename' => 'GHOP_Hospital_Policy_2026.pdf',
            'page_number' => 18,
            'chapter_title' => 'Bab 4: Pengurusan Pesakit Dalam Wad',
            'section_code' => 'GHOP-WAD-05',
            'title' => 'Polisi Waktu Melawat Pesakit',
            'content_text' => 'Waktu melawat hospital adalah dari jam 12:30 tengah hari hingga 2:00 petang, dan 4:30 petang hingga 7:00 malam setiap hari termasuk cuti umum. Kanak-kanak di bawah umur 12 tahun tidak dibenarkan masuk ke wad risiko tinggi seperti ICU/CCU.',
            'keywords' => 'waktu melawat, jam melawat, kanak-kanak, icu, ccu, melawat'
        ],
        [
            'pdf_filename' => 'GHOP_Hospital_Policy_2026.pdf',
            'page_number' => 35,
            'chapter_title' => 'Bab 7: Pengurusan Kecemasan & Kod Hospital',
            'section_code' => 'GHOP-KOD-02',
            'title' => 'Prosedur Kod Blue (Henti Jantung / Cardiopulmonary Arrest)',
            'content_text' => 'Apabila berlaku henti jantung (cardiopulmonary arrest), kakitangan wajib mengaktifkan Code Blue menerusi sambungan telefon kecemasan talian 999/5555. Pasukan Resusitasi mesti tiba di lokasi kejadian dalam masa kurang daripada 3 minit.',
            'keywords' => 'code blue, henti jantung, kecemasan, resusitasi, 999, 5555'
        ]
    ];

    $stmt = $mysqli->prepare("INSERT INTO ghop_policies (pdf_filename, page_number, chapter_title, section_code, title, content_text, keywords) VALUES (?, ?, ?, ?, ?, ?, ?)");
    foreach ($sampleData as $d) {
        $stmt->bind_param("sisssss", $d['pdf_filename'], $d['page_number'], $d['chapter_title'], $d['section_code'], $d['title'], $d['content_text'], $d['keywords']);
        $stmt->execute();
    }
    echo "Sample GHOP policies inserted successfully.\n";
}

$mysqli->close();
