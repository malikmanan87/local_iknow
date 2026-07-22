<?= $this->extend('layouts/main') ?>
<?= $this->section('content') ?>

<div class="card-panel">
    <div class="card-panel-header py-3">
        <h5 class="card-panel-title">
            <i class="bi bi-box-seam-fill me-2 text-primary"></i>Item Management
        </h5>
        <a href="<?= base_url('items/create') ?>" class="btn btn-primary btn-sm shadow-sm">
            <i class="bi bi-plus-lg me-1"></i> Add New Item
        </a>
    </div>
    <div class="card-panel-body">
        <div class="table-responsive">
            <table id="itemsTable" class="table table-hover table-align-middle w-100">
                <thead class="table-light text-secondary">
                    <tr>
                        <th width="50" class="text-center">#</th>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Created By</th>
                        <th>Status</th>
                        <th>Last Updated</th>
                        <th width="120" class="text-center">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!empty($items)): ?>
                        <?php foreach ($items as $i => $item): ?>
                        <tr>
                            <td class="text-center text-muted fw-medium"><?= $i + 1 ?></td>
                            <td>
                                <div class="fw-medium text-dark"><?= esc($item['name']) ?></div>
                                <?php if (!empty($item['description'])): ?>
                                    <div class="text-muted small text-truncate" style="max-width: 250px;">
                                        <?= esc($item['description']) ?>
                                    </div>
                                <?php endif; ?>
                            </td>
                            <td>
                                <span class="badge bg-light text-secondary border px-2 py-1 small">
                                    <?= esc($item['category'] ?: 'No Category') ?>
                                </span>
                            </td>
                            <td>
                                <div class="d-flex align-items-center gap-1">
                                    <i class="bi bi-person text-muted small"></i>
                                    <span class="text-secondary small fw-medium">
                                        <?= esc($item['creator_name'] ?? 'System / None') ?>
                                    </span>
                                </div>
                            </td>
                            <td>
                                <?php
                                $statusClasses = [
                                    'active'   => 'badge-status-success',
                                    'pending'  => 'badge-status-warning',
                                    'inactive' => 'badge-status-danger'
                                ];
                                $statusLabels = [
                                    'active'   => 'Active',
                                    'pending'  => 'Pending',
                                    'inactive' => 'Inactive'
                                ];
                                $statusKey = esc($item['status']);
                                ?>
                                <span class="badge-status <?= $statusClasses[$statusKey] ?? 'bg-secondary text-white' ?> py-1">
                                    <?= $statusLabels[$statusKey] ?? ucfirst($statusKey) ?>
                                </span>
                            </td>
                            <td class="text-secondary small">
                                <?= date('d/m/Y h:i A', strtotime($item['updated_at'] ?? $item['created_at'])) ?>
                            </td>
                            <td class="text-center">
                                <div class="d-flex justify-content-center gap-1">
                                    <a href="<?= base_url('items/edit/' . $item['id']) ?>" class="btn-action btn-action-edit" title="Edit">
                                        <i class="bi bi-pencil"></i>
                                    </a>
                                    
                                    <button class="btn-action btn-action-delete" 
                                            title="Delete" 
                                            onclick="confirmDelete('<?= base_url('items/delete/' . $item['id']) ?>', '<?= esc($item['name']) ?>')">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script>
$(document).ready(function() {
    $('#itemsTable').DataTable({
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.8/i18n/en-GB.json',
            search: 'Search:',
            lengthMenu: 'Show _MENU_ entries',
            info: 'Showing _START_ to _END_ of _TOTAL_ entries',
            paginate: { previous: 'Previous', next: 'Next' }
        },
        order: [[0, 'asc']],
        pageLength: 10,
        columnDefs: [{ orderable: false, targets: [0, 3, 6] }]
    });
});
</script>
<?= $this->endSection() ?>