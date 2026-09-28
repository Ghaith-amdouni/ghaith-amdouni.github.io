// Site-wide content. Everything that is text rather than markup lives here so the
// templates in scripts/ stay about structure.

export const site = {
  url: 'https://r3t0x.me',
  title: 'r3t0x',
  name: 'Ghaith Amdouni',
  handle: 'r3t0x',
  role: 'Binary exploitation & systems',
  location: 'Tunis, Tunisia',
  email: 'ghaith.amdouni@insat.ucar.tn',
  description:
    'Ghaith Amdouni (r3t0x) — CTF writeups, binary exploitation notes, and projects across networks, Linux, and systems.',
  bio: [
    `I am a Networks &amp; Telecommunications student at <a href="https://insat.rnu.tn/">INSAT</a> in Tunis and a
     technical team instructor at SecuriNets, where I write challenges and teach workshops on
     binary exploitation.`,
    `Most of what I publish here is pwn: stack and heap corruption, ROP, format strings, and the
     tooling around them. The rest is systems work — networking, Linux, and the infrastructure
     I build to run it all.`,
  ],
  links: [
    { label: 'GitHub', href: 'https://github.com/Ghaith-amdouni' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/amdouni-ghaith' },
    { label: 'Credly', href: 'https://www.credly.com/users/ghaith-amdouni' },
    { label: 'RSS', href: '/feed.xml' },
  ],
  cv: '/static/docs/Ghaith-Amdouni-CV-English.pdf',
};

export const nav = [
  { label: 'home', href: '/', key: 'home' },
  { label: 'writeups', href: '/blog/', key: 'blog' },
  { label: 'projects', href: '/projects/', key: 'projects' },
];

export const achievements = [
  { rank: '1st', event: 'SecuriNets ISI', detail: 'National finals' },
  { rank: '1st', event: 'SecuriNets ISI', detail: 'Qualifications' },
  { rank: '1st', event: 'Friendly CTF ENIT', detail: 'Competition' },
  { rank: '4th', event: 'SecuriNets International', detail: 'Africa qualifications' },
  { rank: '7th', event: 'SecuriNets International', detail: 'International finals' },
  { rank: '8th', event: 'Claw The Flag', detail: 'Top 8 finish' },
];

export const experience = [
  {
    period: 'current',
    role: 'Technical team instructor',
    org: 'SecuriNets',
    summary:
      'Run technical workshops and guide members through practical binary exploitation material.',
  },
  {
    period: 'aug 2026',
    role: 'Digital forensics intern',
    org: 'National police — FACEIS',
    summary:
      'Built a facial investigation platform: RetinaFace detection, ArcFace embeddings, FAISS search, role-based access, and an audited investigation trail.',
    href: '/projects/#faceis',
  },
  {
    period: 'jun — aug 2024',
    role: 'Web development intern',
    org: 'Zedka Services',
    summary:
      'Front-end and back-end work on the MSJVerre site: page optimisation, content integration, and technical configuration.',
  },
  {
    period: 'education',
    role: 'Networks & Telecommunications',
    org: 'INSAT, Tunis',
    summary:
      'National Institute of Applied Science and Technology. Cybersecurity, networking, and software development.',
  },
];

export const certifications = [
  { name: 'CCNA: Introduction to Networks', issuer: 'Cisco' },
  { name: 'CCNA: Switching, Routing & Wireless Essentials', issuer: 'Cisco' },
  { name: 'Google Cybersecurity', issuer: 'Coursera' },
  { name: "CS50's Introduction to Computer Science", issuer: 'Harvard' },
  { name: 'Certified Red Team Operations Management', issuer: '' },
];

// Short blurbs for the archive, keyed by collection name.
export const collections = {
  'Securinets Friendly CTF 2026': 'Misc and pwn challenges I authored and solved for Securinets Friendly CTF 2026.',
  'MOJO-JOJO CTF': 'An original pwn set: stack pivots, ret2libc, SROP, heap corruption, and linker abuse.',
  'FST Bootcamp': 'Binary exploitation training labs written for the FST bootcamp.',
};
