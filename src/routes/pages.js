const { Router } = require('express');
const { listCharacters, readCharacterFiles } = require('../services/character-service');
const config = require('../../config');

const router = Router();

const DEFAULT_ANIMATION = 'idle';
const DEFAULT_TOUCH_ANIM = 'action';

function parseBoolQuery(val) {
  return val !== 'false';
}

router.get('/', (req, res) => {
  res.render('home', { characters: listCharacters(config.assetsDir) });
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

  res.render('character', {
    name: req.params.character,
    skel: `/assets/${req.params.character}/${model.skel}`,
    atlas: `/assets/${req.params.character}/${model.atlas}`,
    png: `/assets/${req.params.character}/${model.png}`,
    defaultAnim: req.query.animation || DEFAULT_ANIMATION,
    loop: parseBoolQuery(req.query.loop),
    touchAnim: req.query.touch || DEFAULT_TOUCH_ANIM,
    hideBack: req.query.screenshot === '1',
  });
});

module.exports = router;
