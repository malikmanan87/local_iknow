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
        $allPolicies = $db->table('ghop_policies')->get()->getResultArray();

        if (empty($allPolicies)) {
            return $this->respond([
                'found' => false,
                'answer' => "Tiada dokumen PDF GHOP dijumpai dalam pangkalan data. Sila muat naik fail PDF GHOP terlebih dahulu.",
                'references' => []
            ]);
        }

        $cleanQuestion = strtolower($question);
        $stopWords = ['apa', 'apakah', 'bagaimana', 'bagaimanakah', 'boleh', 'bolehkah', 'siapa', 'siapakah', 'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'ini', 'itu', 'atau', 'pada', 'dengan', 'adakah', 'bila', 'bilakah', 'mengapa', 'kenapa', 'hospital'];
        
        $keywords = array_filter(explode(' ', preg_replace('/[^\w\s]/u', ' ', $cleanQuestion)), function($w) use ($stopWords) {
            $w = trim($w);
            return strlen($w) >= 2 && !in_array($w, $stopWords);
        });

        $scoredPolicies = [];

        foreach ($allPolicies as $policy) {
            $score = 0;
            $contentText = strtolower($policy['content_text']);
            $titleText = strtolower($policy['title']);
            $chapterText = strtolower($policy['chapter_title'] ?? '');
            $codeText = strtolower($policy['section_code'] ?? '');

            // 1. Exact phrase match
            if (!empty($keywords) && str_contains($contentText, implode(' ', $keywords))) {
                $score += 100;
            }

            // 2. Keyword matching with weights
            foreach ($keywords as $word) {
                if (empty($word)) continue;

                // Match in Title (+30)
                if (str_contains($titleText, $word)) {
                    $score += 30;
                }

                // Match in Code (+25)
                if (str_contains($codeText, $word)) {
                    $score += 25;
                }

                // Match in Chapter (+20)
                if (str_contains($chapterText, $word)) {
                    $score += 20;
                }

                // Match in Content Text (+10 per count)
                $count = substr_count($contentText, $word);
                if ($count > 0) {
                    $score += min($count * 10, 50);
                }
            }

            if ($score > 0) {
                $policy['score'] = $score;
                $scoredPolicies[] = $policy;
            }
        }

        // Sort descending by relevance score
        usort($scoredPolicies, function($a, $b) {
            return $b['score'] <=> $a['score'];
        });

        // Threshold check: If top score is too low or no matches found
        if (empty($scoredPolicies) || $scoredPolicies[0]['score'] < 10) {
            return $this->respond([
                'found' => false,
                'answer' => "Maaf, maklumat spesifik berkenaan **\"$question\"** tidak dijumpai di dalam fail PDF GHOP yang dimuat naik.\n\nSila pastikan soalan anda mengandungi kata kunci khusus berkenaan polisi hospital (seperti *waktu melawat*, *polisi peneman*, *prosedur kecemasan*, *kod blue*).",
                'references' => []
            ]);
        }

        $topResults = array_slice($scoredPolicies, 0, 3);
        $bestMatch = $topResults[0];

        // Find relevant paragraph within the best match text
        $paragraphs = array_filter(array_map('trim', explode("\n", $bestMatch['content_text'])));
        $bestParagraph = $bestMatch['content_text'];

        foreach ($paragraphs as $para) {
            $paraLower = strtolower($para);
            foreach ($keywords as $word) {
                if (str_contains($paraLower, $word)) {
                    $bestParagraph = $para;
                    break 2;
                }
            }
        }

        $titleStr = (!empty($bestMatch['title']) && !str_starts_with($bestMatch['title'], 'Muka Surat')) ? "📌 **" . $bestMatch['title'] . "**\n\n" : "";
        $answerText = $titleStr . $bestParagraph;

        $references = array_map(function($r) {
            return [
                'id' => $r['id'],
                'pdf_filename' => $r['pdf_filename'],
                'page_number' => $r['page_number'],
                'chapter_title' => $r['chapter_title'],
                'section_code' => $r['section_code'],
                'title' => $r['title'],
                'score' => $r['score'],
                'excerpt' => mb_strimwidth($r['content_text'], 0, 150, '...')
            ];
        }, $topResults);

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
