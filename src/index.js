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
  const characters = fs.readdirSync(assetsDir)
    .filter(name => {
      const stat = fs.statSync(path.join(assetsDir, name));
      return stat.isDirectory();
    })
    .map(name => {
      const dir = path.join(assetsDir, name);
      const files = fs.readdirSync(dir);
      const preview = files.find(f => f === 'preview.png')
        || files.find(f => f.endsWith('.png'));
      return {
        name,
        preview: preview ? `/assets/${name}/${preview}` : null,
      };
    });
  res.render('home', { characters });
});

app.get('/:character', (req, res) => {
  const charDir = path.join(__dirname, '..', 'assets', req.params.character);

  if (!fs.existsSync(charDir) || !fs.statSync(charDir).isDirectory()) {
    return res.status(404).send('Character not found');
  }

  const files = fs.readdirSync(charDir);
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
    defaultAnim: req.query.animation || '',
    loop: req.query.loop !== 'false',
    touchAnim: req.query.touch || 'touch',
  });
});

app.listen(PORT, () => {
  console.log(`Live2D service running on http://localhost:${PORT}`);
});
