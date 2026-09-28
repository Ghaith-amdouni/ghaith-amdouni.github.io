import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

import { esc, codeBlock } from './lib/highlight.mjs';
import { renderMarkdown, normalizeImportedHtml } from './lib/markdown.mjs';
import { page, redirect } from './lib/layout.mjs';
import { site, achievements, experience, certifications, collections } from '../content/site.mjs';
import { projects } from '../content/projects.mjs';
import { posts } from '../content/posts.mjs';

/* ---------------------------------------------------------------- helpers */

const assets = createHash('sha256')
  .update(await readFile('static/css/main.css'))
  .update(await readFile('static/js/main.js'))
  .digest('hex')
  .slice(0, 10);

const LEVELS = { 1: 'easy', 2: 'easy', 3: 'medium', 4: 'hard', 5: 'hard' };
const level = difficulty => LEVELS[difficulty] || 'medium';
const tier = difficulty => (difficulty <= 2 ? 'easy' : difficulty === 3 ? 'medium' : 'hard');

const day = value =>
  new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

const trim = (text, limit = 150) => {
  const flat = String(text).replace(/\s+/g, ' ').trim();
  const clipped = flat.length <= limit ? flat : `${flat.slice(0, limit).replace(/\s+\S*$/, '')}…`;
  // Several archived descriptions were imported mid-sentence; close them cleanly.
  return clipped.replace(/[\s,;:—-]+(…?)$/, '$1').replace(/([^.!?…])$/, '$1…');
};

const slugOf = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* --------------------------------------------------------------- writeups */

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

const imported = [];
for (const category of ['pwn', 'misc']) {
  for (const entry of await readJson(`content/friendly-ctf-2026-${category}.json`)) {
    imported.push({ ...entry, url: `/challenge/securinets-friendly-ctf-2026/${category}/${entry.slug}/` });
  }
}
for (const entry of await readJson('content/legacy-writeups.json')) {
  imported.push({ ...entry, url: entry.url.replace(/index\.html$/, '') });
}

const order = Object.keys(collections);
const writeups = imported
  .map(entry => {
    const rendered = entry.writeupHtml
      ? normalizeImportedHtml(entry.writeupHtml)
      : renderMarkdown(entry.writeup || '');
    return {
      ...entry,
      slug: entry.slug || slugOf(entry.title),
      summary: trim(entry.description) || `${entry.collection} ${entry.category.toLowerCase()} challenge.`,
      blurb: trim(entry.description, 320) || `${entry.collection} ${entry.category.toLowerCase()} challenge.`,
      body: rendered.html,
      headings: rendered.headings,
      tags: entry.tags?.length ? entry.tags : [entry.category.toLowerCase()],
    };
  })
  .sort(
    (a, b) =>
      order.indexOf(a.collection) - order.indexOf(b.collection) ||
      a.category.localeCompare(b.category) ||
      a.difficulty - b.difficulty ||
      a.title.localeCompare(b.title),
  );

const byCollection = order
  .map(name => ({ name, slug: slugOf(name), entries: writeups.filter(entry => entry.collection === name) }))
  .filter(group => group.entries.length);

const categories = [...new Set(writeups.map(entry => entry.category))].sort();
// Everything was published on the same import date, so "latest" would be
// arbitrary. Show the hardest two from each collection instead.
const featured = byCollection.flatMap(group =>
  [...group.entries]
    .sort(
      (a, b) =>
        (a.category === 'Pwn' ? 0 : 1) - (b.category === 'Pwn' ? 0 : 1) ||
        b.difficulty - a.difficulty ||
        Number(b.points || 0) - Number(a.points || 0),
    )
    .slice(0, 2),
);

/* ------------------------------------------------------------- components */

const block = (id, heading, content, link = '') => `<section class="block" id="${id}">
  <div class="block-head"><h2>${heading}</h2>${link}</div>
  ${content}
</section>`;

const entryRow = entry => `<li class="entry" data-collection="${esc(entry.collection)}" data-category="${esc(entry.category)}" data-level="${tier(entry.difficulty)}" data-search="${esc(`${entry.title} ${entry.summary} ${entry.tags.join(' ')}`.toLowerCase())}">
  <a href="${entry.url}">
    <span class="entry-cat">${esc(entry.category.toLowerCase())}</span>
    <span class="entry-main"><strong>${esc(entry.title)}</strong><span>${esc(entry.summary)}</span></span>
    <span class="entry-meta">${entry.points ? `${esc(entry.points)} pts` : 'archived'}<i>${level(entry.difficulty)}</i></span>
  </a>
</li>`;

/* -------------------------------------------------------------- home page */

const home = `
<section class="intro">
  <div class="intro-text">
    <p class="kicker">${esc(site.handle)} · ${esc(site.location.toLowerCase())}</p>
    <h1>${esc(site.name)}</h1>
    <p class="lede">${esc(site.role)}. I break binaries, write challenges, and keep notes on the layers underneath.</p>
    ${site.bio.map(paragraph => `<p>${paragraph}</p>`).join('')}
    <p class="intro-links">${site.links
      .filter(link => link.label !== 'RSS')
      .map(link => `<a href="${link.href}">${link.label}</a>`)
      .join('')}<a href="mailto:${site.email}">email</a><a href="${site.cv}" download>cv</a></p>
  </div>
  <div class="intro-mark" aria-hidden="true"><img src="/static/img/mangekyou.png" alt="" width="200" height="200" fetchpriority="high"></div>
</section>

${block(
  'writeups',
  'selected writeups',
  `<ul class="entries">${featured.map(entryRow).join('')}</ul>`,
  `<a class="more" href="/blog/">all ${writeups.length} &rarr;</a>`,
)}

${block(
  'results',
  'ctf results',
  `<ul class="results">${achievements
    .map(item => `<li><b>${esc(item.rank)}</b><span>${esc(item.event)}</span><i>${esc(item.detail)}</i></li>`)
    .join('')}</ul>`,
)}

${block(
  'projects',
  'projects',
  `<ul class="cards">${projects
    .filter(project => project.featured)
    .map(
      project => `<li><a href="/projects/#${project.slug}">
        <span class="card-kicker">${esc(project.kicker.toLowerCase())}</span>
        <strong>${esc(project.title)}</strong>
        <span>${esc(project.description)}</span>
        <em>${project.stack.map(esc).join(' · ')}</em>
      </a></li>`,
    )
    .join('')}</ul>`,
  `<a class="more" href="/projects/">all ${projects.length} &rarr;</a>`,
)}

${block(
  'experience',
  'experience',
  `<ul class="timeline">${experience
    .map(
      item => `<li>
        <span class="period">${esc(item.period)}</span>
        <div><strong>${esc(item.role)}</strong><span class="org">${esc(item.org)}</span><p>${esc(item.summary)}</p>${
          item.href ? `<a class="more" href="${item.href}">read the notes &rarr;</a>` : ''
        }</div>
      </li>`,
    )
    .join('')}</ul>
  <ul class="certs">${certifications
    .map(item => `<li><span>${esc(item.name)}</span>${item.issuer ? `<i>${esc(item.issuer)}</i>` : ''}</li>`)
    .join('')}</ul>`,
)}

<section class="block contact" id="contact">
  <div class="block-head"><h2>contact</h2></div>
  <p>Questions about a writeup, a challenge idea, or work — mail is the fastest way to reach me.</p>
  <p class="contact-actions"><a class="button" href="mailto:${site.email}">${esc(site.email)}</a><button type="button" class="button ghost" data-copy-email="${esc(site.email)}">copy</button></p>
</section>`;

await writeFile(
  'index.html',
  page(`<div class="shell">${home}</div>`, { title: site.name, description: site.description, url: '/', assets }),
);

/* ----------------------------------------------------------- writeup list */

const selects = [
  ['collection', 'collection', ['all', ...byCollection.map(group => group.name)]],
  ['category', 'category', ['all', ...categories]],
  ['level', 'difficulty', ['all', 'easy', 'medium', 'hard']],
];

const archive = `
<header class="page-head">
  <p class="kicker">archive</p>
  <h1>writeups</h1>
  <p class="lede">${writeups.length} challenge writeups across ${byCollection.length} collections. Every one ships with the reference solver I used to validate it.</p>
</header>

<form class="filters" id="filters" role="search">
  <label class="field grow"><span class="sr-only">Search writeups</span>
    <input type="search" id="filter-search" name="q" placeholder="search by name, tag, or technique" autocomplete="off" spellcheck="false">
  </label>
  ${selects
    .map(
      ([id, label, options]) => `<label class="field"><span>${label}</span>
    <select id="filter-${id}" name="${id}">${options
      .map(option => `<option value="${esc(option)}">${esc(option === 'all' ? `all ${label === 'difficulty' ? 'levels' : label === 'category' ? 'categories' : `${label}s`}` : option)}</option>`)
      .join('')}</select></label>`,
    )
    .join('')}
  <p class="filter-count"><output id="filter-count">${writeups.length} writeups</output><button type="button" id="filter-reset" hidden>reset</button></p>
</form>

<div id="archive">
${byCollection
  .map(
    group => `<section class="collection" data-group="${esc(group.name)}" id="${group.slug}">
    <div class="collection-head">
      <h2>${esc(group.name)}</h2>
      <p>${esc(collections[group.name] || '')}</p>
      <span data-group-count>${group.entries.length}</span>
    </div>
    <ul class="entries">${group.entries.map(entryRow).join('')}</ul>
  </section>`,
  )
  .join('')}
</div>
<p class="empty" id="archive-empty" hidden>Nothing matches that filter. <button type="button" class="link" id="empty-reset">Reset</button></p>`;

await mkdir('blog', { recursive: true });
await writeFile(
  'blog/index.html',
  page(`<div class="shell narrow-wide">${archive}</div>`, {
    title: 'Writeups',
    description: `${writeups.length} CTF writeups by Ghaith Amdouni: binary exploitation, misc, and the solvers behind them.`,
    url: '/blog/',
    active: 'blog',
    assets,
  }),
);

/* ---------------------------------------------------------- writeup pages */

for (const entry of writeups) {
  const group = byCollection.find(item => item.name === entry.collection);
  const position = group.entries.indexOf(entry);
  const previous = group.entries[position - 1];
  const next = group.entries[position + 1];

  const toc = entry.headings.length > 1
    ? `<nav class="toc" aria-label="On this page"><p>contents</p><ol>${entry.headings
        .map(heading => `<li><a href="#${heading.id}">${esc(heading.text)}</a></li>`)
        .join('')}<li><a href="#solver">Reference solver</a></li><li><a href="#flag">Flag</a></li></ol></nav>`
    : '';

  const body = `<article class="writeup">
  <header class="page-head">
    <p class="kicker"><a href="/blog/#${group.slug}">${esc(entry.collection)}</a> / ${esc(entry.category.toLowerCase())}</p>
    <h1>${esc(entry.title)}</h1>
    <p class="lede">${esc(entry.blurb)}</p>
    <dl class="facts">
      <div><dt>difficulty</dt><dd>${level(entry.difficulty)}</dd></div>
      <div><dt>points</dt><dd>${entry.points ? esc(entry.points) : '—'}</dd></div>
      <div><dt>published</dt><dd><time datetime="${esc(entry.date)}">${day(entry.date)}</time></dd></div>
      <div><dt>author</dt><dd>${esc(entry.author)}</dd></div>
    </dl>
    <p class="tags">${entry.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</p>
  </header>
  ${toc}
  <div class="prose">
    ${entry.body}
    <h2 id="solver">Reference solver</h2>
    ${codeBlock(entry.solver, entry.solverLanguage, { label: `solve.${entry.solverLanguage === 'python' ? 'py' : entry.solverLanguage}` })}
    <h2 id="flag">Flag</h2>
    <p class="flag"><code>${esc(entry.flag)}</code><button type="button" class="copy" data-copy>copy</button></p>
  </div>
  <nav class="pager" aria-label="More writeups">
    ${previous ? `<a href="${previous.url}"><span>previous</span><strong>${esc(previous.title)}</strong></a>` : '<span></span>'}
    ${next ? `<a class="next" href="${next.url}"><span>next</span><strong>${esc(next.title)}</strong></a>` : '<span></span>'}
  </nav>
</article>`;

  const directory = entry.url.replace(/^\/|\/$/g, '');
  await mkdir(directory, { recursive: true });
  await writeFile(
    `${directory}/index.html`,
    page(`<div class="shell narrow">${body}</div>`, {
      title: `${entry.title} — ${entry.collection}`,
      description: entry.summary,
      url: entry.url,
      active: 'blog',
      type: 'article',
      assets,
    }),
  );
}

/* ---------------------------------------------------------- projects page */

const projectSection = project => `<section class="project" id="${project.slug}">
  <div class="project-head">
    <p class="kicker">${esc(project.kicker.toLowerCase())}</p>
    <h2>${esc(project.title)}</h2>
    <p class="lede">${esc(project.description)}</p>
    <p class="tags">${project.stack.map(item => `<span>${esc(item)}</span>`).join('')}</p>
  </div>
  <div class="prose">${project.body.replace(/<h2>/g, '<h3>').replace(/<\/h2>/g, '</h3>').replace(/ class="button"/g, ' class="more"')}</div>
  <p><a class="button ghost" href="${project.repo}">source on github &rarr;</a></p>
</section>`;

const projectsPage = `
<header class="page-head">
  <p class="kicker">work</p>
  <h1>projects</h1>
  <p class="lede">Security research, challenge authoring, infrastructure, and network simulation — the public side of what I build.</p>
  <ul class="jump">${projects.map(project => `<li><a href="#${project.slug}">${esc(project.title)}</a></li>`).join('')}</ul>
</header>
${projects.map(projectSection).join('')}`;

await mkdir('projects', { recursive: true });
await writeFile(
  'projects/index.html',
  page(`<div class="shell narrow">${projectsPage}</div>`, {
    title: 'Projects',
    description: 'Security, systems, DevOps, networking, and embedded projects by Ghaith Amdouni.',
    url: '/projects/',
    active: 'projects',
    assets,
  }),
);

/* ------------------------------------------------------- compat redirects */

const postTarget = post =>
  post.slug === 'taskmanager' ? '/projects/#taskpilot-devops' : post.slug === 'network-simulations' ? '/projects/#omnetpp-mesh-5g' : '/#about';
for (const post of posts) {
  await mkdir(`blog/${post.slug}`, { recursive: true });
  await writeFile(`blog/${post.slug}/index.html`, redirect(postTarget(post), post.title));
}
await mkdir('resume', { recursive: true });
await writeFile('resume/index.html', redirect('/#experience', 'Experience'));

/* ------------------------------------------------------------- 404 + data */

await writeFile(
  '404.html',
  page(
    `<div class="shell narrow"><header class="page-head"><p class="kicker">404</p><h1>Not mapped</h1><p class="lede">That address does not resolve. The writeups moved around when the site was reorganised — the archive is the fastest way back.</p><p class="contact-actions"><a class="button" href="/blog/">browse writeups</a><a class="button ghost" href="/">home</a></p></header></div>`,
    { title: 'Not found', description: 'Page not found.', url: '/404.html', assets },
  ),
);

const index = [
  { title: 'Home', url: '/', kind: 'page', meta: site.role, description: site.description },
  { title: 'Writeups', url: '/blog/', kind: 'page', meta: `${writeups.length} entries`, description: 'Every CTF writeup, filterable by collection, category, and difficulty.' },
  { title: 'Projects', url: '/projects/', kind: 'page', meta: `${projects.length} entries`, description: 'Security, systems, and networking projects.' },
  { title: 'English CV', url: site.cv, kind: 'file', meta: 'pdf', description: 'Résumé download.' },
  ...projects.map(project => ({ title: project.title, url: `/projects/#${project.slug}`, kind: 'project', meta: project.kicker.toLowerCase(), description: project.description })),
  ...writeups.map(entry => ({ title: entry.title, url: entry.url, kind: 'writeup', meta: `${entry.collection} · ${entry.category.toLowerCase()}`, description: entry.summary })),
];
await mkdir('static/data', { recursive: true });
await writeFile('static/data/search.json', JSON.stringify(index));

const feedItems = [...writeups]
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .slice(0, 30)
  .map(
    entry => `<item><title>${esc(entry.title)}</title><link>${site.url}${entry.url}</link><guid>${site.url}${entry.url}</guid><category>${esc(entry.category)}</category><pubDate>${new Date(entry.date).toUTCString()}</pubDate><description>${esc(entry.summary)}</description></item>`,
  )
  .join('');
await writeFile(
  'feed.xml',
  `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(site.handle)} — writeups</title><link>${site.url}</link><description>${esc(site.description)}</description><language>en</language><atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>${feedItems}</channel></rss>`,
);

await writeFile(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', '/blog/', '/projects/', ...writeups.map(entry => entry.url)]
    .map(url => `<url><loc>${site.url}${esc(url)}</loc></url>`)
    .join('')}</urlset>`,
);
await writeFile('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);

console.log(`built ${writeups.length} writeups · ${byCollection.length} collections · ${projects.length} projects · assets ${assets}`);
