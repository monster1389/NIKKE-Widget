const path = require('path');
const fs = require('fs');

/** @type {Array<{ name: string, dir: string, preview: string | null }> | null} */
let cache = null;

function invalidateCache() {
  cache = null;
}

function listCharacters(assetsDir) {
  if (cache) return cache;

  let entries;
  try {
    entries = fs.readdirSync(assetsDir);
  } catch {
    console.error(`Cannot read assets directory: ${assetsDir}`);
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

    const hasPreview = files.includes('preview.png');
    characters.push({
      name,
      dir,
      preview: hasPreview ? `/assets/${name}/preview.png` : null,
    });
  }

  cache = characters;
  return characters;
}

function readCharacterFiles(assetsDir, name) {
  const charDir = path.join(assetsDir, name);

  let stat;
  try {
    stat = fs.statSync(charDir);
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
  if (!stat.isDirectory()) return null;

  const files = fs.readdirSync(charDir);

  const result = {};
  for (const f of files) {
    if (f.endsWith('.skel')) result.skel = f;
    else if (f.endsWith('.atlas')) result.atlas = f;
    else if (f.endsWith('.png') && f !== 'preview.png') result.png = f;
  }

  return result;
}

function deleteCharacter(assetsDir, name) {
  const charDir = path.join(assetsDir, name);
  if (!fs.existsSync(charDir)) {
    throw new Error(`Character "${name}" not found`);
  }
  fs.rmSync(charDir, { recursive: true, force: true });
  invalidateCache();
}

function renameCharacter(assetsDir, name, newName) {
  const charDir = path.join(assetsDir, name);
  const newDir = path.join(assetsDir, newName);

  if (!fs.existsSync(charDir)) {
    throw new Error(`Character "${name}" not found`);
  }
  if (fs.existsSync(newDir)) {
    throw new Error(`Character "${newName}" already exists`);
  }

  fs.renameSync(charDir, newDir);
  invalidateCache();
}

module.exports = {
  listCharacters,
  readCharacterFiles,
  deleteCharacter,
  renameCharacter,
  invalidateCache,
};
