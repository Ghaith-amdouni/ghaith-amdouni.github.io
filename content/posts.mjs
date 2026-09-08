export const posts = [
  {
    slug: 'hello-world', title: 'A place for the bits in between.', category: 'Notes', date: '2026-09-08',
    description: 'Binary exploitation, networks, Linux, and the things I build along the way. Welcome to my corner of the internet.',
    art: 'hello', label: 'HELLO, WORLD',
    body: `<p class="lead">I'm Ghaith Amdouni, also known as r3t0x. This is my space for CTF challenges, projects, and notes about the systems underneath the software.</p>
    <h2 id="whoami">The person behind the prompt</h2><p>I study Networks and Telecommunications at the National Institute of Applied Science and Technology (INSAT), in Tunisia. My interests connect cybersecurity, networking, DevOps, DevSecOps, and web development. Binary exploitation and low-level systems are a particular focus.</p>
    <p>That mix shows up in my projects: authoring CTF challenges, building a cloud-native task manager, simulating onion routing and 5G networks, and developing 2D games. Different problems, with the same curiosity about how each layer works.</p>
    <h2 id="archive">What's in the archive?</h2><p>The challenge archive brings together my MOJO-JOJO CTF and FST Bootcamp material. Each entry keeps its original page, so the archive can grow without losing the work already here. Use the collection filters or search to find a particular challenge.</p>
    <p>Project notes sit alongside that material. They're a place to describe architecture, decisions, and what a project is meant to do. The categories keep the different threads easy to explore.</p>
    <h2 id="theme">A little bit of my desktop</h2><p>The design brings together an Arch Linux aesthetic, debugger-inspired details, and the black-and-red Akatsuki theme I started this site with. The terminal is an interactive directory: type <code>help</code> to find your way around, or press <kbd>Ctrl K</kbd> to jump straight to a page.</p>
    <p>If our interests overlap, feel free to reach out. You'll find my projects on GitHub, certifications on Credly, and an English CV here on the site.</p>`
  },
  {
    slug: 'taskmanager', title: 'From application to infrastructure.', category: 'DevOps', date: '2026-09-08',
    description: 'A look at my TaskManager project: Spring Boot, PostgreSQL, Kubernetes, and a complete delivery and monitoring stack.',
    art: 'pipeline', label: 'PROJECT NOTES',
    body: `<p class="lead">TaskManager is my cloud-native task management project, connecting application development with container orchestration, continuous integration, and monitoring.</p>
    <h2 id="application">The application layer</h2><p>The application uses Spring Boot with PostgreSQL for persistence. Keeping the application and database as distinct components makes their responsibilities clear: the application handles task-management behavior, while PostgreSQL stores the data.</p>
    <h2 id="delivery">Packaging and delivery</h2><p>The project is containerized with Docker and deployed on Kubernetes. GitHub Actions provides continuous integration. Together, these tools connect the source repository to an application that can run in a container environment.</p>
    <div class="article-diagram" aria-label="Project components">Spring Boot + PostgreSQL <span>→</span> Docker <span>→</span> Kubernetes<br><small>CI: GitHub Actions · Monitoring: Prometheus + Grafana</small></div>
    <h2 id="observability">Seeing the system</h2><p>Prometheus and Grafana provide the monitoring stack. This part of the project connects operating an application with understanding its behavior: collecting metrics and making them readable through dashboards.</p>
    <h2 id="connections">Why this project belongs here</h2><p>My interests span networking, development, and systems. TaskManager brings those areas into the same project. It also sits alongside my network simulations and CTF challenge work as another way to explore how software behaves beyond a single program.</p>`
  },
  {
    slug: 'network-simulations', title: 'Following the packet.', category: 'Networking', date: '2026-09-08',
    description: 'Two networking projects, two perspectives: onion-routing simulation and a 5G mesh environment in OMNeT++.',
    art: 'network', label: 'NETWORKING',
    body: `<p class="lead">Networks are a core part of my studies at INSAT. These two projects explore them from different angles: how traffic travels through an anonymization network, and how a mesh network behaves in simulation.</p>
    <h2 id="onion-routing">Onion-routing simulation</h2><p>My Tor network simulation models an anonymization network based on onion routing. The project implements multilayer encryption, a relay-node architecture, and circuit-based traffic tunneling for TCP/IP communications.</p>
    <p>The central idea is to study the relationship between a circuit and the relays that carry its traffic. This is a simulation project, rather than a claim of production anonymity or a replacement for the Tor network.</p>
    <h2 id="mesh">A 5G mesh in OMNeT++</h2><p>For the 5G mesh project, I developed a simulation environment in OMNeT++ to study the behavior of a mesh network. Simulation offers a way to represent network structure and observe interactions within that model.</p>
    <h2 id="perspective">One layer deeper</h2><p>These projects complement my network configuration and troubleshooting work, including simulations with Cisco Packet Tracer. They also connect to my broader interest in systems: understanding the route between two endpoints matters as much as understanding the software at either end.</p>`
  }
];
