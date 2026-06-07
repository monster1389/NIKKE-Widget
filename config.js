const path = require('path');

// Hosts allowed to perform write operations (scrape, delete, rename).
// Supports wildcards: 192.168.* matches 192.168.x.x, rpi* matches rpi.local etc.
// Override via ALLOW_HOSTS env (comma-separated).
const DEFAULT_ALLOW_HOSTS = [
  'localhost',
  '127.0.0.1',
  '[::1]',
  '192.168.*',
  '10.*',
  '172.1[6-9].*',
  '172.2[0-9].*',
  '172.3[01].*',
];

function parseAllowHosts(env) {
  if (!env) return DEFAULT_ALLOW_HOSTS;
  return env.split(',').map(h => h.trim()).filter(Boolean);
}

function hostnameAllowed(hostname, patterns) {
  // Hostnames without a dot are always local (e.g. rpi, myserver)
  if (!hostname.includes('.') && !hostname.includes(':')) return true;
  return patterns.some(p => {
    const re = new RegExp('^' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*') + '$');
    return re.test(hostname);
  });
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 8090,
  assetsDir: process.env.ASSETS_DIR || path.join(__dirname, 'assets'),
  chromiumFallback: process.env.CHROMIUM_PATH || null,
  allowHosts: parseAllowHosts(process.env.ALLOW_HOSTS),
  hostnameAllowed,
};
