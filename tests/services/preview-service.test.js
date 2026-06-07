const mockLaunchBrowser = vi.fn();

vi.mock('../../src/lib/puppeteer-launcher', () => ({
  launchBrowser: mockLaunchBrowser,
}));

const { generatePreviews } = require('../../src/services/preview-service');

describe('preview-service', () => {
  it('skips when all characters have previews', async () => {
    const chars = [
      { name: 'c1', dir: '/tmp/c1', preview: '/assets/c1/preview.png' },
    ];
    // Should resolve immediately without launching browser
    await generatePreviews(chars, 'http://localhost:8090');
    expect(mockLaunchBrowser).not.toHaveBeenCalled();
  });

  it('exports generatePreviews function', () => {
    expect(typeof generatePreviews).toBe('function');
  });
});
