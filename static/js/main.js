// ===== Pwndbg Animated Column Background =====
const pwndbgLines = {
    disasm: [
        '► 0x401156 <main+40>    call   gets@plt',
        '  0x40115b <main+45>    mov    eax, 0x0',
        '  0x401160 <main+50>    leave',
        '  0x401161 <main+51>    ret',
        '  0x401170 <vuln+0>     push   rbp',
        '  0x401171 <vuln+1>     mov    rbp, rsp',
        '  0x401174 <vuln+4>     sub    rsp, 0x40',
        '  0x401178 <vuln+8>     lea    rdi, [rbp-0x28]',
        '  0x40117c <vuln+12>    call   read@plt',
        '  0x401181 <vuln+17>    xor    eax, eax',
        '  0x401183 <vuln+19>    pop    rbp',
        '  0x401184 <vuln+20>    ret',
        '  0x401190 <win+0>      push   rbp',
        '  0x401191 <win+1>      mov    rbp, rsp',
        '  0x401194 <win+4>      lea    rdi, [rip+0x69]',
        '  0x40119b <win+11>     call   system@plt',
    ],
    regs: [
        'RAX  0x0',
        'RBX  0x0',
        'RCX  0x7ffff7af2107',
        'RDX  0x7ffff7dcf8c0',
        'RDI  0x7fffffffdc90',
        'RSI  0x7fffffffdc90',
        'R8   0x0',
        'R9   0x7ffff7dcf8c0',
        'R10  0x22',
        'R11  0x246',
        'R12  0x401050 <_start>',
        'R13  0x0',
        'R14  0x0',
        'R15  0x0',
        'RBP  0x7fffffffdcb0',
        'RSP  0x7fffffffdc70',
        'RIP  0x401156 <main+40>',
        'EFLAGS 0x202 [--- --- IF]',
    ],
    stack: [
        '00:0000│ rsp 0x7fffffffdc70 ◂— 0x0',
        '01:0008│     0x7fffffffdc78 ◂— 0x0',
        '02:0010│     0x7fffffffdc80 —▸ 0x401050',
        '03:0018│     0x7fffffffdc88 ◂— 0x0',
        '04:0020│     0x7fffffffdc90 ◂— AAAAAAAAAAAA',
        '05:0028│ rbp 0x7fffffffdcb0 ◂— BBBBBBBB',
        '06:0030│     0x7fffffffdcb8 —▸ 0x401234 (win)',
        '07:0038│     0x7fffffffdcc0 ◂— 0x0',
    ],
    pwndbg: [
        'pwndbg> checksec',
        '[*] Arch:     amd64-64-little',
        '    RELRO:    Partial RELRO',
        '    Stack:    No canary found',
        '    NX:       NX enabled',
        '    PIE:      No PIE (0x400000)',
        'pwndbg> vmmap',
        '0x400000   0x401000 r-xp  /target',
        '0x601000   0x602000 rw-p  /target',
        '0x7ffff7a0 0x7ffff7bc r-xp /libc.so',
        'pwndbg> info functions',
        '0x401050  _start',
        '0x401136  main',
        '0x401190  win',
        '0x401030  gets@plt',
        '0x401040  system@plt',
        'pwndbg> x/8gx $rsp',
        '0x7fffffffdc70: 0x00000000  0x00000000',
        '0x7fffffffdc80: 0x00401050  0x00000000',
        '0x7fffffffdc90: 0x41414141  0x41414141',
        '0x7fffffffdca0: 0x41414141  0x41414141',
    ],
};

const colTypes = ['disasm', 'regs', 'stack', 'pwndbg', 'disasm', 'regs', 'stack', 'pwndbg', 'disasm', 'stack', 'pwndbg', 'regs'];
const bgContainer = document.getElementById('pwndbgBg');

if (bgContainer) {
    colTypes.forEach((type) => {
        const col = document.createElement('div');
        col.classList.add('pwndbg-col');
        const lines = pwndbgLines[type];
        let content = '';
        for (let r = 0; r < 30; r++) {
            lines.forEach(l => { content += l + '\n'; });
        }
        col.textContent = content;
        const speed = 15 + Math.random() * 25;
        col.style.animationDuration = speed + 's';
        col.style.animationDelay = -(Math.random() * speed) + 's';
        bgContainer.appendChild(col);
    });
}

// ===== Amaterasu Particles =====
for (let i = 0; i < 25; i++) {
    const e = document.createElement('div');
    e.classList.add('ember');
    const size = Math.random() * 6 + 2;
    const isBlack = Math.random() > 0.4;
    e.style.width = size + 'px';
    e.style.height = size + 'px';
    e.style.left = Math.random() * 100 + 'vw';
    e.style.background = isBlack
        ? 'radial-gradient(circle, #333 0%, #000 100%)'
        : 'radial-gradient(circle, #da1f26 0%, #500 100%)';
    e.style.boxShadow = isBlack ? '0 0 6px #222' : '0 0 8px #B20000';
    e.style.animationDuration = (Math.random() * 12 + 8) + 's';
    e.style.animationDelay = (Math.random() * -15) + 's';
    document.body.appendChild(e);
}

// ===== Scroll Progress Indicator =====
const scrollInd = document.getElementById('scrollIndicator');
const scrollAddr = document.getElementById('scrollAddr');
if (scrollInd && scrollAddr) {
    window.addEventListener('scroll', () => {
        const max = document.body.scrollHeight - window.innerHeight;
        const pct = max > 0 ? (window.scrollY / max) : 0;
        scrollInd.style.height = (pct * 100) + '%';
        const addr = Math.floor(pct * 0x7FFFFFFF);
        scrollAddr.innerText = '0x' + addr.toString(16).padStart(8, '0');
    });
}

// ===== Animated Stats Counter =====
const statEls = document.querySelectorAll('.stat-number');
if (statEls.length) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                const target = parseInt(entry.target.getAttribute('data-target'));
                let current = 0;
                const inc = Math.ceil(target / 40);
                const timer = setInterval(() => {
                    current += inc;
                    if (current >= target) { current = target; clearInterval(timer); }
                    entry.target.innerText = current;
                }, 30);
            }
        });
    }, { threshold: 0.5 });
    statEls.forEach(el => statsObserver.observe(el));
}

// ===== Scroll-triggered Card Reveal =====
const cards = document.querySelectorAll('.mem-card');
if (cards.length) {
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), i * 120);
            }
        });
    }, { threshold: 0.15 });
    cards.forEach(c => cardObserver.observe(c));
}

// ===== Amaterasu Cursor Trail =====
(function() {
    const particles = [];
    const MAX = 25;
    for (let i = 0; i < MAX; i++) {
        const p = document.createElement('div');
        p.className = 'cursor-flame';
        document.body.appendChild(p);
        particles.push({ el: p, x: 0, y: 0, life: 0 });
    }
    let mx = -999, my = -999, idx = 0;
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    setInterval(() => {
        const p = particles[idx];
        p.x = mx; p.y = my; p.life = 1;
        idx = (idx + 1) % MAX;
        particles.forEach((p, i) => {
            p.life = Math.max(0, p.life - 0.06);
            const s = p.life * 15;
            p.el.style.left = (p.x - s/2) + 'px';
            p.el.style.top = (p.y - s/2) + 'px';
            p.el.style.width = s + 'px';
            p.el.style.height = s + 'px';
            p.el.style.opacity = p.life * 0.9;
        });
    }, 30);
})();

// ===== Genjutsu Transitions =====
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('genjutsuOverlay');
    
    // Create Kamui overlay
    const kamuiOverlay = document.createElement('div');
    kamuiOverlay.className = 'kamui-overlay';
    document.body.appendChild(kamuiOverlay);

    if (!overlay) return;

    // Reset overlay if page is restored from browser bfcache
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            overlay.classList.remove('closing', 'initial-closed');
            overlay.classList.add('opening');
            kamuiOverlay.classList.remove('kamui-active');
            document.body.classList.remove('kamui-sucking');
            
            // Re-trigger amaterasu opening
            let amaterasu = document.getElementById('amaterasuOverlay');
            if (amaterasu) {
                amaterasu.classList.remove('burn-away');
                void amaterasu.offsetWidth; // trigger reflow
                amaterasu.classList.add('burn-away');
            }

            setTimeout(() => overlay.classList.remove('opening'), 700);
        }
    });

    // Open animation fires immediately on fresh page load
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            overlay.classList.remove('initial-closed');
            overlay.classList.add('opening');
            
            // Add Amaterasu Screen Burn
            let amaterasu = document.createElement('div');
            amaterasu.id = 'amaterasuOverlay';
            amaterasu.className = 'amaterasu-overlay';
            document.body.appendChild(amaterasu);
            
            setTimeout(() => {
                amaterasu.classList.add('burn-away');
            }, 100);

            setTimeout(() => {
                overlay.classList.remove('opening');
                if(amaterasu.parentNode) amaterasu.parentNode.removeChild(amaterasu);
            }, 1500);
        });
    });

    // Intercept internal navigation links
    document.querySelectorAll('.mem-card, .back-link, a[href^="/"]').forEach(link => {
        const href = link.href;
        if (!href || link.getAttribute('href') === '#') return;
        if (!href.startsWith(window.location.origin)) return;

        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (link.classList.contains('back-link')) {
                // Kamui Space-Time suction for going back
                kamuiOverlay.classList.add('kamui-active');
                document.body.classList.add('kamui-sucking');
                setTimeout(() => { window.location.href = href; }, 1200);
            } else {
                // Tsukuyomi/Mangekyo eyelid close for opening challenges
                if (link.classList.contains('mem-card')) {
                    link.classList.add('clicked');
                }
                overlay.classList.add('closing');
                setTimeout(() => { window.location.href = href; }, 1000);
            }
        });
    });
});
