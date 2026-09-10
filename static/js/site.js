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
const scrollRegister = $('.scroll-address');
let scrollRegisterTimer;
const updateProgress = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  const ratio = max > 0 ? Math.min(Math.max(scrollY / max, 0), 1) : 0;
  if (progress) progress.style.width = `${ratio * 100}%`;
  if (address) address.textContent = '0x' + Math.floor(ratio * 0x7fffffff).toString(16).padStart(8, '0');
  scrollRegister?.style.setProperty('--scroll-progress', `${ratio * 100}%`);
};
addEventListener('scroll', () => {
  updateProgress();
  scrollRegister?.classList.add('is-scrolling');
  clearTimeout(scrollRegisterTimer);
  scrollRegisterTimer = setTimeout(() => scrollRegister?.classList.remove('is-scrolling'), 180);
}, { passive: true });
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
const searchCount = $('#search-count');
const searchScopeButtons = $$('[data-search-scope]');
let searchIndex = [];
let activeSearchScope = 'All';
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
  const kindOf = (item) => item.category === 'Pwn' ? 'Challenge' : item.category || 'Page';
  let matches = searchIndex.filter((item) => {
    const scopeMatch = activeSearchScope === 'All' || kindOf(item) === activeSearchScope;
    const textMatch = `${item.title} ${item.category} ${item.description || ''} ${item.collection || ''}`.toLowerCase().includes(needle);
    return scopeMatch && textMatch;
  });
  if (!needle && activeSearchScope === 'All') matches = matches.filter((item) => ['Challenge', 'Project'].includes(kindOf(item)));
  const total = matches.length;
  matches = matches.slice(0, 10);
  if (searchCount) searchCount.textContent = `${total} ${total === 1 ? 'address' : 'addresses'}`;
  searchResults.innerHTML = matches.length
    ? matches.map((item, index) => {
      const kind = kindOf(item);
      const sigil = kind === 'Challenge' ? 'PWN' : kind === 'Project' ? 'GIT' : kind === 'PDF' ? 'CV' : 'SYS';
      const address = `0x${(0x401000 + index * 0x100).toString(16)}`;
      return `<a class="search-result" data-kind="${escapeHtml(kind)}" href="${escapeHtml(item.url)}"><span class="result-address">${address}</span><span class="result-sigil">${sigil}</span><span class="result-copy"><em>${escapeHtml(kind)} // ${escapeHtml(item.collection || item.category || 'INDEX')}</em><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.description || item.collection || '')}</small></span><span class="result-arrow">↗</span></a>`;
    }).join('')
    : '<div class="search-result search-empty"><span class="result-sigil">失</span><span class="result-copy"><em>TRACE FAILED // 0x0</em><strong>No matching signature.</strong><small>Try pwn, project, Kubernetes, FACEIS, or a challenge name.</small></span></div>';
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
searchScopeButtons.forEach((button) => button.addEventListener('click', () => {
  activeSearchScope = button.dataset.searchScope;
  searchScopeButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  renderSearch(searchInput?.value || '');
  searchInput?.focus();
}));
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

// Archive jump prompt, difficulty/collection filters, sorting, and sharable URL state.
const archiveEntries = $$('.archive-entry');
const archiveSearch = $('#archive-search');
const archiveSort = $('#archive-sort');
const collectionFilter = $('#collection-filter');
const levelButtons = $$('.archive-filters [data-level]');
const resultCount = $('#result-count');
const resultHint = $('#result-hint');
const archiveEmpty = $('#archive-empty');
const archiveGroups = $$('.challenge-collection');
let activeLevel = 'All';
const normalizeMemoryAddress = (value) => {
  const match = value.trim().toLowerCase().match(/^0x([0-9a-f]+)$/);
  if (!match) return '';
  const number = Number.parseInt(match[1], 16);
  return Number.isFinite(number) ? `0x${number.toString(16).padStart(8, '0')}` : '';
};
const filterArchive = ({ updateUrl = true } = {}) => {
  if (!archiveEntries.length) return [];
  const query = (archiveSearch?.value || '').trim().toLowerCase();
  const queryAddress = normalizeMemoryAddress(query);
  const collection = collectionFilter?.value || 'All';
  let visible = archiveEntries.filter((entry) => {
    const levelMatch = activeLevel === 'All' || entry.dataset.level === activeLevel;
    const collectionMatch = collection === 'All' || entry.dataset.collection === collection;
    const text = `${entry.dataset.title} ${entry.dataset.search} ${entry.dataset.collection} ${entry.dataset.address}`.toLowerCase();
    const searchMatch = !query || text.includes(query) || (queryAddress && entry.dataset.address === queryAddress);
    const filterMatch = queryAddress ? true : levelMatch && collectionMatch;
    entry.hidden = !(filterMatch && searchMatch);
    return !entry.hidden;
  });
  const sort = archiveSort?.value;
  visible.sort((a, b) => {
    if (sort === 'az' || sort === 'za') return a.dataset.title.localeCompare(b.dataset.title) * (sort === 'za' ? -1 : 1);
    if (sort === 'difficulty-asc' || sort === 'difficulty-desc') return (Number(a.dataset.difficulty) - Number(b.dataset.difficulty)) * (sort === 'difficulty-desc' ? -1 : 1);
    return Number(a.dataset.index) - Number(b.dataset.index);
  });
  visible.forEach((entry) => {
    const group = archiveGroups.find((item) => item.dataset.collectionGroup === entry.dataset.collection);
    group?.querySelector('[data-collection-grid]')?.appendChild(entry);
  });
  archiveGroups.forEach((group) => {
    const groupCount = visible.filter((entry) => entry.dataset.collection === group.dataset.collectionGroup).length;
    group.hidden = groupCount === 0;
    const label = group.querySelector('[data-collection-count]');
    if (label) label.textContent = `${groupCount} ${groupCount === 1 ? 'challenge' : 'challenges'}`;
  });
  if (resultCount) resultCount.textContent = `${visible.length} ${visible.length === 1 ? 'challenge' : 'challenges'}`;
  if (resultHint) {
    const exact = queryAddress && archiveEntries.find((entry) => entry.dataset.address === queryAddress);
    resultHint.textContent = exact ? 'EXACT ADDRESS · ENTER TO JMP' : query && visible.length === 1 ? 'ONE TARGET · ENTER TO OPEN' : 'TYPE ADDRESS + ENTER TO JMP';
    resultHint.classList.toggle('is-match', Boolean(exact || (query && visible.length === 1)));
  }
  if (archiveEmpty) archiveEmpty.hidden = visible.length !== 0;
  if (updateUrl) {
    const params = new URLSearchParams();
    if (query) params.set('q', archiveSearch.value.trim());
    if (activeLevel !== 'All') params.set('level', activeLevel);
    if (collection !== 'All') params.set('collection', collection);
    if (sort && sort !== 'default') params.set('sort', sort);
    history.replaceState({}, '', `${location.pathname}${params.size ? `?${params}` : ''}${location.hash}`);
  }
  return visible;
};
if (archiveEntries.length) {
  const params = new URLSearchParams(location.search);
  if (archiveSearch) archiveSearch.value = params.get('q') || '';
  const requestedLevel = params.get('level');
  if (requestedLevel && levelButtons.some((button) => button.dataset.level === requestedLevel)) activeLevel = requestedLevel;
  if (collectionFilter && [...collectionFilter.options].some((option) => option.value === params.get('collection'))) collectionFilter.value = params.get('collection');
  if (archiveSort && [...archiveSort.options].some((option) => option.value === params.get('sort'))) archiveSort.value = params.get('sort');
  levelButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.level === activeLevel));
    button.addEventListener('click', () => {
      activeLevel = button.dataset.level;
      levelButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      filterArchive();
    });
  });
  archiveSearch?.addEventListener('input', () => filterArchive());
  archiveSort?.addEventListener('change', () => filterArchive());
  collectionFilter?.addEventListener('change', () => filterArchive());
  $('#reset-filters')?.addEventListener('click', () => {
    activeLevel = 'All';
    if (archiveSearch) archiveSearch.value = '';
    if (archiveSort) archiveSort.value = 'default';
    if (collectionFilter) collectionFilter.value = 'All';
    levelButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.level === 'All')));
    filterArchive();
  });
  filterArchive({ updateUrl: false });
}
$('#archive-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = (archiveSearch?.value || '').trim();
  const address = normalizeMemoryAddress(query);
  const exact = address && archiveEntries.find((entry) => entry.dataset.address === address);
  const visible = filterArchive();
  const target = exact || (query && visible.length === 1 ? visible[0] : null);
  target?.querySelector('a')?.click();
});

// Project case files can be traced by title, stack, or system without leaving the page.
const projectCases = $$('.project-case');
const projectSearch = $('#project-search');
const projectResultCount = $('#project-result-count');
const projectEmpty = $('#project-empty');
const resetProjectSearch = () => {
  if (projectSearch) projectSearch.value = '';
  filterProjects();
  projectSearch?.focus();
};
const filterProjects = () => {
  if (!projectCases.length) return;
  const query = (projectSearch?.value || '').trim().toLowerCase();
  const visible = projectCases.filter((project) => {
    const match = !query || `${project.dataset.title} ${project.dataset.search}`.toLowerCase().includes(query);
    project.hidden = !match;
    return match;
  });
  if (projectResultCount) projectResultCount.textContent = `${visible.length} ${visible.length === 1 ? 'case file' : 'case files'}`;
  if (projectEmpty) projectEmpty.hidden = visible.length !== 0;
  const clear = $('#reset-project-search');
  if (clear) clear.hidden = !query;
};
if (projectCases.length) {
  projectSearch?.addEventListener('input', filterProjects);
  $('#project-form')?.addEventListener('submit', (event) => { event.preventDefault(); filterProjects(); });
  $('#reset-project-search')?.addEventListener('click', resetProjectSearch);
  $('#reset-project-empty')?.addEventListener('click', resetProjectSearch);
  filterProjects();
}

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

// Reset animation state on bfcache restoration so native Back/Forward stays usable.
let routeTimer;
const clearRouteTransition = () => {
  clearTimeout(routeTimer);
  document.body.classList.remove('page-leaving', 'vault-opening');
  const transition = $('#archive-transition');
  transition?.classList.remove('is-active');
  transition?.removeAttribute('data-route');
};
addEventListener('pageshow', clearRouteTransition);
addEventListener('popstate', clearRouteTransition);
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
  transition.dataset.route = targetRoute === '/projects/' ? 'projects' : 'archive';
  const routeCode = $('.vault-coordinates span:last-child', transition);
  if (routeCode) routeCode.textContent = targetRoute === '/projects/' ? '0x00500000' : '0x00401000';
  document.body.classList.add('vault-opening');
  transition.classList.add('is-active');
  clearTimeout(routeTimer);
  routeTimer = setTimeout(() => location.assign(target.href), 1480);
});
