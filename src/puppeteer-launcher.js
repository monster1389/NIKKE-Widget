const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer-core');

const LAUNCH_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];

/**
 * Auto-discover a Chromium executable.
 * Priority: env var > Playwright cache (latest) > system PATH > fallback.
 *
 * @returns {string}
 */
function findChromium() {
  // 1. Explicit env var
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  // 2. Latest Playwright Chromium in cache
  const pwCache = path.join(os.homedir(), '.cache', 'ms-playwright');
  if (fs.existsSync(pwCache)) {
    const dirs = fs.readdirSync(pwCache).filter(d => /^chromium-\d+$/.test(d));
    if (dirs.length > 0) {
      dirs.sort((a, b) => {
        const na = parseInt(a.split('-')[1], 10);
        const nb = parseInt(b.split('-')[1], 10);
        return nb - na; // newest first
      });
      const chrome = path.join(pwCache, dirs[0], 'chrome-linux', 'chrome');
      if (fs.existsSync(chrome)) return chrome;
    }
  }

  // 3. System chromium
  try {
    return execSync('which chromium-browser || which chromium || which chromium-browser-stable', { encoding: 'utf8' }).trim().split('\n')[0];
  } catch (_) {}

  // 4. Fallback (legacy hardcoded path, kept for backwards compat)
  const fallback = '/home/lxx/.cache/ms-playwright/chromium-1217/chrome-linux/chrome';
  return fallback;
}

/**
 * Launches a headless Chromium browser.
 *
 * @returns {Promise<import('puppeteer-core').Browser>}
 */
async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    executablePath: findChromium(),
    args: LAUNCH_ARGS,
  });
}

module.exports = { launchBrowser };
