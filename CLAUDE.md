# Folio: project context for Claude Code sessions

Team: GBDA 402 Team 9, four people. Deadline for the hi-fi deliverable: Nov 27. Brand source of truth: the Figma "Folio Brand Package". The hi-fi grade looks at design system applied, consistency, accessibility and flow, plus screenshots with rationale, a service blueprint and an AI use disclosure (AI helped build this code and the Figma assets).

## What this is
A transition-of-care platform. Patients move through 10 levels across 5 skills. Paediatric teams sign off in person. A tapped card opens an adult care view. Condition package for now: Type 1 diabetes (levels are a proposal still to be tested with a clinician).

## Stack decision
Plain static site, no build, no framework. Reason: the repo deploys `docs/` straight to GitHub Pages, four people can edit in the browser, and a PWA needs nothing more than a manifest and service worker. An earlier plan guessed Vite, React and TypeScript. That was never confirmed. Only move to a build step if a real backend or heavy state arrives.

## Map
- `docs/shared/css`: tokens.css (brand tokens, a11y modes), base.css (type, forms, buttons, flat tables, motion), paper.css (sheets, stamp, tape), card.css (Folio ID card)
- `docs/shared/js`: data.js (levels, skills, seed data), store.js (state, actions, a11y settings, localStorage + cross-tab sync), ui.js (`h` safe templating, icons, modal, toast, hash-router `createApp`)
- `docs/index.html` is the portal entry (the main site). `docs/portal/`: `portal.js` is the binder-tab shell and route table. `pages/*.js` each set `F.Pages.x` returning `{title, html}`
- `docs/app`: patient PWA (manifest.webmanifest, sw.js, icons, app.js)
- `docs/card`: adult care view (token query, demo mode, session timeout, access logging)
- `notes/`: the first-run walkthrough and change plan (participant codes only, no names)
- `design-system/plants/`: the full-size v4 plant images (01 to 10). The site does not load them. It uses small JPG copies in `docs/shared/img/plants/`

Scripts are plain `<script>` tags on a `window.Folio` namespace so it works on file:// and Pages. Load order is set in each `index.html`.

## Conventions
- Events: elements carry `data-action="name"` (click) or `data-change="name"` (change). Handlers live in `F.actions`. Forms use `data-submit`.
- Inputs bound to UI state use `data-bind="key"`; add `data-rerender` to re-render as the user types.
- Booleans in `h` templates render as empty, so use `${String(bool)}` inside attributes like aria-pressed.
- State changes go through `F.Store.act.*`, which saves and re-renders every open surface.
- Writing style for UI copy: sentence case, plain words, no em-dashes.

## Decisions made with the user
- Readability first. Paper is structure and motion only. Tables and clinical text stay flat.
- Contrast aims past AA toward 7:1 (muted text is a derived deeper green). Settings has text size, contrast, motion, spacing.
- Adult view is a sub-URL reached only from a card's unguessable token link. Team gets a labelled `?demo=1` entry. Every open is logged and sessions time out.
- Red star is for level sign-offs (stamp), alerts and one call to action.
- Patients are a core page, separate from Team (staff accounts).
- Portal pages in scope: Home, Patients, Patient profile, Visit mode, Add patient, Cards, Levels and skills, Access log, Insights, Resources, Team, Settings. Insights "time saved" is a labelled stub.

## Known gaps and open flags
- No backend or auth. Data is per-browser. Roles on the Team page are not enforced.
- QR codes are real (vendored qrcode-generator, error correction Q). They encode the production tap link https://jtq03.github.io/Folio/card/?t=TOKEN&via=qr (F.cardUrlProd). Seed tokens are frozen in data.js (F.CARD_TOKENS). 'Replace card' creates a new token and invalidates a printed QR: reprint with `node tools/make-qr-pngs.js`. The app's 'Scan your card' (docs/app/scan.js, jsQR lazy-loaded) logs in from the card QR. NFC is simulated by the tap link.
- Level system is 10 levels from the Figma wireframes. The video drew 7 steps. Settle the count as a team.
- Figma wireframes mix "Crohn's/GI" and "Type 1 diabetes" for Maya. The code uses Type 1 diabetes (matches the level system and MVP flow).
- Wireframe sign-off lets a clinician advance with a skill still Learning plus a note. Visit mode keeps that, behind an explicit override.
- The 47% stat source is now confirmed: Shulman, Shah, Fu, Chafe and Guttmann (2018), Diabetic Medicine 35(11), 1515 to 1522, https://doi.org/10.1111/dme.13782. In an Ontario cohort, 47% of youth with diabetes went more than a year without diabetes care during transition. The chip can be used with this citation.
- Off-palette video pieces (yellow star, sun, clock) are not used.
- Fonts load from Google Fonts. Offline, the app falls back to Georgia and system-ui until fonts are cached.
- Compliance wording in Settings is a prototype checklist, not legal advice.
- Prototype type still needs instructor approval before committing to this build as the graded deliverable.

## v2 research update (branch samantha/v2-research)
Changes come from Team 9's interviews, classroom tests and instructor critique. The README section "Why each feature exists" gives the reason for each.
- New patient fields (all optional, defaults in `F.defaults` in data.js): `meds`, `medsConfirmed`, `supportThisVisit`, `decisionSupport`, `careTasks`, `plant.events`. Handoff notes can carry `fields` (meds, referrals, upcoming, managed, watch).
- `store.js` runs `migrate()` on load, so saved demo data gains the new fields and loses the old GI wording without a reset.
- New store actions: `editMed`, `removeMed`, `confirmMeds`, `toggleCareTask`, `readGuide`, `setDecisionSupport`, `saveHandoff`. `practise` and `advance` also record plant growth.
- Adult view: no level numbers, a consent screen before the profile opens, medications above the fold, "Where X may need support in this visit", "Make big decisions: with help", a status legend, and drafts never shown (`sel.notesFor(p, 'adult')` filters them).
- Patient app: a growing plant (`docs/app/plant.js`, `plant.css`). Teens choose the progress style in setup and can change it in About me > Display (plant, stickers, just my level). It is stored as the device setting `motivation`. Stage = signed-off level. Leaves = practice, guides read and Run my care tasks since the last sign-off. Nothing ever shrinks, and it is never tied to glucose or A1C. Private: never shown in the portal or adult view.
- Patient app: Run my care checklist with calendar reminders (three weeks and one day before), a medications and supplies list, card freeze and new card link, and draft type 1 diabetes guides linked to skills (marked for diabetes educator review).
- Portal: confirm the medication list, edit support notes and big-decision support, a structured handoff form (draft or shared), the status legend and the attention reason.
- Flag for the team: Level 3 no longer asks for a glucose log (pumps and sensors already log), and the guides need review by a diabetes educator.

## v3 first-run update
A persona walkthrough found no first run anywhere. The README section "Why each first-run change exists" maps each change (F1 to F11) to its reason.
- **Patient app first run:** `docs/app/welcome.js` and `welcome.css` load after `app.js`.
  - The overlay covers the app shell, which stays inert until setup ends.
  - Teen path: Folio ID, confirm, privacy, nickname and progress style, an optional self-check, then Home.
  - Parent path: three screens, then a parent home.
  - Per device: `folio.app.setup` ('teen' or 'parent') and `folio.app.child`. Devices that already remember a patient (`folio.app.pid`) skip setup.
  - `?welcome=1` forces the welcome. About me > Prototype > Show the welcome again replays it.
  - `F.app.setPatient(id)` switches the signed-in teen without a toast.
- **New patient fields** (defaults in `F.defaults`, filled by `migrate()`):
  - `allergies`, `noAllergies`
  - `selfCheck {skills, date}`
  - `parentShare {level, tasks, visit}`, all off by default
  - `owner` on care tasks ('parent', 'shared' or 'teen')
  - Also `F.OWNERS`, `F.PARENT_SHARE`, a teen-voice `you` line on each level, and care task k5 "Find an adult family doctor".
- **New store actions:** `setMe`, `setSelfCheck`, `setParentShare`, `setTaskOwner`, `editAllergy`, `removeAllergy`, `setNoAllergies`. `practise(pid, sid)` takes an optional skill id.
- **One-time demo fixes** (`state.mig.v3`): Maya's handoff note is shared and final, she has a penicillin allergy and parent sharing on, and Jordan carries the draft handoff example.
- `today()` now uses the local date, not UTC (evening entries in Ontario were dated tomorrow).
- **Portal:**
  - A mock sign-in (`folio.portal.user` per device) with an account picker and Sign out. No password field.
  - A one-time welcome card per person (`folio.portal.welcomed`).
  - Coordinators see "Cards to hand out". Everyone else sees "Handoffs shared" in place of "Average level".
  - Visit mode shows the teen's self-check as their view.
- **Adult view:**
  - The consent screen says what Folio is and whose settings apply, with an optional viewer name that goes to the access log and pre-fills the clinician note.
  - "At a glance" comes first: allergies, insulin, devices, emergency contact with Call, big decisions, adult care and the teen's own words, each with its source and date.
  - The fold label shows only in demo mode.
- `sw.js` is at v9.
- **Flags for the team:**
  - Level 8 still says it unlocks "I control what my family can see", and Levels 1 to 3 assume a parent-managed profile until "My own login". The parent path gives the teen control from the start (CPS 2023, PHIPA). Pick one and update `F.LEVELS`.
  - Coordinator limits are described, not enforced.
  - Real sign-in, a date-of-birth check on the Folio ID, and DKA or severe low history in the adult view are not built.
  - The Ontario consent rules (PHIPA, Health Care Consent Act) need a legal check before any real use.

## Usability pass
- Priority order on every main screen. The README section "Usability pass" lists U1 to U18 with reasons.
- **Removed from view:**
  - The "soon" condition packages.
  - The sticker book in plant and level-only modes.
  - The count-up on portal Home stats.
  - Phase words in the teen app.
- **Team tools:** the haptics test shows with `?debug=1`. The intro plays once per device (`localStorage folio.intro.v1` and `folio.portal.intro.v1`), and `?intro=1` replays it.
- **New in the teen app:** allergies in About me (`editAllergy`, `noAllergies` actions), and an "Add your adult family doctor" prompt.
- **New in the portal:** the Visit mode question list and medication check, `Sort: needs action first` (the default), and a "Needs educator review" pill on draft guides.
- `sw.js` is at v10.

## Haptics on iOS
- Web pages cannot trigger haptics from script on current iOS (a programmatic click on a hidden switch stopped working around iOS 26.5; there is no Vibration API on iOS). Only a finger landing on a real, rendered `<input type="checkbox" switch>` gets the system tick.
- Strategy: `docs/app/haptic-tap.js` lays a near-invisible native switch over safe controls (tab bar items, `button.ios-btn`, anything with `data-haptic-tap`). The click still reaches the control with isTrusted intact, the switch resets, and `N.haptic` is skipped for that tap so it never ticks twice. The programmatic engine stays as the fallback for older iOS and Android.
- About me > Prototype > Haptics test compares script click, real switch, overlay button and delayed click, with a "what you felt" checklist to screenshot.
- True UIKit haptics need a native shell (Capacitor or a plain WKWebView app with UIImpactFeedbackGenerator or the Capacitor Haptics plugin), distributed via TestFlight or Xcode. That needs a Mac with Xcode and an Apple Developer account.

## UI copy style note
Warm, clear and teen friendly. Sentence case for everything except iOS system verbs on action sheets ("Discard Changes", "Keep Editing"). Plain words, no jargon, no placeholder text, no em-dashes. Errors say what to do next ("Use numbers only, like 416 555 0100").

## Haptics on iOS web
- iOS Safari has no `navigator.vibrate`. The only route to the Taptic Engine is `<input type="checkbox" switch>`: Safari ticks when it toggles.
- A real tap on a native switch (or its label) always ticks, so visible toggles are real switches (`html.nsw` is set in native.js when the switch control is detected).
- A programmatic `label.click()` on a hidden switch ticked on iOS 17.4 to 26.4. Apple blocked it in iOS 26.5, so code-started haptics (success, level up) are silent there. Android uses vibrate patterns.
- Engine: `F.native.haptic(kind)` in `docs/app/native.js` (light, medium, heavy, success, warning, error, selection). Decorative haptics (not started by a tap) are skipped under Reduce Motion or when the last tap was over 1 s ago.
- Test sheet: About me, Prototype, Test haptics (`F.actions.hapticLab` in `docs/app/polish.js`, shown with `?debug=1`). Real switch buzzes but buttons do not: code haptics are blocked by iOS. Neither buzzes: System Haptics off, Low Power Mode, or iOS too old.
- If it breaks: check the test sheet log first, then the ios-haptics npm package for the current trick (v3.3 lays an invisible label over each button so the user's own tap toggles the switch).

## Design system v4
Source: "Folio Design System Redesign.zip" from Claude Design (v4). Only its full-size plant images are in the repo, in `design-system/plants/`. Behaviour and markup stay as after the usability pass. The restyle is an override layer plus small design-level JS.
- **Tokens:** `shared/css/tokens.css` holds the v4 palette, semantic pairs (success, info, warning, error), voices (`--voice-patient` Blue 100, `--voice-care-team` Beige 200), radii, focus ring and a dark block. Older names (`--bg`, `--text`, `--primary`, `--accent`) point at v4 values. `--shadow-paper`, `--grain` and `--linen` are `none`.
- **Override files, loaded last:** `shared/css/v4.css` (portal and adult view base), `portal/v4.css`, `card/v4.css`, `app/v4.css` (teen app, including its own wordmark rules because the app does not load shared v4.css). Fonts are Fraunces and Figtree. Prompt is gone.
- **Assets:** `shared/img/plants/01.jpg` to `10.jpg` and `shared/img/logo/` (the two wordmarks). `F.ASSET` is the path to them.
- **ui.js helpers:** `U.wordmark(cls, cream)`, `U.mark()`, `U.mascot()`, `U.plantImg()`, `U.visChip(kind, text)`, `F.PLANT_NAMES`. `pill()` adds an icon per tone (`track` is the On track status).
- **Plant:** `plant.js` uses the v4 plant images, one per level. My plant shows all ten (earned, current, upcoming).
- **Small improvements (README V1 to V6):** visibility chips on notes, owner chip and Take it on in Run my care (`F.actions.takeTask`), the plant row, a compact adult view bar on phones, an icon on On track, and Reduce motion now stops page smooth scrolling (`base.css`).
- **Colour audit:** all 90 screens were captured with headless Chrome and checked. No colour falls outside the v4 tokens.
- **Flags for the team (v4 conflicts with earlier decisions, earlier decision kept):**
  - v4 shows the plant as a readiness marker in clinical tables. Folio keeps the plant private to the teen.
  - v4 lists a blood sugar chart. Folio never shows glucose numbers, so none is built.
  - v4 says Red 500 is the star and mascot only. Folio still uses the star for the new-note badge, the guide finish line, the profile ring and the sign-off stamp.
  - v4 has four card shapes. The usability pass kept one; card shapes are now back (see Card shapes below).
  - The v4 calendar pattern (month, week strip) is not built. Visits use the ticket and phone reminders.
  - v4 names Lucide as a stand-in icon set. Folio keeps its own icons at a 2px stroke until the paper-cut set arrives.

## Readiness check, goals and more (v5)
From a review of MyTransition (McMaster and CanChild). README R1 to R7 give the reasons.
- **Data (data.js):** `F.CHECK` (15 questions, 3 per skill, each with a goal, 3 steps and a guide `res` or `link`), `F.CHECK_ANS`, `F.CHECK_WORD` (Not yet, With help, On my own), `F.CHECK_RANK`, `F.checkSkills(answers)` (the middle answer per skill), `F.checkItem(id)`. Resources r17 to r20 are the health behaviour guides (review: true).
- **New patient fields** (defaults in `F.defaults`, Maya filled by `state.mig.v5`): `checks` (newest last, at most 6, each `{date, answers, skills}`), `goals` (at most 3, `{id, date, done: [bool x3]}`), `summary3` (`{s1, s2, s3, date}`), care task `due`, medication `refill`.
- **Store actions:** `saveCheck` (also sets `selfCheck`, grows a leaf once a day), `setGoals`, `toggleGoalStep`, `setSummary3`, `logPractice`, `setTaskDue`, `setRefill` (does not undo the medication confirmation).
- **Teen app:** the check runs in the welcome overlay (`welcome.js` steps check, cq, cres, cgoals). `F.Welcome.check(pid, at)` opens it from the app. New route `#/levels/check`. Home shows My goals in place of the next step, a check prompt, and Coming up. About me has My diabetes in 3 sentences.
- **Portal:** Visit mode step 1 shows the teen's goals, view and answers per skill. The profile overview shows the 3 sentences and goals.
- **Adult view:** At a glance opens with "In Maya's words" when the teen has written their 3 sentences.
- **Flags:** TRANSITION-Q items are licensed, so none are used. The READDY item list could not be read, so Folio's questions are original and need a diabetes educator's review. The 3 sentences sit above allergies in the adult view; the team may want allergies first for ER use.

## Sync across devices
- Files: `shared/js/config.js` (loaded before store.js: `F.CONFIG`, `F.SYNC`, the `?ws=` and `?sync=` overrides), `shared/js/sync.js` (after store.js: `F.Sync`), `shared/css/sync.css`. All three index.html files load them and `sw.js` caches them (v16).
- Off unless a device has both a URL and a workspace. `syncUrl` is committed; the workspace name is the secret and is never committed. A device joins with `?ws=NAME` (saved to localStorage `folio.sync.ws`, removed from the address bar, one toast). Names under 20 characters show an error and stay off. Settings > Sync and About me have Copy setup link.
- Firebase Realtime Database over REST, no SDK: PATCH writes (`?print=silent`), an EventSource stream for reads, polling every 4 s as the fallback. Layout `/folio/<ws>/{patients/<id>, team, resources, program, clinic, access/<id>, meta}`. Each record is `{u, c, s, j}` with `j` a JSON string.
- Store hooks: `S.onCommit`, `S.onReset`, `S.applyRemote(fn)` (runs migrate, saves, re-renders, never fires onCommit, and holds the re-render while someone types), `S.persist`, `S.seed`, `S.migrate`. Patients carry `_u`.
- Merge: last writer wins per record by (u, client id); the access log is a union by id, newest first, capped at 500. Local-first: bookkeeping in `folio.sync.book.<ws>` (hashes, versions, pending records) so edits made offline or in a closed tab go up on the next open. Nothing is sent before the first read, so a device that missed a reset cannot undo it.
- Not synced: `me`, `mig`, accessibility, sign-in, setup, seen markers, and every key other than folio.proto.v2. With sync on, app Log out does not clear setup answers on the shared patient (`clearSetup` returns early).
- Reset demo data replaces the whole workspace (PUT, new `meta.reset`); other devices go back to the seed and take the workspace.
- Tests (scratchpad): `mockrtdb.js` is a Node mock of the REST API with SSE; `sy.js` drives portal, app and adult view as separate browser contexts against it.

## Card shapes (restored)
- The usability pass removed the shape choice; it is back. `F.CARD_SHAPES` (data.js) is, in picker order: star, heart, cloud, tag, rounded ('ID card', the default). `F.cardShape(s)` maps old saved values (square, tab) and anything unknown to 'rounded'; card.css has no rules for square or tab, so they render as the ID card everywhere. No migration.
- Portal Cards: a radiogroup of five icon buttons (visible labels, arrow keys, check badge plus bold underlined label when selected) per row and in the Issue card sheet. A row change saves at once via `setCardShape`; the sheet saves on Issue card. The preview modal has the picker too.
- `shared/css/card.css`: star (clip-path), heart and cloud (CSS masks of circles and a wedge), tag (portrait luggage tag, chamfered top, punched hole by mask, string loop), ID card (landscape). The QR on every back sits inside the shape's computed safe area and decodes with jsQR (checked in Playwright). The patient app Home card flips with the same shape. The app's QR sheet stays a plain square QR.
- Pilot tags in the seed: Sam Orr star, Amber Baiden cloud, Lauren Martin heart, Jake Querin tag, everyone else ID card.


## Level system v2 (each level has its own goal and 4 skills)
- **Why:** the user asked to stop scoring the same 5 skills at every level. Each level now has its own goal and 4 unique skills (40 in all). Review copy: `notes/level-curriculum.md`, generated by `node tools/make-curriculum-doc.js` (run it after any change to the curriculum in data.js).
- **Contract (data.js):** `F.LEVELS[i] = { n, name, phase, goal, intro, leads, unlocks, you, can, evidence, plant: { key, name, nick, trait, image, pokes[3], idle, story }, skills[4] }`. Skill: `{ id 'L3-02', area, name, can, how[3], evidence, guide (resource id or null), level, sub (= can, for old list rows), sticker: { id, name, shape, color, icon, material, size, story, detail, back } }`. All 40 sticker (shape, color, icon, material) combinations differ; only L10-04 is a red star. Sticker icons come from `F.UI.ic` (v2 added drop, star, heart, chat, food, moon, pill, map, key, calendar, bolt, thermo, bag).
- **Helpers:** `F.ALL_SKILLS`, `F.SKILL_BY_ID`, `F.skillsOfLevel(n)`, `F.levelOfSkill(id)`, `F.isSkillId(id)`, `F.skillMap(level, current)`, `F.needToAdvance(req, n)`, `F.AREAS` and `F.AREA_BY_ID` (the five areas, now theme tags with tone and icon). `F.SKILLS` is still an alias of `F.AREAS` for area-keyed code (readiness check results, resource tags, the old app sticker book); no caller reads `p.skills[area]` any more. `F.CURRICULUM_FLAG` is the review line.
- **Patient state:** `p.skills` maps all 40 skill ids to learning, help or own (lower levels own, current level real progress, higher levels learning). `p.earned` maps skill id to the ISO date it first became own and is never removed (stickers never peel off). `p.skillsV1` keeps the old area map after migration.
- **Rule:** `program.requiredSkills` = skills needed in the current level, default 3 of 4, selectable 2 to 4. `program.rule: 2` marks the converted setting. Store: `sel.currentSkills`, `sel.ownCount` (current level only), `sel.need`, `sel.ownSkills` (newest first), `sel.stillBuilding`, `sel.status`; `act.setSkill(pid, skillId, status)` (stamps earned), `act.practise(pid, skillId)` (learning to help, current level; an area id or nothing picks the first learning one), `act.advance` (stamps earned, next level starts learning), `act.placeFromCheck(pid)`.
- **Migration:** `F.upgradeSkills(p)` runs inside `F.defaults`, so seeds, `migrate()` and remote records all pass through it. Old area statuses map onto the current level's skills by area tag; idempotent; notes, contacts, cards, checks and goals untouched. The program setting converts once (old 3/4/5 of 5 becomes 2/3/4 of 4).
- **Sync schema 2:** `sync.js` SCHEMA is 2. Joining a schema 1 workspace raises `meta.schema`, so older clients (which only check meta) pause read-only. Patient records written with `s: 1` are migrated locally and sent back with `s: 2`.
- **Readiness check:** the 15 questions keep ids and wording; `F.CHECK_MAP` / `q.skills` say which level skills each samples. `F.checkSkillView(answers, skillId)` gives the teen's view per skill, `F.checkPlace(answers)` a suggested starting level and statuses. The welcome result shows the suggestion; Visit mode offers "Start at Level N" only for a Level 1 teen with no sign-off yet. The check still never changes anything by itself.
- **Surfaces:** Visit mode step 1 = the current level goal and its 4 skills (can, what the clinic sees, teen's view, status). Profile = level goal, skills and an all-levels roadmap. Levels and skills = 10 expandable levels with skill tables, rule 2 to 4, CSV with one row per skill. Insights = completion by area and by level, and the skills most often still Learning. Adult view = "What X can do on their own" by area and "Still building", no level numbers.
- **Patient app:** minimum compatibility only (lists show the current level skills). The app's Levels, sticker and plant screens are being redesigned against this contract (`docs/app/stickers.*`, `plant-pal.*`). `sw.js` is at v18.
- **Flags for the team:**
  - The whole curriculum, the "what the clinic sees" lines and the check mapping are a proposal that needs review by a diabetes educator. Open questions are at the end of `notes/level-curriculum.md`.
  - "I control what my family can see" now unlocks at Level 9 (privacy and consent), which settles part of the earlier Level 8 flag; the parent path still gives control from the start.
  - 13 skills are not sampled by the readiness check.
  - Seed statuses were rewritten for variety: Eli L1 one With help, Jake L6 two of four, Ana L9 three of four, Priya, Ana and Lauren ready.
