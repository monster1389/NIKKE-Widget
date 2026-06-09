(function() {
  var container = document.getElementById('container') || document.getElementById('live2d-widget');
  if (!container) {
    console.error('player-core: no container element found');
    return;
  }

  var ds = container.dataset;
  var defaultAnim = ds.animation || 'idle';
  var loop = ds.loop !== 'false';
  var touchAnimName = ds.touch || 'action';
  var viewportMode = ds.viewport || 'padded';
  var sendSize = ds.sendSize === 'true';
  var worldHeight = parseFloat(ds.worldHeight) || 0;

  var animations = [];
  var currentIdleAnim = defaultAnim;
  var actionPlaying = false;
  var canvasClickEnabled = true;
  var player;
  var currentSkinIndex = 0;
  var skinNames = [];
  var callbacks = {};

  function sendParent(data) {
    window.parent.postMessage(data, '*');
  }

  function switchSkin(index) {
    if (!player || skinNames.length === 0) return;
    while (index < 0) index += skinNames.length;
    index = index % skinNames.length;
    currentSkinIndex = index;
    player.skeleton.setSkinByName(skinNames[index]);
    player.skeleton.setSlotsToSetupPose();
    if (callbacks.onSkinChange) callbacks.onSkinChange(index, skinNames[index], skinNames.length);
  }

  function nextSkin() { switchSkin(currentSkinIndex + 1); }
  function prevSkin() { switchSkin(currentSkinIndex - 1); }

  function playAnimation(name, isLoop) {
    if (!player || animations.indexOf(name) < 0) return;
    if (!isLoop) {
      actionPlaying = true;
    }
    player.setAnimation(name, isLoop !== false);
  }

  function onPlayerReady(p) {
    p.canvas.style.background = 'transparent';
    animations = p.skeleton.data.animations.map(function(a) { return a.name; });
    skinNames = p.skeleton.data.skins.map(function(s) { return s.name; });

    if (skinNames.length > 0) {
      currentSkinIndex = skinNames.length - 1;
      p.skeleton.setSkinByName(skinNames[currentSkinIndex]);
      p.skeleton.setSlotsToSetupPose();
    }

    if (animations.indexOf(currentIdleAnim) < 0) {
      if (animations.indexOf(defaultAnim) >= 0) {
        currentIdleAnim = defaultAnim;
      } else {
        currentIdleAnim = animations[0] || '';
      }
    }

    var skeleton = p.skeleton;
    var idleAnim = skeleton.data.animations.find(function(a) { return a.name === currentIdleAnim; });
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    var steps = Math.max(2, Math.min(10, Math.floor((idleAnim ? idleAnim.duration : 0) * 4)));
    for (var i = 0; i <= steps; i++) {
      skeleton.setToSetupPose();
      if (idleAnim) {
        idleAnim.apply(skeleton, (i / steps) * idleAnim.duration, (i / steps) * idleAnim.duration, false, null, 1, spine.MixBlend.setup, spine.MixDirection.mix);
      }
      skeleton.updateWorldTransform();
      var b = skeleton.getBoundsRect();
      if (!b || b.width === 0 || b.height === 0) continue;
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    }
    skeleton.setToSetupPose();
    skeleton.updateWorldTransform();

    var frozenViewport;
    if (viewportMode === 'padded') {
      var cx = (minX + maxX) / 2;
      var cy = (minY + maxY) / 2;
      if (worldHeight > 0) {
        frozenViewport = {
          x: cx - worldHeight / 2,
          y: cy - worldHeight / 2,
          width: worldHeight,
          height: worldHeight
        };
      } else {
        var pad = 0.2;
        var size = Math.max(maxX - minX, maxY - minY) * (1 + pad);
        frozenViewport = {
          x: cx - size / 2,
          y: cy - size / 2,
          width: size,
          height: size
        };
      }
    } else {
      frozenViewport = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }

    p.calculateAnimationViewport = function(anim, vp) {
      vp.x = frozenViewport.x;
      vp.y = frozenViewport.y;
      vp.width = frozenViewport.width;
      vp.height = frozenViewport.height;
    };

    if (sendSize) {
      sendParent({ type: 'size', width: frozenViewport.width, height: frozenViewport.height });
    }

    p.setAnimation(currentIdleAnim, loop);
    p.play();
    sendParent({ type: 'ready', animations: animations, skins: skinNames });

    p.animationState.addListener({
      complete: function(entry) {
        if (!entry.loop) {
          actionPlaying = false;
          p.setAnimation(currentIdleAnim, true);
          sendParent({ type: 'ended', animation: entry.animation.name });
        }
      }
    });

    p.canvas.addEventListener('click', function() {
      if (!canvasClickEnabled) return;
      if (animations.indexOf(touchAnimName) < 0) return;
      actionPlaying = true;
      p.setAnimation(touchAnimName, false);
      sendParent({ type: 'playing', animation: touchAnimName });
    });

    if (callbacks.onReady) callbacks.onReady(p, animations, skinNames);
  }

  function createPlayer(skelUrl, atlasUrl) {
    var skel = skelUrl || container.dataset.skels || container.dataset.skel;
    var atlas = atlasUrl || container.dataset.atlas;

    try {
      return new spine.SpinePlayer(container, {
        binaryUrl: skel,
        atlasUrl: atlas,
        animation: currentIdleAnim || undefined,
        alpha: true,
        backgroundColor: '#00000000',
        premultipliedAlpha: true,
        showControls: false,
        showLoading: false,
        viewport: { transitionTime: 0 },
        success: onPlayerReady,
        error: function(p, msg) {
          console.error('Spine load error:', msg);
        },
      });
    } catch (e) {
      console.error('player-core: spine not loaded', e);
      return null;
    }
  }

  player = createPlayer();

  function switchCharacter(skelUrl, atlasUrl) {
    if (!player) return;
    try {
      if (player.dispose) {
        player.dispose();
      }
    } catch (e) {
      // ignore cleanup errors
    }
    player = null;

    container.dataset.skels = skelUrl;
    container.dataset.atlas = atlasUrl;

    animations = [];
    skinNames = [];
    actionPlaying = false;
    player = createPlayer(skelUrl, atlasUrl);
  }

  window.addEventListener('message', function(e) {
    var data = e.data || {};
    switch (data.action) {
      case 'play':
        if (!data.animation || animations.indexOf(data.animation) < 0) return;
        if (data.loop === false && actionPlaying) return;
        playAnimation(data.animation, data.loop !== false);
        break;
      case 'setIdle':
        if (!data.animation || animations.indexOf(data.animation) < 0) return;
        currentIdleAnim = data.animation;
        break;
      case 'getAnimations':
        sendParent({ type: 'animations', animations: animations });
        break;
      case 'setSkin':
        if (typeof data.index === 'number') switchSkin(data.index);
        else if (typeof data.name === 'string') {
          var idx = skinNames.indexOf(data.name);
          if (idx >= 0) switchSkin(idx);
        }
        break;
      case 'nextSkin': nextSkin(); break;
      case 'prevSkin': prevSkin(); break;
      case 'getSkins':
        sendParent({ type: 'skins', skins: skinNames, currentSkin: currentSkinIndex });
        break;
    }
  });

  window.Live2DPlayer = {
    nextSkin: nextSkin,
    prevSkin: prevSkin,
    switchSkin: switchSkin,
    playAnimation: playAnimation,
    switchCharacter: switchCharacter,
    getSkinCount: function() { return skinNames.length; },
    getCurrentSkin: function() { return currentSkinIndex; },
    getAnimations: function() { return animations; },
    on: function(event, fn) { callbacks[event] = fn; },
    setCanvasClick: function(enabled) { canvasClickEnabled = enabled; },
  };
})();
