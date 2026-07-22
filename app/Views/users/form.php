<?= $this->extend('layouts/main') ?>
<?= $this->section('content') ?>

<div class="row justify-content-center">
    <div class="col-md-8">
        <div class="card-panel shadow-sm">
            <div class="card-panel-header py-3">
                <h5 class="card-panel-title">
                    <i class="bi bi-person-plus-fill me-2 text-primary"></i>
                    <?= isset($user) ? 'Edit User Information' : 'Register New User' ?>
                </h5>
                <a href="<?= base_url('users') ?>" class="btn btn-light btn-sm border">
                    <i class="bi bi-arrow-left me-1"></i> Back
                </a>
            </div>

            <div class="card-panel-body p-4">

                <?php if (session()->getFlashdata('errors')): ?>
                    <div class="alert alert-danger pb-0" role="alert">
                        <ul class="mb-2">
                            <?php foreach (session()->getFlashdata('errors') as $error): ?>
                                <li><?= esc($error) ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>

                <form action="<?= isset($user) ? base_url('users/update/' . $user['id']) : base_url('users/store') ?>" method="POST" enctype="multipart/form-data" autocomplete="off">
                    <?= csrf_field() ?>

                    <div class="row g-3">

                        <div class="col-md-12 mb-3 text-center">
                            <label class="form-label d-block fw-semibold text-secondary">Profile Photo (Avatar)</label>
                            <div class="mb-3">
                                <?php if (!empty($user['avatar']) && file_exists(FCPATH . 'uploads/avatars/' . $user['avatar'])): ?>
                                    <img src="<?= base_url('uploads/avatars/' . $user['avatar']) ?>"
                                        alt="Avatar"
                                        class="rounded-circle border img-thumbnail shadow-sm shadow-sm"
                                        style="width: 110px; height: 110px; object-fit: cover;">
                                <?php else: ?>
                                    <div class="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center fw-bold shadow-sm"
                                        style="width: 110px; height: 110px; font-size: 2.8rem;">
                                        <?= strtoupper(substr($user['fullname'] ?? 'U', 0, 1)) ?>
                                    </div>
                                <?php endif; ?>
                            </div>
                            <div class="max-w-xs mx-auto" style="max-width: 300px;">
                                <input type="file"
                                    class="form-control form-control-sm <?= isset(session()->getFlashdata('errors')['avatar']) ? 'is-invalid' : '' ?>"
                                    name="avatar"
                                    accept="image/png, image/jpeg, image/jpg">
                                <small class="text-muted d-block mt-1 text-xs">Format: JPG, JPEG, PNG (Maximum 2MB)</small>
                            </div>
                        </div>

                        <hr class="my-2 text-muted">

                        <div class="col-md-12">
                            <label for="fullname" class="form-label fw-medium text-secondary">Full Name <span class="text-danger">*</span></label>
                            <input type="text"
                                class="form-control <?= isset(session()->getFlashdata('errors')['fullname']) ? 'is-invalid' : '' ?>"
                                id="fullname"
                                name="fullname"
                                value="<?= old('fullname', $user['fullname'] ?? '') ?>"
                                placeholder="Enter full name" required>
                        </div>

                        <div class="col-md-6">
                            <label for="username" class="form-label fw-medium text-secondary">Username <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <span class="input-group-text bg-light text-muted">@</span>
                                <input type="text"
                                    class="form-control <?= isset(session()->getFlashdata('errors')['username']) ? 'is-invalid' : '' ?>"
                                    id="username"
                                    name="username"
                                    value="<?= old('username', $user['username'] ?? '') ?>"
                                    placeholder="e.g. john_99" required>
                            </div>
                        </div>

                        <div class="col-md-6">
                            <label for="email" class="form-label fw-medium text-secondary">Email Address <span class="text-danger">*</span></label>
                            <input type="email"
                                class="form-control <?= isset(session()->getFlashdata('errors')['email']) ? 'is-invalid' : '' ?>"
                                id="email"
                                name="email"
                                value="<?= old('email', $user['email'] ?? '') ?>"
                                placeholder="name@domain.com" required>
                        </div>

                        <div class="col-md-6">
                            <label for="phone" class="form-label fw-medium text-secondary">Phone Number</label>
                            <input type="text"
                                class="form-control <?= isset(session()->getFlashdata('errors')['phone']) ? 'is-invalid' : '' ?>"
                                id="phone"
                                name="phone"
                                value="<?= old('phone', $user['phone'] ?? '') ?>"
                                placeholder="e.g. 0123456789">
                        </div>

                        <div class="col-md-6">
                            <label for="role_id" class="form-label fw-medium text-secondary">System Role <span class="text-danger">*</span></label>
                            <select class="form-select <?= isset(session()->getFlashdata('errors')['role_id']) ? 'is-invalid' : '' ?>" id="role_id" name="role_id" required>
                                <option value="" disabled selected>-- Select Role --</option>
                                <?php foreach ($roles as $role): ?>
                                    <option value="<?= $role['id'] ?>" <?= old('role_id', $user['role_id'] ?? '') == $role['id'] ? 'selected' : '' ?>>
                                        <?= esc($role['display_name']) ?> (<?= esc($role['name']) ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="col-md-12">
                            <label for="password" class="form-label fw-medium text-secondary">
                                Password
                                <?= isset($user) ? '<span class="text-muted small">(Leave blank to keep unchanged)</span>' : '<span class="text-danger">*</span>' ?>
                            </label>
                            <input type="password"
                                class="form-control <?= isset(session()->getFlashdata('errors')['password']) ? 'is-invalid' : '' ?>"
                                id="password"
                                name="password"
                                placeholder="<?= isset($user) ? 'Enter new password' : 'Minimum 6 characters' ?>"
                                <?= isset($user) ? '' : 'required' ?>>
                        </div>

                        <div class="col-md-12 mt-3">
                            <div class="form-check form-switch card p-3 bg-light border d-flex flex-row align-items-center gap-3 ps-5">
                                <input class="form-check-input ms-0 mt-0 flex-shrink-0"
                                    type="checkbox"
                                    id="is_active"
                                    name="is_active"
                                    value="1"
                                    <?= old('is_active', $user['is_active'] ?? 1) == 1 ? 'checked' : '' ?>>
                                <div>
                                    <label class="form-check-label fw-semibold text-dark mb-0 d-block" for="is_active">Activate User Account</label>
                                    <small class="text-muted">If deactivated, this user will not be allowed to log into the system.</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-4 pt-3 border-top d-flex justify-content-end gap-2">
                        <a href="<?= base_url('users') ?>" class="btn btn-light border px-4">Cancel</a>
                        <button type="submit" class="btn btn-primary px-4">
                            <i class="bi bi-check-circle me-1"></i>
                            <?= isset($user) ? 'Save Changes' : 'Register User' ?>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<?= $this->endSection() ?>