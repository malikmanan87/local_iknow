<?= $this->extend('layouts/main') ?>
<?= $this->section('content') ?>

<div class="row justify-content-center">
    <div class="col-xl-8">

        <div class="card-panel">
            <div class="card-panel-header py-3">
                <h5 class="card-panel-title">
                    <i class="bi <?= isset($role) ? 'bi-shield-check' : 'bi-shield-plus' ?> me-2 text-primary"></i>
                    <?= isset($role) ? 'Kemaskini Peranan' : 'Daftar Peranan Baru' ?>
                </h5>
            </div>
            <div class="card-panel-body">

                <form action="<?= isset($role) ? base_url('roles/update/' . $role['id']) : base_url('roles/store') ?>" method="post" id="roleForm">
                    <?= csrf_field() ?>

                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label required">Kod Peranan (System Name)</label>
                            <input type="text" 
                                   name="name" 
                                   class="form-control <?= isset($errors['name']) ? 'is-invalid' : '' ?>" 
                                   value="<?= old('name', $role['name'] ?? '') ?>" 
                                   placeholder="Cth: supervisor, auditor (Huruf kecil sahaja)"
                                   <?= (isset($role) && in_array($role['name'], ['admin', 'manager', 'user'])) ? 'readonly' : '' ?>
                                   required>
                            <div class="form-text small text-muted">Gunakan huruf kecil sahaja tanpa jarak atau simbol khas.</div>
                            <?php if (isset($errors['name'])): ?>
                                <div class="invalid-feedback"><?= $errors['name'] ?></div>
                            <?php endif; ?>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label required">Nama Paparan (Display Name)</label>
                            <input type="text" 
                                   name="display_name" 
                                   class="form-control <?= isset($errors['display_name']) ? 'is-invalid' : '' ?>" 
                                   value="<?= old('display_name', $role['display_name'] ?? '') ?>" 
                                   placeholder="Cth: Penyelia, Juruaudit" 
                                   required>
                            <div class="form-text small text-muted">Nama peranan komersial yang akan tertera pada UI sistem.</div>
                            <?php if (isset($errors['display_name'])): ?>
                                <div class="invalid-feedback"><?= $errors['display_name'] ?></div>
                            <?php endif; ?>
                        </div>

                        <div class="col-md-12">
                            <label class="form-label">Penerangan Peranan & Kebenaran Akses</label>
                            <textarea name="description" 
                                      class="form-control" 
                                      rows="4" 
                                      placeholder="Masukkan perincian skop tugas atau limitasi modul bagi peranan ini..."><?= old('description', $role['description'] ?? '') ?></textarea>
                        </div>
                    </div>

                    <div class="form-actions mt-4 pt-3">
                        <button type="submit" class="btn btn-primary shadow-sm">
                            <i class="bi bi-check-lg me-1"></i> 
                            <?= isset($role) ? 'Kemaskini Peranan' : 'Simpan Peranan' ?>
                        </button>
                        <a href="<?= base_url('roles') ?>" class="btn btn-light border">
                            <i class="bi bi-arrow-left me-1"></i> Batal
                        </a>
                    </div>

                </form>

            </div>
        </div>

    </div>
</div>

<?= $this->endSection() ?>