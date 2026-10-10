// Sadbot's Journey To Bliss — core: canvas, helpers, assets, audio, input.
// Every module hangs off the global SB namespace; load order: core, draw, world, stages, game.
(() => {
  'use strict';
  const SB = (window.SB = {});
  SB.W = 960; SB.H = 540; SB.GY = 460;
  SB.DISPLAY = '"Cormorant Garamond", Georgia, serif';
  SB.MONO = '"Courier Prime", "Courier New", monospace';

  // ---------------------------------------------------------------- canvas
  SB.canvas = document.getElementById('game');
  SB.ctx = SB.canvas.getContext('2d');
  SB.sx = 1; SB.sy = 1;
  SB.resize = () => {
    const c = SB.canvas, dpr = Math.min(window.devicePixelRatio || 1, 2), r = c.getBoundingClientRect();
    c.width = Math.max(1, Math.round(r.width * dpr));
    c.height = Math.max(1, Math.round(r.height * dpr));
    SB.sx = c.width / SB.W; SB.sy = c.height / SB.H;
  };
  window.addEventListener('resize', SB.resize);
  window.addEventListener('orientationchange', () => setTimeout(SB.resize, 250));
  document.addEventListener('fullscreenchange', () => setTimeout(SB.resize, 100));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', SB.resize);
  SB.resize();
  // offscreen canvas for cave darkness / lighting
  SB.light = document.createElement('canvas');
  SB.light.width = SB.W; SB.light.height = SB.H;
  SB.lctx = SB.light.getContext('2d');

  // ---------------------------------------------------------------- helpers
  SB.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  SB.lerp = (a, b, t) => a + (b - a) * t;
  SB.rand = (a, b) => a + Math.random() * (b - a);
  SB.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  SB.mulberry32 = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const hex2rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  SB.mix = (a, b, t) => {
    const A = hex2rgb(a), B = hex2rgb(b);
    return `rgb(${A.map((v, i) => Math.round(SB.lerp(v, B[i], t))).join(',')})`;
  };
  SB.store = (key, val) => {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { /* storage blocked */ }
    return null;
  };
  SB.overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  SB.rectCircle = (r, cx, cy, rad) => {
    const nx = SB.clamp(cx, r.x, r.x + r.w), ny = SB.clamp(cy, r.y, r.y + r.h);
    return (nx - cx) ** 2 + (ny - cy) ** 2 < rad * rad;
  };
  SB.fmtTime = (frames) => { const s = Math.floor(frames / 60); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  // ---------------------------------------------------------------- assets
  SB.IMG = {};
  const IMG_SRC = {
    wake: 'assets/01_wake.jpg', drawing: 'assets/02_drawing.jpg', city: 'assets/03_city.jpg',
    school: 'assets/04_school.webp', highway: 'assets/05_highway.webp',
    kevin: 'assets/kevin.jpg', milo: 'assets/milo.jpg', logo: 'assets/logo.webp',
  };
  // Retry a couple of times: flaky connections sometimes drop one of several parallel requests.
  const loadImage = (k, src, tries = 0) => new Promise((res) => {
    const i = new Image();
    i.onload = () => { SB.IMG[k] = i; res(); };
    i.onerror = () => (tries < 3 ? setTimeout(() => loadImage(k, `${src}?r=${tries + 1}`, tries + 1).then(res), 400) : res());
    i.src = src;
  });
  const imagesReady = Promise.all(Object.entries(IMG_SRC).map(([k, src]) => loadImage(k, src)));
  const fontsReady = (document.fonts && document.fonts.load)
    ? Promise.race([
      Promise.all(['italic 600 40px "Cormorant Garamond"', 'italic 500 40px "Cormorant Garamond"', '600 40px "Cormorant Garamond"',
        '16px "Courier Prime"', '700 16px "Courier Prime"'].map((f) => document.fonts.load(f))).catch(() => {}),
      new Promise((r) => setTimeout(r, 2500)),
    ])
    : Promise.resolve();
  SB.assetsReady = Promise.all([imagesReady, fontsReady]);

  // ---------------------------------------------------------------- audio
  let muted = SB.store('sadbot.muted') === '1';
  SB.isMuted = () => muted;
  const music = new Audio('assets/music.mp4');
  music.loop = true; music.volume = 0;
  try { music.preservesPitch = false; } catch (e) { /* older browsers */ }
  const VO = [1, 2, 3, 4, 5].map((n) => { const a = new Audio(`assets/vo${n}.mp4`); a.preload = 'auto'; return a; });
  let AC = null, noiseBuf = null;
  SB.unlockAudio = () => {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
    if (AC && AC.state === 'suspended') AC.resume();
    if (!muted && music.paused) music.play().catch(() => {});
  };
  SB.setMusicRate = (r) => { try { music.playbackRate = r; } catch (e) { /* ignore */ } };
  function tone(f0, f1, dur, type = 'square', vol = 0.08, delay = 0) {
    if (!AC || muted) return;
    const t = AC.currentTime + delay;
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(AC.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol = 0.1, freq = 1200, delay = 0) {
    if (!AC || muted) return;
    if (!noiseBuf) {
      noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = AC.currentTime + delay;
    const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(AC.destination);
    s.start(t); s.stop(t + dur + 0.02);
  }
  SB.SFX = {
    jump: () => tone(240, 520, 0.14, 'square', 0.045),
    stomp: () => { noise(0.18, 0.2, 900); tone(170, 55, 0.2, 'sine', 0.22); },
    hurt: () => { tone(330, 80, 0.32, 'sawtooth', 0.08); noise(0.22, 0.08, 2200); },
    pulse: () => { tone(150, 45, 0.5, 'sine', 0.28); noise(0.45, 0.1, 700); },
    gear: () => { tone(880, 880, 0.05, 'triangle', 0.05); tone(1320, 1320, 0.08, 'triangle', 0.045, 0.05); },
    battery: () => [523, 659, 784].forEach((f, i) => tone(f, f, 0.14, 'triangle', 0.07, i * 0.07)),
    memory: () => [659, 784, 988, 1319].forEach((f, i) => tone(f, f * 0.998, 0.6, 'sine', 0.06, i * 0.13)),
    shoot: () => tone(720, 280, 0.12, 'square', 0.025),
    boom: () => { noise(1.0, 0.3, 480); tone(120, 28, 0.9, 'sine', 0.25); },
    explode: () => { noise(0.8, 0.35, 650); tone(95, 30, 0.6, 'sine', 0.3); },
    blip: () => tone(1150, 1150, 0.018, 'square', 0.01),
    checkpoint: () => [392, 523, 659].forEach((f, i) => tone(f, f, 0.3, 'sine', 0.07, i * 0.1)),
    zap: () => noise(0.12, 0.05, 4000),
    alarm: () => [880, 660, 880, 660].forEach((f, i) => tone(f, f, 0.12, 'square', 0.03, i * 0.14)),
    bark: () => { tone(520, 360, 0.08, 'square', 0.05); tone(520, 340, 0.08, 'square', 0.05, 0.13); },
    thunder: () => { noise(2.2, 0.28, 260, 0.1); noise(0.4, 0.2, 1200); },
    splash: () => noise(0.45, 0.16, 1700),
    beep: () => tone(1500, 1500, 0.05, 'square', 0.035),
    throw: () => tone(380, 720, 0.12, 'triangle', 0.04),
    sling: () => tone(950, 480, 0.08, 'triangle', 0.045),
    howl: () => { tone(300, 620, 0.7, 'sawtooth', 0.035); tone(620, 430, 0.8, 'sine', 0.05, 0.6); },
    laser: () => tone(1800, 600, 0.15, 'sawtooth', 0.025),
    rumble: () => noise(1.6, 0.22, 180),
    snap: () => { noise(0.1, 0.25, 3200); tone(220, 90, 0.12, 'square', 0.08); },
    swing: () => noise(0.16, 0.07, 1500),
    wind: () => noise(1.6, 0.05, 420),
    crumble: () => noise(0.45, 0.1, 800),
    meow: () => { tone(700, 900, 0.15, 'sine', 0.04); tone(900, 600, 0.25, 'sine', 0.04, 0.15); },
    trumpet: () => { tone(220, 330, 0.5, 'sawtooth', 0.05); tone(330, 280, 0.6, 'sawtooth', 0.04, 0.45); },
    roar: () => { tone(120, 70, 0.7, 'sawtooth', 0.08); noise(0.7, 0.12, 500); },
  };
  let currentVO = null;
  SB.playVO = (i) => {
    const a = VO[i];
    if (!a || muted) return;
    try { a.currentTime = 0; a.play().catch(() => {}); currentVO = a; } catch (e) { /* ignore */ }
  };
  SB.stopVO = () => { if (currentVO) { try { currentVO.pause(); } catch (e) { /* ignore */ } currentVO = null; } };
  SB.voActive = () => currentVO && !currentVO.paused && !currentVO.ended;
  SB.updateMusic = () => {
    const target = muted ? 0 : (SB.voActive() ? 0.1 : 0.3);
    music.volume = SB.clamp(music.volume + (target - music.volume) * 0.05, 0, 1);
  };
  SB.toggleMute = () => {
    muted = !muted;
    SB.store('sadbot.muted', muted ? '1' : '0');
    if (muted) SB.stopVO(); else SB.unlockAudio();
    return muted;
  };

  // ---------------------------------------------------------------- input
  SB.keys = new Set(); SB.pressed = new Set();
  const KEYMAP = {
    ArrowLeft: ['left'], KeyA: ['left'], ArrowRight: ['right'], KeyD: ['right'],
    ArrowUp: ['jump', 'up'], KeyW: ['jump', 'up'], Space: ['jump'], KeyZ: ['jump'],
    ArrowDown: ['down'], KeyS: ['down'],
    KeyX: ['pulse'], KeyJ: ['pulse'], KeyE: ['talk'], Enter: ['confirm'],
    Escape: ['pause', 'skip'], KeyP: ['pause'], KeyM: ['mute'],
  };
  SB.press = (a) => {
    if (!SB.keys.has(a)) {
      SB.pressed.add(a);
      if (a === 'jump' || a === 'talk' || a === 'confirm') SB.pressed.add('advance');
    }
    SB.keys.add(a);
    SB.unlockAudio();
  };
  // Typing in a form field (the sign-in email box) must never drive the game.
  const inField = (e) => e.target && (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable);
  window.addEventListener('keydown', (e) => {
    if (inField(e) || document.querySelector('dialog[open]')) return;
    const acts = KEYMAP[e.code];
    if (!acts) return;
    e.preventDefault();
    acts.forEach(SB.press);
  });
  window.addEventListener('keyup', (e) => { const acts = KEYMAP[e.code]; if (acts) acts.forEach((a) => SB.keys.delete(a)); });
  window.addEventListener('blur', () => SB.keys.clear());
  // Pointer on the canvas: remember where (in game coordinates) so menus can be tapped.
  SB.tapAt = null;
  SB.canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') SB.setTouch(true);
    const r = SB.canvas.getBoundingClientRect();
    SB.tapAt = { x: (e.clientX - r.left) / r.width * SB.W, y: (e.clientY - r.top) / r.height * SB.H };
    SB.canvas.focus(); SB.pressed.add('confirm'); SB.pressed.add('advance'); SB.pressed.add('tap'); SB.unlockAudio();
  });

  // ---------------------------------------------------------------- touch
  // Phones and tablets get on-screen controls, tap prompts and a full-screen landscape layout.
  SB.touch = false;
  SB.setTouch = (on) => {
    if (SB.touch === on) return;
    SB.touch = on;
    document.documentElement.classList.toggle('touch-ui', on);
    setTimeout(SB.resize, 50);
  };
  const mq = (q) => window.matchMedia && window.matchMedia(q).matches;
  SB.setTouch((mq('(any-pointer: coarse)') && !mq('(pointer: fine) and (hover: hover)')) || /[#&]touch/.test(location.hash));
  window.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') SB.setTouch(true); }, true);
  window.addEventListener('keydown', (e) => { if (!inField(e) && KEYMAP[e.code] && !mq('(any-pointer: coarse)')) SB.setTouch(false); });

  const capture = (el, e) => { try { el.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ } };
  const tapButton = (b, act) => {
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); SB.press(act); setTimeout(() => SB.keys.delete(act), 60); });
  };
  const touchEl = document.getElementById('touch');
  if (touchEl) {
    // Movement pad: one surface for both directions, so a thumb can slide between left and right.
    const pad = touchEl.querySelector('.dpad');
    if (pad) {
      const held = new Map();
      const sync = () => {
        const dirs = new Set(held.values());
        ['left', 'right'].forEach((d) => { if (dirs.has(d)) { if (!SB.keys.has(d)) SB.press(d); } else SB.keys.delete(d); });
        pad.dataset.dir = dirs.size === 1 ? [...dirs][0] : '';
      };
      const side = (e) => { const r = pad.getBoundingClientRect(); return e.clientX < r.left + r.width / 2 ? 'left' : 'right'; };
      pad.addEventListener('pointerdown', (e) => { e.preventDefault(); capture(pad, e); held.set(e.pointerId, side(e)); sync(); });
      pad.addEventListener('pointermove', (e) => { if (held.has(e.pointerId)) { held.set(e.pointerId, side(e)); sync(); } });
      const end = (e) => { held.delete(e.pointerId); sync(); };
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => pad.addEventListener(t, end));
    }
    touchEl.querySelectorAll('button[data-act]').forEach((b) => {
      const act = b.dataset.act;
      if (b.dataset.tap !== undefined) { tapButton(b, act); return; }
      const up = (e) => { e.preventDefault(); SB.keys.delete(act); b.classList.remove('down'); };
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); capture(b, e); SB.press(act); b.classList.add('down'); });
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
      b.addEventListener('lostpointercapture', up);
    });
    touchEl.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  // Full screen (and landscape lock where the browser allows it).
  const fsBtn = document.getElementById('fs-btn');
  const root = document.documentElement;
  const canFs = !!(root.requestFullscreen || root.webkitRequestFullscreen);
  if (fsBtn) {
    if (!canFs) fsBtn.hidden = true;
    fsBtn.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement || document.webkitFullscreenElement) { await (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
        await (root.requestFullscreen || root.webkitRequestFullscreen).call(root, { navigationUI: 'hide' });
        if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape').catch(() => {});
      } catch (e) { /* not allowed here; the layout still fits the screen */ }
      SB.canvas.focus();
    });
  }
  // Portrait phones: suggest turning sideways (can be dismissed).
  const rot = document.getElementById('rotate');
  if (rot) rot.querySelector('button').addEventListener('click', () => { rot.classList.add('dismissed'); SB.unlockAudio(); });
})();
