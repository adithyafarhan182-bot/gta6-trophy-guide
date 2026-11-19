// Leonida Legend — boot, state, tabs, filters, spoiler setting, progress save/load.
// The trophy data lives in data/trophies.json; the list itself is rendered by guide.js
// and the roadmap, missable and sources views by roadmap.js. Everything runs offline:
// the only request the app makes is a same-origin fetch of its own data file.
import { renderGuide } from './guide.js';
import { renderRoadmap, renderMissable, renderSources } from './roadmap.js';

const EARNED_KEY = 'leonida-legend-earned-v1';
const SPOILER_KEY = 'leonida-legend-spoiler-v1';
const SAMPLE_EARNED = [2, 3, 15, 16, 28, 35, 42, 52];

const params = new URLSearchParams(location.search);

const state = {
  view: params.get('view') || 'guide',
  kind: params.get('kind') || 'all',
  grade: params.get('grade') || 'all',
  query: params.get('q') || '',
  earnedOnly: false,
  spoiler: params.get('spoiler') === 'on' ? true
    : params.get('spoiler') === 'off' ? false
    : localStorage.getItem(SPOILER_KEY) === '1',
  openId: Number(params.get('open')) || null,
};

let doc = null;
let earned = loadEarned();

function loadEarned() {
  if (params.get('sample') === '1') return new Set(SAMPLE_EARNED);
  try {
    const raw = JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]');
    const ids = Array.isArray(raw) ? raw.filter((n) => Number.isInteger(n) && n >= 1 && n <= 55) : [];
    return new Set(ids);
  } catch {
    return new Set();
  }
}

function saveEarned() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function saveSpoiler() {
  localStorage.setItem(SPOILER_KEY, state.spoiler ? '1' : '0');
}

function toggleEarned(id) {
  if (earned.has(id)) earned.delete(id);
  else earned.add(id);
  saveEarned();
  renderAll();
}

function gradeCounts() {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const totals = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of doc.trophies) {
    totals[t.grade] += 1;
    if (earned.has(t.id)) counts[t.grade] += 1;
  }
  return { counts, totals };
}

function renderProgress() {
  const total = doc.trophies.length;
  document.getElementById('earnedCount').textContent = String(earned.size);
  document.getElementById('progressFill').style.width = `${Math.round((earned.size / total) * 100)}%`;
  const { counts, totals } = gradeCounts();
  document.getElementById('gradeCounts').textContent =
    `Platinum ${counts.platinum}/${totals.platinum} · Gold ${counts.gold}/${totals.gold} · ` +
    `Silver ${counts.silver}/${totals.silver} · Bronze ${counts.bronze}/${totals.bronze}`;
  document.getElementById('platinumNote').textContent =
    earned.size === total
      ? 'Platinum: Vice Got a Price! — earned. You are a Leonida Legend.'
      : `Platinum: Vice Got a Price! — ${total - earned.size} to go.`;
}

function renderAll() {
  renderProgress();
  renderGuide(doc, state, earned, toggleEarned);
  renderRoadmap(doc, state, earned, toggleEarned);
}

function setView(view) {
  state.view = view;
  document.querySelectorAll('#tabs button').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === view);
  });
  for (const name of ['guide', 'roadmap', 'missable', 'sources']) {
    document.getElementById(`view-${name}`).hidden = name !== view;
  }
  document.getElementById('controls').style.display = view === 'guide' ? '' : 'none';
}

function exportProgress() {
  const payload = {
    game: 'Grand Theft Auto VI',
    guide: 'Leonida Legend',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
  };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'leonida-legend-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) throw new Error('no earned list');
    const clean = ids.filter((n) => Number.isInteger(n) && n >= 1 && n <= 55);
    if (!clean.length && ids.length) throw new Error('no valid ids');
    earned = new Set(clean);
    saveEarned();
    renderAll();
  } catch {
    alert('That file is not a Leonida Legend progress export (a JSON list of trophy ids 1-55).');
  }
}

function wireControls() {
  document.querySelectorAll('#tabs button').forEach((b) => {
    b.addEventListener('click', () => setView(b.dataset.view));
  });
  const search = document.getElementById('search');
  search.value = state.query;
  search.addEventListener('input', () => {
    state.query = search.value;
    renderGuide(doc, state, earned, toggleEarned);
  });
  const grade = document.getElementById('grade');
  grade.value = state.grade;
  grade.addEventListener('change', () => {
    state.grade = grade.value;
    renderGuide(doc, state, earned, toggleEarned);
  });
  document.querySelectorAll('#kinds button').forEach((b) => {
    b.classList.toggle('active', b.dataset.kind === state.kind);
    b.addEventListener('click', () => {
      state.kind = b.dataset.kind;
      document.querySelectorAll('#kinds button').forEach((x) => {
        x.classList.toggle('active', x === b);
      });
      renderGuide(doc, state, earned, toggleEarned);
    });
  });
  const earnedOnly = document.getElementById('earnedOnly');
  earnedOnly.addEventListener('change', () => {
    state.earnedOnly = earnedOnly.checked;
    renderGuide(doc, state, earned, toggleEarned);
  });
  const spoiler = document.getElementById('spoiler');
  spoiler.checked = state.spoiler;
  spoiler.addEventListener('change', () => {
    state.spoiler = spoiler.checked;
    saveSpoiler();
    renderAll();
  });
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importFile').addEventListener('change', (e) => {
    importProgress(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Clear all earned ticks in this browser?')) {
      earned = new Set();
      saveEarned();
      renderAll();
    }
  });
}

async function boot() {
  doc = await (await fetch('data/trophies.json')).json();
  document.getElementById('dataNote').textContent =
    `Data: ${doc.list}. ${doc.trophies.length} trophies. ` +
    `Guides cite PowerPyx, Push Square, Exophase / PSNProfiles, GGRecon and Of Zen and Computing — see the Sources tab.`;
  wireControls();
  renderMissable(doc);
  renderSources(doc);
  setView(['guide', 'roadmap', 'missable', 'sources'].includes(state.view) ? state.view : 'guide');
  renderAll();
}

boot();
