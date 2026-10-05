// Sadbot's Journey To Bliss — world rendering: biomes, parallax scenery, terrain, water, caves,
// decor, weather and cave lighting.
(() => {
  'use strict';
  const SB = window.SB;
  const { W, H, GY } = SB;
  const ctx = SB.ctx;
  const { clamp, lerp, rand, mulberry32, mix } = SB;
  const t = () => SB.t || 0;

  // ---------------------------------------------------------------- biome palettes
  const BIOMES = {
    city: { sky: [['#26282d', '#5d5a57', '#9b9184'], ['#2e2834', '#8a6a55', '#e0a565']], sun: 1,
      far: { type: 'city', c: ['#4b4b4f', '#5f4f4a'], par: 0.15, base: 380 }, mid: { type: 'city', c: ['#2f3034', '#3a2f2c'], par: 0.45, base: 470, detail: 1 },
      ground: 'asphalt', water: '#2e3a33', musicRate: 1 },
    flood: { sky: [['#14181d', '#2c333b', '#48515a'], ['#161b21', '#353c44', '#5a636b']],
      far: { type: 'city', c: ['#283038', '#2c3138'], par: 0.15, base: 405, short: 1 }, mid: { type: 'overpass', c: ['#1d2228', '#20252b'], par: 0.45, base: 470 },
      ground: 'asphalt', water: '#334139', waterTop: '#62756a', musicRate: 0.95 },
    tunnel: { wall: '#1b1917',
      far: { type: 'arches', c: ['#141211', '#141211'], par: 0.3, base: 470 }, mid: { type: 'tiles', c: ['#262321', '#262321'], par: 0.65, base: 470 },
      ground: 'rails', water: '#18221d', waterTop: '#33473d', musicRate: 0.88 },
    desert: { sky: [['#d0915a', '#ecbe86', '#f6dcae'], ['#c27a48', '#e6ab74', '#f0cc98']], sun: 1, hot: 1,
      far: { type: 'mesa', c: ['#c08055', '#b8774e'], par: 0.12, base: 395 }, mid: { type: 'dunes', c: ['#d49a62', '#c98d58'], par: 0.4, base: 470 },
      ground: 'sand', water: '#5d7f6a', musicRate: 1.02 },
    forest: { sky: [['#25322b', '#4b5e50', '#80917c'], ['#222e28', '#475749', '#7a8b76']],
      far: { type: 'trees', c: ['#34433a', '#30403a'], par: 0.15, base: 430 }, mid: { type: 'trunks', c: ['#1d2621', '#1b241f'], par: 0.5, base: 470 },
      ground: 'dirt', water: '#2f4f55', waterTop: '#6a9a9a', musicRate: 0.97 },
    mountain: { sky: [['#4b5b74', '#8fa2b8', '#dce4ec'], ['#3c4a60', '#8093aa', '#d2dbe6']],
      far: { type: 'peaks', c: ['#7b8ca4', '#71829b'], par: 0.1, base: 410 }, mid: { type: 'pines', c: ['#2d3b43', '#2a373f'], par: 0.4, base: 470 },
      ground: 'snow', water: '#4e7690', waterTop: '#cfe8f5', musicRate: 0.93 },
    campus: { sky: [['#05080f', '#10172c', '#271f40'], ['#070a14', '#141c34', '#30254a']], aurora: 1,
      far: { type: 'towers', c: ['#141a29', '#141a29'], par: 0.15, base: 430 }, mid: { type: 'servers', c: ['#0e121b', '#0e121b'], par: 0.45, base: 470 },
      ground: 'metal', water: '#10202a', musicRate: 1.04 },
  };
  SB.BIOMES = BIOMES;

  // ---------------------------------------------------------------- scenery generation
  function shapes(layer, seed, length) {
    const r = mulberry32(seed), out = [];
    const step = { city: [50, 130], overpass: [240, 300], arches: [200, 240], tiles: [160, 220], mesa: [160, 340], dunes: [180, 320], trees: [40, 90], trunks: [70, 160], peaks: [140, 260], pines: [26, 60], towers: [70, 140], servers: [90, 170] }[layer.type] || [80, 160];
    for (let x = -150; x < length;) {
      const w = lerp(step[0], step[1], r());
      out.push({ x, w, h: r(), a: r(), b: r(), c: r(), seed: Math.floor(r() * 1e6) });
      x += w + (layer.type === 'city' ? lerp(4, 30, r()) : layer.type === 'pines' ? lerp(-10, 30, r()) : lerp(0, 40, r()));
    }
    return out;
  }
  SB.World = {};
  SB.World.prepare = (L) => {
    const B = BIOMES[L.def.biome];
    L.biome = B;
    L.farShapes = shapes(B.far, L.def.seed || 7, L.worldW * B.far.par + W + 300);
    L.midShapes = shapes(B.mid, (L.def.seed || 7) + 13, L.worldW * B.mid.par + W + 300);
    L.ash = Array.from({ length: 90 }, () => ({ x: rand(0, W), y: rand(0, H), s: rand(1, 2.6), v: rand(0.2, 0.6), d: rand(-0.3, 0.1), k: Math.random() }));
  };

  function drawLayer(L, layer, list, p, camX) {
    const col = mix(layer.c[0], layer.c[1], p);
    const off = camX * layer.par;
    ctx.fillStyle = col;
    for (const s of list) {
      const x = s.x - off;
      if (x + s.w < -60 || x > W + 60) continue;
      const base = layer.base;
      switch (layer.type) {
        case 'city': {
          const h = layer.short ? 80 + s.h * 150 : 90 + s.h * (layer.detail ? 210 : 170) + (layer.detail ? 30 : 0);
          const top = base - h;
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.moveTo(x, base);
          if (s.a < 0.45) { const rr = mulberry32(s.seed); ctx.lineTo(x, top + 10); for (let i = 1; i <= 5; i++) ctx.lineTo(x + (s.w * i) / 5, top + rr() * 40 * (i % 2 ? 1 : 0.3) + s.b * 20); }
          else { ctx.lineTo(x, top); ctx.lineTo(x + s.w, top); }
          ctx.lineTo(x + s.w, base); ctx.closePath(); ctx.fill();
          if (layer.detail) {
            const rr = mulberry32(s.seed + 3);
            ctx.fillStyle = 'rgba(10,10,12,0.55)';
            for (let wy = top + 30; wy < base - 20; wy += 22) for (let wx = x + 8; wx < x + s.w - 12; wx += 16) if (rr() < 0.6) ctx.fillRect(wx, wy, 7, 10);
            if (s.c < 0.08) { ctx.fillStyle = 'rgba(255,170,90,0.35)'; ctx.fillRect(x + 12, top + 56, 7, 10); }
            if (s.c > 0.88) {
              ctx.fillStyle = '#16181b'; ctx.fillRect(x + 6, top + 18, s.w - 12, 34);
              ctx.strokeStyle = 'rgba(200,210,220,0.25)'; ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(x + 20, top + 18); ctx.lineTo(x + 34, top + 40); ctx.lineTo(x + 28, top + 52); ctx.stroke();
            }
          }
          if (layer.short) { ctx.fillStyle = 'rgba(70,90,85,0.35)'; ctx.fillRect(x, base - 26, s.w, 26); }
          break;
        }
        case 'overpass': {
          ctx.fillStyle = col;
          ctx.fillRect(x + s.w / 2 - 16, 300, 32, base - 300);
          if (s.a > 0.3) { ctx.fillRect(x - 10, 286, s.w + 20, 18); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x - 10, 300, s.w + 20, 4); }
          else { ctx.beginPath(); ctx.moveTo(x - 10, 286); ctx.lineTo(x + s.w * 0.4, 286); ctx.lineTo(x + s.w * 0.3, 320); ctx.lineTo(x - 10, 304); ctx.fill(); }
          if (s.b > 0.6) { ctx.fillStyle = '#2f5a3a'; ctx.fillRect(x + 20, 240, 80, 30); ctx.fillStyle = 'rgba(230,230,220,0.5)'; ctx.fillRect(x + 28, 250, 50, 3); ctx.fillRect(x + 28, 258, 34, 3); ctx.fillStyle = col; ctx.fillRect(x + 56, 270, 4, 16); }
          break;
        }
        case 'arches': {
          ctx.fillStyle = col;
          ctx.fillRect(x, 0, 30, base);
          ctx.beginPath(); ctx.moveTo(x + 30, 180); ctx.quadraticCurveTo(x + s.w / 2 + 15, 90, x + s.w, 180); ctx.lineTo(x + s.w, 0); ctx.lineTo(x + 30, 0); ctx.fill();
          break;
        }
        case 'tiles': {
          ctx.fillStyle = col; ctx.fillRect(x, 250, s.w, base - 250);
          ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
          for (let yy = 262; yy < base; yy += 14) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + s.w, yy); ctx.stroke(); }
          for (let xx = x; xx < x + s.w; xx += 22) { ctx.beginPath(); ctx.moveTo(xx, 250); ctx.lineTo(xx, base); ctx.stroke(); }
          ctx.fillStyle = '#7a2f26'; ctx.fillRect(x, 300, s.w, 6);
          if (s.a > 0.55) { ctx.fillStyle = '#3c3a36'; ctx.fillRect(x + 30, 320, 70, 46); ctx.fillStyle = s.b > 0.5 ? '#6a4a3a' : '#3a4a5a'; ctx.fillRect(x + 34, 324, 62, 38); ctx.fillStyle = 'rgba(230,220,200,0.3)'; ctx.fillRect(x + 40, 332, 40, 4); ctx.fillRect(x + 40, 342, 28, 3); }
          if (s.c > 0.7) { ctx.fillStyle = '#d9d2c5'; ctx.font = `700 13px ${SB.MONO}`; ctx.textAlign = 'left'; ctx.fillText(['CENTRAL', 'HARBOR', 'EAST LINE', 'NO EXIT'][s.seed % 4], x + 20, 292); ctx.fillStyle = '#d9d2c5'; ctx.fillRect(x + 18, 280, 0, 0); }
          break;
        }
        case 'mesa': {
          const h = 60 + s.h * 120, top = base - h;
          ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x + s.w * 0.15, top); ctx.lineTo(x + s.w * 0.8, top + s.a * 10); ctx.lineTo(x + s.w, base); ctx.fill();
          ctx.fillStyle = 'rgba(120,60,40,0.18)'; ctx.fillRect(x + s.w * 0.2, top + 20, s.w * 0.55, 6);
          break;
        }
        case 'dunes': {
          ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, base);
          for (let i = 0; i <= 12; i++) { const xx = x + (s.w * i) / 12; ctx.lineTo(xx, base - 40 - Math.sin((i / 12) * Math.PI) * (40 + s.h * 70)); }
          ctx.lineTo(x + s.w, base); ctx.fill();
          if (s.a > 0.7) { // buried skyscraper poking out of the sand
            ctx.fillStyle = 'rgba(90,70,60,0.55)'; ctx.save(); ctx.translate(x + s.w / 2, base - 60); ctx.rotate(-0.12);
            ctx.fillRect(-18, -90, 36, 100); ctx.fillStyle = 'rgba(30,25,22,0.5)'; for (let i = 0; i < 4; i++) ctx.fillRect(-12, -80 + i * 20, 24, 8); ctx.restore();
          }
          break;
        }
        case 'trees': {
          ctx.fillStyle = col; ctx.fillRect(x + s.w / 2 - 3, base - 90, 6, 90);
          ctx.beginPath(); ctx.arc(x + s.w / 2, base - 100 - s.h * 40, 24 + s.h * 18, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.arc(x + s.w / 2 - 14, base - 80 - s.h * 30, 18, 0, 7); ctx.fill();
          break;
        }
        case 'trunks': {
          ctx.fillStyle = col; const tw = 16 + s.h * 26;
          ctx.fillRect(x + s.w / 2 - tw / 2, 0, tw, base);
          ctx.beginPath(); ctx.arc(x + s.w / 2, 30 + s.a * 40, 60 + s.b * 30, 0, 7); ctx.fill();
          if (s.c > 0.6) { ctx.fillRect(x + s.w / 2, 200 + s.a * 60, 60, 6); }
          break;
        }
        case 'peaks': {
          const h = 140 + s.h * 160, top = base - h, px = x + s.w * (0.35 + s.a * 0.3);
          ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 40, base); ctx.lineTo(px, top); ctx.lineTo(x + s.w + 40, base); ctx.fill();
          ctx.fillStyle = 'rgba(240,246,252,0.85)'; ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px - 30, top + 46); ctx.lineTo(px - 10, top + 38); ctx.lineTo(px + 4, top + 52); ctx.lineTo(px + 34, top + 40); ctx.fill();
          break;
        }
        case 'pines': {
          const h = 70 + s.h * 110, cx = x + s.w / 2;
          ctx.fillStyle = col;
          for (let k = 0; k < 3; k++) { const yy = base - h + k * h * 0.28; ctx.beginPath(); ctx.moveTo(cx, yy - 10); ctx.lineTo(cx - 14 - k * 8, yy + h * 0.35); ctx.lineTo(cx + 14 + k * 8, yy + h * 0.35); ctx.fill(); }
          ctx.fillStyle = 'rgba(235,242,248,0.6)'; ctx.beginPath(); ctx.moveTo(cx, base - h - 10); ctx.lineTo(cx - 7, base - h + 6); ctx.lineTo(cx + 7, base - h + 6); ctx.fill();
          break;
        }
        case 'towers': {
          const h = 160 + s.h * 220, top = base - h;
          ctx.fillStyle = col; ctx.fillRect(x, top, s.w, h);
          const rr = mulberry32(s.seed);
          for (let wy = top + 12; wy < base - 10; wy += 14) for (let wx = x + 6; wx < x + s.w - 8; wx += 12) {
            const v = rr(); if (v < 0.2) { ctx.fillStyle = v < 0.06 ? 'rgba(255,200,120,0.5)' : 'rgba(80,190,255,0.45)'; ctx.fillRect(wx, wy, 6, 5); }
          }
          if (s.a > 0.82) { ctx.fillStyle = 'rgba(120,220,255,0.75)'; ctx.font = `700 ${Math.min(22, s.w / 4)}px ${SB.MONO}`; ctx.textAlign = 'center'; ctx.fillText('HELIX', x + s.w / 2, top + 30); }
          ctx.fillStyle = col;
          break;
        }
        case 'servers': {
          const h = 70 + s.h * 60, top = base - h;
          ctx.fillStyle = col; ctx.fillRect(x, top, s.w, h);
          for (let i = 0; i < 6; i++) { const on = (t() + i * 13 + s.seed) % 90 < 45; ctx.fillStyle = on ? 'rgba(80,220,140,0.8)' : 'rgba(80,220,140,0.15)'; ctx.fillRect(x + 10 + i * 12, top + 14, 4, 3); }
          ctx.fillStyle = col;
          break;
        }
        default: break;
      }
    }
  }

  // ---------------------------------------------------------------- sky / background
  SB.World.drawBack = (L, camX) => {
    const B = L.biome;
    const p = clamp(camX / Math.max(1, L.worldW - W), 0, 1);
    if (B.wall) { ctx.fillStyle = B.wall; ctx.fillRect(0, 0, W, H); }
    else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, mix(B.sky[0][0], B.sky[1][0], p));
      g.addColorStop(0.55, mix(B.sky[0][1], B.sky[1][1], p));
      g.addColorStop(0.85, mix(B.sky[0][2], B.sky[1][2], p));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (B.sun) {
        const sunX = 720 - p * 220, sunY = B.hot ? 150 : 260 - p * 40;
        const sg = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, B.hot ? 200 : 140);
        sg.addColorStop(0, `rgba(255,240,210,${B.hot ? 0.9 : 0.55 + p * 0.3})`); sg.addColorStop(0.2, 'rgba(255,220,170,0.3)'); sg.addColorStop(1, 'rgba(255,220,170,0)');
        ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
      }
      if (B.aurora) {
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = `rgba(${i === 1 ? '120,255,190' : '110,200,255'},${0.12 + i * 0.03})`; ctx.lineWidth = 26 - i * 6;
          ctx.beginPath();
          for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 90 + i * 30 + Math.sin(x * 0.006 + t() * 0.006 + i) * 30);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        const r = mulberry32(5); for (let i = 0; i < 70; i++) ctx.fillRect(r() * W, r() * 260, 1.2, 1.2);
      }
      if (L.weather && L.weather.flash > 0) { ctx.fillStyle = `rgba(220,230,255,${L.weather.flash * 0.5})`; ctx.fillRect(0, 0, W, H); }
    }
    drawLayer(L, B.far, L.farShapes, p, camX);
    drawLayer(L, B.mid, L.midShapes, p, camX);
    if (L.weather) L.weather.drawBack();
    // cave back walls (partial caves inside outdoor stages)
    for (const c of L.caves) {
      if (B.wall) continue;
      const x0 = c.x0 - camX, x1 = c.x1 - camX;
      if (x1 < 0 || x0 > W) continue;
      const g = ctx.createLinearGradient(0, c.ceil, 0, GY);
      g.addColorStop(0, '#1d1a18'); g.addColorStop(1, '#2a2522');
      ctx.fillStyle = g; ctx.fillRect(x0, c.ceil, x1 - x0, H - c.ceil);
      const rr = mulberry32(c.x0);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let i = 0; i < (c.x1 - c.x0) / 40; i++) ctx.beginPath(), ctx.ellipse(x0 + rr() * (x1 - x0), c.ceil + 30 + rr() * (GY - c.ceil - 40), 10 + rr() * 20, 6 + rr() * 10, 0, 0, 7), ctx.fill();
    }
    return p;
  };

  // ---------------------------------------------------------------- terrain
  SB.World.drawChasm = () => {
    const pit = ctx.createLinearGradient(0, 300, 0, H);
    pit.addColorStop(0, '#141210'); pit.addColorStop(1, '#030303');
    ctx.fillStyle = pit; ctx.fillRect(0, 330, W, H - 330);
  };
  SB.World.drawGround = (L, g, camX) => {
    const x = g.x - camX;
    if (x > W || x + g.w < 0) return;
    const style = L.biome.ground;
    const fill = { asphalt: '#2a2827', rails: '#24211f', sand: '#d9a86e', dirt: '#33291f', snow: '#56595e', metal: '#22262e' }[style];
    const top = { asphalt: '#45403b', rails: '#3a3632', sand: '#ecc58e', dirt: '#4b6b36', snow: '#eef3f7', metal: '#3c4452' }[style];
    ctx.fillStyle = fill; ctx.fillRect(x, g.y, g.w, H - g.y);
    ctx.fillStyle = top; ctx.fillRect(x, g.y, g.w, style === 'snow' ? 10 : 6);
    const start = Math.max(g.x, Math.floor(camX / 90) * 90), end = Math.min(g.x + g.w, camX + W + 90);
    if (style === 'asphalt') {
      ctx.fillStyle = '#1d1c1b'; ctx.fillRect(x, g.y + 6, g.w, 3);
      ctx.strokeStyle = 'rgba(15,15,15,0.7)'; ctx.lineWidth = 1.5;
      for (let wx = start; wx < end; wx += 90) {
        const r = mulberry32(wx), cx = wx - camX + r() * 40;
        ctx.beginPath(); ctx.moveTo(cx, g.y + 3); ctx.lineTo(cx + 10, g.y + 18); ctx.lineTo(cx + 4, g.y + 34); ctx.stroke();
        if (r() < 0.5) { ctx.strokeStyle = 'rgba(90,110,60,0.9)'; ctx.beginPath(); ctx.moveTo(cx + 30, g.y); ctx.lineTo(cx + 27, g.y - 8); ctx.moveTo(cx + 32, g.y); ctx.lineTo(cx + 35, g.y - 10); ctx.stroke(); ctx.strokeStyle = 'rgba(15,15,15,0.7)'; }
      }
      ctx.fillStyle = 'rgba(200,190,150,0.25)';
      for (let wx = Math.max(g.x + 20, Math.floor(camX / 140) * 140); wx < Math.min(g.x + g.w - 40, camX + W); wx += 140) ctx.fillRect(wx - camX, g.y + 40, 50, 4);
    } else if (style === 'rails') {
      ctx.fillStyle = '#3d2f25'; for (let wx = Math.max(g.x, Math.floor(camX / 30) * 30); wx < end; wx += 30) ctx.fillRect(wx - camX, g.y + 18, 18, 6);
      ctx.fillStyle = '#6a6e72'; ctx.fillRect(x, g.y + 16, g.w, 3); ctx.fillRect(x, g.y + 30, g.w, 3);
    } else if (style === 'sand') {
      ctx.strokeStyle = 'rgba(160,110,60,0.35)'; ctx.lineWidth = 1.5;
      for (let wx = start; wx < end; wx += 90) { const cx = wx - camX; ctx.beginPath(); ctx.moveTo(cx, g.y + 20); ctx.quadraticCurveTo(cx + 22, g.y + 14, cx + 45, g.y + 20); ctx.quadraticCurveTo(cx + 67, g.y + 26, cx + 90, g.y + 20); ctx.stroke(); }
    } else if (style === 'dirt') {
      ctx.fillStyle = '#3a5a2c';
      for (let wx = start; wx < end; wx += 18) { const r = mulberry32(wx); ctx.fillRect(wx - camX, g.y - 3 - r() * 5, 2, 8); }
      ctx.strokeStyle = 'rgba(80,55,35,0.8)'; ctx.lineWidth = 2;
      for (let wx = start; wx < end; wx += 90) { const cx = wx - camX + 20; ctx.beginPath(); ctx.moveTo(cx, g.y + 8); ctx.quadraticCurveTo(cx + 15, g.y + 30, cx + 5, g.y + 50); ctx.stroke(); }
    } else if (style === 'snow') {
      ctx.fillStyle = '#d4e2ec'; ctx.fillRect(x, g.y + 10, g.w, 3);
      ctx.fillStyle = '#6a6e74'; for (let wx = start; wx < end; wx += 90) { const r = mulberry32(wx); ctx.beginPath(); ctx.ellipse(wx - camX + r() * 60, g.y + 40 + r() * 30, 14, 8, 0, 0, 7); ctx.fill(); }
      if (L.def.slippery) { ctx.fillStyle = 'rgba(200,230,250,0.35)'; ctx.fillRect(x, g.y, g.w, 3); }
    } else if (style === 'metal') {
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
      for (let wx = Math.max(g.x, Math.floor(camX / 60) * 60); wx < end; wx += 60) { ctx.beginPath(); ctx.moveTo(wx - camX, g.y + 6); ctx.lineTo(wx - camX, H); ctx.stroke(); }
      ctx.fillStyle = `rgba(74,215,255,${0.25 + Math.sin(t() * 0.05) * 0.1})`; ctx.fillRect(x, g.y + 8, g.w, 2);
    }
    // quicksand
    for (const q of (g.quick || [])) {
      const qx = q[0] - camX, qw = q[1] - q[0];
      ctx.fillStyle = '#b58652'; ctx.fillRect(qx, g.y, qw, 18);
      ctx.strokeStyle = 'rgba(90,60,30,0.5)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(qx + qw / 2, g.y + 6, (qw / 2) * (((t() * 0.01 + i / 3) % 1)), 3, 0, 0, 7); ctx.stroke(); }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    if (g.x > 0) ctx.fillRect(x, g.y, 4, H - g.y);
    if (g.x + g.w < L.worldW) ctx.fillRect(x + g.w - 4, g.y, 4, H - g.y);
  };
  SB.World.drawPlat = (L, p, camX) => {
    const x = p.x - camX;
    if (x > W + 20 || x + p.w < -20) return;
    ctx.save();
    if (p.crumble && p.timer > 0 && !p.fall) ctx.translate(rand(-1.2, 1.2), 0);
    if (p.fall) ctx.globalAlpha = clamp(1 - p.fall / 40, 0, 1);
    const below = L.gyAt(p.x + p.w / 2);
    switch (p.kind) {
      case 'car': {
        const bodyTop = p.y + 14, bottom = below !== null ? below : p.y + 48;
        ctx.fillStyle = p.color || '#4a3328'; roundRect(x, bodyTop, p.w, bottom - bodyTop - 6, 6); ctx.fill();
        ctx.fillStyle = p.color2 || '#5c3b2a';
        ctx.beginPath(); ctx.moveTo(x + 18, bodyTop); ctx.lineTo(x + 32, p.y); ctx.lineTo(x + p.w - 30, p.y); ctx.lineTo(x + p.w - 12, bodyTop); ctx.fill();
        ctx.fillStyle = '#17191b'; ctx.fillRect(x + 36, p.y + 3, (p.w - 72) / 2 - 3, 10); ctx.fillRect(x + p.w / 2 + 2, p.y + 3, (p.w - 72) / 2 - 3, 10);
        ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(x + 24, bottom - 6, 9, 0, 7); ctx.arc(x + p.w - 24, bottom - 6, 9, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(176,100,58,0.6)'; ctx.fillRect(x + 8, bodyTop + 8, 20, 6);
        break;
      }
      case 'roof': // floating car roof in flood water
        ctx.fillStyle = p.color || '#7a2f26'; roundRect(x, p.y, p.w, 12, 5); ctx.fill();
        ctx.fillStyle = '#17191b'; ctx.fillRect(x + 10, p.y + 3, p.w - 20, 4);
        break;
      case 'slab':
        ctx.fillStyle = '#6b6862'; ctx.fillRect(x, p.y, p.w, 14);
        ctx.fillStyle = '#4c4945'; ctx.fillRect(x, p.y + 10, p.w, 4);
        ctx.strokeStyle = '#7a5038'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + p.w - 4, p.y + 6); ctx.lineTo(x + p.w + 8, p.y + 2); ctx.moveTo(x + 4, p.y + 8); ctx.lineTo(x - 6, p.y + 14); ctx.stroke();
        break;
      case 'beam':
        if (below !== null && !p.move) { ctx.fillStyle = '#3e3c39'; ctx.fillRect(x + p.w / 2 - 9, p.y + 14, 18, below - p.y - 14); }
        ctx.fillStyle = '#56595c'; ctx.fillRect(x, p.y, p.w, 14);
        ctx.fillStyle = '#3c3f42'; ctx.fillRect(x, p.y + 4, p.w, 6);
        ctx.fillStyle = '#7d8185'; for (let i = x + 8; i < x + p.w - 4; i += 18) ctx.fillRect(i, p.y + 2, 2, 2);
        break;
      case 'log':
        ctx.fillStyle = '#5a3d26'; roundRect(x, p.y, p.w, 14, 7); ctx.fill();
        ctx.strokeStyle = '#3e2a1a'; ctx.lineWidth = 1.5; for (let i = x + 10; i < x + p.w - 6; i += 16) { ctx.beginPath(); ctx.moveTo(i, p.y + 3); ctx.lineTo(i + 8, p.y + 3); ctx.stroke(); }
        ctx.fillStyle = '#8a6440'; ctx.beginPath(); ctx.ellipse(x + p.w - 3, p.y + 7, 3, 6, 0, 0, 7); ctx.fill();
        break;
      case 'branch':
        ctx.strokeStyle = '#4a3322'; ctx.lineWidth = 10; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, p.y + 6); ctx.lineTo(x + p.w, p.y + 7); ctx.stroke();
        ctx.fillStyle = 'rgba(70,100,50,0.9)'; ctx.beginPath(); ctx.arc(x + p.w * 0.7, p.y - 4, 12, 0, 7); ctx.arc(x + p.w * 0.3, p.y - 2, 9, 0, 7); ctx.fill();
        break;
      case 'rock':
        ctx.fillStyle = L.biome.ground === 'sand' ? '#b0744a' : '#6a6560';
        ctx.beginPath(); ctx.moveTo(x, p.y + 14); ctx.lineTo(x + 6, p.y); ctx.lineTo(x + p.w - 8, p.y); ctx.lineTo(x + p.w, p.y + 16); ctx.lineTo(x + p.w * 0.6, p.y + 28); ctx.lineTo(x + p.w * 0.2, p.y + 24); ctx.fill();
        ctx.fillStyle = L.biome.ground === 'snow' ? '#eef3f7' : 'rgba(255,255,255,0.12)'; ctx.fillRect(x + 4, p.y, p.w - 10, 4);
        break;
      case 'ice':
        ctx.fillStyle = 'rgba(190,225,245,0.92)'; roundRect(x, p.y, p.w, 14, 4); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x + 6, p.y + 2, p.w - 20, 2);
        break;
      case 'crate':
        ctx.fillStyle = '#7a5a36'; ctx.fillRect(x, p.y, p.w, (below !== null ? below : p.y + 40) - p.y);
        ctx.strokeStyle = '#4e3a22'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, p.y + 1, p.w - 2, (below !== null ? below : p.y + 40) - p.y - 2);
        ctx.beginPath(); ctx.moveTo(x, p.y); ctx.lineTo(x + p.w, (below !== null ? below : p.y + 40)); ctx.stroke();
        break;
      case 'metal':
        ctx.fillStyle = '#3c4452'; ctx.fillRect(x, p.y, p.w, 10);
        ctx.strokeStyle = '#596377'; ctx.lineWidth = 1; for (let i = x + 6; i < x + p.w; i += 10) { ctx.beginPath(); ctx.moveTo(i, p.y + 2); ctx.lineTo(i - 4, p.y + 9); ctx.stroke(); }
        ctx.fillStyle = `rgba(74,215,255,${0.4 + Math.sin(t() * 0.08) * 0.2})`; ctx.fillRect(x, p.y + 10, p.w, 2);
        break;
      default:
        ctx.fillStyle = '#6b6862'; ctx.fillRect(x, p.y, p.w, 14);
    }
    if (p.crumble && !p.fall) { ctx.strokeStyle = 'rgba(20,15,10,0.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + p.w * 0.3, p.y); ctx.lineTo(x + p.w * 0.4, p.y + 8); ctx.lineTo(x + p.w * 0.35, p.y + 13); ctx.moveTo(x + p.w * 0.7, p.y); ctx.lineTo(x + p.w * 0.62, p.y + 10); ctx.stroke(); }
    ctx.restore();
  };
  const roundRect = (...a) => SB.roundRect(...a);
  SB.World.drawWater = (L, camX) => {
    for (const w of L.water) {
      const x0 = w.x0 - camX, x1 = w.x1 - camX;
      if (x1 < 0 || x0 > W) continue;
      ctx.fillStyle = L.biome.water || '#2e3a33'; ctx.globalAlpha = 0.86;
      ctx.fillRect(x0, w.y, x1 - x0, H - w.y);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = L.biome.waterTop || '#6a7a72'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = Math.max(x0, 0); x <= Math.min(x1, W); x += 8) ctx.lineTo(x, w.y + Math.sin((x + camX) * 0.05 + t() * 0.08) * 2.5);
      ctx.stroke();
      if (L.def.flow) { // current streaks
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) { const xx = x0 + ((i * 97 + t() * 1.5 * L.def.flow) % Math.max(1, x1 - x0)); ctx.beginPath(); ctx.moveTo(xx, w.y + 14 + (i % 4) * 14); ctx.lineTo(xx + 18, w.y + 14 + (i % 4) * 14); ctx.stroke(); }
      }
    }
  };
  SB.World.drawCeilings = (L, camX) => {
    for (const c of L.caves) {
      const x0 = c.x0 - camX, x1 = c.x1 - camX;
      if (x1 < 0 || x0 > W) continue;
      const col = L.biome.ground === 'snow' ? '#5c6a78' : L.biome.wall ? '#141210' : '#24201d';
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(Math.max(-20, x0), 0);
      const sx = Math.max(x0, -40), ex = Math.min(x1, W + 40);
      for (let x = sx; x <= ex; x += 20) { const r = mulberry32(Math.floor(x + camX)); ctx.lineTo(x, c.ceil + r() * 14 - (r() < 0.15 ? -16 : 0)); }
      ctx.lineTo(ex, 0); ctx.closePath(); ctx.fill();
      if (L.biome.ground === 'snow') { ctx.fillStyle = 'rgba(200,230,250,0.5)'; ctx.fillRect(Math.max(x0, 0), c.ceil - 4, Math.min(x1, W) - Math.max(x0, 0), 3); }
      if (L.biome.wall) { ctx.strokeStyle = '#3a3632'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(Math.max(x0, 0), c.ceil - 30); ctx.lineTo(Math.min(x1, W), c.ceil - 30); ctx.stroke(); }
    }
  };

  // ---------------------------------------------------------------- decor (static set dressing)
  SB.World.drawDecor = (L, camX) => {
    for (const d of L.def.decor || []) {
      const [type, wx] = d;
      const x = wx - camX;
      if (x < -1300 || x > W + 300) continue;
      const gy = L.gyAt(wx) ?? GY;
      switch (type) {
        case 'house':
          ctx.fillStyle = '#3a3634'; ctx.fillRect(x, 250, 260, gy - 250);
          ctx.fillStyle = '#2a2624'; ctx.beginPath(); ctx.moveTo(x - 10, 252); ctx.lineTo(x + 120, 170); ctx.lineTo(x + 200, 215); ctx.lineTo(x + 215, 200); ctx.lineTo(x + 270, 252); ctx.fill();
          ctx.fillStyle = '#121212'; ctx.fillRect(x + 150, 290, 60, 50);
          ctx.strokeStyle = '#6d6a64'; ctx.lineWidth = 3; ctx.strokeRect(x + 150, 290, 60, 50);
          ctx.fillStyle = 'rgba(232,194,122,0.85)'; ctx.font = `600 italic 15px ${SB.DISPLAY}`; ctx.textAlign = 'left'; ctx.fillText('the Reyes house', x + 30, 380);
          ctx.fillStyle = '#121212'; ctx.fillRect(x + 40, 390, 46, gy - 390);
          break;
        case 'lamppost':
          ctx.fillStyle = '#2c2c2e'; ctx.fillRect(x - 3, 356, 6, gy - 356); ctx.fillRect(x - 3, 356, 34, 5);
          ctx.fillStyle = '#4a4a46'; ctx.fillRect(x + 22, 360, 14, 6);
          break;
        case 'sign': SB.drawSign(x, gy, d[2], d[3], d[4] || {}); break;
        case 'school': {
          ctx.save();
          ctx.fillStyle = '#4a3a33'; ctx.fillRect(x, 190, 1120, gy - 190);
          ctx.fillStyle = '#3b2e29'; ctx.fillRect(x - 10, 180, 1140, 16);
          ctx.fillStyle = '#5b4740';
          for (let y = 200; y < gy; y += 14) for (let xx = (y / 14) % 2 ? 0 : 20; xx < 1120; xx += 40) ctx.fillRect(x + xx, y, 30, 2);
          for (let i = 0; i < 9; i++) {
            const wx2 = x + 60 + i * 115;
            if (i === 6) continue;
            for (const wy of [220, 320]) {
              ctx.fillStyle = '#16181a'; ctx.fillRect(wx2, wy, 64, 70);
              ctx.strokeStyle = '#6a7378'; ctx.lineWidth = 3; ctx.strokeRect(wx2, wy, 64, 70);
              ctx.beginPath(); ctx.moveTo(wx2 + 32, wy); ctx.lineTo(wx2 + 32, wy + 70); ctx.moveTo(wx2, wy + 35); ctx.lineTo(wx2 + 64, wy + 35); ctx.stroke();
            }
          }
          ctx.fillStyle = '#1a1412'; ctx.fillRect(x + 780, 340, 80, gy - 340);
          ctx.strokeStyle = '#6a5145'; ctx.lineWidth = 4; ctx.strokeRect(x + 780, 340, 80, gy - 340);
          SB.drawDoodle(x + 890, 380, 0); SB.drawDoodle(x + 960, 372, 1);
          ctx.strokeStyle = 'rgba(70,95,50,0.8)'; ctx.lineWidth = 3;
          for (let i = 0; i < 6; i++) { const vx = x + 40 + i * 190; ctx.beginPath(); ctx.moveTo(vx, 190); ctx.quadraticCurveTo(vx + 20, 260, vx - 6, 340); ctx.stroke(); }
          ctx.restore();
          break;
        }
        case 'bus': // half-sunk city bus
          ctx.save(); ctx.translate(x, gy); ctx.rotate(-0.06);
          ctx.fillStyle = '#c9a23a'; roundRect(0, -70, 220, 70, 8); ctx.fill();
          ctx.fillStyle = '#1c2228'; for (let i = 0; i < 6; i++) ctx.fillRect(14 + i * 34, -60, 26, 22);
          ctx.fillStyle = 'rgba(176,100,58,0.6)'; ctx.fillRect(10, -20, 60, 8);
          ctx.fillStyle = '#2a2a2a'; ctx.font = `700 12px ${SB.MONO}`; ctx.textAlign = 'left'; ctx.fillText('14  HARBOR', 20, -28);
          ctx.restore();
          break;
        case 'ferry':
          ctx.save(); ctx.translate(x, gy + 6);
          ctx.fillStyle = '#e9e1d3'; ctx.beginPath(); ctx.moveTo(-20, -40); ctx.lineTo(240, -40); ctx.lineTo(220, 0); ctx.lineTo(0, 0); ctx.fill();
          ctx.fillStyle = '#2f5a7a'; ctx.fillRect(-14, -18, 248, 6);
          ctx.fillStyle = '#d9d2c5'; ctx.fillRect(30, -86, 150, 46);
          ctx.fillStyle = '#1c2228'; for (let i = 0; i < 5; i++) ctx.fillRect(40 + i * 28, -78, 20, 18);
          ctx.fillStyle = '#c0392b'; ctx.font = `700 13px ${SB.MONO}`; ctx.textAlign = 'center'; ctx.fillText('WATER BUS 3', 105, -50);
          ctx.restore();
          break;
        case 'station': // metro entrance
          ctx.fillStyle = '#3a3634'; ctx.fillRect(x, gy - 120, 150, 120);
          ctx.fillStyle = '#121212'; ctx.fillRect(x + 30, gy - 90, 90, 90);
          ctx.fillStyle = '#2f5a7a'; ctx.fillRect(x, gy - 150, 150, 30);
          ctx.fillStyle = '#e9e1d3'; ctx.font = `700 16px ${SB.MONO}`; ctx.textAlign = 'center'; ctx.fillText('METRO', x + 75, gy - 129);
          break;
        case 'tent':
          ctx.fillStyle = '#b8864e'; ctx.beginPath(); ctx.moveTo(x - 70, gy); ctx.lineTo(x, gy - 90); ctx.lineTo(x + 70, gy); ctx.fill();
          ctx.fillStyle = '#7a3b2a'; ctx.beginPath(); ctx.moveTo(x - 18, gy); ctx.lineTo(x, gy - 50); ctx.lineTo(x + 18, gy); ctx.fill();
          ctx.strokeStyle = '#3f6d8a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 50, gy - 30); ctx.lineTo(x + 50, gy - 30); ctx.stroke();
          break;
        case 'plane': // crashed airliner half in the sand
          ctx.save(); ctx.translate(x, gy); ctx.rotate(0.08);
          ctx.fillStyle = '#b9b4ab'; roundRect(0, -60, 320, 54, 26); ctx.fill();
          ctx.fillStyle = '#9a958c'; ctx.beginPath(); ctx.moveTo(120, -20); ctx.lineTo(240, 10); ctx.lineTo(200, 10); ctx.fill();
          ctx.fillStyle = '#2c3138'; for (let i = 0; i < 9; i++) ctx.fillRect(40 + i * 28, -46, 12, 10);
          ctx.fillStyle = '#c0392b'; ctx.fillRect(10, -40, 300, 4);
          ctx.restore();
          ctx.fillStyle = '#d9a86e'; ctx.beginPath(); ctx.ellipse(x + 40, gy, 90, 18, 0, Math.PI, 0); ctx.fill();
          break;
        case 'hatch':
          ctx.fillStyle = '#5a5e62'; roundRect(x - 30, gy - 10, 60, 12, 3); ctx.fill();
          ctx.fillStyle = '#c9a23a'; for (let i = 0; i < 4; i++) ctx.fillRect(x - 26 + i * 15, gy - 9, 7, 3);
          break;
        case 'ranger':
          ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x, gy - 110, 180, 110);
          ctx.fillStyle = '#2f2418'; ctx.beginPath(); ctx.moveTo(x - 14, gy - 108); ctx.lineTo(x + 90, gy - 160); ctx.lineTo(x + 194, gy - 108); ctx.fill();
          ctx.fillStyle = '#ffcf8a'; ctx.globalAlpha = 0.7; ctx.fillRect(x + 24, gy - 80, 40, 30); ctx.globalAlpha = 1;
          ctx.fillStyle = '#d9d2c5'; ctx.font = `700 12px ${SB.MONO}`; ctx.textAlign = 'center'; ctx.fillText('RANGER STATION', x + 90, gy - 118);
          break;
        case 'hut':
          ctx.fillStyle = '#5a4433'; ctx.fillRect(x, gy - 100, 170, 100);
          ctx.fillStyle = '#eef3f7'; ctx.beginPath(); ctx.moveTo(x - 16, gy - 96); ctx.lineTo(x + 85, gy - 150); ctx.lineTo(x + 186, gy - 96); ctx.fill();
          ctx.fillStyle = '#ffcf8a'; ctx.globalAlpha = 0.8; ctx.fillRect(x + 110, gy - 70, 36, 28); ctx.globalAlpha = 1;
          ctx.fillStyle = '#2a1f18'; ctx.fillRect(x + 30, gy - 64, 40, 64);
          ctx.fillStyle = 'rgba(200,200,200,0.4)'; ctx.beginPath(); ctx.arc(x + 140, gy - 160 - (t() % 60) * 0.5, 8, 0, 7); ctx.fill();
          break;
        case 'doodle': SB.drawDoodle(x, d[2], d[3] || 0); break;
        case 'cactus':
          ctx.fillStyle = '#5f7a4a'; roundRect(x - 7, gy - 70, 14, 70, 7); ctx.fill();
          roundRect(x - 24, gy - 50, 10, 26, 5); ctx.fill(); ctx.fillRect(x - 20, gy - 30, 14, 8);
          roundRect(x + 14, gy - 60, 10, 30, 5); ctx.fill(); ctx.fillRect(x + 6, gy - 36, 12, 8);
          break;
        case 'bones':
          ctx.strokeStyle = '#e8e2d8'; ctx.lineWidth = 3;
          for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x + i * 10, gy - 4, 10, Math.PI, Math.PI * 1.7); ctx.stroke(); }
          break;
        case 'bigtree':
          ctx.fillStyle = '#2e241b'; ctx.fillRect(x - 14, 150, 28, gy - 150);
          ctx.fillStyle = '#26352a'; ctx.beginPath(); ctx.arc(x, 150, 80, 0, 7); ctx.arc(x - 60, 190, 50, 0, 7); ctx.arc(x + 60, 190, 55, 0, 7); ctx.fill();
          break;
        case 'gate': // campus security gate frame
          ctx.fillStyle = '#2c313a'; ctx.fillRect(x - 8, 250, 16, gy - 250); ctx.fillRect(x - 8, 250, 200, 14);
          ctx.fillStyle = 'rgba(74,215,255,0.8)'; ctx.font = `700 14px ${SB.MONO}`; ctx.textAlign = 'left'; ctx.fillText('HELIX DYNAMICS · AUTHORIZED ONLY', x + 14, 244);
          break;
        case 'rooftopdoor':
          ctx.fillStyle = '#2c313a'; ctx.fillRect(x, gy - 130, 110, 130);
          ctx.fillStyle = '#ffcf8a'; ctx.globalAlpha = 0.25 + Math.sin(t() * 0.05) * 0.1; ctx.fillRect(x + 25, gy - 100, 60, 100); ctx.globalAlpha = 1;
          ctx.fillStyle = '#e9e1d3'; ctx.font = `700 12px ${SB.MONO}`; ctx.textAlign = 'center'; ctx.fillText('ROOF GARDEN', x + 55, gy - 110);
          break;
        default: break;
      }
    }
  };

  // ---------------------------------------------------------------- weather
  // def: { type, wind:{dir,str,period,dur}, haze, rain }
  SB.World.makeWeather = (def) => {
    const W8 = { type: def.type, wind: 0, gust: 0, flash: 0, def };
    const N = { storm: 260, sand: 220, fog: 120, snow: 200, ash: 90, drip: 30, motes: 60 }[def.type] || 0;
    const parts = Array.from({ length: N }, () => ({ x: rand(0, W), y: rand(0, H), v: rand(0.5, 1), s: rand(1, 3), k: Math.random() }));
    let lastGust = false;
    W8.update = (time) => {
      const w = def.wind;
      if (w) {
        const c = time % w.period, start = w.period - w.dur;
        let g = 0;
        if (c >= start) { const k = c - start; g = Math.min(1, k / 40, (w.dur - k) / 40); }
        W8.gust = g; W8.wind = w.dir * w.str * g;
        const on = g > 0.05;
        if (on && !lastGust) SB.SFX.wind();
        lastGust = on;
      }
      if (W8.flash > 0) W8.flash = Math.max(0, W8.flash - 0.04);
      if (def.type === 'storm' && Math.random() < 0.003) { W8.flash = 0.6; SB.SFX.thunder(); }
      const windPx = W8.wind * 4;
      for (const p of parts) {
        switch (def.type) {
          case 'storm': p.y += 16 * p.v; p.x += -3 + windPx; break;
          case 'sand': p.x += (6 + 10 * W8.gust) * (def.wind ? def.wind.dir : 1) * p.v; p.y += Math.sin((time + p.k * 100) * 0.05) * 0.6; break;
          case 'snow': p.y += 1.2 * p.v + 0.3; p.x += Math.sin((time + p.k * 200) * 0.02) * 0.6 + windPx * 1.5; break;
          case 'fog': p.y += 9 * p.v; p.x += -1; break;
          case 'ash': p.y += 0.5 * p.v; p.x += Math.sin((time + p.y) * 0.01) * 0.2 - 0.1; break;
          case 'drip': p.y += 5 * p.v; break;
          case 'motes': p.y -= 0.3 * p.v; p.x += Math.sin((time + p.k * 50) * 0.02) * 0.3; break;
          default: break;
        }
        if (p.y > H) { p.y = -10; p.x = rand(0, W); }
        if (p.y < -12) { p.y = H; p.x = rand(0, W); }
        if (p.x > W + 10) p.x = -10; if (p.x < -10) p.x = W + 10;
      }
    };
    W8.drawBack = () => {
      if (def.type === 'fog') {
        for (let i = 0; i < 3; i++) {
          const y = 300 + i * 50, off = ((SB.t * (0.2 + i * 0.1)) % (W * 2));
          const g = ctx.createLinearGradient(0, y - 40, 0, y + 40);
          g.addColorStop(0, 'rgba(210,220,215,0)'); g.addColorStop(0.5, `rgba(210,220,215,${0.16 - i * 0.03})`); g.addColorStop(1, 'rgba(210,220,215,0)');
          ctx.fillStyle = g; ctx.fillRect(-off, y - 40, W * 3, 80);
        }
      }
    };
    W8.drawFront = () => {
      switch (def.type) {
        case 'storm':
          ctx.strokeStyle = 'rgba(190,205,220,0.38)'; ctx.lineWidth = 1;
          ctx.beginPath(); for (const p of parts) { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 3 + W8.wind * 4, p.y + 14); } ctx.stroke();
          break;
        case 'fog':
          ctx.strokeStyle = 'rgba(200,215,210,0.25)'; ctx.lineWidth = 1;
          ctx.beginPath(); for (const p of parts) { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 1, p.y + 9); } ctx.stroke();
          ctx.fillStyle = 'rgba(200,210,205,0.12)'; ctx.fillRect(0, 0, W, H);
          break;
        case 'sand':
          ctx.fillStyle = 'rgba(230,190,130,0.6)';
          for (const p of parts) ctx.fillRect(p.x, p.y, p.s * 3, p.s * 0.8);
          ctx.fillStyle = `rgba(214,160,96,${(def.haze || 0.12) + W8.gust * 0.38})`; ctx.fillRect(0, 0, W, H);
          break;
        case 'snow':
          ctx.fillStyle = 'rgba(245,250,255,0.85)';
          for (const p of parts) { ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 0.9, 0, 7); ctx.fill(); }
          ctx.fillStyle = `rgba(230,240,250,${(def.haze || 0.06) + W8.gust * 0.35})`; ctx.fillRect(0, 0, W, H);
          break;
        case 'ash':
          ctx.fillStyle = 'rgba(220,215,205,0.55)';
          for (const p of parts) ctx.fillRect(p.x, p.y, p.s, p.s);
          break;
        case 'drip':
          ctx.fillStyle = 'rgba(150,190,200,0.5)';
          for (const p of parts) ctx.fillRect(p.x, p.y, 1.2, 5);
          break;
        case 'motes':
          for (const p of parts) { ctx.fillStyle = `rgba(110,220,255,${0.25 + p.k * 0.4})`; ctx.fillRect(p.x, p.y, 2, 2); }
          break;
        default: break;
      }
      if (W8.flash > 0) { ctx.fillStyle = `rgba(230,240,255,${W8.flash * 0.35})`; ctx.fillRect(0, 0, W, H); }
    };
    return W8;
  };

  // ---------------------------------------------------------------- cave darkness
  // lights: [{x (screen), y, r, a}]
  SB.World.drawDarkness = (L, camX, lights) => {
    const zones = L.caves.filter((c) => c.dark && c.x1 - camX > 0 && c.x0 - camX < W);
    if (!zones.length) return;
    const l = SB.lctx;
    l.setTransform(1, 0, 0, 1, 0, 0);
    l.globalCompositeOperation = 'source-over';
    l.clearRect(0, 0, W, H);
    for (const c of zones) {
      const x0 = c.x0 - camX, x1 = c.x1 - camX, fe = 90;
      const g = l.createLinearGradient(x0, 0, x1, 0);
      const span = Math.max(1, x1 - x0), f = Math.min(0.45, fe / span);
      const a = c.dark;
      g.addColorStop(0, 'rgba(3,3,6,0)'); g.addColorStop(f, `rgba(3,3,6,${a})`); g.addColorStop(1 - f, `rgba(3,3,6,${a})`); g.addColorStop(1, 'rgba(3,3,6,0)');
      l.fillStyle = (c.x0 <= 0 && c.x1 >= L.worldW) ? `rgba(3,3,6,${a})` : g;
      l.fillRect(Math.max(0, x0), 0, Math.min(W, x1) - Math.max(0, x0), H);
    }
    l.globalCompositeOperation = 'destination-out';
    for (const li of lights) {
      if (li.x < -li.r || li.x > W + li.r) continue;
      const g = l.createRadialGradient(li.x, li.y, 0, li.x, li.y, li.r);
      g.addColorStop(0, `rgba(0,0,0,${li.a || 1})`); g.addColorStop(0.6, `rgba(0,0,0,${(li.a || 1) * 0.65})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      l.fillStyle = g; l.fillRect(li.x - li.r, li.y - li.r, li.r * 2, li.r * 2);
      if (li.cone) { // flashlight cone
        l.save(); l.translate(li.x, li.y); l.scale(li.cone, 1);
        const cg = l.createRadialGradient(0, 0, 10, 0, 0, 260);
        cg.addColorStop(0, 'rgba(0,0,0,0.9)'); cg.addColorStop(1, 'rgba(0,0,0,0)');
        l.fillStyle = cg; l.beginPath(); l.moveTo(0, 0); l.lineTo(260, -70); l.lineTo(260, 70); l.closePath(); l.fill();
        l.restore();
      }
    }
    l.globalCompositeOperation = 'source-over';
    ctx.drawImage(SB.light, 0, 0, W, H);
  };
})();
