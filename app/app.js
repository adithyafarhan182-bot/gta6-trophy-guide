// Leonida Legend — boot, state, checklist, filters, search, spoiler, export/import.
// The guide's data lives in data/trophies.json (fetched from this app's own files);
// nothing else is fetched, and the app works with the network off.

import { renderDetail, medalLetter, gradeLabel, kindLabel, targetText } from './guide.js';
import { ROADMAP, renderRoadmap, renderMissables } from './roadmap.js';

const STORE_KEY = 'leonida-legend-v1';
const SPOILER_KEY = 'leonida-legend-spoiler-v1';

// 13 trophies earned for the demo screenshots (?demo=1): the story's opening,
// a sampler of activities, and a few open-world finds.
const DEMO_EARNED = [2, 3, 4, 8, 10, 16, 21, 35, 42, 44, 46, 51, 55];

const KIND_FILTERS = [
  ['all', 'All'],
  ['story', 'Story'],
  ['missable', 'Missable'],
  ['collectible', 'Collectibles'],
  ['activity', 'Activities'],
  ['challenge', 'Challenges'],
  ['exploration', 'Exploration'],
  ['money', 'Money'],
  ['completion', 'Completion'],
  ['earned', 'Earned'],
  ['remaining', 'Remaining'],
];

const $ = (selector) => document.querySelector(selector);

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function loadEarned() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]');
    return new Set(Array.isArray(saved) ? saved.filter((id) => Number.isInteger(id)) : []);
  } catch {
    return new Set();
  }
}

function saveEarned(earned) {
  localStorage.setItem(STORE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function loadSpoiler() {
  return localStorage.getItem(SPOILER_KEY) === '1';
}

function saveSpoiler(on) {
  localStorage.setItem(SPOILER_KEY, on ? '1' : '0');
}

function stateFromUrl() {
  const params = new URLSearchParams(location.search);
  return {
    demo: params.get('demo') === '1',
    spoilerParam: params.get('spoiler') === '1',
    filterParam: params.get('filter') ?? '',
  };
}

const app = {
  data: null,
  trophies: [],
  earned: loadEarned(),
  spoiler: loadSpoiler(),
  filter: 'all',
  query: '',
  selectedId: null,
  tab: 'checklist',
};

function earnedCountByGrade() {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of app.trophies) {
    if (app.earned.has(trophy.id)) counts[trophy.grade] += 1;
  }
  return counts;
}

function renderProgress() {
  const total = app.trophies.length;
  const earned = app.earned.size;
  $('#progressCount').textContent = `${earned} / ${total}`;
  $('#progressFill').style.width = total ? `${Math.round((earned / total) * 100)}%` : '0%';
  const byGrade = earnedCountByGrade();
  const totals = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of app.trophies) totals[trophy.grade] += 1;
  $('#gradeCounts').textContent =
    `Earned ${byGrade.platinum} platinum · ${byGrade.gold} gold · ${byGrade.silver} silver · ${byGrade.bronze} bronze` +
    ` — of ${totals.platinum} platinum · ${totals.gold} gold · ${totals.silver} silver · ${totals.bronze} bronze in all`;
}

function trophyMatches(trophy) {
  if (app.query) {
    const haystack = `${trophy.name} ${trophy.description}`.toLowerCase();
    if (!haystack.includes(app.query.toLowerCase())) return false;
  }
  switch (app.filter) {
    case 'all': return true;
    case 'missable': return trophy.missable === true;
    case 'earned': return app.earned.has(trophy.id);
    case 'remaining': return !app.earned.has(trophy.id);
    default: return trophy.kind === app.filter;
  }
}

function renderChips() {
  $('#chips').innerHTML = KIND_FILTERS.map(([value, label]) =>
    `<button type="button" class="chip${app.filter === value ? ' active' : ''}" data-filter="${value}">${label}</button>`
  ).join('');
  $('#chips').querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      app.filter = button.dataset.filter;
      renderChips();
      renderList();
    });
  });
}

function renderList() {
  const list = $('#list');
  const visible = app.trophies.filter(trophyMatches);
  const earnedShown = visible.filter((trophy) => app.earned.has(trophy.id)).length;
  $('#listHint').textContent = visible.length === app.trophies.length
    ? `Showing all ${visible.length} trophies — ${earnedShown} earned. Click one to read its guide.`
    : `Showing ${visible.length} of ${app.trophies.length} trophies — ${earnedShown} earned.`;

  if (visible.length === 0) {
    list.innerHTML = '<li class="empty">No trophy matches that search or filter.</li>';
    return;
  }
  list.innerHTML = visible.map((trophy) => {
    const earned = app.earned.has(trophy.id);
    const spoiled = app.spoiler && (trophy.kind === 'story' || trophy.kind === 'completion') && !earned;
    const target = targetText(trophy);
    return `<li class="trophy-row${earned ? ' earned' : ''}${app.selectedId === trophy.id ? ' selected' : ''}" data-trophy="${trophy.id}">
      <input type="checkbox" ${earned ? 'checked' : ''} aria-label="Mark ${escapeHtml(trophy.name)} as earned" data-check="${trophy.id}">
      <span class="medal ${trophy.grade}" title="${gradeLabel(trophy.grade)}">${medalLetter(trophy.grade)}</span>
      <span class="${spoiled ? 'spoiled' : ''}">
        <span class="trophy-name">${escapeHtml(trophy.name)}</span>
        <span class="trophy-desc">${escapeHtml(trophy.description)}</span>
        <span class="trophy-meta">
          <span class="tag">${escapeHtml(kindLabel(trophy.kind))}</span>
          ${trophy.missable ? '<span class="tag missable">Missable</span>' : ''}
          ${target ? `<span class="tag count">${escapeHtml(target)}</span>` : ''}
          ${trophy.stage ? `<span class="tag">Roadmap stage ${trophy.stage}</span>` : ''}
        </span>
      </span>
      <span class="grade-label">${gradeLabel(trophy.grade)}</span>
    </li>`;
  }).join('');

  list.querySelectorAll('[data-check]').forEach((box) => {
    box.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleEarned(Number(box.dataset.check));
    });
  });
  list.querySelectorAll('[data-trophy]').forEach((row) => {
    row.addEventListener('click', () => openTrophy(Number(row.dataset.trophy)));
  });
}

function renderDetailPane() {
  const trophy = app.trophies.find((item) => item.id === app.selectedId) ?? null;
  const detail = $('#detail');
  if (trophy && app.spoiler && (trophy.kind === 'story' || trophy.kind === 'completion') && !app.earned.has(trophy.id)) {
    detail.innerHTML =
      `<h3>Hidden story trophy</h3>` +
      `<p class="official">This is a story trophy you have not earned yet, and the spoiler setting is on.</p>` +
      `<p>Its name, description and guide stay hidden until you earn it — or until you turn the spoiler setting off.</p>` +
      `<button class="earned-btn" type="button" data-spoiler-earned="${trophy.id}">Mark as earned</button>`;
    const button = detail.querySelector('[data-spoiler-earned]');
    if (button) button.addEventListener('click', () => toggleEarned(trophy.id));
    return;
  }
  renderDetail(detail, trophy, app.data, trophy ? app.earned.has(trophy.id) : false, {
    onToggleEarned: toggleEarned,
  });
}

function toggleEarned(id) {
  if (app.earned.has(id)) app.earned.delete(id);
  else app.earned.add(id);
  saveEarned(app.earned);
  renderProgress();
  renderList();
  renderDetailPane();
  renderRoadmapPanel();
  renderMissablesPanel();
}

function openTrophy(id) {
  app.selectedId = id;
  showTab('checklist');
  renderList();
  renderDetailPane();
  location.hash = `#/trophy/${id}`;
}

function showTab(tab) {
  app.tab = tab;
  document.querySelectorAll('.tab').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tab);
  });
  document.querySelectorAll('.panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `panel-${tab}`);
  });
}

function renderRoadmapPanel() {
  renderRoadmap($('#roadmapList'), app.trophies, app.earned, openTrophy);
}

function renderMissablesPanel() {
  renderMissables($('#missableList'), app.trophies, app.earned, openTrophy);
}

function renderSourcesPanel() {
  const sources = app.data.sources ?? {};
  $('#sourceList').innerHTML = Object.values(sources).map((source) =>
    `<li><strong>${escapeHtml(source.name)}</strong>` +
    `<p class="covers">${escapeHtml(source.covers)}</p>` +
    (source.url ? `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.url)}</a>` : '') +
    `</li>`
  ).join('');
}

function applyHash() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [view, arg] = hash.split('/');
  if (view === 'trophy' && Number(arg)) {
    app.selectedId = Number(arg);
    showTab('checklist');
  } else if (['checklist', 'roadmap', 'missables', 'sources'].includes(view)) {
    showTab(view);
  }
  renderList();
  renderDetailPane();
}

function exportProgress() {
  const payload = {
    game: 'Grand Theft Auto VI',
    guide: 'Leonida Legend',
    exportedAt: new Date().toISOString(),
    earned: [...app.earned].sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'leonida-legend-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const ids = Array.isArray(parsed.earned) ? parsed.earned : parsed;
      const valid = new Set(app.trophies.map((trophy) => trophy.id));
      const next = new Set(ids.filter((id) => valid.has(id)));
      app.earned = next;
      saveEarned(app.earned);
      renderProgress();
      renderList();
      renderDetailPane();
      renderRoadmapPanel();
      renderMissablesPanel();
    } catch {
      alert('That file is not a Leonida Legend progress export.');
    }
  };
  reader.readAsText(file);
}

async function boot() {
  const response = await fetch('data/trophies.json');
  app.data = await response.json();
  app.trophies = app.data.trophies ?? [];

  const url = stateFromUrl();
  if (url.demo && app.earned.size === 0) {
    app.earned = new Set(DEMO_EARNED);
    saveEarned(app.earned);
  }
  if (url.spoilerParam) {
    app.spoiler = true;
    saveSpoiler(true);
  }
  if (url.filterParam && KIND_FILTERS.some(([value]) => value === url.filterParam)) {
    app.filter = url.filterParam;
  }

  $('#spoilerToggle').checked = app.spoiler;
  $('#spoilerToggle').addEventListener('change', (event) => {
    app.spoiler = event.target.checked;
    saveSpoiler(app.spoiler);
    renderList();
    renderDetailPane();
  });
  $('#search').addEventListener('input', (event) => {
    app.query = event.target.value.trim();
    renderList();
  });
  $('#exportBtn').addEventListener('click', exportProgress);
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) importProgress(file);
    event.target.value = '';
  });
  $('#resetBtn').addEventListener('click', () => {
    if (confirm('Clear all earned trophies?')) {
      app.earned = new Set();
      saveEarned(app.earned);
      renderProgress();
      renderList();
      renderDetailPane();
      renderRoadmapPanel();
      renderMissablesPanel();
    }
  });
  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => {
      showTab(button.dataset.tab);
      location.hash = `#/${button.dataset.tab}`;
    });
  });
  window.addEventListener('hashchange', applyHash);

  renderChips();
  renderProgress();
  renderRoadmapPanel();
  renderMissablesPanel();
  renderSourcesPanel();
  applyHash();
  document.title = 'LEONIDA LEGEND — GTA VI Trophy Guide & Tracker';
}

boot().catch((error) => {
  $('#list').innerHTML = `<li class="empty">The trophy list could not be loaded (${escapeHtml(error.message)}). Serve app/ over HTTP and try again.</li>`;
});
