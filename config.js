const path = require('path');

module.exports = {
  port: parseInt(process.env.PORT, 10) || 8090,
  assetsDir: process.env.ASSETS_DIR || path.join(__dirname, 'assets'),
  chromiumFallback: process.env.CHROMIUM_PATH || null,
};
