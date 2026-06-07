// Detect non-local access (domain/remote IP) → read-only mode
// Local: localhost, 127.0.0.1, ::1, 192.168.x.x, hostnames without dots
const LOCAL_RE = /^(localhost|127\.0\.0\.1|::1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|\[::1\]|[^.]+)$/;

function domainGuard(req, res, next) {
  req.isReadonly = !LOCAL_RE.test(req.hostname);
  next();
}

module.exports = domainGuard;
