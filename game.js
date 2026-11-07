'use strict';
/* =====================================================================
   BAGLE — It's All About The Bag
   A ridiculous fantasy trading game. Buy low. Sell high. Love your bag.
   ===================================================================== */

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function wpick(arr, wf) {
  let tot = 0; const w = arr.map(x => { const v = Math.max(0, wf(x)); tot += v; return v; });
  let r = Math.random() * tot;
  for (let i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i]; }
  return arr[arr.length - 1];
}
function fmtN(n) {
  n = Math.floor(n); const neg = n < 0; n = Math.abs(n); let s;
  if (n < 10000) s = n.toLocaleString('en-US');
  else {
    const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi']; let i = -1, v = n;
    while (v >= 1000 && i < u.length - 1) { v /= 1000; i++; }
    s = (v < 100 ? v.toFixed(v < 10 ? 2 : 1) : Math.floor(v)) + u[i];
  }
  return (neg ? '-' : '') + s;
}
const fmt = n => (n < 0 ? '-' : '') + '₲' + fmtN(Math.abs(n));
const stars = q => '<span class="stars">' + '★'.repeat(q) + '<span class="off">' + '★'.repeat(5 - q) + '</span></span>';

/* ---------- content ---------- */
const CATS = {
  food:    { name: 'Grub',       e: '🍖' },
  potion:  { name: 'Potions',    e: '🧪' },
  weapon:  { name: 'Weapons',    e: '⚔️' },
  cloth:   { name: 'Fashion',    e: '👕' },
  trinket: { name: 'Trinkets',   e: '💍' },
  contra:  { name: 'Contraband', e: '☠️' },
};
const RAR = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
const RCOL = ['#9aa3ad', '#3ec46d', '#3b8cff', '#b44dff', '#ff9a1f', '#ff3d9a'];
const QMULT = [0.6, 0.85, 1, 1.35, 2];

// [id, name, emoji, cat, base, rarity, flavor, special]
const ITEMS = [
  ['bread', 'Bread of Eternity', '🍞', 'food', 5, 0, 'Baked in the year 1042. Still crunchy.'],
  ['cheese', 'Suspicious Cheese', '🧀', 'food', 8, 0, 'It moved. Probably fine.'],
  ['jerky', 'Goblin Jerky', '🥓', 'food', 14, 0, 'Do not ask whose.'],
  ['pickle', 'Troll Toe Pickles', '🥒', 'food', 22, 1, 'Crunchy. Toe-y. Tangy.'],
  ['pie', 'Pie of Infinite Regret', '🥧', 'food', 48, 1, 'One bite: lifelong sadness. Delicious though.'],
  ['ham', 'Thunder Ham', '🍗', 'food', 110, 2, 'Struck by lightning. Twice. On purpose.'],
  ['dragonfruit', 'Dragonfruit (Actual Dragon)', '🐲', 'food', 420, 3, 'Small. Angry. Ripe.'],
  ['feast', 'Feast of the Gods (To Go)', '🍱', 'food', 14000, 4, 'Ambrosia, nectar, and a tiny fork.'],

  ['hpot', 'Health Potion (Mostly Water)', '🧪', 'potion', 12, 0, 'Heals 1 HP. Maybe.'],
  ['mana', 'Mana Smoothie', '🥤', 'potion', 30, 1, 'Now with 3% real mana!'],
  ['conf', 'Elixir of Mild Confidence', '🍷', 'potion', 72, 1, 'You feel… okay about yourself.'],
  ['invis', 'Invisibility Potion', '🫙', 'potion', 170, 2, 'The bottle looks empty. Or does it?'],
  ['youth', 'Fountain of Youth Sample', '⚗️', 'potion', 620, 3, 'Side effects include: puberty.'],
  ['phoenix', 'Phoenix Tears', '💧', 'potion', 2600, 4, 'The phoenix was watching a very sad play.'],
  ['storm', 'Bottled Thunderstorm', '⛈️', 'potion', 34000, 4, 'Do NOT shake. Do NOT open indoors.'],

  ['spork', 'Rusty Spork', '🍴', 'weapon', 6, 0, 'Two weapons in one. Both bad.'],
  ['stick', 'Very Pointy Stick', '🗡️', 'weapon', 20, 0, 'The pointiest stick in the realm.'],
  ['axe', 'Axe of Mild Inconvenience', '🪓', 'weapon', 78, 1, 'Enemies become slightly annoyed.'],
  ['bow', 'Bow of Missing', '🏹', 'weapon', 160, 2, 'Never hits anything. Looks amazing.'],
  ['sword', 'Sword of 1000 Paper Cuts', '⚔️', 'weapon', 390, 2, 'Ouch. Ouch. Ouch. Ouch. Ouch.'],
  ['hammer', 'Hammer of Overcompensation', '🔨', 'weapon', 950, 3, 'Its last owner drove a very big cart.'],
  ['wand', 'Elder Wand of Wiggling', '🪄', 'weapon', 4800, 4, 'Wiggles reality. Slightly.'],
  ['trident', 'Trident of the Tide King', '🔱', 'weapon', 90000, 4, 'Smells permanently of low tide.'],

  ['socks', 'Socks of Holding', '🧦', 'cloth', 10, 0, 'Each one holds exactly one foot.'],
  ['hoodie', 'Elven Hoodie', '👕', 'cloth', 40, 1, 'Pointy ears not included.'],
  ['boots', 'Boots of Walking Normally', '👢', 'cloth', 98, 1, '+0 speed. Extremely comfy.'],
  ['hat', 'Wizard Hat (Extra Pointy)', '🎩', 'cloth', 230, 2, 'Pointiness is power.'],
  ['cape', 'Cape of Dramatic Entrances', '🧥', 'cloth', 680, 3, 'Comes with built-in wind.'],
  ['armor', 'Full Plate Onesie', '🛡️', 'cloth', 3100, 4, 'Fashion meets impenetrable.'],
  ['robe', 'Archmage Robe (Dry Clean Only)', '🥋', 'cloth', 48000, 4, 'Stains contain ancient spells.'],

  ['rock', 'Lucky Rock', '🪨', 'trinket', 4, 0, 'It is a rock. It is lucky. That is all.'],
  ['spoon', 'Slightly Haunted Spoon', '🥄', 'trinket', 36, 1, 'Whispers soup recipes at night.'],
  ['ball', 'Crystal Ball (Cloudy)', '🔮', 'trinket', 270, 2, 'Forecast: vague, with a chance of maybe.'],
  ['ring', 'Ring of Questionable Power', '💍', 'trinket', 820, 3, 'One ring to… eh, sort of rule some.'],
  ['crown', 'Crown of Some King', '👑', 'trinket', 5200, 4, 'He will want it back.'],
  ['moon', 'Pocket Moon', '🌕', 'trinket', 220000, 5, 'Tides in your pocket. Wolves follow you.'],

  ['rum', 'Pirate Grog', '🍾', 'contra', 60, 1, 'Illegal in 7 kingdoms. Tasty in all of them.'],
  ['scroll', 'Forbidden Scroll', '📜', 'contra', 310, 2, 'Says "DO NOT READ". You read it.'],
  ['ink', 'Smuggled Kraken Ink', '🦑', 'contra', 720, 3, 'Still wriggling. Still angry.'],
  ['egg', 'Dragon Egg (Probably a Potato)', '🥚', 'contra', 2100, 4, 'It is warm. Potatoes are not warm.'],
  ['jewels', 'Stolen Imperial Crown Jewels', '💎', 'contra', 160000, 5, 'The Emperor is VERY upset.'],

  ['chicken', 'Chicken of Destiny', '🐔', 'trinket', 50, 3, 'Worth anywhere from nothing to everything.', 1],
  ['crate', 'Rebel Supply Crate', '📦', 'contra', 200, 2, 'Deliver to Rebel Hollow. Do NOT open. It ticks.', 1],
  ['tomato', 'Thrown Tomato', '🍅', 'food', 1, 0, 'A bard threw this at you. Rude.', 1],
  ['bagle', 'The Golden Bagle', '🥯', 'trinket', 1000000, 5, 'The bag of all bags. Also edible?', 1],
].concat(EXTRA_ITEMS.map(r => r.slice(0, 7).concat([1])))
  .map(([id, name, e, cat, base, r, desc, sp]) => ({ id, name, e, cat, base, r, desc, special: !!sp }));
const IT = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const INVENTED = new Set(BASE_RECIPES.concat(...PROFESSIONS.map(p => p.recipes)).map(r => r.out));

const TOWNS = [
  { id: 'mud', name: 'Muddlebrook', e: '🐄', lvl: 1, dist: 0, strict: .15, fake: .07,
    desc: 'Farm village. Smells like cheese and opportunity.',
    m: { food: .6, potion: 1.1, weapon: 1.45, cloth: 1.0, trinket: 1.25, contra: 1.3 } },
  { id: 'silver', name: 'Silverspire', e: '🏰', lvl: 1, dist: 2, strict: .55, fake: .05, rep: 'guild',
    desc: 'Capital of the Empire. Rich nobles, strict guards, tiny dogs.',
    m: { food: 1.55, potion: 1.2, weapon: 1.0, cloth: 1.65, trinket: 1.75, contra: 2.2 } },
  { id: 'grogg', name: 'Port Grogg', e: '🏴‍☠️', lvl: 2, dist: 3, strict: .03, fake: .35, contra: true, rep: 'pirates',
    desc: 'Pirate port. Everything is for sale. Especially stuff that isn\'t real.',
    m: { food: 1.3, potion: 1.65, weapon: 1.2, cloth: .65, trinket: .75, contra: .6 } },
  { id: 'iron', name: 'Ironbelly Hold', e: '⛏️', lvl: 3, dist: 4, strict: .3, fake: .1,
    desc: 'Dwarven mountain fortress. They forge axes and eat EVERYTHING.',
    m: { food: 1.95, potion: 1.75, weapon: .55, cloth: 1.2, trinket: .9, contra: 1.4 } },
  { id: 'moon', name: 'Moonwhisper Glade', e: '🌙', lvl: 4, dist: 5, strict: .25, fake: .08,
    desc: 'Elven forest. Everything comes with a song. Every song is long.',
    m: { food: 1.2, potion: .55, weapon: 1.75, cloth: .6, trinket: 1.95, contra: 1.5 } },
  { id: 'rebel', name: 'Rebel Hollow', e: '🔥', lvl: 5, dist: 6, strict: 0, fake: .25, contra: true, fence: true, rep: 'rebels',
    desc: 'Secret rebel camp. They pay full price for fakes. "For the cause!"',
    m: { food: 1.6, potion: 1.5, weapon: 1.95, cloth: 1.1, trinket: 1.0, contra: 2.0 } },
  { id: 'bazaar', name: 'Glittering Bazaar', e: '💎', lvl: 8, dist: 8, strict: .35, fake: .2, contra: true, rich: true,
    desc: 'The richest market in the realm. Legends are bought and sold here.',
    m: { food: 1.45, potion: 1.45, weapon: 1.45, cloth: 1.45, trinket: 1.45, contra: 1.7 } },
];
const TW = Object.fromEntries(TOWNS.map(t => [t.id, t]));

const BAGS = [
  { id: 'sack', name: "Grandma's Burlap Sack", e: '🧺', slots: 8, price: 0, lvl: 1, color: '#c39a62', perk: 'Smells like soup. No perks. Grandma believed in you.' },
  { id: 'satchel', name: 'Leather Satchel', e: '👜', slots: 10, price: 250, lvl: 1, color: '#9a5a33', perk: '+3% sell price. Very professional.', sell: .03 },
  { id: 'duffel', name: "Smuggler's Duffel", e: '🎒', slots: 14, price: 1600, lvl: 3, color: '#4f7046', perk: 'Secret lining: guards are 60% less likely to catch fakes & contraband.', sneak: .6 },
  { id: 'saint', name: "Saint's Blessed Purse", e: '👛', slots: 15, price: 4200, lvl: 4, color: '#f2d36b', perk: 'Karma gains ×2. Beggars and bag gods LOVE you.', karma: 2 },
  { id: 'pirate', name: "Pirate's Loot Sack", e: '💰', slots: 20, price: 9500, lvl: 5, color: '#8f2a2a', perk: 'Pirates respect it: tolls halved, +15% fight chance.', pirate: true },
  { id: 'gnome', name: 'Gnomish Bag of Holding™', e: '🛍️', slots: 28, price: 45000, lvl: 7, color: '#7a4bb5', perk: '+10% sell price. Warranty void if opened.', sell: .10 },
  { id: 'dimension', name: 'Dimensional Duffel', e: '🌀', slots: 38, price: 280000, lvl: 9, color: '#2b62a8', perk: '+6% jackpot chance, +5% sell. Contains a tiny universe (do not feed).', crit: .06, sell: .05 },
  { id: 'bagle', name: 'THE BAGLE', e: '🥯', slots: 60, price: 3000000, lvl: 12, color: '#e8a93a', perk: '+25% sell, +5% jackpot, sneaky lining. The bag that bags bags.', sell: .25, crit: .05, sneak: .5 },
];
const BG = Object.fromEntries(BAGS.map(b => [b.id, b]));

const UPG = [
  { id: 'tongue', name: 'Silver Tongue', e: '👅', max: 10, base: 80, g: 1.75, desc: l => `Buy ${(l * 1.5).toFixed(1)}% cheaper, sell ${(l * 1.5).toFixed(1)}% higher` },
  { id: 'back', name: 'Strong Back', e: '💪', max: 15, base: 140, g: 1.62, desc: l => `+${l} extra bag slots` },
  { id: 'eye', name: 'Eagle Eye', e: '🦅', max: 10, base: 120, g: 1.7, desc: l => `${l * 10}% chance to spot fakes before buying` },
  { id: 'luck', name: "Lucky Rabbit's Foot", e: '🐇', max: 10, base: 250, g: 1.8, desc: l => `${3 + l * 2}% jackpot sale chance (×2–×5)` },
  { id: 'guard', name: 'Bodyguard Brutus', e: '🧔', max: 10, base: 200, g: 1.7, desc: l => `+${l * 7}% to win fights vs pirates` },
  { id: 'network', name: 'Merchant Network', e: '🤝', max: 6, base: 300, g: 2, desc: l => `+${l} market offers, ${1 + Math.floor(l / 2)} tavern rumors per day` },
  { id: 'cart', name: 'Fancy Cart', e: '🛒', max: 5, base: 150, g: 1.9, desc: l => `-${l * 12}% travel cost, faster escapes` },
];

const MYST = [
  { id: 'paper', name: 'Paper Mystery Bag', e: '🛍️', lvl: 1, lo: 1, hi: 1300, fake: .08, desc: 'Smells like a lunch. Might be a legend.' },
  { id: 'velvet', name: 'Velvet Mystery Bag', e: '👝', lvl: 4, lo: 20, hi: 15000, fake: .04, desc: 'Soft. Mysterious. Probably not a sandwich.' },
  { id: 'royal', name: 'Royal Mystery Bag', e: '💼', lvl: 8, lo: 300, hi: 260000, fake: 0, desc: 'Sealed with the Emperor\'s own wax. And spit.' },
  { id: 'cosmic', name: 'Cosmic Mystery Bag', e: '🌌', lvl: 11, lo: 3000, hi: 2e6, fake: 0, desc: 'Contains stars. Possibly THE Golden Bagle.' },
];

const GIVERS = { guild: { n: 'Merchant Guild', e: '🏛️' }, rebels: { n: 'The Rebellion', e: '🔥' }, pirates: { n: 'Pirate Syndicate', e: '🏴‍☠️' } };

const ACH = [
  ['first', '🪙', 'First Flip', 'Sell your first item', s => s.stats.sold >= 1],
  ['k1', '💵', 'Pocket Money', 'Earn ₲1,000 total profit', s => s.stats.profit >= 1000],
  ['k100', '🤑', 'Merchant Prince', 'Earn ₲100K total profit', s => s.stats.profit >= 1e5],
  ['m1', '🏦', 'Bagillionaire', 'Hold ₲1,000,000 cash', s => s.money >= 1e6],
  ['bag2', '👜', 'Bag Upgrade', 'Buy your first new bag', s => s.owned.length >= 2],
  ['bag5', '🧳', 'Bag Hoarder', 'Own 5 bags', s => s.owned.length >= 5],
  ['thebagle', '🥯', 'THE BAG', 'Own THE BAGLE', s => s.owned.includes('bagle')],
  ['full', '🫃', 'Stuffed', 'Completely fill your bag', s => s.inv.length >= capacity()],
  ['scam', '🕵️', 'Shady Dealer', 'Sell 10 fakes', s => s.stats.fakesSold >= 10],
  ['caught', '👮', 'Red-Handed', 'Get busted by the guards', s => s.stats.caught >= 1],
  ['saint', '😇', 'Saint of the Satchel', 'Reach 50 karma', s => s.karma >= 50],
  ['villain', '😈', 'Absolute Villain', 'Reach -50 karma', s => s.karma <= -50],
  ['punch', '🥊', 'Pirate Puncher', 'Win 5 fights', s => s.stats.wins >= 5],
  ['jack', '🎰', 'JACKPOT!', 'Hit a jackpot sale', s => s.stats.jackpots >= 1],
  ['jack10', '🧠', 'Dopamine Addict', 'Hit 10 jackpots', s => s.stats.jackpots >= 10],
  ['myst', '🎁', 'Gambler', 'Open 10 mystery bags', s => s.stats.mystery >= 10],
  ['streak', '🔥', 'On Fire', 'Reach a ×15 sale streak', s => s.stats.bestStreak >= 15],
  ['tour', '🧭', 'Tourist', 'Visit every town', s => TOWNS.every(t => s.stats.visited[t.id])],
  ['golden', '✨', 'Golden Bagle', 'Find the Golden Bagle', s => s.stats.goldenFound >= 1],
  ['lvl10', '🎓', 'Bag Master', 'Reach level 10', s => s.lvl >= 10],
  ['chicken', '🐔', 'Chicken Whisperer', 'Sell a Chicken of Destiny', s => s.stats.chickens >= 1],
  ['courier', '📦', 'Viva la Bag!', 'Deliver a rebel crate', s => s.stats.crates >= 1],
  ['contract', '📜', 'Reliable', 'Complete 10 contracts', s => s.stats.contracts >= 10],
  ['asc', '🌟', 'Pass the Bag', 'Ascend once', s => s.threads >= 1],
  ['job', '💼', 'Hard Worker', 'Work 10 shifts', s => s.stats.jobsDone >= 10],
  ['inventor', '💡', 'Inventor', 'Invent 10 things', s => s.stats.crafted >= 10],
  ['forger', '🏷️', 'Premium Quality™', 'Relabel 10 items', s => s.stats.relabeled >= 10],
  ['thief', '🧤', 'Sticky Fingers', 'Pickpocket 10 times', s => s.stats.stolen >= 10],
  ['career', '💼', 'Employed!', 'Pick a profession', s => !!s.prof],
].map(([id, e, n, d, f]) => ({ id, e, n, d, f }));

const KARMA_MS = [
  [10, 'Good Egg', '🥚'], [25, 'Friend of Beggars', '🤝'], [50, 'Saint of the Satchel', '😇'], [100, 'Bag Angel', '👼'],
];

const RUMOR_LINES = [
  'A drunk dwarf yells:', 'The barmaid whispers:', 'A suspicious hooded guy mutters:', 'A parrot screams:',
  'An old lady with too many cats says:', 'The bard sings (badly):', 'A goblin selling "totally real maps" claims:',
];

/* ---------- state ---------- */
const SAVE_KEY = 'bagle-save-v1';
let S;
function newState(keep) {
  const st = {
    v: 1, money: 120, bag: 'sack', owned: ['sack'], inv: [], uid: 1,
    town: 'mud', day: 1, xp: 0, lvl: 1, karma: 0, heat: 0,
    rep: { guild: 0, rebels: 0, pirates: 0 }, up: {}, market: [], days: {}, rumors: {}, rumorText: [],
    contracts: [], ach: {}, karmaMs: {}, streak: 0, threads: 0, muted: false, tab: 'travel', log: [],
    energy: 5, prof: null, dem: {}, hist: {}, world: [], blessing: 0, xcat: 'food',
    stats: { sold: 0, profit: 0, earned: 0, fakesSold: 0, caught: 0, mystery: 0, jackpots: 0, deeds: 0, fights: 0, wins: 0,
      visited: { mud: 1 }, bestSale: 0, bestStreak: 0, goldenFound: 0, chickens: 0, crates: 0, contracts: 0, ascensions: 0,
      crafted: 0, stolen: 0, jobsDone: 0, relabeled: 0 },
  };
  if (keep) {
    st.threads = keep.threads; st.ach = keep.ach; st.muted = keep.muted;
    st.stats.ascensions = keep.stats.ascensions; st.money = 120 + keep.threads * 150;
  }
  return st;
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    const base = newState();
    const st = Object.assign(base, d);
    if (st.energy == null) st.energy = 5;
    st.stats = Object.assign(newState().stats, d.stats || {});
    st.rep = Object.assign({ guild: 0, rebels: 0, pirates: 0 }, d.rep || {});
    return st;
  } catch (e) { return null; }
}

/* ---------- derived ---------- */
const lv = id => S.up[id] || 0;
const bag = () => BG[S.bag];
const town = (id = S.town) => TW[id];
const capacity = () => bag().slots + lv('back');
const free = () => capacity() - S.inv.length;
const itemCap = () => 40 * Math.pow(2.05, S.lvl - 1);
const lvlScale = (b = 1.35) => Math.pow(b, S.lvl - 1);
const xpNeed = l => Math.floor(30 * Math.pow(l, 1.75));
const saleXP = profit => 3 + 7 * Math.log10(1 + Math.max(profit, 0));
const unlocked = t => S.lvl >= t.lvl || (t.id === 'rebel' && (S.rep.rebels >= 10 || S.inv.some(i => i.id === 'crate')));
const critChance = () => .03 + lv('luck') * .02 + (bag().crit || 0) + pp('crit');
const km = () => (bag().karma || 1) * (1 + pp('karma'));

function baseVal(it, q, tid) {
  return it.base * QMULT[q - 1] * (TW[tid].m[it.cat] || 1) * demandOf(tid, it.cat);
}
const buyMod = () => 1.1 - lv('tongue') * .015;
function sellMult(tid) {
  const t = TW[tid];
  let m = .9 + lv('tongue') * .015 + (bag().sell || 0) + S.threads * .05;
  if (t.rep) m += clamp(S.rep[t.rep], -50, 100) * .002;
  if (S.karma > 0) m += Math.min(S.karma, 100) * .001;
  return m * (1 + S.streak * .02);
}
const crateVal = () => Math.round(160 * Math.pow(1.6, S.lvl));
function sellPrice(inv, tid = S.town) {
  const it = IT[inv.id];
  if (it.id === 'chicken') return null;
  if (it.id === 'crate') return tid === 'rebel' ? crateVal() : 3;
  return Math.max(1, Math.round(baseVal(it, inv.q, tid) * sellMult(tid) * profMult(it) * (S.blessing > 0 ? 1.3 : 1)));
}
function netWorth() {
  return S.money + S.inv.reduce((a, i) => a + (sellPrice(i) || 0), 0);
}
function travelCost(tid) {
  const a = town(), b = TW[tid];
  return Math.max(1, Math.floor((3 + Math.abs(a.dist - b.dist) * 3) * lvlScale() * (1 - lv('cart') * .12)));
}
const travelCostMin = () => Math.min(...TOWNS.filter(t => t.id !== S.town && unlocked(t)).map(t => travelCost(t.id)));
const innCost = () => Math.max(1, Math.floor(6 * lvlScale()));
const upgCost = u => Math.round(u.base * Math.pow(u.g, lv(u.id)));

/* ---------- world simulation ---------- */
function rollDays() {
  const cats = Object.keys(CATS);
  worldTick();
  for (const t of TOWNS) {
    let hot = null, hotM = 1, crash = null;
    if (Math.random() < .3) { hot = pick(cats); hotM = rnd(1.6, 2.3); }
    if (Math.random() < .18) crash = pick(cats.filter(c => c !== hot));
    S.days[t.id] = { hot, hotM, crash };
  }
  recordHist();
  S.rumors = {}; S.rumorText = [];
}
function genMarket() {
  const t = town();
  const n = 5 + lv('network') + (t.rich ? 2 : 0);
  const cap = itemCap() * (t.rich ? 3 : 1);
  const pool = ITEMS.filter(i => !i.special && (i.cat !== 'contra' || t.contra));
  const offers = [];
  for (let k = 0; k < n; k++) {
    let cand = pool.filter(i => i.base <= cap);
    if (Math.random() < .1) cand = pool.filter(i => i.base <= cap * 5);
    if (!cand.length) cand = pool.slice(0, 3);
    const it = wpick(cand, i => Math.pow(i.base / cap, .35) / (1 + i.r * .45));
    const q = wpick([1, 2, 3, 4, 5], x => [28, 32, 24, 12, 4][x - 1] * (x >= 4 ? 1 + lv('luck') * .06 : 1));
    const fake = it.r < 5 && Math.random() < t.fake;
    const rev = fake && Math.random() < lv('eye') * .1;
    let price = Math.max(1, Math.round(baseVal(it, q, t.id) * buyMod()));
    if (fake) price = Math.max(1, Math.round(price * rnd(.7, .9)));
    const stock = it.base < cap * .3 ? ri(2, 5) : ri(1, 2);
    offers.push({ id: it.id, q, fake, rev, price, stock });
  }
  offers.sort((a, b) => a.price - b.price);
  S.market = offers;
}
function arrivalRumors() {
  const n = 1 + Math.floor(lv('network') / 2) + pp('rumor');
  const up = upcomingEvents()[0];
  if (up && Math.random() < .6) S.rumorText.push(`${pick(RUMOR_LINES)} "I heard ${WE[up.id].e} <b>${WE[up.id].name}</b> starts in ${up.start - S.day} day(s)! ${evEffects(WE[up.id])}"`);
  const others = TOWNS.filter(t => t.id !== S.town && unlocked(t));
  for (let i = 0; i < n && others.length; i++) {
    const t = others.splice(Math.floor(Math.random() * others.length), 1)[0];
    const d = S.days[t.id]; S.rumors[t.id] = true;
    let line;
    if (d.hot) line = `"${t.e} ${t.name} pays <b>×${d.hotM.toFixed(1)}</b> for ${CATS[d.hot].e} ${CATS[d.hot].name} today!"`;
    else if (d.crash) line = `"Nobody in ${t.e} ${t.name} wants ${CATS[d.crash].e} ${CATS[d.crash].name}. Prices crashed!"`;
    else line = `"Nothing special going on in ${t.e} ${t.name}. Boring place."`;
    S.rumorText.push(pick(RUMOR_LINES) + ' ' + line);
  }
}
function nextDay() {
  S.day++; S.energy = MAX_ENERGY;
  S.heat = clamp(S.heat - 8, 0, 100);
  rollDays();
  // contracts
  const expired = S.contracts.filter(c => c.due < S.day);
  for (const c of expired) { S.rep[c.giver] -= 3; log(`📜 Contract for ${GIVERS[c.giver].n} expired. Rep -3.`); }
  S.contracts = S.contracts.filter(c => c.due >= S.day);
  while (S.contracts.length < 3) S.contracts.push(genContract());
}
function genContract() {
  const giver = pick(['guild', 'guild', 'rebels', 'pirates']);
  const towns = TOWNS.filter(t => unlocked(t) && !(giver === 'guild' && t.id === 'rebel'));
  const t = pick(towns);
  const pool = ITEMS.filter(i => !i.special && i.base <= itemCap() && (i.cat !== 'contra' || giver !== 'guild'));
  const it = wpick(pool, i => Math.pow(i.base, .3));
  const qty = it.base < itemCap() * .2 ? ri(3, 6) : ri(1, 3);
  const reward = Math.round(it.base * qty * rnd(2.2, 3.2) * Math.pow(1.08, S.lvl));
  return { u: S.uid++, giver, id: it.id, qty, town: t.id, due: S.day + ri(4, 9), reward, xp: Math.round(25 + 12 * S.lvl + 6 * qty) };
}

/* ---------- core actions ---------- */
function addInv(o) {
  if (free() <= 0) return false;
  S.inv.push(Object.assign({ q: 3, fake: false, rev: false, paid: 0 }, o, { u: S.uid++ }));
  gulp();
  return true;
}
function gainXP(x) {
  S.xp += Math.max(0, Math.round(x));
  while (S.xp >= xpNeed(S.lvl)) {
    S.xp -= xpNeed(S.lvl); S.lvl++;
    const bonus = Math.round(25 * Math.pow(1.6, S.lvl));
    S.money += bonus;
    const newTowns = TOWNS.filter(t => t.lvl === S.lvl).map(t => t.e + ' ' + t.name);
    const newBags = BAGS.filter(b => b.lvl === S.lvl).map(b => b.e + ' ' + b.name);
    const newMyst = MYST.filter(b => b.lvl === S.lvl).map(b => b.e + ' ' + b.name);
    let extra = [...newTowns, ...newBags, ...newMyst];
    toast(`⭐ <b>LEVEL ${S.lvl}!</b> Bonus ${fmt(bonus)}${extra.length ? '<br>Unlocked: ' + extra.join(', ') : ''}`, 5000);
    log(`⭐ Reached level ${S.lvl}! +${fmt(bonus)}`);
    SFX.level(); confetti(140); floatCenter('LEVEL UP!', 'big');
  }
}
function addKarma(n) {
  if (n > 0) n *= km();
  S.karma = clamp(S.karma + n, -200, 300);
  for (const [th, name, e] of KARMA_MS) {
    if (S.karma >= th && !S.karmaMs[th]) {
      S.karmaMs[th] = 1;
      const gift = Math.round(30 * th * lvlScale(1.45));
      S.money += gift;
      toast(`${e} <b>Karma milestone: ${name}!</b><br>The Bag Gods send you ${fmt(gift)}.`, 5000);
      SFX.jackpot(); confetti(80);
    }
  }
  return n;
}
function buy(k, el) {
  const o = S.market[k]; if (!o || o.stock <= 0) return;
  const it = IT[o.id];
  if (S.money < o.price) { toast('💸 Not enough money! Sell something first.'); SFX.bad(); wiggle(el); return; }
  if (free() <= 0) { toast('🎒 Your bag is FULL! Sell stuff or buy a bigger bag.'); SFX.bad(); wiggle($('.sack')); return; }
  S.money -= o.price; o.stock--;
  addInv({ id: o.id, q: o.q, fake: o.fake, rev: o.rev, paid: o.price });
  SFX.buy();
  if (el) { const r = el.getBoundingClientRect(); floatText(r.right - 40, r.top, '-' + fmt(o.price), 'neg'); }
  log(`🛒 Bought ${it.e} ${it.name} (${o.q}★) for ${fmt(o.price)}${o.rev ? ' — knowingly FAKE 😏' : ''}`);
  commit();
}
function sell(u, el, fast) {
  const k = S.inv.findIndex(i => i.u === u); if (k < 0) return false;
  const inv = S.inv[k], it = IT[inv.id], t = town();
  const rect = el ? el.getBoundingClientRect() : null;
  // guards!
  const isFake = (inv.fake || inv.forged) && !t.fence, isContra = it.cat === 'contra' && !t.contra;
  if (isFake || isContra) {
    const forgeOnly = inv.forged && !inv.fake && !isContra;
    const ch = Math.min(.6, t.strict * (1 - sneakTotal()) * (1 + S.heat / 100) * (isContra ? .8 : .6) * (forgeOnly ? 1 - pp('forge') : 1));
    if (Math.random() < ch) { busted(k, isContra); return false; }
  }
  let price, jack = 1, note = '';
  if (it.id === 'chicken') {
    const r = Math.random();
    price = r < .62 ? ri(1, 15) : r < .95 ? Math.round(rnd(.5, 3) * itemCap()) : Math.round(rnd(10, 40) * itemCap());
    S.stats.chickens++;
    note = price < 20 ? ' The chicken was just a chicken.' : price > itemCap() * 5 ? ' THE CHICKEN WAS DESTINY!' : ' A fine chicken indeed.';
  } else if (it.id === 'crate') {
    if (t.id === 'rebel') { price = crateVal(); S.rep.rebels += 10; S.stats.crates++; addKarma(2); note = ' "VIVA LA BAG!" Rebels +10.'; }
    else { price = 3; S.rep.rebels -= 10; note = ' The crate was full of rocks. The rebels are furious (-10).'; }
  } else price = sellPrice(inv);
  if (it.id !== 'crate' && Math.random() < critChance()) { jack = pick([2, 2, 2, 3, 3, 5]); price *= jack; }
  S.inv.splice(k, 1);
  S.money += price;
  if (S.blessing > 0 && it.id !== 'chicken') { S.blessing--; note += ' ✨ Blessed +30%!'; }
  const profit = price - inv.paid;
  S.stats.sold++; S.stats.earned += price;
  if (profit > 0) { S.stats.profit += profit; S.streak = Math.min(25, S.streak + 1); S.stats.bestStreak = Math.max(S.stats.bestStreak, S.streak); }
  else S.streak = 0;
  S.stats.bestSale = Math.max(S.stats.bestSale, price);
  gainXP(saleXP(profit) * (jack > 1 ? 2 : 1));
  if (inv.fake) {
    S.stats.fakesSold++;
    if (!t.fence) { addKarma(-1); note += ' Psst… that was a FAKE. 😈 Karma -1.'; }
    else note += ' The rebels knew it was fake. They love it.';
  }
  if (it.id === 'bagle') confetti(300);
  // juice
  if (rect) {
    const cx = rect.left + rect.width / 2, cy = rect.top;
    floatText(cx, cy, '+' + fmt(price), jack > 1 ? 'big' : '');
    flyBills(rect, jack > 1 ? 6 : Math.min(4, 1 + Math.floor(Math.log10(price + 1))));
  }
  if (jack > 1) {
    S.stats.jackpots++; SFX.jackpot(); confetti(160); shake();
    floatCenter(`JACKPOT ×${jack}!`, 'big');
  } else SFX.sell(S.streak);
  log(`${jack > 1 ? '🎰 JACKPOT ×' + jack + '! ' : '💰 '}Sold ${it.e} ${it.name} for ${fmt(price)} (${profit >= 0 ? '+' : ''}${fmt(profit)}).${note}`);
  if (!fast) commit();
  return true;
}
function busted(k, isContra) {
  const inv = S.inv[k], it = IT[inv.id], t = town();
  const fine = Math.min(S.money, Math.round(baseVal(it, inv.q, t.id) * 1.5));
  S.inv.splice(k, 1); S.money -= fine; S.heat = Math.min(100, S.heat + 25); S.stats.caught++; S.rep.guild -= 4; addKarma(-2); S.streak = 0;
  SFX.bad(); shake();
  const quotes = ['"HALT, criminal scum!"', '"Hey! That\'s not real!"', '"By order of the Emperor: NO."', '"I\'ve been a guard for 30 years and that is the worst fake I\'ve ever seen."'];
  log(`👮 BUSTED in ${t.name}! Lost ${it.e} ${it.name} and paid ${fmt(fine)}.`);
  sellQueue = [];
  commit();
  showModal({
    art: '👮', title: 'BUSTED!',
    text: `<p>${pick(quotes)}</p><p>A guard confiscates your ${it.e} <b>${it.name}</b> — it's ${isContra ? '<b>CONTRABAND</b>' : inv.forged && !inv.fake ? 'got a <b>FORGED QUALITY LABEL</b>' : 'a <b>FAKE</b>'}!</p><p>Fine: <b>${fmt(fine)}</b>. Heat +25, Guild -4.</p><p class="sub">Tip: a 🎒 Smuggler's Duffel hides illegal goods. Rebel Hollow buys fakes with no questions asked.</p>`,
    choices: [{ label: 'Sorry, officer… 😓' }],
  });
}
let sellQueue = [];
function sellMany(onlyProfit) {
  const list = S.inv.filter(i => { const p = sellPrice(i); return !onlyProfit || (p !== null && p >= i.paid && i.id !== 'crate'); });
  if (!list.length) { toast(onlyProfit ? 'Nothing sells for a profit here. Travel somewhere better!' : 'Your bag is empty. Sad bag.'); return; }
  sellQueue = list.map(i => i.u);
  const step = () => {
    if (!sellQueue.length || !$('#modal').classList.contains('hidden')) { sellQueue = []; commit(); return; }
    const u = sellQueue.shift();
    const el = document.querySelector(`.slot[data-arg="${u}"]`);
    sell(u, el, true);
    renderBag(); renderTop(); renderWallet();
    setTimeout(step, 110);
  };
  step();
}
function travel(tid) {
  if (tid === S.town) return;
  const t = TW[tid];
  if (!unlocked(t)) { toast(`🔒 ${t.name} unlocks at level ${t.lvl}.`); return; }
  const c = travelCost(tid);
  if (S.money < c) { toast('💸 You can\'t afford the cart! Sell something.'); SFX.bad(); return; }
  S.money -= c; nextDay();
  const from = town();
  S.town = tid; S.stats.visited[tid] = 1; S.streak = 0;
  genMarket(); arrivalRumors();
  SFX.travel();
  log(`🗺️ Day ${S.day}: Traveled from ${from.e} ${from.name} to ${t.e} ${t.name} (${fmt(c)}).`);
  commit();
  setTimeout(() => {
    if (tid === 'silver' && S.heat >= 50 && S.inv.some(isIllegal)) showModal(evGuardCheck());
    else if (Math.random() < .55) travelEvent();
  }, 280);
}
function sleep() {
  const c = innCost();
  if (S.money < c) { SFX.bad(); return toast('💸 Not enough for the inn. Try the street — it\'s free!'); }
  S.money -= c;
  nextDay(); genMarket(); arrivalRumors(); S.streak = 0;
  SFX.travel();
  log(`🛏️ Day ${S.day}: Slept at the inn in ${town().name}. Fresh market & rumors, ⚡ restored.`);
  commit();
  if (Math.random() < .18) setTimeout(() => showModal(evNight()), 250);
}
function sleepStreet() {
  nextDay(); arrivalRumors(); S.streak = 0;
  // same old market (no new deals), but prices on your bag items still move
  SFX.travel();
  log(`🛌 Day ${S.day}: Slept on the street in ${town().name}. Free! ⚡ restored, same old market.`);
  commit();
  const ev = evStreet();
  if (ev) setTimeout(() => { showModal(ev); commit(); }, 250);
}
function buyBag(id) {
  const b = BG[id];
  if (S.owned.includes(id)) return equip(id);
  if (S.lvl < b.lvl) return toast(`🔒 Requires level ${b.lvl}.`);
  if (S.money < b.price) { SFX.bad(); return toast('💸 Not enough money for this beauty.'); }
  S.money -= b.price; S.owned.push(id); S.bag = id;
  SFX.jackpot(); confetti(200); floatCenter(`NEW BAG!`, 'big');
  log(`🛍️ Bought the ${b.e} ${b.name}! ${b.slots} slots!`);
  commit();
  showModal({ art: b.e, title: 'NEW BAG!', cls: 'rays', text: `<p>You are now the proud owner of the <b>${b.name}</b>.</p><p>🎒 ${b.slots} slots<br>✨ ${b.perk}</p><p class="sub">You hug the bag. The bag hugs you back (metaphorically).</p>`, choices: [{ label: 'I LOVE THIS BAG 😍', cls: 'good' }] });
}
function equip(id) {
  const b = BG[id];
  if (S.inv.length > b.slots + lv('back')) return toast('Too much stuff to fit in that bag!');
  S.bag = id; SFX.buy(); log(`🎒 Switched to ${b.e} ${b.name}.`); commit();
}
function buyUpg(id) {
  const u = UPG.find(x => x.id === id), c = upgCost(u);
  if (lv(id) >= u.max) return;
  if (S.money < c) { SFX.bad(); return toast('💸 Not enough money.'); }
  S.money -= c; S.up[id] = lv(id) + 1;
  SFX.level(); confetti(40);
  log(`⚒️ Upgraded ${u.e} ${u.name} to level ${S.up[id]}.`);
  if (id === 'network') genMarketExtra();
  commit();
}
function genMarketExtra() { // add one offer for the new network level right away
  const keep = S.market; genMarket(); S.market = keep.concat(S.market.slice(0, 1)).sort((a, b) => a.price - b.price);
}
function mystPrice(m) {
  const cand = mystPool(m);
  let sw = 0, sv = 0;
  for (const i of cand) { const w = Math.pow(i.base, -.85); sw += w; sv += w * i.base; }
  const ev = sv / sw * 1.15;
  const mag = Math.pow(10, Math.floor(Math.log10(ev)) - 1);
  return Math.round(ev / mag) * mag;
}
function mystPool(m) {
  return ITEMS.filter(i => (!i.special && i.base >= m.lo && i.base <= m.hi) || (i.id === 'bagle' && m.hi >= 1e6));
}
function openMyst(id) {
  const m = MYST.find(x => x.id === id), price = mystPrice(m);
  if (S.lvl < m.lvl) return toast(`🔒 Requires level ${m.lvl}.`);
  if (S.money < price) { SFX.bad(); return toast('💸 Not enough money.'); }
  if (free() <= 0) { SFX.bad(); return toast('🎒 No room in your bag!'); }
  S.money -= price; S.stats.mystery++;
  let it = Math.random() < .03 ? IT.chicken : wpick(mystPool(m), i => Math.pow(i.base, -.85) * (i.r >= 3 ? 1 + lv('luck') * .05 : 1));
  const q = wpick([1, 2, 3, 4, 5], x => [20, 28, 28, 16, 8][x - 1]);
  const fake = it.r < 5 && Math.random() < m.fake;
  if (it.id === 'bagle') S.stats.goldenFound++;
  addInv({ id: it.id, q, fake, rev: fake, paid: price });
  commit();
  SFX.open();
  showModal({ art: `<span class="shaking" style="display:inline-block">${m.e}</span>`, title: 'Opening…', text: '<p style="text-align:center">*rustle rustle* … *crinkle* …</p>', choices: [] });
  setTimeout(() => {
    const sp = sellPrice(S.inv[S.inv.length - 1] || { id: it.id, q, paid: 0 });
    const good = sp === null || sp >= price;
    if (it.r >= 4) { SFX.jackpot(); confetti(250); shake(); } else if (good) { SFX.rare(); confetti(60); } else SFX.meh();
    showModal({
      art: '', title: it.r >= 4 ? '🤯 ' + RAR[it.r].toUpperCase() + '!!!' : good ? '✨ Nice!' : pick(['Meh.', 'Oh. Okay.', 'Could be worse!', 'Bag-ception!']),
      cls: 'rays',
      text: `<div style="text-align:center"><div class="reveal" style="border-color:${RCOL[it.r]};--rc:${RCOL[it.r]}"><div class="big">${it.e}</div></div>
        <div class="rt" style="color:${RCOL[it.r]}">${RAR[it.r]}</div><div style="font-size:18px">${it.name}</div>${stars(q)}
        <p class="sub">${it.desc}</p>${fake ? '<p><b style="color:var(--bad)">🕵️ …it\'s a FAKE. "Certified Genuine*"</b></p>' : ''}
        <p>Sells for ~<b>${sp === null ? '???' : fmt(sp)}</b> here. Paid ${fmt(price)}.</p></div>`,
      choices: [{ label: 'Into the bag! 🎒', cls: 'good' }, ...(free() > 0 && S.money >= price ? [{ label: `Open another (${fmt(price)})`, cls: 'purple', act: () => { setTimeout(() => openMyst(id), 30); return 'skip'; } }] : [])],
    });
  }, 1100);
}
function deliver(u) {
  const c = S.contracts.find(x => x.u === u); if (!c) return;
  if (S.town !== c.town) return toast(`Deliver this in ${TW[c.town].e} ${TW[c.town].name}.`);
  const have = S.inv.filter(i => i.id === c.id).sort((a, b) => a.q - b.q);
  if (have.length < c.qty) return toast(`You need ${c.qty}× ${IT[c.id].name}.`);
  const used = have.slice(0, c.qty);
  const fakes = used.filter(i => i.fake).length;
  S.inv = S.inv.filter(i => !used.includes(i));
  let reward = Math.round(c.reward * (1 + pp('contract'))), msg = '';
  if (fakes && c.giver === 'guild' && Math.random() < .6) { reward = Math.round(reward / 2); S.rep.guild -= 5; addKarma(-2); msg = ` The guild noticed ${fakes} fake(s)! Half pay, Guild -5.`; }
  else if (fakes && c.giver === 'rebels') { reward = Math.round(reward * 1.2); msg = ' The rebels LOVE fakes. +20%!'; }
  S.money += reward; S.rep[c.giver] += 5; S.stats.contracts++;
  S.contracts = S.contracts.filter(x => x !== c);
  S.contracts.push(genContract());
  gainXP(c.xp);
  SFX.jackpot(); confetti(100); floatCenter('+' + fmt(reward), 'big');
  log(`📜 Contract done for ${GIVERS[c.giver].n}: +${fmt(reward)}.${msg}`);
  commit();
}
function shakeBag(el) {
  wiggle(el); SFX.click();
  if (Math.random() < .08) {
    const f = ri(1, 3 * S.lvl);
    S.money += f; floatText(el.getBoundingClientRect().left + 30, el.getBoundingClientRect().top, '+' + fmt(f));
    toast(pick(['🪙 A coin fell out of the lining!', '🪙 Found ' + fmt(f) + ' in a secret pocket!', '🪙 The bag coughs up ' + fmt(f) + '.']));
    commit();
  } else if (Math.random() < .03) toast(pick(['🧺 The bag sighs contentedly.', '🧺 *muffled bag noises*', '🧺 Something in there just winked at you.']));
}
function ascend() {
  const nw = netWorth();
  const gain = Math.floor(Math.sqrt(nw / 1e5));
  if (nw < 1e6) return;
  showModal({
    art: '🌟', title: 'Pass the Bag?', cls: 'rays',
    text: `<p>You retire to a villa made entirely of bags. Your heir inherits your legend… but not your stuff.</p>
      <p>You gain <b>${gain} Golden Threads</b> 🧵 (each: +5% sell price forever, +₲150 starting cash).</p>
      <p class="sub">Reset: money, items, bags, upgrades, level. Kept: threads & trophies.</p>`,
    choices: [
      { label: `Ascend! (+${gain} 🧵)`, cls: 'purple', act: () => {
        const keep = { threads: S.threads + gain, ach: S.ach, muted: S.muted, stats: { ascensions: S.stats.ascensions + 1 } };
        S = newState(keep); rollDays(); genMarket(); arrivalRumors();
        while (S.contracts.length < 3) S.contracts.push(genContract());
        confetti(400); SFX.jackpot();
        return `Your heir opens Grandma's old burlap sack. It glows with ${S.threads} golden threads. The legend continues…`;
      } },
      { label: 'Not yet' },
    ],
  });
}
const isIllegal = i => i.fake || i.forged || IT[i.id].cat === 'contra';

/* ---------- travel events ---------- */
function travelEvent() {
  const evs = [
    { w: S.rep.pirates >= 30 || pp('pirate') ? .6 : (S.inv.length ? (S.town === 'grogg' ? 2.6 : 1.5) : .4), f: evPirates },
    { w: 1.4, f: evBeggar },
    { w: S.lvl >= 4 && free() > 0 ? .8 : 0, f: evCourier },
    { w: free() > 0 ? 1 * (pp('found') || 1) : 0, f: evFound },
    { w: S.money > 60 ? .8 : 0, f: evTax },
    { w: free() > 0 ? .9 : 0, f: evGnome },
    { w: .6, f: evBard },
    { w: free() > 0 ? .35 : 0, f: evChicken },
    { w: S.inv.some(isIllegal) ? .6 + S.heat / 80 : 0, f: evInspector },
    { w: .45, f: evParade },
    { w: S.inv.length ? .6 : 0, f: evGoblin },
  ].concat(extraEvents());
  const ev = wpick(evs, e => e.w);
  showModal(ev.f());
}
function fightChance() {
  return clamp(.3 + lv('guard') * .07 + (bag().pirate ? .15 : 0) + pp('fight') + (S.karma < 0 ? Math.min(-S.karma, 50) * .002 : 0), .05, .95);
}
function loseItems(n) {
  const names = [];
  for (let i = 0; i < n && S.inv.length; i++) {
    const k = Math.floor(Math.random() * S.inv.length);
    names.push(IT[S.inv[k].id].e + ' ' + IT[S.inv[k].id].name); S.inv.splice(k, 1);
  }
  return names.join(', ');
}
function evPirates() {
  const capt = pick(['Captain Ravenbeard', 'Admiral Soggybottom', 'One-Eyed Gertrude', 'Captain Wobblepeg', 'Barnacle Bob the Unwashed']);
  if (S.rep.pirates >= 30 || pp('pirate')) return {
    art: '🏴‍☠️', title: 'Pirate Ambush?',
    text: `<p><b>${capt}</b>'s crew jumps out of a bush… then recognizes you.</p><p>"Oi, it's our mate! Carry on, love." They pat your bag affectionately.</p>`,
    choices: [{ label: 'Arr! 🏴‍☠️', act: () => { gainXP(10 * S.lvl); } }],
  };
  const toll = Math.ceil(S.money * (bag().pirate ? .07 : .14));
  const win = fightChance();
  const flee = Math.min(.9, .55 + lv('cart') * .06);
  return {
    art: '🏴‍☠️', title: 'PIRATES!',
    text: `<p><b>${capt}</b> and crew block the road.</p><p>"Yer bag or yer life! …Actually just some money. We're flexible. Times are hard."</p>`,
    choices: [
      { label: `Pay toll (${fmt(toll)})`, act: () => { S.money -= toll; S.rep.pirates += 2; return `You hand over ${fmt(toll)}. The pirates count it twice and sing you a little shanty. Pirates +2.`; } },
      { label: `⚔️ Fight! (${Math.round(win * 100)}% win)`, cls: 'danger', act: () => {
        S.stats.fights++;
        if (Math.random() < win) {
          const loot = Math.round(rnd(20, 60) * Math.pow(1.6, S.lvl));
          S.money += loot; S.stats.wins++; S.rep.pirates -= 3; S.rep.guild += 3; gainXP(15 * S.lvl);
          confetti(80); SFX.jackpot();
          return `💥 POW! ${lv('guard') ? 'Brutus suplexes the captain.' : 'You swing your bag like a flail.'} The pirates flee in tears! You loot <b>${fmt(loot)}</b>. Guild +3.`;
        }
        const lost = loseItems(2); const cash = Math.ceil(S.money * .1); S.money -= cash; shake(); SFX.bad();
        return `You lose. Badly. They take ${lost || 'nothing (your bag was empty, lol)'} and ${fmt(cash)}. They also take your dignity.`;
      } },
      { label: `🏃 Run away (${Math.round(flee * 100)}%)`, act: () => {
        if (Math.random() < flee) return 'You run like a coward. A SUCCESSFUL coward! Your bag jiggles triumphantly.';
        const lost = loseItems(1); SFX.bad();
        return `You trip over your own bag. They grab ${lost || 'nothing'} and laugh at you for a solid minute.`;
      } },
    ],
  };
}
function godGift() {
  const money = Math.round(rnd(60, 160) * Math.pow(1.6, S.lvl));
  S.money += money;
  let itemTxt = '';
  if (free() > 0) {
    const pool = ITEMS.filter(i => !i.special && i.r >= 2 && i.base <= itemCap() * 3);
    const it = pool.length ? pick(pool) : IT.ring;
    addInv({ id: it.id, q: ri(4, 5), paid: 0 }); itemTxt = ` and a shimmering ${it.e} <b>${it.name}</b> (free!)`;
  }
  addKarma(3); confetti(200); SFX.jackpot();
  return { art: '👼', title: 'IT WAS A BAG GOD!', cls: 'rays', text: `<p>The beggar throws off their rags. It's <b>Baggus, Old God of Bags</b>!</p><p>"Your kindness pleases me, little merchant." They bless you with <b>${fmt(money)}</b>${itemTxt}.</p>` };
}
function evBeggar() {
  const who = pick(['a starving goblin child', 'an old dwarf with no beard (tragic)', 'a sad wizard who lost his hat', 'a tiny knight with a giant debt', 'a troll who only wants a hug']);
  const cheapest = S.inv.filter(i => i.id !== 'crate').sort((a, b) => IT[a.id].base - IT[b.id].base)[0];
  const coin = Math.max(5, Math.round(S.money * .05));
  const godChance = (S.karma >= 10 ? .2 : .05) * (pp('god') || 1);
  const maybeGod = fallback => (Math.random() < godChance ? godGift() : fallback);
  return {
    art: '🥺', title: 'A Beggar!',
    text: `<p>On the road you meet <b>${who}</b>, holding out a tiny bag. "Spare anything for my empty bag?"</p>`,
    choices: [
      cheapest && { label: `🎁 Give ${IT[cheapest.id].e} ${IT[cheapest.id].name}`, cls: 'good', act: () => {
        S.inv = S.inv.filter(i => i !== cheapest); const k = addKarma(4); S.stats.deeds++;
        return maybeGod(`They hug your leg. Karma +${k}. Your bag feels lighter, emotionally.`);
      } },
      S.money >= coin && { label: `🪙 Give ${fmt(coin)}`, cls: 'good', act: () => {
        S.money -= coin; const k = addKarma(2); S.stats.deeds++;
        return maybeGod(`They buy a sandwich and cry happy tears into it. Karma +${k}.`);
      } },
      { label: 'Walk past', act: () => { addKarma(-1); return 'You walk past. Somewhere, a bag god frowns. Karma -1.'; } },
      S.lvl >= 2 && { label: '😈 Steal their cup', cls: 'danger', act: () => {
        const g = ri(2, 6) * S.lvl; S.money += g; addKarma(-6); S.rep.pirates += 2;
        return `You steal ${fmt(g)} from a beggar. A pirate in a bush gives you a thumbs up. Karma -6. You absolute monster.`;
      } },
    ].filter(Boolean),
  };
}
function evCourier() {
  return {
    art: '📦', title: 'Rebel Courier',
    text: `<p>A hooded figure whispers: "Psst. Take this crate to <b>🔥 Rebel Hollow</b>. Don't open it. Don't get caught. VIVA LA BAG!"</p><p class="sub">Pays ~${fmt(crateVal())} in Rebel Hollow. Contraband — guards hate it.</p>`,
    choices: [
      { label: '📦 Take the crate', act: () => { addInv({ id: 'crate', q: 3, paid: 0 }); S.heat += 10; S.rep.rebels += 2; return 'The crate is now in your bag. It ticks. Probably a clock. Rebel Hollow is now on your map!'; } },
      { label: '🏛️ Report to the Guild', act: () => { const r = Math.round(20 * Math.pow(1.5, S.lvl)); S.money += r; S.rep.guild += 5; S.rep.rebels -= 8; return `The guild pays you ${fmt(r)} for the tip. The rebels will remember this. Guild +5, Rebels -8.`; } },
      { label: 'No thanks', act: () => 'The figure vanishes into a bush. The bush also leaves.' },
    ],
  };
}
function evFound() {
  const pool = ITEMS.filter(i => !i.special && i.base <= itemCap() * 1.5);
  const it = pick(pool), q = ri(1, 5);
  return {
    art: it.e, title: 'Something on the Road!',
    text: `<p>You find a <b>${it.name}</b> ${stars(q)} lying in a ditch. ${pick(['Finders keepers!', 'Nobody is looking…', 'It looks lonely.'])}</p>`,
    choices: [
      { label: '🎒 Into the bag!', cls: 'good', act: () => { addInv({ id: it.id, q, paid: 0 }); return `${it.e} ${it.name} added to your bag. Free stuff is the best stuff.`; } },
      { label: '😇 Leave it for someone in need', act: () => { const k = addKarma(2); return `Noble! A poor farmer finds it later and names their goat after you. Karma +${k}.`; } },
    ],
  };
}
function evTax() {
  const tax = Math.ceil(S.money * .08), bribe = Math.ceil(S.money * .04);
  const argue = clamp(.25 + lv('tongue') * .06, 0, .9);
  if (pp('taxman')) {
    const cut = Math.round(rnd(10, 30) * lvlScale(1.4));
    return { art: '🧾', title: 'A Fellow Tax Collector', text: `<p>The Imperial tax collector spots your clipboard. "Ah, a colleague!" He splits today's take with you: <b>${fmt(cut)}</b>.</p>`,
      choices: [{ label: 'Taxes are beautiful 🥲', act: () => { S.money += cut; } }] };
  }
  return {
    art: '🧾', title: 'Imperial Tax Collector',
    text: `<p>"By decree of the Emperor, all bags are taxed. Bag tax. It's a new thing." He taps his clipboard.</p>`,
    choices: [
      { label: `Pay ${fmt(tax)}`, act: () => { S.money -= tax; S.rep.guild += 3; addKarma(1); return 'He stamps your forehead. "Good citizen." Guild +3.'; } },
      { label: `🤫 Bribe ${fmt(bribe)} (70%)`, act: () => {
        S.money -= bribe;
        if (Math.random() < .7) { addKarma(-1); return 'He pockets the coins and suddenly forgets you exist. Karma -1.'; }
        S.money -= tax; S.heat += 15; return `"Bribery?! That's double tax!" You pay ${fmt(tax)} more. Heat +15.`;
      } },
      { label: `🗣️ Argue (${Math.round(argue * 100)}%)`, act: () => {
        if (Math.random() < argue) { gainXP(8 * S.lvl); return 'You argue that bags are technically "wearable art". He is confused and leaves. You pay nothing!'; }
        S.money -= tax * 2; return `Your argument was terrible. He doubles the tax: ${fmt(tax * 2)}.`;
      } },
    ],
  };
}
function evGnome() {
  const pool = ITEMS.filter(i => !i.special && i.base <= itemCap() * 2 && i.base >= itemCap() * .2);
  const it = pick(pool.length ? pool : ITEMS.filter(i => !i.special && i.base <= itemCap() * 2)), q = ri(3, 5);
  const val = Math.round(it.base * QMULT[q - 1]);
  const price = Math.max(1, Math.round(val * .45));
  const fake = Math.random() < .5;
  const spotted = fake && Math.random() < lv('eye') * .1;
  return {
    art: '🧙', title: 'Traveling Gnome Salesman',
    text: `<p>"Psssst! ${it.e} <b>${it.name}</b> ${stars(q)}! Worth ${fmt(val)}, for YOU only ${fmt(price)}! 100% genuine, pinky promise!"</p>${spotted ? '<p><b style="color:var(--bad)">🦅 Eagle Eye: the label says "Rolax". It\'s FAKE.</b></p>' : '<p class="sub">His pinky is crossed. Hmm.</p>'}`,
    choices: [
      { label: `Buy for ${fmt(price)}`, disabled: S.money < price, act: () => { S.money -= price; addInv({ id: it.id, q, fake, rev: spotted, paid: price }); return fake && spotted ? 'You knowingly buy a fake. A true merchant. 😏' : 'The gnome cackles and vanishes in a puff of glitter. Was it real? Only one way to find out…'; } },
      { label: 'No thanks', act: () => '"Your loss!" The gnome tries to sell the same thing to a tree.' },
    ],
  };
}
function evBard() {
  const good = S.karma >= 0;
  const tip = Math.max(3, Math.round(4 * lvlScale()));
  return {
    art: '🎻', title: 'A Wandering Bard',
    text: `<p>A bard leaps out: "I shall sing the ballad of… <b>${good ? 'The Generous Bag-Bearer' : 'The Villain With the Suspicious Bag'}</b>!"</p><p>It has 47 verses.</p>`,
    choices: [
      { label: `🪙 Tip ${fmt(tip)}`, cls: 'good', disabled: S.money < tip, act: () => { S.money -= tip; addKarma(1); gainXP(12 * S.lvl); good ? S.rep.guild += 2 : S.rep.pirates += 2; return 'The song spreads across the land. You are slightly famous! +XP, rep +2.'; } },
      { label: '🍅 Boo!', act: () => { if (free() > 0) { addInv({ id: 'tomato', q: 1, paid: 0 }); return 'The bard throws a tomato. It lands in your bag. You now own a 🍅 Thrown Tomato.'; } return 'The bard throws a tomato. It misses. Your bag is too full even for tomatoes.'; } },
    ],
  };
}
function evChicken() {
  return {
    art: '🐔', title: 'A Chicken Appears',
    text: '<p>A chicken stares into your soul. Then it hops into your bag and refuses to leave.</p><p class="sub">The Chicken of Destiny sells for anything from ₲1 to a fortune.</p>',
    choices: [
      { label: '🐔 Welcome, friend', cls: 'good', act: () => { addInv({ id: 'chicken', q: ri(1, 5), paid: 0 }); return 'The chicken settles in. It clucks ominously. Destiny awaits.'; } },
      { label: 'Shoo!', act: () => 'The chicken pecks you exactly once, deeply disappointed, and leaves.' },
    ],
  };
}
function inspection(title, art, intro) {
  const bad = S.inv.filter(isIllegal);
  const findCh = .55 * (1 - (bag().sneak || 0));
  const bribe = Math.ceil(S.money * .12 + 5);
  return {
    art, title,
    text: `<p>${intro}</p><p class="sub">You're carrying ${bad.length} suspicious item(s).${bag().sneak ? ' Your secret lining might hide them…' : ''}</p>`,
    choices: [
      { label: '🙂 Act natural', act: () => {
        if (Math.random() < findCh && bad.length) {
          const names = bad.map(i => IT[i.id].e).join(' ');
          S.inv = S.inv.filter(i => !isIllegal(i));
          const fine = Math.min(S.money, Math.round(bad.reduce((a, i) => a + IT[i.id].base, 0) * .5));
          S.money -= fine; S.heat += 20; S.rep.guild -= 5; S.stats.caught++; SFX.bad(); shake();
          return `"What's THIS?" They confiscate ${names} and fine you ${fmt(fine)}. Heat +20.`;
        }
        S.rep.guild += 1; return 'You whistle innocently. They wave you through. Your bag lets out a tiny sigh of relief.';
      } },
      { label: `💰 Bribe ${fmt(bribe)} (80%)`, disabled: S.money < bribe, act: () => {
        S.money -= bribe;
        if (Math.random() < .8) { addKarma(-1); return '"I didn\'t see anything." Karma -1.'; }
        S.inv = S.inv.filter(i => !isIllegal(i)); S.heat += 30; SFX.bad();
        return 'He takes the money AND the goods. "Bribing an officer? Bold." Heat +30.';
      } },
    ],
  };
}
const evInspector = () => inspection('Guild Bag Inspector', '🕵️', '"Random bag inspection! Open it up. Slowly. No sudden bag movements."');
const evGuardCheck = () => inspection('Gate Guards!', '💂', `Your heat is high (${S.heat}). The Silverspire gate guards stop you. "We've heard about you, bag-person."`);
function evParade() {
  const g = Math.round(rnd(8, 25) * lvlScale(1.5));
  return {
    art: '🎉', title: 'Royal Parade!',
    text: '<p>The Prince parades by, throwing coins at the peasants. You are, technically, a peasant.</p>',
    choices: [
      { label: '🙌 Catch coins!', act: () => { S.money += g; return `You catch ${fmt(g)}! Also a flower. Also a small dog, which you return.`; } },
      { label: '🙇 Give them to a kid', cls: 'good', act: () => { const k = addKarma(2); gainXP(5 * S.lvl); return `You hand the coins to a little kid. Karma +${k}. The kid says your bag is cool.`; } },
    ],
  };
}
function evGoblin() {
  const mine = pick(S.inv.filter(i => i.id !== 'crate')) || S.inv[0];
  const it = IT[mine.id];
  return {
    art: '👺', title: 'Goblin Swap Meet',
    text: `<p>A goblin points at your ${it.e} <b>${it.name}</b>. "SWAP! Me give mystery thing! Is good! Is… thing!"</p>`,
    choices: [
      { label: '🔄 Swap it!', act: () => {
        const pool = ITEMS.filter(i => !i.special && i.base <= itemCap() * 3);
        const n = pick(pool); const k = S.inv.indexOf(mine);
        if (k >= 0) S.inv[k] = { id: n.id, q: ri(1, 5), fake: Math.random() < .2, rev: false, paid: mine.paid, u: S.uid++ };
        return `You get a ${n.e} <b>${n.name}</b>! ${n.base > it.base ? 'WHAT A DEAL! 🤩' : 'The goblin runs away giggling. 😐'}`;
      } },
      { label: 'No swap', act: () => 'The goblin is sad. It swaps with a squirrel instead.' },
    ],
  };
}
function evNight() {
  return pick([
    () => {
      const lost = loseItems(1);
      return { art: '🐀', title: 'Night Thief!', text: lost ? `<p>A rat in a tiny hat stole ${lost} while you slept.</p>` : '<p>A rat in a tiny hat rummages in your bag, finds nothing, and leaves a sad note.</p>' };
    },
    () => { gainXP(10 * S.lvl); return { art: '💭', title: 'A Bag Dream', text: '<p>You dream of an infinite bag. It whispers: "Buy low. Sell high. Love me." You wake up inspired. +XP</p>' }; },
    () => { const g = ri(5, 15) * S.lvl; S.money += g; return { art: '🧚', title: 'Bag Fairy', text: `<p>The Bag Fairy visited and left ${fmt(g)} under your pillow. She took a sock as payment.</p>` }; },
  ])();
}

/* ---------- rendering ---------- */
let shownMoney = 0;
function commit() { checkAch(); save(); render(); }
function render() { renderTop(); renderMarket(); renderBag(); renderSide(); renderWallet(); }

function karmaTitle() {
  const k = S.karma;
  if (k >= 100) return '👼 Bag Angel'; if (k >= 50) return '😇 Saint'; if (k >= 25) return '🤝 Kind'; if (k >= 10) return '🥚 Good Egg';
  if (k <= -50) return '😈 Villain'; if (k <= -20) return '🦹 Scoundrel'; if (k <= -5) return '😏 Rascal'; return '😐 Neutral';
}
function renderTop() {
  const t = town();
  $('#tb-day').innerHTML = `📅 Day ${S.day}`;
  $('#tb-town').innerHTML = `${t.e} ${t.name}`;
  $('#tb-lvl').innerHTML = `⭐ Lv ${S.lvl}<span class="xpbar"><i style="width:${(S.xp / xpNeed(S.lvl) * 100).toFixed(1)}%"></i></span>`;
  $('#tb-lvl').title = `${fmtN(S.xp)} / ${fmtN(xpNeed(S.lvl))} XP`;
  $('#tb-karma').innerHTML = `${karmaTitle()} <small>(${Math.round(S.karma)})</small>`;
  $('#tb-karma').title = 'Karma: good deeds → bag-god blessings & better prices. Bad deeds → pirates & rebels like you more.';
  $('#tb-heat').innerHTML = S.heat > 0 ? `🚨 Heat ${S.heat}` : '👮 Clean';
  $('#tb-heat').title = 'Heat: how much the guards suspect you. Decays every day.';
  $('#tb-energy').innerHTML = `⚡ ${S.energy}/${MAX_ENERGY}`;
  $('#tb-energy').title = 'Energy for jobs, inventing, relabeling and pickpocketing. Refills when you sleep or travel.';
  $('#tb-prof').innerHTML = prof() ? `${prof().e} ${prof().name}` : '💼 Unemployed';
  $('#tb-prof').dataset.act = 'tab'; $('#tb-prof').dataset.arg = 'work';
  const ae = activeEvents();
  $('#tb-news').innerHTML = ae.length ? ae.map(w => `${WE[w.id].e} ${WE[w.id].name}`).join(' · ') : (upcomingEvents().length ? '🔮 Something is coming…' : '📰 Quiet times');
  $('#tb-news').dataset.act = 'tab'; $('#tb-news').dataset.arg = 'exchange';
  $('#tb-nw').textContent = `Net worth ${fmt(netWorth())}${S.threads ? ' · 🧵' + S.threads : ''}`;
  $('#btn-mute').textContent = S.muted ? '🔇' : '🔊';
}
function renderMarket() {
  const t = town(), d = S.days[t.id];
  const dem = [];
  if (d.hot) dem.push(`🔥 <b>${CATS[d.hot].e} ${CATS[d.hot].name} ×${d.hotM.toFixed(1)}</b> — everyone wants it!`);
  if (d.crash) dem.push(`📉 ${CATS[d.crash].e} ${CATS[d.crash].name} crashed (×0.5)`);
  if (!dem.length) dem.push('A normal day. Prices are… normal.');
  const rum = S.rumorText.map(r => `<div class="rumor">🍺 ${r}</div>`).join('');
  const ev = activeEvents().map(w => `<div class="rumor" style="font-style:normal">📰 <b>${WE[w.id].e} ${WE[w.id].name}</b> ${evEffects(WE[w.id])} (${w.end - S.day + 1}d left)</div>`).join('');
  const tips = tradeTips();
  const adv = tips.length ? `<div class="advisor"><b>💡 Best trades from here</b>${tips.map(x => `<div>${IT[x.o.id].e} buy <b>${fmt(x.o.price)}</b> → sell in ${x.b.t.e} ${x.b.t.name} <b>${fmt(x.b.p)}</b> <span class="up">+${Math.round(x.pct * 100)}%</span></div>`).join('')}<small>Travel costs extra. Prices change daily — check 📈 Exchange.</small></div>`
    : `<div class="advisor"><b>💡 No great trades here today.</b><small>Sleep for new deals, travel, or check the 📈 Exchange and 🛠️ Work tabs.</small></div>`;
  const offers = S.market.map((o, k) => {
    const it = IT[o.id];
    return `<div class="offer r${it.r} ${o.stock <= 0 ? 'soldout' : S.money < o.price ? 'poor' : ''}" data-act="buy" data-arg="${k}" title="${it.desc}">
      <div class="o-emoji">${it.e}</div>
      <div class="o-info"><div class="o-name">${it.name}</div>
        <div class="o-meta">${stars(o.q)} <span>${CATS[it.cat].e}</span> <span class="rt" style="color:${RCOL[it.r]}">${RAR[it.r]}</span> <span>×${o.stock}</span></div>
        ${hintFor(o)}</div>
      <div class="o-price">${o.stock > 0 ? fmt(o.price) : 'SOLD'}</div>
      ${o.rev ? '<div class="stamp">FAKE</div>' : ''}
    </div>`;
  }).join('');
  $('#market').innerHTML = `
    <h2>${t.e} ${t.name} Market</h2>
    <p class="sub">${t.desc}</p>
    <div class="demand">${dem.join('<br>')}${ev}${rum}</div>${adv}
    <div class="offers">${offers}</div>
    <div class="inn"><button class="btn sm" data-act="sleep" ${S.money < innCost() ? 'disabled' : ''}>🛏️ Inn ${fmt(innCost())}<br><small>new deals + rumors</small></button>
      <button class="btn sm" data-act="street">🛌 Street (free)<br><small>same market, risky</small></button></div>
    ${S.money < travelCostMin() && !S.inv.length ? `<div class="demand" style="margin-top:10px">💸 <b>Broke?</b> Go to the <b>🛠️ Work</b> tab: work a shift, invent mud water, or pickpocket someone.</div>` : ''}`;
}
function renderBag() {
  const b = bag(), cap = capacity(), t = town();
  let slots = '';
  for (const i of S.inv) {
    const it = IT[i.id], p = sellPrice(i);
    const cls = p === null ? 'mid' : p > i.paid * 1.02 ? 'up' : p < i.paid * .98 ? 'down' : 'mid';
    const risky = ((i.rev || i.forged) && !t.fence) || (it.cat === 'contra' && !t.contra);
    const bs = p === null ? null : bestSale(i);
    slots += `<div class="slot filled r${it.r}" data-act="sell" data-arg="${i.u}" title="${it.name} (${i.q}★)\n${it.desc}\nPaid ${fmt(i.paid)} · Click to SELL${bs && bs.t.id !== S.town ? `\nBest today: ${bs.t.name} ${fmt(bs.p)}` : ''}${i.forged ? '\n🏷️ Forged quality label' : ''}${risky ? '\n⚠️ Guards might catch this here!' : ''}">
      <span class="s-q">${'★'.repeat(i.q)}</span>${it.cat === 'contra' ? '<span class="s-tag">☠️</span>' : ''}
      <div class="s-e">${it.e}</div><div class="s-p ${cls}">${p === null ? '₲???' : fmt(p)}</div>
      ${i.rev ? '<div class="stamp">FAKE</div>' : ''}${i.forged ? '<span class="s-tag" style="top:auto;bottom:2px;left:4px;right:auto">🏷️</span>' : ''}${risky ? '<span class="s-tag" style="top:auto;bottom:2px">⚠️</span>' : ''}</div>`;
  }
  for (let k = S.inv.length; k < cap; k++) slots += '<div class="slot empty"></div>';
  const bagVal = S.inv.reduce((a, i) => a + (sellPrice(i) || 0), 0);
  const paid = S.inv.reduce((a, i) => a + i.paid, 0);
  const full = S.inv.length >= cap;
  $('#bagzone').innerHTML = `
    <div class="bag-head">
      <div class="bag-icon" data-act="shake" title="Shake the bag!">${b.e}</div>
      <div class="bag-title"><h2>${b.name}</h2><div class="perk">${b.perk}</div></div>
    </div>
    <div class="capbar"><i style="width:${S.inv.length / cap * 100}%"></i></div>
    <div class="capline"><span>🎒 ${S.inv.length} / ${cap} slots ${full ? '— <b style="color:#c2410c">FULL!</b>' : ''}</span>
      <span>${S.streak > 1 ? `<span class="streak">🔥 ×${S.streak} streak +${S.streak * 2}%</span>` : ''}</span>
      <span>Worth here: <b style="color:${bagVal >= paid ? '#1f8e46' : '#c0392b'}">${fmt(bagVal)}</b></span></div>
    <div class="sack ${full ? 'full' : ''}" style="--bagc:${b.color}"><div class="slots">${slots}</div></div>
    <div class="bag-actions">
      <button class="btn good" data-act="sellprofit">💰 Sell all profitable</button>
      <button class="btn danger" data-act="sellall">🧹 Dump everything</button>
    </div>
    <div class="log">${S.log.map(l => `<div>${l}</div>`).join('') || '<div>Click items in the market to buy. Click items in your bag to sell. Travel to sell high!</div>'}</div>`;
}
function renderSide() {
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.arg === S.tab));
  const body = $('#tabbody');
  if (S.tab === 'travel') body.innerHTML = renderTravel();
  else if (S.tab === 'shop') body.innerHTML = renderShop();
  else if (S.tab === 'exchange') body.innerHTML = renderExchange();
  else if (S.tab === 'work') body.innerHTML = renderWork();
  else if (S.tab === 'upgrades') body.innerHTML = renderUpgrades();
  else if (S.tab === 'contracts') body.innerHTML = renderContracts();
  else body.innerHTML = renderTrophies();
}
function renderTravel() {
  return '<h2>🗺️ Travel</h2><p class="sub">Every trip takes a day. Different towns pay wildly different prices. Things happen on the road…</p>' +
    TOWNS.map(t => {
      const here = t.id === S.town, ok = unlocked(t);
      const cats = Object.keys(CATS).filter(c => c !== 'contra' || t.contra || t.m.contra >= 1.5);
      const hi = cats.filter(c => t.m[c] >= 1.5).map(c => CATS[c].e).join('');
      const lo = cats.filter(c => t.m[c] <= .7).map(c => CATS[c].e).join('');
      const d = S.days[t.id];
      let today = '';
      if (here || S.rumors[t.id]) {
        if (d.hot) today += `<span class="tag hot">🔥 ${CATS[d.hot].e} ×${d.hotM.toFixed(1)}</span>`;
        if (d.crash) today += `<span class="tag cold">📉 ${CATS[d.crash].e} ×0.5</span>`;
        if (!today) today = '<span class="tag">Normal day</span>';
      } else today = '<span class="tag">❓ No rumors</span>';
      const cost = here ? 0 : travelCost(t.id);
      const bagThere = ok && S.inv.length ? S.inv.reduce((a, i) => a + (sellPrice(i, t.id) || 0), 0) : 0;
      const bagHere = S.inv.reduce((a, i) => a + (sellPrice(i) || 0), 0);
      const bagTag = bagThere ? `<span class="tag ${bagThere > bagHere ? 'hot' : 'cold'}">🎒 Your bag sells for ${fmt(bagThere)} here</span>` : '';
      const btn = here ? '<button class="btn sm" disabled>📍 You are here</button>'
        : !ok ? `<button class="btn sm" disabled>🔒 Lv ${t.lvl}</button>`
        : `<button class="btn sm ${S.money >= cost ? 'blue' : ''}" data-act="travel" data-arg="${t.id}" ${S.money < cost ? 'disabled' : ''}>Go ${fmt(cost)}</button>`;
      return `<div class="card ${here ? 'here' : ''} ${ok ? '' : 'locked'}"><div class="card-row">
        <div class="card-e">${t.e}</div><div class="card-b"><div class="card-t">${t.name}</div>
        <div class="card-d">${t.desc}</div>
        <div class="tags">${hi ? `<span class="tag">💰 Pays well: ${hi}</span>` : ''}${lo ? `<span class="tag">🏷️ Cheap: ${lo}</span>` : ''}${t.strict >= .4 ? '<span class="tag">👮 Strict guards</span>' : ''}${t.fence ? '<span class="tag">🕵️ Buys fakes safely</span>' : ''}${t.contra ? '<span class="tag">☠️ Contraband OK</span>' : ''}</div>
        <div class="tags">${today}${bagTag}</div></div>${btn}</div></div>`;
    }).join('');
}
function renderShop() {
  const myst = MYST.map(m => {
    const p = mystPrice(m), ok = S.lvl >= m.lvl;
    return `<div class="card ${ok ? '' : 'locked'}"><div class="card-row"><div class="card-e">${m.e}</div>
      <div class="card-b"><div class="card-t">${m.name}</div><div class="card-d">${m.desc}</div></div>
      ${ok ? `<button class="btn sm purple" data-act="myst" data-arg="${m.id}" ${S.money < p || free() <= 0 ? 'disabled' : ''}>Open ${fmt(p)}</button>` : `<button class="btn sm" disabled>🔒 Lv ${m.lvl}</button>`}</div></div>`;
  }).join('');
  const bags = BAGS.map(b => {
    const own = S.owned.includes(b.id), eq = S.bag === b.id, ok = S.lvl >= b.lvl;
    let btn;
    if (eq) btn = '<button class="btn sm" disabled>✅ Equipped</button>';
    else if (own) btn = `<button class="btn sm blue" data-act="bag" data-arg="${b.id}">Equip</button>`;
    else if (!ok) btn = `<button class="btn sm" disabled>🔒 Lv ${b.lvl}</button>`;
    else btn = `<button class="btn sm ${S.money >= b.price ? 'good' : ''}" data-act="bag" data-arg="${b.id}" ${S.money < b.price ? 'disabled' : ''}>Buy ${fmt(b.price)}</button>`;
    return `<div class="card ${eq ? 'here' : ''} ${ok || own ? '' : 'locked'}"><div class="card-row"><div class="card-e">${b.e}</div>
      <div class="card-b"><div class="card-t">${b.name}</div><div class="card-d">🎒 <b>${b.slots} slots</b> · ${b.perk}</div></div>${btn}</div></div>`;
  }).join('');
  return `<h2>🛍️ The Bag Shop</h2><p class="sub">"Bags for every occasion. And bags for those bags." — Madame Satchelle</p>
    <h3>🎁 Mystery Bags</h3>${myst}<h3>🎒 Bags</h3>${bags}`;
}
function renderUpgrades() {
  return '<h2>⚒️ Upgrades</h2><p class="sub">Upgrade stuff to get more stuff.</p>' + UPG.map(u => {
    const l = lv(u.id), max = l >= u.max, c = upgCost(u);
    return `<div class="card"><div class="card-row"><div class="card-e">${u.e}</div><div class="card-b">
      <div class="card-t">${u.name} <small>Lv ${l}</small></div>
      <div class="card-d">${l ? 'Now: ' + u.desc(l) : 'Not learned yet'}${max ? '' : `<br>Next: <b>${u.desc(l + 1)}</b>`}</div>
      <div class="pips">${Array.from({ length: u.max }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div></div>
      ${max ? '<button class="btn sm" disabled>MAX</button>' : `<button class="btn sm ${S.money >= c ? 'good' : ''}" data-act="upg" data-arg="${u.id}" ${S.money < c ? 'disabled' : ''}>${fmt(c)}</button>`}
    </div></div>`;
  }).join('');
}
function renderContracts() {
  const reps = Object.entries(GIVERS).map(([k, g]) => `<span class="tag">${g.e} ${g.n}: <b>${S.rep[k]}</b></span>`).join('');
  return `<h2>📜 Contracts</h2><p class="sub">Deliver goods for big rewards & reputation. Reputation gives better prices in their home towns.</p>
    <div class="rep">${reps}</div>` + S.contracts.map(c => {
    const it = IT[c.id], t = TW[c.town], have = S.inv.filter(i => i.id === c.id).length, left = c.due - S.day;
    const can = have >= c.qty && S.town === c.town;
    return `<div class="card ${can ? 'here' : ''}"><div class="card-row"><div class="card-e">${it.e}</div><div class="card-b">
      <div class="card-t">${GIVERS[c.giver].e} ${c.qty}× ${it.name}</div>
      <div class="card-d">Deliver to ${t.e} <b>${t.name}</b> · ${left <= 1 ? '<b style="color:var(--bad)">' + (left <= 0 ? 'Last day!' : '1 day left') + '</b>' : left + ' days left'}<br>
      Have: <b style="color:${have >= c.qty ? '#1f8e46' : 'inherit'}">${have}/${c.qty}</b> · Reward: <b>${fmt(c.reward)}</b> + ${fmtN(c.xp)} XP</div></div>
      <button class="btn sm ${can ? 'good' : ''}" data-act="deliver" data-arg="${c.u}" ${can ? '' : 'disabled'}>Deliver</button></div></div>`;
  }).join('');
}
function renderTrophies() {
  const got = ACH.filter(a => S.ach[a.id]).length;
  const nw = netWorth(), canAsc = nw >= 1e6, gain = Math.floor(Math.sqrt(nw / 1e5));
  const st = S.stats;
  return `<h2>🏆 Trophies <small>${got}/${ACH.length}</small></h2>
    <div class="ach-grid">${ACH.map(a => `<div class="ach ${S.ach[a.id] ? 'got' : ''}" title="${a.d}"><b>${a.e}</b>${a.n}</div>`).join('')}</div>
    <h3>🌟 Pass the Bag (Ascension)</h3>
    <div class="card"><div class="card-d">Reach <b>₲1M net worth</b> to retire and pass the bag to your heir. Gain Golden Threads 🧵: +5% sell price each, forever.<br>
      Threads: <b>${S.threads}</b> · Would gain: <b>${canAsc ? gain : 0}</b></div>
      <div style="margin-top:8px"><button class="btn purple wide" data-act="ascend" ${canAsc ? '' : 'disabled'}>🌟 Pass the Bag ${canAsc ? '(+' + gain + ' 🧵)' : '— need ' + fmt(1e6)}</button></div></div>
    <h3>📊 Stats</h3>
    <div class="stats">
      <span>Items sold</span><b>${fmtN(st.sold)}</b><span>Total profit</span><b>${fmt(st.profit)}</b>
      <span>Best sale</span><b>${fmt(st.bestSale)}</b><span>Best streak</span><b>×${st.bestStreak}</b>
      <span>Jackpots</span><b>${st.jackpots}</b><span>Fakes sold</span><b>${st.fakesSold}</b>
      <span>Times busted</span><b>${st.caught}</b><span>Good deeds</span><b>${st.deeds}</b>
      <span>Fights won</span><b>${st.wins}/${st.fights}</b><span>Mystery bags</span><b>${st.mystery}</b>
      <span>Ascensions</span><b>${st.ascensions}</b>
    </div>
    <div style="margin-top:14px"><button class="btn sm danger" data-act="reset">🗑️ Reset save</button></div>`;
}

/* ---------- wallet: paper money ---------- */
const BILLS = [[1e7, '#2b2b2b', '#ffd54a'], [1e6, '#e8b830', '#5a3d00'], [1e5, '#d9534f', '#fff'], [1e4, '#3fb6a8', '#08302b'], [1000, '#b48ef0', '#2a1450'],
  [500, '#f5a25d', '#4a2300'], [100, '#e8d3a8', '#4a3a1a'], [50, '#8ec5f0', '#0f3350'], [20, '#9fd89a', '#16401a'], [10, '#f7e27a', '#4a3f00'], [5, '#f6b6c9', '#5a1a2e'], [1, '#f4f1e8', '#444']];
const billLabel = d => d >= 1e6 ? d / 1e6 + 'M' : d >= 1000 ? d / 1000 + 'K' : d;
function billHTML(d, bg, fg, style = '') {
  return `<div class="bill" style="background:${bg};color:${fg};${style}"><span>${billLabel(d)}</span><span class="face">🥯</span><span>${billLabel(d)}</span><span class="bk">BAGLE BANK</span></div>`;
}
let lastWallet = -1;
function renderWallet() {
  const m = Math.max(0, Math.floor(S.money));
  if (m === lastWallet) return; lastWallet = m;
  let r = m, html = '';
  for (const [d, bg, fg] of BILLS) {
    const c = Math.floor(r / d); r -= c * d;
    if (!c) continue;
    const layers = Math.min(c, 4);
    let st = '';
    for (let i = layers - 1; i >= 0; i--) st += billHTML(d, bg, fg, `transform:translate(${i * 3}px,${-i * 3}px) rotate(${(i % 2 ? 1 : -1) * i * 1.5}deg)`);
    html += `<div class="billstack" title="${c} × ₲${fmtN(d)}">${st}${c > 1 ? `<span class="bcount">×${fmtN(c)}</span>` : ''}</div>`;
  }
  $('#bills').innerHTML = html || '<span class="broke">Your wallet is empty. Even the moths left.</span>';
}

/* ---------- juice ---------- */
function toast(html, ms = 3200) {
  const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = html;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, ms);
  while ($('#toasts').children.length > 5) $('#toasts').firstChild.remove();
}
function log(s) { S.log.unshift(s); S.log = S.log.slice(0, 12); }
function floatText(x, y, txt, cls = '') {
  const el = document.createElement('div'); el.className = 'float ' + cls; el.textContent = txt;
  el.style.left = x + 'px'; el.style.top = y + 'px';
  document.body.appendChild(el); setTimeout(() => el.remove(), 1150);
}
function floatCenter(txt, cls) { floatText(innerWidth / 2, innerHeight * .4, txt, cls); }
function gulp() { const s = $('.sack'); if (!s) return; s.classList.remove('gulp'); void s.offsetWidth; s.classList.add('gulp'); }
function wiggle(el) { if (!el || !el.animate) return; el.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-8deg) scale(1.05)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(0)' }], { duration: 300 }); }
function shake() { const a = $('#app'); a.classList.remove('shake'); void a.offsetWidth; a.classList.add('shake'); }
function flyBills(rect, n) {
  const target = $('#bills').getBoundingClientRect();
  const pool = BILLS.filter(b => b[0] <= Math.max(1, S.money)).slice(0, 5);
  for (let i = 0; i < n; i++) {
    const [d, bg, fg] = pick(pool.length ? pool : [BILLS[BILLS.length - 1]]);
    const el = document.createElement('div'); el.className = 'flybill';
    el.innerHTML = billHTML(d, bg, fg);
    const sx = rect.left + rect.width / 2 - 28 + rnd(-10, 10), sy = rect.top + rect.height / 2 - 15;
    el.style.left = sx + 'px'; el.style.top = sy + 'px';
    document.body.appendChild(el);
    const tx = target.left + rnd(20, Math.min(target.width, 400)) - sx, ty = target.top + 10 - sy;
    const mx = tx * .4 + rnd(-80, 80), my = Math.min(ty * .3, -60) + rnd(-60, 0);
    el.animate([
      { transform: 'translate(0,0) rotate(0) scale(.6)', opacity: 1 },
      { transform: `translate(${mx}px,${my}px) rotate(${rnd(-200, 200)}deg) scale(1.1)`, opacity: 1, offset: .45 },
      { transform: `translate(${tx}px,${ty}px) rotate(${rnd(-30, 30)}deg) scale(.7)`, opacity: .2 },
    ], { duration: 700 + i * 90, easing: 'cubic-bezier(.3,.1,.3,1)' }).onfinish = () => el.remove();
  }
}
/* confetti */
const fx = $('#fx'), ctx = fx.getContext('2d');
let parts = [], fxRunning = false;
function sizeFx() { fx.width = innerWidth * devicePixelRatio; fx.height = innerHeight * devicePixelRatio; }
addEventListener('resize', sizeFx); sizeFx();
function confetti(n) {
  const cols = ['#ffc83d', '#3ec46d', '#3b8cff', '#ff3d9a', '#b44dff', '#ff9a1f', '#9fd89a', '#f6b6c9'];
  for (let i = 0; i < n; i++) {
    parts.push({ x: innerWidth / 2 + rnd(-120, 120), y: innerHeight * .45, vx: rnd(-9, 9), vy: rnd(-16, -4), r: rnd(0, 6), vr: rnd(-.3, .3),
      w: rnd(6, 12), h: rnd(8, 18), c: pick(cols), life: rnd(70, 130), bill: Math.random() < .25 });
  }
  if (!fxRunning) { fxRunning = true; requestAnimationFrame(fxLoop); }
}
function fxLoop() {
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.life > 0 && p.y < innerHeight + 40);
  for (const p of parts) {
    p.vy += .4; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.min(1, p.life / 30);
    if (p.bill) { ctx.fillStyle = '#9fd89a'; ctx.fillRect(-12, -6, 24, 12); ctx.fillStyle = '#16401a'; ctx.font = 'bold 9px Nunito'; ctx.fillText('₲', -3, 3); }
    else { ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
    ctx.restore();
  }
  if (parts.length) requestAnimationFrame(fxLoop); else { fxRunning = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
}
/* money ticker */
function tick() {
  const diff = S.money - shownMoney;
  if (Math.abs(diff) > .5) {
    shownMoney += diff * .18;
    if (Math.abs(S.money - shownMoney) < 1) shownMoney = S.money;
    $('#tb-money').textContent = fmt(shownMoney);
  } else if (shownMoney !== S.money) { shownMoney = S.money; $('#tb-money').textContent = fmt(shownMoney); }
  requestAnimationFrame(tick);
}

/* ---------- sound (synth, no files) ---------- */
let AC = null;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } } return AC; }
function tone(f, d, type = 'square', v = .05, delay = 0, slide = 0) {
  if (S.muted) return; const a = ac(); if (!a) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + .02);
}
const SFX = {
  click: () => tone(320, .04, 'square', .03),
  buy: () => { tone(520, .07, 'square', .045); tone(780, .09, 'square', .045, .05); },
  sell: (s = 0) => { const b = 660 * Math.pow(1.06, Math.min(s, 20)); tone(b, .06, 'triangle', .08); tone(b * 1.5, .12, 'triangle', .07, .05); tone(b * 2, .08, 'sine', .04, .1); },
  jackpot: () => [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, .16, 'square', .05, i * .065)),
  level: () => [392, 523, 659, 784].forEach((f, i) => tone(f, .14, 'triangle', .08, i * .08)),
  bad: () => { tone(220, .25, 'sawtooth', .05, 0, .5); tone(150, .3, 'sawtooth', .04, .12, .6); },
  travel: () => { tone(300, .08, 'triangle', .05); tone(400, .08, 'triangle', .05, .1); tone(350, .1, 'triangle', .05, .2); },
  open: () => { for (let i = 0; i < 10; i++) tone(200 + i * 60, .06, 'square', .025, i * .1); },
  rare: () => [659, 880, 1175].forEach((f, i) => tone(f, .15, 'triangle', .07, i * .07)),
  meh: () => { tone(400, .12, 'triangle', .05); tone(300, .18, 'triangle', .05, .1); },
};

/* ---------- modal ---------- */
function showModal({ art, title, text, choices, cls }) {
  const m = $('#modal');
  m.innerHTML = `<div class="modal-card ${cls || ''}"><div class="m-art">${art || ''}</div><h2>${title}</h2><div class="m-text">${text || ''}</div><div class="m-choices"></div></div>`;
  const box = m.querySelector('.m-choices');
  (choices || [{ label: 'Continue' }]).forEach(c => {
    const b = document.createElement('button');
    b.className = 'btn ' + (c.cls || ''); b.innerHTML = c.label; if (c.disabled) b.disabled = true;
    b.onclick = () => {
      SFX.click();
      const r = c.act ? c.act() : null;
      if (r === 'skip') { closeModal(); }
      else if (r && typeof r === 'object') showModal(r);
      else if (typeof r === 'string') showModal({ art, title, text: `<p>${r}</p>` });
      else closeModal();
      commit();
    };
    box.appendChild(b);
  });
  m.classList.remove('hidden');
}
function closeModal() { $('#modal').classList.add('hidden'); }
function help() {
  showModal({
    art: '🥯', title: 'Welcome to BAGLE!',
    text: `<p>Grandma left you a burlap sack and ₲120. Her last words: <i>"It's all about the bag."</i></p>
      <p><b>💰 How to make money</b><br>
      1. 🛒 <b>Buy</b> in the market (left). Each offer shows where it sells best today (→ ⛏️ ₲14 +180%).<br>
      2. 🗺️ <b>Travel</b> there and 🎒 <b>sell</b> by clicking items in your bag. The Travel tab shows what your whole bag is worth in each town.<br>
      3. 📈 <b>Exchange</b>: demand changes every day. Wars, cold winters and plagues push prices up for days — stock up early, sell at the peak!<br>
      4. 🛠️ <b>Work</b>: pick one of 20 professions, play job minigames, invent junk ("Premium Mud Water"), fake quality labels, or pickpocket people.<br>
      5. 🛌 Sleep on the street for free (same market), or at the inn for new deals. Sleeping refills ⚡ energy.</p>
      <p>🔥 Sale streaks boost prices. 🎰 Jackpots pay ×2–×5. 🕵️ Fakes & forged labels get you 👮 busted in strict towns. 😇 Good deeds summon bag gods. 🛍️ Bigger bags = bigger profits</p>`,
    choices: [{ label: "Let's get that bag! 💰", cls: 'good' }],
  });
}

/* ---------- achievements ---------- */
function checkAch() {
  for (const a of ACH) {
    if (!S.ach[a.id] && a.f(S)) {
      S.ach[a.id] = 1;
      toast(`🏆 <b>Trophy: ${a.n}</b> ${a.e}<br><small>${a.d}</small>`, 4200);
      gainXP(20 * S.lvl);
    }
  }
}

/* ---------- input ---------- */
const ACTIONS = {
  buy: (a, el) => buy(+a, el),
  sell: (a, el) => sell(+a, el),
  travel: a => travel(a),
  tab: a => { S.tab = a; SFX.click(); renderSide(); save(); },
  bag: a => buyBag(a),
  upg: a => buyUpg(a),
  myst: a => openMyst(a),
  deliver: a => deliver(+a),
  sellprofit: () => sellMany(true),
  sellall: () => {
    if (!S.inv.length) return toast('Your bag is empty. Sad bag.');
    showModal({ art: '🧹', title: 'Dump everything?', text: '<p>Sell <b>every</b> item in your bag right here, even at a loss?</p>', choices: [{ label: 'Yes, dump it all', cls: 'danger', act: () => { setTimeout(() => sellMany(false), 50); return 'skip'; } }, { label: 'Nope' }] });
  },
  sleep: () => sleep(),
  street: () => sleepStreet(),
  xcat: a => { S.xcat = a; SFX.click(); renderSide(); save(); },
  prof: a => chooseProf(a),
  profmenu: () => { showProfList = !showProfList; renderSide(); },
  job: () => startJob(),
  craft: a => craft(a),
  raw: a => buyRaw(a),
  relabel: a => relabel(+a),
  steal: a => startSteal(a),
  shake: (a, el) => shakeBag(el),
  mute: () => { S.muted = !S.muted; renderTop(); save(); },
  help: () => help(),
  ascend: () => ascend(),
  reset: () => showModal({ art: '🗑️', title: 'Reset everything?', text: '<p>This deletes your save, trophies and threads. Forever. Grandma would be sad.</p>', choices: [
    { label: 'Yes, start over', cls: 'danger', act: () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } S = newState(); boot(true); return 'skip'; } },
    { label: 'No way!', cls: 'good' }] }),
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled || el.closest('#modal')) return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) fn(el.dataset.arg, el, e);
});
document.addEventListener('keydown', e => {
  if (!$('#modal').classList.contains('hidden')) {
    if (e.key === 'Enter' || e.key === ' ') { const b = $('#modal .m-choices button:not([disabled])'); if (b) { e.preventDefault(); b.click(); } }
    return;
  }
  if (e.key === 's') sellMany(true);
});
setInterval(() => save(), 10000);

/* ---------- boot ---------- */
function boot(fresh) {
  initWorld();
  if (fresh) {
    rollDays(); genMarket(); arrivalRumors();
    while (S.contracts.length < 3) S.contracts.push(genContract());
    log('🧺 Grandma\'s sack is yours. Buy low, sell high. It\'s all about the bag.');
  }
  lastWallet = -1; shownMoney = S.money; $('#tb-money').textContent = fmt(S.money);
  render(); save();
  if (fresh) help();
}
S = load();
if (S && S.market && S.market.length && Object.keys(S.days).length) boot(false);
else { S = newState(); boot(true); }
requestAnimationFrame(tick);
