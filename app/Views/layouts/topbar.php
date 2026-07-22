<header class="navbar navbar-expand bg-white border-bottom shadow-sm sticky-top px-3 py-2">
    <div class="container-fluid p-0 d-flex align-items-center justify-content-between">
        
        <div class="d-flex align-items-center gap-2">
            <button class="btn btn-light border-0 d-md-none" type="button" id="sidebarToggle" aria-label="Toggle Sidebar">
                <i class="bi bi-list fs-4"></i>
            </button>
            <div class="d-none d-sm-block">
                <span class="fw-semibold text-secondary small text-uppercase tracking-wider">
                    <?= APP_NAME ?? 'Sistem Urus' ?>
                </span>
            </div>
        </div>

        <div class="d-flex align-items-center gap-3">
            
            <?php 
                $db = \Config\Database::connect();
                $maintenanceQuery = $db->table('settings')->where('key', 'maintenance_mode')->get()->getRow();
                $isMaintenance = $maintenanceQuery ? (int)$maintenanceQuery->value : 0;
                
                if ($isMaintenance === 1 && session()->get('role') === 'admin'): 
            ?>
                <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 small">
                    <i class="bi bi-wrench-adjustable me-1"></i> Maintenance Mode Active
                </span>
            <?php endif; ?>

            <div class="dropdown">
                <button class="btn btn-light border d-flex align-items-center gap-2 px-2 py-1 rounded-pill dropdown-toggle shadow-sm" 
                        type="button" 
                        id="userMenuDropdown" 
                        data-bs-toggle="dropdown" 
                        aria-expanded="false">
                    
                    <?php 
                        $sessionAvatar = session()->get('avatar'); 
                        if (!empty($sessionAvatar) && file_exists(FCPATH . 'uploads/avatars/' . $sessionAvatar)): 
                    ?>
                        <img src="<?= base_url('uploads/avatars/' . $sessionAvatar) ?>" 
                             alt="Avatar" 
                             class="rounded-circle border" 
                             style="width: 30px; height: 30px; object-fit: cover;">
                    <?php else: ?>
                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold small shadow-sm" 
                             style="width: 30px; height: 30px; font-size: 0.85rem;">
                            <?= strtoupper(substr(session()->get('fullname') ?? 'U', 0, 1)) ?>
                        </div>
                    <?php endif; ?>

                    <span class="fw-medium text-dark d-none d-md-inline-block small me-1">
                        <?= esc(explode(' ', session()->get('fullname') ?? 'User')[0]) ?>
                    </span>
                </button>
                
                <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2 p-2 rounded-3 text-sm" style="min-width: 220px;" aria-labelledby="userMenuDropdown">
                    
                    <li class="px-3 py-3 bg-light rounded-2 mb-2 border text-center">
                        <div class="mb-2">
                            <?php if (!empty($sessionAvatar) && file_exists(FCPATH . 'uploads/avatars/' . $sessionAvatar)): ?>
                                <img src="<?= base_url('uploads/avatars/' . $sessionAvatar) ?>" 
                                     alt="Avatar Large" 
                                     class="rounded-circle border" 
                                     style="width: 55px; height: 55px; object-fit: cover;">
                            <?php else: ?>
                                <div class="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center fw-bold mx-auto" 
                                     style="width: 55px; height: 55px; font-size: 1.5rem;">
                                    <?= strtoupper(substr(session()->get('fullname') ?? 'U', 0, 1)) ?>
                                </div>
                            <?php endif; ?>
                        </div>
                        <div class="fw-bold text-dark text-truncate small"><?= esc(session()->get('fullname') ?? 'User Name') ?></div>
                        <div class="text-muted text-xs text-truncate">@<?= esc(session()->get('username') ?? 'username') ?></div>
                        <span class="badge bg-dark text-white text-xs mt-1 px-2 py-0.5" style="font-size: 0.7rem;">
                            <?= strtoupper(esc(session()->get('role') ?? 'User')) ?>
                        </span>
                    </li>
                    
                    <li>
                        <a class="dropdown-item py-2 rounded-2 d-flex align-items-center text-secondary-hover" href="<?= base_url('profile') ?>">
                            <i class="bi bi-person me-2 text-primary fs-5"></i> 
                            <span>My Profile</span>
                        </a>
                    </li>
                    
                    <?php if (session()->get('role') === 'admin'): ?>
                        <li>
                            <a class="dropdown-item py-2 rounded-2 d-flex align-items-center" href="<?= base_url('settings') ?>">
                                <i class="bi bi-gear me-2 text-secondary fs-5"></i> 
                                <span>System Settings</span>
                            </a>
                        </li>
                    <?php endif; ?>
                    
                    <li><hr class="dropdown-divider my-2"></li>
                    
                    <li>
                        <a class="dropdown-item py-2 rounded-2 text-danger d-flex align-items-center bg-danger-hover" href="<?= base_url('logout') ?>">
                            <i class="bi bi-box-arrow-right me-2 fs-5"></i> 
                            <span class="fw-semibold">Logout</span>
                        </a>
                    </li>
                </ul>
            </div>

        </div>
    </div>
</header>