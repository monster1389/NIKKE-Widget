const domainGuard = require('../../src/middleware/domain-guard');

describe('domainGuard middleware', () => {
  it('blocks public domain on GET /', () => {
    const req = { hostname: 'live2d.rpi1204.xyz', path: '/' };
    const res = {
      status: (code) => ({
        send: (msg) => { res.sent = { code, msg }; }
      }),
      sent: null,
    };
    const next = () => {};
    domainGuard(req, res, next);
    expect(res.sent.code).toBe(403);
  });

  it('blocks public domain on POST /api/scrape', () => {
    const req = { hostname: 'live2d.rpi1204.xyz', path: '/api/scrape' };
    const res = {
      status: (code) => ({
        send: (msg) => { res.sent = { code, msg }; }
      }),
      sent: null,
    };
    domainGuard(req, res, () => {});
    expect(res.sent.code).toBe(403);
  });

  it('allows localhost on GET /', () => {
    let called = false;
    const req = { hostname: 'localhost', path: '/' };
    const res = {};
    domainGuard(req, res, () => { called = true; });
    expect(called).toBe(true);
  });

  it('allows public domain on GET /:character', () => {
    let called = false;
    const req = { hostname: 'live2d.rpi1204.xyz', path: '/anis0' };
    const res = {};
    domainGuard(req, res, () => { called = true; });
    expect(called).toBe(true);
  });

  it('allows public domain on GET /embed/:character.js', () => {
    let called = false;
    const req = { hostname: 'live2d.rpi1204.xyz', path: '/embed/anis0.js' };
    const res = {};
    domainGuard(req, res, () => { called = true; });
    expect(called).toBe(true);
  });
});
