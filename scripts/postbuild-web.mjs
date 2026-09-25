// Finalizes the `expo export -p web` output for static hosting (GitHub Pages):
// fills in the base URL, builds the service worker precache list and adds the SPA fallback.
import { createHash } from 'node:crypto';
import { copyFileSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const baseUrl = (process.env.EXPO_BASE_URL ?? '').replace(/\/$/, '');

const listFiles = (dir) =>
    readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? listFiles(path) : [path];
    });

const replaceIn = (file, replacements) => {
    let text = readFileSync(file, 'utf8');
    for (const [token, value] of replacements) text = text.split(token).join(value);
    writeFileSync(file, text);
};

replaceIn(join(dist, 'index.html'), [['__BASE_URL__', baseUrl]]);
replaceIn(join(dist, 'manifest.webmanifest'), [['__BASE_URL__', baseUrl]]);

const files = listFiles(dist)
    .map((file) => relative(dist, file).split(sep).join('/'))
    .filter((file) => !file.endsWith('.map') && !['sw.js', '404.html', '.nojekyll', 'metadata.json'].includes(file));

const hash = createHash('sha256');
for (const file of files.sort()) hash.update(file).update(readFileSync(join(dist, file)));
const version = hash.digest('hex').slice(0, 12);

// index.html is cached under the scope root, which is what the worker serves for navigations.
const precache = files.map((file) => (file === 'index.html' ? `${baseUrl}/` : `${baseUrl}/${file}`));

replaceIn(join(dist, 'sw.js'), [
    ['__CACHE_VERSION__', version],
    ['__BASE_URL__', baseUrl],
    ['__PRECACHE__', JSON.stringify(precache, null, 2)],
]);

// GitHub Pages serves 404.html for unknown paths, which lets the SPA router handle deep links.
copyFileSync(join(dist, 'index.html'), join(dist, '404.html'));
// Without this, GitHub Pages' Jekyll step drops the `_expo` directory.
writeFileSync(join(dist, '.nojekyll'), '');

console.log(`Web build finalized: base "${baseUrl || '/'}", ${precache.length} precached files, cache ${version}`);
