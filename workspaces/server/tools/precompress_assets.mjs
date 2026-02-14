import fsp from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';

const serverRoot = path.resolve(import.meta.dirname, '..');
const repoRoot = path.resolve(serverRoot, '../..');

const targetDirs = [
  path.resolve(repoRoot, 'public'),
  path.resolve(repoRoot, 'workspaces/client/dist'),
  path.resolve(serverRoot, 'streams'),
];

const compressibleExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.map',
  '.m3u8',
  '.mjs',
  '.svg',
  '.txt',
  '.wasm',
  '.xml',
]);

/** @param {string} targetPath */
async function exists(targetPath) {
  try {
    await fsp.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

/** @param {string} dirPath @returns {Promise<string[]>} */
async function walkFiles(dirPath) {
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
      continue;
    }
    if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

/** @param {string} sourcePath @param {'br'|'gz'} encoding */
async function buildCompressedAsset(sourcePath, encoding) {
  const sourceStat = await fsp.stat(sourcePath);
  const targetPath = `${sourcePath}.${encoding}`;
  try {
    const targetStat = await fsp.stat(targetPath);
    if (targetStat.mtimeMs >= sourceStat.mtimeMs) {
      return false;
    }
  } catch {
    // ignore missing file
  }

  const source = await fsp.readFile(sourcePath);
  const compressed =
    encoding === 'br'
      ? zlib.brotliCompressSync(source, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: 5,
          },
        })
      : zlib.gzipSync(source, { level: 9 });

  await fsp.writeFile(targetPath, compressed);
  return true;
}

/** @returns {Promise<void>} */
async function main() {
  let updated = 0;
  for (const dirPath of targetDirs) {
    if (!(await exists(dirPath))) {
      continue;
    }
    const files = await walkFiles(dirPath);
    for (const filePath of files) {
      if (filePath.endsWith('.br') || filePath.endsWith('.gz')) {
        continue;
      }
      const ext = path.extname(filePath).toLowerCase();
      if (!compressibleExtensions.has(ext)) {
        continue;
      }
      updated += (await buildCompressedAsset(filePath, 'br')) ? 1 : 0;
      updated += (await buildCompressedAsset(filePath, 'gz')) ? 1 : 0;
    }
  }

  console.log(`[precompress-assets] updated files: ${updated}`);
}

await main();
