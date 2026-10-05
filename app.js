import { initGalleryArt } from './gallery-art.js';

document.documentElement.classList.add('js');
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let playing = !reducedMotion.matches;
let exploded = false;
let selectedMode = 0;
let sculpture;
let gallery;
let toastTimer;
const motionButton = $('#play-pause');
const dialog = $('#project-dialog');

function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 2600);
}

// The preference provides a quiet first visit; the visitor can still opt into motion.
function setMotion(value) {
  playing = value;
  sculpture?.setPlaying(playing);
  gallery?.setPlaying(playing);
  document.body.classList.toggle('motion-paused', !playing);
  motionButton.setAttribute('aria-pressed', String(!playing));
  motionButton.setAttribute('aria-label', playing ? '暂停动态效果' : '播放动态效果');
  motionButton.title = playing ? '暂停动态效果' : '播放动态效果';
  motionButton.innerHTML = playing ? '<span class="pause-glyph">Ⅱ</span>' : '<span class="pause-glyph">▶</span>';
  $('#dialog-pause').textContent = playing ? '暂停动态 Ⅱ' : '播放动态 ▶';
  $('#dialog-pause').setAttribute('aria-pressed', String(!playing));
}
function refreshGallery() {
  gallery?.destroy();
  gallery = initGalleryArt();
  gallery.setPlaying(playing);
}
refreshGallery();
setMotion(playing);
motionButton.addEventListener('click', () => setMotion(!playing));
$('#dialog-pause').addEventListener('click', () => setMotion(!playing));
reducedMotion.addEventListener('change', event => { setMotion(!event.matches); });

const names = ['CHROME KNOT', 'ORBITAL ARRAY', 'PARTICLE BLOOM'];
function chooseMode(index) {
  selectedMode = index;
  sculpture?.setMode(index);
  $('#art-name').textContent = names[index];
  $$('.scene-choice').forEach((button, i) => {
    button.classList.toggle('active', i === index);
    button.setAttribute('aria-pressed', String(i === index));
  });
}
$$('.scene-choice').forEach(button => button.addEventListener('click', () => chooseMode(Number(button.dataset.mode))));
$('#explode').addEventListener('click', () => {
  exploded = !exploded;
  sculpture?.setExploded(exploded);
  $('#explode').setAttribute('aria-pressed', String(exploded));
  $('#explode').setAttribute('aria-label', exploded ? '聚合雕塑' : '展开雕塑');
  $('#explode').title = exploded ? '聚合雕塑' : '展开雕塑';
});
$('#reset-scene').addEventListener('click', () => {
  sculpture?.reset();
  exploded = false;
  $('#explode').setAttribute('aria-pressed', 'false');
  $('#explode').setAttribute('aria-label', '展开雕塑');
  $('#explode').title = '展开雕塑';
  chooseMode(0);
  toast('视角已重置');
});
$('#sculpture').addEventListener('keydown', event => {
  if (['1', '2', '3'].includes(event.key)) { chooseMode(Number(event.key) - 1); event.preventDefault(); }
  if (event.code === 'Space') { setMotion(!playing); event.preventDefault(); }
});
function graphicsFallback() {
  $('.sculpture-stage').classList.remove('ready');
  $('#render-state').textContent = 'STATIC PREVIEW';
  $('#interaction-hint').textContent = '当前设备显示静态艺术预览';
  $$('.scene-choice, #explode, #reset-scene').forEach(button => { button.disabled = true; });
  $('#sculpture').tabIndex = -1;
}
// Keep navigation and the artwork gallery available even without a WebGL context.
import('./scene.js').then(({ createSculpture }) => {
  sculpture = createSculpture($('#sculpture'), {
    reducedMotion: reducedMotion.matches,
    onReady() { $('.sculpture-stage').classList.add('ready'); $('#render-state').textContent = 'LIVE / WEBGL'; },
    onError: graphicsFallback,
  });
  sculpture.setMode(selectedMode);
  sculpture.setExploded(exploded);
  sculpture.setPlaying(playing);
}).catch(graphicsFallback);

const projects = {
  terrain: { title: '地形的呼吸', category: '001 / GENERATIVE LANDSCAPE', description: '多层正弦波叠加成起伏的山脉，细密等高线勾勒出一片永远流动的地形。没有两次呼吸，拥有完全相同的轮廓。' },
  orbit: { title: '引力之外', category: '002 / ORBITAL MECHANICS', description: '让光沿着椭圆轨道运行。微小的相位变化，演化成星体与光环的无声对话。这是一场用数学描绘的宇宙想象。' },
  wave: { title: '看得见的频率', category: '003 / FREQUENCY IN FORM', description: '一百余根线条，遵循不同的相位与振幅。它们互相靠近、偏移、共振，让抽象的波形长出一座可见的雕塑。' },
};
$$('[data-project]').forEach(button => button.addEventListener('click', () => {
  const key = button.dataset.project;
  const project = projects[key];
  $('#dialog-title').textContent = project.title;
  $('#dialog-description').textContent = project.description;
  $('#dialog-category').textContent = project.category;
  $('#dialog-canvas').dataset.art = key;
  dialog.showModal();
  refreshGallery();
}));
$('#close-project').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});

const snippets = {
  shape: { filename: 'sculpture.js', language: 'JAVASCRIPT', code: `// 从一个想法，到一个有形的世界。\nimport * as THREE from './vendor/three.module.min.js';\n\nconst geometry = new THREE.TorusKnotGeometry(\n  1.08, 0.325, 280, 40, 2, 3\n);\nconst material = new THREE.MeshPhysicalMaterial({\n  metalness: 1.0,\n  roughness: 0.19,\n  iridescence: 0.18\n});\n\nscene.add(new THREE.Mesh(geometry, material));` },
  motion: { filename: 'motion.js', language: 'JAVASCRIPT', code: `// 让数学，有自己的呼吸。\nlet elapsed = 0;\nconst clock = new THREE.Clock();\n\nfunction animate() {\n  elapsed += clock.getDelta();\n  sculpture.rotation.y = elapsed * 0.12;\n  sculpture.position.y =\n    Math.sin(elapsed * 0.7) * 0.08;\n\n  renderer.render(scene, camera);\n}\nrenderer.setAnimationLoop(animate);` },
  publish: { filename: '.github/workflows/pages.yml', language: 'YAML', code: `# 完整工作流已包含在源码包中。\n# 上传到 GitHub → Settings → Pages\n# 将 Source 设为 GitHub Actions。\n\nsteps:\n  - uses: actions/checkout@v6\n  - uses: actions/configure-pages@v5\n  - uses: actions/upload-pages-artifact@v4\n    with:\n      path: '.'\n  - uses: actions/deploy-pages@v4\n\n# 下一个实验，交给你。` },
};
let currentSnippet = 'shape';
function renderSnippet(key) {
  currentSnippet = key;
  const snippet = snippets[key];
  $('#code-filename').textContent = snippet.filename;
  $('#code-language').textContent = snippet.language;
  $('#code-panel').setAttribute('aria-labelledby', `tab-${key}`);
  $$('.code-tabs button').forEach(button => {
    const selected = button.dataset.code === key;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  // Append text nodes, never execute or inject copied source as HTML.
  const fragment = document.createDocumentFragment();
  for (const line of snippet.code.split('\n')) {
    const element = document.createElement('span');
    element.textContent = line + '\n';
    if (/^\s*(\/\/|#)/.test(line)) element.className = 'code-comment';
    else if (/\b(import|const|let|function|uses:)/.test(line)) element.className = 'code-keyword';
    else if (/\d/.test(line)) element.className = 'code-number';
    fragment.append(element);
  }
  $('#code-content').replaceChildren(fragment);
}
renderSnippet('shape');
const tabs = $$('.code-tabs button');
tabs.forEach((button, index) => {
  button.addEventListener('click', () => renderSnippet(button.dataset.code));
  button.addEventListener('keydown', event => {
    let target;
    if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') target = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = tabs.length - 1;
    if (target !== undefined) { event.preventDefault(); tabs[target].focus(); renderSnippet(tabs[target].dataset.code); }
  });
});
$('#copy-code').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(snippets[currentSnippet].code);
    toast('代码已复制，去创造你的版本吧');
  } catch {
    const range = document.createRange();
    range.selectNodeContents($('#code-content'));
    const selection = window.getSelection();
    selection.removeAllRanges(); selection.addRange(range);
    toast('代码已选中，请按 Ctrl+C 或长按复制');
  }
});

const revealObserver = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) {
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  }
}, { threshold: 0.07 });
$$('.reveal').forEach(element => revealObserver.observe(element));
let scrollFrame = 0;
function updateProgress() {
  scrollFrame = 0;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  $('.reading-progress').style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
}
window.addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateProgress); }, { passive: true });
window.addEventListener('resize', updateProgress, { passive: true });
updateProgress();

if (window.matchMedia('(pointer:fine)').matches) {
  $$('.magnetic').forEach(button => {
    button.addEventListener('pointermove', event => {
      if (reducedMotion.matches || !playing) return;
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.12;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.2;
      button.style.transform = `translate(${x}px, ${y}px)`;
    });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  });
}

window.addEventListener('pagehide', event => {
  if (!event.persisted) { sculpture?.destroy(); gallery?.destroy(); revealObserver.disconnect(); }
});
