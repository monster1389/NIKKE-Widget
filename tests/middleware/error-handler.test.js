const errorHandler = require('../../src/middleware/error-handler');

describe('errorHandler middleware', () => {
  it('logs error and returns 500', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('test error');
    const res = {
      status: (code) => ({
        send: (msg) => { res.sent = { code, msg }; }
      }),
      sent: null,
    };
    errorHandler(err, {}, res, () => {});
    expect(res.sent.code).toBe(500);
    expect(res.sent.msg).toBe('Internal server error');
    consoleSpy.mockRestore();
  });
});
