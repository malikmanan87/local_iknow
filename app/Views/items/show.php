<?= $this->extend('layouts/main') ?>
<?= $this->section('content') ?>

<div class="row justify-content-center">
    <div class="col-xl-8">

        <div class="card-panel">
            <div class="card-panel-header py-3">
                <h5 class="card-panel-title">
                    <i class="bi bi-info-circle-fill me-2 text-primary"></i>Butiran Maklumat Item
                </h5>
                <a href="<?= base_url('items/edit/' . $item['id']) ?>" class="btn btn-warning btn-sm shadow-sm text-dark">
                    <i class="bi bi-pencil me-1"></i> Edit Item
                </a>
            </div>
            <div class="card-panel-body">

                <div class="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
                    <div class="item-icon-sm bg-primary text-white border-0 fw-bold fs-5" style="width: 50px; height: 50px;">
                        <?= strtoupper(substr($item['name'], 0, 1)) ?>
                    </div>
                    <div>
                        <h4 class="fw-bold mb-0 text-dark"><?= esc($item['name']) ?></h4>
                        <span class="text-muted small">ID Item: #<?= esc($item['id']) ?></span>
                    </div>
                </div>

                <div class="row g-4">
                    <div class="col-md-6">
                        <label class="form-label text-muted small text-uppercase mb-1">Kategori</label>
                        <div class="fw-semibold text-secondary fs-6"><?= esc($item['category'] ?? '-') ?></div>
                    </div>

                    <div class="col-md-6">
                        <label class="form-label text-muted small text-uppercase mb-1">Status Semasa</label>
                        <div>
                            <?php
                            $statusMap = [
                                'active'   => ['class' => 'badge-status-success', 'label' => 'Aktif'],
                                'inactive' => ['class' => 'badge-status-danger', 'label' => 'Tidak Aktif'],
                                'pending'  => ['class' => 'badge-status-warning', 'label' => 'Tertunda'],
                            ];
                            $status = $statusMap[$item['status'] ?? 'pending'] ?? $statusMap['pending'];
                            ?>
                            <span class="badge-status px-3 py-1 <?= $status['class'] ?>">
                                <?= $status['label'] ?>
                            </span>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <label class="form-label text-muted small text-uppercase mb-1">Tarikh Pendaftaran</label>
                        <div class="text-dark">
                            <i class="bi bi-calendar-event me-1 text-muted"></i>
                            <?= date('d M Y, h:i A', strtotime($item['created_at'])) ?>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <label class="form-label text-muted small text-uppercase mb-1">Kemaskini Terakhir</label>
                        <div class="text-dark">
                            <i class="bi bi-clock-history me-1 text-muted"></i>
                            <?= $item['updated_at'] ? date('d M Y, h:i A', strtotime($item['updated_at'])) : '<span class="text-muted italic small">Belum pernah dikemaskini</span>' ?>
                        </div>
                    </div>

                    <div class="col-md-12">
                        <label class="form-label text-muted small text-uppercase mb-1">Penerangan / Deskripsi</label>
                        <div class="p-3 bg-light rounded border text-secondary" style="white-space: pre-line; min-height: 100px;">
                            <?= !empty($item['description']) ? esc($item['description']) : 'Tiada penerangan tambahan disediakan untuk item ini.' ?>
                        </div>
                    </div>
                </div>

                <div class="form-actions mt-4 pt-3 border-top">
                    <a href="<?= base_url('items') ?>" class="btn btn-light border">
                        <i class="bi bi-arrow-left me-1"></i> Kembali ke Senarai
                    </a>
                </div>

            </div>
        </div>

    </div>
</div>

<?= $this->endSection() ?>