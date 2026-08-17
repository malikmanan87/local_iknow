<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */

// Serve React SPA dist on root URL
$routes->get('/', function() {
    $indexPath = FCPATH . 'index.html';
    if (!file_exists($indexPath)) {
        $indexPath = FCPATH . '../frontend/dist/index.html';
    }
    if (file_exists($indexPath)) {
        return response()->setBody(file_get_contents($indexPath))->setHeader('Content-Type', 'text/html');
    }
    return 'Frontend dist not found. Please build frontend first.';
});

// Serve compiled React static assets (JS/CSS)
$routes->get('assets/(:any)', function($asset) {
    $assetPath = FCPATH . 'assets/' . $asset;
    if (!file_exists($assetPath)) {
        $assetPath = FCPATH . '../frontend/dist/assets/' . $asset;
    }
    if (file_exists($assetPath)) {
        $mime = 'text/plain';
        if (str_ends_with($asset, '.css')) {
            $mime = 'text/css';
        } else if (str_ends_with($asset, '.js')) {
            $mime = 'application/javascript';
        } else if (function_exists('mime_content_type')) {
            $mime = mime_content_type($assetPath);
        }
        return response()->setBody(file_get_contents($assetPath))->setHeader('Content-Type', $mime);
    }
    return response()->setStatusCode(404);
});

// RESTful API Routes
$routes->group('api', function($routes) {
    // Modules
    $routes->get('modules', 'Api\ModuleController::index');
    $routes->get('modules/(:num)', 'Api\ModuleController::show/$1');
    $routes->post('modules', 'Api\ModuleController::create');
    $routes->match(['put', 'post'], 'modules/(:num)', 'Api\ModuleController::update/$1');
    $routes->delete('modules/(:num)', 'Api\ModuleController::delete/$1');

    // Submodules
    $routes->post('submodules', 'Api\SubmoduleController::create');
    $routes->match(['put', 'post'], 'submodules/(:num)', 'Api\SubmoduleController::update/$1');
    $routes->delete('submodules/(:num)', 'Api\SubmoduleController::delete/$1');

    // Flows
    $routes->post('flows', 'Api\FlowController::create');
    $routes->match(['put', 'post'], 'flows/(:num)', 'Api\FlowController::update/$1');
    $routes->delete('flows/(:num)', 'Api\FlowController::delete/$1');

    // Issues
    $routes->post('issues', 'Api\IssueController::create');
    $routes->match(['put', 'post'], 'issues/(:num)', 'Api\IssueController::update/$1');
    $routes->delete('issues/(:num)', 'Api\IssueController::delete/$1');

    // Contacts
    $routes->post('contacts', 'Api\ContactController::create');
    $routes->match(['put', 'post'], 'contacts/(:num)', 'Api\ContactController::update/$1');
    $routes->delete('contacts/(:num)', 'Api\ContactController::delete/$1');

    // Image Upload
    $routes->post('upload', 'Api\UploadController::create');

    // Flowcharts (load & save per module + context_key)
    $routes->get('flowcharts/(:num)/(:any)',                 'Api\\FlowchartController::load/$1/$2');
    $routes->match(['put', 'post'], 'flowcharts/(:num)/(:any)', 'Api\\FlowchartController::save/$1/$2');

    // Global Search
    $routes->get('search', 'Api\SearchController::index');

    // Mirth Connect HL7 Viewer (Read-Only)
    $routes->get('mirth/status',             'Api\MirthController::status');
    $routes->get('mirth/channels',           'Api\MirthController::channels');
    $routes->get('mirth/search',             'Api\MirthController::search');
    $routes->get('mirth/messages',           'Api\MirthController::messages');
    $routes->get('mirth/message/(:segment)', 'Api\MirthController::messageDetail/$1');
});
