const config = require('../../config');

function domainGuard(req, res, next) {
  req.isReadonly = !config.hostnameAllowed(req.hostname, config.allowHosts);
  next();
}

module.exports = domainGuard;
