export const projects = [
  {
    slug: 'faceis', title: 'FACEIS', kicker: 'AI × DIGITAL FORENSICS', icon: '◉', featured: true,
    description: 'A role-aware facial investigation platform created during my August 2026 digital-forensics police internship.',
    stack: ['FastAPI', 'PostgreSQL', 'RetinaFace', 'ArcFace', 'FAISS', 'Docker'],
    repo: 'https://github.com/Ghaith-amdouni/FACEIS',
    body: `<p class="lead">I designed and built FACEIS during a digital-forensics police internship from 1 to 31 August 2026.</p>
      <h2>The pipeline</h2><p>Reference images and video frames pass through RetinaFace detection and quality checks. ArcFace produces normalized 512-dimensional embeddings, and FAISS provides the vector index used for similarity search.</p>
      <h2>The application</h2><p>A FastAPI and PostgreSQL backend handles people, investigations, files, decisions, authentication, roles, and audit logs. A Vite front end provides the operator workflow, while Alembic and Docker make the data layer and deployment repeatable.</p>
      <div class="article-diagram">video / image <span>→</span> RetinaFace <span>→</span> ArcFace 512D <span>→</span> FAISS<br><small>FastAPI · PostgreSQL · role-based access · audit trail</small></div>`
  },
  {
    slug: 'mojo-jojo-ctf', title: 'MOJO-JOJO CTF', kicker: 'PWN LAB', icon: '⌘', featured: true,
    description: 'An original binary-exploitation challenge suite spanning control-flow attacks and modern pwn techniques.',
    stack: ['C', 'Python', 'pwntools', 'Docker', 'GDB'],
    repo: 'https://github.com/Ghaith-amdouni/MOJO-JOJO-CTF',
    body: `<p class="lead">MOJO-JOJO is where exploit ideas become complete CTF challenges.</p>
      <h2>What it explores</h2><p>The collection covers stack pivoting, ret2libc, SROP, heap corruption, dynamic-linker abuse, and oracle-style primitives. Each problem is designed around an exploitation insight instead of a hidden trick.</p>
      <h2>Challenge engineering</h2><p>The work includes vulnerable native targets, deployment containers, solvers, and the surrounding player experience. The published archive keeps each challenge page and writeup reachable.</p>
      <a class="button" href="/blog/?collection=MOJO-JOJO">Open the MOJO-JOJO cards ↗</a>`
  },
  {
    slug: 'taskpilot-devops', title: 'TaskPilot DevOps', kicker: 'CLOUD NATIVE', icon: '▧', featured: true,
    description: 'A secured task platform carried from Spring Boot source code to Kubernetes and production-style observability.',
    stack: ['Java 21', 'Spring Boot', 'JWT', 'Kubernetes', 'Prometheus', 'Grafana'],
    repo: 'https://github.com/Ghaith-amdouni/taskpilot-devops',
    body: `<p class="lead">TaskPilot treats delivery and operations as part of the application.</p>
      <h2>The product</h2><p>Users authenticate with JWT, organize projects, manage Kanban tasks, assign members, track due dates, and discuss work through comments. PostgreSQL holds the application state.</p>
      <h2>The platform</h2><p>Docker packages the service, Kubernetes manifests deploy it, and GitHub Actions builds, tests, publishes the image, and prepares versioned manifests. Spring Boot Actuator feeds Prometheus, with a provisioned Grafana dashboard for the important signals.</p>
      <div class="article-diagram">Spring Boot + PostgreSQL <span>→</span> Docker <span>→</span> Kubernetes<br><small>GitHub Actions · Helm · Prometheus · Grafana</small></div>`
  },
  {
    slug: 'omnetpp-mesh-5g', title: 'Mesh & 5G Simulations', kicker: 'NETWORK SYSTEMS', icon: '⌁', featured: true,
    description: 'Two OMNeT++ environments for studying a custom mesh network and a 5G NR scenario with Simu5G.',
    stack: ['C++', 'OMNeT++', 'INET', 'Simu5G', '5G NR'],
    repo: 'https://github.com/Ghaith-amdouni/omnetpp-mesh-5g-projects',
    body: `<p class="lead">Simulation makes the network visible: topology, routing, traffic, and behavior become things that can be inspected.</p>
      <h2>Two environments</h2><p>The repository contains an independently developed mesh-network scenario and a 5G New Radio simulation based on Simu5G. INET supplies the protocol models used around those scenarios.</p>
      <h2>Why it matters</h2><p>The project links telecommunications theory with executable experiments. It provides a controlled place to change topology or traffic and observe the resulting network behavior.</p>`
  },
  {
    slug: 'fst-pwn-bootcamp', title: 'FST Pwn Bootcamp', kicker: 'SECURITY EDUCATION', icon: '❯', featured: false,
    description: 'A Dockerized progression of binary-exploitation challenges created for hands-on training.',
    stack: ['C', 'Python', 'ROP', 'Format strings', 'Docker'],
    repo: 'https://github.com/Ghaith-amdouni/fst_bootcamp_ctf_challenges',
    body: `<p class="lead">A teaching-focused pwn collection built to turn low-level concepts into practice.</p>
      <h2>The progression</h2><p>The challenges move through buffer overflows, ret2shellcode, ROP, format strings, and increasingly constrained targets. Difficulty markers in the archive make that path clear.</p>
      <h2>Repeatable labs</h2><p>Dockerized targets keep the environment consistent for bootcamp participants and make every task easier to reproduce after the event.</p>
      <a class="button" href="/blog/?collection=FST+Bootcamp">Open the FST cards ↗</a>`
  },
  {
    slug: 'smart-greenhouse-iot', title: 'Smart Greenhouse IoT', kicker: 'EMBEDDED SYSTEMS', icon: '⌁', featured: false,
    description: 'An ESP32 control system that senses greenhouse conditions and automates irrigation, air, and light.',
    stack: ['ESP32', 'C++', 'MQTT', 'Node-RED', 'Wokwi'],
    repo: 'https://github.com/Ghaith-amdouni/smart-greenhouse-iot',
    body: `<p class="lead">A complete sensing and control loop, from the physical signal to the operator dashboard.</p>
      <h2>Sensing and automation</h2><p>The ESP32 samples temperature, humidity, light, CO₂, and rain. Threshold rules control irrigation, fans, lighting, and ventilation while still exposing manual control where it is useful.</p>
      <h2>Telemetry</h2><p>MQTT carries readings and actuator state to a Node-RED dashboard with live gauges, charts, alerts, and status indicators. Wokwi provides a reproducible hardware simulation.</p>
      <div class="article-diagram">sensors <span>→</span> ESP32 <span>→</span> MQTT <span>→</span> Node-RED<br><small>observe · decide · actuate</small></div>`
  },
  {
    slug: 'image-recovery', title: 'Raw Image Recovery', kicker: 'DIGITAL FORENSICS', icon: '▤', featured: false,
    description: 'A C utility that recovers deleted JPEGs by carving a raw memory-card image block by block.',
    stack: ['C', 'File I/O', 'JPEG carving', 'Forensics'],
    repo: 'https://github.com/Ghaith-amdouni/Images-Recovery',
    body: `<p class="lead">Deletion often removes a reference before it removes the bytes.</p>
      <h2>The recovery primitive</h2><p>The program reads a raw card image in fixed-size blocks, detects JPEG signatures, and writes each recovered file until a new signature starts the next image.</p>
      <h2>Why it fits</h2><p>It is a compact exercise in binary formats, low-level file I/O, and forensic reasoning—the same habit of looking beneath the interface that drives the pwn work.</p>`
  }
];
