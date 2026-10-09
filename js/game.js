// Sadbot's Journey To Bliss — game logic: player, enemies, traps, allies, bosses, chases,
// stage flow, HUD, dialog, menus and the ending.
(() => {
  'use strict';
  const SB = window.SB;
  const { W, H, GY, clamp, lerp, rand, overlap, rectCircle, SFX, STAGES } = SB;
  const ctx = SB.ctx;
  const DISPLAY = SB.DISPLAY, MONO = SB.MONO;
  const DEV = /^#dev$/.test(location.hash);

  // ---------------------------------------------------------------- state
  let state = 'loading';
  let camX = 0, shake = 0;
  let L = null, stageIdx = 0;
  let dialog = null, bannerObj = null, overlayT = 0, slide = 0, slideT = 0, menuSel = 0, endT = 0;
  let nearNPC = null;
  SB.t = 0;
  const unlocked = () => (DEV ? STAGES.length : clamp(parseInt(SB.store('sadbot.unlocked') || '1', 10) || 1, 1, STAGES.length));

  const P = { x: 140, y: GY - 76, w: 30, h: 76, vx: 0, vy: 0, onGround: false, standOn: null, facing: 1, coyote: 0, jumpBuf: 0, inv: 0, pulseCd: 0, hasPulse: false, hearts: 3, walk: 0, root: 0, sink: 0, inQuick: false, safe: { x: 140, y: GY - 76 } };
  const pcx = () => P.x + P.w / 2;

  function banner(title, sub = '', dur = 170) { bannerObj = { title, sub, t: 0, dur }; }

  // ---------------------------------------------------------------- level build
  function groundAt(Lv, x) { return Lv.ground.find((g) => x >= g.x && x < g.x + g.w) || null; }
  function makeEnemy(Lv, s) {
    const [type, a, b, c] = s;
    const seg = (x) => groundAt(Lv, x) || { x: a, w: (b || a) - a, y: GY };
    switch (type) {
      case 'drone': return { type, x: a - 18, y: b - 10, w: 36, h: 20, baseY: b - 10, x0: a - c - 18, x1: a + c - 18, dir: 1, t: rand(0, 100), hp: 1, cd: 90 + rand(0, 60) };
      case 'hound': { const g = seg((a + b) / 2); return { type, x: (a + b) / 2 - 27, y: g.y - 30, w: 54, h: 30, x0: Math.max(a, g.x), x1: Math.min(b, g.x + g.w) - 54, dir: -1, hp: 2, t: 0, hurt: 0 }; }
      case 'scav': { const g = seg((a + b) / 2); return { type, skin: c || 'scav', x: (a + b) / 2 - 13, y: g.y - 70, w: 26, h: 70, x0: Math.max(a, g.x), x1: Math.min(b, g.x + g.w) - 26, dir: -1, hp: 2, t: 0, state: 'patrol', timer: 0, cd: 0, stun: 0 }; }
      case 'bomber': return { type, skin: c || 'scav', x: a - 13, y: b - 70, w: 26, h: 70, dir: -1, hp: 2, t: 0, cd: 90, stun: 0, throwT: 0 };
      case 'wolf': { const g = seg((a + b) / 2); return { type, x: (a + b) / 2 - 29, y: g.y - 32, w: 58, h: 32, gy: g.y, x0: Math.max(a, g.x), x1: Math.min(b, g.x + g.w) - 58, dir: -1, hp: 2, t: 0, state: 'patrol', timer: 0, cd: 0, vx: 0, vy: 0, stun: 0 }; }
      case 'rat': { const g = seg((a + b) / 2); return { type, x: a + rand(0, Math.max(1, b - a - 22)), y: g.y - 12, w: 22, h: 12, x0: Math.max(a, g.x), x1: Math.min(b, g.x + g.w) - 22, dir: Math.random() < 0.5 ? -1 : 1, hp: 1, t: rand(0, 100), turn: rand(30, 90), stun: 0 }; }
      case 'turret': return { type, x: a - 15, y: b - 34, w: 30, h: 34, dir: -1, hp: 3, t: 0, cd: 100, burst: 0, charge: 0, stun: 0 };
      case 'pylon': return { type, x: a - 12, y: b - 90, w: 24, h: 90, hp: 3, max: 3, t: 0, stun: 0, fromBoss: true };
      default: return null;
    }
  }
  function makeTrap(Lv, s) {
    const [type, x, a, b, c] = s;
    const gy = Lv.gyAt(x) ?? GY;
    switch (type) {
      case 'mine': return { type, x, y: gy, buried: !!a, revealed: !a, timer: 0, done: false };
      case 'barrel': return { type, x, y: a ?? gy, fuse: 0, done: false };
      case 'trip': return { type, x, y: gy, w: 40, fired: false, timer: 0 };
      case 'rock': return { type, x, period: a, phase: b, ceil: Lv.ceilAt(x) ?? 0 };
      case 'ice': return { type, x, ceil: Lv.ceilAt(x) ?? 0, state: 'hang', y: 0, vy: 0, shake: 0, regrow: 0 };
      case 'bear': return { type, x, y: gy, closed: 0 };
      case 'cable': return { type, x, w: a, phase: b, laser: c === 'laser' };
      default: return null;
    }
  }
  function makeBoss(def, Lv) {
    if (!def) return null;
    const gy = Lv.gyAt(def.x) ?? GY;
    const base = { type: def.type, def, name: def.name, hp: def.hp, max: def.hp, state: 'idle', t: 0, inv: 0, dir: -1, timer: 0, dead: false, arena: def.arena, gy };
    switch (def.type) {
      case 'warden': return { ...base, x: def.x, y: 150, fireCd: 90, diveCd: 200, tx: 0, dropped: false, tint: def.tint, tag: def.tag, fast: !!def.fast };
      case 'chief': return { ...base, x: def.x, y: gy - 110, w: 56, h: 110, swingCd: 0, chargeCd: 200, throwCd: 160, slamCd: 360, vx: 0, vy: 0, dropped: false };
      case 'alpha': return { ...base, x: def.x, y: gy - 56, w: 100, h: 56, vx: 0, vy: 0, cycles: 0, dropped: false };
      case 'core': return { ...base, x: def.x, y: 200, cx: def.x, shield: true, shieldT: 0, restored: false, fireCd: 90, spawnCd: 320, rot: 0, dropped: false };
      default: return null;
    }
  }
  function buildLevel(i) {
    const d = STAGES[i];
    const Lv = { def: d, idx: i, worldW: d.worldW };
    Lv.ground = d.ground.map(([a, b, y = GY, quick]) => ({ x: a, w: b - a, y, kind: 'ground', quick: quick || [], dx: 0, dy: 0 }));
    Lv.water = (d.water || []).map(([a, b, y]) => ({ x0: a, x1: b, y }));
    Lv.plats = (d.plats || []).map(([x, y, w, kind, ex = {}]) => ({ x, y, w, h: 14, kind, bx: x, by: y, move: ex.move || null, crumble: !!ex.crumble, timer: 0, fall: 0, gone: false, respawn: 0, dx: 0, dy: 0 }));
    Lv.surfaces = Lv.ground.concat(Lv.plats);
    Lv.caves = (d.caves || []).map(([x0, x1, ceil, dark = 0]) => ({ x0, x1, ceil, dark }));
    Lv.gyAt = (x) => { const g = groundAt(Lv, x); return g ? g.y : null; };
    Lv.ceilAt = (x) => { const c = Lv.caves.find((cv) => x >= cv.x0 && x < cv.x1); return c ? c.ceil : null; };
    Lv.enemies = (d.enemies || []).map((s) => makeEnemy(Lv, s)).filter(Boolean);
    Lv.traps = (d.traps || []).map((s) => makeTrap(Lv, s)).filter(Boolean);
    Lv.pickups = [];
    (d.gears || []).forEach(([x, y, n]) => { for (let k = 0; k < n; k++) Lv.pickups.push({ type: 'gear', x: x + k * 28, y }); });
    (d.batteries || []).forEach(([x, y]) => Lv.pickups.push({ type: 'battery', x, y }));
    (d.memories || []).forEach(([x, y], k) => Lv.pickups.push({ type: 'memory', x, y, idx: k }));
    Lv.npcs = (d.npcs || []).map((n) => ({ ...n, y: n.y ?? (Lv.gyAt(n.x) ?? GY), done: false, hidden: false }));
    Lv.checkpoints = (d.checkpoints || []).map(([x, label, kind, needs]) => ({ x, label, kind, needs, lit: false }));
    Lv.lamps = (d.lamps || []).map(([x, flicker]) => ({ x, flicker: !!flicker }));
    Lv.boss = makeBoss(d.boss, Lv);
    Lv.chase = d.chase ? { ...d.chase, active: false, front: 0, done: false, cd: 0 } : null;
    Object.assign(Lv, { bullets: [], bombs: [], shots: [], rocks: [], particles: [], rings: [], flashes: [], waves: [], strikes: [], boulders: [], allies: [] });
    Lv.checkpoint = { x: 140, label: 'the road' };
    Lv.stats = { gears: 0, memories: 0, hits: 0, time: 0, enemies: 0 };
    Lv.arena = false; Lv.gateOpen = 0; Lv.strikeCd = 200;
    Lv.weather = SB.World.makeWeather(d.weather || { type: 'none' });
    SB.World.prepare(Lv);
    return Lv;
  }

  // ---------------------------------------------------------------- allies
  const ALLY_NAMES = { dog: 'BISCUIT', milo: 'MILO', pip: 'PIP' };
  function addAlly(kind) {
    if (L.allies.some((a) => a.kind === kind)) return;
    L.allies.push({ kind, x: pcx() - 60, y: P.y + P.h, t: 0, cd: 60, facing: 1, lunge: 0, target: null, pose: 0 });
  }
  function removeAlly(kind) {
    const a = L.allies.find((al) => al.kind === kind);
    if (a) { puff(a.x, a.y - 20, '#d9d2c5', 10); }
    L.allies = L.allies.filter((al) => al.kind !== kind);
  }
  function nearestEnemy(x, y, range, filter) {
    let best = null, bd = range;
    for (const e of L.enemies) {
      if (e.dead || (filter && !filter(e))) continue;
      const d = Math.hypot(e.x + e.w / 2 - x, e.y + e.h / 2 - y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  function bossTarget() {
    const B = L.boss;
    if (!B || B.dead || B.state === 'idle' || B.state === 'intro') return null;
    if (B.type === 'core' && B.shield) return null;
    const c = bossCenter(B);
    return { x: c.x, y: c.y };
  }
  function updateAllies() {
    for (const a of L.allies) {
      a.t++;
      if (a.cd > 0) a.cd--;
      const target = pcx() - (a.kind === 'dog' ? 46 : a.kind === 'milo' ? 64 : 30) * P.facing;
      const far = Math.abs(a.x - pcx()) > 520;
      if (far) a.x = target;
      if (a.lunge > 0 && a.target) {
        a.lunge--;
        const tx = a.target.x + a.target.w / 2;
        a.x += clamp(tx - a.x, -7, 7); a.facing = Math.sign(tx - a.x) || a.facing;
        if (a.lunge === 0 && !a.target.dead) { damageEnemy(a.target, 1, a.facing); a.target.stun = Math.max(a.target.stun || 0, 100); SFX.bark(); }
      } else {
        const dx = target - a.x;
        if (Math.abs(dx) > 6) { a.x += clamp(dx * 0.12, -4.6, 4.6); a.facing = Math.sign(dx); a.moving = true; } else { a.moving = false; a.facing = P.facing; }
      }
      if (a.kind === 'pip') { a.y = lerp(a.y, P.y - 22 + Math.sin(a.t * 0.06) * 6, 0.15); }
      else {
        const feet = P.y + P.h;
        let best = null;
        for (const s of L.surfaces) { if (s.gone || a.x < s.x || a.x > s.x + s.w) continue; if (s.y >= feet - 90 && (best === null || s.y < best)) best = s.y; }
        a.y = best !== null ? lerp(a.y, best, 0.35) : lerp(a.y, feet, 0.2);
      }
      // abilities
      if (a.kind === 'dog') {
        for (const m of L.traps) if (m.type === 'mine' && m.buried && !m.revealed && Math.abs(m.x - a.x) < 210) { m.revealed = true; SFX.bark(); }
        if (a.cd <= 0 && a.lunge === 0) {
          const e = nearestEnemy(a.x, a.y - 20, 170, (en) => ['hound', 'scav', 'bomber', 'wolf', 'rat'].includes(en.type) && Math.abs(en.y + en.h - a.y) < 80);
          if (e) { a.target = e; a.lunge = 16; a.cd = 170; }
        }
      } else if (a.kind === 'milo' || a.kind === 'pip') {
        if (a.kind === 'pip') for (const m of L.traps) if (m.type === 'mine' && m.buried && !m.revealed && Math.abs(m.x - a.x) < 240) { m.revealed = true; SFX.beep(); }
        if (a.cd <= 0) {
          const sx = a.x, sy = a.kind === 'pip' ? a.y : a.y - 46;
          let tgt = null;
          const e = nearestEnemy(sx, sy, a.kind === 'pip' ? 300 : 360);
          if (e) tgt = { x: e.x + e.w / 2, y: e.y + e.h / 2 };
          const bt = bossTarget();
          if (!tgt && bt && Math.hypot(bt.x - sx, bt.y - sy) < 420) tgt = bt;
          if (tgt && Math.abs(tgt.x - camX - W / 2) < W / 2 + 20) {
            const ang = Math.atan2(tgt.y - sy, tgt.x - sx), sp = a.kind === 'pip' ? 9 : 7.5;
            L.shots.push({ x: sx, y: sy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - (a.kind === 'milo' ? 0.6 : 0), g: a.kind === 'milo' ? 0.02 : 0, life: 80, kind: a.kind === 'pip' ? 'zap' : 'stone' });
            a.cd = a.kind === 'pip' ? 60 : 80; a.pose = 14; a.facing = Math.sign(tgt.x - sx) || a.facing;
            a.kind === 'pip' ? SFX.laser() : SFX.sling();
          }
        }
        if (a.pose > 0) a.pose--;
      }
    }
  }

  // ---------------------------------------------------------------- stage flow
  function resetPlayer(x) {
    const g = groundAt(L, x + 15);
    Object.assign(P, { x, y: (g ? g.y : GY) - P.h, vx: 0, vy: 0, onGround: true, standOn: g, facing: 1, inv: 60, hearts: 3, root: 0, sink: 0, inQuick: false });
    P.safe = { x, y: P.y };
  }
  function startStage(i) {
    stageIdx = i;
    L = buildLevel(i);
    P.hasPulse = i > 0;
    resetPlayer(L.checkpoint.x);
    (L.def.allies || []).forEach(addAlly);
    camX = 0; shake = 0; dialog = null; bannerObj = null;
    SB.setMusicRate(L.biome.musicRate || 1);
    state = 'card'; overlayT = 0;
    SB.store('sadbot.last', String(i));
  }
  function stageClear() {
    state = 'clear'; overlayT = 0; SFX.memory();
    const u = unlocked();
    if (!DEV && stageIdx + 2 > u) SB.store('sadbot.unlocked', String(Math.min(STAGES.length, stageIdx + 2)));
    const key = `sadbot.best.${L.def.id}`, best = parseInt(SB.store(key) || '0', 10);
    if (!best || L.stats.time < best) SB.store(key, String(L.stats.time));
  }
  function startEnding() {
    state = 'ending'; endT = 0; SB.setMusicRate(1);
    if (!DEV) SB.store('sadbot.finished', '1');
  }
  function respawn() {
    const c = L.checkpoint;
    const B = L.boss;
    if (B && !B.dead && B.state !== 'idle') {
      L.boss = makeBoss(L.def.boss, L); L.arena = false;
      L.enemies = L.enemies.filter((e) => !e.fromBoss);
    }
    if (L.chase && !L.chase.done) { L.chase.active = false; L.chase.front = 0; L.boulders = []; }
    L.bullets = []; L.bombs = []; L.waves = []; L.rocks = []; L.strikes = [];
    resetPlayer(c.x);
    for (const a of L.allies) { a.x = c.x - 50; a.lunge = 0; }
    camX = clamp(c.x - W * 0.42, 0, L.worldW - W);
    state = 'play';
    banner('Rebooting...', c.label, 120);
  }
  function setCheckpoint(c) {
    if (!c.lit) { c.lit = true; SFX.checkpoint(); banner('Checkpoint', c.label, 120); }
    L.checkpoint = { x: c.x, label: c.label };
  }
  function runActions(list = [], n) {
    for (const act of list) {
      const [k, v] = act.split(':');
      if (k === 'ally') { addAlly(v); if (n && n.hideOnEnd) n.hidden = true; banner(`${ALLY_NAMES[v]} joined`, 'Allies fight beside you and can\'t be hurt.', 150); }
      else if (k === 'part') removeAlly(v);
      else if (k === 'pulse') { P.hasPulse = true; banner('Heart Pulse', 'Press X or J', 160); }
      else if (k === 'heal') P.hearts = 3;
      else if (k === 'cp') setCheckpoint(L.checkpoints[+v]);
      else if (k === 'clear') stageClear();
      else if (k === 'ending') startEnding();
    }
  }
  function openDialog(lines, onEnd) {
    dialog = { lines, i: 0, chars: 0, onEnd };
    lineStart(lines[0]);
  }
  function lineStart(line) {
    if (line.vo !== undefined) SB.playVO(line.vo);
    if (line.sfx && SFX[line.sfx]) SFX[line.sfx]();
  }

  // ---------------------------------------------------------------- update
  function update() {
    SB.t++;
    const pr = SB.pressed;
    if (pr.has('mute')) { const m = SB.toggleMute(); banner(m ? 'Sound off' : 'Sound on', 'M toggles sound', 90); }
    SB.updateMusic();
    if (bannerObj && ++bannerObj.t > bannerObj.dur) bannerObj = null;

    switch (state) {
      case 'title': {
        const u = unlocked();
        if (pr.has('up')) menuSel = (menuSel + u - 1) % u;
        if (pr.has('down')) menuSel = (menuSel + 1) % u;
        if (pr.has('confirm') || (pr.has('jump') && !pr.has('up'))) {
          if (menuSel === 0) { state = 'intro'; slide = 0; slideT = 0; SB.playVO(INTRO[0].vo); }
          else startStage(menuSel);
        }
        break;
      }
      case 'intro': {
        slideT++;
        if (pr.has('skip')) { SB.stopVO(); startStage(0); }
        else if (pr.has('advance') || (slideT > 330 && !SB.voActive())) {
          slide++; slideT = 0; SB.stopVO();
          if (slide >= INTRO.length) startStage(0); else SB.playVO(INTRO[slide].vo);
        }
        break;
      }
      case 'card':
        overlayT++;
        if ((overlayT > 30 && pr.has('advance')) || overlayT > 420) { state = 'play'; banner(`Stage ${stageIdx + 1} · ${L.def.name}`, L.def.card[1], 200); }
        break;
      case 'play':
        if (dialog) updateDialog();
        else if (pr.has('pause')) state = 'paused';
        else updateWorld();
        break;
      case 'paused':
        if (pr.has('pause') || pr.has('confirm')) state = 'play';
        break;
      case 'gameover':
        overlayT++;
        if (overlayT > 40 && pr.has('advance')) respawn();
        break;
      case 'clear':
        overlayT++;
        if (overlayT > 60 && pr.has('advance')) { SB.stopVO(); if (stageIdx + 1 < STAGES.length) startStage(stageIdx + 1); else state = 'title'; }
        break;
      case 'ending':
        endT++;
        if (dialog) updateDialog();
        else if (endT === 150) openDialog(SB.ENDING, () => { state = 'credits'; overlayT = 0; });
        break;
      case 'credits':
        overlayT++;
        if (overlayT > 120 && pr.has('advance')) { state = 'title'; menuSel = 0; }
        break;
      default: break;
    }
    pr.clear();
  }

  function updateDialog() {
    const line = dialog.lines[dialog.i];
    if (dialog.chars < line.text.length) {
      dialog.chars = Math.min(line.text.length, dialog.chars + 1.4);
      if (SB.t % 3 === 0) SFX.blip();
    }
    if (SB.pressed.has('advance')) {
      if (dialog.chars < line.text.length) dialog.chars = line.text.length;
      else {
        dialog.i++; dialog.chars = 0;
        if (dialog.i >= dialog.lines.length) { const cb = dialog.onEnd; dialog = null; if (cb) cb(); }
        else lineStart(dialog.lines[dialog.i]);
      }
    }
  }

  function updateWorld() {
    L.stats.time++;
    L.weather.update(SB.t);
    updatePlats();
    updatePlayer();
    if (state !== 'play') return;
    updateAllies();
    updateEnemies();
    updateBoss();
    updateProjectiles();
    updateTraps();
    updateStrikes();
    updateChase();
    updatePickups();
    updateNPCs();
    updateCheckpoints();
    updateFx();
    let target = clamp(pcx() - W * 0.42, 0, L.worldW - W);
    if (L.arena) target = L.boss.arena[0];
    camX = lerp(camX, target, L.arena ? 0.08 : 0.12);
    if (shake > 0) shake *= 0.88;
  }

  function updatePlats() {
    for (const p of L.plats) {
      const ox = p.x, oy = p.y;
      if (p.gone) {
        if (--p.respawn <= 0) { p.gone = false; p.timer = 0; p.x = p.bx; p.y = p.by; }
      } else if (p.fall) {
        p.fall++; p.y += p.fall * 0.35;
        if (p.fall > 45) { p.gone = true; p.respawn = 220; p.fall = 0; }
      } else if (p.move) {
        const [ax, ay, per, ph] = p.move;
        const a = ((L.stats.time + ph) / per) * Math.PI * 2;
        p.x = p.bx + Math.sin(a) * ax; p.y = p.by + Math.sin(a * 1.3) * ay;
      }
      p.dx = p.gone ? 0 : p.x - ox; p.dy = p.gone ? 0 : p.y - oy;
    }
  }

  function updatePlayer() {
    const d = L.def;
    const prevX = P.x;
    if (P.onGround && P.standOn && !P.standOn.gone) { P.x += P.standOn.dx; P.y += P.standOn.dy; }
    const left = SB.keys.has('left'), right = SB.keys.has('right');
    const s0 = P.onGround ? P.standOn : null;
    const icy = d.slippery && s0 && (s0.kind === 'ground' || s0.kind === 'ice');
    const accel = P.onGround ? (icy ? 0.24 : 0.6) : 0.42;
    const max = P.inQuick ? 1.5 : 3.7;
    const fric = P.onGround ? (icy ? 0.965 : 0.72) : 0.94;
    if (P.root > 0) { P.root--; P.vx = 0; }
    else if (left && !right) { P.vx -= accel; P.facing = -1; }
    else if (right && !left) { P.vx += accel; P.facing = 1; }
    else P.vx *= fric;
    P.vx = clamp(P.vx, -max, max);
    if (Math.abs(P.vx) < 0.05) P.vx = 0;

    if (SB.pressed.has('jump')) P.jumpBuf = 8; else if (P.jumpBuf > 0) P.jumpBuf--;
    if (P.onGround) P.coyote = 7; else if (P.coyote > 0) P.coyote--;
    if (P.jumpBuf > 0 && P.coyote > 0 && P.root <= 0) {
      P.vy = P.inQuick ? -8.2 : -11.2; P.coyote = 0; P.jumpBuf = 0; P.onGround = false; P.standOn = null; SFX.jump();
      dust(pcx(), P.y + P.h, 6);
    }
    if (!SB.keys.has('jump') && P.vy < -4) P.vy = -4;
    P.vy = Math.min(P.vy + 0.55, 13);

    // horizontal
    P.x += P.vx + L.weather.wind * (P.onGround ? 0.85 : 1.2);
    P.x = clamp(P.x, 0, L.worldW - P.w);
    const B = L.boss;
    if (L.arena) P.x = clamp(P.x, B.arena[0], B.arena[1] - P.w);
    if (B && !B.dead && P.x + P.w > B.arena[1]) P.x = B.arena[1] - P.w;
    for (const g of L.ground) { // solid sides of the ground (pit walls and steps)
      if (P.y + P.h > g.y + 4 && P.x + P.w > g.x && P.x < g.x + g.w) {
        if (prevX + P.w <= g.x + 3) P.x = g.x - P.w;
        else if (prevX >= g.x + g.w - 3) P.x = g.x + g.w;
      }
    }

    // vertical
    const prevBottom = P.y + P.h;
    P.y += P.vy;
    const ceil = L.ceilAt(pcx());
    if (ceil !== null && P.y < ceil + 2) { P.y = ceil + 2; if (P.vy < 0) P.vy = 0.5; }
    const wasGround = P.onGround;
    P.onGround = false;
    let best = null;
    if (P.vy >= 0) {
      for (const s of L.surfaces) {
        if (s.gone) continue;
        if (P.x + P.w > s.x + 4 && P.x < s.x + s.w - 4 && prevBottom <= s.y + 0.5 + Math.max(0, s.dy || 0) && P.y + P.h >= s.y) {
          if (!best || s.y < best.y) best = s;
        }
      }
    }
    if (best) {
      P.y = best.y - P.h; P.vy = 0; P.onGround = true; P.standOn = best;
      if (!wasGround) dust(pcx(), best.y, 4);
      if (best.crumble && !best.fall) { best.timer++; if (best.timer > 32) { best.fall = 1; SFX.crumble(); } }
    } else P.standOn = null;

    // quicksand
    const cx = pcx();
    P.inQuick = !!(P.onGround && P.standOn && P.standOn.kind === 'ground' && P.standOn.quick.some(([a, b]) => cx > a && cx < b));
    if (P.inQuick) {
      P.sink = Math.min(P.sink + 1, 200);
      if (P.sink > 170) { P.sink = 0; hurt(1, cx); P.vy = -9; P.onGround = false; }
    } else P.sink = Math.max(0, P.sink - 4);

    if (P.onGround && P.standOn && P.standOn.kind === 'ground' && !P.inQuick) P.safe = { x: P.x, y: P.y };
    if (P.onGround && P.vx !== 0) P.walk += Math.abs(P.vx) * 0.09;

    for (const w of L.water) {
      if (cx > w.x0 && cx < w.x1 && P.y + P.h > w.y + 18) { SFX.splash(); splash(cx, w.y); fallOut(); return; }
    }
    if (P.y > H + 80) { fallOut(); return; }

    if (P.inv > 0) P.inv--;
    if (P.pulseCd > 0) P.pulseCd--;
    if (SB.pressed.has('pulse')) {
      if (!P.hasPulse) { if (!bannerObj) banner('Toby\'s chest core is cracked', 'Someone at a campfire might fix it.', 120); }
      else if (P.pulseCd <= 0) heartPulse();
    }
  }
  function fallOut() {
    hurt(1, 0, true);
    if (state === 'play') { P.x = P.safe.x; P.y = P.safe.y - 4; P.vx = 0; P.vy = 0; P.standOn = null; P.sink = 0; }
  }

  function heartPulse() {
    P.pulseCd = 60;
    const cx = pcx(), cy = P.y + P.h * 0.55;
    L.rings.push({ x: cx, y: cy, r: 10, life: 26, c: '255,190,120' });
    SFX.pulse(); shake = Math.max(shake, 4);
    for (const e of L.enemies) {
      if (e.dead) continue;
      const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
      const reach = e.type === 'pylon' ? 130 : 115;
      if (Math.hypot(ex - cx, ey - cy) < reach) { damageEnemy(e, 1, Math.sign(ex - cx) || 1); if (e.type !== 'pylon') e.stun = Math.max(e.stun || 0, 40); }
    }
    L.bullets = L.bullets.filter((b) => { if (Math.hypot(b.x - cx, b.y - cy) < 125) { spark(b.x, b.y, '#ff7a5c', 5); return false; } return true; });
    for (const b of L.bombs) if (Math.hypot(b.x - cx, b.y - cy) < 125) b.life = 0;
    for (const tr of L.traps) {
      if (tr.done) continue;
      if (tr.type === 'barrel' && Math.abs(tr.x - cx) < 160 && Math.abs(tr.y - 16 - cy) < 120) tr.fuse = 1;
      if (tr.type === 'mine' && (tr.revealed || !tr.buried) && Math.hypot(tr.x - cx, tr.y - cy) < 135) tr.timer = 1;
    }
    const Bs = L.boss;
    if (Bs && !Bs.dead && Bs.state !== 'idle' && Bs.state !== 'intro') {
      const c = bossCenter(Bs);
      if (Math.hypot(c.x - cx, c.y - cy) < (Bs.type === 'chief' ? 130 : 150)) hitBoss(1);
    }
  }

  function hurt(n, fromX = 0, pit = false) {
    if (!pit && P.inv > 0) return;
    if (state !== 'play') return;
    P.hearts -= n; L.stats.hits++;
    P.inv = 90; shake = 10; SFX.hurt();
    if (!pit) { P.vx = (pcx() < fromX ? -1 : 1) * 5; P.vy = -6; P.onGround = false; P.root = 0; }
    spark(pcx(), P.y + 30, '#9ec3d6', 10);
    if (P.hearts <= 0) { state = 'gameover'; overlayT = 0; SB.stopVO(); }
  }

  function damageEnemy(e, n, dir) {
    if (e.dead) return;
    e.hp -= n;
    const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
    if (['hound', 'scav', 'wolf'].includes(e.type)) { e.hurt = 20; e.x = clamp(e.x + dir * 18, e.x0 ?? e.x, e.x1 ?? e.x); }
    spark(ex, ey, '#d8a070', 8);
    if (e.hp <= 0) {
      e.dead = true; L.stats.enemies++;
      const organic = ['wolf', 'rat'].includes(e.type);
      for (let i = 0; i < 16; i++) L.particles.push({ x: ex, y: ey, vx: rand(-4, 4), vy: rand(-6, 1), life: rand(30, 60), c: organic ? '#8a8a86' : (Math.random() < 0.5 ? '#8a8f94' : '#b0643a'), s: rand(2, 5), g: 0.25 });
      if (e.type === 'pylon') { SFX.explode(); flash(ex, e.y, 160); }
      else if (Math.random() < 0.55) L.pickups.push({ type: 'gear', x: ex, y: Math.min(ey, (L.gyAt(ex) ?? GY) - 30), drop: true, vy: -4 });
    }
  }
  const stompOn = (e, slack = 8) => P.vy > 0 && P.y + P.h - P.vy <= e.y + slack;
  function bounce(strong) { P.vy = SB.keys.has('jump') || strong ? -10.5 : -8; SFX.stomp(); shake = Math.max(shake, 5); }

  // ---------------------------------------------------------------- enemies
  function updateEnemies() {
    const px = pcx(), pfeet = P.y + P.h;
    for (const e of L.enemies) {
      if (e.dead) continue;
      if (Math.abs(e.x - camX - W / 2) > W * 1.3 && !e.fromBoss) continue;
      e.t++;
      const ex = e.x + e.w / 2, dx = px - ex;
      const same = Math.abs(pfeet - (e.y + e.h)) < 60;
      if (e.stun > 0) e.stun--;
      switch (e.type) {
        case 'drone': {
          if (e.stun > 0) break;
          e.x += e.dir * 1.15;
          if (e.x < e.x0 || e.x > e.x1) e.dir *= -1;
          e.y = e.baseY + Math.sin(e.t * 0.05) * 12;
          if (Math.abs(dx) < 380 && --e.cd <= 0) {
            e.cd = 160;
            const a = Math.atan2(P.y + 30 - (e.y + 10), px - ex);
            L.bullets.push({ x: ex, y: e.y + 16, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, r: 6, life: 260 });
            SFX.shoot();
          }
          if (overlap(P, e)) { if (stompOn(e, 6)) { damageEnemy(e, 1, 0); bounce(); } else hurt(1, ex); }
          break;
        }
        case 'hound': {
          let speed = 1.3;
          if (e.hurt > 0) { e.hurt--; speed = 0; }
          else if (e.stun > 0) speed = 0;
          else if (same && Math.abs(dx) < 240 && px > e.x0 && px < e.x1 + e.w) { e.dir = Math.sign(dx) || e.dir; speed = 3; }
          e.x += e.dir * speed;
          if (e.x < e.x0) { e.x = e.x0; e.dir = 1; }
          if (e.x > e.x1) { e.x = e.x1; e.dir = -1; }
          if (overlap(P, e)) { if (stompOn(e)) { damageEnemy(e, 2, 0); bounce(); } else if (e.stun <= 0) hurt(1, ex); }
          break;
        }
        case 'scav': {
          if (e.hurt > 0) e.hurt--;
          if (e.cd > 0) e.cd--;
          if (e.stun <= 0) {
            switch (e.state) {
              case 'patrol':
                e.x += e.dir * 1.1;
                if (e.x <= e.x0) e.dir = 1; if (e.x >= e.x1) e.dir = -1;
                if (same && Math.abs(dx) < 260) e.state = 'chase';
                break;
              case 'chase':
                e.dir = Math.sign(dx) || e.dir;
                if (Math.abs(dx) > 44) e.x += e.dir * 2.2;
                if (Math.abs(dx) <= 52 && same && e.cd <= 0) { e.state = 'windup'; e.timer = 22; }
                if (!same || Math.abs(dx) > 380) e.state = 'patrol';
                break;
              case 'windup': if (--e.timer <= 0) { e.state = 'swing'; e.timer = 12; SFX.swing(); } break;
              case 'swing': {
                const hb = { x: e.dir > 0 ? e.x + e.w : e.x - 38, y: e.y + 8, w: 38, h: 44 };
                if (overlap(P, hb)) hurt(1, ex);
                if (--e.timer <= 0) { e.state = 'chase'; e.cd = 55; }
                break;
              }
              default: break;
            }
            e.x = clamp(e.x, e.x0, e.x1);
          } else if (e.state === 'windup' || e.state === 'swing') e.state = 'chase';
          if (overlap(P, e) && stompOn(e, 10)) { damageEnemy(e, 1, 0); e.stun = Math.max(e.stun, 70); bounce(); }
          break;
        }
        case 'bomber': {
          if (e.throwT > 0) e.throwT--;
          if (e.stun <= 0) {
            e.dir = Math.sign(dx) || e.dir;
            if (Math.abs(dx) < 470 && Math.abs(dx) > 30 && --e.cd <= 0) {
              e.cd = 130; e.throwT = 16; SFX.throw();
              const T = 52, g = 0.3, bx = ex, by = e.y + 6, tx = px + P.vx * 20, ty = pfeet - 8;
              L.bombs.push({ x: bx, y: by, vx: (tx - bx) / T, vy: (ty - by - 0.5 * g * T * T) / T, g, life: 200 });
            }
          }
          if (overlap(P, e) && stompOn(e, 10)) { damageEnemy(e, 1, 0); e.stun = Math.max(e.stun, 80); bounce(); }
          break;
        }
        case 'wolf': {
          if (e.hurt > 0) e.hurt--;
          if (e.cd > 0) e.cd--;
          if (e.stun > 0 && e.state !== 'leap') { if (overlap(P, e) && stompOn(e)) { damageEnemy(e, 2, 0); bounce(); } break; }
          switch (e.state) {
            case 'patrol':
              e.x += e.dir * 1.6;
              if (e.x <= e.x0) e.dir = 1; if (e.x >= e.x1) e.dir = -1;
              if (same && Math.abs(dx) < 320 && e.cd <= 0) { e.state = 'crouch'; e.timer = 24; e.dir = Math.sign(dx) || e.dir; }
              break;
            case 'crouch':
              if (--e.timer <= 0) { e.state = 'leap'; e.vx = e.dir * 6.2; e.vy = -7.5; SFX.roar(); }
              break;
            case 'leap':
              e.x += e.vx; e.vy += 0.5; e.y += e.vy;
              e.x = clamp(e.x, e.x0, e.x1);
              if (e.y + e.h >= e.gy) { e.y = e.gy - e.h; e.state = 'rest'; e.timer = 40; e.cd = 90; }
              break;
            case 'rest':
              if (--e.timer <= 0) e.state = 'patrol';
              break;
            default: break;
          }
          if (overlap(P, e)) { if (stompOn(e)) { damageEnemy(e, 2, 0); bounce(); } else hurt(1, ex); }
          break;
        }
        case 'rat': {
          if (e.stun <= 0) {
            e.x += e.dir * 2.2;
            if (--e.turn <= 0) { e.turn = rand(30, 110); if (Math.random() < 0.5) e.dir *= -1; }
            if (e.x <= e.x0) e.dir = 1; if (e.x >= e.x1) e.dir = -1;
            e.x = clamp(e.x, e.x0, e.x1);
          }
          if (overlap(P, e)) { if (stompOn(e)) { damageEnemy(e, 1, 0); bounce(); } else if (e.stun <= 0) hurt(1, ex); }
          break;
        }
        case 'turret': {
          const inRange = Math.abs(dx) < 520 && Math.abs(P.y + 30 - (e.y + 12)) < 140;
          if (inRange && e.stun <= 0) {
            e.dir = Math.sign(dx) || e.dir;
            if (e.burst > 0) {
              if (e.t % 9 === 0) { L.bullets.push({ x: ex + e.dir * 18, y: e.y + 12, vx: e.dir * 5, vy: 0, r: 5, life: 200, bolt: 1 }); SFX.laser(); e.burst--; }
            } else if (--e.cd <= 0) { e.burst = 3; e.cd = 150; }
            e.charge = clamp(1 - e.cd / 60, 0, 1);
          }
          if (overlap(P, e) && stompOn(e, 10)) { damageEnemy(e, 2, 0); bounce(); }
          break;
        }
        case 'pylon':
          if (overlap(P, e) && stompOn(e, 10)) { damageEnemy(e, 2, 0); bounce(true); }
          break;
        default: break;
      }
    }
  }

  // ---------------------------------------------------------------- bosses
  function bossCenter(B) {
    if (B.type === 'warden' || B.type === 'core') return { x: B.x, y: B.y };
    return { x: B.x + B.w / 2, y: B.y + B.h / 2 };
  }
  function bossActivate(B) {
    B.state = 'intro'; B.timer = 90; L.arena = true; SFX.alarm();
    banner(B.name, B.def.sub, 200);
    if (B.type === 'chief') SFX.roar();
    if (B.type === 'alpha') SFX.howl();
    if (B.type === 'core') {
      const [a] = B.arena;
      [150, 480, 810].forEach((o) => L.enemies.push(makeEnemy(L, ['pylon', a + o, B.gy])));
    }
  }
  function updateBoss() {
    const B = L.boss;
    if (!B) return;
    if (B.dead) { if (L.gateOpen < 1) L.gateOpen = Math.min(1, L.gateOpen + 0.01); return; }
    if (B.state === 'idle') { if (P.x > B.arena[0] + 130 && !dialog) bossActivate(B); return; }
    B.t++;
    if (B.inv > 0) B.inv--;
    const phase2 = B.hp <= B.max / 2;
    const px = pcx(), py = P.y + 30;
    const [aL, aR] = B.arena;
    if (!B.dropped && phase2) { B.dropped = true; L.pickups.push({ type: 'battery', x: (aL + aR) / 2, y: B.gy - 150, drop: true, vy: 0 }); }
    if (B.type === 'warden') {
      const sp = B.fast ? 1.3 : 1;
      switch (B.state) {
        case 'intro': B.y = lerp(B.y, 170, 0.03); if (--B.timer <= 0) B.state = 'hover'; break;
        case 'hover': {
          B.x += B.dir * (phase2 ? 2.8 : 2) * sp;
          if (B.x < aL + 90) B.dir = 1; if (B.x > aR - 90) B.dir = -1;
          B.y = 170 + Math.sin(B.t * 0.04) * 22;
          if (--B.fireCd <= 0) {
            B.fireCd = (phase2 ? 75 : 105) / sp;
            const a = Math.atan2(py - B.y, px - B.x), n = phase2 ? 5 : 3;
            for (let i = 0; i < n; i++) { const aa = a + (i - (n - 1) / 2) * 0.22; L.bullets.push({ x: B.x, y: B.y + 18, vx: Math.cos(aa) * 3.4 * sp, vy: Math.sin(aa) * 3.4 * sp, r: 7, life: 300 }); }
            SFX.shoot();
          }
          if (--B.diveCd <= 0) { B.state = 'telegraph'; B.timer = 45; B.tx = clamp(px, aL + 60, aR - 60); SFX.alarm(); }
          break;
        }
        case 'telegraph': if (--B.timer <= 0) B.state = 'dive'; break;
        case 'dive': {
          const ty = B.gy - 34, ddx = B.tx - B.x, ddy = ty - B.y, dd = Math.hypot(ddx, ddy), v = 10 * sp;
          if (dd <= v) {
            B.x = B.tx; B.y = ty; B.state = 'stunned'; B.timer = phase2 ? 70 : 95;
            shake = 14; SFX.boom(); dust(B.x, B.gy, 18);
            if (Math.abs(px - B.x) < 70 && P.onGround) hurt(1, B.x);
          } else { B.x += (ddx / dd) * v; B.y += (ddy / dd) * v; }
          break;
        }
        case 'stunned': if (SB.t % 6 === 0) spark(B.x + rand(-30, 30), B.y - 10, '#ffd27a', 2); if (--B.timer <= 0) B.state = 'rise'; break;
        case 'rise': B.y -= 3; if (B.y <= 170) { B.state = 'hover'; B.diveCd = phase2 ? 150 : 210; } break;
        default: break;
      }
      if (rectCircle(P, B.x, B.y, 38)) {
        if (B.state === 'stunned') { if (stompOn({ y: B.y - 18 }, 10)) { hitBoss(2); bounce(); } }
        else if (B.state !== 'intro') hurt(1, B.x);
      }
    } else if (B.type === 'chief') {
      const cx = B.x + B.w / 2, dx = px - cx;
      const swingHB = () => ({ x: B.dir > 0 ? B.x + B.w : B.x - 64, y: B.y + 20, w: 64, h: 60 });
      switch (B.state) {
        case 'intro': if (--B.timer <= 0) B.state = 'walk'; break;
        case 'walk':
          B.dir = Math.sign(dx) || B.dir;
          if (Math.abs(dx) > 50) B.x += B.dir * (phase2 ? 1.7 : 1.3);
          if (B.swingCd > 0) B.swingCd--;
          if (Math.abs(dx) < 80 && B.swingCd <= 0) { B.state = 'windup'; B.timer = 26; }
          if (--B.chargeCd <= 0 && Math.abs(dx) > 160) { B.state = 'telegraph'; B.timer = 45; SFX.roar(); }
          if (--B.throwCd <= 0) {
            B.throwCd = phase2 ? 150 : 210; SFX.throw();
            const n = phase2 ? 3 : 2;
            for (let i = 0; i < n; i++) {
              const T = 50 + i * 8, tx = px + (i - (n - 1) / 2) * 70, bx = cx, by = B.y + 10;
              L.bombs.push({ x: bx, y: by, vx: (tx - bx) / T, vy: (P.y + P.h - 8 - by - 0.5 * 0.3 * T * T) / T, g: 0.3, life: 200 });
            }
          }
          if (phase2 && --B.slamCd <= 0) { B.state = 'jump'; B.vy = -12; B.vx = clamp(dx / 45, -6, 6); B.slamCd = 330; }
          break;
        case 'windup': if (--B.timer <= 0) { B.state = 'swing'; B.timer = 12; SFX.swing(); } break;
        case 'swing': if (overlap(P, swingHB())) hurt(1, cx); if (--B.timer <= 0) { B.state = 'walk'; B.swingCd = 60; } break;
        case 'telegraph': if (--B.timer <= 0) { B.state = 'charge'; B.dir = Math.sign(dx) || B.dir; } break;
        case 'charge':
          B.x += B.dir * 7.5;
          if (SB.t % 4 === 0) dust(cx, B.gy, 3);
          for (const tr of L.traps) if (tr.type === 'barrel' && !tr.done && Math.abs(tr.x - cx) < 40) tr.fuse = 1;
          if (B.x <= aL + 8 || B.x + B.w >= aR - 8) { B.x = clamp(B.x, aL + 8, aR - 8 - B.w); B.state = 'stunned'; B.timer = 110; shake = 16; SFX.boom(); B.chargeCd = phase2 ? 200 : 260; }
          break;
        case 'stunned': if (--B.timer <= 0) B.state = 'walk'; break;
        case 'jump':
          B.x += B.vx; B.vy += 0.5; B.y += B.vy; B.x = clamp(B.x, aL + 8, aR - 8 - B.w);
          if (B.y + B.h >= B.gy && B.vy > 0) {
            B.y = B.gy - B.h; B.state = 'recover'; B.timer = 40; shake = 14; SFX.boom(); dust(cx, B.gy, 14);
            L.waves.push({ x: cx, dir: -1, y: B.gy, life: 140 }, { x: cx, dir: 1, y: B.gy, life: 140 });
          }
          break;
        case 'recover': if (--B.timer <= 0) B.state = 'walk'; break;
        default: break;
      }
      B.x = clamp(B.x, aL + 4, aR - 4 - B.w);
      if (overlap(P, B)) {
        if (stompOn(B, 14)) { if (B.state === 'stunned') hitBoss(2); bounce(true); }
        else if (B.state === 'charge' || B.state === 'jump') hurt(1, cx);
      }
    } else if (B.type === 'alpha') {
      const cx = B.x + B.w / 2, dx = px - cx;
      switch (B.state) {
        case 'intro': if (--B.timer <= 0) { B.state = 'stalk'; B.timer = 90; } break;
        case 'stalk':
          B.dir = Math.sign(dx) || B.dir;
          if (Math.abs(dx) > 240) B.x += B.dir * 2.4; else if (Math.abs(dx) < 170) B.x -= B.dir * 1.3;
          if (--B.timer <= 0) { B.cycles++; if (B.cycles % 3 === 0) { B.state = 'howl'; B.timer = 60; SFX.howl(); } else { B.state = 'crouch'; B.timer = phase2 ? 22 : 30; } }
          break;
        case 'crouch': if (--B.timer <= 0) { B.state = 'leap'; B.vx = clamp(dx / 38, -9, 9); B.vy = -9.5; SFX.roar(); } break;
        case 'leap':
          B.x += B.vx; B.vy += 0.5; B.y += B.vy;
          if (B.y + B.h >= B.gy && B.vy > 0) { B.y = B.gy - B.h; B.state = 'rest'; B.timer = phase2 ? 55 : 75; shake = 10; dust(cx, B.gy, 12); }
          break;
        case 'rest': if (--B.timer <= 0) { B.state = 'stalk'; B.timer = phase2 ? 60 : 90; } break;
        case 'howl':
          if (B.timer === 30) {
            const alive = L.enemies.filter((e) => e.fromBoss && !e.dead).length;
            for (let k = 0; k < Math.min(2, 3 - alive); k++) {
              const w = makeEnemy(L, ['wolf', aL + 20, aR - 20]); w.fromBoss = true; w.x = k ? aR - 80 : aL + 20; w.cd = 40; L.enemies.push(w);
            }
          }
          if (--B.timer <= 0) { B.state = 'stalk'; B.timer = 80; }
          break;
        default: break;
      }
      B.x = clamp(B.x, aL + 4, aR - 4 - B.w);
      if (overlap(P, B)) {
        if (stompOn(B, 14)) { if (B.state === 'rest') hitBoss(2); bounce(true); }
        else if (B.state !== 'rest' && B.state !== 'intro') hurt(1, cx);
      }
    } else if (B.type === 'core') {
      B.rot += phase2 ? 0.03 : 0.02;
      const pylons = L.enemies.filter((e) => e.type === 'pylon' && !e.dead).length;
      if (B.shieldT > 0) B.shieldT--;
      B.shield = pylons > 0 || B.shieldT > 0;
      switch (B.state) {
        case 'intro': B.y = lerp(B.y, 190, 0.04); if (--B.timer <= 0) B.state = 'active'; break;
        case 'active':
          B.x = B.cx + Math.sin(B.t * 0.012) * 140; B.y = lerp(B.y, 190 + Math.sin(B.t * 0.03) * 16, 0.08);
          if (--B.fireCd <= 0) {
            B.fireCd = phase2 ? 70 : 95; SFX.laser();
            const n = phase2 ? 12 : 8;
            for (let i = 0; i < n; i++) { const a = B.rot + (i / n) * Math.PI * 2; L.bullets.push({ x: B.x, y: B.y, vx: Math.cos(a) * 2.6, vy: Math.sin(a) * 2.6, r: 6, life: 320, bolt: 1 }); }
          }
          if (--B.spawnCd <= 0) {
            B.spawnCd = 380;
            if (L.enemies.filter((e) => e.type === 'drone' && e.fromBoss && !e.dead).length < 2) { const dr = makeEnemy(L, ['drone', B.x, 280, 160]); dr.fromBoss = true; L.enemies.push(dr); }
          }
          if (!B.shield) { B.state = 'exposed'; B.timer = 300; SFX.alarm(); banner('Shield down', 'Hit the Core!', 90); }
          break;
        case 'exposed':
          B.y = lerp(B.y, B.gy - 120, 0.06);
          if (--B.timer <= 0) {
            B.state = 'active';
            if (!B.restored && B.hp > 4) {
              B.restored = true;
              L.enemies.filter((e) => e.type === 'pylon').slice(0, 2).forEach((e) => { e.dead = false; e.hp = 3; });
              banner('Pylons rebooting', '', 90);
            } else B.shieldT = 260;
          }
          break;
        default: break;
      }
      if (B.state === 'exposed' && rectCircle(P, B.x, B.y, 44) && stompOn({ y: B.y - 30 }, 16)) { hitBoss(2); bounce(true); }
    }
    // waves from the chief's slam
    L.waves = L.waves.filter((w) => {
      w.x += w.dir * 5.5; w.life--;
      if (Math.abs(pcx() - w.x) < 16 && P.y + P.h > w.y - 22) hurt(1, w.x);
      return w.life > 0 && w.x > aL && w.x < aR;
    });
  }
  function hitBoss(n) {
    const B = L.boss;
    if (!B || B.inv > 0 || B.dead || B.state === 'idle' || B.state === 'intro') return;
    if (B.type === 'core' && B.shield) { spark(B.x, B.y, '#8fe6ff', 6); return; }
    B.hp -= n; B.inv = 30; shake = Math.max(shake, 7);
    const c = bossCenter(B);
    spark(c.x, c.y, '#ffb36b', 12); SFX.stomp();
    if (B.hp <= 0) {
      B.dead = true; B.state = 'dead'; L.arena = false; L.bullets = []; L.bombs = []; L.waves = []; L.stats.enemies++;
      L.enemies.forEach((e) => { if (e.fromBoss && !e.dead) { e.dead = true; puff(e.x + e.w / 2, e.y + e.h / 2, '#8a8f94', 8); } });
      SFX.boom(); shake = 22; flash(c.x, c.y, 300);
      for (let i = 0; i < 60; i++) L.particles.push({ x: c.x, y: c.y, vx: rand(-7, 7), vy: rand(-9, 3), life: rand(40, 90), c: ['#8a8f94', '#b0643a', '#ffcf7a', '#3b3f45'][i % 4], s: rand(2, 7), g: 0.22 });
      banner(`${B.name} is down`, 'The way forward is open.', 200);
    }
  }

  // ---------------------------------------------------------------- projectiles
  function updateProjectiles() {
    L.bullets = L.bullets.filter((b) => {
      b.x += b.vx; b.y += b.vy; b.life--;
      if (rectCircle(P, b.x, b.y, b.r)) { hurt(1, b.x); return false; }
      const gy = L.gyAt(b.x);
      if (gy !== null && b.y > gy) { spark(b.x, gy, '#ff7a5c', 3); return false; }
      return b.life > 0 && b.y < H + 20;
    });
    L.bombs = L.bombs.filter((b) => {
      b.vy += b.g; b.x += b.vx; b.y += b.vy; b.life--;
      let hit = b.life <= 0 || rectCircle(P, b.x, b.y, 8);
      if (!hit && b.vy > 0) for (const s of L.surfaces) if (!s.gone && b.x > s.x && b.x < s.x + s.w && b.y >= s.y - 4 && b.y - b.vy <= s.y + 2) { hit = true; break; }
      if (!hit) for (const w of L.water) if (b.x > w.x0 && b.x < w.x1 && b.y > w.y + 4) { splash(b.x, w.y); return false; }
      if (hit) { explode(b.x, b.y - 4, 58); return false; }
      return b.y < H + 40;
    });
    L.shots = L.shots.filter((s) => {
      s.vy += s.g; s.x += s.vx; s.y += s.vy; s.life--;
      for (const e of L.enemies) {
        if (e.dead) continue;
        if (s.x > e.x - 4 && s.x < e.x + e.w + 4 && s.y > e.y - 4 && s.y < e.y + e.h + 4) { damageEnemy(e, 1, Math.sign(s.vx)); spark(s.x, s.y, s.kind === 'zap' ? '#6dff9c' : '#d9d2c5', 5); return false; }
      }
      for (const tr of L.traps) if (tr.type === 'barrel' && !tr.done && Math.abs(s.x - tr.x) < 13 && s.y > tr.y - 32 && s.y < tr.y) { tr.fuse = 1; return false; }
      const B = L.boss;
      if (B && !B.dead && B.state !== 'idle') {
        const c = bossCenter(B), r = B.type === 'core' ? 44 : B.type === 'warden' ? 40 : 46;
        if (Math.hypot(s.x - c.x, s.y - c.y) < r) { hitBoss(1); return false; }
      }
      const gy = L.gyAt(s.x);
      if (gy !== null && s.y > gy) return false;
      return s.life > 0;
    });
  }

  // ---------------------------------------------------------------- traps & hazards
  function explode(x, y, r, opt = {}) {
    for (let i = 0; i < 26; i++) L.particles.push({ x, y, vx: rand(-5, 5), vy: rand(-6, 2), life: rand(20, 50), c: ['#ffcf7a', '#ff7b2f', '#c0392b', '#3b3632'][i % 4], s: rand(3, 7), g: 0.15 });
    L.rings.push({ x, y, r: 8, life: 18, c: '255,170,90' });
    flash(x, y, r * 2.4);
    shake = Math.max(shake, 12);
    if (!opt.quiet) SFX.explode();
    if (Math.hypot(pcx() - x, P.y + P.h / 2 - y) < r + 10) hurt(1, x);
    for (const e of L.enemies) if (!e.dead && Math.hypot(e.x + e.w / 2 - x, e.y + e.h / 2 - y) < r + e.w / 2) damageEnemy(e, 2, Math.sign(e.x - x) || 1);
    const B = L.boss;
    if (B && !B.dead && B.state !== 'idle') { const c = bossCenter(B); if (Math.hypot(c.x - x, c.y - y) < r + 50) hitBoss(2); }
    for (const tr of L.traps) {
      if (tr.done) continue;
      if (tr.type === 'barrel' && !tr.fuse && Math.hypot(tr.x - x, tr.y - 16 - y) < r + 10) tr.fuse = 8;
      if (tr.type === 'mine' && !tr.timer && Math.hypot(tr.x - x, tr.y - y) < r + 10) { tr.timer = 8; tr.revealed = true; }
    }
  }
  function updateTraps() {
    const cx = pcx(), feet = P.y + P.h;
    for (const tr of L.traps) {
      if (tr.done) continue;
      switch (tr.type) {
        case 'mine': {
          if (!tr.revealed && Math.abs(tr.x - cx) < 70) tr.revealed = true; // you notice it at the last moment
          if (!tr.timer) {
            const step = Math.abs(tr.x - cx) < 24 && Math.abs(feet - tr.y) < 10;
            const walker = L.enemies.some((e) => !e.dead && ['scav', 'hound', 'wolf', 'rat'].includes(e.type) && Math.abs(e.x + e.w / 2 - tr.x) < 16 && Math.abs(e.y + e.h - tr.y) < 10);
            if (step || walker) { tr.timer = 28; tr.revealed = true; }
          } else {
            if (tr.timer % 7 === 0) SFX.beep();
            if (--tr.timer <= 0) { tr.done = true; explode(tr.x, tr.y - 8, 72); }
          }
          break;
        }
        case 'barrel':
          if (tr.fuse > 0 && --tr.fuse <= 0) { tr.done = true; explode(tr.x, tr.y - 16, 95); }
          break;
        case 'trip':
          if (!tr.fired && cx > tr.x && cx < tr.x + tr.w && feet > tr.y - 14 && feet <= tr.y + 2) { tr.fired = true; tr.timer = 16; SFX.beep(); }
          if (tr.fired && tr.timer > 0 && --tr.timer <= 0) {
            explode(tr.x + tr.w + 8, tr.y - 10, 78);
            const ceil = L.ceilAt(tr.x);
            if (ceil !== null) for (let k = 0; k < 3; k++) L.rocks.push({ x: tr.x + rand(-60, 100), y: ceil + 4, vy: rand(0, 2), r: rand(9, 14), delay: k * 12 });
          }
          break;
        case 'rock':
          if (Math.abs(tr.x - camX - W / 2) < W) {
            const c = (L.stats.time + tr.phase) % tr.period;
            if (c > tr.period - 45 && SB.t % 5 === 0) L.particles.push({ x: tr.x + rand(-14, 14), y: tr.ceil + 4, vx: 0, vy: 1.5, life: 30, c: '#7a726a', s: 2, g: 0.05 });
            if (c === 0) L.rocks.push({ x: tr.x + rand(-12, 12), y: tr.ceil + 4, vy: 0, r: rand(10, 15), delay: 0 });
          }
          break;
        case 'ice':
          if (tr.state === 'hang') {
            if (Math.abs(cx - tr.x) < 40 && P.y > tr.ceil) { tr.state = 'shake'; tr.shake = 22; }
          } else if (tr.state === 'shake') {
            if (--tr.shake <= 0) { tr.state = 'fall'; tr.y = tr.ceil; tr.vy = 0; }
          } else if (tr.state === 'fall') {
            tr.vy += 0.6; tr.y += tr.vy;
            if (rectCircle(P, tr.x, tr.y + 26, 9)) { hurt(1, tr.x); tr.state = 'gone'; tr.regrow = 420; spark(tr.x, tr.y + 26, '#dff2ff', 10); }
            const gy = L.gyAt(tr.x) ?? GY;
            if (tr.y + 30 > gy) { tr.state = 'gone'; tr.regrow = 420; spark(tr.x, gy - 4, '#dff2ff', 10); SFX.crumble(); }
          } else if (tr.state === 'gone') { if (--tr.regrow <= 0) tr.state = 'hang'; }
          break;
        case 'bear':
          if (tr.closed > 0) { tr.closed--; break; }
          if (Math.abs(cx - tr.x) < 14 && Math.abs(feet - tr.y) < 8 && P.onGround) { tr.closed = 260; SFX.snap(); hurt(1, tr.x); P.root = 55; P.vx = 0; P.vy = 0; }
          break;
        case 'cable': {
          const c = (L.stats.time + tr.phase) % 170, on = c >= 95;
          tr.on = on; tr.warn = c >= 75 && c < 95;
          if (on && SB.t % 5 === 0 && Math.abs(tr.x - camX - W / 2) < W) SFX.zap();
          const top = (L.gyAt(tr.x) ?? GY) - 150;
          if (on && P.x + P.w > tr.x && P.x < tr.x + tr.w && P.y + P.h > top) hurt(1, tr.x + tr.w / 2);
          break;
        }
        default: break;
      }
    }
    // falling rocks
    L.rocks = L.rocks.filter((r) => {
      if (r.delay > 0) { r.delay--; return true; }
      r.vy += 0.45; r.y += r.vy;
      if (rectCircle(P, r.x, r.y, r.r)) { hurt(1, r.x); puff(r.x, r.y, '#6a625a', 8); return false; }
      const gy = L.gyAt(r.x);
      if (gy !== null && r.y + r.r > gy) { puff(r.x, gy - 4, '#6a625a', 8); SFX.crumble(); return false; }
      return r.y < H + 30;
    });
  }
  function updateStrikes() {
    const s = L.def.strikes;
    if (s && P.x > s.from && !L.arena) {
      if (--L.strikeCd <= 0) {
        L.strikeCd = s.every + rand(-60, 60);
        const x = pcx() + rand(-30, 280);
        if (L.gyAt(x) !== null) L.strikes.push({ x, timer: 70, bolt: 0 });
      }
    }
    L.strikes = L.strikes.filter((st) => {
      if (st.bolt > 0) { st.bolt--; return st.bolt > 0; }
      if (--st.timer <= 0) {
        const gy = L.gyAt(st.x) ?? GY;
        st.bolt = 10; L.weather.flash = 1; SFX.thunder();
        st.path = []; let x = st.x, y = 0; while (y < gy) { st.path.push([x, y]); x += rand(-16, 16); y += rand(18, 34); } st.path.push([st.x, gy]);
        if (Math.abs(pcx() - st.x) < 42 && P.y + P.h > gy - 140) hurt(1, st.x);
        for (const e of L.enemies) if (!e.dead && Math.abs(e.x + e.w / 2 - st.x) < 42) damageEnemy(e, 2, 1);
        for (const tr of L.traps) if (!tr.done && (tr.type === 'barrel' || tr.type === 'mine') && Math.abs(tr.x - st.x) < 50) { if (tr.type === 'barrel') tr.fuse = 4; else { tr.timer = 4; tr.revealed = true; } }
        flash(st.x, gy - 60, 260);
        return true;
      }
      return true;
    });
  }
  function updateChase() {
    const C = L.chase;
    if (!C || C.done) return;
    if (!C.active) {
      if (P.x > C.trigger) {
        C.active = true; C.front = C.start; SFX.rumble(); shake = 14;
        banner(C.kind === 'avalanche' ? 'AVALANCHE!' : 'THE TUNNEL IS COLLAPSING!', 'Run. Don\'t stop.', 160);
      }
      return;
    }
    C.front += C.speed;
    shake = Math.max(shake, 2.2);
    if (SB.t % 70 === 0) SFX.rumble();
    if (C.front >= C.end || pcx() > C.end + 90) { C.active = false; C.done = true; banner('You made it', '', 120); L.boulders = []; return; }
    if (P.x < C.front + 6) {
      hurt(1, C.front - 100);
      if (state === 'play') { P.x = Math.min(C.front + 170, L.worldW - 60); const gy = L.gyAt(pcx()); if (gy !== null) { P.y = gy - P.h; P.vy = 0; } }
    }
    if (--C.cd <= 0) {
      if (C.kind === 'collapse') {
        C.cd = 42; const ceil = L.ceilAt(pcx()) ?? 250;
        L.rocks.push({ x: pcx() + rand(70, 360), y: ceil + 4, vy: rand(0, 2), r: rand(10, 15), delay: 0 });
      } else {
        C.cd = 95; const gy = L.gyAt(C.front + 20) ?? GY;
        L.boulders.push({ x: C.front + 10, y: gy - 16, vx: C.speed + 2.4, vy: 0, r: 16, rot: 0 });
      }
    }
    L.boulders = L.boulders.filter((b) => {
      b.x += b.vx; b.rot += b.vx * 0.06;
      const gy = L.gyAt(b.x);
      if (gy !== null && b.y + b.r >= gy - 1) { b.y = gy - b.r; b.vy = 0; if (SB.t % 20 === 0) b.vy = -2.5; }
      b.vy += 0.4; b.y += b.vy;
      if (gy !== null && b.y + b.r > gy) b.y = gy - b.r;
      if (rectCircle(P, b.x, b.y, b.r)) { hurt(1, b.x); }
      return b.x < C.end + 300 && b.y < H + 40;
    });
  }

  // ---------------------------------------------------------------- pickups / npcs / checkpoints
  function updatePickups() {
    const cx = pcx(), cy = P.y + P.h / 2;
    for (const p of L.pickups) {
      if (p.taken) continue;
      if (p.drop) {
        p.vy = (p.vy || 0) + 0.4; p.y += p.vy;
        for (const s of L.surfaces) if (!s.gone && p.x > s.x && p.x < s.x + s.w && p.y + 10 >= s.y && p.y + 10 - p.vy <= s.y + 1) { p.y = s.y - 10; p.vy = 0; p.drop = false; }
        if (p.y > H + 50) p.taken = true;
      }
      if (Math.hypot(p.x - cx, p.y - cy) < 34) {
        p.taken = true;
        if (p.type === 'gear') { L.stats.gears++; SFX.gear(); }
        else if (p.type === 'battery') { P.hearts = Math.min(3, P.hearts + 1); SFX.battery(); banner('Battery cell', 'Power restored.', 90); }
        else if (p.type === 'memory') {
          L.stats.memories++; SFX.memory();
          const [head, quote] = L.def.memoryText[p.idx].split('\n');
          openDialog([{ who: 'MEMORY', text: head }, { who: 'MEMORY', text: quote }]);
        }
        spark(p.x, p.y, p.type === 'gear' ? '#e8c27a' : '#9ef0c0', 6);
      }
    }
  }
  const npcReady = (n) => !n.hidden && (!n.needs || (n.needs === 'boss' ? (!L.boss || L.boss.dead) : (!L.chase || L.chase.done)));
  function updateNPCs() {
    nearNPC = null;
    for (const n of L.npcs) {
      if (!npcReady(n)) continue;
      const d = Math.abs(pcx() - n.x);
      if (n.auto && !n.done && d < 110) { startNPC(n); return; }
      if (n.prompt && d < 70 && Math.abs(P.y + P.h - n.y) < 170) nearNPC = n;
    }
    if (nearNPC && SB.pressed.has('talk')) startNPC(nearNPC);
  }
  function startNPC(n) {
    P.vx = 0;
    const lines = n.done && n.repeat ? n.repeat : n.dialog;
    openDialog(lines, () => { if (!n.done) { n.done = true; runActions(n.on, n); } });
  }
  function updateCheckpoints() {
    for (const c of L.checkpoints) {
      if (c.lit) continue;
      if (c.needs && !L.npcs.find((n) => n.id === c.needs && n.done)) continue;
      if (Math.abs(pcx() - c.x) < 40) setCheckpoint(c);
    }
  }
  function updateFx() {
    L.particles = L.particles.filter((p) => { p.x += p.vx; p.y += p.vy; p.vy += p.g || 0; p.life--; return p.life > 0; });
    L.rings = L.rings.filter((r) => { r.r += 5; r.life--; return r.life > 0; });
    L.flashes = L.flashes.filter((f) => --f.life > 0);
  }
  function dust(x, y, n) { for (let i = 0; i < n; i++) L.particles.push({ x: x + rand(-10, 10), y, vx: rand(-1.5, 1.5), vy: rand(-1.6, -0.2), life: rand(18, 34), c: L.biome.ground === 'sand' ? '#d9b07a' : L.biome.ground === 'snow' ? '#eef3f7' : '#7d756b', s: rand(2, 4), g: 0.03 }); }
  function spark(x, y, c, n) { for (let i = 0; i < n; i++) L.particles.push({ x, y, vx: rand(-3, 3), vy: rand(-3, 2), life: rand(14, 28), c, s: rand(1.5, 3.5), g: 0.12 }); }
  function puff(x, y, c, n) { for (let i = 0; i < n; i++) L.particles.push({ x: x + rand(-8, 8), y: y + rand(-8, 8), vx: rand(-1.5, 1.5), vy: rand(-1.5, 0.5), life: rand(20, 40), c, s: rand(3, 6), g: 0 }); }
  function splash(x, y) { for (let i = 0; i < 14; i++) L.particles.push({ x: x + rand(-10, 10), y, vx: rand(-2.5, 2.5), vy: rand(-5, -1.5), life: rand(20, 36), c: '#a9c4cc', s: rand(2, 4), g: 0.25 }); }
  function flash(x, y, r) { L.flashes.push({ x, y, r, life: 22, max: 22 }); }

  // ---------------------------------------------------------------- render: world
  const inView = (wx, m = 100) => wx - camX > -m && wx - camX < W + m;
  function drawGaps() {
    const g = [...L.ground].sort((a, b) => a.x - b.x);
    const pit = ctx.createLinearGradient(0, 300, 0, H);
    pit.addColorStop(0, '#141210'); pit.addColorStop(1, '#030303');
    ctx.fillStyle = pit;
    for (let i = 0; i < g.length - 1; i++) {
      const a = g[i], b = g[i + 1], x0 = a.x + a.w, x1 = b.x;
      if (x1 <= x0 || x1 - camX < 0 || x0 - camX > W) continue;
      const top = Math.min(a.y, b.y) + 6;
      ctx.fillRect(x0 - camX, top, x1 - x0, H - top);
    }
  }
  function drawGate() {
    const B = L.boss;
    if (!B) return;
    const x = B.arena[1] - camX;
    if (x < -80 || x > W + 80) return;
    const gy = L.gyAt(B.arena[1] - 10) ?? GY, lift = L.gateOpen * 150;
    ctx.save();
    ctx.fillStyle = '#26282a'; ctx.fillRect(x - 6, gy - 190, 12, 190);
    ctx.strokeStyle = L.biome.ground === 'metal' ? '#4ad7ff' : '#3f4448'; ctx.lineWidth = 4;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + 14 + i * 14, gy - 160 - lift); ctx.lineTo(x + 14 + i * 14, gy - lift); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x + 6, gy - 150 - lift); ctx.lineTo(x + 66, gy - 150 - lift); ctx.moveTo(x + 6, gy - 40 - lift); ctx.lineTo(x + 66, gy - 40 - lift); ctx.stroke();
    ctx.restore();
  }
  function drawTrap(tr) {
    if (!inView(tr.x, 120)) return;
    const x = tr.x - camX;
    switch (tr.type) {
      case 'mine': if (!tr.done) SB.drawMine(x, tr.y, tr); break;
      case 'barrel': if (!tr.done) SB.drawBarrel(x, tr.y); break;
      case 'trip': SB.drawTrip(x, tr.y, tr.w, tr.fired); break;
      case 'bear': SB.drawBearTrap(x, tr.y, tr.closed > 0); break;
      case 'ice':
        if (tr.state === 'hang' || tr.state === 'shake') SB.drawIcicle(x + (tr.state === 'shake' ? rand(-1.5, 1.5) : 0), tr.ceil);
        else if (tr.state === 'fall') SB.drawIcicle(x, tr.y);
        break;
      case 'cable': {
        const gy = L.gyAt(tr.x) ?? GY;
        ctx.save();
        if (tr.laser) {
          ctx.fillStyle = '#2c313a'; ctx.fillRect(x - 12, gy - 160, 10, 160); ctx.fillRect(x + tr.w + 2, gy - 160, 10, 160);
          if (tr.on) { ctx.fillStyle = 'rgba(255,60,80,0.75)'; ctx.shadowColor = '#ff3b50'; ctx.shadowBlur = 14; for (let k = 0; k < 5; k++) ctx.fillRect(x - 2, gy - 150 + k * 30, tr.w + 4, 3); }
          else if (tr.warn && SB.t % 6 < 3) { ctx.fillStyle = 'rgba(255,60,80,0.35)'; for (let k = 0; k < 5; k++) ctx.fillRect(x - 2, gy - 150 + k * 30, tr.w + 4, 1); }
        } else {
          ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x - 14, gy - 160, 6, 160); ctx.fillRect(x + tr.w + 8, gy - 160, 6, 160);
          ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(x - 11, gy - 156); ctx.quadraticCurveTo(x + tr.w / 2, gy - 120, x + tr.w + 11, gy - 156); ctx.stroke();
          if (tr.on) {
            ctx.strokeStyle = '#bfe9ff'; ctx.shadowColor = '#7fd4ff'; ctx.shadowBlur = 16; ctx.lineWidth = 2;
            for (let k = 0; k < 3; k++) { ctx.beginPath(); let px = x + rand(10, tr.w - 10), py = gy - 130; ctx.moveTo(px, py); while (py < gy) { px += rand(-10, 10); py += rand(10, 22); ctx.lineTo(px, Math.min(py, gy)); } ctx.stroke(); }
            ctx.fillStyle = 'rgba(127,212,255,0.12)'; ctx.fillRect(x, gy - 140, tr.w, 140);
          } else if (tr.warn && SB.t % 6 < 3) { ctx.fillStyle = '#bfe9ff'; ctx.fillRect(x + rand(0, tr.w), gy - 130 + rand(0, 8), 3, 3); }
        }
        ctx.restore();
        break;
      }
      default: break;
    }
  }
  function drawPickup(p) {
    if (p.taken || !inView(p.x, 30)) return;
    const x = p.x - camX, y = p.y + Math.sin(SB.t * 0.08 + p.x) * 3;
    ctx.save();
    if (p.type === 'gear') {
      ctx.translate(x, y); ctx.rotate(SB.t * 0.03);
      ctx.fillStyle = '#c9a25a';
      ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8, r = i % 2 ? 7 : 9.5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2a2622'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, 7); ctx.fill();
    } else if (p.type === 'battery') {
      ctx.translate(x, y); ctx.shadowColor = '#7dffb0'; ctx.shadowBlur = 14;
      ctx.fillStyle = '#2d3a33'; SB.roundRect(-9, -14, 18, 28, 3); ctx.fill();
      ctx.fillStyle = '#7dffb0'; ctx.fillRect(-6, -4, 12, 15); ctx.fillRect(-4, -17, 8, 4);
    } else {
      ctx.translate(x, y); ctx.shadowColor = '#ffe2a8'; ctx.shadowBlur = 18; ctx.rotate(Math.sin(SB.t * 0.05) * 0.15);
      ctx.fillStyle = '#f2e6cf'; ctx.fillRect(-11, -9, 22, 18);
      ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 1.5; ctx.strokeRect(-7, -5, 6, 7);
      ctx.strokeStyle = '#2f5a7a'; ctx.strokeRect(2, -5, 6, 7);
    }
    ctx.restore();
  }
  function drawNPC(n) {
    if (n.hidden || !inView(n.x, 160)) return;
    const x = n.x - camX, gy = n.y;
    switch (n.kind) {
      case 'crow': SB.drawCrow(x, n.y, true); break;
      case 'mara': SB.drawMara(x, gy); break;
      case 'backpack': SB.drawBackpack(x, gy, npcReady(n) && !n.done); break;
      case 'dog': SB.drawDog(x, gy, -1, SB.t, SB.PALS.biscuit, 1, 'sit'); break;
      case 'human': SB.drawHuman(x, gy, -1, 0, SB.LOOKS[n.look], { mood: 'smile', pose: n.look === 'milo' ? 'wave' : undefined }); break;
      case 'cat': SB.drawCat(x, gy); break;
      case 'fox': SB.drawFox(x, gy, -1); break;
      case 'elephant': SB.drawElephant(x, gy, -1); break;
      case 'goat': SB.drawGoat(x, gy, -1); break;
      case 'pip': SB.drawPip(x, gy - 14 + Math.sin(SB.t * 0.05) * 2, false); ctx.fillStyle = 'rgba(109,255,156,0.6)'; if (SB.t % 40 < 4) ctx.fillRect(x + rand(-8, 8), gy - 20, 2, 2); break;
      case 'terminal': SB.drawTerminal(x, gy, n.done); break;
      case 'ladder': {
        const top = L.ceilAt(n.x) ?? 250;
        const g = ctx.createLinearGradient(0, 0, 0, gy);
        g.addColorStop(0, 'rgba(255,230,170,0.65)'); g.addColorStop(1, 'rgba(255,230,170,0.05)');
        ctx.fillStyle = g; ctx.fillRect(x - 40, 0, 80, gy);
        ctx.strokeStyle = '#6a6e72'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x - 14, top - 30); ctx.lineTo(x - 14, gy); ctx.moveTo(x + 14, top - 30); ctx.lineTo(x + 14, gy); ctx.stroke();
        for (let y = top; y < gy; y += 18) { ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y); ctx.stroke(); }
        break;
      }
      default: break;
    }
  }
  function drawEnemy(e) {
    if (e.dead || !inView(e.x, 100)) return;
    const x = e.x - camX;
    ctx.save();
    if (e.hurt > 0 && SB.t % 4 < 2) ctx.globalAlpha = 0.55;
    switch (e.type) {
      case 'drone': SB.drawDrone(x + 18, e.y + 10, e.dir, L.biome.ground === 'metal' ? '#3d4a66' : '#4a4f55'); break;
      case 'hound': SB.drawHound(x, e.y, e.w, e.dir, e.t, e.hurt); break;
      case 'scav': SB.drawHuman(x + 13, e.y + e.h, e.dir, e.t * 0.15, SB.LOOKS[e.skin], { moving: e.state === 'patrol' || e.state === 'chase', swing: e.state === 'windup' ? -1 : e.state === 'swing' ? 1 : undefined, angry: e.state !== 'patrol' }); break;
      case 'bomber': SB.drawHuman(x + 13, e.y + e.h, e.dir, 0, { ...SB.LOOKS[e.skin], weapon: null }, { pose: e.throwT > 0 ? 'throw' : undefined, angry: true }); if (e.throwT <= 0 && e.stun <= 0) SB.drawBomb(x + 13 + e.dir * 10, e.y + 36); break;
      case 'wolf': SB.drawDog(x + 29, e.y + e.h, e.dir, e.t, SB.PALS.wolf, 1.25, e.state === 'crouch' ? 'crouch' : e.state === 'leap' ? 'leap' : e.state === 'patrol' ? 'walk' : 'walk'); break;
      case 'rat': SB.drawRat(x + 11, e.y + e.h, e.dir, e.t); break;
      case 'turret': SB.drawTurret(x, e.y, e.w, e.h, e.dir, e.charge); break;
      case 'pylon': SB.drawPylon(x, e.y, e.w, e.h, e.hp, e.max); break;
      default: break;
    }
    if (e.stun > 0 && e.type !== 'pylon') SB.dizzy(x + e.w / 2, e.y - 6, 14);
    ctx.restore();
  }
  function drawBoss() {
    const B = L.boss;
    if (!B || B.dead) return;
    const c = bossCenter(B);
    if (!inView(c.x, 260)) return;
    const x = (B.type === 'warden' || B.type === 'core' ? B.x : B.x) - camX;
    if (B.type === 'warden') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, B.gy + 4, 44, 6, 0, 0, 7); ctx.fill();
      SB.drawWarden(x, B.y, B, B.tint);
    } else if (B.type === 'chief') {
      ctx.save(); if (B.inv > 0 && SB.t % 4 < 2) ctx.globalAlpha = 0.6;
      const sx = B.state === 'telegraph' ? rand(-2, 2) : 0;
      SB.drawHuman(x + B.w / 2 + sx, B.y + B.h, B.dir, B.t * 0.12, SB.LOOKS.chief, { moving: B.state === 'walk' || B.state === 'charge', swing: B.state === 'windup' ? -1 : B.state === 'swing' ? 1 : undefined, angry: true });
      if (B.state === 'stunned') SB.dizzy(x + B.w / 2, B.y - 10, 26);
      ctx.restore();
    } else if (B.type === 'alpha') {
      ctx.save(); if (B.inv > 0 && SB.t % 4 < 2) ctx.globalAlpha = 0.6;
      const st = B.state === 'crouch' ? 'crouch' : B.state === 'leap' ? 'leap' : B.state === 'rest' ? 'walk' : 'run';
      SB.drawDog(x + B.w / 2, B.y + B.h, B.dir, B.state === 'rest' ? 0 : B.t, SB.PALS.greymane, 2.1, st);
      if (B.state === 'rest') SB.dizzy(x + B.w / 2 + B.dir * 30, B.y - 4, 24);
      if (B.state === 'howl') { ctx.strokeStyle = 'rgba(230,230,220,0.5)'; ctx.lineWidth = 2; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.arc(x + B.w / 2 + B.dir * 40, B.y - 10, k * 14 + (SB.t % 20), -1.2, -0.2); ctx.stroke(); } }
      ctx.restore();
    } else if (B.type === 'core') {
      // tethers to living pylons
      for (const e of L.enemies) if (e.type === 'pylon' && !e.dead) {
        ctx.strokeStyle = `rgba(110,220,255,${0.35 + Math.sin(SB.t * 0.2) * 0.15})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(e.x + e.w / 2 - camX, e.y + 6); ctx.lineTo(x, B.y); ctx.stroke();
      }
      SB.drawCore(x, B.y, B);
    }
  }
  function drawAlly(a) {
    const x = a.x - camX;
    if (a.kind === 'dog') SB.drawDog(x, a.y, a.facing, a.t, SB.PALS.biscuit, 0.95, a.lunge > 0 ? 'leap' : a.moving ? 'run' : 'sit');
    else if (a.kind === 'milo') SB.drawHuman(x, a.y, a.facing, a.t * 0.2, SB.LOOKS.milo, { moving: a.moving, pose: a.pose > 0 ? 'aim' : undefined, mood: 'smile' });
    else if (a.kind === 'pip') SB.drawPip(x, a.y, true);
  }
  function drawWorld() {
    SB.World.drawBack(L, camX);
    SB.World.drawDecor(L, camX);
    drawGaps();
    for (const g of L.ground) SB.World.drawGround(L, g, camX);
    for (const p of L.plats) if (!p.gone) SB.World.drawPlat(L, p, camX);
    for (const c of L.checkpoints) {
      if (!inView(c.x, 140)) continue;
      const gy = L.gyAt(c.x) ?? GY, x = c.x - camX;
      if (c.kind === 'fire') SB.drawFire(x, gy);
      else if (c.kind === 'lamp') SB.drawLamp(x, gy, true, 0);
      else SB.drawFlag(x, gy, c.lit);
    }
    for (const lp of L.lamps) if (inView(lp.x, 60)) SB.drawLamp(lp.x - camX, L.gyAt(lp.x) ?? GY, true, lp.flicker);
    drawGate();
    for (const tr of L.traps) drawTrap(tr);
    for (const pk of L.pickups) drawPickup(pk);
    for (const n of L.npcs) drawNPC(n);
    for (const e of L.enemies) drawEnemy(e);
    drawBoss();
    for (const a of L.allies) if (a.kind !== 'pip') drawAlly(a);
    // player
    if (!(P.inv > 0 && SB.t % 6 < 3 && !SB.capture)) {
      SB.drawToby(pcx() - camX, P.y + P.h, P.facing, P.walk, {
        moving: Math.abs(P.vx) > 0.3, air: !P.onGround, pulseReady: P.hasPulse && P.pulseCd <= 0,
        eyeGlow: 0.35 + Math.sin(SB.t * 0.05) * 0.1, tilt: P.onGround ? 0 : P.vy * 0.004 * P.facing,
        sink: P.inQuick ? Math.min(14, P.sink / 10) : 0, frost: L.biome.ground === 'snow',
      });
      if (P.root > 0) SB.drawBearTrap(pcx() - camX, P.y + P.h, true);
    }
    for (const a of L.allies) if (a.kind === 'pip') drawAlly(a);
    // projectiles & hazards
    ctx.save();
    for (const b of L.bullets) {
      ctx.shadowColor = b.bolt ? '#4ad7ff' : '#ff3b2f'; ctx.shadowBlur = 12;
      ctx.fillStyle = b.bolt ? '#4ad7ff' : '#ff5a40'; ctx.beginPath(); ctx.arc(b.x - camX, b.y, b.r, 0, 7); ctx.fill();
      ctx.fillStyle = b.bolt ? '#e9fbff' : '#ffd0b0'; ctx.beginPath(); ctx.arc(b.x - camX, b.y, b.r * 0.4, 0, 7); ctx.fill();
    }
    ctx.restore();
    for (const b of L.bombs) SB.drawBomb(b.x - camX, b.y);
    for (const s of L.shots) {
      if (s.kind === 'zap') { ctx.strokeStyle = '#6dff9c'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(s.x - camX, s.y); ctx.lineTo(s.x - camX - s.vx * 1.6, s.y - s.vy * 1.6); ctx.stroke(); }
      else { ctx.fillStyle = '#cfc6b8'; ctx.beginPath(); ctx.arc(s.x - camX, s.y, 3, 0, 7); ctx.fill(); }
    }
    for (const r of L.rocks) if (r.delay <= 0) SB.drawRock(r.x - camX, r.y, r.r);
    for (const b of L.boulders) { ctx.save(); ctx.translate(b.x - camX, b.y); ctx.rotate(b.rot); SB.drawRock(0, 0, b.r, '#dfe8f0'); ctx.restore(); }
    for (const w of L.waves) { ctx.fillStyle = 'rgba(160,140,120,0.85)'; ctx.beginPath(); ctx.moveTo(w.x - camX - 14, w.y); ctx.quadraticCurveTo(w.x - camX, w.y - 30, w.x - camX + 14, w.y); ctx.fill(); }
    for (const st of L.strikes) {
      const x = st.x - camX, gy = L.gyAt(st.x) ?? GY;
      if (st.bolt > 0 && st.path) {
        ctx.strokeStyle = '#f2f6ff'; ctx.shadowColor = '#9fd0ff'; ctx.shadowBlur = 20; ctx.lineWidth = 3;
        ctx.beginPath(); st.path.forEach(([px, py], k) => (k ? ctx.lineTo(px - camX, py) : ctx.moveTo(px - camX, py))); ctx.stroke(); ctx.shadowBlur = 0;
      } else {
        const a = 0.3 + 0.4 * (1 - st.timer / 70) + (SB.t % 8 < 4 ? 0.15 : 0);
        ctx.fillStyle = `rgba(190,225,255,${a})`; ctx.beginPath(); ctx.ellipse(x, gy - 2, 40, 7, 0, 0, 7); ctx.fill();
      }
    }
    // chase front
    const C = L.chase;
    if (C && C.active) {
      const fx = C.front - camX;
      if (fx > -40) {
        ctx.fillStyle = C.kind === 'avalanche' ? '#eef3f7' : '#2a2522';
        ctx.beginPath(); ctx.moveTo(-10, 0);
        for (let y = 0; y <= H; y += 24) ctx.lineTo(fx + Math.sin(y * 0.09 + SB.t * 0.3) * 12 + (C.kind === 'avalanche' ? (H - y) * -0.25 : 0), y);
        ctx.lineTo(-10, H); ctx.fill();
        for (let k = 0; k < 4; k++) L.particles.push({ x: C.front + rand(-10, 10), y: rand(C.kind === 'avalanche' ? 300 : 250, GY), vx: rand(1, 4), vy: rand(-2, 1), life: 20, c: C.kind === 'avalanche' ? '#ffffff' : '#5a524a', s: rand(2, 5), g: 0.1 });
      }
    }
    for (const r of L.rings) {
      ctx.strokeStyle = `rgba(${r.c},${r.life / 26})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(r.x - camX, r.y, r.r, 0, 7); ctx.stroke();
      ctx.strokeStyle = `rgba(255,240,210,${r.life / 40})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(r.x - camX, r.y, r.r * 0.7, 0, 7); ctx.stroke();
    }
    for (const pa of L.particles) { ctx.globalAlpha = clamp(pa.life / 30, 0, 1); ctx.fillStyle = pa.c; ctx.fillRect(pa.x - camX, pa.y, pa.s, pa.s); }
    ctx.globalAlpha = 1;
    SB.World.drawWater(L, camX);
    SB.World.drawCeilings(L, camX);
    // darkness and lights
    if (L.caves.some((c) => c.dark)) {
      const lights = [{ x: pcx() - camX, y: P.y + 24, r: P.hasPulse && P.pulseCd <= 0 ? 175 : 160, a: 1 }];
      for (const c of L.checkpoints) if (c.kind !== 'flag') lights.push({ x: c.x - camX, y: (L.gyAt(c.x) ?? GY) - 50, r: 170, a: 1 });
      for (const lp of L.lamps) if (!(lp.flicker && (SB.t % 97 < 6 || SB.t % 151 < 3))) lights.push({ x: lp.x + 12 - camX, y: (L.gyAt(lp.x) ?? GY) - 64, r: 150, a: 0.95 });
      for (const a of L.allies) lights.push(a.kind === 'milo' ? { x: a.x - camX, y: a.y - 46, r: 70, a: 0.8, cone: a.facing } : { x: a.x - camX, y: a.y - 10, r: a.kind === 'pip' ? 110 : 60, a: 0.7 });
      for (const e of L.enemies) if (!e.dead && e.type === 'scav' && e.skin === 'miner') lights.push({ x: e.x + 13 - camX, y: e.y + 6, r: 90, a: 0.8 });
      for (const f of L.flashes) lights.push({ x: f.x - camX, y: f.y, r: f.r, a: f.life / f.max });
      for (const b of L.bombs) lights.push({ x: b.x - camX, y: b.y, r: 40, a: 0.8 });
      for (const tr of L.traps) if (tr.type === 'mine' && !tr.done && tr.revealed) lights.push({ x: tr.x - camX, y: tr.y - 10, r: 26, a: 0.6 });
      for (const n of L.npcs) if (n.kind === 'ladder') lights.push({ x: n.x - camX, y: n.y - 120, r: 240, a: 1 });
      for (const n of L.npcs) if (n.kind === 'pip' && !n.hidden) lights.push({ x: n.x - camX, y: n.y - 14, r: 60, a: 0.8 });
      if (L.boss && !L.boss.dead) { const c = bossCenter(L.boss); lights.push({ x: c.x - camX, y: c.y, r: 120, a: 0.8 }); }
      SB.World.drawDarkness(L, camX, lights);
    }
    L.weather.drawFront();
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.95);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  // ---------------------------------------------------------------- render: UI
  function drawHUD() {
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const x = 22 + i * 34, y = 20, full = i < P.hearts;
      ctx.strokeStyle = '#d9d2c5'; ctx.lineWidth = 2; SB.roundRect(x, y, 26, 14, 3); ctx.stroke();
      ctx.fillStyle = '#d9d2c5'; ctx.fillRect(x + 26, y + 4, 3, 6);
      if (full) { ctx.fillStyle = P.hearts === 1 && SB.t % 40 < 20 ? '#ff7a5c' : '#7dffb0'; ctx.fillRect(x + 3, y + 3, 20, 8); }
    }
    ctx.font = `700 14px ${MONO}`; ctx.textAlign = 'left'; ctx.fillStyle = '#e8c27a';
    ctx.fillText(`⚙ ${L.stats.gears}`, 132, 32);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i < L.stats.memories ? '#f2e6cf' : 'rgba(242,230,207,0.18)'; ctx.fillRect(200 + i * 18, 22, 13, 11); }
    if (P.hasPulse) {
      const r = 11, x = 278, y = 27, f = 1 - P.pulseCd / 60;
      ctx.strokeStyle = 'rgba(255,190,120,0.3)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
      ctx.strokeStyle = '#ffbe78'; ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); ctx.stroke();
      SB.heartPath(x, y + 1, 4.5); ctx.fillStyle = f >= 1 ? '#ffbe78' : 'rgba(255,190,120,0.4)'; ctx.fill();
    }
    // allies
    L.allies.forEach((a, i) => {
      const x = 22 + i * 92, y = 46;
      ctx.fillStyle = 'rgba(15,14,13,0.6)'; SB.roundRect(x, y, 84, 20, 4); ctx.fill();
      ctx.fillStyle = { dog: '#c8a06a', milo: '#e0661f', pip: '#6dff9c' }[a.kind];
      ctx.beginPath(); ctx.arc(x + 10, y + 10, 5, 0, 7); ctx.fill();
      ctx.fillStyle = '#e9e1d3'; ctx.font = `700 11px ${MONO}`; ctx.fillText(ALLY_NAMES[a.kind], x + 20, y + 14);
    });
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(233,225,211,0.75)'; ctx.font = `600 italic 18px ${DISPLAY}`;
    ctx.fillText(`Stage ${stageIdx + 1} · ${L.def.name}`, W - 22, 32);
    if (L.weather.gust > 0.15) {
      const dir = L.weather.def.wind.dir;
      ctx.fillStyle = `rgba(233,225,211,${0.4 + L.weather.gust * 0.5})`; ctx.font = `700 13px ${MONO}`;
      ctx.fillText(`${dir < 0 ? '◀◀ ' : ''}GUST${dir > 0 ? ' ▶▶' : ''}`, W - 22, 54);
    }
    if (L.chase && L.chase.active && SB.t % 30 < 20) { ctx.textAlign = 'center'; ctx.fillStyle = '#ff7a5c'; ctx.font = `700 18px ${MONO}`; ctx.fillText('RUN!', W / 2, 80); }
    const B = L.boss;
    if (B && L.arena && !B.dead) {
      const bw = 360, bx = W / 2 - bw / 2, by = 54;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx - 2, by - 2, bw + 4, 12);
      ctx.fillStyle = B.type === 'core' && B.shield ? '#4ad7ff' : '#ff5a40'; ctx.fillRect(bx, by, bw * Math.max(0, B.hp / B.max), 8);
      ctx.textAlign = 'center'; ctx.fillStyle = '#e9e1d3'; ctx.font = `700 12px ${MONO}`; ctx.fillText(B.name + (B.type === 'core' && B.shield ? '  ·  SHIELDED' : ''), W / 2, by - 6);
    }
    if (nearNPC && !dialog) {
      const n = nearNPC, x = n.x - camX, baseY = n.kind === 'crow' ? n.y - 40 : n.kind === 'elephant' ? n.y - 130 : n.y - 100;
      const y = baseY + Math.sin(SB.t * 0.1) * 2;
      ctx.textAlign = 'center'; ctx.font = `700 13px ${MONO}`;
      const label = `E · ${n.prompt}`, w = ctx.measureText(label).width + 16;
      ctx.fillStyle = 'rgba(15,14,13,0.8)'; SB.roundRect(x - w / 2, y - 16, w, 22, 4); ctx.fill();
      ctx.fillStyle = '#e8c27a'; ctx.fillText(label, x, y);
    }
    ctx.restore();
  }
  function drawBanner() {
    if (!bannerObj) return;
    const b = bannerObj, a = Math.min(1, b.t / 20, (b.dur - b.t) / 30);
    ctx.save(); ctx.globalAlpha = clamp(a, 0, 1); ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(10,9,8,0.55)'; ctx.fillRect(0, 92, W, 72);
    ctx.fillStyle = '#e8c27a'; ctx.font = `600 italic 34px ${DISPLAY}`; ctx.fillText(b.title, W / 2, 130);
    if (b.sub) { ctx.fillStyle = '#d9d2c5'; ctx.font = `14px ${MONO}`; ctx.fillText(b.sub, W / 2, 153); }
    ctx.restore();
  }
  function wrap(text, maxW) {
    const words = text.split(' '), lines = []; let line = '';
    for (const w of words) { const tt = line ? line + ' ' + w : w; if (ctx.measureText(tt).width > maxW && line) { lines.push(line); line = w; } else line = tt; }
    if (line) lines.push(line);
    return lines;
  }
  const NAME_COLOR = { TOBY: '#9ec3d6', ASH: '#c9c2b6', MARA: '#e0a46a', NOTE: '#e8c27a', HINT: '#e8c27a', MEMORY: '#e8c27a', MILO: '#f08a4b', KEVIN: '#e86a5a', BISCUIT: '#d9b07a', INES: '#e0c060', SOL: '#e0a46a', PIP: '#6dff9c', 'OLD TOM': '#b9c4c8', SABLE: '#e3b57a', MATRIARCH: '#c9c2b6', SKIPPER: '#e8e2d8', ANSELM: '#d98a7a', RECORDING: '#4ad7ff', 'MS. ALVAREZ': '#d8b26a' };
  function drawDialog() {
    if (!dialog) return;
    const line = dialog.lines[dialog.i];
    const bx = 40, by = H - 148, bw = W - 80, bh = 124;
    ctx.save();
    ctx.fillStyle = 'rgba(14,13,12,0.92)'; SB.roundRect(bx, by, bw, bh, 8); ctx.fill();
    ctx.strokeStyle = line.who === 'RECORDING' ? 'rgba(74,215,255,0.6)' : 'rgba(232,194,122,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = NAME_COLOR[line.who] || '#e9e1d3'; ctx.font = `700 13px ${MONO}`;
    ctx.fillText(line.who.split('').join(' '), bx + 22, by + 28);
    const serif = line.who === 'MEMORY' || line.who === 'NOTE';
    ctx.fillStyle = line.who === 'RECORDING' ? '#bfeeff' : '#e9e1d3';
    ctx.font = serif ? `italic 500 24px ${DISPLAY}` : `18px ${MONO}`;
    const shown = line.text.slice(0, Math.floor(dialog.chars));
    let count = 0, y = by + 58;
    for (const l of wrap(line.text, bw - 48)) { ctx.fillText(shown.slice(count, count + l.length), bx + 22, y); count += l.length + 1; y += 26; }
    if (dialog.chars >= line.text.length && SB.t % 40 < 26) { ctx.fillStyle = '#e8c27a'; ctx.font = `700 12px ${MONO}`; ctx.textAlign = 'right'; ctx.fillText('Space / E ▸', bx + bw - 18, by + bh - 14); }
    ctx.restore();
  }
  function coverImage(img, zoom = 1, ox = 0, oy = 0, alpha = 1) {
    if (!img) { ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H); return; }
    const s = Math.max(W / img.width, H / img.height) * zoom, w = img.width * s, h = img.height * s;
    ctx.globalAlpha = alpha; ctx.drawImage(img, (W - w) / 2 + ox, (H - h) / 2 + oy, w, h); ctx.globalAlpha = 1;
  }
  function spaced(text, x, y, sp) {
    let total = 0; for (const ch of text) total += ctx.measureText(ch).width + sp; total -= sp;
    let cx = x - total / 2; ctx.textAlign = 'left';
    for (const ch of text) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + sp; }
  }
  const INTRO = [
    { img: 'drawing', vo: 2, lines: ['When Kevin was born, his parents bought him a friend.', 'Unit SM-3-15. Kevin called him Toby.'] },
    { img: 'city', vo: 1, lines: ['Thirteen years later, the minds his parents built were turned loose.', 'The world went quiet. There are no governments now. Only survivors.'] },
    { img: 'wake', vo: 0, lines: ['Unit SM-3-15... online.', 'Somewhere out there, Kevin is waiting.'] },
  ];
  function drawTitle() {
    coverImage(SB.IMG.highway, 1.08 + Math.sin(SB.t * 0.003) * 0.03, 0, -10);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(8,7,6,0.55)'); g.addColorStop(0.6, 'rgba(8,7,6,0.45)'); g.addColorStop(1, 'rgba(8,7,6,0.92)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // game logo, floating gently over a soft glow
    const logo = SB.IMG.logo;
    const bob = Math.sin(SB.t * 0.03) * 3, lh = 226, lw = logo ? lh * logo.width / logo.height : 0, ly = 22 + bob;
    const glow = ctx.createRadialGradient(W / 2, 135, 20, W / 2, 135, 230);
    glow.addColorStop(0, 'rgba(255,214,160,0.30)'); glow.addColorStop(1, 'rgba(255,214,160,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, 300);
    if (logo) ctx.drawImage(logo, W / 2 - lw / 2, ly, lw, lh);
    else { ctx.fillStyle = '#f0cf8a'; ctx.font = `italic 600 64px ${DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText("Sadbot's Journey To Bliss", W / 2, 140); }
    // chapter list
    const u = unlocked();
    const x0 = W / 2 - 170, y0 = 290, RH = 22;
    ctx.fillStyle = 'rgba(12,11,10,0.6)'; SB.roundRect(x0 - 20, y0 - 22, 380, STAGES.length * RH + 24, 8); ctx.fill();
    STAGES.forEach((s, i) => {
      const y = y0 + i * RH, open = i < u, sel = i === menuSel;
      ctx.textAlign = 'left'; ctx.font = `${sel ? 700 : 400} 15px ${MONO}`;
      ctx.fillStyle = sel ? '#e8c27a' : open ? '#d9d2c5' : 'rgba(217,210,197,0.3)';
      ctx.fillText(`${sel ? '▸ ' : '  '}${i + 1}  ${open ? s.name : '· · ·'}`, x0, y);
      const best = parseInt(SB.store(`sadbot.best.${s.id}`) || '0', 10);
      if (open && best) { ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(217,210,197,0.5)'; ctx.font = `12px ${MONO}`; ctx.fillText(SB.fmtTime(best), x0 + 340, y); }
    });
    ctx.textAlign = 'center';
    if (SB.t % 70 < 48) { ctx.fillStyle = '#e8c27a'; ctx.font = `700 15px ${MONO}`; ctx.fillText(u > 1 ? '↑ ↓ choose a stage · Enter to begin' : 'Press Enter or tap to begin', W / 2, y0 + STAGES.length * RH + 24); }
    ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(217,210,197,0.5)'; ctx.font = `12px ${MONO}`;
    ctx.fillText('Headphones recommended · M toggles sound', 18, 26);
    // creator credit
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(233,225,211,0.82)'; ctx.font = `italic 500 17px ${DISPLAY}`;
    ctx.fillText('Sadbot is a character imagined by Sherwin (mudspit) Martin of ArtXtreme / Mudpixel.', W / 2, H - 34);
    ctx.fillStyle = 'rgba(232,194,122,0.9)';
    ctx.fillText('Please support Sherwin\'s efforts to build free stuff for everyone.', W / 2, H - 13);
  }
  function drawIntro() {
    const s = INTRO[Math.min(slide, INTRO.length - 1)], k = slideT / 400;
    coverImage(SB.IMG[s.img], 1.05 + k * 0.08, 0, 0, clamp(slideT / 30, 0, 1));
    const g = ctx.createLinearGradient(0, H * 0.5, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.88)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    s.lines.forEach((tx, i) => { ctx.globalAlpha = clamp((slideT - 20 - i * 70) / 40, 0, 1); ctx.fillStyle = i === 0 ? '#e9e1d3' : '#e8c27a'; ctx.font = `italic 500 30px ${DISPLAY}`; ctx.fillText(tx, W / 2, H - 92 + i * 38); });
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(217,210,197,0.55)'; ctx.font = `12px ${MONO}`; ctx.textAlign = 'right'; ctx.fillText('Space ▸ next    Esc ▸ skip', W - 20, 28);
    ctx.textAlign = 'left'; ctx.fillText(`${slide + 1} / ${INTRO.length}`, 20, 28);
  }
  function drawCard() {
    drawWorld();
    ctx.fillStyle = `rgba(8,7,6,${0.78})`; ctx.fillRect(0, 0, W, H);
    const a = clamp(overlayT / 40, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(217,210,197,0.75)'; ctx.font = `15px ${MONO}`; spaced(`STAGE ${stageIdx + 1} OF ${STAGES.length}`, W / 2, 170, 6);
    ctx.fillStyle = '#f0cf8a'; ctx.font = `italic 600 64px ${DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(L.def.name, W / 2, 245);
    ctx.font = `italic 500 26px ${DISPLAY}`;
    L.def.card.forEach((ln, i) => { ctx.globalAlpha = clamp((overlayT - 40 - i * 40) / 40, 0, 1); ctx.fillStyle = i ? '#e8c27a' : '#e9e1d3'; ctx.fillText(ln, W / 2, 310 + i * 36); });
    ctx.globalAlpha = clamp((overlayT - 120) / 30, 0, 1) * (SB.t % 70 < 48 ? 1 : 0.4);
    ctx.fillStyle = '#e8c27a'; ctx.font = `700 15px ${MONO}`; ctx.fillText('Press Enter', W / 2, 430);
    ctx.globalAlpha = 1;
  }
  function drawOverlay(title, sub, lines, img) {
    if (img) { coverImage(img, 1.04); ctx.fillStyle = 'rgba(8,7,6,0.72)'; ctx.fillRect(0, 0, W, H); }
    else { ctx.fillStyle = 'rgba(8,7,6,0.78)'; ctx.fillRect(0, 0, W, H); }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8c27a'; ctx.font = `italic 600 54px ${DISPLAY}`; ctx.fillText(title, W / 2, 150);
    ctx.fillStyle = '#d9d2c5'; ctx.font = `15px ${MONO}`; ctx.fillText(sub, W / 2, 186);
    ctx.font = `16px ${MONO}`;
    lines.forEach((l, i) => { ctx.fillStyle = l.c || '#e9e1d3'; ctx.fillText(l.t, W / 2, 248 + i * 30); });
  }

  // ---------------------------------------------------------------- ending
  const KIDS = [['kid1', 690], ['kid2', 740], ['kid3', 790]];
  function drawEnding() {
    const k = clamp(endT / 900, 0, 1);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, SB.mix('#2a2346', '#e8a07a', k)); g.addColorStop(0.55, SB.mix('#8a5a6a', '#f6c88f', k)); g.addColorStop(1, '#f6dcae');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const sunY = 330 - k * 90;
    const sg = ctx.createRadialGradient(480, sunY, 6, 480, sunY, 260);
    sg.addColorStop(0, 'rgba(255,240,200,0.95)'); sg.addColorStop(0.15, 'rgba(255,215,150,0.5)'); sg.addColorStop(1, 'rgba(255,200,140,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(0, -84); // keep the cast above the dialog box
    // the Spine, far behind
    ctx.fillStyle = 'rgba(110,90,120,0.55)';
    ctx.beginPath(); ctx.moveTo(0, 380); for (let x = 0; x <= W; x += 60) ctx.lineTo(x, 330 - Math.abs(Math.sin(x * 0.013)) * 90); ctx.lineTo(W, 380); ctx.fill();
    // rooftop garden
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(0, 440, W, H);
    ctx.fillStyle = '#5a5a66'; ctx.fillRect(0, 440, W, 6);
    for (const px of [60, 300, 560, 880]) {
      ctx.fillStyle = '#6a4a36'; ctx.fillRect(px - 40, 410, 80, 30);
      ctx.fillStyle = '#4d7a3e'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(px - 30 + i * 12, 404 - (i % 2) * 6, 10, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#e8c27a'; ctx.beginPath(); ctx.arc(px - 10, 396, 3, 0, 7); ctx.arc(px + 14, 392, 3, 0, 7); ctx.fill();
    }
    // Ms. Alvarez and the class
    SB.drawHuman(860, 440, -1, 0, SB.LOOKS.alvarez, { mood: endT > 900 ? 'sad' : 'smile' });
    KIDS.forEach(([look, x]) => SB.drawHuman(x + 40, 440, -1, 0, SB.LOOKS[look], { mood: 'smile' }));
    // Kevin
    const kx = 600;
    SB.drawHuman(kx, 440, -1, 0, SB.LOOKS.kevin, { mood: dialog && dialog.i >= 9 && dialog.i <= 10 ? 'sad' : 'smile', pose: dialog && dialog.i >= 11 ? 'wave' : undefined });
    // Toby and Milo walk in
    const tx = Math.min(470, -40 + endT * 4), mx = Math.min(390, -110 + endT * 4);
    const walking = tx < 470;
    SB.drawHuman(mx, 440, 1, endT * 0.2, SB.LOOKS.milo, { moving: walking, mood: 'smile' });
    SB.drawToby(tx, 440, 1, endT * 0.3, { moving: walking, eyeGlow: 0.6 });
    if (dialog && dialog.i >= dialog.lines.length - 1) { // a little heart above Toby at the very end
      ctx.fillStyle = `rgba(255,150,130,${0.6 + Math.sin(SB.t * 0.1) * 0.3})`; SB.heartPath(tx, 335, 9); ctx.fill();
    }
    ctx.restore();
    if (endT < 140) { ctx.fillStyle = `rgba(0,0,0,${1 - endT / 140})`; ctx.fillRect(0, 0, W, H); }
  }
  function drawCredits() {
    ctx.fillStyle = '#0f0e0d'; ctx.fillRect(0, 0, W, H);
    const a = clamp(overlayT / 60, 0, 1);
    ctx.globalAlpha = a;
    // polaroid of a character-sheet crop (source width sw, height matched to the 148x230 frame)
    const card = (img, sx, sw, x, rot) => {
      if (!img) return;
      ctx.save(); ctx.translate(x, 250); ctx.rotate(rot);
      ctx.fillStyle = '#f2ead8'; ctx.fillRect(-82, -150, 164, 270);
      const dw = 148, dh = 230, shh = Math.min(img.height, sw * (dh / dw));
      ctx.drawImage(img, sx, 0, sw, shh, -74, -142, dw, dh);
      ctx.restore();
    };
    card(SB.IMG.kevin, 20, 300, 170, -0.06);
    card(SB.IMG.milo, 170, 270, W - 170, 0.06);
    ctx.textAlign = 'center';
    SB.drawToby(W / 2, 330, 1, 0, { eyeGlow: 0.6 });
    ctx.fillStyle = 'rgba(255,150,130,0.85)'; SB.heartPath(W / 2, 228, 8); ctx.fill();
    ctx.fillStyle = '#f0cf8a'; ctx.font = `italic 600 54px ${DISPLAY}`; ctx.fillText('The End', W / 2, 120);
    ctx.fillStyle = '#d9d2c5'; ctx.font = `15px ${MONO}`; ctx.fillText('Toby, Kevin and Milo set out on a new journey.', W / 2, 152);
    SB.CREDITS.forEach(([txt, kind], i) => {
      ctx.fillStyle = kind === 'gold' ? '#e8c27a' : kind === 'title' ? '#e9e1d3' : 'rgba(217,210,197,0.75)';
      ctx.font = kind === 'title' ? `700 15px ${MONO}` : `13px ${MONO}`;
      ctx.fillText(txt, W / 2, 380 + i * 22);
    });
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- render
  const donateEl = document.getElementById('donate');
  function render() {
    if (donateEl) { const show = state === 'title'; if (donateEl.hidden === show) donateEl.hidden = !show; } // donate button only on the title screen
    ctx.setTransform(SB.sx, 0, 0, SB.sy, 0, 0);
    ctx.clearRect(0, 0, W, H);
    switch (state) {
      case 'loading':
        ctx.fillStyle = '#0f0e0d'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#e8c27a'; ctx.textAlign = 'center'; ctx.font = `italic 28px ${DISPLAY}`; ctx.fillText('Booting SM-3-15...', W / 2, H / 2);
        return;
      case 'title': drawTitle(); return;
      case 'intro': drawIntro(); return;
      case 'card': drawCard(); return;
      case 'ending': drawEnding(); drawDialog(); return;
      case 'credits': drawCredits(); return;
      default: break;
    }
    const shx = shake > 0.5 ? rand(-shake, shake) : 0, shy = shake > 0.5 ? rand(-shake, shake) : 0;
    ctx.save(); ctx.translate(shx, shy); drawWorld(); ctx.restore();
    drawHUD(); drawBanner(); drawDialog();
    if (state === 'paused') {
      drawOverlay('Paused', 'P or Enter to continue', [
        { t: '← → / A D  walk     Space  jump     X / J  heart pulse' },
        { t: 'E  talk / search     M  sound on/off' },
        { t: `Gears ${L.stats.gears}   ·   Memories ${L.stats.memories}/3   ·   ${SB.fmtTime(L.stats.time)}`, c: '#e8c27a' },
      ]);
    } else if (state === 'gameover') {
      drawOverlay('Low power', 'Toby\'s cells are empty.', [{ t: `Press Enter to reboot at ${L.checkpoint.label}.` }, { t: 'Kevin is still out there.', c: '#e8c27a' }]);
    } else if (state === 'clear') {
      const s = L.stats, next = STAGES[stageIdx + 1];
      drawOverlay(`Stage ${stageIdx + 1} complete`, `${L.def.name.toUpperCase()} · ${L.def.clearLine}`, [
        { t: `Time ${SB.fmtTime(s.time)}     Gears ${s.gears}     Memories ${s.memories}/3` },
        { t: `Machines and beasts stopped ${s.enemies}     Times hurt ${s.hits}` },
        { t: next ? `Next: Stage ${stageIdx + 2} · ${next.name}` : '', c: '#e8c27a' },
        { t: 'Press Enter to continue', c: 'rgba(217,210,197,0.7)' },
      ], stageIdx === 0 ? SB.IMG.school : null);
    }
  }

  // ---------------------------------------------------------------- loop
  let last = performance.now(), acc = 0;
  const STEP = 1000 / 60;
  function frame(now) {
    if (SB.capture) { last = now; acc = 0; requestAnimationFrame(frame); return; } // stepped manually when recording promo footage
    acc += Math.min(100, now - last); last = now;
    while (acc >= STEP) { update(); acc -= STEP; }
    render();
    requestAnimationFrame(frame);
  }
  SB.assetsReady.then(() => { state = 'title'; menuSel = clamp(parseInt(SB.store('sadbot.last') || '0', 10) || 0, 0, unlocked() - 1); });
  requestAnimationFrame(frame);
  // Debug/test handle.
  window.__sadbot = {
    get state() { return state; }, get P() { return P; }, get L() { return L; }, get dialog() { return dialog; },
    startStage, setState: (s) => { state = s; }, play: () => { dialog = null; state = 'play'; }, ally: addAlly,
    step: (n = 1) => { for (let i = 0; i < n; i++) update(); render(); },
    advanceDialog: () => { if (dialog) { dialog.chars = 1e9; SB.pressed.add('advance'); } },
  };
})();
