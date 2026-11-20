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

## QR codes for printed cards

Every card QR encodes its tap link, `https://jtq03.github.io/Folio/card/?t=TOKEN&via=qr`. Make print-ready PNGs (Node 18+, no install needed) with `node tools/make-qr-pngs.js`. It writes `qr-codes/` (black on white 1200 px, brand colours in `brand/`, sample patients in `samples/`, and a 28 mm print sheet) and decodes every file to check it. Replace card makes a new link, so reprint after a replace. In the app, the welcome screen's "Scan your card" reads the QR with the camera, or from a photo.

## Turn on sync (5 minutes)

By default every browser keeps its own copy of the demo data. Sync mirrors the shared data (patients, notes, cards, photos, the access log, team, resources, program and clinic settings) to a Firebase Realtime Database, so a photo added in the patient app shows on the portal a moment later. Each device still keeps a full local copy and works offline.

The database URL is already in `docs/shared/js/config.js` (`syncUrl`). The workspace name is the shared secret, so it is never committed: `workspace` stays empty, and sync stays off on a device until it has joined a workspace.

1. In the Firebase console, create a project (Spark, the free plan, is enough). Build > Realtime Database > Create database. Pick a location and start in locked mode.
2. Rules tab: paste one of these and Publish.

   Demo rules (any workspace name):
   ```json
   {"rules":{"folio":{"$ws":{".read":true,".write":true}}}}
   ```
   Stricter (refuses names shorter than 20 characters, recommended):
   ```json
   {"rules":{"folio":{"$ws":{".read":"$ws.length >= 20",".write":"$ws.length >= 20"}}}}
   ```
3. Copy the database URL (like `https://your-project-default-rtdb.firebaseio.com`) into `syncUrl` in `docs/shared/js/config.js` if it is not there already, and commit.
4. Pick a long, random workspace name of at least 20 characters, such as `folio-` followed by 20 random letters and digits. Share it only with the team, never in the repo.
5. On the first device, open any surface once with `?ws=NAME` (for example `https://jtq03.github.io/Folio/?ws=NAME`). The device remembers it, takes it out of the address bar, and says "Synced with your team workspace". The first device to join an empty workspace fills it with its data.
6. On every other device, use Settings > Sync > Copy setup link in the portal (or About me > Copy setup link in the app) and open the link there. The portal also copies links for the app and the adult view.

To try sync on one device without changing anything, open a surface with `?sync=URL&ws=NAME` (the URL override lasts for that tab only). `?ws=` with no name turns sync off on that device again.

What the status says: "Synced just now", "Syncing", "Offline, will sync when you are back", "Sync is blocked. Check the database rules." (Firebase answered 401 or 403, usually unpublished rules), or "Workspace name is too short. Use at least 20 characters."

How it works, in short: writes are REST `PATCH` calls (`?print=silent`), reads are a Server-Sent Events stream, with a 4 second poll as the fallback. Each record is stored as `{u, c, s, j}` where `j` is the JSON as a string. The newest edit of a patient wins (whole patient record, last writer wins). The access log only grows and is merged by id. Reset demo data, after its confirmation, resets every device in the workspace. Log out on a phone, sign-in, setup, accessibility settings and other per-device markers are never synced.

Security, honestly: with these rules anyone who knows the workspace name can read and change everything in it, photos included. That is fine for fictional demo data and nothing else. Never put real patient data or real photos of children there. A real system needs real sign-in (Firebase Authentication or a hospital identity provider), per-user rules, audit logging and a privacy review under PHIPA.

Limits to know: the free plan allows 100 simultaneous connections, 1 GB stored and 10 GB downloaded a month. Photos are 256 px JPEGs (about 10 to 30 KB each) and every device downloads the whole workspace when it opens, so keep it to demo use.

## Try the story

1. Portal > Patients > Maya R. Start visit, review skills, decide, write one note, sign off. The red star stamp lands.
2. Open the patient app in another tab. Maya sees the level-up celebration.
3. Portal > Cards > Open tap view. That is what an ER sees. It is logged in Access log and times out.

## Design rules (Folio design system v4)

The full-size plant images from the v4 design system, one per level, are in [`design-system/plants/`](design-system/plants/). The app uses smaller copies in `docs/shared/img/plants/`.

- Colour: Greens 500, 800 and 900, Blues 100 to 700, Lime, Butter and Beiges 50 to 300 in place of white. Red 500 is the star and the mascot. Errors use the error pair (Red 700 on a light red) with an icon and words.
- Type: Fraunces for headings 24px and up (sentence case, italic on one or two words), Figtree for UI and body (16px minimum).
- Surfaces are flat. Only floating things (sheets, toasts, the card) get a shadow. Clinical screens use a 14px radius, the teen app 20px rows and 28px cards. Buttons are pills with 48px targets.
- Voices: the patient's words sit on Blue 100, the care team's on Beige 200. Chips say who will see a note.
- One plant per level, from Tiny sprout to Giant oak, on the plant tile.
- Accessibility first: text scales (Settings), high contrast mode, reduced motion respected, full keyboard use, a 3px focus ring with a cream gap, status always an icon plus words, dark mode follows the device.

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

## Why each first-run change exists (v3 first-run update)

A persona walkthrough on a wiped phone and browser found that Folio had no first run. The app opened on another teen's Home and the portal opened already signed in as Dr. Okafor. Each change below is backed by Team 9's interviews (participant codes) or by published research. The full walkthrough, sources and plan are in [notes/first-run-walkthrough-and-change-plan.md](notes/first-run-walkthrough-and-change-plan.md). AI personas were used as hypotheses only and are not counted as evidence.

| ID | Change | Why (paraphrased) | Evidence |
|---|---|---|---|
| F1 | Teen welcome: find your profile with the Folio ID, confirm it is you | The app showed another teen's health details on a fresh phone. Clinics should pre-fill the clinical part so teens do not start from scratch (Canadian Paediatric Society 2022) | Walkthrough, guideline |
| F2 | "Your space, your call" privacy screen in four short lines | Teens expect privacy and confidentiality (CPS 2023, ISPAD). Privacy notes should be short, layered and say "change it any time" (Privacy Commissioner of Canada) | Guideline |
| F3 | Progress style chosen in setup, including "Just my level" | Use of gamified teen apps faded over time (Goyal 2017). Autonomy supports behaviour change (Ntoumanis 2021). The young adult suggested the plant, classmates preferred stickers | Trials, mixed |
| F4 | Skippable "What do you already do?" self-check, shown in Visit mode as the teen's view | A capable older teen read Level 4 as "not even halfway there" (C2, P4). Teen and clinician ratings only weakly agree, so it never changes the level (Al Khalifah 2022) | Moderate |
| F5 | No notification request in setup. Reminders go to the calendar | Apple and Google advise against asking at launch. The young adult relies on calendar reminders weeks ahead (P4) | Guidance, early |
| F6 | Home: one level line, a strength-first sentence, one named next step, drafts hidden, honest note labels, "card on its way" | A new teen's first sentence was "Family does everything. 0 of 5". A draft note was labelled "Shown to future care teams" | Walkthrough |
| F7 | Parent setup and parent home: level, skills, who does what, next visit, tips. The teen switches each part on and always sees it | Parents stay involved after 18 and worry about their role (Pritlove 2020). Controlling talk backfires (Goethals 2019). Teens should see when they are being monitored (UK Children's Code) | Small studies, guideline |
| F8 | Adult view: consent says what Folio is and whose settings apply, optional viewer name for the access log | Testers asked who wrote the profile (C1). The old wording overstated what the teen chose at the tap | Moderate |
| F9 | Adult view "At a glance": allergies, insulin, devices, emergency contact with Call, big decisions, adult care, the teen's own words. Each item says who and when | ER and family doctors need a quick handoff (P1, P3). Canada's patient summary needs allergies. Clinicians trust patient-held notes by source and date (West 2017) | Strong |
| F10 | Portal: mock hospital sign-in, a one-time welcome card per role, "Handoffs shared" and "Cards to hand out" | Clinicians fear extra paperwork (P3). Folio should record checks they already do (P1). Tutorials did not help users (NN/g 2020), so there is no tour | Moderate |
| F11 | "Find an adult family doctor" in Run my care, and "no family doctor yet" in the adult view | In Ontario, having no primary care at transition was linked with more DKA or death (Shulman 2018) | Large study |

## Usability pass (v3, after the first-run update)

Every screen was reviewed against the interviews, the persona walkthrough and the published research. The rule: put what each person needs first, and take out what nobody in the research asked for. Things the team decided on purpose (the plant versus stickers test, the 10 levels, the "time saved" stub) were kept.

| ID | Change | Why (paraphrased) |
|---|---|---|
| U1 | Card shape choice removed from Add patient and Cards | Clinicians and coordinators never asked for it. It added a step to enrolment and a column to every row |
| U2 | "Asthma, Epilepsy, Cystic fibrosis: soon" removed from Levels and skills | Placeholders for packages that do not exist |
| U3 | Haptics test hidden (add ?debug=1 to see it) | A team test tool, not something teens use |
| U4 | Sticker book only shows when the teen chose stickers | Plant mode showed two reward systems at once |
| U5 | The full list of 10 levels is folded on Levels, and phase words (Aware, Involved) are gone from the teen app | Reference detail pushed the skills to work on down the page. The young adult did not care about levels |
| U6 | Intro animation plays once per device (?intro=1 replays it) | It cost about 2.5 seconds on every new session |
| U7 | Home stats show the real number at once | The count-up showed 0 for the first second |
| U8 | Teen Home order: status, a new note, a visit in the next 14 days, the next step, then the rest | Action and time-sensitive items first |
| U9 | Levels order: skills still to do, Run my care, what the next level unlocks, then progress art | Logistics were the hardest part at 18 (P4) |
| U10 | Resources: guides for the skills being learned come first | Teens should not search 16 guides for the right one |
| U11 | Allergies added to the teen's list, first. "Add your adult family doctor" prompt replaces an empty row | The adult view and ER need allergies first. Losing primary care was linked with more DKA (Shulman 2018) |
| U12 | Portal Patients sorted by who needs action first | Clinicians look for who needs a check-in |
| U13 | Cards sorted with cards to hand out first | The coordinator's next job |
| U14 | Patient profile: the teen's questions for this visit, skills and medications first. Level reference folded | The visit is about the teen's questions. "In Maya's words should be at the top" (C2) |
| U15 | Visit mode shows the teen's questions and a medication check | Earlier review: these were on other tabs and got missed |
| U16 | Adult view: handoff notes above the full medication list, skills above contacts, no duplicate "In Maya's words", no empty care team rows | P3 wants repeats, referrals and who takes over first |
| U17 | Portal Resources: guides waiting for a diabetes educator's review come first | They are drafts and should not go live unchecked |
| U18 | Access log newest first across every patient | It was grouped by patient, which hid recent opens |

## Design system v4

Every screen now uses the v4 design system from Claude Design. Screens behave the same as after the usability pass. A few small changes came from the system itself:

| ID | Change | Why |
|---|---|---|
| V1 | Notes carry a chip that says who will see them (You + care team, or Future care teams) | v4 notes pattern: visibility is always shown, so a teen knows what a new doctor reads |
| V2 | Run my care shows who owns each task, and a Take it on button for jobs the parent holds | v4 reminders pattern has an owner chip. It makes the hand-over from parent to teen a tap |
| V3 | My plant shows all ten plants, earned in colour and the next ones faded | v4 gives each level its own plant, so the teen can see what is ahead |
| V4 | The adult view's top bar is shorter on a phone and scrolls away | An ER doctor opens the card on a phone. The bar took a quarter of the screen |
| V5 | "On track" status has an icon like the other statuses | v4: status is always an icon plus words |
| V6 | Reduce motion now also stops smooth page scrolling | The old rule skipped the page itself |

Open questions for the team (plant in clinical tables, blood sugar chart, red star as a UI marker, card shapes, calendar view, icon set) are listed in [CLAUDE.md](CLAUDE.md) under Design system v4.

## Readiness check, goals and more (v5, from a competitor review)

We compared Folio with MyTransition (McMaster Children's Hospital and CanChild), a general transition app. We kept what works and made it specific to type 1 diabetes:

| ID | Change | Why |
|---|---|---|
| R1 | Setup step 4 is now a readiness check: 15 questions, 3 for each Folio skill, one per screen | MyTransition opens with the 14-item TRANSITION-Q. That scale is licensed (sold by CanChild) and not diabetes-specific, so Folio uses its own questions, shaped by Folio's five skills and the four READDY domains (Corathers et al. 2020) |
| R2 | Answers are Not yet, With help or On my own. Each skill shows the middle of its 3 answers. No single score | A bare number ("56") does not say what to work on and can feel like a grade. The words match the statuses clinicians already use |
| R3 | The teen retakes the check from Levels. Home prompts a retake when a visit is 2 weeks away and the last check is over 3 weeks old | MyTransition tracks its score over time. The care team sees the latest answers in Visit mode. The check never changes a level |
| R4 | Up to 3 goals from the check, each with 3 small steps and a guide. Goals replace the single next step on Home | MyTransition links goals to tips. Folio's steps are diabetes-specific and each ticked step grows the plant |
| R5 | My diabetes in 3 sentences, in About me. Adult doctors see it first, as "In Maya's words" | MyTransition's 3-sentence summary. Summarising your own history is a core transition skill |
| R6 | Coming up on Home: blood work, care tasks and refill dates, soonest first | MyTransition has a calendar of appointments and prescriptions. Folio uses the dates it already holds and phone calendar reminders |
| R7 | Four draft guides: alcohol, driving, sex and relationships, planning for pregnancy | A READDY study (Kamoun et al. 2022) found teens least confident about alcohol, tobacco, sexual health and pregnancy |

The questions, goal steps and new guides are drafts for a diabetes educator to review.

See [CONTRIBUTING.md](CONTRIBUTING.md) for how the four of us work in it, and [CLAUDE.md](CLAUDE.md) for the technical map.

## Level system v2 (each level has its own goal and skills)
Before, all 10 levels scored the same five skill areas, so every level felt the same. Now each level has its own goal and 4 skills of its own, 40 in all, so a teen always knows what this level is about and what "done" looks like.

| Level | Goal |
|---|---|
| 1 Observer | Learn your condition |
| 2 Learner | Know your daily routine |
| 3 Participant | Use your insulin and devices |
| 4 Contributor | Balance food and activity |
| 5 Partner | Handle highs, lows and sick days |
| 6 Manager | Speak up and book your visits |
| 7 Leader | Fit diabetes into your life |
| 8 Navigator | Run your supplies, records and coverage |
| 9 Planner | Take charge of privacy and consent |
| 10 Owner | Move to adult care and own it |

- **Why:** a level should feel like a chapter with its own goal. Each skill says what the teen can do ("I can ..."), three things to try, and what the clinic sees to sign it off.
- **Rule:** move up when 3 of the 4 skills are On my own (programs can pick 2 to 4 on Levels and skills), plus the in-person sign-off and the teen's confirmation. The override with a note is still there.
- **The five areas** (Know my health, Manage my care, Speak up, Run my care, Own my support) stay as theme tags for colour and reporting.
- **Stickers and plants:** every skill has its own sticker and every level its own plant with a name and a personality, so the rewards match what the teen learned.
- **Readiness check:** the same 15 questions now sample skills across the levels and suggest a starting level. A clinician applies it in Visit mode.
- **Adult view:** "What Maya can do on their own" grouped by area, newest first, and "Still building". No level numbers.
- **Review document:** `notes/level-curriculum.md`, made from data.js by `node tools/make-curriculum-doc.js`. The curriculum is a proposal and needs review by a diabetes educator.
