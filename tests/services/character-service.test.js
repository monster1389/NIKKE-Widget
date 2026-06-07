const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  listCharacters,
  readCharacterFiles,
  deleteCharacter,
  renameCharacter,
  invalidateCache,
} = require('../../src/services/character-service');

describe('character-service', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'live2d-test-'));
    // Create test characters
    fs.mkdirSync(path.join(tempDir, 'testchar0'));
    fs.writeFileSync(path.join(tempDir, 'testchar0', 'model.skel'), 'skel');
    fs.writeFileSync(path.join(tempDir, 'testchar0', 'model.atlas'), 'atlas');
    fs.writeFileSync(path.join(tempDir, 'testchar0', 'model.png'), 'png');
    fs.writeFileSync(path.join(tempDir, 'testchar0', 'preview.png'), 'preview');

    fs.mkdirSync(path.join(tempDir, 'testchar1'));
    fs.writeFileSync(path.join(tempDir, 'testchar1', 'data.skel'), 'skel');
    fs.writeFileSync(path.join(tempDir, 'testchar1', 'data.atlas'), 'atlas');
    // no preview

    invalidateCache();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    invalidateCache();
  });

  describe('listCharacters', () => {
    it('lists all character directories', () => {
      const chars = listCharacters(tempDir);
      expect(chars).toHaveLength(2);
      expect(chars[0].name).toBe('testchar0');
      expect(chars[0].preview).toBe('/assets/testchar0/preview.png');
      expect(chars[1].preview).toBeNull();
    });

    it('skips non-directories', () => {
      fs.writeFileSync(path.join(tempDir, 'notadir.txt'), 'nope');
      const chars = listCharacters(tempDir);
      expect(chars).toHaveLength(2);
    });

    it('returns cached result on second call', () => {
      const a = listCharacters(tempDir);
      // Remove a dir while cache is active
      fs.rmSync(path.join(tempDir, 'testchar1'), { recursive: true });
      const b = listCharacters(tempDir);
      expect(b).toHaveLength(2); // still cached
    });
  });

  describe('readCharacterFiles', () => {
    it('reads skel, atlas, and png files', () => {
      const result = readCharacterFiles(tempDir, 'testchar0');
      expect(result.skel).toBe('model.skel');
      expect(result.atlas).toBe('model.atlas');
      expect(result.png).toBe('model.png');
    });

    it('returns null for non-existent character', () => {
      expect(readCharacterFiles(tempDir, 'nope')).toBeNull();
    });

    it('excludes preview.png from png field', () => {
      const result = readCharacterFiles(tempDir, 'testchar0');
      expect(result.png).toBe('model.png');
    });
  });

  describe('deleteCharacter', () => {
    it('deletes the character directory', () => {
      deleteCharacter(tempDir, 'testchar0');
      expect(fs.existsSync(path.join(tempDir, 'testchar0'))).toBe(false);
    });

    it('invalidates cache after delete', () => {
      deleteCharacter(tempDir, 'testchar0');
      const chars = listCharacters(tempDir);
      expect(chars).toHaveLength(1);
    });
  });

  describe('renameCharacter', () => {
    it('renames the character directory', () => {
      renameCharacter(tempDir, 'testchar0', 'renamed0');
      expect(fs.existsSync(path.join(tempDir, 'testchar0'))).toBe(false);
      expect(fs.existsSync(path.join(tempDir, 'renamed0'))).toBe(true);
    });

    it('throws if new name already exists', () => {
      expect(() => renameCharacter(tempDir, 'testchar0', 'testchar1'))
        .toThrow('already exists');
    });

    it('invalidates cache after rename', () => {
      renameCharacter(tempDir, 'testchar0', 'renamed0');
      const chars = listCharacters(tempDir);
      expect(chars.find(c => c.name === 'renamed0')).toBeTruthy();
    });
  });
});
