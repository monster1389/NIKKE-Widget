const fs = require('fs');
const path = require('path');
const { downloadFile } = require('../lib/download-file');
const { launchBrowser } = require('../lib/puppeteer-launcher');

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36';
const REFERER = 'https://www.gamekee.com/';
const PAGE_WAIT_MS = 8000;
const SKIN_SWITCH_WAIT_MS = 5000;

async function* scrapeGenerator(url, baseName, assetsDir) {
  let browser;
  try {
    if (!url || typeof url !== 'string') throw new Error('url is required');
    if (!baseName || typeof baseName !== 'string') throw new Error('baseName is required');
    if (!assetsDir || typeof assetsDir !== 'string') throw new Error('assetsDir is required');

    yield { step: 'browser', message: '正在启动浏览器...' };
    browser = await launchBrowser();

    const page = await browser.newPage();
    const spineUrls = new Set();

    page.on('response', (resp) => {
      const u = resp.url();
      if (/cdnimg.*live2d.*\.(skel|atlas)$/i.test(u)) spineUrls.add(u);
      if (/cdnimg.*live2d.*\.png($|\?)/i.test(u)) spineUrls.add(u);
    });

    await page.setUserAgent(USER_AGENT);
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'zh-CN,zh;q=0.9' });

    yield { step: 'page', message: '正在打开页面...' };
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, PAGE_WAIT_MS));

    const skinCount = await page.evaluate(() => {
      return document.querySelectorAll('.skin-list-item').length;
    });

    if (skinCount > 1) {
      yield { step: 'skins', message: `发现 ${skinCount} 个皮肤，正在切换...` };
      for (let i = 1; i < skinCount; i++) {
        await page.evaluate((idx) => {
          const items = document.querySelectorAll('.skin-list-item');
          if (items[idx]) items[idx].click();
        }, i);
        await new Promise(r => setTimeout(r, SKIN_SWITCH_WAIT_MS));
      }
    }

    await page.close();
    await browser.close();
    browser = null;

    if (spineUrls.size === 0) {
      yield { step: 'error', message: '未发现 Spine 文件' };
      return;
    }

    const groups = {};
    for (const u of spineUrls) {
      const m = u.match(/live2d\/\d+\/([a-z0-9]+)\//);
      const key = m ? m[1] : path.basename(u);
      if (!groups[key]) groups[key] = [];
      groups[key].push(u);
    }

    const groupKeys = Object.keys(groups);
    yield { step: 'skins', message: `共 ${groupKeys.length} 个皮肤, ${spineUrls.size} 个文件` };

    for (let i = 0; i < groupKeys.length; i++) {
      const urls = groups[groupKeys[i]];
      const outDir = path.join(assetsDir, `${baseName}${i}`);
      fs.mkdirSync(outDir, { recursive: true });

      for (const fileUrl of urls) {
        const filename = path.basename(fileUrl);
        const outPath = path.join(outDir, filename);
        yield { step: 'download', message: `下载中: ${filename}` };
        await downloadFile(fileUrl, outPath, url);
        const stat = fs.statSync(outPath);
        yield { step: 'download', message: `下载完成: ${filename} (${(stat.size / 1024).toFixed(1)} KB)` };
      }
    }

    yield { step: 'done', message: '下载完成', done: true };
  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch {}
    }
    yield { step: 'error', message: err.message, error: err.message };
  }
}

module.exports = { scrapeGenerator };
