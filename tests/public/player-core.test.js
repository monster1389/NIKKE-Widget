const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(
  path.join(__dirname, '..', '..', 'public', 'js', 'player-core.js'),
  'utf8'
);

function makeSandbox() {
  var mockContainer = { dataset: {} };
  var mockCanvas = { style: {}, addEventListener: function () {} };
  return {
    window: { addEventListener: function () {}, parent: { postMessage: function () {} } },
    document: {
      getElementById: function (id) {
        return (id === 'container' || id === 'live2d-widget') ? mockContainer : null;
      },
      currentScript: null,
    },
    spine: {
      SpinePlayer: function () {
        return {
          canvas: mockCanvas,
          skeleton: {
            data: { animations: [], skins: [] },
            setSkinByName: function () {},
            setSlotsToSetupPose: function () {},
            setToSetupPose: function () {},
            updateWorldTransform: function () {},
            getBoundsRect: function () { return { x: 0, y: 0, width: 100, height: 100 }; },
          },
          animationState: { addListener: function () {} },
          setAnimation: function () {},
          play: function () {},
          calculateAnimationViewport: function () {},
        };
      },
      MixBlend: { setup: 0 },
      MixDirection: { mix: 0 },
    },
    console: { error: function () {} },
  };
}

describe('player-core.js', () => {
  it('defines switchCharacter on Live2DPlayer', () => {
    var sandbox = makeSandbox();
    sandbox.window.Live2DPlayer = undefined;

    var script = new vm.Script(source);
    var ctx = vm.createContext(sandbox);
    script.runInContext(ctx);

    expect(sandbox.window.Live2DPlayer).toBeDefined();
    expect(typeof sandbox.window.Live2DPlayer.switchCharacter).toBe('function');
  });

  it('exports setCanvasClick method', () => {
    var sandbox = makeSandbox();

    var script = new vm.Script(source);
    var ctx = vm.createContext(sandbox);
    script.runInContext(ctx);

    expect(typeof sandbox.window.Live2DPlayer.setCanvasClick).toBe('function');
  });

  it('switchCharacter disposes old player and calls SpinePlayer with new URLs', () => {
    var sandbox = makeSandbox();
    var newPlayerCreated = false;
    var lastBinaryUrl = null;
    var lastAtlasUrl = null;
    var disposeCount = 0;

    var mockCanvas = {
      style: {},
      addEventListener: function () {},
    };

    sandbox.spine.SpinePlayer = function (container, opts) {
      newPlayerCreated = true;
      lastBinaryUrl = opts.binaryUrl;
      lastAtlasUrl = opts.atlasUrl;
      return {
        canvas: mockCanvas,
        dispose: function () { disposeCount++; },
        skeleton: {
          data: { animations: [], skins: [] },
          setSkinByName: function () {},
          setSlotsToSetupPose: function () {},
          setToSetupPose: function () {},
          updateWorldTransform: function () {},
          getBoundsRect: function () { return { x: 0, y: 0, width: 100, height: 100 }; },
        },
        animationState: { addListener: function () {} },
        setAnimation: function () {},
        play: function () {},
        calculateAnimationViewport: function () {},
      };
    };

    var script = new vm.Script(source);
    var ctx = vm.createContext(sandbox);
    script.runInContext(ctx);

    var player = sandbox.window.Live2DPlayer;
    expect(player).toBeDefined();

    // First creation happened during init
    expect(newPlayerCreated).toBe(true);
    newPlayerCreated = false;

    // Call switchCharacter
    player.switchCharacter('/assets/other/model.skel', '/assets/other/model.atlas');

    // Old player should be disposed
    expect(disposeCount).toBe(1);
    // New player created
    expect(newPlayerCreated).toBe(true);
    expect(lastBinaryUrl).toBe('/assets/other/model.skel');
    expect(lastAtlasUrl).toBe('/assets/other/model.atlas');
  });
});
