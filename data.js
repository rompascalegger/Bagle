'use strict';
/* =====================================================================
   BAGLE content: professions, invented items, world events.
   Loaded before game.js.
   ===================================================================== */

// [id, name, emoji, cat, base, rarity, flavor]  (never sold in markets)
const EXTRA_ITEMS = [
  // raw materials (buy in the workshop)
  ['dirt', 'Fresh Dirt', '🟫', 'food', 1, 0, 'Locally sourced. Gluten-free. Probably.'],
  ['water', 'Puddle Water', '🫗', 'potion', 1, 0, 'From a premium, hand-picked puddle.'],
  // anyone can invent this
  ['mudwater', 'Premium Artisanal Mud Water', '🧉', 'potion', 28, 1, 'Hand-stirred. "Earthy notes." Nobles go crazy for it.'],
  // road finds
  ['starshard', 'Fallen Star Shard', '🌠', 'trinket', 320, 3, 'Fell from the sky. Still a little warm.'],
  // profession inventions
  ['snakeoil', 'Snake Oil (No Snakes)', '🐍', 'potion', 45, 1, 'Cures everything. Proven by nobody.'],
  ['megapot', 'MEGA Potion (Two Potions Taped Together)', '🧴', 'potion', 260, 2, 'Twice the potion. Twice the tape.'],
  ['sporkblade', 'Sporkblade +1', '🔪', 'weapon', 55, 1, 'Stab, scoop, repeat.'],
  ['halberd', 'Axe on a Stick (Basically a Halberd)', '🔱', 'weapon', 320, 2, 'Technically a halberd. Legally an axe.'],
  ['cheesesoup', 'Ancient Cheese Soup', '🍲', 'food', 40, 1, 'The cheese did most of the work.'],
  ['cheesewheel', 'Wheel of Cheddar Destiny', '🛞', 'food', 420, 2, 'Roll it downhill. Follow it to fortune.'],
  ['distressed', 'Designer Distressed Socks', '🧦', 'cloth', 60, 1, 'The holes are the fashion.'],
  ['hoodiehat', 'Hoodie With a Hat Inside', '🧢', 'cloth', 520, 2, 'Double head protection. Double drip.'],
  ['wetstone', 'Lucky Wet Stone', '🪬', 'trinket', 45, 1, 'Twice as lucky as a dry stone.'],
  ['spoonball', 'Spoon-Ball of Prophecy', '🧿', 'trinket', 600, 2, 'Predicts soup. Only soup.'],
  ['fakecoins', 'Totally Real Gold Coins', '🪙', 'trinket', 50, 1, 'Painted rocks. Very convincing paint.'],
  ['lockpick', 'Lockpick of Mild Success', '🗝️', 'trinket', 240, 2, 'Opens 40% of locks, 100% of drawers.'],
  ['certificate', 'Certificate of Authenticity (Smudged)', '📃', 'trinket', 40, 1, 'Certifies… something. The ink ran.'],
  ['diamondring', 'Diamond Ring (Rock Edition)', '💍', 'trinket', 900, 3, 'Diamonds are just rocks that tried harder.'],
  ['spoonlute', 'Spoon Lute', '🪕', 'trinket', 70, 1, 'Plays one note. It is a sad note.'],
  ['album', 'Album: 47 Songs About Bags', '💿', 'trinket', 380, 2, 'Hit single: "Zip Me Up, Baby".'],
  ['grogpremium', 'Watered-Down Grog (Premium)', '🍺', 'contra', 80, 1, 'Premium water content. Illegal anyway.'],
  ['treasuremap', 'Treasure Map (Drawn Yesterday)', '🗺️', 'contra', 520, 2, 'X marks the spot. The spot is your backyard.'],
  ['holybread', 'Blessed Bread (Slightly Soggy)', '🥖', 'food', 30, 1, 'Blessed by a monk. Soggy by a puddle.'],
  ['relic', 'Relic: Toenail of St. Satchel', '🦶', 'trinket', 450, 2, 'Holy. Crunchy. Do not ask.'],
  ['organicdirt', 'Organic Free-Range Dirt', '🌱', 'food', 22, 0, 'This dirt roamed free its whole life.'],
  ['turnip', 'Suspiciously Large Turnip', '🥔', 'food', 300, 2, 'Too large. Way too large. It hums.'],
  ['ratstick', 'Rat on a Stick', '🍢', 'food', 35, 1, 'Street food at its most honest.'],
  ['ratscarf', 'Luxury Rat-Fur Scarf', '🧣', 'cloth', 280, 2, '100% genuine rat. 0% regrets.'],
  ['ghostjar', 'Ghost in a Jar', '👻', 'trinket', 65, 1, 'He is very polite. He wants out.'],
  ['skelkey', 'Skeleton Key (Actual Skeleton)', '🦴', 'trinket', 400, 2, 'Opens doors. Also opens conversations.'],
  ['philopebble', "Philosopher's Pebble", '💠', 'trinket', 90, 1, "Little brother of the Philosopher's Stone."],
  ['goldlead', 'Gold-Plated Lead (Mostly Lead)', '🟨', 'trinket', 1400, 3, 'Gold on the outside. Disappointment inside.'],
  ['whoopee', 'Whoopee Cushion of Doom', '🎈', 'trinket', 40, 1, 'Cursed. Every chair is now a trap.'],
  ['jokebook', 'Joke Book (No Jokes Inside)', '📕', 'trinket', 500, 2, 'The joke is that there are no jokes.'],
  ['fireproofsocks', 'Fireproof Socks (Untested)', '🧯', 'cloth', 55, 1, 'Testing is for cowards.'],
  ['dragonboots', 'Dragon-Skin Boots (Dragon Still Inside)', '🥾', 'cloth', 1600, 3, 'Warm. Grumpy. Occasionally roars.'],
  ['hollowbread', 'Hollow Bread (Contains Bread)', '🫓', 'food', 35, 1, 'The secret compartment holds more bread.'],
  ['secretboots', 'Boots With a Secret Compartment', '👞', 'contra', 650, 2, 'For smuggling small things. Like feet.'],
  ['receipt', 'Receipt for Nothing', '🧾', 'trinket', 30, 0, 'Proof you paid for nothing. Very official.'],
  ['taxform', 'Tax Form 42-B (Laminated)', '📋', 'trinket', 700, 3, 'Nobody knows what it does. Everybody fears it.'],
  ['zombiejerky', 'Zombie Jerky (Still Twitching)', '🧟', 'food', 50, 1, 'Fresh forever. Literally.'],
  ['undeadham', 'Undead Thunder Ham', '🍖', 'food', 520, 2, 'Struck by lightning. Then got back up.'],
  ['hypepebble', 'Hype Pebble (Limited Edition)', '🔸', 'trinket', 45, 1, 'Only 10,000,000 made. Very rare.'],
  ['merch', 'Official Merch of Yourself', '🖼️', 'cloth', 1100, 3, 'Your own face, on a cape. Iconic.'],
];

// Recipes anyone can make
const BASE_RECIPES = [{ out: 'mudwater', in: ['dirt', 'water'] }];

// 20 professions. perk keys are read in game.js:
// sell:{cat:x}  all:x  steal:x  forge:x  jobs:x  karma:x  god:x  crit:x  fight:x  sneak:x  pirate:1  taxman:1  inventQ:x  invent:x  found:x  rumor:x  contract:x  street:1
const PROFESSIONS = [
  { id: 'quack', name: 'Potion Quack', e: '🧪', perk: 'Potions sell +20%', p: { sell: { potion: .2 } },
    job: { name: 'Taste-test potions', t: '🧪', bad: '☠️' },
    recipes: [{ out: 'snakeoil', in: ['dirt', 'water', 'water'] }, { out: 'megapot', in: ['mana', 'hpot'] }] },
  { id: 'smith', name: 'Village Blacksmith', e: '⚒️', perk: 'Weapons sell +20%', p: { sell: { weapon: .2 } },
    job: { name: 'Hammer horseshoes', t: '🧲', bad: '🔥' },
    recipes: [{ out: 'sporkblade', in: ['spork', 'rock'] }, { out: 'halberd', in: ['axe', 'stick'] }] },
  { id: 'cheese', name: 'Cheese Monger', e: '🧀', perk: 'Grub sells +20%', p: { sell: { food: .2 } },
    job: { name: 'Catch runaway cheese', t: '🧀', bad: '🐭' },
    recipes: [{ out: 'cheesesoup', in: ['cheese', 'water'] }, { out: 'cheesewheel', in: ['cheese', 'cheese', 'ham'] }] },
  { id: 'fashion', name: 'Fashion Wizard', e: '🎩', perk: 'Fashion sells +20%', p: { sell: { cloth: .2 } },
    job: { name: 'Fold capes dramatically', t: '👗', bad: '🦗' },
    recipes: [{ out: 'distressed', in: ['socks', 'dirt'] }, { out: 'hoodiehat', in: ['hoodie', 'hat'] }] },
  { id: 'seer', name: 'Fortune Teller', e: '🔮', perk: 'Trinkets sell +20%, +1 rumor per day', p: { sell: { trinket: .2 }, rumor: 1 },
    job: { name: 'Read palms', t: '✋', bad: '🦀' },
    recipes: [{ out: 'wetstone', in: ['rock', 'water'] }, { out: 'spoonball', in: ['ball', 'spoon'] }] },
  { id: 'thief', name: 'Pickpocket', e: '🧤', perk: 'Pickpocket zone 40% wider, loot +25%', p: { steal: .4 },
    job: { name: 'Snatch coins from the fountain', t: '🪙', bad: '💂' },
    recipes: [{ out: 'fakecoins', in: ['rock', 'dirt'] }, { out: 'lockpick', in: ['spork', 'spoon'] }] },
  { id: 'forger', name: 'Master Forger', e: '🖋️', perk: 'Relabeling is free & forged labels are 60% harder to spot', p: { forge: .6 },
    job: { name: 'Sign fake autographs', t: '✍️', bad: '👮' },
    recipes: [{ out: 'certificate', in: ['dirt', 'water'] }, { out: 'diamondring', in: ['ring', 'rock'] }] },
  { id: 'bard', name: 'Bard', e: '🎻', perk: 'Jobs pay +40%, karma gains +50%', p: { jobs: .4, karma: .5 },
    job: { name: 'Hit the right notes', t: '🎵', bad: '🍅' },
    recipes: [{ out: 'spoonlute', in: ['spoon', 'socks'] }, { out: 'album', in: ['conf', 'hat'] }] },
  { id: 'pirate', name: 'Pirate Wannabe', e: '🏴‍☠️', perk: 'Contraband sells +25%, pirates treat you as a mate', p: { sell: { contra: .25 }, pirate: 1 },
    job: { name: 'Swab the deck', t: '🫧', bad: '🦈' },
    recipes: [{ out: 'grogpremium', in: ['rum', 'water'] }, { out: 'treasuremap', in: ['scroll', 'dirt'] }] },
  { id: 'monk', name: 'Monk of the Bag', e: '🧘', perk: 'Karma gains ×2, bag gods appear twice as often', p: { karma: 1, god: 2 },
    job: { name: 'Ring the temple bells', t: '🔔', bad: '🐝' },
    recipes: [{ out: 'holybread', in: ['bread', 'water'] }, { out: 'relic', in: ['rock', 'pickle'] }] },
  { id: 'farmer', name: 'Turnip Farmer', e: '🌾', perk: 'Grub sells +10%, jobs pay +30%', p: { sell: { food: .1 }, jobs: .3 },
    job: { name: 'Pull turnips', t: '🥕', bad: '🐍' },
    recipes: [{ out: 'organicdirt', in: ['dirt', 'dirt'] }, { out: 'turnip', in: ['dirt', 'water', 'ham'] }] },
  { id: 'rat', name: 'Rat Catcher', e: '🐀', perk: 'Jobs pay +70%', p: { jobs: .7 },
    job: { name: 'Whack cellar rats', t: '🐀', bad: '🐈' },
    recipes: [{ out: 'ratstick', in: ['stick', 'jerky'] }, { out: 'ratscarf', in: ['boots', 'jerky'] }] },
  { id: 'grave', name: 'Gravedigger', e: '⚰️', perk: 'Find twice as much stuff on the road, sleep safely on the street', p: { found: 2, street: 1 },
    job: { name: 'Dig (please, just dig)', t: '🦴', bad: '🧟' },
    recipes: [{ out: 'ghostjar', in: ['water', 'spoon'] }, { out: 'skelkey', in: ['bow', 'rock'] }] },
  { id: 'alch', name: 'Alchemist', e: '⚗️', perk: 'Potions +10%, inventions are made at 4★', p: { sell: { potion: .1 }, inventQ: 4 },
    job: { name: 'Stir the cauldron', t: '🫧', bad: '💥' },
    recipes: [{ out: 'philopebble', in: ['rock', 'mana'] }, { out: 'goldlead', in: ['hammer', 'conf'] }] },
  { id: 'jester', name: 'Court Jester', e: '🃏', perk: '+5% jackpot chance', p: { crit: .05 },
    job: { name: 'Juggle for the king', t: '🤹', bad: '🗡️' },
    recipes: [{ out: 'whoopee', in: ['socks', 'water'] }, { out: 'jokebook', in: ['ball', 'pie'] }] },
  { id: 'tamer', name: 'Dragon Tamer (Allegedly)', e: '🐉', perk: '+20% to win fights', p: { fight: .2 },
    job: { name: 'Feed baby dragons', t: '🐣', bad: '🔥' },
    recipes: [{ out: 'fireproofsocks', in: ['bread', 'socks'] }, { out: 'dragonboots', in: ['dragonfruit', 'boots'] }] },
  { id: 'smuggler', name: 'Smuggler', e: '📦', perk: 'Guards are 40% less likely to catch anything', p: { sneak: .4 },
    job: { name: 'Hide crates from guards', t: '📦', bad: '💂' },
    recipes: [{ out: 'hollowbread', in: ['bread', 'rock'] }, { out: 'secretboots', in: ['scroll', 'boots'] }] },
  { id: 'taxman', name: 'Tax Collector', e: '🧾', perk: 'Tax collectors pay YOU, contracts pay +25%', p: { taxman: 1, contract: .25 },
    job: { name: 'Stamp forms', t: '📄', bad: '🔥' },
    recipes: [{ out: 'receipt', in: ['dirt', 'water'] }, { out: 'taxform', in: ['cape', 'spoon'] }] },
  { id: 'necro', name: 'Necromancer', e: '💀', perk: 'Inventions sell +25%', p: { invent: .25 },
    job: { name: 'Raise (and lower) skeletons', t: '💀', bad: '😇' },
    recipes: [{ out: 'zombiejerky', in: ['jerky', 'water'] }, { out: 'undeadham', in: ['ham', 'ball'] }] },
  { id: 'influencer', name: 'Town Crier Influencer', e: '📣', perk: 'Everything sells +5%, inventions +30%', p: { all: .05, invent: .3 },
    job: { name: 'Shout news in the square', t: '📣', bad: '🥚' },
    recipes: [{ out: 'hypepebble', in: ['rock', 'dirt'] }, { out: 'merch', in: ['hat', 'cape'] }] },
];

// Multi-day world events. towns: null = everywhere
const WORLD_EVENTS = [
  { id: 'war', name: 'WAR with the Goblin Kingdom', e: '⚔️', cats: { weapon: 2.3, cloth: 1.4, trinket: .75 }, days: [4, 7], towns: null, news: 'Swords are flying off the shelves. Literally.' },
  { id: 'cold', name: 'The Great Cold', e: '❄️', cats: { cloth: 2.2, food: 1.5, potion: 1.2 }, days: [4, 6], towns: null, news: 'Everyone needs coats, soup and something warm.' },
  { id: 'plague', name: 'Plague of Sniffles', e: '🤧', cats: { potion: 2.4, food: .8 }, days: [3, 6], towns: null, news: 'Achoo! Potions are worth their weight in gold.' },
  { id: 'wedding', name: 'Royal Wedding', e: '💒', cats: { trinket: 2.2, cloth: 1.7, food: 1.3 }, days: [3, 5], towns: ['silver', 'moon', 'bazaar'], news: 'Nobles want rings, gowns and cake.' },
  { id: 'famine', name: 'Famine', e: '🌾', cats: { food: 2.6, trinket: .7 }, days: [4, 7], towns: null, news: 'Crops failed. Bread is the new gold.' },
  { id: 'beerfest', name: 'Dwarven Beer Festival', e: '🍺', cats: { food: 2, potion: 2 }, days: [2, 4], towns: ['iron'], news: 'Ironbelly is thirsty AND hungry.' },
  { id: 'blockade', name: 'Imperial Blockade', e: '⚓', cats: { contra: 2.3 }, days: [3, 6], towns: null, news: 'Nothing gets in. Smuggled goods are priceless.' },
  { id: 'dragon', name: 'Dragon Sighting', e: '🐉', cats: { weapon: 1.7, potion: 1.6, cloth: 1.3 }, days: [3, 5], towns: null, news: 'Everyone suddenly wants swords and fire potions.' },
  { id: 'fashionweek', name: 'Elven Fashion Week', e: '👗', cats: { cloth: 2.5 }, days: [2, 4], towns: ['moon', 'silver'], news: 'Capes. Hats. Socks. All of it.' },
  { id: 'goldrush', name: 'Gold Rush', e: '⛏️', cats: { food: 1.5, weapon: 1.5, cloth: 1.5, potion: 1.5, trinket: 1.5 }, days: [3, 5], towns: ['iron'], news: 'Dwarves struck gold and are buying EVERYTHING.' },
  { id: 'magiccrash', name: 'Great Magic Crash', e: '💥', cats: { potion: .45, trinket: .6 }, days: [3, 5], towns: null, news: 'Magic stopped working. Potions and trinkets crash. Hold!' },
  { id: 'goblins', name: 'Goblin Invasion', e: '👺', cats: { weapon: 1.9, food: 1.3 }, days: [3, 5], towns: ['mud', 'grogg', 'iron'], news: 'Goblins at the gates! Arm the farmers!' },
  { id: 'heatwave', name: 'Heatwave', e: '🥵', cats: { potion: 1.8, cloth: .6 }, days: [3, 5], towns: null, news: 'Too hot for capes. Drinks sell like crazy.' },
  { id: 'bagfest', name: 'Festival of Bags', e: '🎪', cats: { food: 1.4, trinket: 1.4, cloth: 1.4, potion: 1.4, weapon: 1.4 }, days: [2, 3], towns: null, news: 'A holiday for bags! Everyone is shopping.' },
];

const RIDDLES = [
  { q: 'What has a mouth, a zipper, and eats everything you own?', a: ['A bag', 'A dragon', 'My cousin Gerald'], ok: 0 },
  { q: 'The more you take, the more you leave behind. What am I?', a: ['Footsteps', 'Taxes', 'Cheese'], ok: 0 },
  { q: 'What gets wetter the more it dries?', a: ['A towel', 'Puddle Water', 'My eyes after this riddle'], ok: 0 },
  { q: 'What has keys but opens no locks?', a: ['A piano', 'A Lockpick of Mild Success', 'A goblin'], ok: 0 },
  { q: 'What has one eye but cannot see?', a: ['A needle', 'One-Eyed Gertrude', 'A potato'], ok: 0 },
];

const PICK_TARGETS = [
  { id: 'peasant', name: 'Sleepy Peasant', e: '👨‍🌾', zone: .3, speed: .9, loot: [3, 10], karma: -4, heat: 8, item: 0 },
  { id: 'merchant', name: 'Chubby Merchant', e: '🧔', zone: .18, speed: 1.4, loot: [15, 40], karma: -2, heat: 12, item: .3 },
  { id: 'noble', name: 'Snooty Noble', e: '🤴', zone: .11, speed: 2, loot: [60, 150], karma: -1, heat: 18, item: .35 },
  { id: 'guard', name: 'Off-Duty Guard', e: '💂', zone: .07, speed: 2.7, loot: [220, 520], karma: 0, heat: 30, item: .2 },
];
