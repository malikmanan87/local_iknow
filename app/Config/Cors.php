<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

class Cors extends BaseConfig {
    public array $default = [
        'allowedOrigins'         => ['*'],
        'allowedOriginsPatterns' => [],
        'supportsCredentials'   => false,
        'allowedHeaders'         => ['Content-Type', 'Authorization', 'X-Requested-With'],
        'allowedMethods'         => ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
        'exposedHeaders'         => [],
        'maxAge'                 => 7200,
    ];
}
