const path = require('path');
const fs = require('fs');

/**
 * Reads and validates a character directory, returning found model files.
 *
 * @param {string} assetsDir - Absolute path to the assets directory.
 * @param {string} name - Character folder name.
 * @returns {{ charDir: string, skel?: string, atlas?: string, png?: string } | null}
 *   The character directory and found model filenames, or null if not found.
 */
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

  const result = { charDir };
  for (const f of files) {
    if (f.endsWith('.skel')) result.skel = f;
    else if (f.endsWith('.atlas')) result.atlas = f;
    else if (f.endsWith('.png') && f !== 'preview.png') result.png = f;
  }

  return result;
}

/**
 * Lists all character directories under assetsDir.
 *
 * @param {string} assetsDir - Absolute path to the assets directory.
 * @returns {Array<{ name: string, dir: string, preview: string | null }>}
 */
function getCharacters(assetsDir) {
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
  return characters;
}

module.exports = { getCharacters, readCharacterFiles };
