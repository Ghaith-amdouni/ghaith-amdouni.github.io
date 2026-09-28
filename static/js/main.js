/* r3t0x.me — search dialog, archive filters, copy buttons. */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/* ------------------------------------------------------------ copy */

const flash = (button, text) => {
  const original = button.textContent;
  button.textContent = text;
  setTimeout(() => { button.textContent = original; }, 1400);
};

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-copy], [data-copy-email]');
  if (!button) return;
  const source = button.dataset.copyEmail
    || button.closest('figure')?.querySelector('code')?.innerText
    || button.closest('p')?.querySelector('code')?.innerText;
  if (!source) return;
  try {
    await navigator.clipboard.writeText(source.trim());
    flash(button, 'copied');
  } catch {
    flash(button, 'failed');
  }
});

/* --------------------------------------------------------- archive */

const filters = $('#filters');
if (filters) {
  const entries = $$('.entry');
  const groups = $$('.collection');
  const search = $('#filter-search');
  const count = $('#filter-count');
  const reset = $('#filter-reset');
  const empty = $('#archive-empty');
  const selects = ['collection', 'category', 'level'].map((name) => $(`#filter-${name}`));

  const apply = ({ push = true } = {}) => {
    const query = search.value.trim().toLowerCase();
    const [collection, category, level] = selects.map((select) => select.value);
    let visible = 0;

    for (const entry of entries) {
      const match =
        (collection === 'all' || entry.dataset.collection === collection) &&
        (category === 'all' || entry.dataset.category === category) &&
        (level === 'all' || entry.dataset.level === level) &&
        (!query || entry.dataset.search.includes(query));
      entry.hidden = !match;
      if (match) visible += 1;
    }

    for (const group of groups) {
      const shown = $$('.entry', group).filter((entry) => !entry.hidden).length;
      group.hidden = shown === 0;
      const badge = $('[data-group-count]', group);
      if (badge) badge.textContent = String(shown);
    }

    count.textContent = `${visible} writeup${visible === 1 ? '' : 's'}`;
    empty.hidden = visible !== 0;
    const dirty = Boolean(query) || collection !== 'all' || category !== 'all' || level !== 'all';
    reset.hidden = !dirty;

    if (!push) return;
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (collection !== 'all') params.set('collection', collection);
    if (category !== 'all') params.set('category', category);
    if (level !== 'all') params.set('level', level);
    const next = params.toString();
    history.replaceState(null, '', next ? `?${next}${location.hash}` : location.pathname + location.hash);
  };

  const params = new URLSearchParams(location.search);
  if (params.get('q')) search.value = params.get('q');
  for (const select of selects) {
    const value = params.get(select.name);
    if (value && [...select.options].some((option) => option.value === value)) select.value = value;
  }

  filters.addEventListener('submit', (event) => event.preventDefault());
  search.addEventListener('input', () => apply());
  for (const select of selects) select.addEventListener('change', () => apply());
  const clear = () => {
    search.value = '';
    for (const select of selects) select.value = 'all';
    apply();
  };
  reset.addEventListener('click', clear);
  $('#empty-reset')?.addEventListener('click', clear);
  apply({ push: false });
}

/* ---------------------------------------------------------- search */

const dialog = $('#search');
if (dialog) {
  const input = $('#search-input');
  const results = $('#search-results');
  const status = $('#search-count');
  let index = null;
  let cursor = 0;

  const load = async () => {
    if (index) return index;
    const response = await fetch('/static/data/search.json');
    index = await response.json();
    return index;
  };

  const render = (query) => {
    const needle = query.trim().toLowerCase();
    const matches = !needle
      ? index.filter((item) => item.kind === 'page')
      : index
          .filter((item) => `${item.title} ${item.meta} ${item.description}`.toLowerCase().includes(needle))
          .slice(0, 40);
    cursor = 0;
    results.innerHTML = matches
      .map(
        (item, position) =>
          `<li${position === 0 ? ' aria-selected="true"' : ''}><a href="${item.url}"><strong>${item.title}</strong><em>${item.kind}</em><small>${item.meta}</small></a></li>`,
      )
      .join('');
    status.textContent = needle
      ? `${matches.length} result${matches.length === 1 ? '' : 's'}`
      : 'start typing';
  };

  const move = (step) => {
    const items = $$('li', results);
    if (!items.length) return;
    items[cursor]?.removeAttribute('aria-selected');
    cursor = (cursor + step + items.length) % items.length;
    items[cursor].setAttribute('aria-selected', 'true');
    items[cursor].scrollIntoView({ block: 'nearest' });
  };

  const open = async () => {
    await load();
    render(input.value);
    if (!dialog.open) dialog.showModal();
    input.focus();
    input.select();
  };

  $$('[data-open-search]').forEach((button) => button.addEventListener('click', open));
  input.addEventListener('input', () => render(input.value));

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); move(1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); }
    else if (event.key === 'Enter') {
      const link = $('li[aria-selected="true"] a', results);
      if (link) { event.preventDefault(); location.href = link.getAttribute('href'); }
    }
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  addEventListener('keydown', (event) => {
    const typing = /^(input|textarea|select)$/i.test(event.target.tagName);
    if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing && !dialog.open)) {
      event.preventDefault();
      open();
    }
  });
}
