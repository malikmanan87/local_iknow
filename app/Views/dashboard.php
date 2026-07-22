<?= $this->extend('layouts/main') ?>
<?= $this->section('content') ?>

<div class="d-flex justify-content-between align-items-center mb-4">
    <div>
        <h4 class="fw-bold text-dark mb-1">
            <i class="bi bi-speedometer2 text-primary me-2"></i>Main Dashboard
        </h4>
        <p class="text-muted small mb-0">Welcome back, <strong><?= esc(explode(' ', session('fullname') ?? 'User')[0]) ?></strong>. Here is the summary of today's system status.</p>
    </div>
    <div class="text-end d-none d-sm-block">
        <span class="badge bg-white text-dark border px-3 py-2 shadow-sm rounded-pill small">
            <i class="bi bi-calendar3 text-primary me-2"></i><?= date('d M Y') ?>
        </span>
    </div>
</div>

<div class="row g-3 mb-4">
    <div class="col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-3">
            <div class="card-body p-3 d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small d-block fw-medium mb-1">Total Items</span>
                    <h3 class="fw-bold text-dark mb-0"><?= $totalItems ?? 0 ?></h3>
                </div>
                <div class="bg-primary-subtle text-primary rounded-3 p-3 fs-3 d-flex align-items-center justify-content-center" style="width: 55px; height: 55px;">
                    <i class="bi bi-box-seam"></i>
                </div>
            </div>
        </div>
    </div>

    <div class="col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-3">
            <div class="card-body p-3 d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small d-block fw-medium mb-1">Active Items</span>
                    <h3 class="fw-bold text-success mb-0"><?= $activeItems ?? 0 ?></h3>
                </div>
                <div class="bg-success-subtle text-success rounded-3 p-3 fs-3 d-flex align-items-center justify-content-center" style="width: 55px; height: 55px;">
                    <i class="bi bi-check-circle"></i>
                </div>
            </div>
        </div>
    </div>

    <div class="col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-3">
            <div class="card-body p-3 d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small d-block fw-medium mb-1">System Users</span>
                    <h3 class="fw-bold text-dark mb-0"><?= $totalUsers ?? 0 ?></h3>
                </div>
                <div class="bg-info-subtle text-info rounded-3 p-3 fs-3 d-flex align-items-center justify-content-center" style="width: 55px; height: 55px;">
                    <i class="bi bi-people"></i>
                </div>
            </div>
        </div>
    </div>

    <div class="col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm rounded-3">
            <div class="card-body p-3 d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small d-block fw-medium mb-1">Today's Activity</span>
                    <h3 class="fw-bold text-warning mb-0"><?= $todayLogs ?? 0 ?></h3>
                </div>
                <div class="bg-warning-subtle text-warning-emphasis rounded-3 p-3 fs-3 d-flex align-items-center justify-content-center" style="width: 55px; height: 55px;">
                    <i class="bi bi-clock-history"></i>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row g-4 mb-4">
    <div class="col-md-12">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3 d-flex align-items-center justify-content-between border-bottom-0">
                <h6 class="fw-bold text-dark mb-0">
                    <i class="bi bi-bar-chart-line-fill text-primary me-2"></i>Monthly Statistics
                </h6>
                <span class="badge bg-light text-secondary border">Year <?= date('Y') ?></span>
            </div>
            <div class="card-body">
                <div style="position: relative; height: 320px; width: 100%;">
                    <canvas id="monthlyChart"></canvas>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row g-4">
    
    <div class="col-lg-6">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white py-3 d-flex align-items-center justify-content-between border-bottom-0">
                <h6 class="fw-bold text-dark mb-0">
                    <i class="bi bi-journal-text text-secondary me-2"></i>General Activity Logs
                </h6>
                <a href="<?= base_url('activity-logs') ?>" class="btn btn-light btn-sm border px-2.5">View All</a>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light text-secondary small">
                            <tr>
                                <th>Time</th>
                                <th>User</th>
                                <th>Action & Description</th>
                            </tr>
                        </thead>
                        <tbody class="small text-secondary">
                            <?php if (!empty($recentLogs)): ?>
                                <?php foreach ($recentLogs as $log): ?>
                                    <tr>
                                        <td class="text-muted" style="white-space: nowrap;"><?= date('d/m h:i A', strtotime($log['created_at'])) ?></td>
                                        <td class="fw-semibold text-dark">@<?= esc($log['username'] ?? 'System') ?></td>
                                        <td class="text-wrap">
                                            <span class="badge bg-light text-dark border me-1 small"><?= esc($log['action']) ?></span>
                                            <span class="text-dark"><?= esc($log['description']) ?></span>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="3" class="text-center py-4 text-muted italic">No activity logs recorded.</td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <div class="col-lg-6">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white py-3 d-flex align-items-center justify-content-between border-bottom-0">
                <h6 class="fw-bold text-dark mb-0">
                    <i class="bi bi-box-seam-fill text-primary me-2"></i>Recent Item Activity
                </h6>
                <a href="<?= base_url('items') ?>" class="btn btn-light btn-sm border px-2.5">Manage Items</a>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light text-secondary small">
                            <tr>
                                <th>Item Name</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th class="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody class="small text-secondary">
                            <?php if (!empty($recentItems)): ?>
                                <?php foreach ($recentItems as $item): ?>
                                    <tr>
                                        <td>
                                            <div class="fw-semibold text-dark text-truncate" style="max-width: 180px;">
                                                <?= esc($item['name']) ?>
                                            </div>
                                            <small class="text-muted d-block" style="font-size: 0.75rem;">
                                                By: <?= esc(explode(' ', $item['creator_name'] ?? 'System')[0]) ?> • <?= date('d/m/y', strtotime($item['updated_at'])) ?>
                                            </small>
                                        </td>
                                        <td>
                                            <span class="badge bg-light text-dark border px-2 py-1"><?= esc($item['category'] ?: 'None') ?></span>
                                        </td>
                                        <td>
                                            <?php if ($item['status'] === 'active'): ?>
                                                <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Active</span>
                                            <?php elseif ($item['status'] === 'pending'): ?>
                                                <span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">Pending</span>
                                            <?php else: ?>
                                                <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">Inactive</span>
                                            <?php endif; ?>
                                        </td>
                                        <td class="text-center">
                                            <a href="<?= base_url('items/show/' . $item['id']) ?>" class="btn btn-light btn-sm border py-0.5 px-2" title="View Details">
                                                <i class="bi bi-eye"></i>
                                            </a>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="4" class="text-center py-4 text-muted italic">No recent item records found.</td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>
$(document).ready(function() {
    
    const ctxMonthly = document.getElementById('monthlyChart').getContext('2d');
    
    const monthlyLabels = <?= json_encode($monthlyLabels ?? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']) ?>;
    const monthlyData   = <?= json_encode($monthlyData ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) ?>;

    new Chart(ctxMonthly, {
        type: 'bar',
        data: {
            labels: monthlyLabels,
            datasets: [{
                label: 'New Items Added',
                data: monthlyData,
                backgroundColor: '#4e73df',
                borderColor: '#4e73df',
                borderRadius: 5,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.raw} new items`;
                        }
                    }
                }
            }
        }
    });

});
</script>
<?= $this->endSection() ?>