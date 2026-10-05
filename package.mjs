import { readFile, writeFile, readdir } from 'node:fs/promises';
import { deflateRawSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = file => readFile(path.join(root, file), 'utf8');
const entries = ['index.html', 'styles.css', 'app.js', 'scene.js', 'gallery-art.js', 'server.mjs', 'package.json', 'package.mjs', 'README.md', 'LICENSE', 'THIRD_PARTY.md', '.gitignore'];
const excluded = new Set(['orbit-lab-source.zip', 'orbit-lab-standalone.html']);
async function walk(folder) {
  for (const entry of await readdir(path.join(root, folder), { withFileTypes: true })) {
    const name = folder + '/' + entry.name;
    if (excluded.has(entry.name)) continue;
    if (entry.isDirectory()) await walk(name);
    else if (entry.isFile()) entries.push(name);
  }
}
for (const folder of ['vendor', 'assets', '.github']) await walk(folder);

const table = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let value = n;
  for (let i = 0; i < 8; i++) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  table[n] = value >>> 0;
}
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = table[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
const localRecords = [];
const centralRecords = [];
let offset = 0;
for (const filename of entries.sort()) {
  const name = Buffer.from(filename);
  const data = await readFile(path.join(root, filename));
  const compressed = deflateRawSync(data, { level: 9 });
  const crc = crc32(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x800, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt16LE(33, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  localRecords.push(local, name, compressed);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(33, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(offset, 42);
  centralRecords.push(central, name);
  offset += local.length + name.length + compressed.length;
}
const centralSize = centralRecords.reduce((total, record) => total + record.length, 0);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(entries.length, 8);
end.writeUInt16LE(entries.length, 10);
end.writeUInt32LE(centralSize, 12);
end.writeUInt32LE(offset, 16);
const zip = Buffer.concat([...localRecords, ...centralRecords, end]);
await writeFile(path.join(root, 'assets/orbit-lab-source.zip'), zip);

// Data-URL modules allow the complete artwork to run from a double-clicked file.
const dataURL = (mime, data) => 'data:' + mime + ';base64,' + Buffer.from(data).toString('base64');
const coreURL = dataURL('text/javascript', await read('vendor/three.core.min.js'));
const threeSource = (await read('vendor/three.module.min.js')).replace(/(['"])\.\/three\.core\.min\.js\1/g, () => JSON.stringify(coreURL));
const threeURL = dataURL('text/javascript', threeSource);
const sceneSource = (await read('scene.js')).replace("'./vendor/three.module.min.js'", () => JSON.stringify(threeURL));
const sceneURL = dataURL('text/javascript', sceneSource);
const artURL = dataURL('text/javascript', await read('gallery-art.js'));
const appSource = (await read('app.js'))
  .replace("'./gallery-art.js'", () => JSON.stringify(artURL))
  .replace("'./scene.js'", () => JSON.stringify(sceneURL));
const styles = await read('styles.css');
let standalone = await read('index.html');
standalone = standalone.replace(/<link rel="modulepreload"[^>]*>/g, '')
  .replace('<link rel="stylesheet" href="./styles.css">', () => '<style>' + styles + '</style>');
const favicon = await read('assets/favicon.svg');
standalone = standalone
  .replace('./assets/favicon.svg', () => dataURL('image/svg+xml', favicon))
  .replaceAll('./assets/orbit-lab-source.zip', dataURL('application/zip', zip))
  .replace('<script type="module" src="./app.js"></script>', () => '<script type="module">\n' + appSource + '\n</script>');
await writeFile(path.join(root, 'assets/orbit-lab-standalone.html'), standalone);
console.log('Source archive: assets/orbit-lab-source.zip (' + zip.length + ' bytes)');
console.log('Double-click preview: assets/orbit-lab-standalone.html');
