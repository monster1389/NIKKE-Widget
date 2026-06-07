const path = require('path');
const { scrapeGenerator } = require('../src/scraper');

const URL = process.argv[2];
const BASE_NAME = process.argv[3];
const ASSETS_DIR = path.join(__dirname, '..', 'assets');

if (!URL || !BASE_NAME) {
  console.error('Usage: node scripts/scrape-spine.js <gamekee-url> <character-name>');
  console.error('Example: node scripts/scrape-spine.js https://www.gamekee.com/nikke/tj/703135.html anis');
  process.exit(1);
}

(async () => {
  console.log('Opening', URL);
  for await (const ev of scrapeGenerator(URL, BASE_NAME, ASSETS_DIR)) {
    if (ev.step === 'error') {
      console.error('Error:', ev.message);
      process.exit(1);
    }
    console.log(ev.message);
  }
  console.log('Done.');
})().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
