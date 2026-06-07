const path = require('path');
const puppeteer = require('puppeteer-core');

async function generatePreviews(characters, baseUrl) {
  const missing = characters.filter(c => !c.hasPreview);
  if (missing.length === 0) return;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: '/home/lxx/.cache/ms-playwright/chromium-1217/chrome-linux/chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  } catch (err) {
    console.warn('Preview generation skipped: unable to launch browser:', err.message);
    return;
  }

  for (const char of missing) {
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 400, height: 400 });

      await page.goto(`${baseUrl}/${char.name}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      // Wait for Spine player ready event
      await page.evaluate(() => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Spine ready timeout')), 15000);
          window.addEventListener('message', function handler(e) {
            if (e.data && e.data.type === 'ready') {
              clearTimeout(timeout);
              window.removeEventListener('message', handler);
              resolve();
            }
          });
        });
      });

      // Let rendering settle
      await new Promise(r => setTimeout(r, 500));

      const screenshotPath = path.join(char.dir, 'preview.png');
      await page.screenshot({ path: screenshotPath, omitBackground: false });
      console.log(`Preview generated: ${char.name}`);
    } catch (err) {
      console.error(`Failed to generate preview for ${char.name}:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
}

module.exports = { generatePreviews };
