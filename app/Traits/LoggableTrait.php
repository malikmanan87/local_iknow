<?php

namespace App\Traits;

use App\Models\ActivityLogModel;

trait LoggableTrait
{
    /**
     * Record a system activity log entry cleanly into database.
     */
    protected function logActivity(string $action, string $description = ''): void
    {
        try {
            ActivityLogModel::log($action, $description);
        } catch (\Exception $e) {
            log_message('error', 'Activity Log Error: ' . $e->getMessage());
        }
    }
}
