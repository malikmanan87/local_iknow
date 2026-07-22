<!DOCTYPE html>
<html lang="ms">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daftar Akaun Baru | <?= APP_NAME ?></title>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.2/font/bootstrap-icons.css" rel="stylesheet">
    
    <link href="<?= base_url('assets/css/app.css') ?>" rel="stylesheet">
    
    <style>
        body {
            background-color: #f8f9fa;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .register-card {
            max-width: 500px;
            width: 100%;
            border: none;
            border-radius: 12px;
            background: #ffffff;
        }
        .register-logo {
            font-size: 2.5rem;
            color: #0d6efd;
        }
    </style>
</head>
<body>

<div class="card register-card shadow-lg">
    <div class="card-body p-4 p-md-5">
        
        <div class="text-center mb-4">
            <div class="register-logo mb-2">
                <i class="bi bi-person-plus-fill"></i>
            </div>
            <h4 class="fw-bold text-dark mb-1">Cipta Akaun Baru</h4>
            <p class="text-muted small">Sila isi butiran di bawah untuk mendaftar sebagai tetamu sistem.</p>
        </div>

        <?php if (session()->getFlashdata('errors')): ?>
            <div class="alert alert-danger pb-0 py-2 small" role="alert">
                <ul class="ps-3 mb-2">
                    <?php foreach (session()->getFlashdata('errors') as $error): ?>
                        <li><?= esc($error) ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>

        <?php if (session()->getFlashdata('error')): ?>
            <div class="alert alert-danger d-flex align-items-center gap-2 py-2 small" role="alert">
                <i class="bi bi-exclamation-circle-fill flex-shrink-0"></i>
                <span><?= session()->getFlashdata('error') ?></span>
            </div>
        <?php endif; ?>

        <form action="<?= base_url('register/process') ?>" method="POST" autocomplete="off">
            <?= csrf_field() ?>

            <div class="mb-3">
                <label class="form-label small fw-semibold text-secondary">Nama Penuh</label>
                <div class="input-group">
                    <span class="input-group-text bg-light text-muted"><i class="bi bi-person"></i></span>
                    <input type="text" class="form-control" name="fullname" 
                           value="<?= old('fullname') ?>" placeholder="Masukkan nama penuh anda" required>
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label small fw-semibold text-secondary">Nama Pengguna (Username)</label>
                <div class="input-group">
                    <span class="input-group-text bg-light text-muted">@</span>
                    <input type="text" class="form-control" name="username" 
                           value="<?= old('username') ?>" placeholder="contoh: amir99" required>
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label small fw-semibold text-secondary">Alamat E-mel</label>
                <div class="input-group">
                    <span class="input-group-text bg-light text-muted"><i class="bi bi-envelope"></i></span>
                    <input type="email" class="form-control" name="email" 
                           value="<?= old('email') ?>" placeholder="nama@domain.com" required>
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label small fw-semibold text-secondary">No. Telefon <span class="text-muted text-xs">(Opsional)</span></label>
                <div class="input-group">
                    <span class="input-group-text bg-light text-muted"><i class="bi bi-telephone"></i></span>
                    <input type="text" class="form-control" name="phone" 
                           value="<?= old('phone') ?>" placeholder="contoh: 0123456789">
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label small fw-semibold text-secondary">Kata Laluan</label>
                <div class="input-group">
                    <span class="input-group-text bg-light text-muted"><i class="bi bi-lock"></i></span>
                    <input type="password" class="form-control" name="password" 
                           placeholder="Minimum 6 aksara" required>
                </div>
            </div>

            <div class="mb-4">
                <label class="form-label small fw-semibold text-secondary">Sahkan Kata Laluan</label>
                <div class="input-group">
                    <span class="input-group-text bg-light text-muted"><i class="bi bi-shield-lock"></i></span>
                    <input type="password" class="form-control" name="password_confirm" 
                           placeholder="Ulang semula kata laluan" required>
                </div>
            </div>

            <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold shadow-sm mb-3">
                <i class="bi bi-clipboard-check me-1"></i> Daftar Akaun
            </button>

            <div class="text-center mt-2 border-top pt-3">
                <span class="text-muted small">Sudah mempunyai akaun?</span>
                <a href="<?= base_url('login') ?>" class="small text-decoration-none fw-semibold ms-1">Log Masuk</a>
            </div>
        </form>

    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>