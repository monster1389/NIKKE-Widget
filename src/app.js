const express = require('express');
const path = require('path');
const cors = require('./middleware/cors');
const domainGuard = require('./middleware/domain-guard');
const errorHandler = require('./middleware/error-handler');
const pagesRouter = require('./routes/pages');
const embedRouter = require('./routes/embed');
const apiRouter = require('./routes/api');
const config = require('../config');

function createApp() {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));

  app.use(cors());
  app.use(domainGuard);
  app.use('/assets', express.static(config.assetsDir));
  app.use('/public', express.static(path.join(__dirname, '..', 'public')));

  app.use('/', pagesRouter);
  app.use('/embed', embedRouter);
  app.use('/api', apiRouter);

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
