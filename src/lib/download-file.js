const https = require('https');
const http = require('http');
const fs = require('fs');

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36';
const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

function downloadFile(url, outPath, referer, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > MAX_REDIRECTS) {
      return reject(new Error(`Too many redirects (max ${MAX_REDIRECTS})`));
    }

    const proto = url.startsWith('https') ? https : http;
    const headers = { 'User-Agent': USER_AGENT };
    if (referer) {
      headers['Referer'] = referer;
    }
    const opts = { headers };

    const req = proto.get(url, opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, outPath, referer, redirectCount + 1)
          .then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const file = fs.createWriteStream(outPath);
      res.on('error', reject);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', (err) => { file.close(); reject(err); });
    });

    req.on('error', reject);
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${REQUEST_TIMEOUT_MS / 1000}s`));
    });
  });
}

module.exports = { downloadFile };
