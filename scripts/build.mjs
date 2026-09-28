import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { posts } from '../content/posts.mjs';
import { projects } from '../content/projects.mjs';
const site = 'https://ghaith-amdouni.github.io';
const assetVersion = createHash('sha256')
  .update(await readFile('static/css/site.css'))
  .update(await readFile('static/css/akatsuki.css'))
  .update(await readFile('static/js/site.js'))
  .digest('hex').slice(0, 12);
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const summarize = s => {
  const clipped = s.length > 138 ? s.slice(0, 138).replace(/\s+\S*$/, '') : s;
  return clipped && !/[.!?…]$/.test(clipped) ? `${clipped.replace(/[\s,;:—-]+$/, '')}…` : clipped;
};
async function loadFriendly(category) {
  try {
    const entries = JSON.parse(await readFile(`content/friendly-ctf-2026-${category}.json`, 'utf8'));
    return entries.map(entry => ({
      ...entry,
      description: summarize(entry.description.replace(/\s+/g, ' ').trim()),
      url: `/challenge/securinets-friendly-ctf-2026/${category}/${entry.slug}/index.html`,
      source: 'friendly',
    }));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}
const friendlyChallenges = [
  ...await loadFriendly('misc'),
  ...await loadFriendly('pwn'),
];
const legacyChallenges = JSON.parse(await readFile('content/legacy-writeups.json', 'utf8')).map(entry => ({
  ...entry,
  description: summarize(entry.description.replace(/\s+/g, ' ').trim()) || `${entry.collection} binary-exploitation writeup.`,
}));
const challenges = [...legacyChallenges, ...friendlyChallenges];
challenges.sort((a,b) => a.collection.localeCompare(b.collection) || a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
const cloud = `<svg class="akatsuki-cloud" viewBox="0 0 160 100" aria-hidden="true"><path d="M34 78C9 80 6 52 28 47C20 24 47 13 63 28C75 3 112 12 113 37C138 27 158 51 143 69C135 79 119 80 108 76C104 91 81 91 73 79C62 89 42 91 34 78Z"/><path class="cloud-whorl" d="M28 47C52 41 68 52 62 65C57 76 39 72 41 62M113 37C93 36 85 47 90 59"/></svg>`;
const icon = `<img class="brand-eye" src="/static/img/mangekyou.png" alt="" width="32" height="32">`;
const arrow = '<span aria-hidden="true">↗</span>';
function shell(title, description, body, {url='/', active='home', type='website'}={}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0b0b0e"><title>${esc(title)} — r3t0x</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${site}${url}"><meta property="og:type" content="${type}"><meta property="og:title" content="${esc(title)} — r3t0x"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${site}${url}"><meta property="og:image" content="${site}/static/img/social-card.png"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/static/img/favicon.svg" type="image/svg+xml"><link rel="alternate" type="application/rss+xml" title="r3t0x journal" href="/feed.xml"><link rel="stylesheet" href="/static/css/site.css?v=${assetVersion}"><link rel="stylesheet" href="/static/css/akatsuki.css?v=${assetVersion}"><script src="/static/js/site.js?v=${assetVersion}" defer></script></head><body>
  <a class="skip" href="#main">Skip to content</a><div class="reading-progress" aria-hidden="true"></div>
  <div class="systembar"><div><span class="arch-mini" aria-hidden="true">Λ</span> archlinux <span class="bar-sep">/</span> r3t0x@portfolio <span class="system-workspaces" aria-hidden="true"><b>01</b> 02 03</span></div><div><span class="online-dot"></span> ALL SYSTEMS NOMINAL <span class="bar-sep">/</span> <time id="clock">UTC</time></div></div>
  <header class="site-header"><a class="brand" href="/" aria-label="r3t0x home">${icon}<span>r3t0x<span class="muted">@arch</span></span></a><nav aria-label="Main navigation"><a href="/" ${active==='home'?'aria-current="page"':''}>~/home</a><a href="/blog/" ${active==='blog'?'aria-current="page"':''}>~/archive</a><a href="/projects/" ${active==='projects'?'aria-current="page"':''}>~/projects</a><a href="/static/docs/Ghaith-Amdouni-CV-English.pdf" download>CV ↓</a></nav><button class="search-trigger" data-open-search aria-label="Search site"><span>⌕</span><kbd>Ctrl K</kbd></button></header>
  <div class="archive-transition" id="archive-transition" aria-hidden="true"><div class="route-eyelid route-eyelid-top"></div><div class="route-eyelid route-eyelid-bottom"></div><div class="vault-coordinates"><span>00:00:01</span><span>0x00401337</span></div><div class="vault-eye"><span class="vault-symbol"></span><span class="vault-reticle"></span><i></i><i></i><i></i></div><div class="vault-caption"><p><small>TSUKUYOMI ROUTE SHIFT</small><b id="transition-label">ENTERING THE MEMORY VAULT</b><span id="transition-address">~/archive</span></p></div></div>
  <div class="ambient-clouds" aria-hidden="true">${cloud}${cloud}</div><div class="scroll-address" aria-hidden="true"><b>RIP</b><span id="scroll-address">0x00000000</span><i><em></em></i><small>PTR</small></div><main id="main">${body}</main>
  <footer class="site-footer"><div class="footer-top"><a class="brand" href="/">${icon}<span>r3t0x<span class="muted">@arch</span></span></a><p>Always curious. Always one layer deeper.</p><a href="#main" class="text-link">Back to top ↑</a></div><div class="footer-bottom"><span>© ${new Date().getUTCFullYear()} Ghaith Amdouni <span class="red">·</span> Made with curiosity & caffeine.</span><div><a href="/projects/">Projects ↗</a><a href="https://github.com/Ghaith-amdouni">GitHub ↗</a><a href="https://www.linkedin.com/in/amdouni-ghaith">LinkedIn ↗</a><a href="/static/docs/Ghaith-Amdouni-CV-English.pdf" download>Résumé ↗</a><a href="/feed.xml">RSS ↗</a><button id="motion-toggle" aria-pressed="false">Motion: on</button></div></div></footer>
  <dialog id="search-dialog" class="search-vault" aria-labelledby="search-title"><div class="search-vault-mark" aria-hidden="true"><span></span><small>眼 // TRACE</small></div><div class="dialog-top"><div><span class="dialog-address">0xSEARCH_INDEX</span><h2 id="search-title">Trace a memory.</h2></div><button data-close-dialog aria-label="Close search">ESC</button></div><label for="site-search" class="search-command"><span aria-hidden="true">❯</span><span class="sr-only">Search challenges, projects, and pages</span><input id="site-search" type="search" placeholder="type a challenge, project, primitive…" autocomplete="off" spellcheck="false"></label><div class="search-scopes" role="group" aria-label="Search scope"><button type="button" data-search-scope="All" aria-pressed="true">ALL MEMORY</button><button type="button" data-search-scope="Challenge" aria-pressed="false">CHALLENGES</button><button type="button" data-search-scope="Project" aria-pressed="false">PROJECTS</button></div><div class="search-readout"><span><i></i> INDEX ONLINE</span><b id="search-count">0 addresses</b></div><div id="search-results" aria-live="polite"></div><div class="dialog-bottom"><span>↑↓ TRACE</span><span>ENTER OPEN</span><span>ESC DISMISS</span></div></dialog>
  <div class="toast" id="toast" role="status"></div></body></html>`;
}

const inlineMarkdown = value => {
  const code = [];
  let rendered = esc(value).replace(/`([^`]+)`/g, (_, source) => {
    const marker = `@@INLINE_CODE_${code.length}@@`;
    code.push(`<code>${source}</code>`);
    return marker;
  });
  rendered = rendered
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1 ↗</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  code.forEach((snippet, index) => { rendered = rendered.replace(`@@INLINE_CODE_${index}@@`, snippet); });
  return rendered;
};

function renderMarkdown(markdown) {
  const output = [];
  const paragraph = [];
  let list = null;
  let quote = [];
  let fence = null;
  let fenceLanguage = '';
  let fenceLines = [];
  const usedIds = new Map();
  const headingId = text => {
    const base = text.toLowerCase().replace(/`/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
    const count = usedIds.get(base) || 0;
    usedIds.set(base, count + 1);
    return count ? `${base}-${count + 1}` : base;
  };
  const flushParagraph = () => {
    if (paragraph.length) output.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph.length = 0;
  };
  const flushList = () => {
    if (list) output.push(`<${list.type}>${list.items.map(item => `<li>${inlineMarkdown(item)}</li>`).join('')}</${list.type}>`);
    list = null;
  };
  const flushQuote = () => {
    if (quote.length) output.push(`<blockquote><p>${inlineMarkdown(quote.join(' '))}</p></blockquote>`);
    quote = [];
  };
  const flushText = () => { flushParagraph(); flushList(); flushQuote(); };

  for (const line of markdown.replace(/\r/g, '').split('\n')) {
    const fenceMatch = line.match(/^(```|~~~)([a-zA-Z0-9_+-]*)\s*$/);
    if (fence) {
      if (fenceMatch?.[1] === fence) {
        output.push(`<pre><code${fenceLanguage ? ` class="language-${esc(fenceLanguage)}"` : ''}>${esc(fenceLines.join('\n'))}</code></pre>`);
        fence = null;
        fenceLanguage = '';
        fenceLines = [];
      } else fenceLines.push(line);
      continue;
    }
    if (fenceMatch) {
      flushText();
      fence = fenceMatch[1];
      fenceLanguage = fenceMatch[2];
      continue;
    }
    if (!line.trim()) {
      flushText();
      continue;
    }
    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      flushText();
      const level = Math.min(4, heading[1].length + 1);
      output.push(`<h${level} id="${headingId(heading[2])}">${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    const listItem = line.match(/^\s*(?:(\d+)\.|-)\s+(.+)$/);
    if (listItem) {
      flushParagraph();
      flushQuote();
      const type = listItem[1] ? 'ol' : 'ul';
      if (list?.type !== type) { flushList(); list = { type, items: [] }; }
      list.items.push(listItem[2]);
      continue;
    }
    if (list && /^\s{2,}\S/.test(line)) {
      list.items[list.items.length - 1] += ` ${line.trim()}`;
      continue;
    }
    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      quote.push(line.slice(2));
      continue;
    }
    flushList();
    flushQuote();
    paragraph.push(line.trim());
  }
  if (fence) output.push(`<pre><code>${esc(fenceLines.join('\n'))}</code></pre>`);
  flushText();
  return output.join('\n');
}

const difficultyLabel = difficulty => difficulty <= 2 ? 'easy' : difficulty === 3 ? 'medium' : 'hard';

async function buildChallengeWriteup(challenge) {
  const url = challenge.url.replace(/index\.html$/, '');
  // Imported archive HTML uses h2 for its own sections; the generated Friendly CTF
  // pages render walkthrough headings at h3. Shift them down so both match.
  const walkThrough = challenge.writeupHtml
    ? challenge.writeupHtml.replace(/<(\/?)h3\b/g, '<$1h4').replace(/<(\/?)h2\b/g, '<$1h3')
    : renderMarkdown(challenge.writeup);
  const tags = challenge.tags?.length ? challenge.tags.map(tag => `<span>${esc(tag)}</span>`).join('') : `<span>${esc(challenge.category.toLowerCase())}</span>`;
  const pointsLine = challenge.points ? `${esc(challenge.points)} points` : 'archived challenge';
  const pointsFact = challenge.points ? esc(challenge.points) : 'Archived';
  const body = `<article class="wrap article-page writeup-page">
    <a class="text-link" href="/blog/?collection=${encodeURIComponent(challenge.collection)}">← Back to the archive</a>
    <header class="article-heading"><p class="eyebrow">${esc(challenge.collection)} <span>/</span> ${esc(challenge.category)} WRITEUP</p><h1>${esc(challenge.title)}</h1><p>${esc(challenge.description)}</p>
      <div class="article-author"><img src="/static/img/ghaith.webp" alt="" width="44" height="44"><span><strong>${esc(challenge.author)}</strong><small>${esc(challenge.date)} · ${pointsLine} · ${difficultyLabel(challenge.difficulty)}</small></span><a class="button" href="#solver">Jump to solver ↓</a></div>
    </header>
    <div class="writeup-facts" aria-label="Challenge metadata"><span><small>EVENT</small>${esc(challenge.collection)}</span><span><small>CATEGORY</small>${esc(challenge.category)}</span><span><small>DIFFICULTY</small>${difficultyLabel(challenge.difficulty)}</span><span><small>POINTS</small>${pointsFact}</span></div>
    <div class="writeup-tags">${tags}</div>
    <div class="article-layout">
      <div class="prose writeup-prose"><h2 id="summary">Summary</h2><p class="lead">${esc(challenge.description)}</p><h2 id="walkthrough">Walkthrough</h2>${walkThrough}<h2 id="solver">Reference solver</h2><p>The complete solver used to validate the challenge:</p><pre><code class="language-${challenge.solverLanguage}">${esc(challenge.solver.trim().replace(/[ \t]+$/gm, ''))}</code></pre><h2 id="flag">Flag</h2><pre class="flag-output"><code>${esc(challenge.flag)}</code></pre>
      <div class="article-end"><span>Published ${esc(challenge.date)} · by ${esc(challenge.author)}</span><a class="text-link" href="/blog/?collection=${encodeURIComponent(challenge.collection)}">More ${esc(challenge.collection)} writeups ↗</a></div></div>
    </div>
  </article>`;
  const directory = challenge.url.slice(1).replace(/\/index\.html$/, '');
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/index.html`, shell(`${challenge.title} · ${challenge.category} writeup`, challenge.description, body, { url, active: 'blog', type: 'article' }));
}

// Every collection renders through the same writeup template so the FST Bootcamp
// and MOJO-JOJO pages match the Friendly CTF ones.
for (const challenge of challenges) await buildChallengeWriteup(challenge);

function art(post) {
  if(post.art==='pipeline') return `<div class="post-art pipeline-art" aria-hidden="true"><span>git push</span><i>→</i><span>build</span><i>→</i><span class="art-active">deploy <b>✓</b></span><small>STATUS: ALL CHECKS PASSED</small></div>`;
  if(post.art==='network') return `<div class="post-art network-art" aria-hidden="true"><span>◉</span><i>······</i><span>◈</span><i>······</i><span>◉</span><small>source → relay → destination</small></div>`;
  return `<div class="post-art hello-art" aria-hidden="true"><span class="ghost-code">48 65 6c 6c 6f 20 77 6f 72 6c 64</span><strong><span>./</span>hello_world<span class="cursor">_</span></strong><small>PROCESS STARTED. CURIOSITY LOADED.</small></div>`;
}
const postUrl = post => post.slug === 'taskmanager' ? '/projects/#taskpilot-devops' : post.slug === 'network-simulations' ? '/projects/#omnetpp-mesh-5g' : '/#about';
function postCard(post) { return `<a class="post-card" href="${postUrl(post)}">${art(post)}<div class="post-card-body"><div class="post-meta"><span class="tag">${post.category}</span><span>${new Date(post.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'})} · project note</span></div><h3>${post.title}</h3><p>${post.description}</p></div></a>`; }
const heading=(n,title,sub,link='')=>`<div class="section-heading"><div><p class="eyebrow">${n} <span>/</span> ${sub}</p><h2>${title}</h2></div>${link}</div>`;
const awards = [ ['01','SecuriNets ISI','National finals'], ['01','SecuriNets ISI','Qualifications'], ['01','Friendly CTF ENIT','Competition'], ['04','SecuriNets International','Qualifications · Africa'], ['07','SecuriNets International','International finals'], ['08','Claw The Flag','Top 8 finish'] ];
const homeProjects = projects.filter(project => project.featured);
const home = `<section class="hero wrap"><div class="hero-copy"><p class="eyebrow"><span class="online-dot"></span> AKATSUKI SPIRIT. DEBUGGER MIND.</p><h1><span class="hero-prefix">./</span>r3t0x<span class="cursor">_</span></h1><h2>Ghaith Amdouni<span class="red">.</span></h2><p class="hero-role">Binary exploitation <span>×</span> Systems <span>×</span> Curiosity</p><p class="hero-description">I pull things apart to understand how they work.<br>SecuriNets Technical Team Instructor, CTF player, and Networks & Telecommunications student at INSAT.</p><div class="hero-actions"><a class="button primary" href="/blog/">Explore the archive <span>↗</span></a><a class="button" href="/static/docs/Ghaith-Amdouni-CV-English.pdf" download>English CV <span>↓</span></a></div><div class="hero-links"><a href="https://github.com/Ghaith-amdouni">GitHub ↗</a><a href="https://www.linkedin.com/in/amdouni-ghaith">LinkedIn ↗</a><a href="mailto:ghaith.amdouni@insat.ucar.tn">Email ↗</a><span><span class="online-dot"></span> Tunis, Tunisia</span></div></div>
  <div class="hero-visual"><img class="hero-sharingan" src="/static/img/mangekyou.png" width="290" height="290" alt="" aria-hidden="true"><div class="orbit orbit-one" aria-hidden="true"></div><div class="orbit orbit-two" aria-hidden="true"></div><span class="visual-addr" aria-hidden="true">0x00401337 · rwx</span><div class="portrait-window"><div class="window-title"><span class="window-dots"><i></i><i></i><i></i></span><span>~/r3t0x/whoami</span><span class="red">暁</span></div><div class="portrait-image"><img src="/static/img/ghaith.webp" alt="Ghaith Amdouni working on his laptop at a technology event" width="800" height="1200" fetchpriority="high"><div class="portrait-caption"><span><i class="online-dot"></i> GHAITH AMDOUNI</span><span>aka. r3t0x</span></div></div><div class="portrait-bottom"><span><b>OS</b> Arch Linux</span><span><b>FOCUS</b> Pwn & systems</span></div></div><div class="floating-tag"><span class="red">❯</span> curiosity <span class="muted">--always</span><span class="cursor">▌</span></div></div></section>
  <div class="specialties"><div class="wrap"><span><i>01</i> BINARY EXPLOITATION</span><b>✳</b><span><i>02</i> REVERSE ENGINEERING</span><b>✳</b><span><i>03</i> NETWORKS & SYSTEMS</span><b>✳</b><span><i>04</i> ARCH LINUX</span></div></div>
  <section class="section wrap" id="journal">${heading('01','The latest bytes.','THE JOURNAL',`<a class="text-link" href="/blog/">View the archive ${arrow}</a>`)}<div class="posts-grid">${posts.map(postCard).join('')}</div><a class="archive-callout" href="/blog/"><div><span class="red">❯</span> <strong>Looking for CTF writeups?</strong><span class="muted"> ${challenges.length} challenges across Friendly CTF, MOJO-JOJO CTF, and FST Bootcamp.</span></div><span>Open archive ↗</span></a></section>
  <section class="section wrap" id="about">${heading('02','More than a handle.','WHOAMI')}<div class="about-grid"><div class="about-copy"><p class="large-copy">Somewhere between a packet trace and a debugger, <span>I feel at home.</span></p><p>I'm a SecuriNets Technical Team Instructor and a Networks & Telecommunications student at <a href="https://insat.rnu.tn/">INSAT</a>, based in Tunis. My work connects cybersecurity, Linux, networking, and software development.</p><p>I build challenges, compete in CTFs, and explore the layers underneath the interface. From network simulations to cloud-native applications, I like understanding the whole system.</p><div class="skill-tags"><span>Binary exploitation</span><span>C / C++</span><span>Python</span><span>Linux</span><span>Docker</span><span>Kubernetes</span><span>Networking</span><span>DevSecOps</span></div><a class="text-link" href="/static/docs/Ghaith-Amdouni-CV-English.pdf" download>Download my English CV ↓</a></div>
  <div class="terminal"><div class="window-title"><span class="window-dots"><i></i><i></i><i></i></span><span>r3t0x@arch: ~</span><span>zsh</span></div><div class="terminal-content"><div class="terminal-fetch"><pre class="arch-ascii" aria-hidden="true">       /\\
      /  \\
     /\\   \\
    /      \\
   /   ,,   \\
  /   |  |   \\
 /_-''    ''-_\\</pre><div><strong>r3t0x<span class="muted">@</span>arch</strong><span class="muted">──────────────────</span><span><b>name</b> Ghaith Amdouni</span><span><b>location</b> Tunis, TN</span><span><b>education</b> INSAT</span><span><b>interests</b> pwn, systems</span><span class="terminal-swatches" aria-hidden="true">▅▅▅▅▅▅</span></div></div><div id="terminal-output" class="terminal-output" role="log" aria-live="polite"><p class="muted">Welcome to my corner of the internet.<br>Type <span class="red">help</span> to look around.</p></div><form id="terminal-form"><label for="terminal-input"><span class="red">r3t0x</span><span class="muted">@arch</span> <span class="green">❯</span></label><input id="terminal-input" aria-label="Terminal command" placeholder="help" autocomplete="off" spellcheck="false" maxlength="120"></form></div></div></div></section>
  <section class="section wrap" id="achievements">${heading('03','Capture flags. Leave a mark.','CTF ACHIEVEMENTS')}<div class="awards-grid">${awards.map(([rank,name,detail])=>`<div class="award"><div class="award-rank ${rank==='01'?'gold':''}"><span>#</span>${rank}</div><div><h3>${name}</h3><p>${detail}</p></div><span class="award-star" aria-hidden="true">✧</span></div>`).join('')}</div></section>
  <section class="section wrap" id="projects">${heading('04','Built from curiosity.','SELECTED PROJECTS',`<a class="text-link" href="/projects/">View every project ${arrow}</a>`)}<div class="projects-grid">${homeProjects.map(project=>`<article class="project-card"><p class="eyebrow">${project.kicker}</p><h3>${project.title}</h3><p>${project.description}</p><div class="project-tech">${project.stack.join(' / ')}</div><a class="text-link" href="/projects/#${project.slug}">Read project notes ↗</a></article>`).join('')}</div></section>
  <section class="section wrap" id="experience">${heading('05','The journey so far.','EXPERIENCE & LEARNING')}<div class="experience-grid"><div><article class="timeline-item"><span class="timeline-dot"></span><p class="eyebrow">CURRENT ROLE</p><h3>Technical Team Instructor</h3><p class="company">SecuriNets</p><p>Teach technical workshops and guide learners through practical cybersecurity and binary-exploitation material.</p></article><article class="timeline-item"><span class="timeline-dot"></span><p class="eyebrow">01 — 31 AUG 2026</p><h3>Digital Forensics Police Internship</h3><p class="company">FACEIS · AI & Security Engineering</p><p>Designed and built a facial investigation platform combining RetinaFace detection, ArcFace embeddings, FAISS similarity search, role-based access, and audited investigation workflows.</p><a class="text-link" href="/projects/#faceis">Read the FACEIS case notes ↗</a></article><article class="timeline-item"><span class="timeline-dot"></span><p class="eyebrow">JUN — AUG 2024</p><h3>Web Development Intern / Collaborator</h3><p class="company">Zedka Services</p><p>Contributed to development and maintenance of the MSJVerre website, working across the front end and back end, page optimization, content integration, and technical configuration.</p></article><article class="timeline-item"><span class="timeline-dot"></span><p class="eyebrow">EDUCATION</p><h3>Networks & Telecommunications</h3><p class="company">INSAT · Tunis</p><p>Student at the National Institute of Applied Science and Technology, with interests spanning cybersecurity, networking, and software development.</p></article></div><div class="certifications"><p class="eyebrow">CONTINUOUS LEARNING</p><h3>Credentials, collected.</h3><ul><li><span>CCNA: Introduction to Networks</span><small>Cisco</small></li><li><span>CCNA: Switching, Routing & Wireless Essentials</span><small>Cisco</small></li><li><span>Google Cybersecurity</span><small>Coursera</small></li><li><span>CS50's Introduction to Computer Science</span><small>Harvard</small></li><li><span>Certified Red Team Operations Management</span></li></ul><a class="text-link" href="https://www.credly.com/users/ghaith-amdouni">View Credly profile ↗</a></div></div></section>
  <section class="contact-section wrap" id="contact"><div><p class="eyebrow"><span class="online-dot"></span> LET'S CONNECT</p><h2>Have something<br>interesting in mind<span class="red">?</span></h2><p>Projects, CTFs, systems, or a good conversation. My inbox is open.</p></div><div class="contact-actions"><a class="button primary" href="mailto:ghaith.amdouni@insat.ucar.tn">Say hello ↗</a><button class="button" data-copy-email>Copy email ⧉</button><a class="text-link" href="/static/docs/Ghaith-Amdouni-CV-English.pdf" download>Download English CV ↓</a></div></section>
  <section class="wrap visitor-telemetry" aria-label="Site visits"><div class="telemetry-copy"><p class="eyebrow"><span class="online-dot"></span> VISITOR TELEMETRY</p><code><b>$</b> tail -f /var/log/visitor.signals</code><div class="visit-seal"><span class="visit-kana" aria-hidden="true">暁</span><div><small>OUTSIDER SIGNAL COUNT</small><img src="https://hits.sh/ghaith-amdouni.github.io.svg?view=total&amp;style=flat-square&amp;label=visits&amp;color=f04450&amp;labelColor=111116" alt="Live visit count" width="96" height="20"></div><i aria-hidden="true"></i></div></div><div class="telemetry-radar" aria-hidden="true"><div class="radar-eye"><img src="/static/img/mangekyou.png" alt="" width="110" height="110"><i></i><i></i><i></i></div><div class="packet-log"><span>GET / HTTP/2</span><b>200 OK</b><span>source&nbsp; anonymous</span><span>cookies&nbsp; 0</span></div></div><p class="telemetry-privacy"><b>ZERO-COOKIE CHANNEL</b><span>No identity. No tracking. Just a pulse from the outside world.</span></p></section>`;
await writeFile('index.html',shell('Ghaith Amdouni · Binary exploitation & systems','The personal blog and portfolio of Ghaith Amdouni (r3t0x). CTF challenges, Linux, networking, and projects.',home));
// Keep old résumé bookmarks working; the full portfolio now lives on the home page.
await mkdir('resume', {recursive:true});
await writeFile('resume/index.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=/#experience"><link rel="canonical" href="${site}/"><title>Experience · Ghaith Amdouni</title></head><body><p>The résumé is now part of the <a href="/#experience">main portfolio</a>. <a href="/static/docs/Ghaith-Amdouni-CV-English.pdf" download>Download the English CV</a>.</p></body></html>`);

function projectCase(project, index) {
  const address = `0x${(0x5000 + index * 0x100).toString(16).padStart(8,'0')}`;
  return `<details id="${project.slug}" class="project-case" data-title="${esc(project.title)}" data-search="${esc(`${project.description} ${project.kicker} ${project.stack.join(' ')}`)}">
    <summary><div class="project-case-head" aria-hidden="true"><span><small>CASE</small><b>${address}</b></span><span>#${String(index+1).padStart(2,'0')}</span></div><div class="project-case-copy"><div class="entry-meta"><span class="tag">${project.kicker}</span><span class="source-status"><i></i> Source available</span></div><h2>${project.title}</h2><p>${project.description}</p><div class="project-stack">${project.stack.map(item=>`<span>${item}</span>`).join('')}</div><div class="note-toggle"><span>Open project notes</span><span aria-hidden="true">＋</span></div></div></summary>
    <div class="prose project-note-body">${project.body}<div class="project-note-actions"><a class="button primary" href="${project.repo}">View source on GitHub ↗</a><button class="button" data-close-project>Close notes ↑</button></div></div>
  </details>`;
}
const projectsBody = `<div class="wrap projects-page"><a class="text-link" href="/">← Back to home</a><div class="projects-hero"><div><p class="eyebrow">~/PROJECTS <span>/</span> BUILT SYSTEMS</p><h1>Ideas that<br>made it to code<span class="red">.</span></h1><p>Security research, exploit development, infrastructure, networks, and embedded systems—selected from my public GitHub work.</p></div><div class="project-orbit" aria-hidden="true"><img src="/static/img/mangekyou.png" alt="" width="260" height="260"><code>git log --author=r3t0x</code></div></div><div class="projects-intro"><p>Each card opens its notes here, keeping the site focused while still showing the engineering behind the repository.</p><a class="text-link" href="https://github.com/Ghaith-amdouni?tab=repositories">All repositories on GitHub ↗</a></div><form class="project-trace" id="project-form" role="search"><label><span class="trace-prompt" aria-hidden="true">❯</span><span class="sr-only">Search projects</span><input type="search" id="project-search" placeholder="trace by project, stack, or system…" autocomplete="off" spellcheck="false"></label><div class="trace-status"><span><i></i> REPOSITORY INDEX</span><b id="project-result-count">${projects.length} case files</b><button type="button" id="reset-project-search" hidden>CLEAR ×</button></div></form><div class="project-case-grid" id="project-results">${projects.map(projectCase).join('')}</div><div id="project-empty" class="project-empty" hidden><span>失</span><h2>No project signature found.</h2><p>Try a stack such as Python, Kubernetes, C, or IoT.</p><button class="button" id="reset-project-empty">Reset trace ↺</button></div></div>`;
await mkdir('projects',{recursive:true});
await writeFile('projects/index.html',shell('Projects','Selected security, systems, DevOps, networking, and embedded projects by Ghaith Amdouni.',projectsBody,{url:'/projects/',active:'projects'}));

function challengeCard(c, i) {
  const address = '0x' + (0x401000 + i * 0x100).toString(16).padStart(8, '0');
  const level = ['','Entry','Getting started','Intermediate','Advanced','Expert'][c.difficulty] || 'Challenge';
  const tier = c.difficulty <= 2 ? 'entry' : c.difficulty === 3 ? 'intermediate' : 'advanced';
  const detail = c.points ? `${c.points} pts · ${level}` : level;
  const categoryClass = c.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `<article class="archive-entry challenge-card" data-index="${i}" data-title="${esc(c.title)}" data-category="${esc(c.category)}" data-collection="${esc(c.collection)}" data-search="${esc(c.description)}" data-address="${address}" data-difficulty="${c.difficulty}" data-level="${tier}">
    <a href="${c.url}" aria-labelledby="challenge-title-${i}">
      <div class="challenge-card-art" aria-hidden="true"><span class="card-address"><small>ENTRY</small><b>${address}</b></span><span class="card-collection">#${String(i+1).padStart(2,'0')}</span></div>
      <div class="challenge-card-content"><div class="entry-meta"><span class="tag ${categoryClass}">${esc(c.category)}</span><span>${detail}</span></div>
      <h2 id="challenge-title-${i}">${esc(c.title)}<span class="function-suffix">()</span></h2>
      <p>${esc(c.description)}</p>
      <div class="challenge-card-footer"><span>Open writeup</span><span aria-hidden="true">↗</span></div></div>
    </a>
  </article>`;
}
const difficultyFilters = [
  ['All','All levels',challenges.length],
  ['entry','Entry',challenges.filter(c=>c.difficulty<=2).length],
  ['intermediate','Intermediate',challenges.filter(c=>c.difficulty===3).length],
  ['advanced','Advanced',challenges.filter(c=>c.difficulty>=4).length]
];
const collectionDescriptions = {
  'FST Bootcamp': 'Binary-exploitation training labs created for the FST Bootcamp.',
  'MOJO-JOJO CTF': 'Original pwn challenges authored for the MOJO-JOJO CTF collection.',
  'Securinets Friendly CTF 2026': 'Official misc and pwn walkthroughs from Securinets Friendly CTF 2026.'
};
const challengeCollections = [...new Set(challenges.map(challenge => challenge.collection))].map((collection, collectionIndex) => {
  const entries = challenges.map((challenge, index) => ({challenge, index})).filter(item => item.challenge.collection === collection);
  const slug = collection.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const categories = [...new Set(entries.map(({ challenge }) => challenge.category))];
  const grids = categories.length === 1
    ? `<div class="archive-card-grid" data-collection-grid data-category-grid="${esc(categories[0])}">${entries.map(({challenge,index}) => challengeCard(challenge,index)).join('')}</div>`
    : `<div class="archive-category-tracks">${categories.map((category, categoryIndex) => {
      const categoryEntries = entries.filter(({ challenge }) => challenge.category === category);
      return `<section class="archive-category-track" data-category-track="${esc(category)}"><header class="category-track-heading"><div><p>CATEGORY // ${String(categoryIndex + 1).padStart(2, '0')}</p><h3>${esc(category)}</h3></div><span data-category-count>${categoryEntries.length} writeups</span></header><div class="archive-card-grid" data-collection-grid data-category-grid="${esc(category)}">${categoryEntries.map(({challenge,index}) => challengeCard(challenge,index)).join('')}</div></section>`;
    }).join('')}</div>`;
  return `<section class="challenge-collection" data-collection-group="${esc(collection)}" aria-labelledby="collection-${slug}"><header class="collection-heading"><div><p>COLLECTION // ${String(collectionIndex + 1).padStart(2,'0')}</p><h2 id="collection-${slug}">${esc(collection)}</h2></div><p>${collectionDescriptions[collection] || 'CTF challenge writeups and reference solvers.'}</p><span data-collection-count>${entries.length} challenges</span></header>${grids}</section>`;
}).join('');
const categoryOptions = [...new Set(challenges.map(challenge => challenge.category))].sort().map(category => `<option>${esc(category)}</option>`).join('');
const collectionOptions = [...new Set(challenges.map(challenge => challenge.collection))].map(collection => `<option>${esc(collection)}</option>`).join('');
const archiveBody = `<div class="wrap archive-page">
  <a class="text-link" href="/">← Back to home</a>
  <div class="archive-hero"><div><p class="eyebrow">~/ARCHIVE <span>/</span> MEMORY MAP</p><h1>Challenge<br>archive<span class="red">.</span></h1><p class="archive-lede">CTF writeups, complete solvers, and original labs organized by event, category, and difficulty.</p></div><div class="archive-sigil" aria-hidden="true"><img src="/static/img/mangekyou.png" alt="" width="180" height="180"></div></div>
  <form class="archive-toolbar" id="archive-form" role="search"><label class="archive-search"><span class="archive-opcode" aria-hidden="true">jmp *</span><span class="sr-only">Search by challenge name or memory address</span><input type="search" id="archive-search" name="q" placeholder="0x00401000 or challenge name" autocomplete="off" spellcheck="false"><kbd>ENTER</kbd></label><label class="sort-control"><span>SORT //</span><select id="archive-sort" name="sort"><option value="default">Memory order</option><option value="difficulty-asc">Difficulty: low first</option><option value="difficulty-desc">Difficulty: high first</option><option value="az">Title: A–Z</option><option value="za">Title: Z–A</option></select></label></form>
  <div class="archive-filterbar"><div class="archive-filters" role="group" aria-label="Filter difficulty"><span>Difficulty</span>${difficultyFilters.map(([id,label,count],i)=>`<button type="button" data-level="${id}" aria-pressed="${i===0}">${label}<span>${count}</span></button>`).join('')}</div><div class="archive-selects"><label class="collection-control"><span>Category</span><select id="category-filter"><option value="All">All categories</option>${categoryOptions}</select></label><label class="collection-control"><span>Collection</span><select id="collection-filter"><option value="All">All collections</option>${collectionOptions}</select></label></div></div>
  <div class="archive-readout"><span id="result-hint">TYPE ADDRESS + ENTER TO JMP</span><b id="result-count" role="status">${challenges.length} challenges</b></div>
  <div id="archive-results" class="archive-collections">${challengeCollections}</div>
  <div id="archive-empty" hidden><span class="red">0x00000000</span><h2>No matching bytes.</h2><p>Try another search or reset the filters.</p><button class="button" id="reset-filters">Reset filters ↺</button></div>
</div>`;
await mkdir('blog',{recursive:true});
await writeFile('blog/index.html',shell('The challenge archive','Explore Ghaith Amdouni’s CTF writeups, reference solvers, and original challenge collections.',archiveBody,{url:'/blog/',active:'blog'}));
// Older note URLs stay compatible after project notes move to ~/projects.
for (const p of posts) {
  const target = postUrl(p);
  await mkdir(`blog/${p.slug}`, {recursive:true});
  await writeFile(`blog/${p.slug}/index.html`, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${target}"><link rel="canonical" href="${site}${target}"><title>${esc(p.title)}</title></head><body><a href="${target}">Continue to ${esc(p.title)}</a></body></html>`);
}
await writeFile('404.html',shell('404 · Address not mapped','This address is not mapped. Return to the r3t0x archive.',`<section class="wrap error-page"><p class="eyebrow">SEGMENT NOT FOUND</p><h1>0x<span class="red">404</span></h1><h2>This address isn't mapped.</h2><p>The page may have moved. Let's get you back to a known location.</p><div class="hero-actions"><a class="button primary" href="/">Return home ↗</a><a class="button" href="/blog/">Browse the archive</a></div></section>`,{url:'/404.html'}));
const pages=[{title:'Home',url:'/',category:'Page',description:'Ghaith Amdouni · r3t0x'},{title:'About Ghaith',url:'/#about',category:'Page',description:'Biography and interactive terminal'},{title:'Projects',url:'/projects/',category:'Page',description:'Security, systems, DevOps, networking, and embedded project notes'},{title:'SecuriNets · Experience',url:'/#experience',category:'Page',description:'Technical Team Instructor · experience and certifications'},{title:'English CV · Download',url:'/static/docs/Ghaith-Amdouni-CV-English.pdf',category:'PDF',description:'Ghaith Amdouni’s English résumé'},{title:'Challenge archive',url:'/blog/',category:'Page',description:'Browse CTF writeups, complete solvers, and original challenge collections'},...projects.map(project=>({title:project.title,url:`/projects/#${project.slug}`,category:'Project',description:project.description})),...posts.map(p=>({...p,body:undefined,url:postUrl(p)})),...challenges.map(({title,url,category,collection,description,difficulty})=>({title,url,category,collection,description,difficulty}))];
await mkdir('static/data',{recursive:true}); await writeFile('static/data/search.json',JSON.stringify(pages));
await writeFile('feed.xml',`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>r3t0x · Ghaith Amdouni</title><link>${site}</link><description>Notes on systems, networking, and projects.</description><language>en</language><atom:link href="${site}/feed.xml" rel="self" type="application/rss+xml"/>${posts.map(p=>`<item><title>${esc(p.title)}</title><link>${site}${postUrl(p)}</link><guid>${site}${postUrl(p)}</guid><pubDate>${new Date(p.date).toUTCString()}</pubDate><description>${esc(p.description)}</description></item>`).join('')}</channel></rss>`);
await writeFile('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/','/blog/','/projects/',...challenges.map(c=>c.url)].map(u=>`<url><loc>${site}${esc(u)}</loc></url>`).join('')}</urlset>`);
await writeFile('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`);
console.log(`Built Home, ${challenges.length}-card Challenge Archive, and ${projects.length}-case Projects page, plus compatibility redirects, search, RSS, and sitemap.`);
