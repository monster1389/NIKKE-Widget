const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8090;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  const assetsDir = path.join(__dirname, '..', 'assets');

  let entries;
  try {
    entries = fs.readdirSync(assetsDir);
  } catch {
    return res.render('home', { characters: [] });
  }

  const characters = [];
  for (const name of entries) {
    let stat;
    try {
      stat = fs.statSync(path.join(assetsDir, name));
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;

    const dir = path.join(assetsDir, name);
    let files;
    try {
      files = fs.readdirSync(dir);
    } catch {
      continue;
    }
    const preview = files.find(f => f === 'preview.png')
      || files.find(f => f.endsWith('.png'));
    characters.push({
      name,
      preview: preview ? `/assets/${name}/${preview}` : null,
    });
  }
  res.render('home', { characters });
});

app.get('/:character', (req, res, next) => {
  const charDir = path.join(__dirname, '..', 'assets', req.params.character);

  try {
    if (!fs.existsSync(charDir) || !fs.statSync(charDir).isDirectory()) {
      return res.status(404).send('Character not found');
    }
  } catch {
    return next(new Error(`Failed to access character directory: ${req.params.character}`));
  }

  let files;
  try {
    files = fs.readdirSync(charDir);
  } catch {
    return next(new Error(`Failed to read character directory: ${req.params.character}`));
  }

  const skel = files.find(f => f.endsWith('.skel'));
  const atlas = files.find(f => f.endsWith('.atlas'));
  const png = files.find(f => f.endsWith('.png'));

  if (!skel || !atlas || !png) {
    return res.status(500).send('Missing model files (need .skel, .atlas, .png)');
  }

  res.render('character', {
    name: req.params.character,
    skel: `/assets/${req.params.character}/${skel}`,
    atlas: `/assets/${req.params.character}/${atlas}`,
    png: `/assets/${req.params.character}/${png}`,
    defaultAnim: req.query.animation || 'idle',
    loop: req.query.loop !== 'false',
    touchAnim: req.query.touch || 'action',
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).send('Internal server error');
});

app.listen(PORT, () => {
  console.log(`Live2D service running on http://localhost:${PORT}`);
});
