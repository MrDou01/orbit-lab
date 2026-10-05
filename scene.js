import * as THREE from './vendor/three.module.min.js';

/** A small, self-contained studio. No models, textures, or render services required. */
export function createSculpture(canvas, { onReady = () => {}, onError = () => {}, reducedMotion = false } = {}) {
  const noop = { setMode() {}, setPlaying() {}, setExploded() {}, reset() {}, destroy() {} };
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (error) {
    onError(error);
    return noop;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 80);
  camera.position.set(0, 0.05, 8.1);
  const artwork = new THREE.Group();
  artwork.rotation.set(-0.2, -0.48, 0.08);
  scene.add(artwork);

  // A procedural studio panorama creates long, crisp reflections on the metal.
  const studio = document.createElement('canvas');
  studio.width = 1024;
  studio.height = 512;
  const ctx = studio.getContext('2d');
  const base = ctx.createLinearGradient(0, 0, 0, 512);
  base.addColorStop(0, '#626c80');
  base.addColorStop(0.33, '#151b27');
  base.addColorStop(0.5, '#080a10');
  base.addColorStop(0.76, '#536176');
  base.addColorStop(1, '#141820');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 512);
  const softbox = (x, y, w, h, color) => {
    ctx.shadowBlur = 26;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.shadowBlur = 0;
  };
  softbox(70, 35, 140, 255, '#ffffff');
  softbox(405, 100, 36, 325, '#dce8ff');
  softbox(675, 12, 210, 125, '#ffffff');
  softbox(855, 265, 50, 130, '#c3f975');
  softbox(250, 365, 280, 28, '#7ea3e8');
  const panorama = new THREE.CanvasTexture(studio);
  panorama.mapping = THREE.EquirectangularReflectionMapping;
  panorama.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromEquirectangular(panorama);
  scene.environment = environment.texture;
  panorama.dispose();
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xdde8ff, 0x202323, 1.2));
  const addLight = (color, intensity, x, y, z) => {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(x, y, z);
    scene.add(light);
  };
  addLight(0xffffff, 4.3, -3, 5, 5);
  addLight(0xb1ccff, 3, 4, 0, 2);
  addLight(0xdbff92, 2, 0, -3, -2);
  const chrome = new THREE.MeshPhysicalMaterial({
    color: 0xd6deeb, metalness: 1, roughness: 0.19,
    clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.6,
    iridescence: 0.18, iridescenceIOR: 1.3, iridescenceThicknessRange: [120, 330],
  });
  const darkChrome = new THREE.MeshPhysicalMaterial({
    color: 0xa3b0c4, metalness: 1, roughness: 0.23, envMapIntensity: 1.8,
    clearcoat: 1, clearcoatRoughness: 0.12,
  });
  const lime = new THREE.MeshBasicMaterial({ color: 0xd6ff9c });
  const white = new THREE.MeshBasicMaterial({ color: 0xdae5ff });
  const modes = [new THREE.Group(), new THREE.Group(), new THREE.Group()];
  modes.forEach(group => artwork.add(group));
  modes[1].visible = modes[2].visible = false;

  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.08, 0.325, 280, 40, 2, 3), chrome);
  knot.rotation.set(0.16, -0.2, 0.15);
  modes[0].add(knot);
  const segments = [];
  const getKnotPoint = t => {
    const angle = t * Math.PI * 4;
    const r = 1.08 * (2 + Math.cos(1.5 * angle)) * 0.5;
    return new THREE.Vector3(r * Math.cos(angle), r * Math.sin(angle), 1.08 * Math.sin(1.5 * angle) * 0.5);
  };
  for (let i = 0; i < 8; i++) {
    const curve = new THREE.Curve();
    curve.getPoint = t => getKnotPoint((i + t * 0.975) / 8);
    const segment = new THREE.Mesh(new THREE.TubeGeometry(curve, 42, 0.325, 32, false), chrome);
    segment.rotation.copy(knot.rotation);
    segment.visible = false;
    const center = getKnotPoint((i + 0.5) / 8).normalize();
    segments.push({ mesh: segment, direction: center, index: i });
    modes[0].add(segment);
  }

  // Orbital mode: three broad, solid ribbons around a polished central body.
  const haloRings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.47 + i * 0.13, 0.095 - i * 0.013, 24, 180), i === 1 ? darkChrome : chrome);
    ring.rotation.set(i * 0.76 + 0.2, i * 0.88, i * 0.36);
    haloRings.push({ mesh: ring, rotation: ring.rotation.clone() });
    modes[1].add(ring);
  }
  const nucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 5), chrome);
  modes[1].add(nucleus);
  const haloNodes = [];
  for (let i = 0; i < 6; i++) {
    const node = new THREE.Mesh(new THREE.SphereGeometry(i % 2 === 0 ? 0.095 : 0.065, 16, 12), i % 2 === 0 ? lime : chrome);
    haloNodes.push(node);
    modes[1].add(node);
  }

  // Point sprites describe a folded, five-petalled field instead of a random star cloud.
  const count = 7200;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phase = new Float32Array(count);
  let seed = 71832;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const fold = 1.12 + 0.49 * Math.sin(theta * 5 + Math.cos(phi * 3)) * Math.sin(phi);
    const r = fold + (random() - 0.5) * 0.18;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    c.set(i % 12 === 0 ? 0xd4ff91 : i % 3 === 0 ? 0x9cb6e7 : 0xe8f0fa);
    colors.set([c.r, c.g, c.b], i * 3);
    sizes[i] = 1.2 + random() * 2.2;
    phase[i] = random() * Math.PI * 2;
  }
  const bloomGeometry = new THREE.BufferGeometry();
  bloomGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  bloomGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  bloomGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  bloomGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  const bloomMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uExplode: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    vertexShader: `
      uniform float uTime;
      uniform float uExplode;
      uniform float uPixelRatio;
      attribute float aSize;
      attribute float aPhase;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p *= 1.0 + 0.035 * sin(uTime * 0.7 + aPhase) + uExplode * (0.32 + 0.2 * sin(aPhase));
        p += normalize(position) * sin(aPhase + uTime * 0.4) * uExplode * 0.15;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = aSize * uPixelRatio * (5.5 / -mvPosition.z);
        vColor = color;
        vAlpha = 0.45 + 0.5 * pow(max(0.0, position.z * 0.35 + 0.5), 2.0);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float alpha = (1.0 - smoothstep(0.16, 0.5, d)) * vAlpha;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
  });
  const bloom = new THREE.Points(bloomGeometry, bloomMaterial);
  bloom.scale.setScalar(1.2);
  modes[2].add(bloom);

  const orbitGroup = new THREE.Group();
  artwork.add(orbitGroup);
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x9daabe, transparent: true, opacity: 0.2, depthWrite: false });
  const orbitNodes = [];
  for (let i = 0; i < 2; i++) {
    const points = [];
    const radius = 2.07 + i * 0.15;
    for (let j = 0; j <= 180; j++) {
      const a = j / 180 * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), orbitMaterial);
    line.rotation.set(i === 0 ? 1.05 : 0.35, i === 0 ? -0.25 : 1.03, i * 0.5 - 0.2);
    orbitGroup.add(line);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(i === 0 ? 0.037 : 0.025, 12, 8), i === 0 ? lime : white);
    orbitNodes.push({ dot, rotation: line.rotation.clone(), radius, phase: i * 2.6 });
    orbitGroup.add(dot);
  }

  let playing = !reducedMotion;
  let disposed = false;
  let ready = false;
  let inView = true;
  let mode = 0;
  let exploded = false;
  let explosion = 0;
  let elapsed = 0;
  let lastTime = 0;
  let raf = 0;
  let transition = 1;
  let drag = null;
  let velocityX = 0;
  let velocityY = 0;
  const originalRotation = artwork.rotation.clone();
  const draw = () => {
    if (disposed) return;
    renderer.render(scene, camera);
    if (!ready) { ready = true; onReady(); }
  };
  const requestFrame = () => {
    if (!disposed && !raf && inView && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const update = (dt) => {
    if (playing && !drag?.active) {
      elapsed += dt;
      artwork.rotation.y += dt * 0.12;
      artwork.rotation.z = originalRotation.z + Math.sin(elapsed * 0.17) * 0.045;
    }
    if (!drag?.active) {
      artwork.rotation.y += velocityX;
      artwork.rotation.x += velocityY;
      velocityX *= 0.9;
      velocityY *= 0.9;
    }
    explosion += ((exploded ? 1 : 0) - explosion) * Math.min(1, dt * 5.5);
    if (Math.abs(explosion - (exploded ? 1 : 0)) < 0.001) explosion = exploded ? 1 : 0;
    transition = Math.min(1, transition + dt * 3.5);
    modes[mode].scale.setScalar(0.92 + 0.08 * (1 - Math.pow(1 - transition, 3)));
    knot.visible = explosion < 0.003;
    segments.forEach(({ mesh, direction, index }) => {
      mesh.visible = !knot.visible;
      mesh.position.copy(direction).multiplyScalar(explosion * 0.62);
      mesh.rotation.x = knot.rotation.x + Math.sin(index * 1.7) * explosion * 0.19;
      mesh.rotation.y = knot.rotation.y + Math.cos(index * 2.1) * explosion * 0.19;
    });
    haloRings.forEach(({ mesh, rotation }, i) => {
      mesh.rotation.x = rotation.x + Math.sin(elapsed * 0.16 + i) * 0.15;
      mesh.rotation.y = rotation.y + elapsed * (i % 2 ? 0.11 : -0.07);
      mesh.position.y = (i - 1) * explosion * 0.6;
      mesh.scale.setScalar(1 + explosion * 0.1);
    });
    nucleus.scale.setScalar(1 - explosion * 0.15);
    haloNodes.forEach((node, i) => {
      const a = elapsed * 0.15 + i * Math.PI / 3;
      const r = 1.7 + explosion * 0.42;
      node.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.85, Math.sin(a * 2) * 0.8);
    });
    bloomMaterial.uniforms.uTime.value = elapsed;
    bloomMaterial.uniforms.uExplode.value = explosion;
    orbitNodes.forEach(({ dot, rotation, radius, phase: offset }) => {
      const a = elapsed * 0.1 + offset;
      dot.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0).applyEuler(rotation);
    });
  };
  function frame(now) {
    raf = 0;
    if (disposed || !inView || document.hidden) { lastTime = 0; return; }
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 1 / 60;
    lastTime = now;
    update(dt);
    draw();
    const settling = transition < 1 || Math.abs(explosion - (exploded ? 1 : 0)) > 0.001 || Math.abs(velocityX) + Math.abs(velocityY) > 0.0001;
    if (playing || drag?.active || settling) requestFrame();
    else lastTime = 0;
  }

  const resize = () => {
    if (disposed) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.position.z = Math.max(7.9, 7.9 / Math.min(camera.aspect, 1.05));
    camera.updateProjectionMatrix();
    requestFrame();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const observer = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView) requestFrame();
    else { cancelAnimationFrame(raf); raf = 0; lastTime = 0; }
  }, { rootMargin: '80px' });
  observer.observe(canvas);
  const visibility = () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; lastTime = 0; }
    else requestFrame();
  };
  document.addEventListener('visibilitychange', visibility);
  canvas.style.touchAction = 'pan-y';
  const down = event => {
    if (event.button !== 0 || drag) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, active: event.pointerType !== 'touch' };
    velocityX = velocityY = 0;
    if (drag.active) { canvas.setPointerCapture(event.pointerId); canvas.style.cursor = 'grabbing'; }
    requestFrame();
  };
  const move = event => {
    if (!drag || drag.id !== event.pointerId) return;
    if (!drag.active) {
      const dx = Math.abs(event.clientX - drag.startX);
      const dy = Math.abs(event.clientY - drag.startY);
      if (dy > 10 && dy > dx) { drag = null; return; }
      if (dx < 8 || dx < dy * 1.2) return;
      drag.active = true;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
    }
    velocityX = (event.clientX - drag.x) * 0.005;
    velocityY = (event.clientY - drag.y) * 0.005;
    artwork.rotation.y += velocityX;
    artwork.rotation.x += velocityY;
    drag.x = event.clientX;
    drag.y = event.clientY;
    requestFrame();
  };
  const up = event => {
    if (!drag || drag.id !== event.pointerId) return;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    drag = null;
    canvas.style.cursor = 'grab';
    if (reducedMotion) velocityX = velocityY = 0;
    requestFrame();
  };
  const lost = () => { drag = null; canvas.style.cursor = 'grab'; };
  const contextLost = event => {
    event.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
    playing = false;
    onError(new Error('The graphics context was interrupted.'));
  };
  const keydown = event => {
    const directions = { ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0], ArrowUp: [0, -0.15], ArrowDown: [0, 0.15] };
    const delta = directions[event.key];
    if (!delta) return;
    event.preventDefault();
    velocityX = velocityY = 0;
    artwork.rotation.y += delta[0];
    artwork.rotation.x += delta[1];
    requestFrame();
  };
  canvas.addEventListener('keydown', keydown);
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('lostpointercapture', lost);
  canvas.addEventListener('webglcontextlost', contextLost);
  resize();
  requestFrame();

  return {
    setMode(index) {
      const next = Math.max(0, Math.min(2, Math.round(Number(index) || 0)));
      if (next === mode) return;
      modes[mode].visible = false;
      mode = next;
      modes[mode].visible = true;
      transition = reducedMotion ? 1 : 0;
      requestFrame();
    },
    setPlaying(value) { playing = Boolean(value); lastTime = 0; requestFrame(); },
    setExploded(value) { exploded = Boolean(value); if (reducedMotion) explosion = exploded ? 1 : 0; requestFrame(); },
    reset() {
      artwork.rotation.copy(originalRotation);
      elapsed = 0;
      velocityX = velocityY = 0;
      exploded = false;
      explosion = 0;
      requestFrame();
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      canvas.removeEventListener('keydown', keydown);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('lostpointercapture', lost);
      canvas.removeEventListener('webglcontextlost', contextLost);
      const geometries = new Set();
      const materials = new Set();
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      environment.dispose();
      renderer.dispose();
    },
  };
}
