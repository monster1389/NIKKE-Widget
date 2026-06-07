const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const puppeteer = require('puppeteer-core');

const URL = process.argv[2];
const BASE_NAME = process.argv[3];
const ASSETS_DIR = path.join(__dirname, '..', 'assets');

if (!URL || !BASE_NAME) {
  console.error('Usage: node scripts/scrape-spine.js <gamekee-url> <character-name>');
  console.error('Example: node scripts/scrape-spine.js https://www.gamekee.com/nikke/tj/703135.html anis');
  process.exit(1);
}

function downloadFile(url, outPath, referer) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const opts = {
      headers: {
        'Referer': referer || 'https://www.gamekee.com/',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36',
      },
    };
    proto.get(url, opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, outPath, referer).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const file = fs.createWriteStream(outPath);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', reject);
    }).on('error', reject);
  });
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/home/lxx/.cache/ms-playwright/chromium-1217/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Collect ALL live2d CDN URLs
  const spineUrls = new Set();
  page.on('response', (resp) => {
    const url = resp.url();
    if (/cdnimg.*live2d.*\.(skel|atlas)$/i.test(url)) spineUrls.add(url);
    if (/cdnimg.*live2d.*\.png$/i.test(url)) spineUrls.add(url);
  });

  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36');
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'zh-CN,zh;q=0.9' });

  console.log('Opening', URL);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 8000));

  // Click through all skins
  const skinCount = await page.evaluate(() => {
    return document.querySelectorAll('.skin-list-item').length;
  });

  if (skinCount > 1) {
    console.log(`Found ${skinCount} skins, switching through each...`);
    for (let i = 1; i < skinCount; i++) {
      await page.evaluate((idx) => {
        const items = document.querySelectorAll('.skin-list-item');
        if (items[idx]) items[idx].click();
      }, i);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  await browser.close();

  if (spineUrls.size === 0) {
    console.log('No Spine files found.');
    process.exit(1);
  }

  // Group URLs by CDN path prefix
  const groups = {};
  for (const url of spineUrls) {
    const m = url.match(/live2d\/\d+\/([a-z0-9]+)\//);
    const key = m ? m[1] : path.basename(url);
    if (!groups[key]) groups[key] = [];
    groups[key].push(url);
  }

  const groupKeys = Object.keys(groups);
  console.log(`\n${groupKeys.length} skin(s), ${spineUrls.size} total files\n`);

  for (let i = 0; i < groupKeys.length; i++) {
    const key = groupKeys[i];
    const urls = groups[key];
    const outDir = path.join(ASSETS_DIR, `${BASE_NAME}${i}`);
    fs.mkdirSync(outDir, { recursive: true });
    console.log(`Skin ${i} → ${outDir}/`);

    for (const url of urls) {
      const filename = path.basename(url);
      const outPath = path.join(outDir, filename);
      await downloadFile(url, outPath, URL);
      const stat = fs.statSync(outPath);
      console.log(`  ✅ ${filename} (${(stat.size / 1024).toFixed(1)} KB)`);
    }
  }

  console.log('\nDone.');
})();
