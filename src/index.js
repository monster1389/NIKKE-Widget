const express = require('express');
const path = require('path');
const config = require('../config');
const { getCharacters, readCharacterFiles } = require('./get-characters');
const { generatePreviews } = require('./preview-generator');

const app = express();
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const DEFAULT_ANIMATION = 'idle';
const DEFAULT_TOUCH_ANIM = 'action';

/** @type {Array<{ name: string, dir: string, preview: string | null }>} */
let characterCache = null;

/**
 * Returns the cached character list, scanning the filesystem on first call.
 *
 * @returns {Array<{ name: string, dir: string, preview: string | null }>}
 */
function listCharacters() {
  if (!characterCache) characterCache = getCharacters(ASSETS_DIR);
  return characterCache;
}

/**
 * Parses a query string boolean value. Returns true for any value except
 * the literal string "false".
 *
 * @param {string | undefined} val - The query parameter value.
 * @returns {boolean}
 */
function parseBoolQuery(val) {
  return val !== 'false';
}

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use('/assets', express.static(ASSETS_DIR));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.render('home', { characters: listCharacters() });
});

app.get('/embed/:character.js', (req, res, next) => {
  let model;
  try {
    model = readCharacterFiles(ASSETS_DIR, req.params.character);
  } catch (err) {
    console.error(`Failed to access character directory: ${req.params.character}`, err);
    return next(err);
  }

  if (!model) {
    return res.status(404).send('Character not found');
  }
  if (!model.skel || !model.atlas) {
    return res.status(500).send('Missing model files (need .skel, .atlas)');
  }

  const proto = req.get('x-forwarded-proto') || req.protocol;
  const base = `${proto}://${req.get('host')}`;

  res.type('application/javascript');
  res.render('embed', {
    name: req.params.character,
    skel: `${base}/assets/${req.params.character}/${model.skel}`,
    atlas: `${base}/assets/${req.params.character}/${model.atlas}`,
    defaultAnim: req.query.animation || DEFAULT_ANIMATION,
    loop: parseBoolQuery(req.query.loop),
    touchAnim: req.query.touch || DEFAULT_TOUCH_ANIM,
  });
});

app.get('/:character', (req, res, next) => {
  let model;
  try {
    model = readCharacterFiles(ASSETS_DIR, req.params.character);
  } catch (err) {
    console.error(`Failed to access character directory: ${req.params.character}`, err);
    return next(err);
  }

  if (!model) {
    return res.status(404).send('Character not found');
  }
  if (!model.skel || !model.atlas || !model.png) {
    return res.status(500).send('Missing model files (need .skel, .atlas, .png)');
  }

  res.render('character', {
    name: req.params.character,
    skel: `/assets/${req.params.character}/${model.skel}`,
    atlas: `/assets/${req.params.character}/${model.atlas}`,
    png: `/assets/${req.params.character}/${model.png}`,
    defaultAnim: req.query.animation || DEFAULT_ANIMATION,
    loop: parseBoolQuery(req.query.loop),
    touchAnim: req.query.touch || DEFAULT_TOUCH_ANIM,
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).send('Internal server error');
});

app.listen(config.port, () => {
  console.log(`Live2D service running on http://localhost:${config.port}`);

  const characters = listCharacters();
  generatePreviews(characters, `http://localhost:${config.port}`);
});
