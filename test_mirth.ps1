Add-Type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAll : ICertificatePolicy {
        public bool CheckValidationResult(ServicePoint sp, X509Certificate cert, WebRequest req, int problem) { return true; }
    }
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAll
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$headers = @{
    "X-Requested-With" = "XMLHttpRequest"
    "Accept" = "application/xml"
}

try {
    $r = Invoke-WebRequest -Uri "https://10.0.20.210:8443/api/server/version" -Method GET -Headers $headers -TimeoutSec 10
    Write-Host "STATUS:" $r.StatusCode
    Write-Host "BODY:" $r.Content
} catch {
    Write-Host "ERROR:" $_.Exception.Message
    # Try port 8080
    try {
        Write-Host "Trying port 8080..."
        $r2 = Invoke-WebRequest -Uri "http://10.0.20.210:8080/api/server/version" -Method GET -Headers $headers -TimeoutSec 10
        Write-Host "STATUS:" $r2.StatusCode
        Write-Host "BODY:" $r2.Content
    } catch {
        Write-Host "Port 8080 ERROR:" $_.Exception.Message
    }
}

