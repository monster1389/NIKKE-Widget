const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer-core');
const config = require('../../config');

const LAUNCH_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];

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
        return nb - na;
      });
      const chrome = path.join(pwCache, dirs[0], 'chrome-linux', 'chrome');
      if (fs.existsSync(chrome)) return chrome;
    }
  }

  // 3. System chromium
  try {
    return execSync('which chromium-browser || which chromium || which chromium-browser-stable', { encoding: 'utf8' }).trim().split('\n')[0];
  } catch (_) {}

  // 4. Config fallback
  if (config.chromiumFallback && fs.existsSync(config.chromiumFallback)) {
    return config.chromiumFallback;
  }

  throw new Error('No Chromium found. Set PUPPETEER_EXECUTABLE_PATH or CHROMIUM_PATH to a valid Chromium binary path.');
}

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    executablePath: findChromium(),
    args: LAUNCH_ARGS,
  });
}

module.exports = { launchBrowser };
