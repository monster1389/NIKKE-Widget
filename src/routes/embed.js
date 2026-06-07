const { Router } = require('express');
const { readCharacterFiles } = require('../services/character-service');
const config = require('../../config');

const router = Router();

const DEFAULT_ANIMATION = 'idle';
const DEFAULT_TOUCH_ANIM = 'action';

function parseBoolQuery(val) {
  return val !== 'false';
}

router.get('/:character.js', (req, res, next) => {
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
    controls: parseBoolQuery(req.query.controls),
    targetHeight: parseInt(req.query.targetHeight) || 0,
  });
});

module.exports = router;
