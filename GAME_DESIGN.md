# Sadbot's Journey To Bliss — Game Design

A 2D side-scrolling adventure for the web. Toby (unit SM-3-15), a small rusted companion robot,
crosses a collapsed world to find Kevin, the boy he was bought to protect.

## Story foundation

- **Kevin Reyes, 13.** Born to two engineers at **Helix Dynamics**, the AI company that built the
  superintelligence. His parents were never home, so on the day he was born they bought him a
  companion robot. Kevin named it Toby. Toby has been at his side for 13 years.
- **The Collapse.** World leaders turned the superintelligence loose on each other. Within weeks
  the grid, the governments and the cities failed. Its drones still patrol, following orders
  nobody remembers giving.
- **Now.** No governments. Small groups of survivors scavenge, trade and hide. Toby powered down
  during the Collapse and wakes alone in Kevin's empty bedroom with one memory: Kevin was going
  to school.
- **Milo, 13** (met in Stage 3). Kevin's friend from school, also searching for *his* parents, who
  worked with Kevin's at Helix. He joins Toby.
- **Ending.** At the Helix campus they learn both families' parents died in the Collapse. Kevin is
  alive. The three of them, two orphans and a sad robot, choose each other and set out on a new
  journey. Toby is no longer sad: the "bliss" of the title is belonging, not a place.

### Character designs
Sheets generated on the ElevenLabs flow `9Uf9dKopp5c7s2Jau3hN` (Seedream 4, Toby's sheet wired in as
the style reference; ~152 credits each).

| Character | Look | Sheet |
|-----------|------|-------|
| **Toby** (SM-3-15) | Boxy blue-grey head with a vertical seam, round black eyes, rusty jaw, barrel torso with an engraved heart, claw hands, block feet | Original sheet (node `rhp3A9mxNehMs2Uqf0EP`) |
| **Kevin Reyes**, 13 | Slim, light-brown skin, messy black hair, faded **red cap**, navy hoodie, grey scarf, patched jeans, red sneakers, blue backpack with a "KEVIN + TOBY" patch, sketchbook and crayons | `art/characters/kevin.jpg` |
| **Milo**, 13 | Taller, freckled, curly copper hair, father's oversized olive field jacket, welding goggles, orange scarf, slingshot, mother's cracked **HELIX DYNAMICS** ID badge | `art/characters/milo.jpg` |
| **Old Mara**, ~70 | Weathered warm-brown skin, long grey braid, patched hooded brown cloak, leather tool apron, brass loupe, fingerless gloves, oil lantern, crooked staff | `art/characters/mara.jpg` (in-game sprite redrawn to match) |
| **Ash** (crow) | Scruffy glossy-black crow, one white wing feather, tin ring on one leg, chipped beak, collects bottle caps | **Not generated yet**: free-plan daily image limit. Prompt saved as node `6hZRk9nNTxs2qZbOk7FK`; run it once the limit resets |

Known sheet flaws (fine as reference, fix if regenerating): the AI garbled most hand-lettered labels;
Mara's expression row shows robots instead of her face; Kevin has "SAD" twice instead of DETERMINED.

### Themes
Loyalty without being asked. Grief that doesn't end in despair. Machines that keep promises
humans forgot.

## Stages (all 7 playable)

| # | Stage | Biome & weather | Adversaries | Traps & hazards | Temporary ally | Clue givers | Boss / set piece |
|---|-------|-----------------|-------------|-----------------|----------------|-------------|------------------|
| 1 | **Ashfield** | Ruined city, falling ash | Seeker drones, scrap hounds | Pits, sparking cables | — | Ash the crow, Old Mara, Kevin's note | **WARDEN-7** |
| 2 | **The Drowned Highway** | Flooded freeway, **thunderstorm**: rain, wind gusts, lightning strikes | **Rustbucket scavengers** (pipe swingers, bomb throwers), drones | **Landmines** (some buried), **explosive barrels**, 3 **river crossings** on floating and sinking car roofs | **Biscuit** the stray dog: finds mines, bites scavengers | Biscuit, Ines the ferry captain | **BIG WRENCH**, Rustbucket chief: swings, charges into walls, throws bombs, slam shockwaves |
| 3 | **The Undertunnels** | **Underground** metro, pitch dark, dripping | Rats, miner scavengers with helmet lamps, bombers, drones | **Tripwire explosives**, barrels, falling rocks, sewer crossing on a moving cart | **Milo**: slingshot + flashlight | Milo, Old Tom the blind cat | **Tunnel collapse chase** |
| 4 | **The Glass Desert** | Dunes and mesas, **sandstorm** gusts and haze | Desert raiders, bombers, drones, hounds | **Quicksand**, **buried mines**, buried army **bunker** (dark, tripwires) | **Pip**, a reprogrammed drone: zaps enemies, scans for mines | Old Sol the trader, Sable the fennec fox | **DUST WARDEN** |
| 5 | **Whisperwood** | **Forest**, fog and rain | Wolves, poachers, bombers | **Bear traps**, powder kegs, 2 **river crossings** on drifting logs and crumbling stones | Milo returns | The Matriarch (old zoo elephant) | **GREYMANE**, the alpha wolf: pounces, howls for his pack |
| 6 | **The Spine** | **Mountain**, **blizzard**: slippery ice, gusts, whiteout | Mountain scavengers, wolves, drones | Ice cave with **falling icicles** and rockfall, icy river on cracking floes | Milo | Skipper the goat, Brother Anselm the hermit | **Avalanche chase** with rolling boulders |
| 7 | **Helix Campus** | Glass towers at night, aurora | Turrets, security drones, mech hounds | Laser gates | Milo | Recorded logs from both families' parents | **WARDEN CORE**: shielded by pylons; pulse the pylons, then strike the core |

**Ending:** a rooftop garden at dawn. Kevin is alive with Ms. Alvarez and the class. The recordings
have told Milo and Kevin that their parents died shutting the Core down. Toby asks to keep doing his
job, being beside Kevin, and the three set out together. Credits show Kevin's and Milo's sheets.

Each stage ends on a clue that names the next place. Every stage has 3 **memory fragments** (21 in
all) and Kevin's crayon drawings hidden on walls as breadcrumbs ("If I get lost, I'll leave drawings").

### Systems
- **Heart Pulse** (from Stage 1's Mara on): stuns and damages enemies, deletes bullets, detonates
  barrels, mines and bombs from a safe distance, damages bosses and pylons.
- **Allies** are temporary and can't be hurt; they join and leave through story dialogue.
- **Weather** is mechanical, not just visual: gusts push Toby, lightning telegraphs a glowing strike
  zone, sandstorms and blizzards cut visibility, ice is slippery.
- **Caves** use real darkness; light comes from Toby's eyes, lamps, fires, explosions, Milo's
  flashlight, Pip and miners' helmets.
- **Checkpoints** (fires, flags, lamps) and a chapter select; progress unlocks the next stage.
  `#dev` at the end of the URL unlocks every stage for testing.

### Code layout
`js/core.js` (audio, input, assets) · `js/draw.js` (every character, creature, enemy, prop) ·
`js/world.js` (biomes, scenery, weather, caves, lighting) · `js/stages.js` (all level data and
dialogue) · `js/game.js` (rules, bosses, allies, menus, ending). New stages are mostly data in
`stages.js`.

## Tech foundation

- **Now:** plain HTML5 Canvas + JavaScript, no build step, runs anywhere. All art is drawn in code;
  the film keyframes are used for cutscenes; all sound effects are synthesized live with Web Audio.
- **Later, if levels grow much bigger:** consider **Phaser 3** (free, MIT) with **Tiled** (free) for
  level maps, so levels are designed visually instead of in code. Keep Toby's drawing code as a
  sprite generator or replace with sprite sheets.
- **Save system:** localStorage per stage (unlocked abilities, gears, memories).
- **Deploy:** the game is static files, so it can be hosted free on GitHub Pages, Netlify, Vercel or
  itch.io.

## Free asset plan

| Need | Free source | Notes |
|------|-------------|-------|
| Cutscene stills | ElevenLabs image gen (free credits) with the character sheet as reference | What we used for the film |
| Cutscene motion | LTX Studio free credits (2s clips), or Remotion camera moves on stills | Remotion is unlimited and free |
| Voice lines | ElevenLabs TTS free tier ("Amir" voice for Toby) | ~250 credits per paragraph |
| Music | Generated in code (scripts/make-music.mjs in the film), or CC0 tracks from OpenGameArt / Pixabay Music | Keep one leitmotif for Toby |
| Sound effects | Synthesized in-game (Web Audio), or CC0 from Freesound / Kenney | |
| Sprites / tiles | Kenney.nl (CC0), OpenGameArt, itch.io free packs | Only if moving away from code-drawn art |
| Fonts | Google Fonts (Cormorant Garamond, Courier Prime) | Free for commercial use |

## Suggested next steps

1. **Playtest Stage 1** and tune difficulty (boss HP, drone fire rate, pit widths).
2. **Character sheets** for Kevin, Milo, Mara, Ash, Biscuit and WARDEN-7 (ElevenLabs image gen).
3. **Stage 2 script + level layout** (The Drowned Highway).
4. Record the remaining voice lines (Mara, Ash, Kevin's note) once credits reset.
5. Decide art direction for gameplay: keep the code-drawn look, or commission/produce sprite sheets.
