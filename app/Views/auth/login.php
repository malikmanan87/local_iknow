<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login | <?= APP_NAME ?></title>
    
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
        .login-card {
            max-width: 450px;
            width: 100%;
            border: none;
            border-radius: 12px;
            background: #ffffff;
        }
        .login-logo {
            font-size: 2.5rem;
            color: #0d6efd;
        }
    </style>
</head>
<body>

<div class="card login-card shadow-lg">
    <div class="card-body p-4 p-md-5">
        
        <div class="text-center mb-4">
            <div class="login-logo mb-2">
                <i class="bi bi-shield-lock-fill"></i>
            </div>
            <h4 class="fw-bold text-dark mb-1">Welcome Back</h4>
            <p class="text-muted small">Please log in to access your account.</p>
        </div>

        <?php if (session()->getFlashdata('success')): ?>
            <div class="alert alert-success d-flex align-items-center gap-2 py-2 small" role="alert">
                <i class="bi bi-check-circle-fill flex-shrink-0"></i>
                <div><?= session()->getFlashdata('success') ?></div>
            </div>
        <?php endif; ?>

        <?php if (session()->getFlashdata('error')): ?>
            <div class="alert alert-danger d-flex align-items-center gap-2 py-2 small" role="alert">
                <i class="bi bi-exclamation-circle-fill flex-shrink-0"></i>
                <div><?= session()->getFlashdata('error') ?></div>
            </div>
        <?php endif; ?>

        <?php if (session()->getFlashdata('errors')): ?>
            <div class="alert alert-danger pb-0 py-2 small" role="alert">
                <ul class="ps-3 mb-2">
                    <?php foreach (session()->getFlashdata('errors') as $error): ?>
                        <li><?= esc($error) ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>

        <form action="<?= base_url('login') ?>" method="POST" autocomplete="off">
            <?= csrf_field() ?>

            <div class="mb-3">
                <label for="email" class="form-label small fw-semibold text-secondary">Email or Username</label>
                <div class="input-group">
                    <span class="input-group-text bg-light text-muted"><i class="bi bi-person"></i></span>
                    <input type="text" class="form-control" id="email" name="email" 
                           value="<?= old('email') ?>" placeholder="Enter email or username" required autofocus>
                </div>
            </div>

            <div class="mb-4">
                <label for="password" class="form-label small fw-semibold text-secondary">Password</label>
                <div class="input-group">
                    <span class="input-group-text bg-light text-muted"><i class="bi bi-lock"></i></span>
                    <input type="password" class="form-control" id="password" name="password" 
                           placeholder="Enter password" required>
                </div>
            </div>

            <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold shadow-sm mb-3">
                <i class="bi bi-box-arrow-in-right me-1"></i> Sign In
            </button>

            <div class="text-center mt-3 border-top pt-3">
                <span class="text-muted small">Don't have an account?</span>
                <a href="<?= base_url('register') ?>" class="small text-decoration-none fw-semibold ms-1">Register Here</a>
            </div>
        </form>

    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>