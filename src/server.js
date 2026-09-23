const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const { ensureCredentials, readCredentials } = require('./certs');

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 8443;
const ROOT = path.resolve(__dirname, '..');

function getConfig() {
  const host = process.env.HOST || DEFAULT_HOST;
  const port = Number.parseInt(process.env.PORT || String(DEFAULT_PORT), 10);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive integer');
  }

  return { host, port };
}

function createRequestHandler() {
  const sampleHtml = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');

  return (req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(sampleHtml);
      return;
    }

    if (req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  };
}

function startServer(options = {}) {
  const config = 'host' in options && 'port' in options ? options : getConfig();
  const { host, port } = config;
  const credentials = options.credentials || ensureCredentials();
  const server = https.createServer(credentials, createRequestHandler());

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve({ server, host, port });
    });
  });
}

if (require.main === module) {
  startServer()
    .then(({ host, port }) => {
      console.log(`HTTPS server running at https://${host}:${port}`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}

module.exports = { startServer, getConfig, readCredentials };
