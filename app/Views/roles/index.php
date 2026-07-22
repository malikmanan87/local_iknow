<?= $this->extend('layouts/main') ?>
<?= $this->section('content') ?>

<div class="card-panel">
    <div class="card-panel-header py-3">
        <h5 class="card-panel-title">
            <i class="bi bi-shield-lock-fill me-2 text-primary"></i>Peranan & Kebenaran (Roles)
        </h5>
        <a href="<?= base_url('roles/create') ?>" class="btn btn-primary btn-sm shadow-sm">
            <i class="bi bi-plus-lg me-1"></i> Tambah Peranan
        </a>
    </div>
    <div class="card-panel-body">
        <div class="table-responsive">
            <table id="rolesTable" class="table table-hover table-align-middle w-100">
                <thead class="table-light text-secondary">
                    <tr>
                        <th width="50" class="text-center">#</th>
                        <th>Kod Peranan (System Name)</th>
                        <th>Nama Paparan (Display Name)</th>
                        <th>Penerangan Tugas (Description)</th>
                        <th width="120" class="text-center">Tindakan</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!empty($roles)): ?>
                        <?php foreach ($roles as $i => $role): ?>
                        <tr>
                            <td class="text-center text-muted fw-medium"><?= $i + 1 ?></td>
                            <td>
                                <?php
                                // Pemetaan warna lencana mengikut kod peranan (English role names)
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
                                    // Mengunci fungsi padam untuk 3 peranan asas bawaan sistem (Seeder defaults)
                                    if (!in_array($role['name'], ['admin', 'manager', 'user'])): 
                                    ?>
                                        <button class="btn-action btn-action-delete" 
                                                title="Padam" 
                                                onclick="confirmDelete('<?= base_url('roles/delete/' . $role['id']) ?>', '<?= esc($role['display_name']) ?>')">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    <?php else: ?>
                                        <button class="btn-action opacity-25" title="Sistem Default (Tidak boleh dipadam)" disabled>
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
            url: 'https://cdn.datatables.net/plug-ins/1.13.8/i18n/ms.json',
            search: 'Cari:',
            lengthMenu: 'Papar _MENU_ rekod',
            info: 'Menunjukkan _START_ hingga _END_ daripada _TOTAL_ rekod',
            paginate: { previous: 'Sebelum', next: 'Seterusnya' }
        },
        order: [[1, 'asc']],
        pageLength: 10,
        columnDefs: [{ orderable: false, targets: [0, 3, 4] }]
    });
});
</script>
<?= $this->endSection() ?>