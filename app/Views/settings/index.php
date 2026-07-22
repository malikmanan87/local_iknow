<?= $this->extend('layouts/main') ?>
<?= $this->section('content') ?>

<div class="row justify-content-center">
    <div class="col-xl">

        <div class="card-panel">
            <div class="card-panel-header py-3">
                <h5 class="card-panel-title">
                    <i class="bi bi-gear-fill me-2 text-primary"></i>System Settings
                </h5>
            </div>
            <div class="card-panel-body">

                <form action="<?= base_url('settings/update') ?>" method="post" id="settingsForm">
                    <?= csrf_field() ?>

                    <ul class="nav nav-tabs mb-4" id="settingsTab" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active small fw-semibold py-2" id="general-tab" data-bs-toggle="tab" data-bs-target="#general" type="button" role="tab">
                                <i class="bi bi-sliders me-1"></i> General
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link small fw-semibold py-2" id="email-tab" data-bs-toggle="tab" data-bs-target="#email" type="button" role="tab">
                                <i class="bi bi-envelope-at me-1"></i> Email Configuration
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link small fw-semibold py-2" id="security-tab" data-bs-toggle="tab" data-bs-target="#security" type="button" role="tab">
                                <i class="bi bi-shield-check me-1"></i> Security & System
                            </button>
                        </li>
                    </ul>

                    <div class="tab-content" id="settingsTabContent">
                        
                        <div class="tab-pane fade show active" id="general" role="tabpanel">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label required">Application Name</label>
                                    <input type="text" name="app_name" class="form-control" 
                                           value="<?= old('app_name', $settings['app_name'] ?? ($sysSettings['app_name'] ?? APP_NAME)) ?>" 
                                           placeholder="e.g. My System" required>
                                    <div class="form-text small text-muted">Displayed on page titles, sidebar, and system emails.</div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label required">Application Tagline</label>
                                    <input type="text" name="app_tagline" class="form-control" 
                                           value="<?= old('app_tagline', $settings['app_tagline'] ?? ($sysSettings['app_tagline'] ?? '')) ?>" 
                                           placeholder="Enter short tagline..." required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Organization / Company</label>
                                    <input type="text" name="company_name" class="form-control" 
                                           value="<?= old('company_name', $settings['company_name'] ?? ($sysSettings['company_name'] ?? '')) ?>" 
                                           placeholder="System owner name...">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Timezone</label>
                                    <?php $tz = old('timezone', $settings['timezone'] ?? ($sysSettings['timezone'] ?? 'Asia/Kuala_Lumpur')); ?>
                                    <select name="timezone" class="form-select">
                                        <option value="Asia/Kuala_Lumpur" <?= $tz === 'Asia/Kuala_Lumpur' ? 'selected' : '' ?>>Asia/Kuala_Lumpur (Malaysia)</option>
                                        <option value="Asia/Singapore" <?= $tz === 'Asia/Singapore' ? 'selected' : '' ?>>Asia/Singapore</option>
                                        <option value="UTC" <?= $tz === 'UTC' ? 'selected' : '' ?>>UTC / GMT</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="email" role="tabpanel">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label required">System Email Address</label>
                                    <input type="email" name="system_email" class="form-control" 
                                           value="<?= old('system_email', $settings['system_email'] ?? ($sysSettings['system_email'] ?? '')) ?>" 
                                           placeholder="e.g. noreply@domain.com" required>
                                    <div class="form-text small text-muted">Used as the sender address for automated notification emails.</div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Delivery Protocol</label>
                                    <?php $proto = old('email_protocol', $settings['email_protocol'] ?? ($sysSettings['email_protocol'] ?? 'mail')); ?>
                                    <select name="email_protocol" class="form-select">
                                        <option value="mail" <?= $proto === 'mail' ? 'selected' : '' ?>>PHP Mail (Default)</option>
                                        <option value="smtp" <?= $proto === 'smtp' ? 'selected' : '' ?>>SMTP (Recommended for production)</option>
                                    </select>
                                </div>
                                <div class="col-md-8">
                                    <label class="form-label">SMTP Host</label>
                                    <input type="text" name="smtp_host" class="form-control" 
                                           value="<?= old('smtp_host', $settings['smtp_host'] ?? ($sysSettings['smtp_host'] ?? '')) ?>" 
                                           placeholder="e.g. smtp.gmail.com">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">SMTP Port</label>
                                    <input type="number" name="smtp_port" class="form-control" 
                                           value="<?= old('smtp_port', $settings['smtp_port'] ?? ($sysSettings['smtp_port'] ?? '')) ?>" 
                                           placeholder="e.g. 465 or 587">
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="security" role="tabpanel">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Maintenance Mode</label>
                                    <div class="form-check form-switch mt-2">
                                        <?php $mMode = old('maintenance_mode', $settings['maintenance_mode'] ?? ($sysSettings['maintenance_mode'] ?? '0')); ?>
                                        <input class="form-check-input" type="checkbox" role="switch" name="maintenance_mode" id="maintenanceSwitch" value="1" <?= $mMode === '1' ? 'checked' : '' ?>>
                                        <label class="form-check-label text-secondary" for="maintenanceSwitch">Activate Maintenance Mode</label>
                                    </div>
                                    <div class="form-text small text-danger mt-1">When activated, regular users cannot access the system except Admin role.</div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Login Attempt Limit</label>
                                    <?php $attempts = old('login_attempts', $settings['login_attempts'] ?? ($sysSettings['login_attempts'] ?? '5')); ?>
                                    <select name="login_attempts" class="form-select">
                                        <option value="3" <?= $attempts === '3' ? 'selected' : '' ?>>3 Attempts</option>
                                        <option value="5" <?= $attempts === '5' ? 'selected' : '' ?>>5 Attempts (Standard)</option>
                                        <option value="10" <?= $attempts === '10' ? 'selected' : '' ?>>10 Attempts</option>
                                    </select>
                                    <div class="form-text small text-muted">Accounts will be temporarily throttled if invalid passwords exceed limit.</div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Session Lifespan</label>
                                    <div class="input-group">
                                        <input type="number" name="session_timeout" class="form-control" 
                                               value="<?= old('session_timeout', $settings['session_timeout'] ?? ($sysSettings['session_timeout'] ?? '7200')) ?>">
                                        <span class="input-group-text bg-light small">Seconds</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div class="form-actions mt-4 pt-3 border-top">
                        <button type="submit" class="btn btn-primary shadow-sm">
                            <i class="bi bi-check-circle-fill me-1"></i> Save Settings
                        </button>
                        <a href="<?= base_url('dashboard') ?>" class="btn btn-light border">
                            <i class="bi bi-x-lg me-1"></i> Cancel
                        </a>
                    </div>

                </form>

            </div>
        </div>

    </div>
</div>

<?= $this->endSection() ?>