<?= $this->extend('layouts/main') ?>
<?= $this->section('content') ?>

<div class="row justify-content-center">
    <div class="col-xl-8">

        <div class="card-panel">
            <div class="card-panel-header py-3">
                <h5 class="card-panel-title">
                    <i class="bi <?= isset($item) ? 'bi-pencil-square' : 'bi-plus-circle-fill' ?> me-2 text-primary"></i>
                    <?= isset($item) ? 'Edit Item Details' : 'Register New Item' ?>
                </h5>
            </div>
            <div class="card-panel-body">

                <form action="<?= isset($item) ? base_url('items/update/' . $item['id']) : base_url('items/store') ?>" method="post" id="itemForm">
                    <?= csrf_field() ?>

                    <div class="row g-3">
                        <div class="col-md-12">
                            <label class="form-label required">Item Name</label>
                            <input type="text" 
                                   name="name" 
                                   class="form-control <?= isset($errors['name']) ? 'is-invalid' : '' ?>" 
                                   value="<?= old('name', $item['name'] ?? '') ?>" 
                                   placeholder="e.g. Dell Latitude Laptop" 
                                   required>
                            <?php if (isset($errors['name'])): ?>
                                <div class="invalid-feedback"><?= $errors['name'] ?></div>
                            <?php endif; ?>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label required">Category</label>
                            <input type="text" 
                                   name="category" 
                                   class="form-control <?= isset($errors['category']) ? 'is-invalid' : '' ?>" 
                                   value="<?= old('category', $item['category'] ?? '') ?>" 
                                   placeholder="e.g. Electronics, Furniture" 
                                   required>
                            <?php if (isset($errors['category'])): ?>
                                <div class="invalid-feedback"><?= $errors['category'] ?></div>
                            <?php endif; ?>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label required">Item Status</label>
                            <select name="status" class="form-select <?= isset($errors['status']) ? 'is-invalid' : '' ?>" required>
                                <?php
                                $currentStatus = old('status', $item['status'] ?? 'pending');
                                ?>
                                <option value="pending" <?= $currentStatus === 'pending' ? 'selected' : '' ?>>Pending</option>
                                <option value="active" <?= $currentStatus === 'active' ? 'selected' : '' ?>>Active</option>
                                <option value="inactive" <?= $currentStatus === 'inactive' ? 'selected' : '' ?>>Inactive</option>
                            </select>
                            <?php if (isset($errors['status'])): ?>
                                <div class="invalid-feedback"><?= $errors['status'] ?></div>
                            <?php endif; ?>
                        </div>

                        <div class="col-md-12">
                            <label class="form-label">Description</label>
                            <textarea name="description" 
                                       class="form-control" 
                                       rows="4" 
                                       placeholder="Enter detailed specification or description for this item..."><?= old('description', $item['description'] ?? '') ?></textarea>
                        </div>
                    </div>

                    <div class="form-actions mt-4 pt-3">
                        <button type="submit" class="btn btn-primary shadow-sm">
                            <i class="bi bi-check-lg me-1"></i> 
                            <?= isset($item) ? 'Update Record' : 'Save Record' ?>
                        </button>
                        <a href="<?= base_url('items') ?>" class="btn btn-light border">
                            <i class="bi bi-arrow-left me-1"></i> Cancel
                        </a>
                    </div>

                </form>

            </div>
        </div>

    </div>
</div>

<?= $this->endSection() ?>