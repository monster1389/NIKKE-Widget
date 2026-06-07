// vitest has globals: true, so describe/it/expect/vi are available.
// NOTE: vi.mock() does NOT intercept CJS require() in vitest v4.
// Instead we use real temp directories and vi.resetModules() to isolate state.

const fs = require('fs');
const path = require('path');
const os = require('os');
const request = require('supertest');
const express = require('express');

let tempDir;

beforeAll(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'live2d-pages-test-'));

  // test0: valid character with all model files + preview
  fs.mkdirSync(path.join(tempDir, 'test0'));
  fs.writeFileSync(path.join(tempDir, 'test0', 'model.skel'), '');
  fs.writeFileSync(path.join(tempDir, 'test0', 'model.atlas'), '');
  fs.writeFileSync(path.join(tempDir, 'test0', 'model.png'), '');
  fs.writeFileSync(path.join(tempDir, 'test0', 'preview.png'), '');

  // test1: valid character without preview
  fs.mkdirSync(path.join(tempDir, 'test1'));
  fs.writeFileSync(path.join(tempDir, 'test1', 'data.skel'), '');
  fs.writeFileSync(path.join(tempDir, 'test1', 'data.atlas'), '');
  fs.writeFileSync(path.join(tempDir, 'test1', 'data.png'), '');

  // nofiles: directory with no model files
  fs.mkdirSync(path.join(tempDir, 'nofiles'));
  fs.writeFileSync(path.join(tempDir, 'nofiles', 'readme.txt'), '');

  process.env.ASSETS_DIR = tempDir;
});

afterAll(() => {
  delete process.env.ASSETS_DIR;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

beforeEach(() => {
  // Clear CJS module cache so config.js + character-service re-evaluate
  // with the current process.env.ASSETS_DIR and fresh internal caches.
  vi.resetModules();
});

function makeApp() {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', '..', 'views'));
  // Re-require inside makeApp (after vi.resetModules) so config + service are fresh
  const pagesRouter = require('../../src/routes/pages');
  app.use('/', pagesRouter);
  return app;
}

describe('pages routes', () => {
  it('GET / renders home with characters', async () => {
    const res = await request(makeApp()).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('NIKKE');
    expect(res.text).toContain('test0');
    expect(res.text).toContain('test1');
  });

  it('GET /:character renders character page', async () => {
    const res = await request(makeApp()).get('/test0');
    expect(res.status).toBe(200);
  });

  it('GET /:character returns 404 for missing', async () => {
    const res = await request(makeApp()).get('/missing');
    expect(res.status).toBe(404);
  });

  it('GET /:character returns 500 for missing files', async () => {
    const res = await request(makeApp()).get('/nofiles');
    expect(res.status).toBe(500);
  });
});
