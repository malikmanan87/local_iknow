<?= $this->extend('layouts/main') ?>
<?= $this->section('content') ?>

<div class="row justify-content-center">
    <div class="col-xl-8">

        <div class="card-panel">
            <div class="card-panel-header py-3">
                <h5 class="card-panel-title">
                    <i class="bi <?= isset($role) ? 'bi-shield-check' : 'bi-shield-plus' ?> me-2 text-primary"></i>
                    <?= isset($role) ? 'Edit Role' : 'Register New Role' ?>
                </h5>
            </div>
            <div class="card-panel-body">

                <form action="<?= isset($role) ? base_url('roles/update/' . $role['id']) : base_url('roles/store') ?>" method="post" id="roleForm">
                    <?= csrf_field() ?>

                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label required">Role Code (System Name)</label>
                            <input type="text" 
                                   name="name" 
                                   class="form-control <?= isset($errors['name']) ? 'is-invalid' : '' ?>" 
                                   value="<?= old('name', $role['name'] ?? '') ?>" 
                                   placeholder="e.g. supervisor, auditor (lowercase only)"
                                   <?= (isset($role) && in_array($role['name'], ['admin', 'manager', 'user'])) ? 'readonly' : '' ?>
                                   required>
                            <div class="form-text small text-muted">Use lowercase letters only without spaces or special symbols.</div>
                            <?php if (isset($errors['name'])): ?>
                                <div class="invalid-feedback"><?= $errors['name'] ?></div>
                            <?php endif; ?>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label required">Display Name</label>
                            <input type="text" 
                                   name="display_name" 
                                   class="form-control <?= isset($errors['display_name']) ? 'is-invalid' : '' ?>" 
                                   value="<?= old('display_name', $role['display_name'] ?? '') ?>" 
                                   placeholder="e.g. Supervisor, Auditor" 
                                   required>
                            <div class="form-text small text-muted">Display name visible across the system UI.</div>
                            <?php if (isset($errors['display_name'])): ?>
                                <div class="invalid-feedback"><?= $errors['display_name'] ?></div>
                            <?php endif; ?>
                        </div>

                        <div class="col-md-12">
                            <label class="form-label">Role Description & Access Rights</label>
                            <textarea name="description" 
                                       class="form-control" 
                                       rows="4" 
                                       placeholder="Enter details of duty scope or module permissions for this role..."><?= old('description', $role['description'] ?? '') ?></textarea>
                        </div>
                    </div>

                    <div class="form-actions mt-4 pt-3">
                        <button type="submit" class="btn btn-primary shadow-sm">
                            <i class="bi bi-check-lg me-1"></i> 
                            <?= isset($role) ? 'Update Role' : 'Save Role' ?>
                        </button>
                        <a href="<?= base_url('roles') ?>" class="btn btn-light border">
                            <i class="bi bi-arrow-left me-1"></i> Cancel
                        </a>
                    </div>

                </form>

            </div>
        </div>

    </div>
</div>

<?= $this->endSection() ?>