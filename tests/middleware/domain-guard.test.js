const domainGuard = require('../../src/middleware/domain-guard');

describe('domainGuard middleware', () => {
  it('sets isReadonly=true for public domain', () => {
    const req = { hostname: 'live2d.rpi1204.xyz', path: '/' };
    domainGuard(req, {}, () => {});
    expect(req.isReadonly).toBe(true);
  });

  it('sets isReadonly=true for domain with subdomain', () => {
    const req = { hostname: 'example.com', path: '/' };
    domainGuard(req, {}, () => {});
    expect(req.isReadonly).toBe(true);
  });

  it('sets isReadonly=false for localhost', () => {
    const req = { hostname: 'localhost', path: '/' };
    domainGuard(req, {}, () => {});
    expect(req.isReadonly).toBe(false);
  });

  it('sets isReadonly=false for 127.0.0.1', () => {
    const req = { hostname: '127.0.0.1', path: '/' };
    domainGuard(req, {}, () => {});
    expect(req.isReadonly).toBe(false);
  });

  it('sets isReadonly=false for 192.168.x.x', () => {
    const req = { hostname: '192.168.1.100', path: '/' };
    domainGuard(req, {}, () => {});
    expect(req.isReadonly).toBe(false);
  });

  it('sets isReadonly=false for hostname without dots (e.g. rpi)', () => {
    const req = { hostname: 'rpi', path: '/' };
    domainGuard(req, {}, () => {});
    expect(req.isReadonly).toBe(false);
  });
});
