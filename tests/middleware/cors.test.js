const cors = require('../../src/middleware/cors');

describe('cors middleware', () => {
  it('sets Access-Control-Allow-Origin header', () => {
    const req = {};
    const res = { header: () => {} };
    let called = false;
    const next = () => { called = true; };

    const middleware = cors();
    const setHeader = (name, value) => {
      if (name === 'Access-Control-Allow-Origin') expect(value).toBe('*');
    };
    middleware(req, { ...res, header: setHeader }, next);
    expect(called).toBe(true);
  });
});
