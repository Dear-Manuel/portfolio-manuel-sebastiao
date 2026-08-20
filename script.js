// ============================================
// CARREGAMENTO DE DADOS (partilhado pelas páginas)
// ============================================
async function loadData() {
  const [profileRes, projectsRes] = await Promise.all([
    fetch('data.json'),
    fetch('content/projects.json').catch(() => null)
  ]);
  const data = await profileRes.json();
  let projectsData = { items: [] };
  if (projectsRes && projectsRes.ok) {
    projectsData = await projectsRes.json();
  }
  return { data, items: projectsData.items || [] };
}

function applyCommonChrome(p) {
  document.getElementById('nav-name').textContent = p.initials || p.name.split(' ').map(n => n[0]).join('');
  document.getElementById('footerName').textContent = p.name;
  document.getElementById('year').textContent = new Date().getFullYear();
}

function setupMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

// Efeito subtil de entrada (fade + leve deslocamento) quando os
// cartões entram na área visível — interação discreta, sem exagero.
function setupRevealAnimations() {
  const items = document.querySelectorAll('.reveal-item:not(.revealed)');
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('revealed'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  items.forEach(el => observer.observe(el));

  // Rede de segurança: garante visibilidade mesmo que o observer falhe
  setTimeout(() => items.forEach(el => el.classList.add('revealed')), 2500);
}

// Escolhe até `max` projetos para a Home: primeiro os marcados como
// destaque (featured), depois preenche com os mais recentes (fim da
// lista) até perfazer o total.
function pickFeatured(items, max) {
  const featured = items.filter(p => p.featured);
  const rest = items.filter(p => !p.featured).slice().reverse();
  const combined = featured.concat(rest);
  return combined.slice(0, max);
}

// ============================================
// PÁGINA: HOME (index.html)
// ============================================
async function initHomePage() {
  const { data, items } = await loadData();
  const p = data.profile;
  applyCommonChrome(p);

  document.getElementById('heroName').textContent = p.name;
  document.getElementById('heroTagline').textContent = p.tagline;
  document.getElementById('heroStatement').textContent = p.heroStatement;
  document.title = `${p.name} — ${p.tagline}`;

  // Foto de perfil (se existir)
  const photoWrap = document.getElementById('heroPhotoWrap');
  if (p.photo) {
    photoWrap.innerHTML = `<div class="hero-photo"><img src="${escapeAttr(p.photo)}" alt="${escapeAttr(p.name)}"></div>`;
  } else {
    photoWrap.remove();
  }

  // Estatísticas
  const statsEl = document.getElementById('heroStats');
  statsEl.innerHTML = '';
  (data.stats || []).forEach(s => {
    const div = document.createElement('div');
    div.innerHTML = `<span class="stat-value">${escapeHtml(s.value)}</span><span class="stat-label">${escapeHtml(s.label)}</span>`;
    statsEl.appendChild(div);
  });

  // Sobre mim
  document.getElementById('aboutBody').innerHTML =
    (p.aboutParagraphs || []).map(par => `<p>${escapeHtml(par)}</p>`).join('');

  // Competências
  const skillsEl = document.getElementById('skillsGrid');
  skillsEl.innerHTML = '';
  (data.skills || []).forEach(cat => {
    const card = document.createElement('div');
    card.className = 'skill-card';
    card.innerHTML = `
      <h3>${escapeHtml(cat.category)}</h3>
      <span class="skill-note">${escapeHtml(cat.note || '')}</span>
      <ul>${(cat.items || []).map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
    `;
    skillsEl.appendChild(card);
  });

  // Projetos em destaque (máx. 6) — cartões compactos
  const previewEl = document.getElementById('projectsPreviewGrid');
  const featured = pickFeatured(items, 6);
  previewEl.innerHTML = featured.map(proj => renderCompactCard(proj)).join('');
  if (featured.length === 0) {
    previewEl.innerHTML = `<p class="empty-note">Ainda sem projetos publicados. Adicione o primeiro no painel /admin.</p>`;
  }

  // Formação
  renderEducation(data.education || []);

  // Contacto
  renderContact(p);

  setupMobileNav();
  setupRevealAnimations();
}

// Ordem e rótulos fixos das 3 áreas
const CATEGORY_ORDER = ["contabilidade", "informatica", "dados"];
const CATEGORY_LABELS = {
  contabilidade: "Contabilidade & Finanças",
  informatica: "Informática & Tecnologia",
  dados: "Análise de Dados & BI"
};

// ============================================
// PÁGINA: PROJETOS (projetos.html) — grelha com filtros interativos
// ============================================
let __allProjectItems = [];

async function initProjectsPage() {
  const { data, items } = await loadData();
  const p = data.profile;
  applyCommonChrome(p);
  document.title = `Projetos — ${p.name}`;

  __allProjectItems = items.slice().reverse(); // mais recentes primeiro

  const countEl = document.getElementById('projectsCount');
  countEl.textContent = items.length === 1 ? '1 projeto' : `${items.length} projetos`;

  const counts = {};
  CATEGORY_ORDER.forEach(cat => counts[cat] = 0);
  __allProjectItems.forEach(proj => { if (counts[proj.category] !== undefined) counts[proj.category]++; });

  const filtersEl = document.getElementById('categoryFilters');
  const activeCats = CATEGORY_ORDER.filter(cat => counts[cat] > 0);
  filtersEl.innerHTML = `<button class="filter-chip active" data-filter="all">Todos <span>${__allProjectItems.length}</span></button>` +
    activeCats.map(cat =>
      `<button class="filter-chip" data-filter="${cat}">${escapeHtml(CATEGORY_LABELS[cat])} <span>${counts[cat]}</span></button>`
    ).join('');

  filtersEl.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      filtersEl.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyProjectFilter(btn.dataset.filter);
    });
  });

  renderProjectsGrid(__allProjectItems);
  setupMobileNav();
  setupRevealAnimations();
}

function applyProjectFilter(cat) {
  const filtered = cat === 'all' ? __allProjectItems : __allProjectItems.filter(p => p.category === cat);
  renderProjectsGrid(filtered);
  setupRevealAnimations();
}

function renderProjectsGrid(items) {
  const listEl = document.getElementById('projectsList');
  listEl.innerHTML = items.length
    ? items.map(renderCompactCard).join('')
    : `<p class="empty-note">Sem projetos nesta área ainda.</p>`;
}

// ============================================
// PÁGINA: DETALHE DE UM PROJETO (projeto.html)
// ============================================
async function initProjectDetailPage() {
  const { data, items } = await loadData();
  const p = data.profile;
  applyCommonChrome(p);

  const slug = new URLSearchParams(window.location.search).get('slug');
  const proj = items.find(it => slugify(it.title) === slug);
  const contentEl = document.getElementById('detailContent');

  if (!proj) {
    contentEl.innerHTML = `<div class="page-header"><p class="empty-note">Projeto não encontrado.</p></div>`;
    setupMobileNav();
    return;
  }

  document.title = `${proj.title} — ${p.name}`;

  const mediaHtml = renderProjectMedia(proj, true);
  const descHtml = renderMarkdown(proj.description);
  const flow = (proj.flow || []).map((step, i, arr) =>
    `<span>${escapeHtml(step)}</span>` + (i < arr.length - 1 ? `<span class="arrow">→</span>` : '')
  ).join('');
  const tools = (proj.tools || []).map(t => `<span>${escapeHtml(t)}</span>`).join('');
  const catLabel = CATEGORY_LABELS[proj.category] || '';

  contentEl.innerHTML = `
    <section class="detail-header">
      <div class="compact-meta">
        ${proj.featured ? `<span class="featured-badge">Destaque</span>` : ''}
        ${catLabel ? `<span class="category-pill cat-${escapeAttr(proj.category)}">${escapeHtml(catLabel)}</span>` : ''}
      </div>
      <h1>${escapeHtml(proj.title)}</h1>
      ${proj.tag ? `<p class="detail-tag">${escapeHtml(proj.tag)}</p>` : ''}
    </section>
    ${mediaHtml ? `<section class="detail-media">${mediaHtml}</section>` : ''}
    <section class="detail-body">
      <div class="detail-desc">${descHtml}</div>
      <aside class="detail-side">
        ${flow ? `<div class="detail-side-block"><h4>Processo</h4><div class="project-flow">${flow}</div></div>` : ''}
        ${tools ? `<div class="detail-side-block"><h4>Ferramentas</h4><div class="project-tools">${tools}</div></div>` : ''}
        ${proj.link ? `<a href="${escapeAttr(proj.link)}" target="_blank" rel="noopener" class="btn btn-primary detail-link-btn">Ver projeto →</a>` : ''}
      </aside>
    </section>
  `;

  setupMobileNav();
}

// ============================================
// RENDER: cartão compacto (usado na Home)
// ============================================
function renderCompactCard(proj) {
  const cover = proj.image
    ? `<div class="compact-media"><img src="${escapeAttr(proj.image)}" alt="${escapeAttr(proj.title)}" loading="lazy"></div>`
    : `<div class="compact-media compact-media-empty"></div>`;
  const summary = plainTextSummary(proj.description, 110);
  const catLabel = CATEGORY_LABELS[proj.category] || '';
  return `
    <a class="project-card-compact reveal-item" href="projeto.html?slug=${slugify(proj.title)}">
      ${cover}
      <div class="compact-body">
        <div class="compact-meta">
          ${proj.featured ? `<span class="featured-badge">Destaque</span>` : ''}
          ${catLabel ? `<span class="category-pill cat-${escapeAttr(proj.category)}">${escapeHtml(catLabel)}</span>` : ''}
        </div>
        <h3>${escapeHtml(proj.title)}</h3>
        <p class="compact-summary">${escapeHtml(summary)}</p>
      </div>
    </a>
  `;
}

function renderEducation(education) {
  const eduEl = document.getElementById('educationLedger');
  eduEl.innerHTML = '';
  education.forEach(ed => {
    const row = document.createElement('div');
    row.className = 'ledger-row';
    row.innerHTML = `
      <div>
        <span class="degree">${escapeHtml(ed.degree)}</span>
        ${ed.note ? `<span class="note">${escapeHtml(ed.note)}</span>` : ''}
      </div>
      <div class="institution">${escapeHtml(ed.institution)}</div>
      <div class="period">${escapeHtml(ed.period)}</div>
    `;
    eduEl.appendChild(row);
  });
}

function renderContact(p) {
  const contactEl = document.getElementById('contactLinks');
  contactEl.innerHTML = '';
  if (p.email) contactEl.innerHTML += `<a href="mailto:${escapeAttr(p.email)}">${escapeHtml(p.email)}</a>`;
  if (p.linkedin) contactEl.innerHTML += `<a href="${escapeAttr(p.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>`;
  if (p.github) contactEl.innerHTML += `<a href="${escapeAttr(p.github)}" target="_blank" rel="noopener">GitHub</a>`;
  if (p.location) contactEl.innerHTML += `<span style="font-family: var(--font-mono); font-size: 14px; color: var(--text-muted); padding: 12px 4px;">${escapeHtml(p.location)}</span>`;
}

// ============================================
// UTILITÁRIOS DE MEDIA / MARKDOWN
// ============================================
function youtubeEmbedUrl(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function vimeoEmbedUrl(url) {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}

function renderProjectMedia(proj, large) {
  let html = '';
  const sizeClass = large ? 'project-media-large' : '';
  if (proj.video) {
    const yt = youtubeEmbedUrl(proj.video);
    const vm = vimeoEmbedUrl(proj.video);
    if (yt || vm) {
      html += `<div class="project-media ${sizeClass}"><iframe src="${escapeAttr(yt || vm)}" loading="lazy" allowfullscreen title="${escapeAttr(proj.title)}"></iframe></div>`;
    } else {
      html += `<div class="project-media ${sizeClass}"><video src="${escapeAttr(proj.video)}" controls preload="metadata"></video></div>`;
    }
  } else if (proj.image) {
    html += `<div class="project-media ${sizeClass}"><img src="${escapeAttr(proj.image)}" alt="${escapeAttr(proj.title)}" loading="lazy"></div>`;
  }
  return html;
}

// Conversor Markdown -> HTML minimalista (sem dependências externas)
function renderMarkdown(md) {
  if (!md) return '';
  const escaped = escapeHtml(md);
  const blocks = escaped.split(/\n\s*\n/);
  return blocks.map(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const isList = lines.length && lines.every(l => l.startsWith('- '));
    if (isList) {
      return `<ul>${lines.map(l => `<li>${inlineMarkdown(l.slice(2))}</li>`).join('')}</ul>`;
    }
    return `<p>${lines.map(inlineMarkdown).join('<br>')}</p>`;
  }).join('');
}

function inlineMarkdown(str) {
  return str
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

// Resumo em texto simples (sem markdown) para os cartões compactos da Home
function plainTextSummary(md, maxLen) {
  if (!md) return '';
  const text = md.replace(/[#*_>`\-]/g, '').replace(/\[(.+?)\]\(.+?\)/g, '$1').replace(/\s+/g, ' ').trim();
  return text.length > maxLen ? text.slice(0, maxLen).trim() + '…' : text;
}

function slugify(str) {
  return (str || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return (str || '').replace(/"/g, '&quot;');
}
