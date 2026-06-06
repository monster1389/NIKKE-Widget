module.exports = {
  apps: [{
    name: 'live2d',
    script: 'src/index.js',
    env: {
      PORT: 8090,
      NODE_ENV: 'production',
    },
    autorestart: true,
    watch: false,
  }],
};
