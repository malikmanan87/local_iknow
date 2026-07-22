<?= $this->extend('layouts/main') ?>
<?= $this->section('content') ?>

<div class="card-panel">
    <div class="card-panel-header">
        <h5 class="card-panel-title">Jejak Log Aktiviti Sistem</h5>
    </div>
    <div class="card-panel-body">
        <div class="table-responsive">
            <table id="logsTable" class="table table-hover table-align-middle w-100">
                <thead class="table-light text-secondary">
                    <tr>
                        <th width="50" class="text-center">#</th>
                        <th width="160">Tarikh & Masa</th>
                        <th width="120">Pengguna</th>
                        <th width="150">Tindakan</th>
                        <th>Perincian / Deskripsi</th>
                        <th width="130">Alamat IP</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($logs as $i => $log): ?>
                        <tr>
                            <td class="text-center text-muted fw-medium"><?= $i + 1 ?></td>
                            <td class="text-secondary small"><?= date('d/m/Y h:i:A', strtotime($log['created_at'])) ?></td>
                            <td>
                                <span class="fw-semibold text-dark">@<?= esc($log['username']) ?></span>
                            </td>
                            <td>
                                <?php
                                // Letak warna badge mengikut jenis tindakan
                                $badgeClass = 'bg-secondary';
                                if (str_contains($log['action'], 'Masuk') || str_contains($log['action'], 'Login')) $badgeClass = 'bg-success';
                                if (str_contains($log['action'], 'Padam') || str_contains($log['action'], 'Delete')) $badgeClass = 'bg-danger';
                                if (str_contains($log['action'], 'Kemaskini') || str_contains($log['action'], 'Update')) $badgeClass = 'bg-warning text-dark';
                                if (str_contains($log['action'], 'Tambah') || str_contains($log['action'], 'Create')) $badgeClass = 'bg-info text-dark';
                                ?>
                                <span class="badge <?= $badgeClass ?> small px-2 py-1"><?= esc($log['action']) ?></span>
                            </td>
                            <td class="text-secondary small"><?= esc($log['description']) ?></td>
                            <td class="text-mono small text-muted"><i class="bi bi-laptop me-1"></i><?= esc($log['ip_address']) ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script>
    $(document).ready(function() {
        $('#logsTable').DataTable({
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.13.8/i18n/ms.json',
                search: 'Cari:',
                lengthMenu: 'Papar _MENU_ rekod',
                info: 'Menunjukkan _START_ hingga _END_ daripada _TOTAL_ rekod',
                paginate: {
                    previous: 'Sebelum',
                    next: 'Seterusnya'
                }
            },
            order: [
                [1, 'desc']
            ], // Susun ikut tarikh & masa terbaru dahulu
            pageLength: 10,
            columnDefs: [{
                orderable: false,
                targets: [0]
            }]
        });
    });
</script>
<?= $this->endSection() ?>