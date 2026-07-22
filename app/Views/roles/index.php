<?= $this->extend('layouts/main') ?>
<?= $this->section('content') ?>

<div class="card-panel">
    <div class="card-panel-header py-3">
        <h5 class="card-panel-title">
            <i class="bi bi-shield-lock-fill me-2 text-primary"></i>Roles & Permissions
        </h5>
        <a href="<?= base_url('roles/create') ?>" class="btn btn-primary btn-sm shadow-sm">
            <i class="bi bi-plus-lg me-1"></i> Add Role
        </a>
    </div>
    <div class="card-panel-body">
        <div class="table-responsive">
            <table id="rolesTable" class="table table-hover table-align-middle w-100">
                <thead class="table-light text-secondary">
                    <tr>
                        <th width="50" class="text-center">#</th>
                        <th>Role Code (System Name)</th>
                        <th>Display Name</th>
                        <th>Description</th>
                        <th width="120" class="text-center">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!empty($roles)): ?>
                        <?php foreach ($roles as $i => $role): ?>
                        <tr>
                            <td class="text-center text-muted fw-medium"><?= $i + 1 ?></td>
                            <td>
                                <?php
                                $roleClasses = ['admin' => 'badge-role-admin', 'manager' => 'badge-role-manager', 'user' => 'badge-role-user'];
                                $roleName = esc($role['name']);
                                ?>
                                <span class="badge-role fw-semibold <?= $roleClasses[$roleName] ?? 'bg-secondary text-white' ?>">
                                    <?= $roleName ?>
                                </span>
                            </td>
                            <td><span class="fw-medium text-dark"><?= esc($role['display_name']) ?></span></td>
                            <td><span class="text-secondary small"><?= esc($role['description'] ?? '-') ?></span></td>
                            <td class="text-center">
                                <div class="d-flex justify-content-center gap-1">
                                    <a href="<?= base_url('roles/edit/' . $role['id']) ?>" class="btn-action btn-action-edit" title="Edit">
                                        <i class="bi bi-pencil"></i>
                                    </a>
                                    
                                    <?php 
                                    if (!in_array($role['name'], ['admin', 'manager', 'user'])): 
                                    ?>
                                        <button class="btn-action btn-action-delete" 
                                                title="Delete" 
                                                onclick="confirmDelete('<?= base_url('roles/delete/' . $role['id']) ?>', '<?= esc($role['display_name']) ?>')">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    <?php else: ?>
                                        <button class="btn-action opacity-25" title="System Default (Cannot be deleted)" disabled>
                                            <i class="bi bi-trash text-muted"></i>
                                        </button>
                                    <?php endif; ?>
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
    $('#rolesTable').DataTable({
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.8/i18n/en-GB.json',
            search: 'Search:',
            lengthMenu: 'Show _MENU_ entries',
            info: 'Showing _START_ to _END_ of _TOTAL_ entries',
            paginate: { previous: 'Previous', next: 'Next' }
        },
        order: [[1, 'asc']],
        pageLength: 10,
        columnDefs: [{ orderable: false, targets: [0, 3, 4] }]
    });
});
</script>
<?= $this->endSection() ?>