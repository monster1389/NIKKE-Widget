const puppeteer = require('puppeteer-core');

const EXECUTABLE_PATH = '/home/lxx/.cache/ms-playwright/chromium-1217/chrome-linux/chrome';
const LAUNCH_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];

/**
 * Launches a headless Chromium browser for screenshots or scraping.
 *
 * @returns {Promise<import('puppeteer-core').Browser>}
 */
async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    executablePath: EXECUTABLE_PATH,
    args: LAUNCH_ARGS,
  });
}

module.exports = { launchBrowser };
