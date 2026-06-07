const path = require('path');
const { launchBrowser } = require('./puppeteer-launcher');

const VIEWPORT = { width: 400, height: 400 };
const READY_TIMEOUT = 15000;
const RENDER_SETTLE_MS = 500;

/**
 * Generates preview.png screenshots for characters that lack one.
 *
 * Launches a headless Chromium browser, navigates to each character's page,
 * waits for the Spine player to signal readiness, and takes a screenshot.
 * Screenshots are saved as `preview.png` in each character's asset directory.
 *
 * @param {Array<{ name: string, dir: string, preview: string | null }>} characters -
 *   Character list from getCharacters(). Characters without a preview are processed.
 * @param {string} baseUrl - Base URL of the running service (e.g. "http://localhost:8090").
 * @returns {Promise<void>}
 */
async function generatePreviews(characters, baseUrl) {
  const missing = characters.filter(c => !c.preview);
  if (missing.length === 0) return;

  let browser;
  try {
    browser = await launchBrowser();
  } catch (err) {
    console.warn('Preview generation skipped: unable to launch browser:', err.message);
    return;
  }

  await Promise.all(missing.map(async (char) => {
    const page = await browser.newPage();
    try {
      await page.setViewport(VIEWPORT);

      await page.goto(`${baseUrl}/${char.name}?screenshot=1`, {
        waitUntil: 'domcontentloaded',
        timeout: READY_TIMEOUT,
      });

      await page.evaluate((timeoutMs) => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Spine ready timeout')), timeoutMs);
          window.addEventListener('message', function handler(e) {
            if (e.data && e.data.type === 'ready') {
              clearTimeout(timeout);
              window.removeEventListener('message', handler);
              resolve();
            }
          });
        });
      }, READY_TIMEOUT);

      await new Promise(r => setTimeout(r, RENDER_SETTLE_MS));

      const screenshotPath = path.join(char.dir, 'preview.png');
      await page.screenshot({ path: screenshotPath, omitBackground: false });
      console.log(`Preview generated: ${char.name}`);
    } catch (err) {
      console.error(`Failed to generate preview for ${char.name}:`, err.message);
    } finally {
      await page.close();
    }
  }));

  await browser.close();
}

module.exports = { generatePreviews };
