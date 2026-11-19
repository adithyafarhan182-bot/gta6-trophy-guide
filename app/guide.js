// Leonida Legend — the trophy checklist: filters, search, spoiler hiding,
// expandable per-trophy guides with their cited sources.
const GRADE_LETTER = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' };
const KIND_LABEL = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectible',
  activities: 'Activity',
  side: 'Side quest',
  robbery: 'Robbery',
  money: 'Money',
};

function sourceUrl(doc, name) {
  const found = doc.sourceList.find((s) => s.name === name);
  return found ? found.url : null;
}

function isHidden(trophy, state, earned) {
  return state.spoiler && trophy.story && !earned.has(trophy.id);
}

function matchesSearch(trophy, state, earned) {
  const q = state.query.trim().toLowerCase();
  if (!q) return true;
  // With spoilers on, an unrevealed story trophy must not leak through search.
  if (isHidden(trophy, state, earned)) return false;
  const hay = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.target}`.toLowerCase();
  return q.split(/\s+/).every((word) => hay.includes(word));
}

function matchesFilters(trophy, state, earned) {
  if (state.kind === 'online') return false;
  if (state.kind !== 'all' && !trophy.kinds.includes(state.kind)) return false;
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.earnedOnly && !earned.has(trophy.id)) return false;
  return matchesSearch(trophy, state, earned);
}

function detailHtml(doc, trophy) {
  const unconfirmed = trophy.guide.startsWith('UNCONFIRMED AT LAUNCH');
  const guideText = unconfirmed ? trophy.guide.replace(/^UNCONFIRMED AT LAUNCH: /, '') : trophy.guide;
  const links = trophy.sources.map((name) => {
    const url = sourceUrl(doc, name);
    return url ? `<a href="${url}" target="_blank" rel="noopener">${name}</a>` : `<span>${name}</span>`;
  }).join('');
  return `
    <h3>Guide</h3>
    ${unconfirmed ? '<p class="unconfirmed"><strong>Unconfirmed at launch.</strong> No launch guide had pinned down this trophy yet — the method below is the working lead, not a verified fact.</p>' : ''}
    <p>${guideText}</p>
    <h3>Sources</h3>
    <p class="sources">${links}</p>
    <h3>Missable?</h3>
    <p class="${trophy.missable ? 'missable-note' : ''}">${trophy.missableNote}</p>
    <h3>Roadmap</h3>
    <p>Stage ${trophy.stage} of the roadmap to the platinum — see the Roadmap tab.</p>`;
}

function trophyItem(doc, trophy, state, earned, onToggle) {
  const li = document.createElement('li');
  li.className = `trophy${earned.has(trophy.id) ? ' earned' : ''}`;
  const hidden = isHidden(trophy, state, earned);
  const name = hidden ? 'Hidden story trophy' : trophy.name;
  const desc = hidden
    ? 'Hidden on PlayStation until earned. Tick it off to reveal it.'
    : trophy.description;
  const tags = trophy.kinds.map((k) => `<span class="tag">${KIND_LABEL[k] ?? k}</span>`).join('');
  const missableTag = trophy.missable ? '<span class="tag missable">Possibly missable</span>' : '';
  const hiddenTag = trophy.hidden ? '<span class="hidden-tag">Hidden</span>' : '';
  const targetTag = hidden ? '' : `<span class="tag target">Target: ${trophy.target}</span>`;
  li.innerHTML = `
    <div class="trophy-head">
      <button type="button" class="tick" aria-label="Mark ${trophy.name} earned" aria-pressed="${earned.has(trophy.id)}">✓</button>
      <button type="button" class="trophy-main" aria-expanded="false">
        <span class="trophy-name">${name}${hiddenTag}</span><br>
        <span class="trophy-desc">${desc}</span>
        <span class="trophy-tags">${tags}${missableTag}${targetTag}</span>
      </button>
      <span class="grade-dot ${trophy.grade}" title="${trophy.grade}"><span>${GRADE_LETTER[trophy.grade]}</span></span>
    </div>
    <div class="trophy-detail" hidden></div>`;
  const tick = li.querySelector('.tick');
  tick.addEventListener('click', (e) => {
    e.stopPropagation();
    onToggle(trophy.id);
  });
  const opener = li.querySelector('.trophy-main');
  const detail = li.querySelector('.trophy-detail');
  const openDetail = () => {
    const open = detail.hidden;
    detail.hidden = !open;
    opener.setAttribute('aria-expanded', String(open));
    if (open && !detail.dataset.filled) {
      detail.innerHTML = hidden
        ? '<h3>Guide</h3><p>This trophy is hidden until you earn it. Tick the box on the left once it pops to reveal its guide here.</p>'
        : detailHtml(doc, trophy);
      detail.dataset.filled = '1';
    }
  };
  opener.addEventListener('click', openDetail);
  if (state.openId === trophy.id) openDetail();
  return li;
}

export function renderGuide(doc, state, earned, onToggle) {
  const list = document.getElementById('trophyList');
  const meta = document.getElementById('listMeta');
  const empty = document.getElementById('emptyState');
  const shown = doc.trophies.filter((t) => matchesFilters(t, state, earned));
  list.replaceChildren();
  for (const trophy of shown) {
    list.append(trophyItem(doc, trophy, state, earned, onToggle));
  }
  empty.hidden = shown.length > 0 || state.kind === 'online';
  if (state.kind === 'online') {
    meta.textContent = 'Online: 0 trophies. All 55 are single-player — there are no online trophies in this list (PowerPyx).';
    empty.hidden = true;
  } else {
    const bits = [`Showing ${shown.length} of ${doc.trophies.length} trophies`];
    if (state.kind !== 'all') bits.push(`kind: ${state.kind}`);
    if (state.grade !== 'all') bits.push(`grade: ${state.grade}`);
    if (state.query.trim()) bits.push(`search: “${state.query.trim()}”`);
    if (state.earnedOnly) bits.push('earned only');
    if (state.spoiler) bits.push('spoilers hidden');
    meta.textContent = bits.join(' · ') + '.';
  }
}
