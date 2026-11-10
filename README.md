# Folio

Your story, carried forward. A care transition prototype for GBDA 402, Team 9.

Young patients build skills level by level (1 to 10). Paediatric teams sign them off in person. When a patient arrives at an adult clinic or ER, tapping their Folio card opens a clear, current picture of them.

Three surfaces share one design system and one data layer:

| Surface | Path | For |
|---|---|---|
| Hub | `docs/index.html` | Team launcher |
| Web portal | `docs/portal/` | Paediatric teams: Home, Patients, Patient profile, Visit mode, Add patient, Cards, Levels and skills, Access log, Insights, Resources, Team, Settings |
| Patient app (PWA) | `docs/app/` | Patients: Home, Levels, Resources, About me. Installable, works offline |
| Adult care view | `docs/card/?t=TOKEN` | ER and adult clinics. Only reachable from a card's private link. `?demo=1` is the team's labelled demo entry |

Everything is fictional demo data kept in the browser (`localStorage`). A sign-off in the portal shows up in the patient app and the adult view on the same device. Reset it from Portal > Settings > Reset demo data.

## Run it

No build step.

```sh
cd docs
python3 -m http.server 8000
```

Open http://localhost:8000. It also runs on GitHub Pages (Settings > Pages > Deploy from a branch > `main` and `/docs`), expected at https://jtq03.github.io/Folio/.

Install the patient app on a phone: open `/app/` on the published site, then use "Add to Home Screen" (iOS Safari) or "Install app" (Android Chrome). Service workers need https or localhost.

## Try the story

1. Portal > Patients > Maya R. Start visit, review skills, decide, write one note, sign off. The red star stamp lands.
2. Open the patient app in another tab. Maya sees the level-up celebration.
3. Portal > Cards > Open tap view. That is what an ER sees. It is logged in Access log and times out.

## Design rules (from the Figma brand package)

- Colour: three blues, two greens, one red, warm beige instead of white. Red is for the star, alerts and one call to action per screen. Never a background.
- Type: Fraunces for headlines (sentence case, italic on one or two words), Prompt for UI and body (16px minimum).
- Paper is for structure and motion (binder tabs, sheets, tape, stamps). Data stays flat and readable.
- Accessibility first: text scales (Settings), high contrast mode, reduced motion respected, full keyboard use, visible focus, status never shown by colour alone.

See [CONTRIBUTING.md](CONTRIBUTING.md) for how the four of us work in it, and [CLAUDE.md](CLAUDE.md) for the technical map.
