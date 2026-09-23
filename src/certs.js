const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const CERT_DIR = path.join(ROOT, 'certs');
const PFX_PATH = path.join(CERT_DIR, 'localhost.pfx');
const PASSPHRASE_PATH = path.join(CERT_DIR, 'localhost-passphrase.txt');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function hasCredentials(dir = CERT_DIR) {
  return fs.existsSync(path.join(dir, 'localhost.pfx')) && fs.existsSync(path.join(dir, 'localhost-passphrase.txt'));
}

function readCredentials(dir = CERT_DIR) {
  const pfxPath = path.join(dir, 'localhost.pfx');
  const passphrasePath = path.join(dir, 'localhost-passphrase.txt');
  if (!fs.existsSync(pfxPath) || !fs.existsSync(passphrasePath)) {
    throw new Error('Missing local certificate bundle.');
  }
  return {
    pfx: fs.readFileSync(pfxPath),
    passphrase: fs.readFileSync(passphrasePath, 'utf8').trim(),
  };
}

function runPowerShell(script) {
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], {
    encoding: 'utf8',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || 'PowerShell certificate generation failed').trim());
  }
  return result.stdout.trim();
}

function generateCredentials(targetDir = CERT_DIR) {
  ensureDir(targetDir);
  const passphrase = crypto.randomBytes(32).toString('base64url');
  const subject = 'CN=localhost';
  const pfxPath = path.join(targetDir, 'localhost.pfx');
  const passphrasePath = path.join(targetDir, 'localhost-passphrase.txt');
  const escapedPfx = pfxPath.replace(/'/g, "''");
  const escapedPass = passphrase.replace(/'/g, "''");
  const escapedSubject = subject.replace(/'/g, "''");
  const escapedDir = targetDir.replace(/'/g, "''");

  const script = `
$ErrorActionPreference = 'Stop'
$targetDir = '${escapedDir}'
$pfxPath = '${escapedPfx}'
$passphrase = '${escapedPass}'
$subject = '${escapedSubject}'
$store = Join-Path 'Cert:\CurrentUser' 'My'
$cert = New-SelfSignedCertificate -DnsName 'localhost','127.0.0.1','::1' -CertStoreLocation $store -Subject $subject -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 -NotAfter (Get-Date).AddDays(365) -KeyExportPolicy Exportable
try {
  $secure = ConvertTo-SecureString -String $passphrase -AsPlainText -Force
  Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $secure | Out-Null
  Set-Content -Path (Join-Path $targetDir 'localhost-passphrase.txt') -Value $passphrase -NoNewline -Encoding ascii
} finally {
  Remove-Item -Path $cert.PSPath -Force -ErrorAction SilentlyContinue
}
`;

  runPowerShell(script);
  fs.chmodSync(pfxPath, 0o600);
  fs.chmodSync(passphrasePath, 0o600);
  return { pfxPath, passphrasePath };
}

function ensureCredentials(dir = CERT_DIR) {
  if (!hasCredentials(dir)) {
    generateCredentials(dir);
  }
  return readCredentials(dir);
}

module.exports = { CERT_DIR, PFX_PATH, PASSPHRASE_PATH, ensureCredentials, generateCredentials, readCredentials, hasCredentials };
