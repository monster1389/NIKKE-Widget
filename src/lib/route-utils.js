const DEFAULT_ANIMATION = 'idle';
const DEFAULT_TOUCH_ANIM = 'action';

function parseBoolQuery(val) {
  return val !== 'false';
}

module.exports = { DEFAULT_ANIMATION, DEFAULT_TOUCH_ANIM, parseBoolQuery };
