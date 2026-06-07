const path = require('path');
const fs = require('fs');

function getCharacters(assetsDir) {
  let entries;
  try {
    entries = fs.readdirSync(assetsDir);
  } catch {
    return [];
  }

  const characters = [];
  for (const name of entries) {
    const dir = path.join(assetsDir, name);
    let stat;
    try {
      stat = fs.statSync(dir);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;

    let files;
    try {
      files = fs.readdirSync(dir);
    } catch {
      continue;
    }
    const previewFile = files.find(f => f === 'preview.png')
      || files.find(f => f.endsWith('.png'));
    characters.push({
      name,
      dir,
      preview: previewFile ? `/assets/${name}/${previewFile}` : null,
      hasPreview: files.includes('preview.png'),
    });
  }
  return characters;
}

module.exports = { getCharacters };
