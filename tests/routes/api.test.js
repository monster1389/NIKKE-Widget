const fs = require('fs');
const path = require('path');
const os = require('os');
const request = require('supertest');
const express = require('express');

let tempDir;

beforeAll(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'live2d-api-test-'));
  process.env.ASSETS_DIR = tempDir;
});

afterAll(() => {
  delete process.env.ASSETS_DIR;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

beforeEach(() => {
  // Recreate testchar0 (some tests delete or rename it)
  const charDir = path.join(tempDir, 'testchar0');
  if (fs.existsSync(charDir)) {
    fs.rmSync(charDir, { recursive: true, force: true });
  }
  fs.mkdirSync(charDir);
  fs.writeFileSync(path.join(charDir, 'model.skel'), '');

  // Clear CJS module cache so config.js + services re-evaluate
  // with the current process.env.ASSETS_DIR and fresh internal caches.
  vi.resetModules();
});

function makeApp() {
  // Re-require inside makeApp (after vi.resetModules) so config + services are fresh
  const apiRouter = require('../../src/routes/api');
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);
  return app;
}

describe('api routes', () => {
  describe('DELETE /api/characters/:name', () => {
    it('deletes a character', async () => {
      const res = await request(makeApp()).delete('/api/characters/testchar0');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'testchar0'))).toBe(false);
    });

    it('rejects invalid name', async () => {
      const res = await request(makeApp()).delete(
        '/api/characters/' + encodeURIComponent('../etc')
      );
      expect(res.status).toBe(400);
    });

    it('returns 404 for missing character', async () => {
      const res = await request(makeApp()).delete('/api/characters/nope');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/characters/:name', () => {
    it('renames a character', async () => {
      const res = await request(makeApp())
        .put('/api/characters/testchar0')
        .send({ newName: 'renamed0' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'renamed0'))).toBe(true);
    });

    it('rejects invalid newName', async () => {
      const res = await request(makeApp())
        .put('/api/characters/testchar0')
        .send({ newName: '../hack' });
      expect(res.status).toBe(400);
    });

    it('returns 400 without newName', async () => {
      const res = await request(makeApp())
        .put('/api/characters/testchar0')
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/scrape', () => {
    it('returns 400 without body', async () => {
      const res = await request(makeApp()).post('/api/scrape').send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 with invalid name', async () => {
      const res = await request(makeApp())
        .post('/api/scrape')
        .send({ url: 'http://example.com', name: 'bad name!' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/characters', () => {
    it('returns sorted character list with skel/atlas URLs', async () => {
      // testchar0 (from beforeEach) only has model.skel, no atlas — should be skipped
      fs.mkdirSync(path.join(tempDir, 'zeta'));
      fs.writeFileSync(path.join(tempDir, 'zeta', 'model.skel'), '');
      fs.writeFileSync(path.join(tempDir, 'zeta', 'model.atlas'), '');
      fs.mkdirSync(path.join(tempDir, 'alpha'));
      fs.writeFileSync(path.join(tempDir, 'alpha', 'data.skel'), '');
      fs.writeFileSync(path.join(tempDir, 'alpha', 'data.atlas'), '');

      const res = await request(makeApp()).get('/api/characters');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        { name: 'alpha', skel: '/assets/alpha/data.skel', atlas: '/assets/alpha/data.atlas' },
        { name: 'zeta', skel: '/assets/zeta/model.skel', atlas: '/assets/zeta/model.atlas' },
      ]);
    });

    it('returns empty array for empty assets dir', async () => {
      fs.rmSync(tempDir, { recursive: true, force: true });
      fs.mkdirSync(tempDir);

      const res = await request(makeApp()).get('/api/characters');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('skips characters missing skel or atlas', async () => {
      // testchar0 exists from beforeEach but only has model.skel, no atlas
      const res = await request(makeApp()).get('/api/characters');
      expect(res.status).toBe(200);
      expect(res.body.find(c => c.name === 'testchar0')).toBeUndefined();
    });
  });
});
