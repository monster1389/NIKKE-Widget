const { scrapeGenerator } = require('../../src/services/scraper-service');

describe('scraper-service', () => {
  it('rejects empty url', async () => {
    const gen = scrapeGenerator('', 'test', '/tmp');
    const results = [];
    for await (const ev of gen) {
      results.push(ev);
    }
    expect(results[0].step).toBe('error');
    expect(results[0].message).toContain('url');
  });

  it('rejects empty baseName', async () => {
    const gen = scrapeGenerator('http://example.com', '', '/tmp');
    const results = [];
    for await (const ev of gen) {
      results.push(ev);
    }
    expect(results[0].step).toBe('error');
    expect(results[0].message).toContain('baseName');
  });

  it('rejects empty assetsDir', async () => {
    const gen = scrapeGenerator('http://example.com', 'test', '');
    const results = [];
    for await (const ev of gen) {
      results.push(ev);
    }
    expect(results[0].step).toBe('error');
    expect(results[0].message).toContain('assetsDir');
  });
});
