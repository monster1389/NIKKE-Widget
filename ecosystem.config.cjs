const config = require('./config');

module.exports = {
  apps: [{
    name: 'live2d',
    script: 'src/server.js',
    env: {
      PORT: config.port,
      NODE_ENV: 'production',
    },
    autorestart: true,
    watch: false,
  }],
};
