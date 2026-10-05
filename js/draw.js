// Sadbot's Journey To Bliss — character, creature, enemy and prop drawing.
// All functions take SCREEN x and world/screen foot y (the camera only scrolls horizontally).
(() => {
  'use strict';
  const SB = window.SB;
  const ctx = SB.ctx;
  const t = () => SB.t || 0;

  // ---------------------------------------------------------------- primitives
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function heartPath(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.7, y - s * 1.3, x, y - s * 0.4);
    ctx.bezierCurveTo(x + s * 0.7, y - s * 1.3, x + s * 1.6, y - s * 0.2, x, y + s * 0.9);
  }
  function starPath(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath();
  }
  function dizzy(x, y, rad = 22) {
    for (let i = 0; i < 3; i++) {
      const a = t() * 0.09 + i * 2.1;
      ctx.fillStyle = '#ffd27a'; starPath(x + Math.cos(a) * rad, y + Math.sin(a) * 5, 3.5); ctx.fill();
    }
  }
  function shadow(x, y, rx) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y + 1, rx, 3, 0, 0, 7); ctx.fill(); }
  SB.roundRect = roundRect; SB.heartPath = heartPath; SB.starPath = starPath; SB.dizzy = dizzy;

  // ---------------------------------------------------------------- Toby
  SB.drawToby = (x, footY, facing, walk, opts = {}) => {
    const moving = opts.moving, air = opts.air;
    const bob = moving && !air ? Math.abs(Math.sin(walk)) * 2 : 0;
    const stride = moving && !air ? Math.sin(walk) * 7 : (air ? 4 : 0);
    const cx = x;
    ctx.save();
    if (opts.sink) ctx.translate(0, opts.sink);
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#4b5156'; ctx.lineWidth = 3;
    for (const s of [-1, 1]) {
      const fx = cx + s * 7 + stride * s * 0.5;
      ctx.beginPath(); ctx.moveTo(cx + s * 6, footY - 20 - bob); ctx.lineTo(fx, footY - 7); ctx.stroke();
      ctx.fillStyle = '#5c6e78'; roundRect(fx - 7, footY - 9, 14, 9, 2); ctx.fill();
      ctx.fillStyle = 'rgba(160,80,40,0.55)'; ctx.fillRect(fx - 6, footY - 3, 6, 3);
    }
    const ty = footY - 48 - bob;
    const swing = moving ? Math.sin(walk + Math.PI) * 6 : Math.sin(t() * 0.04) * 1.5;
    ctx.strokeStyle = '#4b5156'; ctx.lineWidth = 3;
    for (const s of [-1, 1]) {
      const sx0 = cx + s * 15, sy0 = ty + 7;
      const ex = sx0 + s * 4 + swing * s * 0.6, ey = ty + 30;
      ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.lineTo(sx0 + s * 3, ty + 18); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = '#6a7880'; ctx.beginPath(); ctx.arc(sx0 + s * 3, ty + 18, 2.6, 0, 7); ctx.fill();
      ctx.strokeStyle = '#3f4448'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 3, ey + 5); ctx.moveTo(ex, ey); ctx.lineTo(ex + 3, ey + 5); ctx.stroke();
      ctx.strokeStyle = '#4b5156'; ctx.lineWidth = 3;
    }
    const tg = ctx.createLinearGradient(cx - 15, 0, cx + 15, 0);
    tg.addColorStop(0, '#5b6c76'); tg.addColorStop(0.5, '#879aa4'); tg.addColorStop(1, '#55646d');
    ctx.fillStyle = tg; roundRect(cx - 15, ty, 30, 30, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(30,30,30,0.5)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx - 14, ty + 22); ctx.lineTo(cx + 14, ty + 22); ctx.stroke();
    ctx.fillStyle = 'rgba(165,86,43,0.7)';
    ctx.beginPath(); ctx.ellipse(cx - 8, ty + 26, 5, 3, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 9, ty + 6, 3, 2, 0, 0, 7); ctx.fill();
    const glow = opts.pulseReady ? 0.55 + Math.sin(t() * 0.1) * 0.25 : 0;
    heartPath(cx, ty + 12, 5.5);
    if (glow) { ctx.fillStyle = `rgba(255,170,110,${glow})`; ctx.shadowColor = '#ffaa6e'; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0; }
    ctx.strokeStyle = '#3a3f43'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.strokeStyle = '#3f4448'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, ty); ctx.lineTo(cx, ty - 6); ctx.stroke();
    const hy = ty - 36, tilt = opts.tilt || 0;
    ctx.save();
    ctx.translate(cx, hy + 15); ctx.rotate(tilt);
    const hg = ctx.createLinearGradient(-21, -15, 21, 15);
    hg.addColorStop(0, '#7f98a6'); hg.addColorStop(1, '#5d7381');
    ctx.fillStyle = hg; roundRect(-21, -15, 42, 31, 4); ctx.fill();
    ctx.fillStyle = '#7a5038'; roundRect(-20, 9, 40, 7, 2); ctx.fill();
    ctx.fillStyle = 'rgba(176,100,58,0.75)';
    ctx.beginPath(); ctx.ellipse(-13, -9, 5, 3, 0.3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(14, 3, 4, 5, 0, 0, 7); ctx.fill();
    if (opts.frost) { ctx.fillStyle = 'rgba(235,245,255,0.75)'; ctx.fillRect(-21, -15, 42, 4); }
    ctx.strokeStyle = 'rgba(25,30,35,0.65)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(0, 9); ctx.stroke();
    const eo = facing * 3;
    for (const ex of [-9 + eo, 9 + eo]) {
      ctx.fillStyle = '#0d0f11'; ctx.beginPath(); ctx.arc(ex, -2, 4.6, 0, 7); ctx.fill();
      if (opts.eyeGlow) { ctx.fillStyle = `rgba(255,190,90,${opts.eyeGlow})`; ctx.beginPath(); ctx.arc(ex, -2, 2.4, 0, 7); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(ex - 1.5, -3.5, 1.1, 0, 7); ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  };

  // ---------------------------------------------------------------- humans
  SB.LOOKS = {
    kevin: { h: 62, kid: 1, skin: '#b97a52', hair: '#1b1714', hairStyle: 'messy', hat: 'cap', hatColor: '#c0392b', top: '#2b3a5c', topStyle: 'hoodie', scarf: '#8d8f92', pants: '#5c7a9c', shoes: '#c0392b', bag: '#3f7fb5', patch: 1 },
    milo: { h: 66, kid: 1, skin: '#f0c6a4', hair: '#d2691e', hairStyle: 'curly', goggles: 1, top: '#6b6e3f', topStyle: 'jacket', scarf: '#e0661f', pants: '#c9b48a', shorts: 1, legs: '#3a332e', shoes: '#7a4a2a', badge: 1, weapon: 'slingshot', freckles: 1 },
    alvarez: { h: 80, skin: '#c58c63', hair: '#2b1d16', hairStyle: 'bun', top: '#7a3b45', topStyle: 'coat', scarf: '#d8b26a', pants: '#3a3a44', shoes: '#2a2522', glasses: 1 },
    ines: { h: 78, skin: '#a86d4c', hair: '#d9d4cc', hairStyle: 'short', hat: 'wide', hatColor: '#2f3e4a', top: '#d9a52e', topStyle: 'coat', pants: '#2c3440', shoes: '#1e2228', weapon: 'lantern' },
    sol: { h: 80, skin: '#7a4f33', hair: '#e8e2d8', hairStyle: 'bald', beard: '#e8e2d8', hat: 'wrap', hatColor: '#d8c7a0', top: '#a7623a', topStyle: 'robe', scarf: '#3f6d8a', pants: '#8a6a48', shoes: '#5a3a22', weapon: 'staff' },
    anselm: { h: 78, skin: '#e3b896', hair: '#9a9a9a', hairStyle: 'bald', beard: '#c9c9c9', hat: 'beanie', hatColor: '#8a2f2f', top: '#5c4433', topStyle: 'robe', scarf: '#8a2f2f', pants: '#4a3a2e', shoes: '#2a1f18', weapon: 'lantern' },
    scav: { h: 74, skin: '#8a6a55', hair: '#2a2420', hairStyle: 'short', hat: 'hood', hatColor: '#4a3f36', mask: 1, top: '#5a4a3c', topStyle: 'rags', pants: '#3e3a36', shoes: '#2a2522', weapon: 'pipe' },
    raider: { h: 74, skin: '#9a6a45', hair: '#2a2420', hairStyle: 'short', hat: 'wrap', hatColor: '#c9a77a', goggles: 1, mask: 1, top: '#b08a5a', topStyle: 'rags', scarf: '#a0522d', pants: '#6e5a40', shoes: '#3a2a1c', weapon: 'pipe' },
    poacher: { h: 76, skin: '#d2a07c', hair: '#3a2a1e', hairStyle: 'short', beard: '#3a2a1e', hat: 'wide', hatColor: '#4a3b2a', top: '#4f5a3a', topStyle: 'coat', pants: '#3a3428', shoes: '#2a2018', weapon: 'pipe' },
    miner: { h: 74, skin: '#8a6a55', hair: '#2a2420', hairStyle: 'short', hat: 'helmet', hatColor: '#d4a82a', lamp: 1, mask: 1, top: '#4a4f57', topStyle: 'vest', pants: '#33363b', shoes: '#22252a', weapon: 'pipe' },
    mountain: { h: 76, skin: '#d2a07c', hair: '#3a2a1e', hairStyle: 'short', hat: 'beanie', hatColor: '#6a2a2a', mask: 1, top: '#7a6a5a', topStyle: 'coat', scarf: '#cfc6b8', pants: '#3e3a36', shoes: '#2a2522', weapon: 'pipe' },
    chief: { h: 118, skin: '#8a6a55', hair: '#2a2420', hairStyle: 'short', hat: 'helmet', hatColor: '#6b6e72', mask: 1, top: '#4a3a2e', topStyle: 'rags', pads: 1, pants: '#2e2a26', shoes: '#1e1a16', weapon: 'wrench' },
    kid1: { h: 58, kid: 1, skin: '#7a4f33', hair: '#141210', hairStyle: 'curly', top: '#a7623a', topStyle: 'hoodie', pants: '#3a3a44', shoes: '#e8e2d8' },
    kid2: { h: 56, kid: 1, skin: '#f0c6a4', hair: '#e8c27a', hairStyle: 'long', top: '#3f7f5a', topStyle: 'jacket', pants: '#5c7a9c', shoes: '#2a2522' },
    kid3: { h: 60, kid: 1, skin: '#c58c63', hair: '#2b1d16', hairStyle: 'bun', top: '#c9a25a', topStyle: 'hoodie', scarf: '#7a3b45', pants: '#3e3a36', shoes: '#7a4a2a' },
  };

  SB.drawHuman = (x, footY, facing, walk, look, o = {}) => {
    const s = (look.h || 72) / 72;
    const sw = o.moving ? Math.sin(walk) : 0;
    const kid = !!look.kid;
    const hipY = kid ? -27 : -31, shY = kid ? -45 : -52, headY = kid ? -57 : -63, headR = kid ? 10.5 : 9;
    ctx.save();
    ctx.translate(x, footY); ctx.scale(facing * s, s);
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    ctx.lineCap = 'round';
    const dark = (c) => c; // palette already muted
    // back arm
    const armTo = (side, hx, hy) => {
      ctx.strokeStyle = side < 0 ? shade(look.top, -25) : look.top; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(0, shY + 3); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.fillStyle = look.glove || look.skin; ctx.beginPath(); ctx.arc(hx, hy, 2.6, 0, 7); ctx.fill();
    };
    armTo(-1, -5 - sw * 6, hipY + 3);
    // legs
    const legCol = look.shorts ? (look.legs || look.skin) : look.pants;
    for (const [side, st] of [[-1, -sw * 7], [1, sw * 7]]) {
      ctx.strokeStyle = side < 0 ? shade(legCol, -20) : legCol; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(side * 3, hipY); ctx.lineTo(side * 2 + st, -4); ctx.stroke();
      if (look.shorts) { ctx.strokeStyle = look.pants; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(side * 3, hipY); ctx.lineTo(side * 3 + st * 0.3, hipY + 9); ctx.stroke(); }
      ctx.fillStyle = side < 0 ? shade(look.shoes, -20) : look.shoes;
      roundRect(side * 2 + st - 4, -6, 12, 6, 2); ctx.fill();
    }
    // backpack
    if (look.bag) {
      ctx.fillStyle = look.bag; roundRect(-17, shY + 1, 10, 20, 3); ctx.fill();
      if (look.patch) { ctx.fillStyle = '#e8c27a'; ctx.fillRect(-16, shY + 6, 7, 5); }
    }
    // torso
    const tb = look.topStyle === 'coat' ? -12 : look.topStyle === 'robe' ? -5 : hipY + 3;
    ctx.fillStyle = look.top;
    ctx.beginPath();
    ctx.moveTo(-9, shY - 1); ctx.lineTo(9, shY - 1);
    ctx.lineTo(look.topStyle === 'robe' || look.topStyle === 'coat' ? 12 : 10, tb);
    if (look.topStyle === 'rags') { for (let i = 0; i <= 6; i++) ctx.lineTo(10 - i * (20 / 6), tb + (i % 2 ? 4 : 0)); }
    else ctx.lineTo(look.topStyle === 'robe' || look.topStyle === 'coat' ? -12 : -10, tb);
    ctx.closePath(); ctx.fill();
    if (look.topStyle === 'hoodie') { ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.strokeRect(-5, hipY - 8, 10, 5); }
    if (look.topStyle === 'jacket') { ctx.fillStyle = shade(look.top, 18); ctx.fillRect(-8, shY + 6, 5, 4); ctx.fillRect(3, shY + 6, 5, 4); ctx.fillStyle = '#e0661f'; ctx.fillRect(6, shY + 2, 3, 3); }
    if (look.topStyle === 'vest') { ctx.fillStyle = '#e0a020'; ctx.fillRect(-9, shY + 8, 18, 3); }
    if (look.pads) { ctx.fillStyle = '#6b6e72'; roundRect(-12, shY - 3, 8, 7, 2); ctx.fill(); roundRect(4, shY - 3, 8, 7, 2); ctx.fill(); }
    if (look.badge) {
      ctx.strokeStyle = '#2f3e6a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-3, shY); ctx.lineTo(1, shY + 10); ctx.lineTo(4, shY); ctx.stroke();
      ctx.fillStyle = '#eef0f2'; ctx.fillRect(-1, shY + 9, 5, 6);
    }
    // scarf
    if (look.scarf) {
      ctx.fillStyle = look.scarf; roundRect(-8, shY - 4, 16, 6, 3); ctx.fill();
      const fl = Math.sin(t() * 0.15 + x * 0.01) * 2;
      ctx.beginPath(); ctx.moveTo(-6, shY - 1); ctx.lineTo(-15, shY + 4 + fl); ctx.lineTo(-12, shY + 8 + fl); ctx.lineTo(-3, shY + 2); ctx.fill();
    }
    // front arm + weapon
    let hx = 6 + sw * 6, hy = hipY + 3;
    if (o.swing !== undefined) { const a = o.swing < 0 ? -2.4 : 0.1; hx = Math.cos(a) * 15; hy = shY + 3 + Math.sin(a) * 15; }
    if (o.pose === 'throw') { hx = -6; hy = shY - 12; }
    if (o.pose === 'aim') { hx = 15; hy = shY + 1; }
    if (o.pose === 'wave') { hx = 9; hy = shY - 14 + Math.sin(t() * 0.3) * 2; }
    armTo(1, hx, hy);
    drawWeapon(look.weapon, hx, hy, o);
    // head
    ctx.fillStyle = look.skin; ctx.beginPath(); ctx.arc(1, headY, headR, 0, 7); ctx.fill();
    hair(look, headY, headR);
    if (look.beard) { ctx.fillStyle = look.beard; ctx.beginPath(); ctx.arc(2, headY + 3, headR * 0.8, 0.1, Math.PI - 0.6); ctx.fill(); }
    if (look.freckles) { ctx.fillStyle = 'rgba(190,90,40,0.6)'; ctx.fillRect(4, headY + 1, 1.2, 1.2); ctx.fillRect(7, headY + 2, 1.2, 1.2); }
    if (!look.mask) {
      ctx.fillStyle = '#1a1412'; ctx.beginPath(); ctx.arc(headR * 0.5, headY - 1, 1.3, 0, 7); ctx.fill();
      if (o.mood === 'smile') { ctx.strokeStyle = '#6a3a2a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(headR * 0.45, headY + 3, 2.2, 0.2, Math.PI - 0.6); ctx.stroke(); }
      if (o.mood === 'sad') { ctx.strokeStyle = '#6a3a2a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(headR * 0.45, headY + 6, 2.2, Math.PI + 0.6, -0.2); ctx.stroke(); ctx.fillStyle = 'rgba(160,200,255,0.8)'; ctx.fillRect(headR * 0.5, headY + 1, 1.2, 3); }
    } else {
      ctx.fillStyle = '#2a2826'; roundRect(-1, headY - 1, headR + 2, 9, 3); ctx.fill();
      ctx.fillStyle = '#4a4744'; ctx.beginPath(); ctx.arc(headR + 1, headY + 5, 3, 0, 7); ctx.fill();
      ctx.fillStyle = o.angry ? '#ff5a40' : '#d9d2c5'; ctx.fillRect(headR * 0.35, headY - 5, 3, 2);
    }
    if (look.glasses) { ctx.strokeStyle = '#2a2522'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(headR * 0.5, headY - 1, 2.6, 0, 7); ctx.stroke(); }
    if (look.goggles) {
      ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(1, headY, headR, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      ctx.fillStyle = '#6a7880'; ctx.beginPath(); ctx.arc(headR * 0.3, headY - headR + 2, 3, 0, 7); ctx.arc(headR * 0.85, headY - headR + 3, 2.6, 0, 7); ctx.fill();
      ctx.fillStyle = '#b7d4e0'; ctx.beginPath(); ctx.arc(headR * 0.3, headY - headR + 2, 1.6, 0, 7); ctx.fill();
    }
    hat(look, headY, headR);
    ctx.restore();
  };
  function shade(hex, amt) {
    if (!hex || hex[0] !== '#') return hex;
    const n = parseInt(hex.slice(1), 16);
    const c = (v) => Math.max(0, Math.min(255, v + amt));
    return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
  }
  SB.shade = shade;
  function hair(look, hy, r) {
    ctx.fillStyle = look.hair;
    switch (look.hairStyle) {
      case 'messy':
        ctx.beginPath(); ctx.arc(0, hy - 2, r, Math.PI, Math.PI * 2.05); ctx.fill();
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-r + i * 4, hy - r + 3); ctx.lineTo(-r + i * 4 - 3, hy - r - 3); ctx.lineTo(-r + i * 4 + 3, hy - r + 2); ctx.fill(); }
        ctx.fillRect(-r, hy - 3, 4, 8);
        break;
      case 'curly':
        for (let i = 0; i < 7; i++) { const a = Math.PI + i * (Math.PI / 6); ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.85, hy + Math.sin(a) * r * 0.85 - 1, r * 0.42, 0, 7); ctx.fill(); }
        ctx.beginPath(); ctx.arc(-r * 0.7, hy + 2, r * 0.4, 0, 7); ctx.fill();
        break;
      case 'bun':
        ctx.beginPath(); ctx.arc(0, hy - 1, r, Math.PI, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-r * 0.8, hy - r * 0.6, r * 0.45, 0, 7); ctx.fill();
        break;
      case 'long':
        ctx.beginPath(); ctx.arc(0, hy - 1, r, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillRect(-r, hy - 2, r * 0.9, r * 1.7);
        break;
      case 'short':
        ctx.beginPath(); ctx.arc(0, hy - 1, r, Math.PI * 0.95, Math.PI * 2.02); ctx.fill();
        break;
      default: break;
    }
  }
  function hat(look, hy, r) {
    if (!look.hat) return;
    ctx.fillStyle = look.hatColor;
    switch (look.hat) {
      case 'cap':
        ctx.beginPath(); ctx.arc(0, hy - 2, r, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillRect(r * 0.4, hy - 4, r * 0.9, 3);
        break;
      case 'wide':
        ctx.fillRect(-r - 5, hy - r + 2, r * 2 + 12, 3);
        ctx.beginPath(); ctx.arc(1, hy - r + 2, r * 0.75, Math.PI, Math.PI * 2); ctx.fill();
        break;
      case 'hood':
        ctx.beginPath(); ctx.arc(-1, hy, r + 3, Math.PI * 0.55, Math.PI * 1.95); ctx.lineTo(-4, hy + r + 4); ctx.fill();
        break;
      case 'helmet':
        ctx.beginPath(); ctx.arc(0, hy - 2, r + 1.5, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillRect(-r - 2, hy - 3, r * 2 + 5, 2.5);
        if (look.lamp) { ctx.fillStyle = '#fff2b0'; ctx.shadowColor = '#fff2b0'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(r * 0.6, hy - r * 0.6, 2.4, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
        break;
      case 'beanie':
        ctx.beginPath(); ctx.arc(0, hy - 2, r + 1, Math.PI, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, hy - r - 3, 2.5, 0, 7); ctx.fill();
        break;
      case 'wrap':
        ctx.beginPath(); ctx.ellipse(0, hy - r * 0.55, r + 2, r * 0.7, 0, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillRect(-r - 2, hy - r * 0.6, r * 2 + 4, 4);
        break;
      default: break;
    }
  }
  function drawWeapon(w, hx, hy, o) {
    if (!w) return;
    ctx.save(); ctx.translate(hx, hy);
    const ang = o.swing !== undefined ? (o.swing < 0 ? -2.2 : 0.4) : 0.9;
    switch (w) {
      case 'pipe':
        ctx.rotate(ang - Math.PI / 2); ctx.strokeStyle = '#7d8185'; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -24); ctx.stroke();
        ctx.fillStyle = '#5a5e62'; ctx.fillRect(-3, -26, 6, 4);
        break;
      case 'wrench':
        ctx.rotate(ang - Math.PI / 2); ctx.strokeStyle = '#8a8f94'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -30); ctx.stroke();
        ctx.fillStyle = '#8a8f94'; ctx.beginPath(); ctx.arc(0, -33, 7, 0, 7); ctx.fill();
        ctx.fillStyle = '#1a1816'; ctx.fillRect(-2.5, -41, 5, 8);
        ctx.fillStyle = 'rgba(176,100,58,0.7)'; ctx.fillRect(-2, -16, 4, 6);
        break;
      case 'slingshot':
        ctx.strokeStyle = '#a0703a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, -5); ctx.lineTo(-3, -10); ctx.moveTo(0, -5); ctx.lineTo(3, -10); ctx.stroke();
        break;
      case 'lantern': {
        const fl = 0.8 + Math.sin(t() * 0.3) * 0.1;
        ctx.fillStyle = '#b8902f'; ctx.fillRect(-4, 2, 8, 2); ctx.fillRect(-4, 13, 8, 2);
        ctx.fillStyle = `rgba(255,214,140,${fl})`; ctx.shadowColor = '#ffb050'; ctx.shadowBlur = 12; ctx.fillRect(-3, 4, 6, 9); ctx.shadowBlur = 0;
        break;
      }
      case 'staff':
        ctx.strokeStyle = '#6e4a2c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(1, 30); ctx.lineTo(-1, -26); ctx.stroke();
        break;
      default: break;
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- creatures
  SB.PALS = {
    biscuit: { body: '#c8a06a', dark: '#8a5a32', belly: '#efe0c4', eye: '#1a1412', collar: '#c0392b' },
    wolf: { body: '#7d7f82', dark: '#4a4c50', belly: '#b8b8b4', eye: '#f5c542' },
    greymane: { body: '#6a6c70', dark: '#3a3c40', belly: '#a8a8a4', eye: '#ffcf4a', scar: 1 },
  };
  // quadruped (dogs/wolves). state: 'walk' | 'run' | 'sit' | 'crouch' | 'leap'
  SB.drawDog = (x, footY, facing, tt, pal, size = 1, state = 'walk') => {
    ctx.save(); ctx.translate(x, footY); ctx.scale(facing * size, size);
    shadow(0, 0, 18);
    const run = state === 'run' ? 0.45 : 0.22;
    const ph = tt * run;
    const crouch = state === 'crouch' ? 5 : 0;
    ctx.strokeStyle = pal.dark; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    if (state === 'sit') {
      ctx.beginPath(); ctx.moveTo(10, -14); ctx.lineTo(11, 0); ctx.moveTo(6, -14); ctx.lineTo(6, 0); ctx.stroke();
      ctx.fillStyle = pal.body; ctx.beginPath(); ctx.ellipse(-4, -12, 12, 9, -0.5, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-12, -3, 7, 4, 0, 0, 7); ctx.fill();
    } else {
      const legs = [[-12, 0], [-7, Math.PI], [8, Math.PI], [13, 0]];
      for (const [lx, p] of legs) {
        const k = state === 'leap' ? 6 : Math.sin(ph + p) * 6;
        ctx.beginPath(); ctx.moveTo(lx, -12 + crouch); ctx.lineTo(lx + k, 0); ctx.stroke();
      }
      ctx.fillStyle = pal.body; ctx.beginPath(); ctx.ellipse(0, -16 + crouch, 18, 8, 0, 0, 7); ctx.fill();
      ctx.fillStyle = pal.belly; ctx.beginPath(); ctx.ellipse(2, -12 + crouch, 11, 3.5, 0, 0, 7); ctx.fill();
    }
    // tail
    const wag = Math.sin(tt * (state === 'sit' ? 0.4 : 0.2)) * 5;
    ctx.strokeStyle = pal.body; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-17, -18 + crouch); ctx.quadraticCurveTo(-25, -24 + wag, -28, -18 + wag); ctx.stroke();
    // head
    const hy = state === 'sit' ? -26 : -24 + crouch;
    ctx.fillStyle = pal.body; ctx.beginPath(); ctx.arc(16, hy, 7.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(23, hy + 2, 6, 4, 0.1, 0, 7); ctx.fill();
    ctx.fillStyle = '#1a1412'; ctx.beginPath(); ctx.arc(28.5, hy + 1, 1.8, 0, 7); ctx.fill();
    ctx.fillStyle = pal.dark; ctx.beginPath(); ctx.moveTo(11, hy - 4); ctx.lineTo(13, hy - 13); ctx.lineTo(17, hy - 5); ctx.fill();
    ctx.fillStyle = pal.eye; ctx.beginPath(); ctx.arc(19, hy - 1.5, 1.6, 0, 7); ctx.fill();
    if (pal.collar) { ctx.fillStyle = pal.collar; ctx.beginPath(); ctx.moveTo(10, hy + 5); ctx.lineTo(16, hy + 7); ctx.lineTo(12, hy + 12); ctx.fill(); }
    if (pal.scar) { ctx.strokeStyle = '#d9d2c5'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(15, hy - 6); ctx.lineTo(21, hy + 2); ctx.stroke(); }
    if (state === 'crouch' || state === 'leap') { ctx.strokeStyle = '#efe8dc'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(24, hy + 5); ctx.lineTo(28, hy + 5); ctx.stroke(); }
    ctx.restore();
  };
  SB.drawRat = (x, footY, facing, tt) => {
    ctx.save(); ctx.translate(x, footY); ctx.scale(facing, 1);
    ctx.strokeStyle = '#a07a72'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-9, -4); ctx.quadraticCurveTo(-18, -2 + Math.sin(tt * 0.5) * 3, -22, -6); ctx.stroke();
    ctx.fillStyle = '#5a5552'; ctx.beginPath(); ctx.ellipse(0, -5, 10, 5, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(9, -6, 5, 3.5, 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#c99a90'; ctx.beginPath(); ctx.arc(6, -10, 2.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff4433'; ctx.fillRect(11, -8, 1.6, 1.6);
    ctx.strokeStyle = '#3a3532'; ctx.lineWidth = 1.5;
    const k = Math.sin(tt * 0.6) * 3;
    ctx.beginPath(); ctx.moveTo(-5, -1); ctx.lineTo(-5 + k, 0); ctx.moveTo(5, -1); ctx.lineTo(5 - k, 0); ctx.stroke();
    ctx.restore();
  };
  SB.drawCrow = (x, y, white = false, facing = 1) => {
    const hop = Math.max(0, Math.sin(t() * 0.05 + x)) > 0.97 ? -3 : 0;
    ctx.save(); ctx.translate(x, y + hop); ctx.scale(facing, 1);
    ctx.fillStyle = '#121214';
    ctx.beginPath(); ctx.ellipse(0, -10, 10, 8, -0.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(8, -18, 5.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(-20, -4); ctx.lineTo(-9, -13); ctx.fill();
    if (white) { ctx.strokeStyle = '#e9e1d3'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-4, -12); ctx.lineTo(-12, -7); ctx.stroke(); }
    ctx.fillStyle = '#3b3530'; ctx.beginPath(); ctx.moveTo(13, -19); ctx.lineTo(20, -17); ctx.lineTo(13, -16); ctx.fill();
    ctx.fillStyle = '#d9c9a0'; ctx.beginPath(); ctx.arc(10, -19, 1.2, 0, 7); ctx.fill();
    ctx.strokeStyle = '#121214'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(-3, 2); ctx.moveTo(3, -3); ctx.lineTo(3, 2); ctx.stroke();
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(2, -1, 3, 2);
    ctx.restore();
  };
  SB.drawCat = (x, footY) => {
    ctx.save(); ctx.translate(x, footY);
    ctx.fillStyle = '#3c3a3a';
    ctx.beginPath(); ctx.ellipse(0, -10, 10, 10, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -24, 7, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-1, -28); ctx.lineTo(0, -36); ctx.lineTo(4, -30); ctx.moveTo(5, -30); ctx.lineTo(9, -36); ctx.lineTo(10, -27); ctx.fill();
    ctx.strokeStyle = '#3c3a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-9, -4); ctx.quadraticCurveTo(-20, -6 + Math.sin(t() * 0.05) * 4, -16, -18); ctx.stroke();
    ctx.fillStyle = '#c9d4d8'; ctx.beginPath(); ctx.arc(2, -25, 1.6, 0, 7); ctx.arc(7, -25, 1.6, 0, 7); ctx.fill();
    ctx.restore();
  };
  SB.drawFox = (x, footY, facing = 1) => {
    ctx.save(); ctx.translate(x, footY); ctx.scale(facing, 1);
    ctx.strokeStyle = '#c9965a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(-6, 0); ctx.moveTo(5, -8); ctx.lineTo(5, 0); ctx.stroke();
    ctx.fillStyle = '#e3b57a'; ctx.beginPath(); ctx.ellipse(0, -11, 10, 5.5, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-9, -12); ctx.quadraticCurveTo(-20, -18 + Math.sin(t() * 0.15) * 3, -18, -8); ctx.fill();
    ctx.beginPath(); ctx.arc(10, -16, 5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6, -18); ctx.lineTo(3, -32); ctx.lineTo(10, -20); ctx.moveTo(10, -19); ctx.lineTo(14, -32); ctx.lineTo(14, -18); ctx.fill();
    ctx.fillStyle = '#f6e4c6'; ctx.beginPath(); ctx.moveTo(6, -20); ctx.lineTo(5, -28); ctx.lineTo(9, -21); ctx.fill();
    ctx.fillStyle = '#1a1412'; ctx.beginPath(); ctx.arc(12, -17, 1.2, 0, 7); ctx.arc(16, -15, 1.2, 0, 7); ctx.fill();
    ctx.restore();
  };
  SB.drawElephant = (x, footY, facing = -1) => {
    ctx.save(); ctx.translate(x, footY); ctx.scale(facing, 1);
    shadow(0, 0, 60);
    ctx.fillStyle = '#6f6d6a';
    for (const lx of [-34, -16, 14, 32]) roundRect(lx - 8, -40, 16, 40, 5), ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -62, 55, 34, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(52, -72, 22, 22, 0, 0, 7); ctx.fill();
    const sw = Math.sin(t() * 0.03) * 6;
    ctx.strokeStyle = '#6f6d6a'; ctx.lineWidth = 11; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(66, -66); ctx.quadraticCurveTo(80 + sw, -40, 72 + sw, -14); ctx.stroke();
    ctx.fillStyle = '#5d5b58'; ctx.beginPath(); ctx.ellipse(40, -70, 14, 20, -0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#e9e1d3'; ctx.beginPath(); ctx.moveTo(62, -58); ctx.quadraticCurveTo(72, -54, 74, -60); ctx.lineTo(70, -62); ctx.fill();
    ctx.fillStyle = '#1a1412'; ctx.beginPath(); ctx.arc(60, -78, 2, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(40,38,36,0.45)'; ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-20 + i * 9, -60, 14, 1.2, 1.9); ctx.stroke(); }
    ctx.restore();
  };
  SB.drawGoat = (x, footY, facing = 1) => {
    ctx.save(); ctx.translate(x, footY); ctx.scale(facing, 1);
    ctx.strokeStyle = '#d9d4cc'; ctx.lineWidth = 3;
    for (const lx of [-9, -4, 6, 10]) { ctx.beginPath(); ctx.moveTo(lx, -12); ctx.lineTo(lx, 0); ctx.stroke(); }
    ctx.fillStyle = '#ece8e0'; ctx.beginPath(); ctx.ellipse(0, -17, 15, 8, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(16, -25, 6, 5, 0.4, 0, 7); ctx.fill();
    ctx.strokeStyle = '#6a5a48'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(10, -30, 6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.fillStyle = '#d9d4cc'; ctx.beginPath(); ctx.moveTo(18, -21); ctx.lineTo(17, -13); ctx.lineTo(21, -20); ctx.fill();
    ctx.fillStyle = '#1a1412'; ctx.fillRect(17, -27, 1.6, 1.6);
    ctx.restore();
  };
  SB.drawDeer = (x, footY, facing = 1, tt = 0) => {
    ctx.save(); ctx.translate(x, footY); ctx.scale(facing, 1);
    ctx.strokeStyle = '#7a5434'; ctx.lineWidth = 2.5;
    for (const [lx, p] of [[-12, 0], [-8, 3], [8, 3], [12, 0]]) { ctx.beginPath(); ctx.moveTo(lx, -22); ctx.lineTo(lx + Math.sin(tt * 0.3 + p) * 4, 0); ctx.stroke(); }
    ctx.fillStyle = '#9a6a42'; ctx.beginPath(); ctx.ellipse(0, -27, 17, 8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#efe0c4'; ctx.beginPath(); ctx.arc(-17, -29, 3, 0, 7); ctx.fill();
    ctx.fillStyle = '#9a6a42'; ctx.beginPath(); ctx.moveTo(12, -30); ctx.lineTo(18, -44); ctx.lineTo(24, -42); ctx.lineTo(17, -27); ctx.fill();
    ctx.beginPath(); ctx.ellipse(23, -44, 6, 4, 0.3, 0, 7); ctx.fill();
    ctx.strokeStyle = '#d9c9a0'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(20, -48); ctx.lineTo(16, -58); ctx.lineTo(12, -60); ctx.moveTo(16, -58); ctx.lineTo(19, -63); ctx.stroke();
    ctx.restore();
  };
  SB.drawPip = (x, y, active = true) => {
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = '#3a3f43'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, -15); ctx.stroke();
    if (active) { ctx.fillStyle = 'rgba(200,200,200,0.35)'; const b = Math.abs(Math.sin(t() * 0.9)) * 10 + 4; ctx.fillRect(-b / 2, -16, b, 2); }
    ctx.fillStyle = '#7d8a7a'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fill();
    ctx.fillStyle = '#5a6658'; ctx.fillRect(-9, 1, 18, 3);
    ctx.shadowColor = '#6dff9c'; ctx.shadowBlur = active ? 10 : 0;
    ctx.fillStyle = active ? '#6dff9c' : '#2f4a38'; ctx.beginPath(); ctx.arc(3, -1, 3, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  };
  SB.drawMara = (x, y) => {
    const breath = Math.sin(t() * 0.04) * 0.8, flick = 0.85 + Math.sin(t() * 0.3) * 0.08 + Math.sin(t() * 0.71) * 0.05;
    ctx.save(); ctx.translate(x, y);
    const glow = ctx.createRadialGradient(-27, -34, 2, -27, -34, 95);
    glow.addColorStop(0, `rgba(255,190,110,${0.38 * flick})`); glow.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = glow; ctx.fillRect(-125, -130, 210, 140);
    ctx.strokeStyle = '#6e4a2c'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(19, 0); ctx.lineTo(21, -30); ctx.lineTo(18, -52); ctx.lineTo(22, -76); ctx.stroke();
    ctx.beginPath(); ctx.arc(27, -78, 5, Math.PI, Math.PI * 2.6); ctx.stroke();
    for (const bx of [-8, 7]) {
      ctx.fillStyle = '#5a3a24'; roundRect(bx - 6, -9, 13, 9, 3); ctx.fill();
      ctx.strokeStyle = '#cdb48c'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(bx - 5, -7); ctx.lineTo(bx + 6, -4); ctx.moveTo(bx - 5, -3); ctx.lineTo(bx + 6, -6); ctx.stroke();
    }
    ctx.translate(0, breath);
    ctx.fillStyle = '#6b4528';
    ctx.beginPath(); ctx.moveTo(-13, -60); ctx.quadraticCurveTo(-24, -34, -25, -10);
    for (let i = 0; i <= 8; i++) ctx.lineTo(-25 + i * 6.25, -10 + (i % 2 ? 4 : -1));
    ctx.quadraticCurveTo(24, -34, 13, -60); ctx.closePath(); ctx.fill();
    [['#7e8a94', -21, -30, 6, 7], ['#b79a6c', 13, -24, 6, 6], ['#a8432f', 16, -46, 4, 5], ['#53687a', -18, -18, 5, 5]]
      .forEach(([c, px, py, w, h]) => { ctx.fillStyle = c; ctx.fillRect(px, py, w, h); });
    ctx.fillStyle = '#b8652e';
    ctx.beginPath(); ctx.moveTo(-8, -50); ctx.lineTo(8, -50); ctx.lineTo(11, -14); ctx.lineTo(-11, -14); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e0b34a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, -46); ctx.lineTo(-3, -36); ctx.stroke();
    ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(3, -46); ctx.lineTo(5, -37); ctx.stroke();
    ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(9, -22, 4, 0, 7); ctx.stroke();
    ctx.strokeStyle = '#5e3d23'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-12, -54); ctx.quadraticCurveTo(-22, -46, -25, -42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, -54); ctx.quadraticCurveTo(18, -46, 19, -40); ctx.stroke();
    ctx.fillStyle = '#3a2a20'; ctx.beginPath(); ctx.arc(-25, -42, 3, 0, 7); ctx.arc(19.5, -39, 3, 0, 7); ctx.fill();
    ctx.strokeStyle = '#c9a25a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-5, -60); ctx.quadraticCurveTo(-4, -54, -1, -52); ctx.stroke();
    ctx.fillStyle = '#c9a25a'; ctx.beginPath(); ctx.arc(-1, -52, 3, 0, 7); ctx.fill();
    ctx.fillStyle = '#6b4528';
    ctx.beginPath(); ctx.moveTo(-12, -58); ctx.quadraticCurveTo(-14, -80, 0, -82); ctx.quadraticCurveTo(14, -80, 12, -58); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c98a62'; ctx.beginPath(); ctx.ellipse(0, -66, 6.5, 7.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#bdbab3'; ctx.beginPath(); ctx.moveTo(-7, -72); ctx.quadraticCurveTo(0, -77, 7, -72); ctx.lineTo(6, -70); ctx.quadraticCurveTo(0, -74, -6, -70); ctx.fill();
    ctx.fillStyle = '#2a1a12'; ctx.fillRect(-3.5, -68, 1.6, 1.2); ctx.fillRect(2, -68, 1.6, 1.2);
    ctx.strokeStyle = '#7a3f2a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, -64, 2.6, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.fillStyle = '#c7c3bb';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(8 + i * 0.6, -60 + i * 5, 2.6, 3, 0.3, 0, 7); ctx.fill(); }
    ctx.translate(-27, -34);
    ctx.fillStyle = '#b8902f'; ctx.fillRect(-5, -8, 10, 3); ctx.fillRect(-6, 7, 12, 3);
    ctx.shadowColor = '#ffb050'; ctx.shadowBlur = 16 * flick;
    ctx.fillStyle = `rgba(255,214,140,${flick})`; ctx.fillRect(-4, -5, 8, 12); ctx.shadowBlur = 0;
    ctx.restore();
  };

  // ---------------------------------------------------------------- machines
  SB.drawDrone = (x, y, dir, tint = '#4a4f55') => {
    ctx.save();
    ctx.strokeStyle = '#2b2e32'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 20, y - 10); ctx.lineTo(x + 20, y - 10); ctx.stroke();
    ctx.fillStyle = 'rgba(200,200,200,0.25)';
    const blur = Math.abs(Math.sin(t() * 0.9)) * 12 + 6;
    ctx.fillRect(x - 20 - blur / 2, y - 13, blur, 2); ctx.fillRect(x + 20 - blur / 2, y - 13, blur, 2);
    const g = ctx.createLinearGradient(0, y - 10, 0, y + 10);
    g.addColorStop(0, tint); g.addColorStop(1, '#25282c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, 19, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(176,100,58,0.6)'; ctx.fillRect(x - 12, y + 2, 7, 3);
    ctx.shadowColor = '#ff3b2f'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff4433'; ctx.beginPath(); ctx.arc(x + dir * 6, y, 3.6, 0, 7); ctx.fill();
    ctx.restore();
  };
  SB.drawHound = (x, y, w, dir, tt, hurt) => {
    const run = Math.sin(tt * (hurt ? 0 : 0.35));
    ctx.save(); ctx.translate(x + w / 2, y); ctx.scale(dir, 1);
    ctx.strokeStyle = '#2e2b29'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const [lx, ph] of [[-16, 0], [-8, Math.PI], [10, Math.PI], [17, 0]]) {
      ctx.beginPath(); ctx.moveTo(lx, 14); ctx.lineTo(lx + Math.sin(tt * 0.35 + ph) * 5 * (hurt ? 0 : 1), 30); ctx.stroke();
    }
    ctx.fillStyle = '#4a3a30'; roundRect(-24, 2, 44, 16, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(20,15,10,0.6)'; ctx.lineWidth = 1.5;
    for (let i = -16; i < 14; i += 6) { ctx.beginPath(); ctx.moveTo(i, 4); ctx.lineTo(i, 16); ctx.stroke(); }
    ctx.fillStyle = '#5b4637'; roundRect(16, -6 + run, 18, 14, 4); ctx.fill();
    ctx.fillStyle = '#3a2d25'; ctx.beginPath(); ctx.moveTo(20, -6 + run); ctx.lineTo(23, -13 + run); ctx.lineTo(26, -6 + run); ctx.fill();
    ctx.shadowColor = '#ff3b2f'; ctx.shadowBlur = 8; ctx.fillStyle = '#ff4433';
    ctx.beginPath(); ctx.arc(29, -1 + run, 2.2, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = '#2e2b29'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-24, 6); ctx.lineTo(-32, -2 + run * 2); ctx.stroke();
    ctx.restore();
  };
  SB.drawTurret = (x, y, w, h, dir, charge) => {
    ctx.save(); ctx.translate(x + w / 2, y + h);
    ctx.fillStyle = '#2c313a'; ctx.fillRect(-15, -12, 30, 12);
    ctx.fillStyle = '#3d4552'; roundRect(-12, -30, 24, 20, 5); ctx.fill();
    ctx.fillStyle = '#596377'; ctx.fillRect(dir > 0 ? 6 : -22, -24, 16, 6);
    ctx.shadowColor = '#4ad7ff'; ctx.shadowBlur = 8 + charge * 14;
    ctx.fillStyle = charge > 0.5 ? '#b8f2ff' : '#4ad7ff'; ctx.beginPath(); ctx.arc(dir * 2, -22, 3.5, 0, 7); ctx.fill();
    ctx.restore();
  };
  SB.drawPylon = (x, y, w, h, hp, max) => {
    ctx.save();
    ctx.fillStyle = '#2c313a'; ctx.fillRect(x, y + 10, w, h - 10);
    ctx.fillStyle = '#3d4552'; ctx.fillRect(x - 4, y + h - 8, w + 8, 8);
    ctx.strokeStyle = '#596377'; ctx.lineWidth = 1;
    for (let i = y + 18; i < y + h - 8; i += 10) { ctx.beginPath(); ctx.moveTo(x, i); ctx.lineTo(x + w, i); ctx.stroke(); }
    ctx.shadowColor = '#4ad7ff'; ctx.shadowBlur = 18;
    ctx.fillStyle = `rgba(110,220,255,${0.4 + 0.6 * (hp / max)})`; ctx.beginPath(); ctx.arc(x + w / 2, y + 6, 9, 0, 7); ctx.fill();
    ctx.restore();
  };
  SB.drawWarden = (x, y, B, tint = '#5a6067') => {
    ctx.save();
    if (B.inv > 0 && t() % 4 < 2) ctx.globalAlpha = 0.6;
    const tele = B.state === 'telegraph';
    ctx.translate(x + (tele ? SB.rand(-2, 2) : 0), y);
    ctx.strokeStyle = '#2a2d31'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-70, -26); ctx.lineTo(70, -26); ctx.stroke();
    const blur = B.state === 'stunned' ? 10 : Math.abs(Math.sin(t() * 0.8)) * 30 + 14;
    ctx.fillStyle = 'rgba(210,210,210,0.28)';
    ctx.fillRect(-70 - blur / 2, -31, blur, 3); ctx.fillRect(70 - blur / 2, -31, blur, 3);
    const g = ctx.createLinearGradient(0, -30, 0, 30);
    g.addColorStop(0, tint); g.addColorStop(1, '#22252a');
    ctx.fillStyle = g; roundRect(-48, -26, 96, 52, 16); ctx.fill();
    ctx.strokeStyle = '#15171a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(176,100,58,0.55)'; ctx.fillRect(-40, 8, 14, 6); ctx.fillRect(22, -18, 10, 5);
    ctx.fillStyle = '#c9c2b6'; ctx.font = `700 9px ${SB.MONO}`; ctx.textAlign = 'center'; ctx.fillText(B.tag || 'W-7', -26, -10);
    ctx.strokeStyle = '#2a2d31'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-28, 24); ctx.lineTo(-36, 40); ctx.moveTo(28, 24); ctx.lineTo(36, 40); ctx.stroke();
    const eyeC = B.state === 'stunned' ? '#6b3a33' : (tele ? '#ffe08a' : '#ff3b2f');
    ctx.shadowColor = eyeC; ctx.shadowBlur = tele ? 30 : 16;
    ctx.fillStyle = '#0c0d0f'; ctx.beginPath(); ctx.arc(8, 2, 14, 0, 7); ctx.fill();
    ctx.fillStyle = eyeC; ctx.beginPath(); ctx.arc(8, 2, tele ? 9 : 7, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
    if (B.state === 'stunned') dizzy(0, -44, 34);
    ctx.restore();
  };
  SB.drawCore = (x, y, B) => {
    ctx.save(); ctx.translate(x, y);
    if (B.inv > 0 && t() % 4 < 2) ctx.globalAlpha = 0.6;
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(110,220,255,${0.25 + i * 0.1})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, 0, 70 - i * 8, 18 + i * 6, t() * 0.01 * (i + 1) + i, 0, 7); ctx.stroke();
    }
    const g = ctx.createRadialGradient(-10, -10, 4, 0, 0, 44);
    g.addColorStop(0, '#5b6a88'); g.addColorStop(1, '#141824');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 42, 0, 7); ctx.fill();
    const open = B.state === 'exposed';
    ctx.shadowColor = open ? '#ff5a40' : '#4ad7ff'; ctx.shadowBlur = 26;
    ctx.fillStyle = open ? '#ff5a40' : '#4ad7ff'; ctx.beginPath(); ctx.arc(0, 0, open ? 16 : 11, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e9f8ff'; ctx.beginPath(); ctx.arc(-3, -3, 4, 0, 7); ctx.fill();
    if (B.shield) {
      ctx.strokeStyle = `rgba(140,230,255,${0.45 + Math.sin(t() * 0.1) * 0.15})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 58, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(110,220,255,0.08)'; ctx.fill();
    }
    if (B.state === 'exposed') dizzy(0, -54, 40);
    ctx.restore();
  };

  // ---------------------------------------------------------------- props & traps
  SB.drawMine = (x, y, m) => {
    if (m.buried && !m.revealed) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(x, y, 11, 2.5, 0, 0, 7); ctx.fill();
      return;
    }
    ctx.fillStyle = '#2a2b2d'; ctx.beginPath(); ctx.ellipse(x, y - 3, 12, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#4a4c50'; ctx.fillRect(x - 4, y - 9, 8, 4);
    const blink = m.timer > 0 ? (t() % 6 < 3) : (t() % 60 < 8);
    ctx.fillStyle = blink ? '#ff3b2f' : '#5a1a14';
    if (blink) { ctx.shadowColor = '#ff3b2f'; ctx.shadowBlur = 10; }
    ctx.beginPath(); ctx.arc(x, y - 10, 2.2, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    if (m.buried && m.revealed) { ctx.strokeStyle = 'rgba(255,90,64,0.6)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(x, y - 4, 18, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
  };
  SB.drawBarrel = (x, y) => {
    ctx.fillStyle = '#9a2f22'; roundRect(x - 12, y - 32, 24, 32, 4); ctx.fill();
    ctx.fillStyle = '#6e2018'; ctx.fillRect(x - 12, y - 24, 24, 3); ctx.fillRect(x - 12, y - 10, 24, 3);
    ctx.fillStyle = '#e8c27a'; ctx.beginPath(); ctx.moveTo(x, y - 21); ctx.lineTo(x + 5, y - 13); ctx.lineTo(x - 5, y - 13); ctx.fill();
    ctx.fillStyle = '#1a1412'; ctx.fillRect(x - 1, y - 19, 2, 3);
  };
  SB.drawTrip = (x, y, w, fired) => {
    ctx.fillStyle = '#3a3532'; ctx.fillRect(x - 2, y - 14, 4, 14); ctx.fillRect(x + w - 2, y - 14, 4, 14);
    if (!fired) {
      ctx.strokeStyle = `rgba(255,70,50,${0.35 + Math.sin(t() * 0.2) * 0.2})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + w, y - 10); ctx.stroke();
      ctx.fillStyle = '#7a2a20'; ctx.fillRect(x + w + 3, y - 12, 10, 12); // charge pack
    }
  };
  SB.drawBearTrap = (x, y, closed) => {
    ctx.strokeStyle = '#6b5a4a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y - 2, 14, 3, 0, 0, 7); ctx.stroke();
    ctx.fillStyle = '#8a7a6a';
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      if (closed) { ctx.moveTo(x + i * 4 - 2, y - 2); ctx.lineTo(x + i * 4, y - 12); ctx.lineTo(x + i * 4 + 2, y - 2); }
      else { ctx.moveTo(x + i * 4 - 2, y - 3); ctx.lineTo(x + i * 4, y - 8 - Math.abs(i)); ctx.lineTo(x + i * 4 + 2, y - 3); }
      ctx.fill();
    }
  };
  SB.drawIcicle = (x, y, len = 34) => {
    const g = ctx.createLinearGradient(x, y, x, y + len);
    g.addColorStop(0, 'rgba(220,240,255,0.95)'); g.addColorStop(1, 'rgba(160,210,240,0.7)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y); ctx.lineTo(x, y + len); ctx.fill();
  };
  SB.drawRock = (x, y, r, col = '#5a5550') => {
    ctx.fillStyle = col; ctx.beginPath();
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; ctx.lineTo(x + Math.cos(a) * r * (0.8 + (i % 2) * 0.25), y + Math.sin(a) * r * (0.8 + ((i + 1) % 2) * 0.2)); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, 7); ctx.fill();
  };
  SB.drawBomb = (x, y) => {
    ctx.fillStyle = '#1e1d1c'; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill();
    ctx.strokeStyle = '#8a7a6a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 3, y - 6); ctx.lineTo(x + 6, y - 10); ctx.stroke();
    ctx.fillStyle = t() % 4 < 2 ? '#ffd27a' : '#ff7b2f'; ctx.beginPath(); ctx.arc(x + 6, y - 11, 2, 0, 7); ctx.fill();
  };
  SB.drawFire = (fx, gy) => {
    ctx.save();
    const g = ctx.createRadialGradient(fx, gy - 14, 2, fx, gy - 14, 110);
    g.addColorStop(0, 'rgba(255,170,80,0.45)'); g.addColorStop(1, 'rgba(255,170,80,0)');
    ctx.fillStyle = g; ctx.fillRect(fx - 120, gy - 130, 240, 140);
    ctx.strokeStyle = '#2b211b'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(fx - 16, gy - 2); ctx.lineTo(fx + 16, gy - 8); ctx.moveTo(fx + 16, gy - 2); ctx.lineTo(fx - 16, gy - 8); ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const h = 22 + Math.sin(t() * 0.3 + i * 2) * 6;
      ctx.fillStyle = ['#ff7b2f', '#ffb347', '#ffe28a'][i];
      ctx.beginPath(); ctx.moveTo(fx - 10 + i * 3, gy - 6); ctx.quadraticCurveTo(fx + Math.sin(t() * 0.2 + i) * 4, gy - 6 - h * (1 - i * 0.25), fx + 10 - i * 3, gy - 6); ctx.fill();
    }
    ctx.restore();
  };
  SB.drawFlag = (x, gy, lit) => {
    ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x - 2, gy - 60, 4, 60);
    ctx.fillStyle = lit ? '#e8c27a' : '#5a5650';
    const w = Math.sin(t() * 0.1) * 3;
    ctx.beginPath(); ctx.moveTo(x + 2, gy - 60); ctx.lineTo(x + 26, gy - 52 + w); ctx.lineTo(x + 2, gy - 44); ctx.fill();
  };
  SB.drawLamp = (x, gy, lit, flicker = 0) => {
    ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x - 2, gy - 70, 4, 70);
    ctx.fillRect(x - 2, gy - 70, 16, 3);
    const on = lit && !(flicker && (SB.t % 97 < 6 || SB.t % 151 < 3));
    ctx.fillStyle = on ? '#fff0b8' : '#4a4740';
    if (on) { ctx.shadowColor = '#ffd27a'; ctx.shadowBlur = 16; }
    ctx.beginPath(); ctx.arc(x + 12, gy - 64, 4, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  };
  SB.drawBackpack = (x, y, glint) => {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#2f5a7a'; roundRect(-14, -30, 28, 30, 6); ctx.fill();
    ctx.fillStyle = '#244862'; roundRect(-10, -14, 20, 12, 3); ctx.fill();
    ctx.fillStyle = '#e8c27a'; ctx.fillRect(-6, -26, 12, 7);
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.ellipse(18, -4, 9, 4, 0, 0, 7); ctx.fill();
    ctx.restore();
    if (glint) { ctx.fillStyle = `rgba(232,194,122,${0.4 + Math.sin(t() * 0.08) * 0.3})`; ctx.beginPath(); ctx.arc(x, y - 44, 3, 0, 7); ctx.fill(); }
  };
  SB.drawTerminal = (x, gy, played) => {
    ctx.fillStyle = '#2c313a'; ctx.fillRect(x - 4, gy - 40, 8, 40);
    ctx.fillStyle = '#3d4552'; roundRect(x - 22, gy - 74, 44, 34, 4); ctx.fill();
    const on = !played || SB.t % 80 < 60;
    ctx.fillStyle = played ? '#1c3a44' : (on ? '#4ad7ff' : '#1c3a44');
    if (!played) { ctx.shadowColor = '#4ad7ff'; ctx.shadowBlur = 14; }
    ctx.fillRect(x - 18, gy - 70, 36, 26); ctx.shadowBlur = 0;
    ctx.fillStyle = '#0c1a20';
    for (let i = 0; i < 4; i++) ctx.fillRect(x - 15, gy - 66 + i * 6, 14 + ((i * 7) % 15), 2);
  };
  SB.drawSign = (x, gy, l1, l2, opts = {}) => {
    const w = opts.w || 190, h = 62;
    ctx.save();
    ctx.fillStyle = opts.post || '#3a2e26'; ctx.fillRect(x + 18, gy - 140, 8, 140); ctx.fillRect(x + w - 26, gy - 144, 8, 144);
    ctx.translate(x + w / 2, gy - 150); ctx.rotate(opts.tilt || -0.03);
    ctx.fillStyle = opts.bg || '#8c8a80'; roundRect(-w / 2, -h / 2, w, h, 4); ctx.fill();
    ctx.strokeStyle = opts.edge || '#3d5b7a'; ctx.lineWidth = 3; roundRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 3); ctx.stroke();
    ctx.fillStyle = opts.ink || '#2a2622'; ctx.textAlign = 'center';
    ctx.font = `700 17px ${SB.MONO}`; ctx.fillText(l1, 0, l2 ? -3 : 6);
    if (l2) { ctx.font = `700 15px ${SB.MONO}`; ctx.fillText(l2, 0, 17); }
    ctx.restore();
  };
  // Kevin's crayon breadcrumbs: "If I get lost, I'll leave drawings."
  SB.drawDoodle = (x, y, variant = 0) => {
    ctx.save(); ctx.translate(x, y); ctx.lineWidth = 2; ctx.lineCap = 'round';
    const c1 = ['#e8c27a', '#7fb3d5', '#e07a5f'][variant % 3], c2 = '#c0392b';
    ctx.strokeStyle = c1; ctx.strokeRect(0, 0, 18, 15);
    ctx.beginPath(); ctx.arc(6, 7, 1.6, 0, 7); ctx.arc(12, 7, 1.6, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(9, 15); ctx.lineTo(9, 30); ctx.moveTo(3, 20); ctx.lineTo(15, 20); ctx.moveTo(9, 30); ctx.lineTo(4, 38); ctx.moveTo(9, 30); ctx.lineTo(14, 38); ctx.stroke();
    ctx.strokeStyle = c2; // the boy holding hands with the robot
    ctx.beginPath(); ctx.arc(32, 6, 5, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(32, 11); ctx.lineTo(32, 28); ctx.moveTo(32, 18); ctx.lineTo(15, 20); ctx.moveTo(32, 28); ctx.lineTo(27, 38); ctx.moveTo(32, 28); ctx.lineTo(37, 38); ctx.stroke();
    ctx.fillStyle = c2; ctx.fillRect(27, -1, 10, 3);
    if (variant > 0) { ctx.strokeStyle = '#e8c27a'; ctx.beginPath(); ctx.moveTo(44, 30); ctx.lineTo(60, 30); ctx.lineTo(55, 25); ctx.moveTo(60, 30); ctx.lineTo(55, 35); ctx.stroke(); }
    ctx.restore();
  };
})();
