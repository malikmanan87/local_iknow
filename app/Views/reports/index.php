<?= $this->extend('layouts/main') ?>
<?= $this->section('content') ?>

<div class="d-flex justify-content-between align-items-center mb-4">
    <div>
        <h4 class="fw-bold text-dark mb-1">
            <i class="bi bi-file-earmark-bar-graph-fill text-primary me-2"></i><?= esc($pageTitle) ?>
        </h4>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb small mb-0">
<div class="d-flex justify-content-between align-items-center mb-4">
    <div>
        <h4 class="fw-bold text-dark mb-1">
            <i class="bi bi-file-earmark-bar-graph-fill text-primary me-2"></i><?= esc($pageTitle) ?>
        </h4>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb small mb-0">
                <li class="breadcrumb-item"><a href="<?= base_url('dashboard') ?>" class="text-decoration-none">Home</a></li>
                <li class="breadcrumb-item active" aria-current="page">System Reports</li>
            </ol>
        </nav>
    </div>
</div>

<div class="card border-0 shadow-sm mb-4">
    <div class="card-body p-4">
        <h6 class="fw-bold text-dark mb-3"><i class="bi bi-filter-left me-1 text-primary"></i> Filter & Generate Report</h6>
        
        <form action="<?= base_url('reports/generate') ?>" method="POST" autocomplete="off">
            <?= csrf_field() ?>
            <div class="row g-3">
                
                <div class="col-md-3">
                    <label for="start_date" class="form-label small fw-semibold text-secondary">Start Date</label>
                    <input type="date" class="form-control" id="start_date" name="start_date" 
                           value="<?= esc($filters['start_date'] ?? '') ?>">
                </div>

                <div class="col-md-3">
                    <label for="end_date" class="form-label small fw-semibold text-secondary">End Date</label>
                    <input type="date" class="form-control" id="end_date" name="end_date" 
                           value="<?= esc($filters['end_date'] ?? '') ?>">
                </div>

                <div class="col-md-3">
                    <label for="category" class="form-label small fw-semibold text-secondary">Category</label>
                    <select class="form-select" id="category" name="category">
                        <option value="">-- All Categories --</option>
                        <?php if (!empty($categories)): ?>
                            <?php foreach ($categories as $cat): ?>
                                <option value="<?= esc($cat) ?>" <?= (isset($filters['category']) && $filters['category'] === $cat) ? 'selected' : '' ?>>
                                    <?= esc($cat) ?>
                                </option>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </select>
                </div>

                <div class="col-md-3">
                    <label for="status" class="form-label small fw-semibold text-secondary">Item Status</label>
                    <select class="form-select" id="status" name="status">
                        <option value="">-- All Statuses --</option>
                        <option value="active" <?= (isset($filters['status']) && $filters['status'] === 'active') ? 'selected' : '' ?>>Active</option>
                        <option value="pending" <?= (isset($filters['status']) && $filters['status'] === 'pending') ? 'selected' : '' ?>>Pending</option>
                        <option value="inactive" <?= (isset($filters['status']) && $filters['status'] === 'inactive') ? 'selected' : '' ?>>Inactive</option>
                    </select>
                </div>

                <div class="col-md-12 text-end mt-4 pt-2 border-top">
                    <a href="<?= base_url('reports') ?>" class="btn btn-light border px-3 me-2">
                        <i class="bi bi-arrow-counterclockwise me-1"></i> Reset
                    </a>
                    <button type="submit" class="btn btn-primary px-4 fw-semibold shadow-sm">
                        <i class="bi bi-gear-fill me-1"></i> Generate Report
                    </button>
                </div>

            </div>
        </form>
    </div>
</div>

<?php if (isset($summary)): ?>
<div class="row g-3 mb-4">
    <div class="col-sm-6 col-md-3">
        <div class="card border-0 shadow-sm bg-primary text-white">
            <div class="card-body p-3 d-flex align-items-center justify-content-between">
                <div>
                    <span class="small opacity-75 d-block fw-medium">Total Records</span>
                    <h3 class="fw-bold mb-0"><?= $summary['total'] ?></h3>
                </div>
                <i class="bi bi-folder fs-1 opacity-50"></i>
            </div>
        </div>
    </div>
    <div class="col-sm-6 col-md-3">
        <div class="card border-0 shadow-sm bg-success text-white">
            <div class="card-body p-3 d-flex align-items-center justify-content-between">
                <div>
                    <span class="small opacity-75 d-block fw-medium">Active Status</span>
                    <h3 class="fw-bold mb-0"><?= $summary['active'] ?></h3>
                </div>
                <i class="bi bi-check-circle fs-1 opacity-50"></i>
            </div>
        </div>
    </div>
    <div class="col-sm-6 col-md-3">
        <div class="card border-0 shadow-sm bg-warning text-dark">
            <div class="card-body p-3 d-flex align-items-center justify-content-between">
                <div>
                    <span class="small opacity-75 d-block fw-medium">Pending Status</span>
                    <h3 class="fw-bold mb-0"><?= $summary['pending'] ?></h3>
                </div>
                <i class="bi bi-hourglass-split fs-1 opacity-50"></i>
            </div>
        </div>
    </div>
    <div class="col-sm-6 col-md-3">
        <div class="card border-0 shadow-sm bg-danger text-white">
            <div class="card-body p-3 d-flex align-items-center justify-content-between">
                <div>
                    <span class="small opacity-75 d-block fw-medium">Inactive</span>
                    <h3 class="fw-bold mb-0"><?= $summary['inactive'] ?></h3>
                </div>
                <i class="bi bi-x-circle fs-1 opacity-50"></i>
            </div>
        </div>
    </div>
</div>
<?php endif; ?>

<div class="card border-0 shadow-sm">
    <div class="card-body p-0">
        <div class="p-4 border-bottom d-flex justify-content-between align-items-center">
            <h6 class="fw-bold text-dark mb-0"><i class="bi bi-list-task me-1 text-primary"></i> Generated Report Data</h6>
            <?php if (!empty($reportData)): ?>
                <button onclick="window.print()" class="btn btn-outline-secondary btn-sm rounded px-3">
                    <i class="bi bi-printer me-1"></i> Print Report
                </button>
            <?php endif; ?>
        </div>

        <div class="table-responsive">
            <table class="table table-hover table-striped align-middle mb-0" style="min-width: 800px;">
                <thead class="table-light text-secondary">
                    <tr>
                        <th width="60" class="text-center">#</th>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Created By</th>
                        <th>Record Date</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!empty($reportData) && is_array($reportData)): ?>
                        <?php foreach ($reportData as $index => $item): ?>
                            <?php if (is_array($item)): ?>
                                <tr>
                                    <td class="text-center text-muted fw-medium"><?= $index + 1 ?></td>
                                    <td class="fw-semibold text-dark"><?= esc($item['name']) ?></td>
                                    <td><span class="badge bg-light text-dark border px-2 py-1.5"><?= esc($item['category']) ?></span></td>
                                    <td>
                                        <?php if ($item['status'] === 'active'): ?>
                                            <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1.5">Active</span>
                                        <?php elseif ($item['status'] === 'pending'): ?>
                                            <span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1.5">Pending</span>
                                        <?php else: ?>
                                            <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1.5">Inactive</span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="text-secondary small">
                                        <i class="bi bi-person me-1 text-muted"></i><?= esc($item['creator_name'] ?? 'System') ?>
                                    </td>
                                    <td class="text-muted small">
                                        <?= date('d/m/Y h:i A', strtotime($item['created_at'])) ?>
                                    </td>
                                </tr>
                            <?php endif; ?>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="6" class="text-center py-5 text-muted">
                                <div class="mb-2 text-secondary opacity-50" style="font-size: 3rem;">
                                    <i class="bi bi-clipboard-x-fill"></i>
                                </div>
                                <h6 class="fw-bold text-dark mb-1">No Report Data Displayed</h6>
                                <p class="text-muted small mb-0">Please select date range or filter parameters above, then click <strong>Generate Report</strong>.</p>
                            </td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?= $this->endSection() ?>