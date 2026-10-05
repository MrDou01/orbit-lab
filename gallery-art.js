const TAU = Math.PI * 2;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function ellipse(ctx, x, y, rx, ry, angle = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), angle, 0, TAU);
}

function drawTerrain(ctx, w, h, time) {
  ctx.fillStyle = '#101710';
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w * .62, h * .34, 0, w * .62, h * .34, w * .66);
  glow.addColorStop(0, 'rgba(152,180,85,.16)');
  glow.addColorStop(.5, 'rgba(54,71,30,.08)');
  glow.addColorStop(1, 'rgba(8,14,9,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(w * .51, h * .50);
  ctx.rotate(-.12);
  const phase = time * .13;
  for (let ring = 91; ring >= 0; ring--) {
    const p = ring / 91;
    const radius = (28 + p * 430) * w / 640;
    const rise = Math.pow(1 - p, 1.6) * h * .30;
    ctx.beginPath();
    const steps = 190;
    for (let s = 0; s <= steps; s++) {
      const a = s / steps * TAU;
      const ridge = 1 + .13 * Math.sin(a * 3 + p * 4 + .2 * Math.sin(phase)) + .09 * Math.cos(a * 5 - p * 2) + .035 * Math.sin(a * 8 + p * 9);
      const x = Math.cos(a) * radius * ridge;
      const y = Math.sin(a) * radius * .42 * ridge - rise + .018 * h * Math.cos(a * 2 + p * 12 + phase);
      if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const major = ring % 6 === 0;
    ctx.lineWidth = major ? 1.05 : .60;
    ctx.strokeStyle = `rgba(${major ? '202,231,151' : '171,201,125'},${.12 + (1 - p) * .46})`;
    ctx.stroke();
  }
  ctx.restore();
  // Instrument-like edge markings stay understated beneath the topology.
  ctx.strokeStyle = 'rgba(206,223,170,.16)';
  ctx.lineWidth = .65;
  for (let j = 0; j < 23; j++) {
    const y = h * (.13 + j * .032);
    ctx.beginPath();
    ctx.moveTo(w * .055, y);
    ctx.lineTo(w * .055 + (j % 5 === 0 ? 8 : 4), y);
    ctx.stroke();
  }
  const vignette = ctx.createRadialGradient(w * .5, h * .48, h * .12, w * .5, h * .48, w * .73);
  vignette.addColorStop(0, 'rgba(4,9,5,0)');
  vignette.addColorStop(1, 'rgba(4,9,5,.72)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function orbitPath(ctx, cx, cy, rx, ry, rotation, start, end) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rotation, start, end);
}

function drawOrbit(ctx, w, h, time, stars) {
  ctx.fillStyle = '#111315';
  ctx.fillRect(0, 0, w, h);
  const cx = w * .51, cy = h * .51, unit = Math.min(w, h);
  const fog = ctx.createRadialGradient(cx, cy, 0, cx, cy, unit * .7);
  fog.addColorStop(0, '#2a2d2d');
  fog.addColorStop(.54, '#1b1f20');
  fog.addColorStop(1, '#111315');
  ctx.fillStyle = fog;
  ctx.fillRect(0, 0, w, h);
  for (const star of stars) {
    ctx.fillStyle = `rgba(205,216,211,${star.a * .68})`;
    ctx.fillRect(star.x * w, star.y * h, star.r, star.r);
  }

  const rotation = -.52 + Math.sin(time * .1) * .025;
  const radius = unit * .238;
  const rings = [1.31, 1.43, 1.68, 1.74, 2.07, 2.15, 2.32];
  const ringStroke = ctx.createLinearGradient(cx - unit * .55, cy - unit * .1, cx + unit * .53, cy + unit * .1);
  ringStroke.addColorStop(0, 'rgba(123,135,134,.1)');
  ringStroke.addColorStop(.26, 'rgba(212,222,216,.57)');
  ringStroke.addColorStop(.48, 'rgba(224,233,225,.90)');
  ringStroke.addColorStop(.65, 'rgba(111,124,120,.42)');
  ringStroke.addColorStop(1, 'rgba(239,247,234,.66)');
  // Far half of the orbital rings is obscured by the central sphere.
  for (let i = 0; i < rings.length; i++) {
    orbitPath(ctx, cx, cy, radius * rings[i], radius * rings[i] * .36, rotation, Math.PI, TAU);
    ctx.strokeStyle = ringStroke;
    ctx.lineWidth = i === 2 ? 1.35 : .7;
    ctx.stroke();
  }
  const atmosphere = ctx.createRadialGradient(cx - radius * .36, cy - radius * .39, radius * .3, cx, cy, radius * 1.1);
  atmosphere.addColorStop(0, 'rgba(171,190,176,0)');
  atmosphere.addColorStop(.83, 'rgba(171,190,176,0)');
  atmosphere.addColorStop(.93, 'rgba(154,183,162,.13)');
  atmosphere.addColorStop(1, 'rgba(154,183,162,0)');
  ctx.fillStyle = atmosphere;
  ellipse(ctx, cx, cy, radius * 1.1, radius * 1.1);
  ctx.fill();
  const planet = ctx.createRadialGradient(cx - radius * .6, cy - radius * .65, 0, cx - radius * .12, cy - radius * .08, radius * 1.24);
  planet.addColorStop(0, '#86918a');
  planet.addColorStop(.23, '#59625f');
  planet.addColorStop(.49, '#2b3331');
  planet.addColorStop(.75, '#101716');
  planet.addColorStop(1, '#090d0d');
  ctx.fillStyle = planet;
  ellipse(ctx, cx, cy, radius, radius);
  ctx.fill();
  ctx.save();
  ellipse(ctx, cx, cy, radius - .3, radius - .3);
  ctx.clip();
  // Very fine meridians make the sphere feel engineered rather than flat.
  ctx.strokeStyle = 'rgba(197,218,200,.055)';
  ctx.lineWidth = .6;
  for (let i = -15; i <= 15; i++) {
    const y = i / 16 * radius;
    const rw = Math.sqrt(radius * radius - y * y);
    orbitPath(ctx, cx, cy + y, rw, rw * .16, -.17, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
  for (let i = 0; i < rings.length; i++) {
    orbitPath(ctx, cx, cy, radius * rings[i], radius * rings[i] * .36, rotation, 0, Math.PI);
    ctx.strokeStyle = ringStroke;
    ctx.lineWidth = i === 2 ? 1.5 : .7;
    ctx.stroke();
  }

  const minorRotation = .79;
  orbitPath(ctx, cx, cy, radius * 1.87, radius * .36, minorRotation, 0, TAU);
  ctx.strokeStyle = 'rgba(182,205,152,.35)';
  ctx.lineWidth = .8;
  ctx.stroke();
  const a = time * .07 + 3.7;
  const px = Math.cos(a) * radius * 1.87, py = Math.sin(a) * radius * .36;
  const sx = cx + px * Math.cos(minorRotation) - py * Math.sin(minorRotation);
  const sy = cy + px * Math.sin(minorRotation) + py * Math.cos(minorRotation);
  const beacon = ctx.createRadialGradient(sx, sy, 0, sx, sy, 12);
  beacon.addColorStop(0, 'rgba(220,247,154,.9)');
  beacon.addColorStop(.17, 'rgba(220,247,154,.7)');
  beacon.addColorStop(1, 'rgba(220,247,154,0)');
  ctx.fillStyle = beacon;
  ctx.fillRect(sx - 12, sy - 12, 24, 24);
  ctx.fillStyle = '#e0f9b1';
  ellipse(ctx, sx, sy, 2, 2);
  ctx.fill();
}

function drawWave(ctx, w, h, time) {
  ctx.fillStyle = '#e4e5db';
  ctx.fillRect(0, 0, w, h);
  const paper = ctx.createLinearGradient(0, 0, w, h);
  paper.addColorStop(0, '#eff0e8');
  paper.addColorStop(.51, '#e3e5da');
  paper.addColorStop(1, '#d1d6ca');
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w * .50, h * .46);
  ctx.rotate(-.15);
  const waveTime = time * .19;
  // A continuous band of vibrating filaments, each with its own phase.
  for (let stripe = 0; stripe < 113; stripe++) {
    const v = stripe / 112;
    const xBase = (v - .5) * w * 1.1;
    const envelope = Math.sin(v * Math.PI);
    ctx.beginPath();
    for (let step = 0; step <= 144; step++) {
      const u = step / 144;
      const yBase = (u - .5) * h * .94;
      const edge = Math.pow(Math.sin(u * Math.PI), 1.12);
      const pulse = Math.sin(v * TAU * 1.65 - u * TAU * .68 + waveTime);
      const x = xBase + pulse * edge * w * .084 + Math.cos(u * TAU + v * 3) * envelope * w * .028;
      const y = yBase + Math.sin(v * TAU * 1.40 + u * 2.8 + .4 * Math.sin(waveTime)) * envelope * h * .21 * edge;
      if (step === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(29,39,30,${.47 + .35 * envelope})`;
    ctx.lineWidth = .7 + Math.pow(envelope, .6) * 1.15;
    ctx.stroke();
  }
  ctx.restore();
  // Thin registration strokes echo an experimental print.
  ctx.strokeStyle = 'rgba(28,41,29,.24)';
  ctx.lineWidth = .7;
  for (const [x, y] of [[.055,.12],[.945,.12],[.055,.87],[.945,.87]]) {
    ctx.beginPath();
    ctx.moveTo(w * x - 4, h * y); ctx.lineTo(w * x + 4, h * y);
    ctx.moveTo(w * x, h * y - 4); ctx.lineTo(w * x, h * y + 4);
    ctx.stroke();
  }
}

export function initGalleryArt({ reducedMotion = false } = {}) {
  const canvases = [...document.querySelectorAll('canvas[data-art]')];
  const random = seededRandom(713);
  const stars = Array.from({ length: 105 }, () => ({ x: random(), y: random(), a: random() * .7 + .1, r: random() > .92 ? 1.3 : .6 }));
  let playing = true;
  let alive = true;
  let raf = 0;
  let lastFrame = -1000;
  let elapsed = 0;
  let lastTick = 0;
  const items = canvases.map(canvas => ({ canvas, ctx: canvas.getContext('2d', { alpha: false }), kind: canvas.dataset.art, visible: true, width: 0, height: 0, dpr: 1, grain: null }));

  function resize(item) {
    const rect = item.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const dpr = clamp(window.devicePixelRatio || 1, 1, 1.5);
    if (width === item.width && height === item.height && dpr === item.dpr) return;
    item.width = width; item.height = height; item.dpr = dpr;
    item.canvas.width = Math.round(width * dpr);
    item.canvas.height = Math.round(height * dpr);
    const grainCanvas = document.createElement('canvas');
    grainCanvas.width = 192;
    grainCanvas.height = 192;
    const grainCtx = grainCanvas.getContext('2d');
    const pixels = grainCtx.createImageData(192, 192);
    const noise = seededRandom(519);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const value = noise() > .5 ? 255 : 0;
      pixels.data[i] = value; pixels.data[i + 1] = value; pixels.data[i + 2] = value;
      pixels.data[i + 3] = Math.floor(noise() * (item.kind === 'wave' ? 14 : 21));
    }
    grainCtx.putImageData(pixels, 0, 0);
    item.grain = item.ctx.createPattern(grainCanvas, 'repeat');
    draw(item);
  }

  function draw(item) {
    const { ctx, width: w, height: h, dpr } = item;
    if (!ctx || !w || !h) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (item.kind === 'terrain') drawTerrain(ctx, w, h, elapsed);
    else if (item.kind === 'orbit') drawOrbit(ctx, w, h, elapsed, stars);
    else drawWave(ctx, w, h, elapsed);
    if (item.grain) {
      ctx.fillStyle = item.grain;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function tick(now) {
    if (!alive) return;
    raf = 0;
    if (!playing || reducedMotion || document.hidden) { lastTick = 0; return; }
    if (lastTick) elapsed += Math.min((now - lastTick) / 1000, .08);
    lastTick = now;
    if (now - lastFrame >= 1000 / 30) {
      for (const item of items) if (item.visible) draw(item);
      lastFrame = now;
    }
    if (items.some(item => item.visible)) raf = requestAnimationFrame(tick);
    else lastTick = 0;
  }

  function start() {
    if (alive && !raf && playing && !reducedMotion && !document.hidden) raf = requestAnimationFrame(tick);
  }

  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(entries => {
    for (const entry of entries) {
      const item = items.find(candidate => candidate.canvas === entry.target);
      if (item) resize(item);
    }
  }) : null;
  const intersectionObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      const item = items.find(candidate => candidate.canvas === entry.target);
      if (item) item.visible = entry.isIntersecting;
    }
    start();
  }, { rootMargin: '80px' }) : null;
  for (const item of items) {
    if (!item.ctx) continue;
    resize(item);
    resizeObserver?.observe(item.canvas);
    intersectionObserver?.observe(item.canvas);
  }
  const onResize = () => { for (const item of items) resize(item); };
  const onVisibility = () => { lastTick = 0; start(); };
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  start();
  return {
    setPlaying(value) {
      playing = Boolean(value);
      if (!playing && raf) { cancelAnimationFrame(raf); raf = 0; lastTick = 0; }
      start();
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    }
  };
}
