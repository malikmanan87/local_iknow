<?php
namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use Config\Database;

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
            return strlen($w) > 2 && !in_array($w, ['apa', 'bagaimana', 'boleh', 'siapa', 'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'ini', 'itu', 'atau']);
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
            // Fallback response if no direct match found in PDF
            return $this->respond([
                'found' => false,
                'answer' => "Maaf, soalan anda tidak dijumpai secara spesifik di dalam fail PDF GHOP yang dimuat naik.\n\nSila pastikan anda menanya soalan berkenaan polisi hospital (cth: waktu melawat, polisi peneman, kod kecemasan), atau muat naik dokumen PDF GHOP terkini melalui panel pengurusan.",
                'references' => []
            ]);
        }

        // Format structured AI response based strictly on PDF content
        $bestMatch = $results[0];
        $answerText = "Berdasarkan dokumen rasmi **" . ($bestMatch['pdf_filename'] ?? 'GHOP Policy') . "** (" . $bestMatch['chapter_title'] . "):\n\n" .
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

    // Upload new GHOP PDF file or import PDF clauses
    public function uploadPdf() {
        $db = Database::connect();
        $file = $this->request->getFile('pdf_file');

        if ($file && $file->isValid() && !$file->hasMoved()) {
            $uploadPath = FCPATH . 'uploads/pdf';
            if (!is_dir($uploadPath)) {
                mkdir($uploadPath, 0777, true);
            }
            $newFileName = 'GHOP_' . time() . '_' . $file->getRandomName();
            $file->move($uploadPath, $newFileName);

            // If metadata/clauses sent alongside PDF file upload
            $clausesJson = $this->request->getPost('clauses');
            if ($clausesJson) {
                $clauses = json_decode($clausesJson, true);
                if (is_array($clauses)) {
                    $db->table('ghop_policies')->truncate();
                    foreach ($clauses as $c) {
                        $db->table('ghop_policies')->insert([
                            'pdf_filename' => $file->getClientName(),
                            'page_number' => $c['page_number'] ?? 1,
                            'chapter_title' => $c['chapter_title'] ?? 'General',
                            'section_code' => $c['section_code'] ?? null,
                            'title' => $c['title'] ?? 'Klausa GHOP',
                            'content_text' => $c['content_text'] ?? '',
                            'keywords' => $c['keywords'] ?? ''
                        ]);
                    }
                }
            }

            return $this->respondCreated([
                'message' => 'Fail PDF GHOP berjaya dimuat naik',
                'pdf_filename' => $file->getClientName(),
                'file_path' => 'uploads/pdf/' . $newFileName
            ]);
        }

        // If JSON payload for manual clauses insertion/update
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
                    'keywords' => $c['keywords'] ?? ''
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
