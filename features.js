'use strict';
/* =====================================================================
   BAGLE systems: living economy, world events, stock exchange view,
   professions & workshop, job + pickpocket minigames, extra road events.
   Loaded before game.js; functions run only after game.js has booted.
   ===================================================================== */

const WE = Object.fromEntries(WORLD_EVENTS.map(e => [e.id, e]));
const PROF = Object.fromEntries(PROFESSIONS.map(p => [p.id, p]));
const MAX_ENERGY = 5;
const hustleScale = () => Math.pow(1.7, S.lvl - 1);

/* ---------- profession helpers ---------- */
const prof = () => (S.prof ? PROF[S.prof] : null);
const pp = k => { const p = prof(); return p && p.p[k] != null ? p.p[k] : 0; };
const profChangeCost = () => Math.round(80 * lvlScale(1.5));
function profMult(it) {
  let m = 1 + pp('all');
  const s = pp('sell'); if (s && s[it.cat]) m += s[it.cat];
  if (INVENTED.has(it.id)) m += pp('invent');
  return m;
}
const sneakTotal = () => 1 - (1 - (bag().sneak || 0)) * (1 - pp('sneak'));

/* ---------- living economy ---------- */
const activeEvents = () => (S.world || []).filter(w => w.start <= S.day && S.day <= w.end);
const upcomingEvents = () => (S.world || []).filter(w => w.start > S.day);
function eventMult(tid, cat) {
  let m = 1;
  for (const w of activeEvents()) { const ev = WE[w.id]; if (!ev.towns || ev.towns.includes(tid)) m *= ev.cats[cat] || 1; }
  return m;
}
function demandOf(tid, cat) {
  const d = S.days[tid] || {};
  let v = ((S.dem[tid] || {})[cat] || 1) * eventMult(tid, cat);
  if (d.hot === cat) v *= d.hotM;
  if (d.crash === cat) v *= .5;
  return v;
}
const priceIndex = (tid, cat) => TW[tid].m[cat] * demandOf(tid, cat);
function initWorld() {
  S.dem = S.dem || {}; S.hist = S.hist || {}; S.world = S.world || [];
  for (const t of TOWNS) {
    S.dem[t.id] = S.dem[t.id] || {}; S.hist[t.id] = S.hist[t.id] || {};
    for (const c in CATS) {
      if (S.dem[t.id][c] == null) S.dem[t.id][c] = rnd(.85, 1.15);
      S.hist[t.id][c] = S.hist[t.id][c] || [];
    }
  }
}
function worldTick() {
  initWorld();
  // demand drifts every day (random walk pulled back toward normal)
  for (const t of TOWNS) for (const c in CATS) {
    let d = S.dem[t.id][c];
    d = d * Math.exp(rnd(-.13, .13)) + (1 - d) * .12;
    S.dem[t.id][c] = clamp(d, .55, 1.8);
  }
  // world events: start, end, new rumors
  for (const w of S.world) if (w.end === S.day - 1) log(`📰 ${WE[w.id].e} ${WE[w.id].name} is over. Prices are calming down.`);
  S.world = S.world.filter(w => w.end >= S.day);
  for (const w of S.world) if (w.start === S.day) {
    const ev = WE[w.id];
    toast(`📰 <b>${ev.e} ${ev.name}!</b><br>${evEffects(ev)}${ev.towns ? ' in ' + evWhere(ev) : ' everywhere'} for ${w.end - w.start + 1} days.`, 6500);
    log(`📰 ${ev.e} ${ev.name} has begun! ${ev.news}`);
  }
  if (S.world.length < 2 && Math.random() < .28) {
    const opts = WORLD_EVENTS.filter(e => !S.world.some(w => w.id === e.id));
    const ev = pick(opts), start = S.day + ri(1, 3);
    S.world.push({ id: ev.id, start, end: start + ri(ev.days[0], ev.days[1]) - 1 });
    toast(`🔮 <b>Rumor:</b> ${ev.e} ${ev.name} expected in ${start - S.day} day(s)!<br><small>${evEffects(ev)} — stock up now?</small>`, 6000);
    log(`🔮 Rumor: ${ev.e} ${ev.name} expected in ${start - S.day} day(s).`);
  }
}
function recordHist() {
  for (const t of TOWNS) for (const c in CATS) {
    const h = S.hist[t.id][c]; h.push(+priceIndex(t.id, c).toFixed(3)); if (h.length > 14) h.shift();
  }
}
const evEffects = ev => Object.entries(ev.cats).map(([c, m]) => `${CATS[c].e}×${m}`).join(' ');
const evWhere = ev => ev.towns.map(id => TW[id].e).join('');

/* ---------- trade advice ---------- */
function bestSale(inv) { // best unlocked town to sell this item today
  let best = null;
  for (const t of TOWNS) {
    if (!unlocked(t)) continue;
    const p = sellPrice(inv, t.id);
    if (p !== null && (!best || p > best.p)) best = { t, p };
  }
  return best;
}
function tradeTips() {
  const tips = [];
  S.market.forEach((o, k) => {
    if (o.stock <= 0 || o.rev) return;
    const b = bestSale({ id: o.id, q: o.q, paid: o.price });
    if (b && b.t.id !== S.town && b.p > o.price * 1.15) tips.push({ o, k, b, gain: b.p - o.price, pct: b.p / o.price - 1 });
  });
  return tips.sort((a, b) => b.gain * Math.min(b.o.stock, 3) - a.gain * Math.min(a.o.stock, 3)).slice(0, 3);
}

/* ---------- energy ---------- */
function useEnergy() {
  if (S.energy <= 0) { toast('😴 Too tired! Sleep to restore ⚡ (the street is free).'); SFX.bad(); return false; }
  S.energy--; return true;
}

/* ---------- workshop ---------- */
const recipes = () => BASE_RECIPES.concat(prof() ? prof().recipes : []);
function needCounts(r) { const n = {}; for (const id of r.in) n[id] = (n[id] || 0) + 1; return n; }
function canCraft(r) { const n = needCounts(r); return Object.keys(n).every(id => S.inv.filter(i => i.id === id).length >= n[id]); }
function craft(out) {
  const r = recipes().find(x => x.out === out); if (!r) return;
  if (!canCraft(r)) { SFX.bad(); return toast('🧺 Missing ingredients! Buy them in a market or the workshop.'); }
  if (!useEnergy()) return;
  const n = needCounts(r); let paid = 0;
  for (const id in n) {
    const have = S.inv.filter(i => i.id === id).sort((a, b) => a.q - b.q).slice(0, n[id]);
    for (const i of have) paid += i.paid;
    S.inv = S.inv.filter(i => !have.includes(i));
  }
  const it = IT[out], q = pp('inventQ') || 3;
  addInv({ id: out, q, paid });
  S.stats.crafted++; gainXP(10 + S.lvl * 3);
  SFX.rare(); confetti(50);
  toast(`💡 <b>INVENTED:</b> ${it.e} ${it.name}!`);
  log(`💡 Invented ${it.e} ${it.name} (${q}★). Sells for ~${fmt(sellPrice({ id: out, q, paid }))} here.`);
  commit();
}
function buyRaw(id) {
  if (free() <= 0) { SFX.bad(); return toast('🎒 Bag is full!'); }
  if (S.money < 1) { SFX.bad(); return toast('💸 You cannot afford ₲1. Oof.'); }
  S.money -= 1; addInv({ id, q: ri(1, 3), paid: 1 }); SFX.buy();
  log(`🛒 Bought ${IT[id].e} ${IT[id].name} for ₲1. A bargain.`);
  commit();
}
const relabelFee = inv => (pp('forge') ? 0 : Math.max(1, Math.round(IT[inv.id].base * QMULT[inv.q - 1] * .15)));
function relabel(u) {
  const inv = S.inv.find(i => i.u === u); if (!inv || inv.q >= 5) return;
  const fee = relabelFee(inv);
  if (S.money < fee) { SFX.bad(); return toast('💸 Not enough money for fancy labels.'); }
  if (!useEnergy()) return;
  S.money -= fee; inv.q++; inv.forged = true; S.stats.relabeled++; addKarma(-1);
  SFX.buy();
  const it = IT[inv.id];
  toast(`🏷️ Your ${it.e} ${it.name} is now <b>${'★'.repeat(inv.q)}</b> "premium quality". Wink.`);
  log(`🏷️ Relabeled ${it.e} ${it.name} to ${inv.q}★ (forged label). Strict guards may notice.`);
  commit();
}
function chooseProf(id) {
  if (S.prof === id) return;
  const cost = S.prof ? profChangeCost() : 0;
  if (S.money < cost) { SFX.bad(); return toast('💸 Career changes are expensive.'); }
  S.money -= cost; S.prof = id; showProfList = false;
  const p = PROF[id];
  SFX.level(); confetti(80);
  log(`💼 You are now a ${p.e} ${p.name}!`);
  commit();
  showModal({ art: p.e, title: `You're a ${p.name}!`, cls: 'rays',
    text: `<p>✨ <b>Perk:</b> ${p.perk}</p><p>💼 <b>Job:</b> ${p.job.name}</p><p>💡 <b>Inventions:</b> ${p.recipes.map(r => IT[r.out].e + ' ' + IT[r.out].name).join(', ')}</p><p class="sub">Find them in the 🛠️ Work tab.</p>`,
    choices: [{ label: 'Time to hustle! 💪', cls: 'good' }] });
}
let showProfList = false;

/* ---------- job minigame ---------- */
function startJob() {
  const p = prof();
  const j = p ? p.job : { name: 'Chase rats out of the tavern', t: '🐀', bad: '🐈' };
  if (!useEnergy()) return;
  commit();
  const rate = 1.5 * hustleScale() * (1 + pp('jobs'));
  showModal({ art: j.t, title: j.name, text: `<p style="text-align:center">Click every ${j.t} — <b>avoid</b> ${j.bad}!</p>
    <div class="mg-bar"><span>⏱️ <b id="mg-time">10.0</b>s</span><span>Score: <b id="mg-score">0</b></span><span>Pay: <b id="mg-pay">₲0</b></span></div>
    <div class="whack" id="mg-grid">${'<div class="hole"></div>'.repeat(12)}</div>`, choices: [] });
  const holes = [...document.querySelectorAll('#mg-grid .hole')];
  let score = 0, t0 = performance.now(), over = false;
  const upd = () => { $('#mg-score').textContent = score; $('#mg-pay').textContent = fmt(Math.max(0, score) * rate); };
  holes.forEach(h => h.addEventListener('pointerdown', e => {
    if (over || !h.dataset.k) return;
    const good = h.dataset.k === 'g';
    score += good ? 1 : -2;
    h.dataset.k = ''; h.textContent = good ? '✨' : '💢'; h.className = 'hole ' + (good ? 'hit' : 'oops');
    good ? SFX.sell(Math.min(score, 20)) : (SFX.bad(), shake());
    floatText(e.clientX, e.clientY - 10, good ? '+1' : '-2', good ? '' : 'neg');
    upd();
  }));
  const spawn = setInterval(() => {
    const el = performance.now() - t0;
    const empty = holes.filter(h => !h.dataset.k);
    if (!empty.length) return;
    const h = pick(empty), g = Math.random() > .22;
    h.dataset.k = g ? 'g' : 'b'; h.textContent = g ? j.t : j.bad; h.className = 'hole up';
    const life = Math.max(520, 1000 - el / 14);
    setTimeout(() => { if (h.dataset.k) { h.dataset.k = ''; h.textContent = ''; h.className = 'hole'; } }, life);
  }, 380);
  const timer = setInterval(() => {
    const left = Math.max(0, 10 - (performance.now() - t0) / 1000);
    const te = $('#mg-time'); if (te) te.textContent = left.toFixed(1);
    if (left <= 0) {
      over = true; clearInterval(spawn); clearInterval(timer);
      const pay = Math.round(Math.max(0, score) * rate);
      S.money += pay; S.stats.jobsDone++; gainXP(Math.max(0, score) * 2 + 5);
      if (score >= 15) { SFX.jackpot(); confetti(100); } else SFX.level();
      log(`💼 Worked a shift (${j.name}): score ${score}, earned ${fmt(pay)}.`);
      commit();
      const grade = score >= 20 ? '🏆 EMPLOYEE OF THE MONTH!' : score >= 12 ? '👍 Solid work!' : score > 0 ? '😐 The boss sighs.' : '💀 You are somehow worse than useless.';
      showModal({ art: j.t, title: 'Shift over!', text: `<p style="text-align:center;font-size:18px">${grade}</p><p style="text-align:center">Score <b>${score}</b> → paid <b>${fmt(pay)}</b></p>`,
        choices: [S.energy > 0 ? { label: `Another shift (⚡${S.energy} left)`, cls: 'good', act: () => { setTimeout(startJob, 30); return 'skip'; } } : null, { label: 'Done' }].filter(Boolean) });
    }
  }, 100);
}

/* ---------- pickpocket minigame ---------- */
function startSteal(id) {
  const T = PICK_TARGETS.find(x => x.id === id); if (!T) return;
  if (!useEnergy()) return;
  commit();
  const w = Math.min(.6, T.zone * (1 + pp('steal')));
  const z0 = rnd(.08, .92 - w);
  showModal({ art: T.e, title: `Pickpocket: ${T.name}`, text: `<p style="text-align:center">Press <b>GRAB</b> (or Space) when the hand is in the <b style="color:#1f8e46">green zone</b>!</p>
    <div class="steal-bar"><div class="steal-zone" style="left:${z0 * 100}%;width:${w * 100}%"></div><div class="steal-needle" id="needle">✋</div></div>`,
    choices: [{ label: '🫳 GRAB!', cls: 'danger', act: () => resolve() }] });
  let pos = 0, raf, t0 = performance.now(), done = false;
  const loop = now => {
    const t = (now - t0) / 1000;
    pos = Math.abs(((t * T.speed * .9) % 2) - 1); // triangle wave 0..1
    const n = $('#needle'); if (n) n.style.left = (pos * 100) + '%';
    if (t > 7 && !done) { done = true; cancelAnimationFrame(raf); showModal(stealResult(T, false, true)); commit(); return; }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  function resolve() {
    if (done) return 'skip';
    done = true; cancelAnimationFrame(raf);
    return stealResult(T, pos >= z0 && pos <= z0 + w, false);
  }
}
function stealResult(T, ok, slow) {
  const t = town();
  if (ok) {
    const loot = Math.round(rnd(T.loot[0], T.loot[1]) * hustleScale() * (1 + pp('steal') * .6));
    S.money += loot; S.stats.stolen++; S.rep.pirates += 1; addKarma(T.karma);
    let itemTxt = '';
    if (Math.random() < T.item && free() > 0) {
      const pool = ITEMS.filter(i => !i.special && i.base <= itemCap() * (T.id === 'noble' ? 2 : 1) && i.cat !== 'contra');
      const it = pick(pool); addInv({ id: it.id, q: ri(2, 5), paid: 0 }); itemTxt = ` …and a ${it.e} <b>${it.name}</b>!`;
    }
    SFX.jackpot(); confetti(60);
    log(`🧤 Pickpocketed a ${T.name}: +${fmt(loot)}.`);
    return { art: '🤑', title: 'Clean grab!', text: `<p>You lift <b>${fmt(loot)}</b> from the ${T.name}${itemTxt}</p><p class="sub">${T.karma ? 'Karma ' + T.karma + '. ' : ''}${pick(['Nobody saw a thing.', 'Smooth like butter.', 'Your fingers are legends.'])}</p>` };
  }
  const fine = Math.min(S.money, Math.round(rnd(T.loot[0], T.loot[1]) * hustleScale() * 1.2));
  S.money -= fine; S.heat = Math.min(100, S.heat + Math.round(T.heat * (.5 + t.strict * 1.5))); addKarma(-1); S.streak = 0;
  SFX.bad(); shake();
  log(`🚨 Caught pickpocketing a ${T.name}! Paid ${fmt(fine)}.`);
  return { art: '🚨', title: slow ? 'Too slow!' : 'CAUGHT!', text: `<p>${slow ? `The ${T.name} notices you lurking for way too long.` : `The ${T.name} grabs your wrist. "${pick(['THIEF!', 'Not today, bag goblin!', 'Guards! GUARDS!', 'Really? In this economy?'])}"`}</p><p>You pay <b>${fmt(fine)}</b> to make it go away. Heat rises.</p>` };
}

/* ---------- rendering: Exchange (stock view) ---------- */
function spark(arr) {
  if (arr.length < 2) return '<svg class="spark"></svg>';
  const lo = Math.min(...arr), hi = Math.max(...arr), rg = Math.max(.2, hi - lo);
  const pts = arr.map((v, i) => `${(i / (arr.length - 1) * 88 + 1).toFixed(1)},${(22 - (v - lo) / rg * 20).toFixed(1)}`).join(' ');
  const up = arr[arr.length - 1] >= arr[0];
  return `<svg class="spark" viewBox="0 0 90 24"><polyline points="${pts}" fill="none" stroke="${up ? '#1f8e46' : '#c0392b'}" stroke-width="2" stroke-linejoin="round"/></svg>`;
}
function renderNews() {
  const act = activeEvents().map(w => { const ev = WE[w.id]; const left = w.end - S.day + 1;
    return `<div class="news on"><b>${ev.e} ${ev.name}</b> <span class="tag hot">${evEffects(ev)}</span> ${ev.towns ? 'in ' + evWhere(ev) : 'everywhere'} · <b>${left}</b> day${left > 1 ? 's' : ''} left<br><small>${ev.news}</small></div>`; });
  const up = upcomingEvents().map(w => { const ev = WE[w.id];
    return `<div class="news"><b>🔮 Rumor:</b> ${ev.e} ${ev.name} in <b>${w.start - S.day}</b> day(s) <span class="tag">${evEffects(ev)}</span> ${ev.towns ? evWhere(ev) : ''}</div>`; });
  return act.concat(up).join('') || '<div class="news">📰 No big news. The realm is boring today.</div>';
}
function renderExchange() {
  const cat = S.xcat || 'food';
  const sample = ITEMS.filter(i => i.cat === cat && !i.special && i.base <= Math.max(10, itemCap())).pop() || ITEMS.find(i => i.cat === cat);
  const rows = TOWNS.map(t => {
    const idx = priceIndex(t.id, cat), h = S.hist[t.id][cat], prev = h.length > 1 ? h[h.length - 2] : idx;
    const ch = (idx / prev - 1) * 100;
    return { t, idx, h, ch, ok: unlocked(t) };
  }).sort((a, b) => b.idx - a.idx);
  const max = Math.max(...rows.filter(r => r.ok).map(r => r.idx)), min = Math.min(...rows.filter(r => r.ok).map(r => r.idx));
  const table = rows.map(r => `<div class="xrow ${r.ok ? '' : 'locked'} ${r.t.id === S.town ? 'here' : ''}">
      <span class="xt">${r.t.e} ${r.t.name}${r.t.id === S.town ? ' 📍' : ''}</span>
      ${spark(r.h)}
      <span class="xi ${r.ok && r.idx === max ? 'best' : r.ok && r.idx === min ? 'worst' : ''}">×${r.idx.toFixed(2)}</span>
      <span class="xc ${r.ch >= 0 ? 'up' : 'down'}">${r.ch >= 0 ? '▲' : '▼'}${Math.abs(r.ch).toFixed(0)}%</span>
      <span class="xs">${fmt(sellPrice({ id: sample.id, q: 3, paid: 0 }, r.t.id))}</span></div>`).join('');
  const groups = {};
  for (const i of S.inv) { const k = i.id + ':' + i.q; (groups[k] = groups[k] || { i, n: 0 }).n++; }
  const bagRows = Object.values(groups).map(({ i, n }) => {
    const it = IT[i.id], b = bestSale(i), here = sellPrice(i);
    if (here === null) return `<div class="xrow"><span class="xt">${it.e} ${n > 1 ? n + '× ' : ''}${it.name}</span><span>🎲 pure luck</span></div>`;
    return `<div class="xrow"><span class="xt">${it.e} ${n > 1 ? n + '× ' : ''}${it.name} ${'★'.repeat(i.q)}</span>
      <span>here ${fmt(here)}</span><span class="xi best">${b ? b.t.e + ' ' + fmt(b.p) : ''}</span></div>`;
  }).join('') || '<p class="sub">Your bag is empty.</p>';
  return `<h2>📈 Bag Street Exchange</h2>
    <p class="sub">Demand changes every day. World events push whole categories up or down for days — buy before, sell during!</p>
    ${renderNews()}
    <div class="xcats">${Object.entries(CATS).map(([k, c]) => `<button class="btn sm ${k === cat ? 'blue' : ''}" data-act="xcat" data-arg="${k}">${c.e} ${c.name}</button>`).join('')}</div>
    <div class="xhead"><span>Town</span><span>14 days</span><span>Price</span><span>Today</span><span>${sample.e} 3★</span></div>
    ${table}
    <h3>🎒 Where to sell your bag</h3>${bagRows}`;
}

/* ---------- rendering: Work tab ---------- */
function renderWork() {
  const p = prof();
  const en = `<div class="energy">${Array.from({ length: MAX_ENERGY }, (_, i) => `<i class="${i < S.energy ? 'on' : ''}">⚡</i>`).join('')}<span>${S.energy}/${MAX_ENERGY} energy · refills when you sleep or travel</span></div>`;
  let profHTML;
  if (!p || showProfList) {
    profHTML = `<h3>💼 ${p ? 'Change profession (' + fmt(profChangeCost()) + ')' : 'Choose a profession (free!)'}</h3>
      ${p ? '<button class="btn sm" data-act="profmenu">← Keep my job</button>' : '<p class="sub">Each profession has a perk, its own job minigame and 2 ridiculous inventions.</p>'}
      <div class="prof-grid">${PROFESSIONS.map(x => `<button class="prof ${x.id === S.prof ? 'on' : ''}" data-act="prof" data-arg="${x.id}" title="${x.perk}">
        <b>${x.e}</b><span class="pn">${x.name}</span><span class="pp">${x.perk}</span><span class="pr">${x.recipes.map(r => IT[r.out].e).join(' ')}</span></button>`).join('')}</div>`;
  } else {
    profHTML = `<div class="card here"><div class="card-row"><div class="card-e">${p.e}</div><div class="card-b">
      <div class="card-t">${p.name}</div><div class="card-d">✨ ${p.perk}</div></div>
      <button class="btn sm" data-act="profmenu">Change</button></div></div>`;
  }
  const j = p ? p.job : { name: 'Chase rats out of the tavern', t: '🐀' };
  const rate = 1.5 * hustleScale() * (1 + pp('jobs'));
  const jobHTML = `<div class="card"><div class="card-row"><div class="card-e">${j.t}</div><div class="card-b">
    <div class="card-t">${j.name}</div><div class="card-d">10-second minigame. ~${fmt(rate)} per hit. Good shifts pay ${fmt(rate * 20)}+.</div></div>
    <button class="btn sm good" data-act="job" ${S.energy > 0 ? '' : 'disabled'}>Work ⚡1</button></div></div>`;
  const recHTML = recipes().map(r => {
    const out = IT[r.out], n = needCounts(r), ok = canCraft(r);
    const ins = Object.entries(n).map(([id, c]) => { const have = S.inv.filter(i => i.id === id).length;
      return `<span class="ing ${have >= c ? 'ok' : ''}" title="${IT[id].name}">${IT[id].e}${have}/${c}</span>`; }).join('+');
    const v = sellPrice({ id: r.out, q: pp('inventQ') || 3, paid: 0 });
    return `<div class="card"><div class="card-row"><div class="card-e">${out.e}</div><div class="card-b">
      <div class="card-t" style="font-size:15px">${out.name}</div><div class="card-d">${ins} → sells ~<b>${fmt(v)}</b> here<br><i>${out.desc}</i></div></div>
      <button class="btn sm ${ok ? 'purple' : ''}" data-act="craft" data-arg="${r.out}" ${ok && S.energy > 0 ? '' : 'disabled'}>Invent ⚡1</button></div></div>`;
  }).join('');
  const rel = S.inv.filter(i => i.q < 5 && !['crate', 'chicken'].includes(i.id));
  const relHTML = rel.length ? `<div class="relabel">${rel.map(i => { const it = IT[i.id], fee = relabelFee(i);
    return `<button class="btn sm" data-act="relabel" data-arg="${i.u}" ${S.energy > 0 && S.money >= fee ? '' : 'disabled'} title="${it.name}: ${i.q}★ → ${i.q + 1}★ for ${fmt(fee)}">${it.e} ${i.q}→${i.q + 1}★ ${fee ? fmt(fee) : 'free'}</button>`; }).join('')}</div>`
    : '<p class="sub">Nothing to relabel. Everything is already "premium".</p>';
  const stealHTML = PICK_TARGETS.map(T => `<button class="btn sm danger" data-act="steal" data-arg="${T.id}" ${S.energy > 0 ? '' : 'disabled'}>${T.e} ${T.name}<br><small>~${fmt(T.loot[0] * hustleScale())}–${fmt(T.loot[1] * hustleScale())}</small></button>`).join('');
  return `<h2>🛠️ Work & Hustle</h2>${en}${profHTML}
    <h3>💼 Job</h3>${jobHTML}
    <h3>💡 Workshop: invent stuff</h3>
    <p class="sub">Combine junk into "products". Raw materials: <button class="btn sm" data-act="raw" data-arg="dirt">🟫 Dirt ₲1</button> <button class="btn sm" data-act="raw" data-arg="water">🫗 Water ₲1</button></p>
    ${recHTML}
    <h3>🏷️ Relabel (fake the quality)</h3>
    <p class="sub">Slap a "★ PREMIUM ★" sticker on it: +1★ = higher price. Forged labels count as fakes in strict towns. ⚡1 each.</p>${relHTML}
    <h3>🧤 Pickpocket</h3>
    <p class="sub">Timing minigame. Richer targets are harder. Getting caught costs money & heat${town().strict >= .4 ? ' — <b>strict guards here!</b>' : ''}.</p>
    <div class="steal-grid">${stealHTML}</div>`;
}

/* ---------- extra road events ---------- */
function extraEvents() {
  const war = activeEvents().some(w => w.id === 'war' || w.id === 'goblins');
  const cold = activeEvents().some(w => w.id === 'cold');
  const plague = activeEvents().some(w => w.id === 'plague');
  return [
    { w: 1, f: evWallet },
    { w: .8, f: evTroll },
    { w: S.money > 10 ? .7 : 0, f: evWell },
    { w: S.money > 20 ? .7 : 0, f: evShell },
    { w: S.inv.length ? .6 : 0, f: evRain },
    { w: free() > 0 ? .35 * (pp('found') || 1) : 0, f: evMeteor },
    { w: .7, f: evNobleCart },
    { w: S.money > 30 ? .6 : 0, f: evWitch },
    { w: S.inv.length ? .7 : 0, f: evCaravan },
    { w: war && free() > 0 ? 2 : 0, f: evDeserter },
    { w: cold && S.inv.some(i => IT[i.id].cat === 'cloth') ? 2.5 : 0, f: evFreezing },
    { w: plague && S.inv.some(i => IT[i.id].cat === 'potion') ? 2.5 : 0, f: evSick },
  ];
}
function evWallet() {
  const amt = Math.round(rnd(15, 45) * lvlScale(1.45));
  return { art: '👛', title: 'A Lost Wallet!', text: `<p>You find a fat wallet in the mud. It contains <b>${fmt(amt)}</b> and a tiny portrait of someone's grandma.</p>`,
    choices: [
      { label: '😇 Return it', cls: 'good', act: () => { const k = addKarma(3); S.stats.deeds++;
        if (Math.random() < .4) { const r = Math.round(amt * 1.5); S.money += r; return `The owner weeps with joy and gives you a reward of <b>${fmt(r)}</b>! Karma +${k}.`; }
        return `The owner hugs you. No reward, but your heart (and karma +${k}) grow.`; } },
      { label: '🤑 Keep it', act: () => { S.money += amt; addKarma(-2); return `${fmt(amt)} richer. The grandma portrait stares at you. Karma -2.`; } },
    ] };
}
function evTroll() {
  const r = pick(RIDDLES), toll = Math.max(5, Math.round(S.money * .1));
  const order = [0, 1, 2].sort(() => Math.random() - .5);
  return { art: '🧌', title: 'Troll Bridge', text: `<p>A troll blocks the bridge. "ANSWER RIDDLE OR PAY ${fmt(toll)}!"</p><p><b>"${r.q}"</b></p>`,
    choices: order.map(i => ({ label: r.a[i], act: () => {
      if (i === r.ok) { const g = Math.round(rnd(10, 30) * lvlScale()); S.money += g; gainXP(15 * S.lvl); return `"CORRECT! TROLL IS IMPRESSED." The troll gives you ${fmt(g)} from his toll jar.`; }
      S.money -= Math.min(S.money, toll); return `"WRONG! HAHA!" You pay ${fmt(toll)}. The troll uses it to buy a hat.`;
    } })) };
}
function evWell() {
  const coin = Math.max(5, Math.round(S.money * .05));
  return { art: '⛲', title: 'Wishing Well', text: `<p>An old well with a sign: "WISHES ${fmt(coin)}. RESULTS NOT GUARANTEED."</p>`,
    choices: [
      { label: `🪙 Toss ${fmt(coin)} and wish`, act: () => { S.money -= coin; const r = Math.random();
        if (r < .12) { const w = coin * 15; S.money += w; confetti(120); SFX.jackpot(); return `💫 The well burps out <b>${fmt(w)}</b>! Wishes ARE real!`; }
        if (r < .35) { S.blessing = (S.blessing || 0) + 3; return '✨ You feel lucky. Your next 3 sales get +30%!'; }
        return pick(['*splash*. Nothing. The well says "thanks".', 'A frog jumps out and takes another coin. Rude.', 'Your wish for "infinite bags" is noted and ignored.']); } },
      { label: 'Walk on', act: () => 'Wishes are for people without bags.' },
    ] };
}
function evShell() {
  const bet = Math.max(10, Math.round(S.money * .12));
  const cup = () => ({ act: () => { S.money -= bet; if (Math.random() < .33) { const w = Math.round(bet * 2.7); S.money += w; SFX.jackpot(); confetti(80); return `🎉 FOUND IT! You win <b>${fmt(w)}</b>! The goblin is furious.`; }
    return 'Empty! The goblin cackles. (Was there ever a pea? Nobody knows.)'; } });
  return { art: '🥤', title: 'Goblin Shell Game', text: `<p>"Find the pea, win big! Only ${fmt(bet)} to play!" A goblin shuffles three cups very fast.</p>`,
    choices: [{ label: '🥤 Left cup', ...cup() }, { label: '🥤 Middle cup', ...cup() }, { label: '🥤 Right cup', ...cup() }, { label: 'No thanks', act: () => '"COWARD!" yells the goblin.' }] };
}
function evRain() {
  return { art: '🌧️', title: 'Sudden Rainstorm!', text: '<p>The sky opens. Your bag is getting soaked!</p>',
    choices: [
      { label: '☂️ Hold the bag over your head', act: () => { gainXP(5 * S.lvl); return 'You are soaked. The bag is dry. Priorities.'; } },
      { label: '💃 Dance in the rain', act: () => { gainXP(15 * S.lvl); const i = pick(S.inv); if (i && i.q > 1) { i.q--; return `Joyful! But your ${IT[i.id].e} ${IT[i.id].name} got soggy (-1★).`; } return 'Joyful! Nothing got ruined. Lucky.'; } },
    ] };
}
function evMeteor() {
  return { art: '☄️', title: 'A Falling Star!', text: '<p>Something blazes across the sky and lands — THUNK — right next to your bag.</p>',
    choices: [{ label: '🌠 Grab it!', cls: 'good', act: () => { addInv({ id: 'starshard', q: ri(3, 5), paid: 0 }); confetti(80); return 'You got a 🌠 Fallen Star Shard! Collectors and elves love these.'; } },
      { label: 'Make a wish instead', act: () => { const k = addKarma(1); return `You wish for world peace. Also more bags. Karma +${k}.`; } }] };
}
function evNobleCart() {
  const rew = Math.round(rnd(20, 60) * lvlScale(1.45));
  return { art: '🎠', title: "A Noble's Cart is Stuck", text: '<p>A noble\'s fancy cart is stuck in the mud. "You there! Peasant! Push!"</p>',
    choices: [
      { label: '💪 Help push', cls: 'good', act: () => { addKarma(1); gainXP(10 * S.lvl); S.rep.guild += 2;
        if (Math.random() < .6) { S.money += rew; return `You push. The cart is free! The noble tosses you <b>${fmt(rew)}</b>. Guild +2.`; }
        return 'You push. The cart flies free and splashes mud all over you. The noble says nothing. Guild +2.'; } },
      { label: '😈 Rob the cart while they push', cls: 'danger', act: () => {
        if (Math.random() < .55) { const g = rew * 2; S.money += g; addKarma(-4); S.rep.pirates += 3; return `You "help" — and lift ${fmt(g)} from the luggage. Karma -4, Pirates +3.`; }
        S.heat = Math.min(100, S.heat + 20); S.money -= Math.min(S.money, rew); addKarma(-2); return `The coachman spots you. You pay ${fmt(rew)} in "damages". Heat +20.`; } },
      { label: 'Ignore', act: () => 'You whistle and walk past. The noble shouts something about peasants.' },
    ] };
}
function evWitch() {
  const fee = Math.max(10, Math.round(S.money * .08));
  return { art: '🧙‍♀️', title: 'Swamp Witch', text: `<p>"Hehehe… for ${fmt(fee)} I'll bless that bag of yours, dearie. Next 5 sales, +30%!"</p>`,
    choices: [
      { label: `✨ Bless my bag (${fmt(fee)})`, cls: 'purple', act: () => { S.money -= fee; S.blessing = (S.blessing || 0) + 5; return 'The bag glows green. It smells like frogs. Your next 5 sales get +30%!'; } },
      { label: 'No thanks, witch', act: () => '"Your loss!" She turns a nearby squirrel into a slightly different squirrel.' },
    ] };
}
function evCaravan() {
  const inv = pick(S.inv.filter(i => !['crate', 'chicken'].includes(i.id)));
  if (!inv) return evWallet();
  const it = IT[inv.id], b = bestSale(inv), offer = Math.round((b ? b.p : 10) * rnd(1.1, 1.4));
  return { art: '🐫', title: 'Merchant Caravan', text: `<p>A caravan from the far east stops you. "That ${it.e} <b>${it.name}</b>! We pay <b>${fmt(offer)}</b>, best price in the realm!"</p>`,
    choices: [
      { label: `💰 Sell for ${fmt(offer)}`, cls: 'good', act: () => { S.inv = S.inv.filter(i => i !== inv); S.money += offer; S.stats.sold++; S.stats.profit += Math.max(0, offer - inv.paid); gainXP(saleXP(offer - inv.paid)); SFX.sell(5); return `Deal! +${fmt(offer)}. The camels approve.`; } },
      { label: 'Keep it', act: () => 'The caravan sadly moves on. A camel spits at you.' },
    ] };
}
function evDeserter() {
  const pool = ITEMS.filter(i => i.cat === 'weapon' && !i.special && i.base <= itemCap() * 1.5);
  const it = pick(pool), q = ri(2, 4), price = Math.max(1, Math.round(it.base * QMULT[q - 1] * .4));
  return { art: '🪖', title: 'Army Deserter', text: `<p>A nervous soldier: "Psst. The war's not for me. Want my ${it.e} <b>${it.name}</b> ${stars(q)}? Only ${fmt(price)}!"</p><p class="sub">Weapons are in high demand during the war…</p>`,
    choices: [{ label: `Buy for ${fmt(price)}`, cls: 'good', disabled: S.money < price, act: () => { S.money -= price; addInv({ id: it.id, q, paid: price }); return 'He runs off into the woods yelling "TELL MY MOM I\'M A FARMER NOW!"'; } },
      { label: 'Report him', act: () => { S.rep.guild += 3; addKarma(-1); return 'The army drags him back. Guild +3. He gives you a betrayed look.'; } }] };
}
function evFreezing() {
  const inv = pick(S.inv.filter(i => IT[i.id].cat === 'cloth')), it = IT[inv.id];
  const offer = Math.round((sellPrice(inv) || 10) * 3);
  return { art: '🥶', title: 'A Freezing Traveler', text: `<p>A shivering traveler eyes your ${it.e} <b>${it.name}</b>. "P-p-please! I'll p-pay ${fmt(offer)}!"</p>`,
    choices: [
      { label: `💰 Sell for ${fmt(offer)}`, cls: 'good', act: () => { S.inv = S.inv.filter(i => i !== inv); S.money += offer; SFX.sell(8); return `Sold! The traveler stops shivering. +${fmt(offer)}.`; } },
      { label: '🎁 Give it for free', act: () => { S.inv = S.inv.filter(i => i !== inv); const k = addKarma(5); S.stats.deeds++; return `You wrap them up. They cry warm tears. Karma +${k}.`; } },
      { label: 'Walk away', act: () => { addKarma(-1); return 'Brrr. Karma -1.'; } },
    ] };
}
function evSick() {
  const inv = pick(S.inv.filter(i => IT[i.id].cat === 'potion')), it = IT[inv.id];
  const offer = Math.round((sellPrice(inv) || 10) * 3);
  return { art: '🤒', title: 'A Sick Villager', text: `<p>"Achoo! Is that a ${it.e} <b>${it.name}</b>? I'll pay ${fmt(offer)}! *sniff*"</p>`,
    choices: [
      { label: `💰 Sell for ${fmt(offer)}`, cls: 'good', act: () => { S.inv = S.inv.filter(i => i !== inv); S.money += offer; SFX.sell(8); return `Sold! They drink it immediately. ${it.id === 'mudwater' ? 'It was mud. They feel better anyway.' : 'They feel better!'} +${fmt(offer)}.`; } },
      { label: '🎁 Give it for free', act: () => { S.inv = S.inv.filter(i => i !== inv); const k = addKarma(5); S.stats.deeds++; return `They recover instantly and name their firstborn after your bag. Karma +${k}.`; } },
    ] };
}
function evStreet() { // sleeping on the street
  if (pp('street')) return null;
  const r = Math.random();
  if (r < .3 && S.inv.length) { const lost = loseItems(1); return { art: '🦝', title: 'Street Life', text: `<p>A raccoon in a tiny mask stole ${lost} while you slept on the cobblestones.</p>` }; }
  if (r < .45 && S.money > 5) { const l = Math.ceil(S.money * .06); S.money -= l; return { art: '🥷', title: 'Robbed!', text: `<p>Someone picked YOUR pocket while you slept. -${fmt(l)}. The irony.</p>` }; }
  if (r < .6) { const g = ri(2, 8) * S.lvl; S.money += g; return { art: '🪙', title: 'Kind Strangers', text: `<p>You wake up to ${fmt(g)} in your hat. People thought you were a street performer.</p>` }; }
  return null;
}

/* market offer hint: where does this sell best today? */
function hintFor(o) {
  const b = bestSale({ id: o.id, q: o.q, paid: o.price });
  if (!b) return '';
  const pct = Math.round((b.p / o.price - 1) * 100);
  if (b.t.id === S.town || pct < 5) return '<div class="o-hint flat">📉 no profit anywhere today</div>';
  return `<div class="o-hint">→ ${b.t.e} ${fmt(b.p)} <b>+${pct}%</b></div>`;
}
