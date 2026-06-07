const express = require('express');
const Router = express.Router;
const config = require('../../config');
const { deleteCharacter, renameCharacter, invalidateCache } = require('../services/character-service');
const { scrapeGenerator } = require('../services/scraper-service');
const { generatePreviews } = require('../services/preview-service');
const { listCharacters } = require('../services/character-service');

const router = Router();
let scraping = false;

const NAME_RE = /^[a-zA-Z0-9_-]+$/;

router.delete('/characters/:name', (req, res) => {
  const { name } = req.params;
  if (!NAME_RE.test(name)) {
    return res.status(400).json({ error: 'Invalid character name' });
  }

  try {
    deleteCharacter(config.assetsDir, name);
    res.json({ success: true });
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/characters/:name', (req, res) => {
  const { name } = req.params;
  const { newName } = req.body;

  if (!NAME_RE.test(name)) {
    return res.status(400).json({ error: 'Invalid character name' });
  }
  if (!newName || !NAME_RE.test(newName)) {
    return res.status(400).json({ error: 'Invalid new name' });
  }

  try {
    renameCharacter(config.assetsDir, name, newName);
    res.json({ success: true, name: newName });
  } catch (err) {
    if (err.message.includes('already exists')) {
      return res.status(409).json({ error: err.message });
    }
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/scrape', express.json(), async (req, res) => {
  const { url, name } = req.body;

  if (!url || !name) {
    return res.status(400).json({ error: 'url and name are required' });
  }
  if (!NAME_RE.test(name)) {
    return res.status(400).json({ error: 'name must be alphanumeric' });
  }
  if (scraping) {
    return res.status(409).json({ error: 'A scrape is already in progress' });
  }

  scraping = true;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  try {
    for await (const ev of scrapeGenerator(url, name, config.assetsDir)) {
      if (ev.step === 'error') {
        res.write(`data: ${JSON.stringify(ev)}\n\n`);
        break;
      }
      if (ev.step === 'done') break;
      res.write(`data: ${JSON.stringify(ev)}\n\n`);
    }

    if (!res.writableEnded) {
      invalidateCache();

      const characters = listCharacters(config.assetsDir);
      const newChars = characters.filter(c => c.name.startsWith(name));

      if (newChars.length > 0) {
        res.write(`data: ${JSON.stringify({ step: 'preview', message: '正在生成预览图...' })}\n\n`);
        await generatePreviews(newChars, `http://localhost:${config.port}`);
        invalidateCache();
        res.write(`data: ${JSON.stringify({ step: 'done', message: '完成，页面即将刷新' })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ step: 'done', message: '完成，页面即将刷新' })}\n\n`);
      }
    }
  } catch (err) {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ step: 'error', message: err.message })}\n\n`);
    }
  } finally {
    scraping = false;
    if (!res.writableEnded) res.end();
  }
});

module.exports = router;
