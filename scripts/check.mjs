import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', 'node_modules']);
const htmlFiles = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(target);
    else if (entry.name.endsWith('.html')) htmlFiles.push(target);
  }
}

async function exists(target) {
  try { await access(target); return true; } catch { return false; }
}

await walk(root);
const failures = [];
let checkedLinks = 0;

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  if (!/<html\b[^>]*lang="en"/i.test(html)) failures.push(`${path.relative(root, file)}: missing lang="en"`);
  if (!/<meta\s+name="viewport"/i.test(html)) failures.push(`${path.relative(root, file)}: missing viewport metadata`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (!value.startsWith('/') || value.startsWith('//')) continue;
    const pathname = decodeURIComponent(value.split(/[?#]/)[0]);
    if (!pathname || pathname === '/') continue;
    let target = path.join(root, pathname);
    if (pathname.endsWith('/')) target = path.join(target, 'index.html');
    else if (await exists(target) && (await stat(target)).isDirectory()) target = path.join(target, 'index.html');
    checkedLinks += 1;
    if (!(await exists(target))) failures.push(`${path.relative(root, file)}: missing ${value}`);
  }
}

const required = [
  'index.html', 'blog/index.html', 'projects/index.html', 'resume/index.html', '404.html',
  'static/css/site.css', 'static/js/site.js', 'static/img/ghaith.webp',
  'static/img/social-card.png', 'static/docs/Ghaith-Amdouni-CV-English.pdf',
  'static/data/search.json', 'feed.xml', 'sitemap.xml', 'robots.txt'
];
for (const relative of required) if (!(await exists(path.join(root, relative)))) failures.push(`missing required output: ${relative}`);

if (failures.length) {
  console.error(`Site check failed with ${failures.length} problem(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Site check passed: ${htmlFiles.length} HTML pages, ${checkedLinks} local asset/route references, 0 missing.`);
