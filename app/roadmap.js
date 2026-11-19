// Roadmap to the platinum: eight stages built from the official descriptions.
// Each stage lists the trophies it covers, in the order to earn them.

export const ROADMAP = [
  {
    stage: 1,
    title: 'Play the story, in order',
    blurb: 'Chapters 1–4, the named story missions, and the finale. The finale can wait until your cleanup is done — the open world stays open after the story.',
    trophies: [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 7],
  },
  {
    stage: 2,
    title: 'Strangers & side stories',
    blurb: 'The character finales for Andy, Kenton, Billy, Randy and Tyrone, eight stranger strands across Leonida, Bret\u2019s hunt, and the partner beats.',
    trophies: [22, 23, 24, 26, 27, 25, 29, 47],
  },
  {
    stage: 3,
    title: 'See the whole state',
    blurb: 'Meditate at each spot the first time you reach its area — the one missable set — explore all 52 areas, and keep an eye out for the strange.',
    trophies: [28, 42, 50],
  },
  {
    stage: 4,
    title: 'Try everything once',
    blurb: 'The activities sampler: nine types to try, drone races at 14 locations, fishing against Cal, an arcade game, a cocktail on Ocean Beach, bowling, and a melee drive-by.',
    trophies: [16, 18, 20, 21, 44, 46, 51],
  },
  {
    stage: 5,
    title: 'Wheels & stunts',
    blurb: '250 stunts, 20 different race wins, 100 vehicles discovered, and 10 vehicles registered to the Scooter Bros app.',
    trophies: [15, 19, 35, 55],
  },
  {
    stage: 6,
    title: 'Heat & heists',
    blurb: 'Gold at all 42 Shooting Range challenges, wanted levels with your partner, quiet and loud robberies, and one operation for each of the 9 gangs.',
    trophies: [17, 33, 34, 36, 37, 38, 39, 40, 41, 43, 45],
  },
  {
    stage: 7,
    title: 'Money & collections',
    blurb: 'Three card sets, 100 WAiNK spots, 50 challenges, 500 choices, $250,000 laundered, $100,000 spent, and all 8 garages bought.',
    trophies: [30, 31, 32, 48, 49, 52, 53, 54],
  },
  {
    stage: 8,
    title: 'The last mile',
    blurb: 'Reach 100% completion — story, strands, activities, sets and challenges — and the platinum is yours.',
    trophies: [14, 1],
  },
];

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderRoadmap(listEl, trophies, earnedSet, onOpenTrophy) {
  const byId = new Map(trophies.map((trophy) => [trophy.id, trophy]));
  listEl.innerHTML = ROADMAP.map((stage) => {
    const done = stage.trophies.filter((id) => earnedSet.has(id)).length;
    const chips = stage.trophies.map((id) => {
      const trophy = byId.get(id);
      if (!trophy) return '';
      const isDone = earnedSet.has(id);
      return `<button type="button" data-roadmap-trophy="${id}" class="${isDone ? 'done' : ''}">${escapeHtml(trophy.name)}</button>`;
    }).join('');
    return `<li class="stage"><div class="stage-head"><span class="stage-num">Stage ${stage.stage}</span>` +
      `<h3>${escapeHtml(stage.title)}</h3>` +
      `<span class="stage-progress">${done} / ${stage.trophies.length} earned</span></div>` +
      `<p>${escapeHtml(stage.blurb)}</p><div class="trophy-chips">${chips}</div></li>`;
  }).join('');
  listEl.querySelectorAll('[data-roadmap-trophy]').forEach((button) => {
    button.addEventListener('click', () => onOpenTrophy(Number(button.dataset.roadmapTrophy)));
  });
}

export function renderMissables(containerEl, trophies, earnedSet, onOpenTrophy) {
  const missable = trophies.filter((trophy) => trophy.missable);
  if (missable.length === 0) {
    containerEl.innerHTML = '<p>No trophy in the official list is flagged missable.</p>';
    return;
  }
  containerEl.innerHTML = missable.map((trophy) => {
    const isDone = earnedSet.has(trophy.id);
    return `<article class="missable-card"><h3>${escapeHtml(trophy.name)} ${isDone ? '— earned ✓' : ''}</h3>` +
      `<p><strong>Official:</strong> &ldquo;${escapeHtml(trophy.description)}&rdquo; (${escapeHtml(trophy.grade)})</p>` +
      `<p>${escapeHtml(trophy.guide)}</p>` +
      `<button type="button" data-missable-open="${trophy.id}">Read the full guide →</button></article>`;
  }).join('');
  containerEl.querySelectorAll('[data-missable-open]').forEach((button) => {
    button.addEventListener('click', () => onOpenTrophy(Number(button.dataset.missableOpen)));
  });
}
