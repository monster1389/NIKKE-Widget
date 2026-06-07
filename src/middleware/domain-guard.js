const BLOCKED_PATHS = ['/', '/api/scrape'];

function domainGuard(req, res, next) {
  if (req.hostname === 'live2d.rpi1204.xyz' && BLOCKED_PATHS.includes(req.path)) {
    return res.status(403).send('Forbidden');
  }
  next();
}

module.exports = domainGuard;
