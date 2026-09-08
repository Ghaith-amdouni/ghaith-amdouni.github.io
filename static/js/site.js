const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const preferences = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* Private browsing can disable storage. */ } }
};

const toast = (message) => {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2200);
};

const copyText = async (value, success) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const input = document.createElement('textarea');
    input.value = value;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    if (!copied) { toast('Copy unavailable. Please select the email address or page URL.'); return; }
  }
  toast(success);
};

// UTC clock and debugger-like reading address.
const clock = $('#clock');
const updateClock = () => {
  if (!clock) return;
  clock.textContent = `${new Date().toISOString().slice(11, 19)} UTC`;
};
updateClock();
setInterval(updateClock, 1000);

const progress = $('.reading-progress');
const address = $('#scroll-address');
const updateProgress = () => {
  if (!progress) return;
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
  if (address) address.textContent = '0x' + Math.floor((max > 0 ? Math.min(scrollY / max, 1) : 0) * 0x7fffffff).toString(16).padStart(8, '0');
};
addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

// Motion is optional and the preference persists between pages.
const motionToggle = $('#motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const savedMotion = preferences.get('r3t0x-motion');
const motionOff = savedMotion ? savedMotion === 'off' : reducedMotion.matches;
document.body.classList.toggle('motion-off', motionOff);
if (motionToggle) {
  motionToggle.setAttribute('aria-pressed', String(motionOff));
  motionToggle.textContent = `Motion: ${motionOff ? 'off' : 'on'}`;
  motionToggle.addEventListener('click', () => {
    const off = !document.body.classList.contains('motion-off');
    document.body.classList.toggle('motion-off', off);
    preferences.set('r3t0x-motion', off ? 'off' : 'on');
    motionToggle.setAttribute('aria-pressed', String(off));
    motionToggle.textContent = `Motion: ${off ? 'off' : 'on'}`;
  });
}

// Reveal content in small, quiet groups.
const revealTargets = $$('.section-heading,.post-card,.award,.project-card,.project-case,.timeline-item,.certifications,.contact-section,.archive-entry,.resume-section');
revealTargets.forEach((el) => el.setAttribute('data-reveal', ''));
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -7% 0px', threshold: 0.08 });
  revealTargets.forEach((el) => observer.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add('revealed'));
}

// Fast command palette shared by every page.
const dialog = $('#search-dialog');
const searchInput = $('#site-search');
const searchResults = $('#search-results');
let searchIndex = [];
const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
const loadSearch = async () => {
  if (searchIndex.length) return searchIndex;
  try {
    const response = await fetch('/static/data/search.json');
    if (!response.ok) throw new Error('index unavailable');
    searchIndex = await response.json();
  } catch {
    searchIndex = [
      { title: 'Home', url: '/', category: 'Page', description: 'Ghaith Amdouni · r3t0x' },
      { title: 'Challenge archive', url: '/blog/', category: 'Page', description: 'MOJO-JOJO and FST binary-exploitation challenges' },
      { title: 'Projects', url: '/projects/', category: 'Page', description: 'Security, systems, DevOps, networking, and embedded case notes' },
      { title: 'Experience', url: '/#experience', category: 'Page', description: 'SecuriNets Technical Team Instructor, certifications, and experience' }
    ];
  }
  return searchIndex;
};
const renderSearch = (query = '') => {
  if (!searchResults) return;
  const needle = query.trim().toLowerCase();
  const matches = searchIndex.filter((item) => `${item.title} ${item.category} ${item.description || ''} ${item.collection || ''}`.toLowerCase().includes(needle)).slice(0, 9);
  searchResults.innerHTML = matches.length
    ? matches.map((item) => `<a class="search-result" href="${escapeHtml(item.url)}"><span class="tag">${escapeHtml(item.category || 'Page')}</span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.description || item.collection || '')}</small></span><span>↗</span></a>`).join('')
    : '<div class="search-result"><span class="red">0x0</span><span><strong>No matching address.</strong><small>Try pwn, project, resume, or a challenge name.</small></span></div>';
  $$('a[href$=".pdf"]', searchResults).forEach(link => link.setAttribute('download', ''));
};
const openSearch = async () => {
  if (!dialog || !searchInput) return;
  if (!dialog.open) dialog.showModal();
  requestAnimationFrame(() => searchInput.focus());
  await loadSearch();
  renderSearch(searchInput.value);
};
$$('[data-open-search]').forEach((button) => button.addEventListener('click', openSearch));
$$('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => dialog?.close()));
searchInput?.addEventListener('input', () => renderSearch(searchInput.value));
dialog?.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
dialog?.addEventListener('keydown', (event) => {
  const links = $$('.search-result', searchResults).filter(el => el.matches('a'));
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const current = links.indexOf(document.activeElement);
    const next = current + (event.key === 'ArrowDown' ? 1 : -1);
    (links[(next + links.length) % links.length] || searchInput).focus();
  }
  if (event.key === 'Enter' && document.activeElement === searchInput && links[0]) {
    event.preventDefault(); links[0].click();
  }
});
addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    dialog?.open ? dialog.close() : openSearch();
  }
  if (event.key === 'Escape' && dialog?.open) dialog.close();
});

// A small Arch terminal doubles as site navigation and an easter egg.
const terminalForm = $('#terminal-form');
const terminalInput = $('#terminal-input');
const terminalOutput = $('#terminal-output');
const terminalCommands = {
  help: 'commands: <span class="red">whoami</span> · neofetch · ls · blog · projects · resume · github · contact · uname · pacman · clear',
  whoami: 'Ghaith (r3t0x) — SecuriNets Technical Team Instructor, INSAT student, challenge author, CTF player.',
  neofetch: '<span class="red">OS</span> Arch Linux x86_64<br><span class="red">Shell</span> zsh<br><span class="red">Focus</span> pwn / systems / networks<br><span class="red">Status</span> <span class="green">learning</span>',
  ls: '<a href="/blog/">archive/</a> &nbsp; <a href="/projects/">projects/</a> &nbsp; <a href="/static/docs/Ghaith-Amdouni-CV-English.pdf" download>resume.pdf</a> &nbsp; <span class="muted">flag.txt</span>',
  uname: 'Linux arch 6.x.x-arch1-1 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux',
  pacman: ':: Synchronizing curiosity databases…<br><span class="green">there is nothing to do</span>',
  blog: '<a href="/blog/">Opening ~/blog →</a>',
  projects: '<a href="/projects/">Opening ~/projects →</a>',
  resume: '<a href="/static/docs/Ghaith-Amdouni-CV-English.pdf" download>Download English CV ↓</a>',
  github: '<a href="https://github.com/Ghaith-amdouni">github.com/Ghaith-amdouni ↗</a>',
  contact: '<a href="mailto:ghaith.amdouni@insat.ucar.tn">ghaith.amdouni@insat.ucar.tn ↗</a>',
  'cat flag.txt': '<span class="red">r3t0x{curiosity_is_the_real_primitive}</span>'
};
terminalForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const raw = terminalInput.value.trim();
  if (!raw) return;
  const command = raw.toLowerCase().replace(/\s+/g, ' ');
  const prompt = document.createElement('p');
  prompt.textContent = `r3t0x@arch ❯ ${raw}`;
  terminalOutput.appendChild(prompt);
  if (command === 'clear') {
    terminalOutput.innerHTML = '';
  } else {
    const line = document.createElement('p');
    line.innerHTML = terminalCommands[command] || `<span class="error">zsh: command not found: ${escapeHtml(raw)}</span>`;
    terminalOutput.appendChild(line);
  }
  while (terminalOutput.children.length > 60) terminalOutput.firstElementChild.remove();
  terminalInput.value = '';
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
});

// Archive search, categories, collections, sort, and sharable URL state.
const archiveEntries = $$('.archive-entry');
const archiveSearch = $('#archive-search');
const archiveSort = $('#archive-sort');
const collectionFilter = $('#collection-filter');
const categoryButtons = $$('.archive-filters button');
const resultCount = $('#result-count');
const archiveEmpty = $('#archive-empty');
const archiveResults = $('#archive-results');
let activeCategory = 'All';
const filterArchive = ({ updateUrl = true } = {}) => {
  if (!archiveEntries.length) return;
  const query = (archiveSearch?.value || '').trim().toLowerCase();
  const collection = collectionFilter?.value || 'All';
  let visible = archiveEntries.filter((entry) => {
    const categoryMatch = activeCategory === 'All' || entry.dataset.category === activeCategory;
    const collectionMatch = collection === 'All' || entry.dataset.collection === collection;
    const text = `${entry.dataset.title} ${entry.dataset.search} ${entry.dataset.collection}`.toLowerCase();
    const searchMatch = !query || text.includes(query);
    entry.hidden = !(categoryMatch && collectionMatch && searchMatch);
    return !entry.hidden;
  });
  const sort = archiveSort?.value;
  if (sort === 'az' || sort === 'za') {
    visible = visible.sort((a, b) => a.dataset.title.localeCompare(b.dataset.title) * (sort === 'za' ? -1 : 1));
  }
  visible.forEach((entry) => archiveResults.appendChild(entry));
  if (resultCount) resultCount.textContent = `${visible.length} ${visible.length === 1 ? 'challenge' : 'challenges'}`;
  if (archiveEmpty) archiveEmpty.hidden = visible.length !== 0;
  if (updateUrl) {
    const params = new URLSearchParams();
    if (query) params.set('q', archiveSearch.value.trim());
    if (activeCategory !== 'All') params.set('category', activeCategory);
    if (collection !== 'All') params.set('collection', collection);
    if (sort && sort !== 'default') params.set('sort', sort);
    history.replaceState({}, '', `${location.pathname}${params.size ? `?${params}` : ''}${location.hash}`);
  }
};
if (archiveEntries.length) {
  const params = new URLSearchParams(location.search);
  if (archiveSearch) archiveSearch.value = params.get('q') || '';
  const requestedCategory = params.get('category');
  if (requestedCategory && categoryButtons.some((button) => button.dataset.category === requestedCategory)) activeCategory = requestedCategory;
  if (collectionFilter && [...collectionFilter.options].some((option) => option.value === params.get('collection'))) collectionFilter.value = params.get('collection');
  if (archiveSort && [...archiveSort.options].some((option) => option.value === params.get('sort'))) archiveSort.value = params.get('sort');
  categoryButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.category === activeCategory));
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category;
      categoryButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      filterArchive();
    });
  });
  archiveSearch?.addEventListener('input', () => filterArchive());
  archiveSort?.addEventListener('change', () => filterArchive());
  collectionFilter?.addEventListener('change', () => filterArchive());
  $('#reset-filters')?.addEventListener('click', () => {
    activeCategory = 'All';
    if (archiveSearch) archiveSearch.value = '';
    if (archiveSort) archiveSort.value = 'default';
    if (collectionFilter) collectionFilter.value = 'All';
    categoryButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.category === 'All')));
    filterArchive();
  });
  filterArchive({ updateUrl: false });
}
$('#archive-form')?.addEventListener('submit', (event) => { event.preventDefault(); filterArchive(); });

// Project links open the matching case notes without creating another page.
const openLinkedProject = () => {
  if (!location.hash) return;
  const project = document.getElementById(location.hash.slice(1));
  if (!project?.matches('.project-case')) return;
  project.open = true;
  project.classList.add('revealed');
  requestAnimationFrame(() => project.scrollIntoView({block: 'start', behavior: 'instant'}));
};
addEventListener('hashchange', openLinkedProject);
openLinkedProject();
$$('[data-close-project]').forEach(button => button.addEventListener('click', () => {
  const project = button.closest('details');
  project.open = false;
  $('summary', project).focus();
  project.scrollIntoView({block: 'nearest'});
}));

$$('[data-copy-email]').forEach((button) => button.addEventListener('click', () => copyText('ghaith.amdouni@insat.ucar.tn', 'Email copied to clipboard.')));
$$('.share-post').forEach((button) => button.addEventListener('click', () => copyText(location.href, 'Article link copied.')));
$$('[data-print-resume]').forEach((button) => button.addEventListener('click', () => print()));

// Track the active article heading.
const tocLinks = $$('.article-toc nav a');
if (tocLinks.length && 'IntersectionObserver' in window) {
  const headings = tocLinks.map((link) => $(link.getAttribute('href'))).filter(Boolean);
  const tocObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      tocLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-20% 0px -68% 0px' });
  headings.forEach((heading) => tocObserver.observe(heading));
}

// Keep native navigation, downloads, and browser Back/Forward behavior.
addEventListener('pageshow', () => document.body.classList.remove('page-leaving'));
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link) return;
  if (dialog?.open) dialog.close();
  const target = new URL(link.href, location.href);
  const normalizeRoute = (pathname) => pathname.length > 1 ? `${pathname.replace(/\/$/, '')}/` : pathname;
  const targetRoute = normalizeRoute(target.pathname);
  const currentRoute = normalizeRoute(location.pathname);
  const themedRoutes = {
    '/blog/': ['ENTERING THE MEMORY VAULT', '~/archive'],
    '/projects/': ['LOADING PROJECT CASES', '~/projects']
  };
  const opensThemedRoute = target.origin === location.origin && themedRoutes[targetRoute] && targetRoute !== currentRoute;
  const skipTransition = event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank' || link.hasAttribute('download');
  if (!opensThemedRoute || skipTransition || reducedMotion.matches || document.body.classList.contains('motion-off')) return;
  event.preventDefault();
  const transition = $('#archive-transition');
  if (!transition) { location.assign(target.href); return; }
  const [label, address] = themedRoutes[targetRoute];
  const labelElement = $('#transition-label');
  const addressElement = $('#transition-address');
  if (labelElement) labelElement.textContent = label;
  if (addressElement) addressElement.textContent = address;
  document.body.classList.add('vault-opening');
  transition.classList.add('is-active');
  setTimeout(() => location.assign(target.href), 740);
});
