<?php

namespace App\Controllers;

use CodeIgniter\Controller;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Psr\Log\LoggerInterface;

/**
 * BaseController provides a convenient place for loading components
 * and performing functions that are needed by all your controllers.
 *
 * Extend this class in any new controllers:
 * ```
 *     class Home extends BaseController
 * ```
 *
 * For security, be sure to declare any new methods as protected or private.
 */
abstract class BaseController extends Controller
{
    /**
     * Be sure to declare properties for any property fetch you initialized.
     * The creation of dynamic property is deprecated in PHP 8.2.
     */

    // protected $session;

    /**
     * @return void
     */
    public function initController(RequestInterface $request, ResponseInterface $response, LoggerInterface $logger)
    {
        // KEKALKAN kod sedia ada CodeIgniter 4 yang berada di atas...
        parent::initController($request, $response, $logger);

        // TAMBAH KOD INI DI BAHAGIAN PALING BAWAH FUNGSI initController:
        try {
            $db = \Config\Database::connect();

            // Semak dahulu sama ada jadual settings wujud (elak ralat semasa spark migrate)
            if ($db->tableExists('settings')) {
                $settingsData = $db->table('settings')->get()->getResultArray();

                $globalSettings = [];
                foreach ($settingsData as $row) {
                    $globalSettings[$row['key']] = $row['value'];
                }

                // Kongsikan tatasusunan tetapan global ke semua View
                $this->viewData['sysSettings'] = $globalSettings;

                // Kemaskini nama aplikasi dinamik untuk digunakan pada layout/topbar
                if (isset($globalSettings['app_name'])) {
                    $this->viewData['dynamicAppName'] = $globalSettings['app_name'];
                }
            }
        } catch (\Exception $e) {
            // Abaikan jika database belum sedia
            $this->viewData['sysSettings'] = [];
        }
    }
}
