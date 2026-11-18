# Handoff: Folio design system v4

## Overview
Folio helps teens with chronic illness (starting with type 1 diabetes) move from paediatric to adult care. This package contains the full v4 design system: foundations, components and feature patterns for four surfaces:
- **Teen patient app** (iOS/Android, 375pt base)
- **Paediatrician portal** (desktop web, 1024px+)
- **Adult care-team view** (web, opened from a card tap / QR / Folio ID)
- **Marketing website**, plus the physical **card / lanyard / tag**

## About the design files
The files here are **design references built in HTML**. They show the intended look and behaviour; they are not production code. Recreate them in the target codebase's environment (e.g. React Native / Expo for the app, React or Next.js for the portal and website) using its own patterns. If no codebase exists yet, pick the best fit. A good default is Expo + React Native for the app and Next.js for the portal, adult view and site, sharing one token package.

Open `Folio Design System v4.dc.html` in a browser (keep `support.js` next to it) to see everything. Sections are numbered 00–23 and linked from the top nav.

## Fidelity
**High fidelity.** Colours, type, spacing, radii, states and copy are final for v4. Match them exactly. Screen layouts in the reference are pattern examples, not full flows. Build real screens from these patterns.

## Start here (suggested order for Claude Code)
1. Port `tokens/*.css` into the codebase's token format (CSS variables, Tailwind theme, or a TS theme object). Keep the token names.
2. Load fonts: Fraunces (opsz 9–144, 400/600, italic 400) and Figtree (400–700) from Google Fonts or self-hosted.
3. Build primitives in this order: Button, IconButton, TextField, Select, Switch, Checkbox, RadioPill, SegmentedControl, StatusPill, Avatar, ListRow, Card, Banner, Toast, BottomSheet, Dialog, TabBar, TopBar, Sidebar, Tabs, StepCounter, EmptyState, Skeleton.
4. Build the feature patterns: Calendar (month + week strip + event card + visit prep), Reminders/Tasks (with owner chip), Meds & supplies, Notes (composer + visibility + voice bubbles), Levels (bars + plant + sign-off + celebration), Sharing (toggles + access log), ClinicalTable, BloodSugarChart.
5. Add dark mode via `prefers-color-scheme` (tokens already included in `tokens/colors.css`).

## Design tokens

### Colour
| Token | Hex | Use |
|---|---|---|
| green-900 | #1F2F16 | Text, primary buttons |
| green-800 | #23392F | Dark surfaces, hero, portal sidebar |
| green-500 | #395B50 | Headlines, checked controls, highlight cards |
| lime | #D4E875 | Progress, active tab pill, primary on dark |
| lime-100 | #EFF6C6 | Selected rows, meds tile |
| butter | #F6D978 | Bloodwork, highlights |
| red-500 | #CE3B3B | **Star + mascot only.** Never for UI. |
| blue-100 | #C5D1EB | Patient voice, visit tiles |
| blue-300 | #92AFD7 | Visit events, shapes |
| blue-500 | #5A7684 | Icons, lines (18px+ text only) |
| blue-700 | #3F5966 | Secondary text, links |
| beige-50 | #FCF8F1 | Cards / surfaces |
| beige-100 | #F7F0E2 | Page background |
| beige-200 | #F0E3CE | Care-team voice, sunken, segmented track |
| beige-300 | #E9DCC3 | Lines, disabled fill |
| line-strong | #8E876B | Input borders |
| focus | #3F64A8 | Focus ring |
| plant-tile | #AFE1DF | Plant backgrounds |

Semantic (always with icon + words):
| | Background | Foreground |
|---|---|---|
| Success | #DDEBD3 | #2F5D3A |
| Info | #DCE5F5 | #2F5585 |
| Warning | #FBEFC4 | #6E5200 |
| Error | #F7DCD8 | #A8302F |

Dark mode: page #16241D, surface #1F3128, raised #29402F, text #F3EDE0, text-2 #B9C7BD, line #34493D, primary action = lime, focus #8FB0F0. Dark semantic pairs are in `tokens/colors.css`.

### Typography
- Display / headings: **Fraunces** 600, sentence case, 24px and up only. Italic 400 accent on 1–2 words per heading.
- UI / body: **Figtree**.

| Style | Spec |
|---|---|
| Display | Fraunces 600 72/68 |
| H1 | Fraunces 600 48/52 |
| H2 | Fraunces 600 28/32 |
| H3 | Fraunces 600 24/28 |
| Card title | Fraunces 600 20/24 |
| Body L | Figtree 500 18/28 |
| Body | Figtree 500 16/24 (17 in teen app) |
| UI / button | Figtree 700 15/20 |
| Small | Figtree 500 13–14/18–20 |
| Label | Figtree 700 12/16, uppercase, +0.08em |

### Spacing, radius, elevation
- Spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- Radius: 14 clinical card · 16 input · 20 list row / small card · 28 card · 40 sheet · 999 buttons, chips, pills. Clinical status pills 6.
- Elevation: none at rest. Floating only (toast, FAB, menu, sheet): `0 12px 32px rgba(31,47,22,.18)`. Dialog scrim `rgba(31,47,22,.55)`.
- Targets: 48px minimum (app), 40px (dense clinical). List rows 56px min.

### Motion
- Fast 120ms (taps, toggles) · Base 220ms (sheets, dialogs, push) · Slow 320ms (charts, plant fades) · Celebrate 420ms (level-up, teen app only).
- Standard `cubic-bezier(.2,.7,.2,1)`; exit `cubic-bezier(.4,0,1,1)` at 80% duration; celebrate `cubic-bezier(.34,1.56,.64,1)`.
- Reduced motion: slides → 120ms fades, page push → instant, bounce → static, plant growth → crossfade, chart draw → complete, shimmer → static.

### Layout
- Phone 375: 4 columns, 16 margin, 12 gutter. Top bar + 4-tab bar.
- Tablet 600–1023: 8 columns, 32 margin, 16 gutter. Tab bar becomes a side rail. Cards go 2-up.
- Desktop portal 1024+: 240px sidebar + 12 columns, 32 margin, 24 gutter, 1200 content max.
- Must reflow to one column at 200% text zoom.

## Component specs (key states)
- **Button** (pill, 48h, 0 20 padding, Figtree 700 15): Primary green-900 → hover green-500 → pressed #152010 + scale .97. Highlight lime → #C6DC5E → #B5CB4C. Secondary 2px green-900 outline → hover beige-200 fill. Danger 2px #A8302F outline → hover error bg. Focus: `0 0 0 3px #FCF8F1, 0 0 0 6px #3F64A8`. Loading: 16px spinner + "Saving", width fixed. Disabled: beige-300 fill, #6B6858 text. One primary per screen; destructive always confirms.
- **IconButton**: 48 circle, 22 icon, requires aria-label.
- **FAB**: 56h pill, icon + label, only on Notes and Calendar, 16px above tab bar.
- **TextField**: label above (700 14), 48h, 2px #8E876B border, 16 radius. Focus border green-900 + ring. Error border #A8302F + icon + message "how to fix". Disabled beige-100 fill. Validate on blur.
- **Switch**: 52×30 track, 24 knob. On = green-500 track, lime knob with check. Off = #C9BFA6 track.
- **Checkbox**: 24, 7 radius, green-500. States: checked, unchecked, mixed, disabled.
- **RadioPill**: 44h pill; selected = green-900 fill + check icon.
- **SegmentedControl**: beige-200 track, 4 padding; selected beige-50 with subtle shadow. 2–4 options.
- **StatusPill**: app = pill 5/12 padding; clinical = 6 radius 3/8 padding, 12px. Icon always on, 2 words max.
- **ListRow**: 56 min, leading tile/avatar, two-line text, one trailing element.
- **Avatar**: 24/32/40/56. Patient blue-100, clinician green-500 + lime role badge, family butter. Stack with −10 overlap + 3px surface border.
- **Banner**: one per screen under top bar; semantic bg; optional action; dismissible unless action required.
- **Toast**: green-900, 18 radius, above tab bar, 5s (longer with action), never critical health info.
- **BottomSheet**: 32 top radius, 40×5 grabber. **Dialog**: 28 radius, max 320 wide, icon tile + title + body + stacked buttons.
- **TabBar**: 4 tabs, labels always visible; active = 56×32 lime pill behind icon + bold label.
- **Sidebar (portal)**: green-800, active item green-500, badge lime.
- **StepCounter**: segmented bars (≤4 steps) or numbered circles; always name the current step.
- **Screen states**: every screen designs loading (skeleton after 300ms), empty (mascot + one action, teen app only), error (what happened / what's safe / try again), full.

## Brand elements
- **Logo**: `assets/logo/folio-wordmark-cream.png` with `star.svg` overlaid at left 59%, top 16%, width 15% (dot of the i). Levels mark: `levels-mark-dark.svg` / `levels-mark-light.svg`.
- **Mascot**: the red star (`star.svg`) rotated −8°, with a red circle face (44% of star size), two cream eyes (32% of face) with dark #2A2420 pupils offset to the upper right, and a small smile. Teen app, card and celebrations only.
- **Plants**: `assets/plants/01–10.png`, one per level: Tiny sprout, Seedling, Clover, Mini cactus, Succulent, Fern, Monstera, Palm, Pine, Giant oak. Shown on the plant tile at 22% radius, never cropped. Earned = full colour, current = 3px green-900 outline offset 3, upcoming = 40% opacity. In clinical tables, 20px plant inside the readiness pill.
- **Card shapes**: classic wallet card (85.6×54mm), vertical lanyard badge (54×85.6mm), round tag (40mm), star charm (45mm). All carry NFC + QR + Folio ID; medical-alert line optional.

## Interactions & behaviour
- Notes always show author, date and visibility (Only me / Care team / Family). Patient bubbles blue-100 with an 8px bottom-left corner; care-team bubbles beige-200 with an 8px bottom-right corner.
- Tasks show an owner chip (You = lime, Mom/family = blue-100) and a "Take it on" handover prompt.
- Levels: clinician sign-off moves a skill to Signed off. Completing a level triggers the celebration card (green-800, star, "You're a Partner now").
- Sharing: per-item toggles; access log lists who opened the profile, how (tap / ID / portal) and when; "Lost my card" deactivates the card.
- Calendar event colours: visit blue-300, bloodwork butter, refill lime; today = filled green-900; unavailable picker days are struck through.

## State to model
Patient profile, level + skills (with sign-off status, clinician, date), calendar events (type, date, location, prep checklist), tasks (owner, due, done), meds/supplies (days left, status), notes (author, type, visibility, visit link), sharing settings, access log, care team members, theme (light/dark), reduced motion.

## Content rules
Teen app speaks to "you"; clinical views use third person and the patient's name. Sentence case. Grade 6–8 reading level. No emoji. Errors say what happened, what's safe, what to do next.

## Assets
- `assets/logo/*` from the team's brand package (Figma: https://www.figma.com/design/zBltXrF40skJfuYEPxPjvn/Folio-Brand-Package--GBDA-402-Team-9-).
- `assets/plants/*` from the team's plant illustrations (pre eye-change versions; ~1.4MB each, so compress them and export with transparent backgrounds before shipping).
- Icons: Lucide (`lucide-react` / `lucide-react-native`), 2px stroke, 16/20/24/32. A stand-in for the brand's paper-cut icon set.

## Files
- `Folio Design System v4.dc.html` — visual reference for everything above (open in a browser; needs `support.js` beside it).
- `styles.css` + `tokens/` — CSS variables ready to port (colours incl. dark mode, fonts, typography, spacing, radius, motion).
- `DESIGN_GUIDE.md` — the brand/design guide.
- `SKILL.md` — drop the folder into `.claude/skills/folio-design/` so Claude Code loads the brand rules automatically.
