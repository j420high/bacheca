const $ = id => document.getElementById(id);
const STORE_KEY = 'bacheca_notes_v1';
const ICONS = ['📝','📚','💡','💼','✅','🌿','🍳','✈️','🎯','🔖','🌟','🎨','💻','🎵','📷','🏋️','📊','🧪','🌍','❤️'];
const COLORS = [
  {n:'default',v:'#c85a2a'},{n:'blue',v:'#2a6c8a'},{n:'green',v:'#5a8a2a'},{n:'purple',v:'#7a2a6c'},
  {n:'amber',v:'#b87a10'},{n:'rose',v:'#b83060'},{n:'teal',v:'#1a8a7a'},{n:'slate',v:'#5a6a7a'}
];
const FONTS = [{n:'serif',l:'Serif'},{n:'sans',l:'Sans'},{n:'mono',l:'Mono'}];
const CATEGORIES = {
  studio:{i:'📚',l:'Studio'},lavoro:{i:'💼',l:'Lavoro'},idee:{i:'💡',l:'Idee'},personale:{i:'🌿',l:'Personale'},
  todo:{i:'✅',l:'To-do'},ricette:{i:'🍳',l:'Ricette'},viaggi:{i:'✈️',l:'Viaggi'},altro:{i:'📌',l:'Altro'}
};
const PRIORITY_ICON = {alta:'🔴',media:'🟡',bassa:'🟢',normale:''};

const state = {
  notes: [],
  editId: null,
  color: 'default',
  icon: '📝',
  font: 'serif',
  filter: 'tutti',
  view: 'cols',
  deleteId: null
};

const escapeHtml = text => String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const highlight = (text, query) => {
  if (!query) return escapeHtml(text);
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\]/g,'\\\\$&')})`, 'gi');
  return escapeHtml(text).replace(regex, '<mark class="hl">$1</mark>');
};
const formatDate = value => new Date(value).toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'});
const colorValue = key => (COLORS.find(c=>c.n===key) || COLORS[0]).v;
const field = id => $(id).value;
const todayIso = () => new Date().toISOString().split('T')[0];

function loadNotes() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    state.notes = saved ? JSON.parse(saved) : [];
  } catch {
    state.notes = [];
  }
  if (!state.notes.length) state.notes = getSampleNotes();
  render();
}

function saveNotes() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state.notes));
    const badge = $('savedBadge');
    badge.classList.add('show');
    setTimeout(() => badge.classList.remove('show'), 1800);
  } catch {
    showToast('⚠️ Storage pieno o non disponibile');
  }
}

function getSampleNotes() {
  return [
    {id:1,title:'Termodinamica – 1° principio',body:'Il primo principio afferma che ΔU = Q − W. L\'energia di un sistema isolato si conserva. Importantissimo per i problemi di cicli termodinamici.',cat:'studio',tags:['fisica','termodinamica'],date:'2025-05-28',pinned:true,color:'blue',icon:'🧪',font:'serif',priority:'alta',footer:'Zemansky, cap. 4'},
    {id:2,title:'Brief campagna social Q3',body:'Obiettivi: +30% reach. Target 25-35 anni, Instagram e TikTok. Budget €4.500. 12 post/mese + 4 reel. Deadline kickoff: 15 giugno.',cat:'lavoro',tags:['marketing','social'],date:'2025-05-26',pinned:false,color:'default',icon:'💼',font:'sans',priority:'alta',footer:''},
    {id:3,title:'Idea: app per il benessere',body:'Journaling vocale + analisi sentiment. L\'utente registra pensieri, l\'app mostra pattern emotivi nel tempo. Possibile integrazione Spotify.',cat:'idee',tags:['startup','app'],date:'2025-05-22',pinned:false,color:'green',icon:'💡',font:'serif',priority:'media',footer:''}
  ];
}

function getFilteredNotes() {
  const query = field('sIn').trim().toLowerCase();
  return state.notes
    .filter(note => state.filter === 'tutti' || note.cat === state.filter)
    .filter(note => {
      if (!query) return true;
      const haystack = [note.title, note.body, (note.tags || []).join(' '), note.footer || ''].join(' ').toLowerCase();
      return haystack.includes(query);
    })
    .sort((a,b) => {
      const mode = field('srt');
      if (mode === 'alpha') return a.title.localeCompare(b.title);
      if (mode === 'old') return new Date(a.date) - new Date(b.date);
      if (mode === 'pinned') return (b.pinned - a.pinned) || (new Date(b.date) - new Date(a.date));
      return new Date(b.date) - new Date(a.date);
    });
}

function renderFilters() {
  const counts = state.notes.reduce((acc, note) => ({ ...acc, [note.cat]: (acc[note.cat] || 0) + 1 }), {});
  const categories = ['tutti', ...Object.keys(CATEGORIES)];
  $('fRow').innerHTML = categories.map(cat => {
    const meta = CATEGORIES[cat] || {i:'🗂️', l:'Tutti'};
    const count = cat === 'tutti' ? state.notes.length : (counts[cat] || 0);
    return `<button class="fp${state.filter===cat ? ' active' : ''}" data-cat="${cat}">${cat==='tutti' ? '🗂️ Tutti' : `${meta.i} ${meta.l}`} <span class="pc">${count}</span></button>`;
  }).join('');
}

function fontStyle(name) {
  if (name === 'mono') return 'font-family:monospace;font-size:13px';
  if (name === 'sans') return 'font-family:"DM Sans",sans-serif;font-weight:500;font-size:14px';
  return 'font-family:"Playfair Display",serif;font-size:15px;font-weight:600';
}

function render() {
  const notes = getFilteredNotes();
  renderFilters();
  const query = field('sIn').trim();
  const pinned = notes.filter(note => note.pinned).length;
  let status = `<span><strong>${notes.length}</strong> appunt${notes.length===1 ? 'o' : 'i'}</span>`;
  if (pinned) status += `<span><strong>${pinned}</strong> fissati</span>`;
  if (query) status += `<span>Ricerca: <strong>"${escapeHtml(query)}"</strong></span>`;
  $('sBr').innerHTML = status;
  const grid = $('grid');
  grid.className = `ng v${state.view==='cols' ? 'c' : 'l'}`;
  if (!notes.length) {
    grid.innerHTML = `<div class="empty">📝<p>Nessun appunto trovato</p></div>`;
    return;
  }
  const isList = state.view === 'list';
  grid.innerHTML = notes.map(note => {
    const color = colorValue(note.color);
    const tags = (note.tags || []).map(tag => `<span class="ntg" style="background:${color}22;color:${color}">${escapeHtml(tag)}</span>`).join('');
    const footer = note.footer ? `<div style="font-size:11px;color:var(--ink3);border-top:1px solid var(--border);padding-top:.5rem;display:flex;align-items:center;gap:4px">🔗${escapeHtml(note.footer)}</div>` : '';
    const priority = PRIORITY_ICON[note.priority || 'normale'];
    const titleHtml = `${highlight(note.title, query)} ${priority}${note.pinned ? (isList ? ' 📌' : '') : ''}`;
    const bodyHtml = highlight(note.body.replace(/\n/g,' '), query);
    const actions = `<div class="na2"><button class="na${note.pinned?' pon':''}" data-action="pin">📌</button><button class="na" data-action="edit">✏️</button><button class="na db" data-action="del">🗑️</button></div>`;
    if (!isList) {
      return `<div class="nc${note.pinned ? ' pinned' : ''}" data-id="${note.id}">${note.pinned ? `<div class="pf">📌</div>` : ''}<div class="nct"><div style="display:flex;align-items:flex-start;gap:8px;flex:1;padding-top:6px"><div class="ni">${note.icon || '📝'}</div><div class="nt" style="${fontStyle(note.font)};color:${color}">${titleHtml}</div></div>${actions}</div><div class="nb">${bodyHtml}</div>${footer}<div class="nmr"><div class="nd">📅${formatDate(note.date)}</div><div class="nts">${tags}</div></div></div>`;
    }
    return `<div class="nc${note.pinned ? ' pinned' : ''}" data-id="${note.id}"><div style="font-size:24px;flex-shrink:0;padding-top:2px">${note.icon || '📝'}</div><div class="ncm"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:.5rem;margin-bottom:5px"><div class="nt" style="${fontStyle(note.font)};color:${color}">${titleHtml}</div>${actions}</div><div class="nb">${bodyHtml}</div><div class="nmr"><div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap"><div class="nd">📅${formatDate(note.date)}</div>${note.footer ? `<div style="font-size:11px;color:var(--ink3)">🔗 ${escapeHtml(note.footer)}</div>` : ''}</div><div class="nts">${tags}</div></div></div></div>`;
  }).join('');
}

function buildPicker(container, items, selected, dataKey, renderItem) {
  $(container).innerHTML = items.map(item => {
    const value = item[dataKey];
    const sel = value === selected ? ' sel' : '';
    return renderItem(item, value, sel);
  }).join('');
}

function openModal(note = null) {
  state.editId = note ? note.id : null;
  $('mTit').textContent = note ? 'Modifica appunto' : 'Nuovo appunto';
  $('fTit').value = note ? note.title : '';
  $('fBod').value = note ? note.body : '';
  $('fCat').value = note ? note.cat : 'studio';
  $('fTag').value = note ? (note.tags || []).join(', ') : '';
  $('fPri').value = note ? note.priority || 'normale' : 'normale';
  $('fFoo').value = note ? note.footer || '' : '';
  $('fPin').checked = note ? note.pinned : false;
  state.color = note ? note.color : 'default';
  state.icon = note ? note.icon : '📝';
  state.font = note ? note.font : 'serif';

  buildPicker('iP', ICONS.map(icon => ({icon})), state.icon, 'icon', (item, value, sel) => `<button class="ib${sel}" data-icon="${value}" type="button">${value}</button>`);
  buildPicker('cP', COLORS, state.color, 'n', (item, value, sel) => `<div class="cs${sel}" data-color="${value}" title="${value}" style="background:${item.v};border-color:${sel ? 'var(--ink)' : 'transparent'}"></div>`);
  buildPicker('fnP', FONTS, state.font, 'n', (item, value, sel) => `<button class="fb${sel}" data-font="${value}" type="button" style="${value==='mono'?'font-family:monospace':value==='sans'?'font-family:sans-serif':'font-family:Georgia,serif'}">${item.l}</button>`);

  $('modal').style.display = 'flex';
  setTimeout(() => $('fTit').focus(), 50);
}

function closeModal() {
  $('modal').style.display = 'none';
}

function showToast(msg) {
  const toast = $('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function submitNote() {
  const title = field('fTit').trim();
  if (!title) {
    const el = $('fTit');
    el.style.borderColor = '#c83232';
    el.focus();
    setTimeout(() => el.style.borderColor = '', 1200);
    return;
  }
  const noteData = {
    title,
    body: field('fBod').trim(),
    cat: field('fCat'),
    tags: field('fTag').split(',').map(t => t.trim()).filter(Boolean),
    priority: field('fPri'),
    footer: field('fFoo').trim(),
    pinned: $('fPin').checked,
    color: state.color,
    icon: state.icon,
    font: state.font,
    date: todayIso()
  };
  if (state.editId != null) {
    const existing = state.notes.find(note => note.id === state.editId);
    Object.assign(existing, noteData);
    showToast('Appunto aggiornato ✓');
  } else {
    state.notes.unshift({ id: Date.now(), ...noteData });
    showToast('Appunto salvato ✓');
  }
  saveNotes();
  closeModal();
  render();
}

function exportNotes() {
  const content = state.notes.map(note => `═══════════════════════════════════\n${note.icon || '📝'} ${note.title}\nCategoria: ${(CATEGORIES[note.cat] || {l:note.cat}).l}  |  Priorità: ${note.priority||'normale'}  |  Data: ${formatDate(note.date)}\nTag: ${(note.tags || []).join(', ')||'—'}\n${note.footer ? 'Fonte: ' + note.footer + '\n' : ''}\n${note.body}\n`).join('\n');
  const blob = new Blob([`BACHECA APPUNTI – ${new Date().toLocaleDateString('it-IT')}\n\n${content}`], { type:'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bacheca_appunti.txt';
  a.click();
  showToast('File .txt scaricato ✓');
}

$('grid').addEventListener('click', e => {
  const card = e.target.closest('.nc');
  if (!card) return;
  const note = state.notes.find(item => item.id === +card.dataset.id);
  if (!note) return;
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'pin') { note.pinned = !note.pinned; saveNotes(); render(); return; }
  if (action === 'del') { state.deleteId = note.id; $('cMsg').textContent = `"${note.title}" verrà eliminato definitivamente.`; $('cDel').style.display = 'flex'; return; }
  openModal(note);
});

$('cNo').addEventListener('click', () => { $('cDel').style.display = 'none'; state.deleteId = null; });
$('cYes').addEventListener('click', () => {
  if (state.deleteId != null) {
    state.notes = state.notes.filter(note => note.id !== state.deleteId);
    saveNotes();
    render();
    showToast('Appunto eliminato');
  }
  $('cDel').style.display = 'none';
  state.deleteId = null;
});

$('fRow').addEventListener('click', e => {
  const btn = e.target.closest('.fp');
  if (!btn) return;
  state.filter = btn.dataset.cat;
  render();
});
$('sIn').addEventListener('input', render);
$('srt').addEventListener('change', render);
$('vG').addEventListener('click', () => { state.view = 'cols'; $('vG').classList.add('active'); $('vL').classList.remove('active'); render(); });
$('vL').addEventListener('click', () => { state.view = 'list'; $('vL').classList.add('active'); $('vG').classList.remove('active'); render(); });

$('iP').addEventListener('click', e => { const b = e.target.closest('.ib'); if (!b) return; state.icon = b.dataset.icon; buildPicker('iP', ICONS.map(icon => ({icon})), state.icon, 'icon', (item, value, sel) => `<button class="ib${sel}" data-icon="${value}" type="button">${value}</button>`); });
$('cP').addEventListener('click', e => { const s = e.target.closest('.cs'); if (!s) return; state.color = s.dataset.color; buildPicker('cP', COLORS, state.color, 'n', (item, value, sel) => `<div class="cs${sel}" data-color="${value}" title="${value}" style="background:${item.v};border-color:${sel ? 'var(--ink)' : 'transparent'}"></div>`); });
$('fnP').addEventListener('click', e => { const b = e.target.closest('.fb'); if (!b) return; state.font = b.dataset.font; buildPicker('fnP', FONTS, state.font, 'n', (item, value, sel) => `<button class="fb${sel}" data-font="${value}" type="button" style="${value==='mono'?'font-family:monospace':value==='sans'?'font-family:sans-serif':'font-family:Georgia,serif'}>${item.l}</button>`); });

$('addBtn').addEventListener('click', () => openModal());
$('mCl').addEventListener('click', closeModal);
$('mCan').addEventListener('click', closeModal);
$('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal(); });
$('mSav').addEventListener('click', submitNote);

const installBtn = $('installBtn');
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.style.display = 'inline-flex';
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      showToast('Installazione PWA avviata');
    }
    deferredPrompt = null;
    installBtn.style.display = 'none';
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('sw.js');
      if (registration.waiting) {
        showToast('Aggiornamento disponibile, ricarica la pagina');
      }
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        showToast('PWA installata e attiva');
      });
    } catch (error) {
      console.warn('Service worker registration failed:', error);
    }
  });
}
$('expBtn').addEventListener('click', exportNotes);

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); $('cDel').style.display = 'none'; } });

loadNotes();
