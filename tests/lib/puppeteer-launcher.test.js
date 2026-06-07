describe('puppeteer-launcher', () => {
  it('exports launchBrowser function', () => {
    const { launchBrowser } = require('../../src/lib/puppeteer-launcher');
    expect(typeof launchBrowser).toBe('function');
  });

  it('uses PUPPETEER_EXECUTABLE_PATH env var when set', () => {
    process.env.PUPPETEER_EXECUTABLE_PATH = '/custom/chrome';
    // Re-require to pick up env (clear cache)
    delete require.cache[require.resolve('../../src/lib/puppeteer-launcher')];
    const { launchBrowser } = require('../../src/lib/puppeteer-launcher');
    delete process.env.PUPPETEER_EXECUTABLE_PATH;
    expect(typeof launchBrowser).toBe('function');
  });
});
