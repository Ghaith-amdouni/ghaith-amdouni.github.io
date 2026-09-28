import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [sourceRoot, category] = process.argv.slice(2);
if (!sourceRoot || !['misc', 'pwn'].includes(category)) {
  throw new Error('usage: node scripts/import-friendly.mjs <challenge-root> <misc|pwn>');
}

const categoryRoot = path.join(sourceRoot, category);
const output = path.join('content', `friendly-ctf-2026-${category}.json`);
const excludedChallenges = {
  misc: new Set(['beggnerzzz']),
  pwn: new Set(),
};
const directories = (await readdir(categoryRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && !excludedChallenges[category].has(entry.name))
  .sort((left, right) => left.name.localeCompare(right.name));

const scalar = (yaml, key) => {
  const match = yaml.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm'));
  return match?.[1].replace(/^(['"])(.*)\1$/, '$2') || '';
};

const block = (yaml, key) => {
  const lines = yaml.split('\n');
  const start = lines.findIndex((line) => line.startsWith(`${key}:`));
  if (start < 0) return '';
  const value = [];
  for (const line of lines.slice(start + 1)) {
    if (line && !line.startsWith('  ')) break;
    value.push(line.startsWith('  ') ? line.slice(2) : '');
  }
  return value.join('\n').trim();
};

const list = (yaml, key) => {
  const lines = yaml.split('\n');
  const start = lines.findIndex((line) => line === `${key}:`);
  if (start < 0) return [];
  const values = [];
  for (const line of lines.slice(start + 1)) {
    const match = line.match(/^\s+-\s+(.+?)\s*$/);
    if (!match) break;
    values.push(match[1].replace(/^(['"])(.*)\1$/, '$2'));
  }
  return values;
};

const difficultyFromPoints = (points) => {
  if (points <= 100) return 1;
  if (points <= 200) return 2;
  if (points <= 500) return 3;
  return 4;
};

const shortSolutions = {
  banned_in_leonida: `## Solution

The service evaluates a Python expression but rejects raw input containing words such as
\`open\` and \`flag\`. The filter only sees the submitted text, so build both forbidden
names at runtime, recover \`open\` from \`__builtins__\` with \`getattr\`, and read the
flag file.

The payload is:

\`\`\`python
getattr(__builtins__,''.join(['o','p','e','n']))(''.join(['fl','ag.txt'])).read()
\`\`\``,
  cheat_code: `## Solution

The developer console passes the submitted expression directly to Python's \`eval\`.
There is no sandbox or filter, so evaluating \`open("flag.txt").read()\` returns the
flag immediately.`,
};

const cleanWriteup = (markdown, slug) => {
  let result = markdown.replace(/^#\s+.*?(?:\r?\n){1,2}/, '').trim();
  const privateSections = new Set([
    'Organizer commands',
    'Local organizer commands',
    'Security boundaries',
    'Regression checks',
    'Files',
    'Regeneration',
  ]);
  let excluded = false;
  result = result.split('\n').filter((line) => {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) excluded = privateSections.has(heading[1]);
    return !excluded;
  }).join('\n').trim();
  if (shortSolutions[slug]) result = shortSolutions[slug];
  return result;
};

const challenges = [];
for (const directory of directories) {
  const root = path.join(categoryRoot, directory.name);
  const yaml = await readFile(path.join(root, 'challenge.yml'), 'utf8');
  const readme = await readFile(path.join(root, 'Read.md'), 'utf8');
  const solverName = directory.name === 'begnerzzzz_maxiing' ? 'Solve.java' : 'solver.py';
  const solver = await readFile(path.join(root, solverName), 'utf8');
  const points = Number(yaml.match(/^\s+initial:\s*(\d+)/m)?.[1] || 0);
  challenges.push({
    slug: directory.name.replaceAll('_', '-'),
    title: scalar(yaml, 'name'),
    category: category[0].toUpperCase() + category.slice(1),
    collection: 'Securinets Friendly CTF 2026',
    author: scalar(yaml, 'author') || 'r3t0x',
    date: '2026-09-28',
    points,
    difficulty: difficultyFromPoints(points),
    description: block(yaml, 'description'),
    tags: list(yaml, 'tags'),
    flag: list(yaml, 'flags')[0] || '',
    writeup: cleanWriteup(readme, directory.name),
    solver,
    solverLanguage: solverName.endsWith('.java') ? 'java' : 'python',
  });
}

await mkdir('content', { recursive: true });
await writeFile(output, `${JSON.stringify(challenges, null, 2)}\n`);
console.log(`Imported ${challenges.length} ${category} writeups into ${output}.`);
