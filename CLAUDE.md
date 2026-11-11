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
- QR codes are decorative, not scannable. NFC is simulated by the tap link.
- Level system is 10 levels from the Figma wireframes. The video drew 7 steps. Settle the count as a team.
- Figma wireframes mix "Crohn's/GI" and "Type 1 diabetes" for Maya. The code uses Type 1 diabetes (matches the level system and MVP flow).
- Wireframe sign-off lets a clinician advance with a skill still Learning plus a note. Visit mode keeps that, behind an explicit override.
- The 47% stat chip from the video is intentionally not used: its source (Shulman 2018 vs Toulany 2022) is unconfirmed.
- Off-palette video pieces (yellow star, sun, clock) are not used.
- Fonts load from Google Fonts. Offline, the app falls back to Georgia and system-ui until fonts are cached.
- Compliance wording in Settings is a prototype checklist, not legal advice.
- Prototype type still needs instructor approval before committing to this build as the graded deliverable.

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
- Test sheet: About me, Prototype, Test haptics (`docs/app/haptics.js`). Real switch buzzes but buttons do not: code haptics are blocked by iOS. Neither buzzes: System Haptics off, Low Power Mode, or iOS too old.
- If it breaks: check the test sheet log first, then the ios-haptics npm package for the current trick (v3.3 lays an invisible label over each button so the user's own tap toggles the switch).
