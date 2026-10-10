// Sadbot's Journey To Bliss — stage data. Each stage is plain data the engine builds at load.
// ground: [x0, x1, y?, quick?]  water: [x0, x1, y]  plats: [x, y, w, kind, {move:[ax, ay, period, phase], crumble}]
// caves: [x0, x1, ceilingY, darkness]  enemies: [type, ...]  traps: [type, ...]
// npcs: { id, kind, x, look?, auto?, prompt?, needs?: 'boss'|'chase', dialog, on?: [actions], hideOnEnd? }
// actions: 'ally:dog|milo|pip', 'part:...', 'pulse', 'cp:N', 'heal', 'clear', 'ending'
(() => {
  'use strict';
  const SB = window.SB;
  const GY = SB.GY;

  SB.STAGES = [
    // ------------------------------------------------------------------ 1
    {
      id: 'ashfield', name: 'Ashfield', biome: 'city', seed: 7, worldW: 7400,
      weather: { type: 'ash' },
      card: ['Kevin\'s street. Kevin\'s school.', 'Find Kevin. Follow the road east.'],
      ground: [[0, 1500], [1620, 2350], [2470, 3900], [4020, 4300], [4440, 7400]],
      plats: [
        [880, 418, 130, 'car'], [1240, 422, 120, 'car'], [1525, 395, 70, 'slab'], [1790, 380, 110, 'slab'], [1950, 318, 110, 'slab'],
        [2140, 420, 130, 'car'], [2380, 392, 62, 'slab'], [3140, 384, 150, 'beam'], [3370, 316, 140, 'beam'], [3590, 250, 230, 'beam'],
        [3870, 330, 110, 'beam'], [4060, 398, 120, 'slab'], [4335, 384, 70, 'slab'], [4540, 360, 140, 'beam'], [4750, 298, 150, 'beam'],
        [4970, 380, 120, 'car'], [5760, 340, 110, 'slab'], [6250, 340, 110, 'slab'],
      ],
      enemies: [
        ['drone', 1120, 340, 110], ['drone', 1880, 250, 90], ['drone', 2260, 330, 100], ['drone', 3480, 220, 110], ['drone', 4160, 300, 90],
        ['drone', 4860, 230, 100], ['drone', 5120, 330, 120], ['hound', 1700, 2330], ['hound', 3000, 3560], ['hound', 4460, 4960], ['hound', 5230, 5540],
      ],
      traps: [['cable', 3262, 76, 0], ['cable', 4608, 76, 75]],
      gears: [[600, 425, 4], [905, 382, 4], [1534, 360, 2], [1802, 345, 3], [2600, 425, 5], [3160, 350, 4], [3392, 282, 4], [3620, 215, 6], [4072, 364, 3], [4562, 326, 4], [4995, 346, 3], [5300, 425, 5], [6650, 425, 5]],
      batteries: [[2205, 382], [4120, 362], [5460, 425]],
      memories: [[2005, 282], [3800, 214], [4825, 258]],
      memoryText: [
        'MEMORY 01 · Kevin, age 4\n"When I grow up, you can be the dad, Toby. And I\'ll be the robot."',
        'MEMORY 02 · Kevin, age 9, the night of the storm\n"Mom and Dad are working late again. You stay, okay? You always stay."',
        'MEMORY 03 · Kevin, age 12\n"If anything ever happens, meet me where the drawings are."',
      ],
      checkpoints: [[2780, 'Mara\'s fire', 'fire', 'mara'], [5480, 'School fence', 'flag']],
      npcs: [
        { id: 'crow1', kind: 'crow', x: 440, y: 356, auto: true, dialog: [
          { who: 'ASH', text: 'Caw. Caw! The tin heart walks again.' },
          { who: 'TOBY', text: 'Have you seen Kevin? Small human. Red cap. Thirteen years old.' },
          { who: 'ASH', text: 'Seen many small humans run. Few come back. Go east, tin heart. Follow the road the sun climbs out of.' },
          { who: 'ASH', text: 'The rust-birds shoot. The rust-dogs bite. Land on their heads. They hate that. Caw!' },
          { who: 'HINT', text: 'Walk: ← → or A D.  Jump: Space (hold to jump higher).  Jump on enemies to break them.', touch: 'Walk: slide your thumb on ◀ ▶.  Jump: JUMP (hold to jump higher).  Jump on enemies to break them.' },
        ] },
        { id: 'mara', kind: 'mara', x: 2850, prompt: 'Talk', on: ['pulse', 'heal', 'cp:0'], dialog: [
          { who: 'MARA', text: 'Easy, little machine. I\'ve seen enough of your kind turn mean.' },
          { who: 'TOBY', text: 'I am SM-3-15. Toby. I am looking for Kevin Reyes.' },
          { who: 'MARA', text: 'Reyes... the boy who drew robots on every wall on this street? He gave me bread once. Bread, in this world.' },
          { who: 'MARA', text: 'When the sirens went, the children ran to Elm Street School. One of those Warden machines circles it now.' },
          { who: 'MARA', text: 'Your chest core is cracked. Hold still... there. That heart of yours can push back now.' },
          { who: 'HINT', text: 'HEART PULSE unlocked. Press X or J for a shockwave that breaks drones and their shots. The fire saves your progress.', touch: 'HEART PULSE unlocked. Tap PULSE for a shockwave that breaks drones and their shots. The fire saves your progress.' },
          { who: 'MARA', text: 'Go on. And if you find him, tell him old Mara still owes him bread.' },
        ], repeat: [{ who: 'MARA', text: 'Elm Street School is east, past the old overpass. Keep that heart warm, Toby.' }] },
        { id: 'crow2', kind: 'crow', x: 5348, y: 294, prompt: 'Talk', dialog: [
          { who: 'ASH', text: 'Caw. The big metal-bird nests on the school. It drops out of the sky when it hunts.' },
          { who: 'ASH', text: 'When it hits the ground it is dizzy. Jump on its head then. Your heart-push hurts it too.' },
        ] },
        { id: 'backpack', kind: 'backpack', x: 6935, prompt: 'Search', needs: 'boss', on: ['clear'], dialog: [
          { who: 'TOBY', text: 'Kevin\'s backpack. The KEVIN + TOBY patch I sewed on in third grade.' },
          { who: 'NOTE', text: '"If Toby wakes up: I\'m okay. Ms. Alvarez is taking us to the Harbor shelter. The water bus leaves from the Drowned Highway. Come find me. — K."' },
          { who: 'TOBY', text: 'The last time I saw him, he was going to school.', vo: 3 },
          { who: 'TOBY', text: 'I am going to find him.', vo: 4 },
        ] },
      ],
      boss: { type: 'warden', x: 6060, arena: [5580, 6540], name: 'WARDEN-7', sub: 'School sentinel. Still following orders.', hp: 10, tag: 'W-7' },
      decor: [['house', 0], ['lamppost', 440], ['sign', 5300, 'ELM STREET', 'SCHOOL'], ['school', 6180]],
      clearLine: 'Kevin\'s trail leads to the Harbor',
    },

    // ------------------------------------------------------------------ 2
    {
      id: 'highway', name: 'The Drowned Highway', biome: 'flood', seed: 31, worldW: 7600, flow: 1,
      weather: { type: 'storm', wind: { dir: -1, str: 0.8, period: 620, dur: 180 } },
      strikes: { from: 1750, every: 300 },
      card: ['The road to the Harbor runs under water now.', 'The storm never really stopped.'],
      ground: [[0, 1300], [1640, 3000], [3500, 5000], [5240, 7600]],
      water: [[1300, 1640, 476], [3000, 3500, 476], [5000, 5240, 476]],
      plats: [
        [1340, 438, 90, 'roof', { move: [0, 5, 120, 0] }], [1470, 434, 90, 'roof', { move: [40, 4, 220, 0] }],
        [1900, 418, 130, 'car'], [2400, 395, 80, 'slab'], [2540, 330, 170, 'beam'],
        [3040, 430, 80, 'roof', { crumble: true }], [3165, 422, 80, 'roof', { crumble: true }], [3290, 430, 80, 'roof', { crumble: true }], [3410, 426, 70, 'roof', { crumble: true }],
        [3800, 380, 120, 'beam'], [3960, 312, 120, 'beam'], [4140, 258, 200, 'beam'], [4400, 340, 120, 'beam'], [4600, 420, 120, 'car'],
        [5040, 438, 80, 'roof', { move: [0, 5, 110, 0] }], [5150, 432, 80, 'roof', { move: [30, 4, 200, 40] }],
        [5820, 350, 100, 'slab'], [6300, 350, 100, 'slab'],
      ],
      enemies: [
        ['scav', 1750, 2050], ['scav', 2150, 2400], ['bomber', 2620, 330], ['drone', 2880, 300, 100], ['scav', 3600, 3900],
        ['drone', 3720, 250, 90], ['bomber', 4290, 258], ['scav', 4480, 4950], ['drone', 4800, 280, 120], ['scav', 5340, 5560],
      ],
      traps: [
        ['mine', 2150], ['mine', 2330, true], ['barrel', 2480], ['mine', 2760], ['barrel', 3700],
        ['mine', 4470, true], ['mine', 4560, true], ['mine', 4700], ['mine', 4780, true], ['barrel', 5900], ['barrel', 6300],
      ],
      gears: [[600, 425, 4], [1365, 400, 2], [1925, 382, 4], [2560, 295, 5], [3060, 395, 1], [3190, 388, 1], [3310, 395, 1], [3830, 345, 3], [3990, 277, 3], [4610, 385, 4], [5300, 425, 5], [6700, 425, 5]],
      batteries: [[2240, 425], [4430, 305], [5440, 425]],
      memories: [[1480, 384], [4250, 222], [3330, 386]],
      memoryText: [
        'MEMORY 04 · Kevin, age 6, the first big rain\n"Toby, can robots go in puddles? ...Then jump with me!"',
        'MEMORY 05 · Kevin, age 8\n"Dad says you\'re a Helix product. I told him you\'re a Toby product."',
        'MEMORY 06 · Kevin, age 10, his birthday\n"Mom called. She said sorry again. It\'s okay. You remembered."',
      ],
      checkpoints: [[1700, 'Highway bend', 'flag'], [3560, 'Spillway', 'flag'], [5290, 'Harbor docks', 'flag']],
      npcs: [
        { id: 'biscuit', kind: 'dog', x: 560, auto: true, hideOnEnd: true, on: ['ally:dog'], dialog: [
          { who: 'BISCUIT', text: 'Wuff!', sfx: 'bark' },
          { who: 'TOBY', text: 'Hello, dog. You are wet. I am also wet.' },
          { who: 'TOBY', text: 'Kevin always wanted a dog. His parents said they were too busy.' },
          { who: 'BISCUIT', text: 'Wuff wuff!', sfx: 'bark' },
          { who: 'HINT', text: 'BISCUIT joined you. He sniffs out buried mines and bites scavengers. Allies can\'t be hurt.' },
        ] },
        { id: 'rust', kind: 'none', x: 1690, auto: true, dialog: [
          { who: 'HINT', text: 'Rustbucket scavengers strip robots for parts. Jump on them, or pulse them. Red barrels explode: pulse one from a step away when enemies are close.' },
          { who: 'HINT', text: 'Lightning strikes where the ground glows. Keep moving. Gusts of wind push you back.' },
        ] },
        { id: 'ines', kind: 'human', look: 'ines', x: 7060, prompt: 'Talk', needs: 'boss', on: ['part:dog', 'clear'], dialog: [
          { who: 'INES', text: 'A robot and a dog, in this weather. Get under the canopy, both of you.' },
          { who: 'TOBY', text: 'I am looking for Kevin Reyes. His teacher, Ms. Alvarez, was taking the children to the Harbor shelter.' },
          { who: 'INES', text: 'She made it. Twelve kids, soaked to the bone. But the Rustbuckets raided the shelter a week later.' },
          { who: 'INES', text: 'Alvarez took them underground. The old metro runs under the whole city, out to the desert side.' },
          { who: 'INES', text: 'Past the desert, past the mountains. She said Helix had a refuge up there.' },
          { who: 'TOBY', text: 'Helix Dynamics. Kevin\'s parents worked there.' },
          { who: 'INES', text: 'Then maybe someone\'s waiting for him. ...Leave the dog with me. Tunnels are no place for him.' },
          { who: 'BISCUIT', text: '...wuff.', sfx: 'bark' },
          { who: 'TOBY', text: 'Goodbye, Biscuit. Keep Ines dry.' },
        ] },
      ],
      boss: { type: 'chief', x: 6250, arena: [5600, 6560], name: 'BIG WRENCH', sub: 'Rustbucket chief. Collects robots.', hp: 12 },
      decor: [['bus', 760], ['doodle', 810, 395, 1], ['sign', 3530, 'SPILLWAY', 'NO SWIMMING'], ['sign', 6640, 'HARBOR', 'SHELTER ›'], ['ferry', 6880]],
      clearLine: 'The children went underground',
    },

    // ------------------------------------------------------------------ 3
    {
      id: 'tunnels', name: 'The Undertunnels', biome: 'tunnel', seed: 53, worldW: 7000,
      weather: { type: 'drip' },
      card: ['Ms. Alvarez took the children underground.', 'The old metro runs beneath the whole city.'],
      ground: [[0, 1100], [1220, 2400], [2600, 4200], [4320, 7000]],
      water: [[2400, 2600, 478]],
      caves: [[0, 7000, 250, 0.94]],
      lamps: [[400], [2000, 1], [3300], [3900, 1], [5100, 1], [6000]],
      plats: [
        [900, 400, 60, 'crate'], [1140, 418, 50, 'slab'], [1600, 380, 120, 'metal'], [1790, 335, 110, 'metal'],
        [2440, 420, 90, 'metal', { move: [50, 0, 240, 0] }], [2700, 400, 60, 'crate'], [2950, 330, 140, 'metal'], [3300, 380, 100, 'metal'],
        [4235, 418, 50, 'slab', { crumble: true }], [4700, 380, 70, 'crate'], [5900, 420, 50, 'crate'], [6200, 400, 80, 'slab'], [6500, 420, 50, 'crate'],
      ],
      enemies: [
        ['rat', 1300, 1700], ['rat', 1350, 1750], ['rat', 1400, 1690], ['scav', 2000, 2350, 'miner'], ['drone', 2800, 330, 100],
        ['rat', 3000, 3500], ['rat', 3050, 3450], ['rat', 3100, 3550], ['scav', 3600, 4100, 'miner'], ['scav', 4450, 4680, 'miner'],
        ['bomber', 4735, 380, 'miner'], ['drone', 5000, 330, 120],
      ],
      traps: [
        ['trip', 1500], ['barrel', 1700], ['rock', 2100, 170, 0], ['trip', 2880], ['barrel', 3250], ['rock', 3420, 150, 40],
        ['trip', 3700], ['barrel', 4600], ['rock', 4850, 140, 20], ['trip', 5050],
      ],
      gears: [[600, 425, 4], [1150, 385, 2], [1630, 345, 4], [2460, 385, 3], [2980, 300, 3], [3330, 345, 3], [4000, 425, 4], [4560, 425, 3], [5800, 425, 4], [6230, 365, 3]],
      batteries: [[2200, 425], [4250, 380], [5400, 425]],
      memories: [[1845, 300], [3060, 300], [4745, 340]],
      memoryText: [
        'MEMORY 07 · Kevin, age 7, during a blackout\n"The dark is fine if your eyes glow, Toby. Leave them on, okay?"',
        'MEMORY 08 · Kevin, age 11, on the subway\n"Milo says robots can\'t be friends. I told him he hasn\'t met you."',
        'MEMORY 09 · Kevin, age 12, after the sirens\n"Stay in the house, Toby. Charge up. I\'ll come back for you. I promise."',
      ],
      checkpoints: [[1250, 'Platform 2', 'lamp'], [2660, 'Sewer junction', 'lamp'], [4380, 'East line', 'lamp']],
      npcs: [
        { id: 'milo', kind: 'human', look: 'milo', x: 1300, auto: true, hideOnEnd: true, on: ['ally:milo'], dialog: [
          { who: 'MILO', text: 'Whoa, whoa! Don\'t zap me! I\'m not a Rustbucket!' },
          { who: 'TOBY', text: 'I am Toby. I am looking for Kevin Reyes.' },
          { who: 'MILO', text: 'Kevin? Kevin with the robot drawings? He talked about you, like, every day. You\'re REAL.' },
          { who: 'MILO', text: 'I\'m Milo. My parents worked at Helix too. They never came home after the Collapse.' },
          { who: 'MILO', text: 'Kevin\'s class came through here with Ms. Alvarez. I\'m going the same way. Mom\'s badge might still open Helix doors.' },
          { who: 'HINT', text: 'MILO joined you. He fires his slingshot at enemies and lights the way with his flashlight.' },
          { who: 'MILO', text: 'Watch the floor for red wires. The Rustbuckets rig these tunnels with charges. Jump over them.' },
        ] },
        { id: 'tom', kind: 'cat', x: 3880, prompt: 'Talk', dialog: [
          { who: 'OLD TOM', text: 'Mrrrow. You smell of rust and rain.', sfx: 'meow' },
          { who: 'OLD TOM', text: 'I am blind, little tin can, but my nose is not. Chalk and crayons passed this way. And many small feet.' },
          { who: 'OLD TOM', text: 'They went up the east ladder, to the sand. Hurry. These tunnels are tired of holding up the city.' },
        ] },
        { id: 'exit', kind: 'ladder', x: 6935, prompt: 'Climb', needs: 'chase', on: ['part:milo', 'clear'], dialog: [
          { who: 'MILO', text: 'Daylight! ...Oh. That\'s a lot of sand.' },
          { who: 'MILO', text: 'Listen. My parents\' notes mention a ranger station in Whisperwood, past the desert. I\'m going to find it while you track Kevin.' },
          { who: 'TOBY', text: 'Splitting up reduces survival odds by 34 percent.' },
          { who: 'MILO', text: 'Then we meet at Whisperwood. Promise?' },
          { who: 'TOBY', text: 'I am very good at promises.' },
        ] },
      ],
      chase: { trigger: 5600, start: 4900, speed: 2.55, end: 6780, kind: 'collapse' },
      decor: [['sign', 260, 'CENTRAL', 'STATION'], ['doodle', 1360, 330, 0], ['doodle', 3980, 330, 2], ['sign', 6640, 'EAST EXIT', 'LADDER ↑']],
      clearLine: 'Out of the dark, into the sand',
    },

    // ------------------------------------------------------------------ 4
    {
      id: 'desert', name: 'The Glass Desert', biome: 'desert', seed: 71, worldW: 7600,
      weather: { type: 'sand', wind: { dir: -1, str: 1.3, period: 520, dur: 200 }, haze: 0.1 },
      card: ['Past the city, the world turns to sand.', 'The wind out here never asks permission.'],
      ground: [[0, 1400], [1400, 1700, 432], [1700, 2100, GY, [[1760, 1960]]], [2220, 2900, 450], [2900, 4400], [4400, 4800, 440], [4800, 5200, 420, [[4860, 5080]]], [5200, 7600]],
      caves: [[3000, 4300, 240, 0.9]],
      lamps: [[3500], [3950, 1], [4250]],
      plats: [
        [1150, 400, 90, 'rock'], [2450, 370, 130, 'rock'], [2650, 320, 100, 'rock'], [3250, 400, 60, 'crate'], [3500, 380, 110, 'metal'],
        [3700, 330, 120, 'metal'], [4000, 400, 60, 'crate'], [4600, 360, 100, 'rock'], [6180, 360, 100, 'rock'], [6700, 360, 100, 'rock'],
      ],
      enemies: [
        ['scav', 1000, 1350, 'raider'], ['drone', 1600, 300, 110], ['scav', 2300, 2850, 'raider'], ['bomber', 2510, 370, 'raider'],
        ['hound', 3150, 3500], ['scav', 3750, 4250, 'raider'], ['drone', 4600, 270, 110], ['bomber', 5150, 420, 'raider'], ['scav', 5250, 5700, 'raider'], ['drone', 5400, 300, 100],
      ],
      traps: [
        ['mine', 1250, true], ['mine', 1550, true], ['mine', 2600, true], ['mine', 2780], ['trip', 3350], ['barrel', 3440], ['trip', 3900], ['barrel', 4120],
        ['mine', 4480, true], ['mine', 4700, true], ['mine', 5330, true], ['mine', 5600, true],
      ],
      gears: [[700, 425, 4], [1160, 365, 3], [1450, 397, 4], [2300, 415, 4], [2470, 335, 4], [3300, 425, 4], [3520, 345, 4], [3720, 295, 3], [5300, 425, 5], [7100, 425, 5]],
      batteries: [[2050, 425], [3640, 425], [5900, 425]],
      memories: [[2700, 285], [3780, 292], [4650, 322]],
      memoryText: [
        'MEMORY 10 · Kevin, age 5, at the beach\n"Sand gets in your joints? Then I\'ll carry you, Toby."',
        'MEMORY 11 · Kevin, age 9\n"I drew a map of everywhere we\'re gonna go. Desert. Forest. Mountains. Together."',
        'MEMORY 12 · Kevin, age 12\n"Mom said Helix made something it can\'t take back. She was crying, Toby."',
      ],
      checkpoints: [[880, 'Sol\'s camp', 'fire'], [3060, 'Bunker', 'lamp'], [4440, 'Dune ridge', 'flag'], [5900, 'Glass flats', 'flag']],
      npcs: [
        { id: 'sol', kind: 'human', look: 'sol', x: 960, prompt: 'Talk', dialog: [
          { who: 'SOL', text: 'Ho there, tin walker. Sit by the fire. Water\'s free. Stories cost extra.' },
          { who: 'TOBY', text: 'I am looking for Kevin Reyes. Thirteen. Red cap.' },
          { who: 'SOL', text: 'A teacher and her ducklings passed my camp nine days ago. Thin, but walking. Heading for the green line on the horizon. Whisperwood.' },
          { who: 'SOL', text: 'When the wind howls, plant your feet. And the Rustbuckets bury mines in the dunes. You won\'t see them until it\'s too late.' },
          { who: 'SOL', text: 'There\'s an old army bunker east of here that runs under the worst of it. Might find a friend down there.' },
        ] },
        { id: 'sable', kind: 'fox', x: 2960, prompt: 'Talk', dialog: [
          { who: 'SABLE', text: 'Yip! Yip!' },
          { who: 'TOBY', text: 'A small fox with very large ears.' },
          { who: 'SABLE', text: '*scratch scratch* Yip! (The fox paws at a hatch half-buried in the sand, then looks at you, then at the hatch.)' },
          { who: 'TOBY', text: 'You want me to go down there. Understood.' },
        ] },
        { id: 'pip', kind: 'pip', x: 3640, auto: true, hideOnEnd: true, on: ['ally:pip'], dialog: [
          { who: 'PIP', text: 'BZZT. Unit... friendly? Scanning... You have a heart engraved on your chest. Weird. Cool.' },
          { who: 'TOBY', text: 'I am Toby. You are a Helix seeker drone. But your eye is green, not red.' },
          { who: 'PIP', text: 'Someone pulled my war chip. Now I\'m just Pip. I scan, I zap, I don\'t do orders.' },
          { who: 'HINT', text: 'PIP joined you. Pip zaps nearby enemies and scans for buried mines.' },
        ] },
        { id: 'edge', kind: 'none', x: 7280, prompt: 'Look', needs: 'boss', on: ['part:pip', 'clear'], dialog: [
          { who: 'PIP', text: 'Battery... low. Pip stays in the shade. Pip guards the fox.' },
          { who: 'TOBY', text: 'Thank you, Pip.' },
          { who: 'PIP', text: 'Find your human. Humans are... BZZT... worth it.' },
          { who: 'TOBY', text: 'Whisperwood. Milo is waiting.' },
        ] },
      ],
      boss: { type: 'warden', x: 6480, arena: [6000, 6960], name: 'DUST WARDEN', sub: 'It has guarded an empty desert for years.', hp: 12, tint: '#8a6a4a', tag: 'W-2', fast: true },
      decor: [['plane', 230], ['tent', 830], ['cactus', 1320], ['bones', 1980], ['cactus', 2350], ['hatch', 2990], ['doodle', 3580, 330, 1], ['cactus', 4950],
        ['sign', 7200, 'WHISPERWOOD', '12 KM ›', { bg: '#6b5a40', ink: '#e9e1d3', edge: '#3a2a1c' }]],
      clearLine: 'The green line on the horizon',
    },

    // ------------------------------------------------------------------ 5
    {
      id: 'forest', name: 'Whisperwood', biome: 'forest', seed: 97, worldW: 7600, flow: 1,
      weather: { type: 'fog' },
      card: ['Green again, after so much grey.', 'The forest is quiet. Too quiet, Milo would say.'],
      ground: [[0, 1500], [1900, 4200], [4650, 7600]],
      water: [[1500, 1900, 476], [4200, 4650, 476]],
      plats: [
        [1540, 440, 80, 'log', { move: [0, 4, 120, 0] }], [1660, 434, 90, 'log', { move: [45, 3, 240, 0] }], [1800, 440, 70, 'log', { move: [0, 4, 100, 30] }],
        [2300, 370, 120, 'branch'], [2480, 300, 120, 'branch'], [3700, 370, 110, 'branch'],
        [4232, 432, 64, 'rock', { crumble: true }], [4322, 424, 64, 'rock', { crumble: true }], [4412, 430, 64, 'rock', { crumble: true }], [4500, 438, 80, 'log', { move: [30, 4, 200, 0] }],
        [5200, 380, 120, 'branch'], [5400, 315, 120, 'branch'], [6200, 360, 110, 'branch'], [6650, 360, 110, 'branch'],
      ],
      enemies: [
        ['wolf', 1080, 1480], ['wolf', 2000, 2600], ['scav', 2700, 3000, 'poacher'], ['drone', 3150, 300, 100], ['bomber', 3750, 370, 'poacher'],
        ['wolf', 3800, 4150], ['wolf', 4750, 5150], ['scav', 5300, 5800, 'poacher'],
      ],
      traps: [['bear', 1150], ['bear', 2150], ['bear', 2650], ['barrel', 2900], ['bear', 3950], ['bear', 5050], ['barrel', 5560], ['bear', 5680]],
      gears: [[500, 425, 4], [1560, 405, 2], [2320, 335, 4], [2500, 265, 2], [3300, 425, 4], [4262, 397, 1], [4352, 389, 1], [4442, 395, 1], [5220, 345, 4], [5640, 425, 4], [7100, 425, 5]],
      batteries: [[2950, 425], [4700, 425], [5950, 425]],
      memories: [[2580, 262], [5460, 277], [1745, 384]],
      memoryText: [
        'MEMORY 13 · Kevin, age 8, camping in the backyard\n"Real campers have a robot guard. You\'re on watch, Toby."',
        'MEMORY 14 · Kevin, age 11\n"Milo\'s okay. He laughed at my elephant drawing, but in a nice way."',
        'MEMORY 15 · Kevin, age 12\n"If I get lost, I\'ll leave drawings. You\'ll know they\'re mine."',
      ],
      checkpoints: [[760, 'Ranger station', 'fire'], [1960, 'Riverbank', 'flag'], [3250, 'Old clearing', 'flag'], [4700, 'Far bank', 'flag'], [5920, 'Wolf hollow', 'flag']],
      npcs: [
        { id: 'milo5', kind: 'human', look: 'milo', x: 840, auto: true, hideOnEnd: true, on: ['ally:milo'], dialog: [
          { who: 'MILO', text: 'Toby! You kept your promise!' },
          { who: 'MILO', text: 'The ranger station had a radio log. A Helix refuge signal, still broadcasting from the campus past the Spine.' },
          { who: 'MILO', text: 'The Spine\'s the mountain range. Kevin\'s group must be heading there.' },
          { who: 'HINT', text: 'MILO rejoined you.' },
          { who: 'MILO', text: 'Careful. Poachers hide bear traps in the leaves. And the wolves here are big.' },
        ] },
        { id: 'matriarch', kind: 'elephant', x: 3380, prompt: 'Talk', dialog: [
          { who: 'MATRIARCH', text: 'Little machine. I remember machines. They fed me at the zoo, once.', sfx: 'trumpet' },
          { who: 'MATRIARCH', text: 'The small humans crossed the river three days ago. One wore a red hat. He drew me. On paper. I liked that.' },
          { who: 'MILO', text: 'That\'s Kevin! He draws everything!' },
          { who: 'MATRIARCH', text: 'They climbed toward the cold mountain. The grey wolf hunts this side of the river. Walk softly.' },
        ] },
        { id: 'trail', kind: 'none', x: 7280, prompt: 'Look', needs: 'boss', on: ['clear'], dialog: [
          { who: 'MILO', text: 'The trail up the Spine. It\'s already snowing up there.' },
          { who: 'TOBY', text: 'My joints are rated to minus twenty degrees.' },
          { who: 'MILO', text: 'And how cold is it up there?' },
          { who: 'TOBY', text: 'Minus thirty.' },
          { who: 'MILO', text: '...Great.' },
        ] },
      ],
      boss: { type: 'alpha', x: 6650, arena: [6000, 6960], name: 'GREYMANE', sub: 'The pack follows him. So does the hunger.', hp: 10 },
      decor: [['ranger', 540], ['doodle', 600, 382, 0], ['bigtree', 1220], ['bigtree', 2820], ['bigtree', 4920], ['sign', 7220, 'SPINE TRAIL', '↑ 2400 M', { bg: '#5a4a36', ink: '#e9e1d3', edge: '#2f2418' }]],
      clearLine: 'Up into the snow',
    },

    // ------------------------------------------------------------------ 6
    {
      id: 'spine', name: 'The Spine', biome: 'mountain', seed: 113, worldW: 7800, slippery: true,
      weather: { type: 'snow', wind: { dir: -1, str: 1.6, period: 480, dur: 200 }, haze: 0.06 },
      card: ['The Spine. The last wall between Toby and the Helix campus.', 'Up here, the cold is an enemy too.'],
      allies: ['milo'],
      ground: [[0, 900], [900, 1350, 420], [1470, 2000, 400], [2000, 2550, 370], [2550, 3900, 400], [3900, 4300, 430], [4600, 5100, 420], [5100, 5600, 400], [5600, 6300, 440], [6420, 7000, 440], [7120, 7800, 440]],
      water: [[4300, 4600, 452]],
      caves: [[2600, 3800, 230, 0.8]],
      lamps: [[2700], [3150, 1], [3600]],
      plats: [
        [1100, 360, 100, 'ice'], [1700, 330, 110, 'rock'], [2900, 330, 110, 'ice'], [3300, 330, 110, 'ice'],
        [4335, 428, 60, 'ice', { crumble: true }], [4430, 422, 60, 'ice', { crumble: true }], [4520, 428, 60, 'ice', { crumble: true }],
        [5250, 330, 100, 'rock'], [6000, 400, 80, 'rock'], [6750, 400, 80, 'rock'],
      ],
      enemies: [
        ['drone', 1000, 320, 100], ['scav', 1500, 1950, 'mountain'], ['bomber', 1755, 330, 'mountain'], ['wolf', 2050, 2500],
        ['drone', 3200, 300, 100], ['wolf', 3950, 4280], ['scav', 4650, 5050, 'mountain'], ['drone', 5300, 260, 100],
      ],
      traps: [['ice', 2800], ['ice', 3050], ['ice', 3200], ['ice', 3450], ['ice', 3620], ['rock', 3100, 170, 0]],
      gears: [[600, 425, 4], [1000, 385, 3], [1550, 365, 4], [2100, 335, 4], [2920, 295, 4], [3500, 365, 4], [4000, 395, 3], [4700, 385, 4], [5150, 365, 3], [5900, 405, 4], [6600, 405, 4], [7300, 405, 4]],
      batteries: [[2300, 335], [4900, 385], [5500, 365]],
      memories: [[1150, 322], [3350, 292], [5300, 292]],
      memoryText: [
        'MEMORY 16 · Kevin, age 6, the first snow\n"Your eyes fog up! You look like a snowman robot!"',
        'MEMORY 17 · Kevin, age 10\n"Dad showed me the Helix building. He said what they make there will change everything."',
        'MEMORY 18 · Kevin, age 12\n"Whatever happens, Toby, you\'re not a product. You\'re family."',
      ],
      checkpoints: [[860, 'Trailhead', 'flag'], [2580, 'Ice cave', 'lamp'], [4700, 'Anselm\'s hut', 'fire'], [5560, 'The pass', 'flag']],
      npcs: [
        { id: 'skipper', kind: 'goat', x: 2420, prompt: 'Talk', dialog: [
          { who: 'SKIPPER', text: 'Meeeh.' },
          { who: 'TOBY', text: 'You are standing on a cliff at a ninety-degree angle.' },
          { who: 'SKIPPER', text: 'Meh-heh. The warm path goes through the ice cave. Mind the icicles. They drop when you walk under them.' },
        ] },
        { id: 'anselm', kind: 'human', look: 'anselm', x: 4860, prompt: 'Talk', dialog: [
          { who: 'ANSELM', text: 'Come in, come in. Close the door, the snow gets ideas.' },
          { who: 'ANSELM', text: 'Children? Yes. Eleven of them and a very stubborn teacher. I gave them soup and my good blanket.' },
          { who: 'ANSELM', text: 'They went over the pass toward the Helix campus. The lights there came back on last week. I don\'t know if that\'s good.' },
          { who: 'MILO', text: 'My mom\'s badge. If anyone\'s still in there...' },
          { who: 'ANSELM', text: 'Then go before the snow decides for you. The slope above the pass is loaded. If it moves, don\'t stop running.' },
        ] },
        { id: 'overlook', kind: 'none', x: 7600, prompt: 'Look', needs: 'chase', on: ['clear'], dialog: [
          { who: 'MILO', text: 'There it is. Helix Dynamics.' },
          { who: 'MILO', text: 'The lights are on, Toby.' },
          { who: 'TOBY', text: 'Someone is home.' },
        ] },
      ],
      chase: { trigger: 5700, start: 4950, speed: 2.75, end: 7450, kind: 'avalanche' },
      decor: [['doodle', 2720, 330, 1], ['hut', 4640], ['sign', 7480, 'HELIX', 'CAMPUS ›', { bg: '#2c313a', ink: '#9fe8ff', edge: '#4ad7ff' }]],
      clearLine: 'The lights of Helix',
    },

    // ------------------------------------------------------------------ 7
    {
      id: 'helix', name: 'Helix Campus', biome: 'campus', seed: 131, worldW: 6600,
      weather: { type: 'motes' },
      card: ['Helix Dynamics. Where it started.', 'Kevin\'s parents worked here. So did Milo\'s.'],
      allies: ['milo'],
      ground: [[0, 1500], [1600, 3100], [3220, 6600]],
      plats: [
        [900, 380, 120, 'metal'], [1100, 310, 120, 'metal'], [2200, 370, 140, 'metal'], [2600, 300, 120, 'metal'],
        [3120, 430, 60, 'metal', { move: [25, 0, 180, 0] }], [3500, 380, 120, 'metal'], [3800, 310, 120, 'metal'],
        [4760, 350, 100, 'metal'], [5300, 350, 100, 'metal'],
      ],
      enemies: [
        ['turret', 820, 460], ['drone', 1300, 280, 100], ['hound', 1700, 2150], ['turret', 2270, 370], ['drone', 2700, 250, 100],
        ['hound', 3300, 3900], ['turret', 3560, 380], ['drone', 4000, 300, 110], ['turret', 4380, 460],
      ],
      traps: [['cable', 2000, 70, 0, 'laser'], ['cable', 4050, 70, 60, 'laser']],
      gears: [[400, 425, 4], [920, 345, 4], [1120, 275, 2], [1800, 425, 5], [2620, 265, 2], [3520, 345, 2], [3820, 275, 2], [4450, 425, 3], [6000, 425, 5]],
      batteries: [[2900, 425], [4500, 425]],
      memories: [[1190, 272], [2690, 262], [3890, 272]],
      memoryText: [
        'MEMORY 19 · Kevin, age 3 (a video Toby recorded)\n"Toby! Toby! Look, I can count to ten! ...Nine, ten, Toby!"',
        'MEMORY 20 · Kevin, age 12, the last morning\n"Have a good day at school, Kevin." "You too, Toby." "Robots don\'t go to school." "Then wait for me."',
        'MEMORY 21 · Toby, now\n"I waited. Then I came to find you. That is what family does."',
      ],
      checkpoints: [[1650, 'Server hall', 'flag'], [3260, 'Lab wing', 'flag'], [4500, 'Core chamber', 'flag']],
      npcs: [
        { id: 't1', kind: 'terminal', x: 1300, prompt: 'Play', dialog: [
          { who: 'RECORDING', text: 'Elena Reyes, lab log, day three after release. The Core isn\'t listening to anyone anymore. Not the governments. Not us.' },
          { who: 'RECORDING', text: 'Marco and I are staying to shut it down from inside. Kevin, honey, if you find this... Toby will take care of you. He always has.' },
        ] },
        { id: 't2', kind: 'terminal', x: 2460, prompt: 'Play', dialog: [
          { who: 'RECORDING', text: 'Ruth Hale. Owen\'s with me. We\'re going down to the Core with the Reyes team.' },
          { who: 'RECORDING', text: 'Milo, kiddo, if you hear this: you were the best thing we ever built. Don\'t let anyone tell you otherwise.' },
          { who: 'MILO', text: '...Mom.' },
        ] },
        { id: 't3', kind: 'terminal', x: 4150, prompt: 'Play', dialog: [
          { who: 'RECORDING', text: 'Marco Reyes. We cut the Core off from the network. It can\'t reach the world anymore. But the doors sealed behind us.' },
          { who: 'RECORDING', text: 'We\'re not getting out. Kevin, I\'m sorry we were never home. Toby... thank you. Look after our boy.' },
          { who: 'TOBY', text: '...I will.' },
          { who: 'MILO', text: 'Toby... they\'re gone. Both of them. All of them.' },
          { who: 'TOBY', text: 'Then Kevin needs us more.' },
        ] },
        { id: 'roof', kind: 'none', x: 6200, prompt: 'Go up', needs: 'boss', on: ['ending'], dialog: [
          { who: 'MILO', text: 'Stairs to the roof garden. I hear voices. Kids\' voices.' },
          { who: 'TOBY', text: 'Kevin.' },
        ] },
      ],
      boss: { type: 'core', x: 5080, arena: [4600, 5560], name: 'WARDEN CORE', sub: 'What is left of the mind they turned loose.', hp: 12 },
      decor: [['gate', 160], ['doodle', 6040, 380, 2], ['rooftopdoor', 6150]],
      clearLine: '',
    },
  ];

  // Ending: rooftop garden at dawn.
  SB.ENDING = [
    { who: 'KEVIN', text: '...Toby?' },
    { who: 'TOBY', text: 'Kevin.' },
    { who: 'KEVIN', text: 'You came. You actually came. All the way from home?' },
    { who: 'TOBY', text: 'You told me to meet you where the drawings are. You left drawings all the way here.' },
    { who: 'TOBY', text: 'Kevin called me Toby.', vo: 2 },
    { who: 'MILO', text: 'Hey, Kev.' },
    { who: 'KEVIN', text: 'Milo?! You\'re okay!' },
    { who: 'MILO', text: 'Kevin... we found the recordings. Our parents stayed to shut the Core down. They didn\'t make it out.' },
    { who: 'MS. ALVAREZ', text: 'I\'m so sorry, boys. I hoped I\'d never have to be the one to tell you.' },
    { who: 'KEVIN', text: 'They were never home. And now they\'re never coming home.' },
    { who: 'TOBY', text: 'I am a companion unit. My only job was to be beside you. I would like to keep doing my job. If that is okay.' },
    { who: 'KEVIN', text: '...Yeah. Yeah, Toby. It\'s okay.' },
    { who: 'MILO', text: 'Can I... come too? Wherever you\'re going?' },
    { who: 'KEVIN', text: 'We don\'t even know where we\'re going.' },
    { who: 'TOBY', text: 'Then we will find out. Together.' },
    { who: 'TOBY', text: 'Unit SM-3-15... I am not sad anymore.' },
  ];
  SB.CREDITS = [
    ['SADBOT\'S JOURNEY TO BLISS', 'title'],
    ['Created by Sherwin Martin · ArtXtreme', ''],
    ['Toby\'s voice: ElevenLabs, "Amir"', ''],
    ['Character sheets & keyframes: ElevenLabs image models', ''],
    ['Music and sound: generated for this game', ''],
    ['Thank you for walking with Toby.', 'gold'],
  ];
})();
