// The subset of Markdown the writeups actually use: headings, paragraphs,
// lists, quotes, fenced code, inline code, bold, and links.
import { esc, codeBlock } from './highlight.mjs';

const inline = value => {
  const held = [];
  let out = esc(value).replace(/`([^`]+)`/g, (_, code) => {
    held.push(`<code>${code}</code>`);
    return `\u0000${held.length - 1}\u0000`;
  });
  out = out
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return out.replace(/\u0000(\d+)\u0000/g, (_, index) => held[index]);
};

export function slugify(text, seen) {
  const base =
    String(text)
      .toLowerCase()
      .replace(/`/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'section';
  if (!seen) return base;
  const count = seen.get(base) || 0;
  seen.set(base, count + 1);
  return count ? `${base}-${count + 1}` : base;
}

// Returns { html, headings } so a page can build its own table of contents.
export function renderMarkdown(markdown) {
  const out = [];
  const headings = [];
  const seen = new Map();
  let paragraph = [];
  let list = null;
  let quote = [];
  let fence = null;
  let fenceLang = '';
  let fenceLines = [];

  const flushParagraph = () => {
    if (paragraph.length) out.push(`<p>${inline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.type}>${list.items.map(item => `<li>${inline(item)}</li>`).join('')}</${list.type}>`);
    list = null;
  };
  const flushQuote = () => {
    if (quote.length) out.push(`<blockquote>${inline(quote.join(' '))}</blockquote>`);
    quote = [];
  };
  const flush = () => { flushParagraph(); flushList(); flushQuote(); };

  for (const line of String(markdown).replace(/\r/g, '').split('\n')) {
    const fenceMatch = line.match(/^(```|~~~)([a-zA-Z0-9_+-]*)\s*$/);
    if (fence) {
      if (fenceMatch?.[1] === fence) {
        out.push(codeBlock(fenceLines.join('\n'), fenceLang));
        fence = null;
        fenceLang = '';
        fenceLines = [];
      } else fenceLines.push(line);
      continue;
    }
    if (fenceMatch) { flush(); fence = fenceMatch[1]; fenceLang = fenceMatch[2]; continue; }
    if (!line.trim()) { flush(); continue; }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flush();
      const depth = Math.min(4, Math.max(2, heading[1].length));
      const text = heading[2].trim();
      const id = slugify(text, seen);
      if (depth === 2) headings.push({ id, text });
      out.push(`<h${depth} id="${id}">${inline(text)}</h${depth}>`);
      continue;
    }

    const item = line.match(/^\s*(?:(\d+)\.|[-*])\s+(.+)$/);
    if (item) {
      flushParagraph();
      flushQuote();
      const type = item[1] ? 'ol' : 'ul';
      if (list?.type !== type) { flushList(); list = { type, items: [] }; }
      list.items.push(item[2]);
      continue;
    }
    if (list && /^\s{2,}\S/.test(line)) {
      list.items[list.items.length - 1] += ` ${line.trim()}`;
      continue;
    }
    if (line.startsWith('> ')) { flushParagraph(); flushList(); quote.push(line.slice(2)); continue; }

    flushList();
    flushQuote();
    paragraph.push(line.trim());
  }
  if (fence) out.push(codeBlock(fenceLines.join('\n'), fenceLang));
  flush();
  return { html: out.join('\n'), headings };
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ' };
const decode = value =>
  value.replace(/&(#\d+|#x[0-9a-fA-F]+|\w+);/g, (match, name) => {
    if (name in ENTITIES) return ENTITIES[name];
    if (name.startsWith('#x')) return String.fromCodePoint(parseInt(name.slice(2), 16));
    if (name.startsWith('#')) return String.fromCodePoint(Number(name.slice(1)));
    return match;
  });

// Archived writeups were imported with Pygments markup baked in. Strip it back
// to plain text so every code block on the site renders through codeBlock().
export function normalizeImportedHtml(html) {
  const headings = [];
  const seen = new Map();
  let out = String(html).replace(
    /<div class="codehilite">\s*<pre>([\s\S]*?)<\/pre>\s*<\/div>/g,
    (_, body) => codeBlock(decode(body.replace(/<[^>]*>/g, '')), ''),
  );
  out = out.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, text) => {
    const plain = decode(text.replace(/<[^>]*>/g, '')).trim();
    const id = slugify(plain, seen);
    headings.push({ id, text: plain });
    return `<h2 id="${id}">${text}</h2>`;
  });
  out = out.replace(/<h3>([\s\S]*?)<\/h3>/g, (_, text) => {
    const plain = decode(text.replace(/<[^>]*>/g, '')).trim();
    return `<h3 id="${slugify(plain, seen)}">${text}</h3>`;
  });
  return { html: out, headings };
}
