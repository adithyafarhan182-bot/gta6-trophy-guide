// Detail pane: the selected trophy's guide, steps, sources and earn state.
// Renders into #detail. Exported for app.js; also used by the roadmap chips.

export function medalLetter(grade) {
  return { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' }[grade] ?? '?';
}

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function kindLabel(kind) {
  const labels = {
    story: 'Story',
    collectible: 'Collectibles',
    activity: 'Activities',
    challenge: 'Challenges',
    exploration: 'Exploration',
    money: 'Money',
    completion: 'Completion',
  };
  return labels[kind] ?? kind;
}

export function targetText(trophy) {
  if (trophy.target == null) return null;
  if (trophy.target >= 1000) return 'PSN target: ' + trophy.target.toLocaleString('en-US');
  return 'PSN target: ' + trophy.target;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderDetail(detailEl, trophy, data, earned, callbacks) {
  if (!trophy) {
    detailEl.innerHTML =
      '<p class="detail-empty">Pick a trophy on the left to read its guide — what to do, ' +
      'where and how, and when it can be missed, with the sources for every fact.</p>' +
      '<p class="detail-empty">Start with the roadmap if you want the order to earn them in.</p>';
    return;
  }
  const sources = data.sources ?? {};
  const sourceItems = (trophy.sources ?? []).map((key) => {
    const source = sources[key];
    if (!source) return '';
    const link = source.url
      ? `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.url)}</a>`
      : '<span>Written for this guide</span>';
    return `<li><strong>${escapeHtml(source.name)}</strong> — ${escapeHtml(source.covers)}<br>${link}</li>`;
  }).join('');

  const steps = (trophy.steps ?? []).map((step) => `<li>${escapeHtml(step)}</li>`).join('');
  const target = targetText(trophy);
  const missableNote = trophy.missable
    ? `<div class="missable-note"><strong>Missable — plan around it.</strong> ` +
      `The spots are spread over the whole state, so meditate at each spot the first time ` +
      `you reach its area instead of leaving the set for after the story.</div>`
    : '';

  detailEl.innerHTML =
    `<h3>${escapeHtml(trophy.name)}</h3>` +
    `<p class="official">${gradeLabel(trophy.grade)} &middot; ${escapeHtml(kindLabel(trophy.kind))}` +
    (target ? ` &middot; ${escapeHtml(target)}` : '') +
    (trophy.missable ? ' &middot; Missable' : '') + `</p>` +
    `<p class="official">Official: &ldquo;${escapeHtml(trophy.description)}&rdquo;</p>` +
    `<h4>Guide</h4><p>${escapeHtml(trophy.guide)}</p>` +
    (steps ? `<h4>Steps</h4><ol class="steps">${steps}</ol>` : '') +
    missableNote +
    `<h4>Sources</h4><ul class="source-list-detail">${sourceItems}</ul>` +
    `<button class="earned-btn${earned ? ' earned' : ''}" type="button" data-earned-btn="${trophy.id}">` +
    (earned ? '✓ Earned — click to unmark' : 'Mark as earned') +
    `</button>` +
    `<div class="detail-nav"><span></span><span></span></div>`;

  const button = detailEl.querySelector('[data-earned-btn]');
  if (button) button.addEventListener('click', () => callbacks.onToggleEarned(trophy.id));
}
