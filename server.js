const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT_HTTPS = 3001;
const PORT_HTTP = 3080;
const ROOT = __dirname;

const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem')),
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

function handleRequest(req, res) {
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';

  const filePath = path.join(ROOT, url);
  const ext = path.extname(filePath).toLowerCase();

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(ROOT, 'index.html'), (e2, fallback) => {
          if (e2) { res.writeHead(404); return res.end('Not Found'); }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(fallback);
        });
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
      return;
    }

    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
    });
    res.end(data);
  });
}

// HTTPS server (principal)
https.createServer(sslOptions, handleRequest).listen(PORT_HTTPS, () => {
  console.log(`ARVOS site HTTPS running on https://localhost:${PORT_HTTPS}`);
});

// HTTP redirect to HTTPS
http.createServer((req, res) => {
  const host = (req.headers.host || '').replace(/:\d+$/, '');
  res.writeHead(301, { Location: `https://${host}:${PORT_HTTPS}${req.url}` });
  res.end();
}).listen(PORT_HTTP, () => {
  console.log(`ARVOS HTTP redirect on http://localhost:${PORT_HTTP} -> HTTPS`);
});
