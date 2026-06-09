const { Router } = require('express');
const { listCharacters, readCharacterFiles } = require('../services/character-service');
const { DEFAULT_ANIMATION, DEFAULT_TOUCH_ANIM, parseBoolQuery } = require('../lib/route-utils');
const config = require('../../config');

const router = Router();

router.get('/', (req, res) => {
  res.render('home', {
    characters: listCharacters(config.assetsDir),
    readonly: req.isReadonly,
  });
});

router.get('/:character', (req, res, next) => {
  let model;
  try {
    model = readCharacterFiles(config.assetsDir, req.params.character);
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

  const characters = listCharacters(config.assetsDir);
  const charNames = characters.map(c => c.name);
  const currentIndex = charNames.indexOf(req.params.character);

  res.render('character', {
    name: req.params.character,
    skel: `/assets/${req.params.character}/${model.skel}`,
    atlas: `/assets/${req.params.character}/${model.atlas}`,
    png: `/assets/${req.params.character}/${model.png}`,
    defaultAnim: req.query.animation || DEFAULT_ANIMATION,
    loop: parseBoolQuery(req.query.loop),
    touchAnim: req.query.touch || DEFAULT_TOUCH_ANIM,
    screenshot: req.query.screenshot === '1',
    allChars: charNames,
    currentIndex: currentIndex,
    prevChar: currentIndex > 0 ? charNames[currentIndex - 1] : charNames[charNames.length - 1],
    nextChar: currentIndex < charNames.length - 1 ? charNames[currentIndex + 1] : charNames[0],
  });
});

module.exports = router;
