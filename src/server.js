const express = require('express');
const helmet = require('helmet');
const protectedApisRouter = require('./routes/protectedApis');

const app = express();

app.use(helmet());
app.use(protectedApisRouter);

app.use((error, _req, res, _next) => {
  if (error && error.message) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(500).json({ error: 'Unexpected server error' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Secure API listening on port ${PORT}`);
  });
}

module.exports = app;
