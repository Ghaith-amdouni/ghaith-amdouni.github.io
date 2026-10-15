import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [sourceRoot] = process.argv.slice(2);
if (!sourceRoot) {
  throw new Error('usage: node scripts/import-enit-friendly-pwn.mjs <pwn-root>');
}

const output = 'content/securinets-enit-friendly-2026-pwn.json';
const collection = 'Securinets ENIT Friendly CTF 2026';
const publicationDate = '2026-10-15';

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
  if (points <= 250) return 2;
  if (points <= 500) return 3;
  if (points <= 750) return 4;
  return 5;
};

const writeups = {
  black_flash: `## Solution

The shop multiplies the requested quantity and the 65,536-credit price in a
32-bit unsigned integer. Ordering 65,536 tools satisfies the wholesale minimum,
but the product is exactly \`2^32\` and wraps to zero. The zero total is below the
100-credit balance, so the approved-payment path prints the flag.

The reference solver only needs to submit \`65536\` at the quantity prompt.`,

  grade_4_technique: `## Solution

The service maps a page with read, write, and execute permissions, copies up to 256
bytes from standard input into it, and calls the mapping directly. There is no
shellcode filter, so ordinary amd64 \`execve("/bin/sh")\` shellcode is sufficient.

After the shell starts, request \`/flag\` (or the local \`flag.txt\`) to recover the
challenge flag.`,

  return_policy: `## Solution

\`orientation\` reads 256 bytes into a 64-byte stack buffer. The saved return
address is 72 bytes from the start of that buffer, and the binary exposes a \`win\`
function that opens and prints the flag.

Pad to offset 72 and replace the saved return address with \`win\`. No arguments or
second stage are needed.`,

  strongest_argument: `## Solution

The debate function has the same 72-byte offset to its saved return address, but
\`win\` only succeeds when its first SysV amd64 argument equals
\`0x1337c0decafebabe\`. The binary deliberately provides a \`pop rdi; ret\` gadget.

The complete chain is padding, \`pop rdi; ret\`, the approved value, and \`win\`.
This sets \`rdi\` before transferring control to the flag-printing function.`,

  forbidden_vocabulary: `## Solution

The submitted shellcode may not contain null, newline, \`syscall\`, slash, or
\`int 0x80\` bytes. The destination is still writable and executable, so encode a
normal \`execve("/bin/sh")\` body with a single-byte XOR key whose encoded form
avoids the banned set.

A short position-independent decoder obtains the encoded body's address with a
call/pop sequence, XORs it back in place, and jumps to it. The reference solver
searches for a safe key and verifies that the complete payload contains no banned
byte before sending it.`,

  nah: `## Solution

The service stores the protected descriptor in a \`uint8_t\`, but later accepts the
requested descriptor as a full integer. Registering 253 dummy objects consumes file
descriptors 3 through 255. Opening the flag next returns descriptor 256, which is
truncated to zero in \`protected_fd\`.

Request descriptor 256. It is not equal to the stored zero, yet \`read(256, ...)\`
still targets the real flag descriptor and prints its contents.`,

  read_it_and_weep: `## Solution

The complaint is passed directly to \`printf\`, giving a format-string write, and
the binary's writable GOT is available at fixed addresses. At format argument
offset 10, use \`fmtstr_payload\` to replace the low two bytes of \`read@GOT\` with
the low two bytes of \`win\`.

Immediately afterward the program calls \`read\` for the signature. That GOT call
now enters \`win\`, which opens and prints the flag.`,

  special_grade_paperwork: `## Solution

The 64-byte report is followed by alignment padding and the stack canary. The
80-byte preview therefore discloses the canary in bytes 72 through 79. The final
copy then reads 256 bytes into the same buffer, providing a canary-preserving stack
overflow.

Use the first ROP stage to call \`puts(puts@GOT)\` and return to \`main\`. Subtract
the bundled libc's \`puts\` offset from the leak. Repeat the interaction with the
known canary, then return to \`system("/bin/sh")\` and read the flag.`,

  infinite_void_free_tier: `## Solution

The seccomp policy allows \`openat\`, \`read\`, and exit calls, but not \`write\`, so
the flag cannot be returned directly. Shellcode can still open and read \`/flag\`,
compare one chosen byte with a guess, and conditionally block in an allowed read
from standard input.

An immediate exit means the secret byte is at most the guess; a connection that
remains alive means it is greater. Binary-search printable ASCII with this one-bit
oracle for each position, starting from the known \`SecurinetsENIT{\` prefix, until
the closing brace is recovered.`,

  reach_back: `## Solution

The caller opens the flag before installing seccomp, reads it into its own stack
frame, and then calls the uploaded \`solve\` function. At \`solve\` entry the saved
flag buffer begins exactly \`0x40\` bytes above \`rsp\`. Although the sandbox blocks
file access, it still permits \`write\`.

Export a relocation-free \`solve\` function that writes 128 bytes from
\`rsp + 0x40\` to standard output and returns. Build it as a shared object and send
one base64 line to the service:

\`\`\`bash
as --64 -o solve.o solve.s
ld -shared -z noexecstack -o solve.so solve.o
base64 -w0 solve.so | nc pwn.securinets-enit.club 1321
\`\`\``,

  reverse_slice: `## Solution

Each submitted payload is reversed before it reaches vulnerable \`printf\`. Reverse
the payload on the client as well, so the intended format string is restored by the
service. During the first inspection, \`%74$p|%75$p\` leaks the saved frame pointer
and the PIE return address.

Rebase the ELF from the return leak and calculate the saved return-address slot as
\`saved_rbp - 0x18\`. For the second inspection, create a byte-wise format-string
payload at argument offset 8 that writes the rebased \`win\` address into that slot,
reverse it for transport, and let the function return.`,

  rudimentary_calculator: `## Solution

An input containing \`"1\\0"\` remains a valid expression while bytes after the
embedded null overwrite \`display_len\`. Setting it to 105 makes the octal printer
read nine limbs beyond the 96-limb product array. Decode that octal integer into
32-bit words to recover the stack canary and saved return address, then derive the
PIE base.

An oversized \`quit\` request makes the calculator return through attacker data.
Preserve the canary and first call \`puts(puts@GOT)\`, returning to \`main\` to turn
the leak into a libc base. A second canary-preserving chain calls
\`system("/bin/sh")\` and reads the flag.`,
};

const fallbackTags = {
  special_grade_paperwork: ['canary-leak', 'ret2libc', 'rop'],
  infinite_void_free_tier: ['seccomp', 'blind-exfiltration', 'side-channel'],
  reverse_slice: ['format-string', 'pie-leak', 'stack-write'],
  rudimentary_calculator: ['out-of-bounds-read', 'stack-overflow', 'ret2libc'],
};

const challenges = [];
const waves = (await readdir(sourceRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && /^wave\d+$/.test(entry.name))
  .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }));

for (const wave of waves) {
  const waveRoot = path.join(sourceRoot, wave.name);
  const directories = (await readdir(waveRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name));

  for (const directory of directories) {
    const root = path.join(waveRoot, directory.name);
    let yaml;
    try {
      yaml = await readFile(path.join(root, 'challenge.yml'), 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }

    if (scalar(yaml, 'author').toLowerCase() !== 'r3t0x') continue;

    const solverName = directory.name === 'reach_back' ? 'solve.s' : 'solver.py';
    const solver = await readFile(path.join(root, solverName), 'utf8');
    const points = Number(yaml.match(/^\s+initial:\s*(\d+)/m)?.[1] || 0);
    const yamlTags = list(yaml, 'tags');
    const writeup = writeups[directory.name];
    if (!writeup) throw new Error(`missing curated writeup for ${directory.name}`);

    challenges.push({
      slug: directory.name.replaceAll('_', '-'),
      title: scalar(yaml, 'name'),
      category: 'Pwn',
      collection,
      author: scalar(yaml, 'author'),
      date: publicationDate,
      points,
      difficulty: difficultyFromPoints(points),
      description: block(yaml, 'description'),
      tags: yamlTags.length ? yamlTags : fallbackTags[directory.name] || [],
      flag: list(yaml, 'flags')[0] || '',
      writeup,
      solver,
      solverLanguage: solverName.endsWith('.py') ? 'python' : 'x86asm',
    });
  }
}

await writeFile(output, `${JSON.stringify(challenges, null, 2)}\n`);
console.log(`Imported ${challenges.length} r3t0x pwn writeups into ${output}.`);
