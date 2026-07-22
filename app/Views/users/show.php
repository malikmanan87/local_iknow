<?= $this->extend('layouts/main') ?>
<?= $this->section('content') ?>

<div class="row justify-content-center">
    <div class="col-xl-8">

        <div class="card-panel mb-4">
            <div class="card-panel-header">
                <h5 class="card-panel-title">User Profile Information</h5>
                <a href="<?= base_url('users/edit/' . $user['id']) ?>" class="btn btn-warning btn-sm text-dark">
                    <i class="bi bi-pencil me-1"></i> Edit
                </a>
            </div>
            <div class="card-panel-body">

                <div class="d-flex align-items-center gap-4 mb-4 pb-4 border-bottom">
                    <div class="avatar-circle" style="width: 72px; height: 72px; font-size: 2rem;">
                        <?= strtoupper(substr($user['fullname'], 0, 1)) ?>
                    </div>
                    <div>
                        <h4 class="fw-bold mb-1"><?= esc($user['fullname']) ?></h4>
                        <p class="text-muted mb-0">@<?= esc($user['username']) ?></p>
                    </div>
                </div>

                <div class="row g-4">
                    <div class="col-md-6">
                        <label class="form-label text-muted small text-uppercase">Email Address</label>
                        <div class="fw-medium text-primary fs-5"><?= esc($user['email']) ?></div>
                    </div>

                    <div class="col-md-6">
                        <label class="form-label text-muted small text-uppercase">Phone Number</label>
                        <div class="fw-medium fs-6"><?= esc($user['phone'] ?? '-') ?></div>
                    </div>

                    <div class="col-md-6">
                        <label class="form-label text-muted small text-uppercase">System Role</label>
                        <div>
                            <?php
                            $roleClasses = ['admin' => 'badge-role-admin', 'manager' => 'badge-role-manager', 'user' => 'badge-role-user'];
                            $roleName    = $user['role_name'] ?? 'user';
                            ?>
                            <span class="badge-role fs-6 px-3 py-1 <?= $roleClasses[$roleName] ?? 'badge-role-user' ?>">
                                <?= esc($user['role_display'] ?? ucfirst($roleName)) ?>
                            </span>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <label class="form-label text-muted small text-uppercase">Account Status</label>
                        <div>
                            <?php if ($user['is_active']): ?>
                                <span class="badge-status badge-status-success fs-6 px-3 py-1">Active</span>
                            <?php else: ?>
                                <span class="badge-status badge-status-danger fs-6 px-3 py-1">Inactive</span>
                            <?php endif; ?>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <label class="form-label text-muted small text-uppercase">Registration Date</label>
                        <div class="text-secondary"><?= date('d M Y, h:i A', strtotime($user['created_at'])) ?></div>
                    </div>

                    <div class="col-md-6">
                        <label class="form-label text-muted small text-uppercase">Last Login</label>
                        <div class="text-secondary">
                            <?= $user['last_login'] ? date('d M Y, h:i A', strtotime($user['last_login'])) : '<span class="text-muted italic">Never logged in</span>' ?>
                        </div>
                    </div>
                </div>

                <div class="form-actions mt-4 pt-3 border-top">
                    <a href="<?= base_url('users') ?>" class="btn btn-light">
                        <i class="bi bi-arrow-left me-1"></i> Back to List
                    </a>
                </div>

            </div>
        </div>

    </div>
</div>

<?= $this->endSection() ?>