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
  better_call_wawa: `## Solution

The program discloses the address of \`stdout\`, which gives the libc base by
subtracting the bundled libc's \`_IO_2_1_stdout_\` offset. The 72-byte read into a
32-byte stack buffer also reaches the saved return address at offset 40.

Build a libc ROP chain with an alignment \`ret\`, \`pop rdi; ret\`, the address of
\`/bin/sh\`, and \`system\`. After the function returns into the chain, send
\`cat flag.txt\` through the resulting shell.`,
  chops_last_fetch: `## Solution

This is a timed parser challenge. For each of 45 rounds, read the exact package
length and apply every command from left to right. \`FETCH\` leaves the bytes alone;
the remaining operations reverse, change case, repeat, rotate left, slice with an
exclusive end, sort, XOR into lowercase hexadecimal, or return the byte count.

Using the advertised package length avoids delimiter mistakes. Send the transformed
bytes before the two-second alarm on every round to receive the flag.`,
  cyberleek_hotline: `## Solution

There is no exploitation step: after accepting a connection, the service opens
\`flag.txt\` and prints it. Connect and read until EOF.`,
  cyberleeks_burner: `## Solution

The service emits eight random transmissions between \`BEGIN LEAK\` and \`END LEAK\`.
Capture each line and return it unchanged at the \`RETURN LEAK\` prompt before the
two-second alarm expires. Eight exact echoes unlock the flag.`,
  cyberleeks_final_upload: `## Solution

Treat the connection as a binary stream because each frame is deliberately split
across short writes. Read \`LEEK\`, then the big-endian sequence, operation, payload
length, payload, and checksum. Verify that the checksum is the 32-bit sum of the
payload bytes.

Apply the requested operation: reverse, XOR, rotate left, sort, or byte-wise add.
For XOR, rotate, and add, the first payload byte is the key rather than data. Reply
with \`ACK!\`, the original sequence, result length, result, and its big-endian
checksum. Processing all 32 frames reveals the flag.`,
  drop_a_pin: `## Solution

The binary reads a hexadecimal value, casts it to a function pointer, and accepts it
only when it equals \`final_upload\`. PIE is disabled, so resolve that symbol directly
from the ELF and submit its address. The indirect call then enters the flag-printing
function.`,
  full_heat: `## Solution

The XOR archive output provides both required leaks. First send 41 known bytes: the
extra byte passes the stack canary's leading null, so XOR-decoding the next seven
bytes recovers the canary. Preserve it in a one-byte partial return overwrite that
re-enters the report path. On the second pass, 56 known bytes let the archive output
continue into the saved return address, revealing the PIE base.

With PIE known, return through \`broadcast\`. Its by-value \`Broadcast\` argument is
read from the stack, giving a call primitive: set its message to \`read@got\` and its
function pointer to \`puts@plt\`, then re-enter once more. Convert that leak into the
libc base. A final \`broadcast\` frame uses \`/bin/sh\` as the message and \`system\`
as the callback, while preserving the recovered canary.`,
  night_shift: `## Solution

Registering a parcel creates a close-on-exec memfd. Cancelling it closes the file
descriptor but leaves the slot's descriptor number behind. Inspecting the archive
then opens \`/flag\`, and the kernel reuses that newly freed descriptor number.

The extension price is calculated in 32-bit arithmetic. Supplying \`0x10000010\`
seconds makes \`seconds * 16\` wrap to an affordable value while setting a future
expiry even for the inactive slot. Authorizing that slot clears \`FD_CLOEXEC\` on
the reused flag descriptor; dispatching the courier inherits it and prints the flag.`,
  off_the_radar: `## Solution

The program reads exactly 32 bytes into \`alias\`, but the adjacent fields are part of
the same structure and are therefore controllable through one contiguous input.
Fill the alias, write \`NONE\` over the four-byte stars field, and append three
little-endian zero integers for \`visible\`, \`identified\`, and \`inside_area\`.
Satisfying all four checks calls \`release_archive\`.`,
  one_star_gateway: `## Solution

The service leaks \`puts\` before reading 33 bytes into a 16-byte stack buffer.
Subtract the bundled libc's \`puts\` offset to recover the libc base. The saved return
address is reached after the buffer and saved frame pointer.

Overwrite the saved frame pointer with writable space in \`garage\` and the return
address with the compatible libc one-gadget at offset \`0xebd43\`. Once it spawns a
shell, read \`flag.txt\`.`,
  one_street_over: `## Solution

\`receive_route\` forces a 41-byte read into a 32-byte buffer. Forty padding bytes
reach the saved return address, but only its least-significant byte can be changed.
Because the binary is non-PIE and the relevant code is aligned within the same
address region, replace that byte with the low byte of \`enter_the_safehouse\`. The
partial overwrite redirects execution to the flag-printing function.`,
  one_time_inspection: `## Solution

The service executes code from an RWX mapping but rejects literal \`syscall\`,
\`int 0x80\`, and \`sysenter\` opcode pairs. The mapping is writable during
execution, so place \`00 05\` at the future syscall site and begin with a small
self-modifying stub that changes the first byte to \`0f\`.

The remaining shellcode constructs \`/bin//sh\`, sets up \`execve\`, and falls into
the newly created \`0f 05\`. The forbidden sequence never appears in the submitted
payload, but it exists by the time execution reaches it.`,
  radio_silence: `## Solution

The first input is used both as a decimal frequency and as a restricted format
string. Brute-force the 16-bit frequency whose \`route_tag\` equals \`0x30db734f\`;
that route receives the known eight-byte clearance value \`jiggly!!\`. Append
\`%41$p\` to the decimal frequency so the route still parses while the format string
leaks the supplied \`puts\` pointer, then recover the libc base.

The selected channel accepts an overflowing transmission. Send 16 padding bytes,
the known clearance in the canary slot, 16 more padding bytes, and a libc ROP chain
that calls \`system("/bin/sh")\`.`,
  skip_intro: `## Solution

The fixed 48-byte read reaches the saved return address at offset 40. Calling \`win\`
normally would fail its three argument checks, but jumping to \`win + 0x38\` skips
the validation and lands in the path-decoding and file-reading portion of the
function. Submit 40 padding bytes followed by that internal address.`,
  the_first_leek: `## Solution

The challenge program immediately executes \`/bin/sh\`. Connect to the service and
send \`cat flag.txt\`; no memory-corruption step is required.`,
  the_second_download: `## Solution

Only four bytes are initially copied into an RWX mapping, but the function pointer
is invoked with \`stdin\`, the mapping address, and \`0x1000\` already in
\`rdi\`, \`rsi\`, and \`rdx\`. Use the four-byte stager \`xor eax,eax; syscall\` to
perform \`read(0, upload, 0x1000)\`.

The second read overwrites the mapping. Put four disposable bytes first so execution
resumes at offset four, followed there by normal \`execve\` shellcode that reads the
flag.`,
  the_spill: `## Solution

\`Incident\` stores a 32-byte report immediately before the \`leaked\` integer, while
\`read\` accepts the size of the entire 36-byte structure. Send 33 nonzero bytes:
the first 32 fill the report and the final byte changes \`leaked\` from zero. The
truthy field causes \`publish\` to print the flag.`,
  unmarked_coordinates: `## Solution

The printed address of \`leonida_relay\` reveals the PIE base. The 200-byte read into
a 32-byte message buffer reaches the saved return address at offset 40, leaving room
for a full ROP chain.

Use gadgets from the rebased binary to load the LUCIA, JASON, and CHOP constants into
\`rdi\`, \`rsi\`, and \`rdx\`, then call \`complete_the_handoff\`. With all three
arguments correct, it decodes the flag path and prints the file.`,
};

const techniqueTags = {
  better_call_wawa: ['ret2libc', 'rop'],
  chops_last_fetch: ['automation', 'parsing'],
  cyberleek_hotline: ['warmup'],
  cyberleeks_burner: ['automation'],
  cyberleeks_final_upload: ['binary-protocol', 'automation'],
  drop_a_pin: ['function-pointer'],
  full_heat: ['canary-leak', 'pie-leak', 'rop'],
  night_shift: ['fd-reuse', 'integer-overflow'],
  off_the_radar: ['struct-overflow'],
  one_star_gateway: ['libc-leak', 'one-gadget'],
  one_street_over: ['partial-overwrite'],
  one_time_inspection: ['shellcode', 'self-modifying-code'],
  radio_silence: ['format-string', 'ret2libc'],
  skip_intro: ['ret2win', 'mid-function-jump'],
  the_first_leek: ['warmup'],
  the_second_download: ['staged-shellcode'],
  the_spill: ['struct-overflow'],
  unmarked_coordinates: ['pie-leak', 'rop'],
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
    'Organizer build',
    'Organizer test',
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
  const yamlTags = list(yaml, 'tags');
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
    tags: yamlTags.length ? yamlTags : techniqueTags[directory.name] || [],
    flag: list(yaml, 'flags')[0] || '',
    writeup: cleanWriteup(readme, directory.name),
    solver,
    solverLanguage: solverName.endsWith('.java') ? 'java' : 'python',
  });
}

await mkdir('content', { recursive: true });
await writeFile(output, `${JSON.stringify(challenges, null, 2)}\n`);
console.log(`Imported ${challenges.length} ${category} writeups into ${output}.`);
