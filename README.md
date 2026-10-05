# Sadbot's Journey To Bliss

A seven-stage side-scrolling adventure. Toby (unit SM-3-15), a rusted companion robot, crosses a
collapsed world to find Kevin, the boy he was bought to protect.

**Play:** https://sadbot.mudpixel.com

## Run locally
It's static files. Serve the folder with any static server, for example:

```bash
npx serve .
```

Add `#dev` to the URL to unlock every stage for testing.

## Structure
| Path | What it is |
|------|------------|
| `index.html`, `style.css` | Page shell (strict Content Security Policy, no inline scripts) |
| `js/core.js` | Canvas, audio, input, asset loading |
| `js/draw.js` | Every character, creature, enemy and prop, drawn in code |
| `js/world.js` | Biomes, parallax scenery, weather, caves and lighting |
| `js/stages.js` | All level data and dialogue |
| `js/game.js` | Player, enemies, traps, allies, bosses, menus, ending |
| `js/account.js` | Optional email magic-link sign-in and cloud-saved progress (Supabase) |
| `supabase/migrations/` | Database schema with row-level security |
| `vercel.json` | Hosting config: security headers (CSP, HSTS, no framing) and caching |
| `GAME_DESIGN.md` | Story bible, stage table and systems |

## Hosting
Deployed on Vercel from the `main` branch; pushing to `main` redeploys.

## Accounts and security
- Sign-in is passwordless (email magic link, PKCE flow) via Supabase Auth.
- The key in `js/account.js` is Supabase's **publishable** key, which is designed to be public.
  Every table has row-level security: a player can only read and update their own progress row.
- Never commit a Supabase service-role key, SMTP password or any other secret.

See [SECURITY.md](SECURITY.md) to report a vulnerability.

© Sherwin Martin · ArtXtreme. All rights reserved.
