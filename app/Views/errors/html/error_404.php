<!DOCTYPE html>
<html lang="ms">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Halaman Tidak Dijumpai</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Inter', sans-serif;
            background: #f1f5f9;
            min-height: 100vh;
            display: flex; align-items: center; justify-content: center;
            padding: 24px;
        }
        .error-container {
            text-align: center;
            max-width: 480px;
        }
        .error-code {
            font-size: 8rem;
            font-weight: 800;
            line-height: 1;
            background: linear-gradient(135deg, #6366f1, #818cf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
        }
        .error-icon {
            font-size: 3rem;
            color: #6366f1;
            margin-bottom: 20px;
        }
        .error-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
        .error-text  { color: #64748b; font-size: .9rem; line-height: 1.6; margin-bottom: 32px; }
        .btn-back {
            display: inline-flex; align-items: center; gap: 8px;
            background: #6366f1; color: #fff;
            padding: 11px 24px;
            border-radius: 8px;
            font-weight: 600; font-size: .85rem;
            text-decoration: none;
            transition: background .2s;
        }
        .btn-back:hover { background: #4f46e5; color: #fff; }
        .btn-secondary {
            display: inline-flex; align-items: center; gap: 8px;
            background: #fff; color: #64748b;
            border: 1px solid #e2e8f0;
            padding: 11px 24px;
            border-radius: 8px;
            font-weight: 600; font-size: .85rem;
            text-decoration: none;
            margin-left: 10px;
            transition: background .2s;
        }
        .btn-secondary:hover { background: #f8fafc; }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-code">404</div>
        <div class="error-icon"><i class="bi bi-compass"></i></div>
        <h1 class="error-title">Halaman Tidak Dijumpai</h1>
        <p class="error-text">
            Maaf, halaman yang anda cuba akses tidak wujud atau telah dipindahkan.
            Sila semak URL atau kembali ke halaman utama.
        </p>
        <div>
            <a href="<?= base_url('dashboard') ?>" class="btn-back">
                <i class="bi bi-house-fill"></i> Laman Utama
            </a>
            <a href="javascript:history.back()" class="btn-secondary">
                <i class="bi bi-arrow-left"></i> Kembali
            </a>
        </div>
    </div>
</body>
</html>
