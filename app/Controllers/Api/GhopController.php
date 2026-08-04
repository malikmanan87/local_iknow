<?php
namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use Config\Database;
use Smalot\PdfParser\Parser;

class GhopController extends ResourceController {
    protected $format = 'json';

    // Get current GHOP document status and list of policies
    public function index() {
        $db = Database::connect();
        $policies = $db->table('ghop_policies')->orderBy('page_number', 'ASC')->get()->getResultArray();
        
        $pdfFile = null;
        if (!empty($policies)) {
            $pdfFile = $policies[0]['pdf_filename'];
        }

        return $this->respond([
            'pdf_filename' => $pdfFile,
            'total_clauses' => count($policies),
            'policies' => $policies
        ]);
    }

    // Chat AI engine responding strictly based on ingested PDF content
    public function chat() {
        $data = $this->request->getJSON(true);
        $question = trim($data['question'] ?? '');

        if (empty($question)) {
            return $this->fail('Soalan tidak boleh kosong', 400);
        }

        $db = Database::connect();
        $words = array_filter(explode(' ', strtolower($question)), function($w) {
            return strlen($w) > 2 && !in_array($w, ['apa', 'bagaimana', 'boleh', 'siapa', 'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'ini', 'itu', 'atau', 'apakah']);
        });

        $builder = $db->table('ghop_policies');
        
        if (!empty($words)) {
            $builder->groupStart();
            foreach ($words as $index => $word) {
                if ($index === 0) {
                    $builder->like('content_text', $word)
                            ->orLike('title', $word)
                            ->orLike('keywords', $word)
                            ->orLike('chapter_title', $word);
                } else {
                    $builder->orLike('content_text', $word)
                            ->orLike('title', $word)
                            ->orLike('keywords', $word);
                }
            }
            $builder->groupEnd();
        } else {
            $builder->like('content_text', $question);
        }

        $results = $builder->limit(3)->get()->getResultArray();

        if (empty($results)) {
            return $this->respond([
                'found' => false,
                'answer' => "Maaf, soalan anda tidak dijumpai secara spesifik di dalam dokumen PDF GHOP yang dimuat naik.\n\nSila pastikan kata kunci carian tepat mengikut isi kandungan fail PDF GHOP anda.",
                'references' => []
            ]);
        }

        $bestMatch = $results[0];
        $answerText = "Berdasarkan dokumen rasmi **" . ($bestMatch['pdf_filename'] ?? 'GHOP Policy') . "** (Muka Surat " . $bestMatch['page_number'] . "):\n\n" .
                     "📌 **" . $bestMatch['title'] . "**\n" .
                     $bestMatch['content_text'];

        $references = array_map(function($r) {
            return [
                'id' => $r['id'],
                'pdf_filename' => $r['pdf_filename'],
                'page_number' => $r['page_number'],
                'chapter_title' => $r['chapter_title'],
                'section_code' => $r['section_code'],
                'title' => $r['title'],
                'excerpt' => mb_strimwidth($r['content_text'], 0, 150, '...')
            ];
        }, $results);

        return $this->respond([
            'found' => true,
            'answer' => $answerText,
            'primary_reference' => $references[0],
            'references' => $references
        ]);
    }

    // Upload new GHOP PDF file & Auto-Extract All Pages Text
    public function uploadPdf() {
        $db = Database::connect();
        $file = $this->request->getFile('pdf_file');

        if ($file && $file->isValid() && !$file->hasMoved()) {
            $uploadPath = FCPATH . 'uploads/pdf';
            if (!is_dir($uploadPath)) {
                mkdir($uploadPath, 0777, true);
            }
            $origName = $file->getClientName();
            $newFileName = 'GHOP_' . time() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '_', $origName);
            $filePath = $uploadPath . '/' . $newFileName;
            $file->move($uploadPath, $newFileName);

            // Auto-extract text page by page from PDF using Smalot\PdfParser
            try {
                $parser = new Parser();
                $pdf = $parser->parseFile($filePath);
                $pages = $pdf->getPages();

                $db->table('ghop_policies')->truncate();
                $extractedPagesCount = 0;

                foreach ($pages as $pageIndex => $page) {
                    $pageNumber = $pageIndex + 1;
                    $text = trim($page->getText());
                    if (!empty($text)) {
                        $lines = array_filter(array_map('trim', explode("\n", $text)));
                        $title = !empty($lines) ? reset($lines) : "Muka Surat $pageNumber";
                        if (mb_strlen($title) > 100) {
                            $title = mb_substr($title, 0, 100) . '...';
                        }

                        $chapter = "Muka Surat $pageNumber";
                        foreach ($lines as $line) {
                            if (preg_match('/(bab|chapter|seksyen|section|bahagian)/i', $line)) {
                                $chapter = mb_substr($line, 0, 80);
                                break;
                            }
                        }

                        $db->table('ghop_policies')->insert([
                            'pdf_filename' => $origName,
                            'page_number' => $pageNumber,
                            'chapter_title' => $chapter,
                            'section_code' => 'GHOP-P' . $pageNumber,
                            'title' => $title,
                            'content_text' => $text,
                            'keywords' => strtolower($text)
                        ]);
                        $extractedPagesCount++;
                    }
                }

                return $this->respondCreated([
                    'message' => "Fail PDF '$origName' berjaya dimuat naik & $extractedPagesCount muka surat teks telah diekstrak secara automatik oleh AI!",
                    'pdf_filename' => $origName,
                    'pages_extracted' => $extractedPagesCount
                ]);
            } catch (\Throwable $e) {
                // If PDF parsing error (e.g. encrypted), save uploaded file info
                return $this->respondCreated([
                    'message' => "Fail PDF '$origName' berjaya dimuat naik. Salinan PDF disimpan.",
                    'pdf_filename' => $origName,
                    'warning' => 'Ekstraksi automatik teks PDF memerlukan PDF yang tidak dilindungi kata laluan.'
                ]);
            }
        }

        // Manual text JSON payload insertion/update
        $data = $this->request->getJSON(true);
        if ($data && isset($data['clauses']) && is_array($data['clauses'])) {
            if ($data['replace_all'] ?? false) {
                $db->table('ghop_policies')->truncate();
            }
            foreach ($data['clauses'] as $c) {
                $db->table('ghop_policies')->insert([
                    'pdf_filename' => $data['pdf_filename'] ?? 'GHOP_Official_Policy.pdf',
                    'page_number' => $c['page_number'] ?? 1,
                    'chapter_title' => $c['chapter_title'] ?? 'General',
                    'section_code' => $c['section_code'] ?? null,
                    'title' => $c['title'] ?? 'Klausa GHOP',
                    'content_text' => $c['content_text'] ?? '',
                    'keywords' => strtolower(($c['title'] ?? '') . ' ' . ($c['content_text'] ?? ''))
                ]);
            }
            return $this->respondCreated(['message' => 'Klausa PDF GHOP berjaya disimpan']);
        }

        return $this->fail('Fail PDF tidak sah atau borang tidak lengkap', 400);
    }

    // Delete a specific clause
    public function deletePolicy($id = null) {
        $db = Database::connect();
        $db->table('ghop_policies')->where('id', $id)->delete();
        return $this->respondDeleted(['message' => 'Klausa GHOP berjaya dipadam']);
    }
}
