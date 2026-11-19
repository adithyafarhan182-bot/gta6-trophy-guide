// Leonida Legend — the roadmap to the platinum, the missable-trophy view
// and the sources view. Stages are built from the official descriptions:
// which story chapters and missions, which collectibles and counts, in what order.
const STAGES = [
  {
    n: 0,
    title: 'Before you start',
    time: '15 minutes of setup',
    summary: 'Three habits that protect the whole run. GTA VI has no mission replay and no New Game+, so a missed step in Chapter 1 can cost a second playthrough.',
    steps: [
      'Turn cheats OFF and keep them off on this save — cheats disable trophies and saving (PowerPyx).',
      'Keep a manual save at the start of every chapter. There are 15 manual slots and 1 autosave; use 10 for chapter starts and ends, and rotate the other 5 for free-roam cleanup (PowerPyx).',
      'In Chapter 1, do the morning balcony meditation at Jason’s house — the one trophy that might be missable (see the Missable tab).',
    ],
    trophies: [],
  },
  {
    n: 1,
    title: 'Play the story — Chapters 1 to 5',
    time: '60–80 hours',
    summary: 'Just finish the campaign. Every chapter and mission trophy pops automatically, and the five vague story trophies land along the way. Progress you make now already counts toward the 100% checklist, even though you cannot see it until after the story.',
    trophies: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 47, 48, 49, 50, 51],
  },
  {
    n: 2,
    title: 'Side characters & strangers',
    time: 'about 10 hours',
    summary: 'Finish the questlines of the people you met on the road, then the stranger strands. All of these stay available after the story, so there is no rush — but start each strand when it appears, just in case.',
    trophies: [22, 23, 24, 25, 26, 27, 29],
  },
  {
    n: 3,
    title: 'Map & collectibles',
    time: 'about 20 hours',
    summary: 'Unfog the whole map first — everything else gets easier once you can see it. Then work the spots, the scans and the cards: meditate at every spot, WAiNK 100 locations, discover 100 vehicles, complete 3 card sets.',
    trophies: [42, 28, 31, 35, 30],
  },
  {
    n: 4,
    title: 'Races, stunts & shooting',
    time: 'about 25 hours',
    summary: 'The activities block: 250 stunts, gold in all 42 shooting range challenges, a drone race win at all 14 locations, 20 different race wins, a fishing win over Cal and one finished arcade game. Doing one of each activity type also closes Master of None.',
    trophies: [15, 17, 18, 19, 20, 21, 16],
  },
  {
    n: 5,
    title: 'Robberies & one-off feats',
    time: 'about 15 hours',
    summary: 'The crime block: 5 bank vaults, an armored truck, an undetected jewelry robbery, 3 shops in a row with your partner, one illegal operation per gang — plus the one-off feats (the VCIA airliner, the Rhino tank, the Banshee showroom smash, Kingpin Bowling, the Ocean Beach cocktail) and the partner feats.',
    trophies: [40, 41, 39, 34, 43, 37, 38, 45, 46, 44, 33, 36],
  },
  {
    n: 6,
    title: 'Money & property',
    time: 'about 10 hours',
    summary: 'Turn the robbery money into progress: launder $250,000 in marked bills through a fence, spend $100,000 across the shops, buy all 8 garages, and register 10 vehicles to the Scooter Bros app.',
    trophies: [52, 53, 54, 55],
  },
  {
    n: 7,
    title: '100% & the Platinum',
    time: 'about 60 hours',
    summary: 'Open the checklist under Progress, Stats, 100% Completion and finish what is left — usually the last challenges and the long tail of optional missions. A Long Road pops at 100%, and Vice Got a Price! follows immediately.',
    trophies: [32, 14, 1],
  },
];

function byId(doc, id) {
  return doc.trophies.find((t) => t.id === id);
}

export function renderRoadmap(doc, state, earned, onToggle) {
  const root = document.getElementById('roadmap');
  root.replaceChildren();
  for (const stage of STAGES) {
    const card = document.createElement('article');
    card.className = 'stage';
    const done = stage.trophies.filter((id) => earned.has(id)).length;
    const head = document.createElement('h2');
    head.innerHTML = `Stage ${stage.n} — ${stage.title} <span class="stage-time">${stage.time}</span>`;
    card.append(head);
    const summary = document.createElement('p');
    summary.textContent = stage.summary;
    card.append(summary);
    if (stage.steps) {
      const steps = document.createElement('ul');
      for (const step of stage.steps) {
        const li = document.createElement('li');
        li.textContent = step;
        steps.append(li);
      }
      card.append(steps);
    }
    if (stage.trophies.length) {
      const list = document.createElement('ul');
      for (const id of stage.trophies) {
        const t = byId(doc, id);
        const li = document.createElement('li');
        li.className = earned.has(id) ? 'done' : '';
        const tick = document.createElement('button');
        tick.type = 'button';
        tick.className = 'mini-tick';
        tick.textContent = '✓';
        tick.setAttribute('aria-label', `Mark ${t.name} earned`);
        tick.addEventListener('click', () => onToggle(id));
        const name = document.createElement('span');
        name.className = 'mini-name';
        name.textContent = t.name;
        const grade = document.createElement('span');
        grade.className = 'mini-grade';
        grade.textContent = `${t.grade} · ${t.target}`;
        li.append(tick, name, grade);
        list.append(li);
      }
      card.append(list);
      const count = document.createElement('p');
      count.className = 'stage-count';
      count.textContent = `${done} of ${stage.trophies.length} in this stage`;
      card.append(count);
    }
    root.append(card);
  }
}

export function renderMissable(doc) {
  const root = document.getElementById('missable');
  const trophy = byId(doc, 28);
  root.innerHTML = `
    <div class="warn-card">
      <h2>⚠ The one trophy that might be missable</h2>
      <p><strong>${trophy.name}</strong> — ${trophy.description} (${trophy.grade}, target: ${trophy.target}).</p>
      <p>${trophy.guide}</p>
      <p><strong>Sources:</strong> <a href="https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/" target="_blank" rel="noopener">PowerPyx</a> · <a href="https://www.ggrecon.com/articles/gta-6-trophies-achievements-list-platinum/" target="_blank" rel="noopener">GGRecon (GTABase)</a></p>
    </div>
    <div class="info-card">
      <h2>Why the rest is safe</h2>
      <ul class="safe-list">
        <li><strong>Story trophies cannot be missed.</strong> All 13 chapter and mission trophies pop automatically as you play (PowerPyx).</li>
        <li><strong>No mission replay, but free-roam after the story.</strong> Everything needed for the 100% checklist stays doable after the credits, and every trophy-related quest giver returns (PowerPyx).</li>
        <li><strong>Nothing on the 100% checklist is missable.</strong> Optional missions that disappear do not matter — there are 200–300+ of them and the checklist needs 100 (PowerPyx).</li>
        <li><strong>Side-character finals are safe.</strong> Andy, Kenton, Billy, Randy, Tyrone and Bret all stay available after the story; Kenton goes away after Chapter 1 and comes back in Chapters 2–3 (PowerPyx).</li>
        <li><strong>One single-source caution:</strong> TechWiser (via CryptoGames) warns that some stranger mission chains have windows tied to story progress. Start each stranger strand when it unlocks, to be safe.</li>
        <li><strong>Keep manual saves.</strong> 15 slots: one at the start of each chapter, then rotate the rest. If anything ever goes wrong, a chapter-start save is your way back (PowerPyx).</li>
      </ul>
    </div>
    <div class="info-card">
      <h2>Also worth knowing</h2>
      <ul class="safe-list">
        <li><strong>Cheats disable trophies and saving.</strong> Keep them off on your trophy save (PowerPyx, GTABase).</li>
        <li><strong>No online trophies.</strong> All 55 are single-player; no difficulty setting affects them (PowerPyx).</li>
        <li><strong>Five trophies were still unconfirmed at launch</strong> — In The Beginning…, Bad Luck, I Guess, The Truth Is Out There, Ten Pin (and the exact trigger of Personal Best was only just pinned down). Their guides say so plainly instead of guessing.</li>
      </ul>
    </div>`;
}

export function renderSources(doc) {
  const root = document.getElementById('sources');
  const items = doc.sourceList.map((s) => `
    <div class="source-item">
      <h3>${s.name}</h3>
      <p>${s.about}</p>
      <p><a href="${s.url}" target="_blank" rel="noopener">${s.url}</a></p>
    </div>`).join('');
  root.innerHTML = `
    <div class="info-card">
      <h2>Where every fact comes from</h2>
      <p>Official trophy names, descriptions and grades are shown as PlayStation publishes them, via Exophase cross-checked with PSNProfiles and TrueAchievements. Every guide on this page is written in my own words for this entry — sources are cited, never copied. Where a launch guide had not yet confirmed a method, the guide says so instead of inventing one.</p>
      ${items}
      <h2>How this guide was built</h2>
      <p>Roadmap stages and missable flags are built from the official descriptions: which story chapters and missions (Chapters 1–5, Gone Fishing to Operation Savage Glory), which collectibles and counts (250 stunts of 397, 42 shooting range challenges, 14 drone race locations, 18 meditation spots, 18 card sets, 100 WAiNK locations, 9 gangs, 8 garages), and in what order (PowerPyx roadmap: story, then side characters, then 100% cleanup). Counts were cross-checked between PowerPyx and Push Square wherever both list them.</p>
    </div>`;
}
