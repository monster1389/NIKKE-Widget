const request = require('supertest');
const { createApp } = require('../src/app');

describe('Express app', () => {
  const app = createApp();

  it('GET / returns HTML', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
  });

  it('GET /nonexistent returns 404', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
  });

  it('POST /api/scrape returns 400 without body', async () => {
    const res = await request(app).post('/api/scrape').send({});
    expect(res.status).toBe(400);
  });

  it('CORS headers are set', async () => {
    const res = await request(app).get('/');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });
});
