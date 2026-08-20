async function loadPortfolio() {
  const [profileRes, projectsRes] = await Promise.all([
    fetch('data.json'),
    fetch('content/projects.json').catch(() => null)
  ]);
  const data = await profileRes.json();
  let projectsData = { items: [] };
  if (projectsRes && projectsRes.ok) {
    projectsData = await projectsRes.json();
  }

  const p = data.profile;

  // Nav + hero name
  document.getElementById('nav-name').textContent = p.initials || p.name.split(' ').map(n => n[0]).join('');
  document.getElementById('heroName').textContent = p.name;
  document.getElementById('heroTagline').textContent = p.tagline;
  document.getElementById('heroStatement').textContent = p.heroStatement;
  document.getElementById('footerName').textContent = p.name;
  document.getElementById('year').textContent = new Date().getFullYear();
  document.title = `${p.name} — ${p.tagline}`;

  // Hero stats
  const statsEl = document.getElementById('heroStats');
  statsEl.innerHTML = '';
  (data.stats || []).forEach(s => {
    const div = document.createElement('div');
    div.innerHTML = `<span class="stat-value">${escapeHtml(s.value)}</span><span class="stat-label">${escapeHtml(s.label)}</span>`;
    statsEl.appendChild(div);
  });

  // About
  const aboutEl = document.getElementById('aboutBody');
  aboutEl.innerHTML = (p.aboutParagraphs || []).map(par => `<p>${escapeHtml(par)}</p>`).join('');

  // Skills
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

  // Projects
  const projectsEl = document.getElementById('projectsList');
  projectsEl.innerHTML = '';
  (projectsData.items || []).forEach(proj => {
    const card = document.createElement('div');
    card.className = 'project-card';
    const flow = (proj.flow || []).map((step, i, arr) =>
      `<span>${escapeHtml(step)}</span>` + (i < arr.length - 1 ? `<span class="arrow">→</span>` : '')
    ).join('');
    const tools = (proj.tools || []).map(t => `<span>${escapeHtml(t)}</span>`).join('');
    const titleHtml = proj.link
      ? `<a href="${escapeAttr(proj.link)}" target="_blank" rel="noopener">${escapeHtml(proj.title)}</a>`
      : escapeHtml(proj.title);

    const mediaHtml = renderProjectMedia(proj);
    const descHtml = renderMarkdown(proj.description);

    card.innerHTML = `
      <div>
        <span class="project-tag">${escapeHtml(proj.tag || '')}</span>
        <h3>${titleHtml}</h3>
        ${mediaHtml}
      </div>
      <div>
        <div class="project-desc">${descHtml}</div>
        ${flow ? `<div class="project-flow">${flow}</div>` : ''}
        ${tools ? `<div class="project-tools">${tools}</div>` : ''}
      </div>
    `;
    projectsEl.appendChild(card);
  });

  // Education
  const eduEl = document.getElementById('educationLedger');
  eduEl.innerHTML = '';
  (data.education || []).forEach(ed => {
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

  // Contact links
  const contactEl = document.getElementById('contactLinks');
  contactEl.innerHTML = '';
  if (p.email) contactEl.innerHTML += `<a href="mailto:${escapeAttr(p.email)}">${escapeHtml(p.email)}</a>`;
  if (p.linkedin) contactEl.innerHTML += `<a href="${escapeAttr(p.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>`;
  if (p.github) contactEl.innerHTML += `<a href="${escapeAttr(p.github)}" target="_blank" rel="noopener">GitHub</a>`;
  if (p.location) contactEl.innerHTML += `<span style="font-family: var(--font-mono); font-size: 14px; color: var(--text-muted); padding: 12px 4px;">${escapeHtml(p.location)}</span>`;
}

function youtubeEmbedUrl(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function vimeoEmbedUrl(url) {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}

function renderProjectMedia(proj) {
  let html = '';
  if (proj.video) {
    const yt = youtubeEmbedUrl(proj.video);
    const vm = vimeoEmbedUrl(proj.video);
    if (yt || vm) {
      html += `<div class="project-media"><iframe src="${escapeAttr(yt || vm)}" loading="lazy" allowfullscreen title="${escapeAttr(proj.title)}"></iframe></div>`;
    } else {
      html += `<div class="project-media"><video src="${escapeAttr(proj.video)}" controls preload="metadata"></video></div>`;
    }
  } else if (proj.image) {
    html += `<div class="project-media"><img src="${escapeAttr(proj.image)}" alt="${escapeAttr(proj.title)}" loading="lazy"></div>`;
  }
  return html;
}

// Conversor Markdown -> HTML minimalista (sem dependências externas):
// suporta parágrafos, **negrito**, *itálico*, links [texto](url),
// listas com "- " e quebras de linha simples.
function renderMarkdown(md) {
  if (!md) return '';
  const escaped = escapeHtml(md);
  const blocks = escaped.split(/\n\s*\n/);
  return blocks.map(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const isList = lines.length && lines.every(l => l.startsWith('- '));
    let inner;
    if (isList) {
      inner = `<ul>${lines.map(l => `<li>${inlineMarkdown(l.slice(2))}</li>`).join('')}</ul>`;
    } else {
      inner = `<p>${lines.map(inlineMarkdown).join('<br>')}</p>`;
    }
    return inner;
  }).join('');
}

function inlineMarkdown(str) {
  return str
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
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

// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  loadPortfolio();
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
});
