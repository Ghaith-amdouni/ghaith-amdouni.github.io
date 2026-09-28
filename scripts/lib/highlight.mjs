// A small, dependency-free highlighter. It only marks the five things that
// actually help when reading exploit code: comments, strings, numbers,
// keywords, and call sites. Anything it does not recognise is left alone.

export const esc = value =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const KEYWORDS = {
  python: `and as assert async await break class continue def del elif else except finally for
    from global if import in is lambda nonlocal not or pass raise return try while with yield
    None True False self`,
  c: `auto break case char const continue default do double else enum extern float for goto if
    inline int long register return short signed sizeof static struct switch typedef union
    unsigned void volatile while size_t ssize_t uint8_t uint16_t uint32_t uint64_t int8_t
    int16_t int32_t int64_t NULL`,
  java: `abstract boolean break byte case catch char class const continue default do double else
    enum extends final finally float for if implements import instanceof int interface long
    native new package private protected public return short static super switch synchronized
    this throw throws try void volatile while true false null var`,
  bash: `if then else elif fi for while until do done case esac function return in local export
    readonly declare source shift trap set unset`,
  asm: `mov lea push pop call ret jmp je jne jz jnz jg jl jge jle add sub mul imul div idiv xor
    and or not shl shr test cmp nop leave syscall int enter rep movs stos`,
};

const ALIASES = {
  py: 'python', python3: 'python', sh: 'bash', shell: 'bash', console: 'bash', zsh: 'bash',
  'c++': 'c', cpp: 'c', h: 'c', nasm: 'asm', x86asm: 'asm', gas: 'asm',
};

const rules = language => {
  switch (language) {
    case 'python':
      return { line: /#[^\n]*/, block: null, quotes: /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/ };
    case 'c':
    case 'java':
      return { line: /\/\/[^\n]*/, block: /\/\*[\s\S]*?\*\//, quotes: /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/, pre: language === 'c' };
    case 'bash':
      return { line: /#[^\n]*/, block: null, quotes: /"(?:\\.|[^"\\])*"|'[^']*'/ };
    case 'asm':
      return { line: /[;#][^\n]*/, block: null, quotes: /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/ };
    default:
      return null;
  }
};

export function normalizeLanguage(language = '') {
  const key = String(language).toLowerCase();
  return ALIASES[key] || key;
}

// Best-effort language detection, used for archived code blocks that never
// carried a fence label.
export function guessLanguage(source) {
  if (/^\s*(from pwn import|import pwn|#!\/usr\/bin\/env python|def \w+\(|print\()/m.test(source)) return 'python';
  if (/#include\s*[<"]|\bint\s+main\s*\(|\bvoid\s+\w+\s*\(/.test(source)) return 'c';
  if (/^\s*(public|private)\s+(static\s+)?(class|void)\b/m.test(source)) return 'java';
  if (/^\s*(\$|#)\s|^\s*pwndbg>|^\s*gdb-peda|^\s*\w+@\w+:/m.test(source)) return '';
  return '';
}

export function highlight(source, language) {
  const lang = normalizeLanguage(language);
  const rule = rules(lang);
  const keywords = KEYWORDS[lang];
  if (!rule || !keywords) return esc(source);

  const words = new Set(keywords.split(/\s+/).filter(Boolean));
  const parts = [
    rule.block?.source,
    rule.line.source,
    rule.quotes.source,
    rule.pre ? /^[ \t]*#[a-z_]+/m.source : null,
    /\b0[xXbB][0-9a-fA-F_]+\b|\b\d[\d_]*(?:\.\d+)?\b/.source,
    /[A-Za-z_$][\w$]*/.source,
  ].filter(Boolean);
  const scanner = new RegExp(parts.join('|'), 'gm');

  let out = '';
  let last = 0;
  for (const match of source.matchAll(scanner)) {
    const token = match[0];
    out += esc(source.slice(last, match.index));
    last = match.index + token.length;

    if (rule.block && token.startsWith('/*')) out += span('c', token);
    else if (token.startsWith('//') || (rule.line.test(token) && /^[#;]/.test(token) && !rule.pre)) out += span('c', token);
    else if (rule.pre && /^[ \t]*#/.test(token) && !token.includes(' ')) out += span('k', token);
    else if (/^["']/.test(token)) out += span('s', token);
    else if (/^[\d]/.test(token)) out += span('m', token);
    else if (words.has(token)) out += span('k', token);
    else if (source[last] === '(') out += span('f', token);
    else out += esc(token);
  }
  return out + esc(source.slice(last));
}

const span = (kind, token) => `<span class="t-${kind}">${esc(token)}</span>`;

// A code block with a language label and a copy button.
export function codeBlock(source, language = '', { label = '' } = {}) {
  const code = String(source).replace(/\s+$/, '');
  const lang = normalizeLanguage(language) || guessLanguage(code);
  const title = label || lang || (/^\s*(\$|#|>|pwndbg>|gdb[-\s]|\w+@[\w.-]+[:$])/m.test(code) ? 'console' : 'output');
  return `<figure class="code"><figcaption><span>${esc(title)}</span><button type="button" class="copy" data-copy>copy</button></figcaption><pre><code${lang ? ` class="language-${esc(lang)}"` : ''}>${highlight(code, lang)}</code></pre></figure>`;
}
