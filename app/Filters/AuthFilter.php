<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class AuthFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        // Get current URI path
        $currentURI = $request->getUri()->getPath();
        $currentURI = trim($currentURI, '/');

        // List of public open URIs exempt from authentication check
        $excludedURIs = ['login', 'logout', 'register', 'register/process', ''];

        // 1. CHECK MAINTENANCE MODE
        try {
            $db = \Config\Database::connect();
            $maintenanceQuery = $db->table('settings')->where('key', 'maintenance_mode')->get()->getRow();
            $isMaintenance = $maintenanceQuery ? (int)$maintenanceQuery->value : 0;

            if ($isMaintenance === 1) {
                $userRole   = session()->get('role');
                $isLoggedIn = session()->get('isLoggedIn');

                // If maintenance mode is enabled and user is NOT admin, restrict access
                if ($userRole !== 'admin') {
                    if (!in_array($currentURI, $excludedURIs)) {

                        if ($isLoggedIn) {
                            session()->remove(['isLoggedIn', 'user_id', 'fullname', 'email', 'username', 'role', 'role_id']);
                        }

                        return redirect()->to(base_url('login'))
                            ->with('error', 'The system is currently undergoing maintenance. Please try again later.');
                    }
                }
            }
        } catch (\Exception $e) {
            // Gracefully ignore if database connection is not ready during initial setup
        }

        // 2. AUTHENTICATION & ACCESS CONTROL
        if (!in_array($currentURI, $excludedURIs)) {

            if (!session()->get('isLoggedIn')) {
                return redirect()->to(base_url('login'))
                    ->with('error', 'Please log in to access this page.');
            }

            // Role-Based Access Control (RBAC route argument check)
            if (!empty($arguments)) {
                $requiredRoles = $arguments;
                $userRole      = session()->get('role');

                if (!in_array($userRole, $requiredRoles)) {
                    return redirect()->to(base_url('dashboard'))
                        ->with('error', 'You do not have permission to access this page.');
                }
            }
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // Not required
    }
}
