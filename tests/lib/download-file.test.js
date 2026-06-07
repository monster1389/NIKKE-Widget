const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { downloadFile } = require('../../src/lib/download-file');

describe('downloadFile', () => {
  let server;
  let tempDir;
  const testPort = 19999;

  beforeAll(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'live2d-test-'));
    server = http.createServer((req, res) => {
      if (req.url === '/test.bin') {
        res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
        res.end(Buffer.from('hello live2d'));
      } else if (req.url === '/redirect') {
        res.writeHead(302, { Location: `http://localhost:${testPort}/test.bin` });
        res.end();
      } else if (req.url === '/error') {
        res.writeHead(404);
        res.end();
      } else if (req.url === '/loop') {
        res.writeHead(302, { Location: `http://localhost:${testPort}/loop` });
        res.end();
      } else {
        res.writeHead(200);
        res.end('ok');
      }
    });
    await new Promise((resolve) => server.listen(testPort, resolve));
  });

  afterAll(() => {
    server.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('downloads a file successfully', async () => {
    const outPath = path.join(tempDir, 'test.bin');
    await downloadFile(`http://localhost:${testPort}/test.bin`, outPath);
    expect(fs.readFileSync(outPath, 'utf8')).toBe('hello live2d');
  });

  it('follows redirects', async () => {
    const outPath = path.join(tempDir, 'redirect.bin');
    await downloadFile(`http://localhost:${testPort}/redirect`, outPath);
    expect(fs.readFileSync(outPath, 'utf8')).toBe('hello live2d');
  });

  it('rejects on HTTP error status', async () => {
    const outPath = path.join(tempDir, 'error.bin');
    await expect(downloadFile(`http://localhost:${testPort}/error`, outPath))
      .rejects.toThrow('HTTP 404');
  });

  it('rejects on redirect loop', async () => {
    const outPath = path.join(tempDir, 'loop.bin');
    await expect(downloadFile(`http://localhost:${testPort}/loop`, outPath))
      .rejects.toThrow('Too many redirects');
  });
});
