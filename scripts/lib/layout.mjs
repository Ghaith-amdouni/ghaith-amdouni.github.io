// The page shell: head metadata, masthead, footer, search dialog.
import { esc } from './highlight.mjs';
import { site, nav } from '../../content/site.mjs';

const year = new Date().getUTCFullYear();

const mark = (size = 20) =>
  `<img class="mark" src="/static/img/mangekyou.png" alt="" width="${size}" height="${size}" loading="lazy" decoding="async">`;

const navLinks = active =>
  nav
    .map(item => `<a href="${item.href}"${item.key === active ? ' aria-current="page"' : ''}>${item.label}</a>`)
    .join('') + `<a href="${site.cv}" download>cv</a>`;

export function page(body, { title, description, url = '/', active = 'home', type = 'website', assets = '' } = {}) {
  const fullTitle = url === '/' ? `${site.name} — ${site.role}` : `${title} — ${site.handle}`;
  const summary = description || site.description;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0c0c0e">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(summary)}">
<meta name="author" content="${esc(site.name)}">
<link rel="canonical" href="${site.url}${url}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(summary)}">
<meta property="og:url" content="${site.url}${url}">
<meta property="og:image" content="${site.url}/static/img/social-card.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/static/img/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${esc(site.handle)} — writeups" href="/feed.xml">
<link rel="stylesheet" href="/static/css/main.css?v=${assets}">
<script src="/static/js/main.js?v=${assets}" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="masthead">
  <div class="shell">
    <a class="brand" href="/">${mark()}<span>${esc(site.handle)}</span></a>
    <nav aria-label="Main">${navLinks(active)}</nav>
    <button type="button" class="search-open" data-open-search aria-label="Search the site">search<kbd>/</kbd></button>
  </div>
</header>
<main id="main">${body}</main>
<footer class="colophon">
  <div class="shell">
    <p><strong>${esc(site.name)}</strong> · ${esc(site.role)} · ${esc(site.location)}</p>
    <nav aria-label="Elsewhere">${site.links.map(link => `<a href="${link.href}">${link.label}</a>`).join('')}<a href="mailto:${site.email}">email</a></nav>
    <p class="fine">© ${year} ${esc(site.name)} · <a href="https://github.com/Ghaith-amdouni/ghaith-amdouni.github.io">site source</a><img class="hits" src="https://hits.sh/r3t0x.me.svg?view=total&style=flat-square&label=visits&color=161619&labelColor=0c0c0e" alt="" width="88" height="20" loading="lazy"></p>
  </div>
</footer>
<dialog id="search" aria-label="Search">
  <form method="dialog" class="search-head">
    <label for="search-input"><span aria-hidden="true">&gt;</span><span class="sr-only">Search writeups, projects and pages</span></label>
    <input id="search-input" type="search" placeholder="search writeups, projects, pages" autocomplete="off" spellcheck="false">
    <button value="close" aria-label="Close search">esc</button>
  </form>
  <ul id="search-results"></ul>
  <p class="search-foot"><span id="search-count">start typing</span><span>&uarr;&darr; move · enter open</span></p>
</dialog>
</body>
</html>`;
}

export function redirect(target, title) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0;url=${target}">
<link rel="canonical" href="${site.url}${target}">
<title>${esc(title)}</title>
</head>
<body><p>Moved to <a href="${target}">${esc(target)}</a>.</p></body>
</html>`;
}
