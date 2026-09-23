const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const https = require('node:https');
const { startServer } = require('../src/server');
const { generateCredentials } = require('../src/certs');

function requestJson(options) {
  return new Promise((resolve, reject) => {
    const req = https.request({ ...options, rejectUnauthorized: false }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ res, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('serves the sample page over HTTPS', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'local-https-'));
  generateCredentials(dir);
  const credentials = {
    pfx: fs.readFileSync(path.join(dir, 'localhost.pfx')),
    passphrase: fs.readFileSync(path.join(dir, 'localhost-passphrase.txt'), 'utf8').trim(),
  };
  const { server, host } = await startServer({ host: '127.0.0.1', port: 0, credentials });
  const actualPort = server.address().port;

  try {
    const { res, body } = await requestJson({ host, port: actualPort, path: '/', method: 'GET' });
    assert.equal(res.statusCode, 200);
    assert.match(body, /Local HTTPS Server/);
    assert.match(body, /\/health/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('returns health status over HTTPS', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'local-https-'));
  generateCredentials(dir);
  const credentials = {
    pfx: fs.readFileSync(path.join(dir, 'localhost.pfx')),
    passphrase: fs.readFileSync(path.join(dir, 'localhost-passphrase.txt'), 'utf8').trim(),
  };
  const { server, host } = await startServer({ host: '127.0.0.1', port: 0, credentials });
  const actualPort = server.address().port;

  try {
    const { res, body } = await requestJson({ host, port: actualPort, path: '/health', method: 'GET' });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(body), { ok: true });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('generate-cert helper creates a pfx bundle in a temp directory', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'local-https-script-'));
  try {
    generateCredentials(dir);
    assert.ok(fs.existsSync(path.join(dir, 'localhost.pfx')));
    assert.ok(fs.existsSync(path.join(dir, 'localhost-passphrase.txt')));
    const credentials = {
      pfx: fs.readFileSync(path.join(dir, 'localhost.pfx')),
      passphrase: fs.readFileSync(path.join(dir, 'localhost-passphrase.txt'), 'utf8').trim(),
    };
    const { server, host } = await startServer({ host: '127.0.0.1', port: 0, credentials });
    const actualPort = server.address().port;
    try {
      const { res } = await requestJson({ host, port: actualPort, path: '/health', method: 'GET' });
      assert.equal(res.statusCode, 200);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
