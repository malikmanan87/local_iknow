<?php
$currentUrl = current_url();
$uri = service('uri');
$segment1 = $uri->getSegment(1);
?>

<nav class="sidebar" id="sidebar">

    <div class="sidebar-brand">
        <a href="<?= base_url('dashboard') ?>" class="brand-link">
            <div class="brand-icon">
                <i class="bi bi-grid-3x3-gap-fill"></i>
            </div>
            <span class="brand-name"><?= APP_NAME ?></span>
        </a>
        <button class="sidebar-toggle-btn" id="sidebarToggleBtn">
            <i class="bi bi-list"></i>
        </button>
    </div>

    <div class="sidebar-menu">
        <ul class="menu-list">

            <li class="menu-item <?= $segment1 === 'dashboard' ? 'active' : '' ?>">
                <a href="<?= base_url('dashboard') ?>" class="menu-link">
                    <span class="menu-icon"><i class="bi bi-speedometer2"></i></span>
                    <span class="menu-label">Dashboard</span>
                </a>
            </li>

            <li class="menu-separator"><span>Module Management</span></li>

            <li class="menu-item <?= $segment1 === 'items' ? 'active' : '' ?>">
                <a href="<?= base_url('items') ?>" class="menu-link">
                    <span class="menu-icon"><i class="bi bi-box-seam-fill"></i></span>
                    <span class="menu-label">Items</span>
                </a>
            </li>

            <li class="menu-item <?= $segment1 === 'reports' ? 'active' : '' ?>">
                <a href="<?= base_url('reports') ?>" class="menu-link">
                    <span class="menu-icon"><i class="bi bi-file-earmark-bar-graph-fill"></i></span>
                    <span class="menu-label">Reports</span>
                </a>
            </li>

            <?php if (session('role') === 'admin'): ?>
                <li class="menu-separator"><span>System Administration</span></li>

                <li class="menu-item <?= $segment1 === 'users' ? 'active' : '' ?>">
                    <a href="<?= base_url('users') ?>" class="menu-link">
                        <span class="menu-icon"><i class="bi bi-people-fill"></i></span>
                        <span class="menu-label">Users</span>
                    </a>
                </li>

                <li class="menu-item <?= $segment1 === 'roles' ? 'active' : '' ?>">
                    <a href="<?= base_url('roles') ?>" class="menu-link">
                        <span class="menu-icon"><i class="bi bi-shield-lock-fill"></i></span>
                        <span class="menu-label">Roles & Permissions</span>
                    </a>
                </li>

                <li class="menu-item <?= $segment1 === 'activity-logs' ? 'active' : '' ?>">
                    <a href="<?= base_url('activity-logs') ?>" class="menu-link">
                        <span class="menu-icon"><i class="bi bi-journal-text"></i></span>
                        <span class="menu-label">Activity Logs</span>
                    </a>
                </li>

                <li class="menu-item <?= $segment1 === 'settings' ? 'active' : '' ?>">
                    <a href="<?= base_url('settings') ?>" class="menu-link">
                        <span class="menu-icon"><i class="bi bi-gear-fill"></i></span>
                        <span class="menu-label">Settings</span>
                    </a>
                </li>
            <?php endif; ?>

        </ul>
    </div>

    <div class="sidebar-footer">
        <a href="<?= base_url('logout') ?>" class="logout-btn" onclick="confirmLogout(event, this)">
            <i class="bi bi-box-arrow-left"></i>
            <span>Logout</span>
        </a>
    </div>

</nav>

<div class="sidebar-overlay" id="sidebarOverlay"></div>