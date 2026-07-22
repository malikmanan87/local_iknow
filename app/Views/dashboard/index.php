<?= $this->extend('layouts/main') ?>
<?= $this->section('content') ?>

<div class="row g-4 mb-4">

    <div class="col-sm-6 col-xl-3">
        <div class="stat-card stat-card-primary">
            <div class="stat-info">
                <span class="stat-label">Total Users</span>
                <span class="stat-value"><?= $totalUsers ?? 0 ?></span>
                <span class="stat-change positive"><i class="bi bi-arrow-up-short"></i> 12% this month</span>
            </div>
            <div class="stat-icon">
                <i class="bi bi-people-fill"></i>
            </div>
        </div>
    </div>

    <div class="col-sm-6 col-xl-3">
        <div class="stat-card stat-card-success">
            <div class="stat-info">
                <span class="stat-label">Active Records</span>
                <span class="stat-value"><?= $activeRecords ?? 0 ?></span>
                <span class="stat-change positive"><i class="bi bi-arrow-up-short"></i> 8% this month</span>
            </div>
            <div class="stat-icon">
                <i class="bi bi-check-circle-fill"></i>
            </div>
        </div>
    </div>

    <div class="col-sm-6 col-xl-3">
        <div class="stat-card stat-card-warning">
            <div class="stat-info">
                <span class="stat-label">Pending Records</span>
                <span class="stat-value"><?= $pendingRecords ?? 0 ?></span>
                <span class="stat-change negative"><i class="bi bi-arrow-down-short"></i> 3% this month</span>
            </div>
            <div class="stat-icon">
                <i class="bi bi-clock-fill"></i>
            </div>
        </div>
    </div>

    <div class="col-sm-6 col-xl-3">
        <div class="stat-card stat-card-danger">
            <div class="stat-info">
                <span class="stat-label">Action Needed</span>
                <span class="stat-value"><?= $actionNeeded ?? 0 ?></span>
                <span class="stat-change neutral"><i class="bi bi-dash"></i> No change</span>
            </div>
            <div class="stat-icon">
                <i class="bi bi-exclamation-triangle-fill"></i>
            </div>
        </div>
    </div>

</div>

<div class="row g-4 mb-4">

    <div class="col-lg-12">
        <div class="card-panel">
            <div class="card-panel-header align-items-center py-3">
                <h5 class="card-panel-title">
                    <i class="bi bi-bar-chart-line-fill me-2 text-primary"></i>Monthly Statistics
                </h5>
                <div class="card-panel-actions">
                    <select class="form-select form-select-sm border-light-subtle shadow-sm" id="chartYearSelect" style="width:auto;">
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                    </select>
                </div>
            </div>
            <div class="card-panel-body">
                <div style="position: relative; height: 280px; width: 100%;">
                    <canvas id="monthlyChart"></canvas>
                </div>
            </div>
        </div>
    </div>

</div>

<div class="row g-4">
    <div class="col-12">
        <div class="card-panel">
            <div class="card-panel-header py-3">
                <h5 class="card-panel-title">
                    <i class="bi bi-list-task me-2 text-primary"></i>Recent Item Activity
                </h5>
                <a href="<?= base_url('items') ?>" class="btn btn-sm btn-light border shadow-sm">
                    View All <i class="bi bi-arrow-right ms-1"></i>
                </a>
            </div>
            <div class="card-panel-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover table-align-middle mb-0">
                        <thead class="table-light text-secondary">
                            <tr>
                                <th width="60" class="text-center">#</th>
                                <th>Item Name</th>
                                <th>Category</th>
                                <th width="140" class="text-center">Status</th>
                                <th width="140">Created Date</th>
                                <th width="120" class="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (!empty($recentItems)): ?>
                                <?php foreach ($recentItems as $i => $item): ?>
                                <tr>
                                    <td class="text-center text-muted fw-medium"><?= $i + 1 ?></td>
                                    <td>
                                        <div class="d-flex align-items-center gap-3">
                                            <div class="item-icon-sm bg-primary-subtle text-primary border-0 fw-semibold">
                                                <?= strtoupper(substr($item['name'], 0, 1)) ?>
                                            </div>
                                            <span class="fw-medium text-dark"><?= esc($item['name']) ?></span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="text-secondary"><?= esc($item['category'] ?? '-') ?></span>
                                    </td>
                                    <td class="text-center">
                                        <?php
                                        $statusMap = [
                                            'active'   => ['class' => 'badge-status-success', 'label' => 'Active'],
                                            'inactive' => ['class' => 'badge-status-danger', 'label' => 'Inactive'],
                                            'pending'  => ['class' => 'badge-status-warning', 'label' => 'Pending'],
                                        ];
                                        $status = $statusMap[$item['status'] ?? 'pending'] ?? $statusMap['pending'];
                                        ?>
                                        <span class="badge-status d-inline-block w-75 py-1 <?= $status['class'] ?>">
                                            <?= $status['label'] ?>
                                        </span>
                                    </td>
                                    <td class="text-secondary">
                                        <i class="bi bi-calendar3 me-1 small"></i>
                                        <?= date('d/m/Y', strtotime($item['created_at'])) ?>
                                    </td>
                                    <td class="text-center">
                                        <div class="d-flex justify-content-center gap-1">
                                            <a href="<?= base_url('items/show/' . $item['id']) ?>" class="btn-action btn-action-view" title="View">
                                                <i class="bi bi-eye"></i>
                                            </a>
                                            <a href="<?= base_url('items/edit/' . $item['id']) ?>" class="btn-action btn-action-edit" title="Edit">
                                                <i class="bi bi-pencil"></i>
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="6" class="text-center py-5 text-muted">
                                        <div class="py-3">
                                            <i class="bi bi-inbox fs-1 d-block mb-3 text-muted" style="opacity: 0.5;"></i>
                                            <span class="fw-medium">No item records found at this time</span>
                                        </div>
                                    </td>
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
<script>
document.addEventListener("DOMContentLoaded", function() {
    
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Active Records',
                data: [12, 19, 15, 25, 22, 30, 28, 35, 40, 38, 42, 50],
                backgroundColor: 'rgba(99, 102, 241, 0.85)',
                hoverBackgroundColor: 'rgba(99, 102, 241, 1)',
                borderRadius: 4,
                barPercentage: 0.5
            }, {
                label: 'Completed Records',
                data: [8, 15, 10, 20, 18, 25, 22, 30, 35, 32, 38, 45],
                backgroundColor: 'rgba(16, 185, 129, 0.85)',
                hoverBackgroundColor: 'rgba(16, 185, 129, 1)',
                borderRadius: 4,
                barPercentage: 0.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    position: 'bottom',
                    labels: { boxWidth: 12, usePointStyle: true, font: { family: 'Inter', weight: 500 } }
                } 
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Inter' } } },
                x: { grid: { display: false }, ticks: { font: { family: 'Inter' } } }
            }
        }
    });

});
</script>
<?= $this->endSection() ?>