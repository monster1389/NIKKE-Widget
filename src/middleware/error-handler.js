function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err.message);
  res.status(500).send('Internal server error');
}

module.exports = errorHandler;
