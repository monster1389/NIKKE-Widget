const { createApp } = require('./app');
const config = require('../config');
const { listCharacters, invalidateCache } = require('./services/character-service');
const { generatePreviews } = require('./services/preview-service');

const app = createApp();

app.listen(config.port, async () => {
  console.log(`Live2D service running on http://localhost:${config.port}`);

  try {
    const characters = listCharacters(config.assetsDir);
    await generatePreviews(characters, `http://localhost:${config.port}`);
    invalidateCache();
  } catch (err) {
    console.warn('Preview generation on startup failed:', err.message);
  }
});
