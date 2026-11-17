# Folio

Your story, carried forward. A care transition prototype for GBDA 402, Team 9.

Young patients build skills level by level (1 to 10). Paediatric teams sign them off in person. When a patient arrives at an adult clinic or ER, tapping their Folio card opens a clear, current picture of them.

Three surfaces share one design system and one data layer:

| Surface | Path | For |
|---|---|---|
| Web portal (main) | `docs/index.html` + `docs/portal/` | Paediatric teams: Home, Patients, Patient profile, Visit mode, Add patient, Cards, Levels and skills, Access log, Insights, Resources, Team, Settings |
| Patient app (PWA) | `docs/app/` (URL `/app/`) | Patients: Home, Levels, Resources, About me. Installable, works offline |
| Adult care view | `docs/card/` (URL `/card/?t=TOKEN`) | ER and adult clinics. Only reachable from a card's private link. `?demo=1` is the team's labelled demo entry |

Everything is fictional demo data kept in the browser (`localStorage`). A sign-off in the portal shows up in the patient app and the adult view on the same device. Reset it from Portal > Settings > Reset demo data.

## Run it

No build step.

```sh
cd docs
python3 -m http.server 8000
```

Open http://localhost:8000 (portal), /app/ (patient app), /card/?demo=1 (adult view). It also runs on GitHub Pages (Settings > Pages > Deploy from a branch > `main` and `/docs`), expected at https://jtq03.github.io/Folio/.

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

## Why each feature exists (v2 research update)

Each change below comes from Team 9's research: interviews with a paediatrician, a family doctor, a former ER nurse, a patient experience specialist, a young adult with type 1 diabetes and an analogous-setting participant, two classroom think-aloud tests, and instructor critique. Strong means three or more sources, moderate two, early one.

| ID | Change | Why (paraphrased) | Evidence |
|---|---|---|---|
| A1 | No level numbers in the adult view | Classroom testers could not tell what a level number meant or what separated one level from the next | Strong |
| A2 | Draft notes never reach adult teams | Testers and the AI pilot flagged unfinished notes as confusing and risky | Early |
| A3 | One-line meaning for On my own, With help and Learning | Testers could not tell With help from Learning | Early |
| A4 | Where the patient may need support in this visit, and who helps with big decisions | The redesigned adult view with these sections read correctly to a young adult reviewer, and the nurse asked to show who makes health decisions | Moderate |
| A5 | Consent screen before the profile opens | Teens choose what is shared, and every open is logged | Moderate |
| A6 | Type 1 diabetes wording everywhere | Leftover GI wording (flare plan) confused the story | Team fix |
| C1 | Run my care: blood work, supplies, prescriptions, funding, with reminders | The hardest change at 18 was logistics, not speaking up, and some of it was handled unseen by a parent | Strong |
| C2 | Medications and supplies list above the fold, with a confirmation date | Three professionals asked for it, hospitals rely on patients to know their medications, and an undated list is a safety risk | Strong |
| C3 | Structured handoff note | The family doctor needs repeats and referrals to book in time, and the paediatrician asked for upcoming appointments | Strong |
| C9 | Freeze the card and get a new link from the app | Lost cards were raised by the nurse and a classroom tester | Moderate |
| C11 | Short type 1 diabetes guides linked to skills | The young adult wanted to learn day-to-day management and was learning it from social media instead | Early |
| C12 | A growing plant, switchable with stickers or level only | The young adult described a plant that grows as you do tasks, while classmates preferred stickers, so the team can test both | Early, mixed |

See [CONTRIBUTING.md](CONTRIBUTING.md) for how the four of us work in it, and [CLAUDE.md](CLAUDE.md) for the technical map.
