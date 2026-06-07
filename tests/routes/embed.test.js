// vitest has globals: true, so describe/it/expect/vi are available.
const fs = require('fs');
const path = require('path');
const os = require('os');
const request = require('supertest');
const express = require('express');

function makeApp() {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', '..', 'views'));
  // Re-require inside makeApp (after vi.resetModules) so config + service are fresh
  const embedRouter = require('../../src/routes/embed');
  app.use('/embed', embedRouter);
  return app;
}

describe('embed routes', () => {
  let tempDir;

  beforeEach(() => {
    vi.resetModules();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'live2d-test-'));
    fs.mkdirSync(path.join(tempDir, 'test0'));
    fs.writeFileSync(path.join(tempDir, 'test0', 'model.skel'), '');
    fs.writeFileSync(path.join(tempDir, 'test0', 'model.atlas'), '');
    process.env.ASSETS_DIR = tempDir;
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    delete process.env.ASSETS_DIR;
  });

  it('GET /embed/test0.js returns JavaScript', async () => {
    const res = await request(makeApp()).get('/embed/test0.js');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/javascript/);
    expect(res.text).toContain('live2d-widget');
  });

  it('GET /embed/missing.js returns 404', async () => {
    const res = await request(makeApp()).get('/embed/missing.js');
    expect(res.status).toBe(404);
  });
});
