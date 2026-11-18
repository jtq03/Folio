# Folio design system v4

Folio is an optional transition program that paediatric hospitals license for youth with chronic illness, starting with type 1 diabetes. It has three parts: **Levels** (ten stages of growing independence, signed off by the paediatric clinician), the **Profile** (notes from the patient and care team, with links to records) and the **Card** (an NFC tap, QR code or Folio ID on a card or lanyard that opens the profile).

Surfaces: teen patient app, paediatrician portal, adult care-team view, marketing website, physical card / lanyard / tag.

**Source of truth:** `Folio Design System v4.dc.html`. Older files (`Folio Design System.dc.html`, `v3`, `Folio Screens.dc.html`) are superseded.

## Sources
- Brand package (Figma): https://www.figma.com/design/zBltXrF40skJfuYEPxPjvn/Folio-Brand-Package--GBDA-402-Team-9-?node-id=0-1
- `uploads/Folio MVP Report Final.pdf`: problem, research, wireframes
- `uploads/brand_files-*.png`: logo, colour, type and brand-element pages
- `uploads/Plant_Graphics_Before_Eye_Changes (11)/`: the 10 level plants (copied to `assets/plants/01–10.png`)

## Principles
1. Plain before clever. Say what someone can do; never show scores to clinicians.
2. Show who sees what. Everything shareable carries a visibility chip.
3. Calm, never alarming. Red 500 is the star only; errors use Red 700 with an icon.
4. Grow at your pace. Celebrate progress; hand over tasks one at a time.

## Two densities
- **Teen app:** Fraunces headings, 28px card radius, pill buttons, mascot star, plants, celebrations.
- **Clinical (portal + adult view):** 14px radius, 6px-radius status pills, 14px table rows, no mascot. Plants appear only as a small readiness marker in tables.

## Content fundamentals
- Teen app speaks to "you". Clinical views use third person and the patient's name ("How to work with Maya").
- Sentence case everywhere. Uppercase only for small tracked labels.
- Grade 6–8 reading level. "Blood sugar", not "glycaemia".
- Every note shows author, date and visibility. Patient voice = Blue 100, care-team voice = Beige 200.
- Errors say what happened, what's safe, and what to do next ("Your visits are safe. Check your connection and try again.").
- No emoji.

## Visual foundations
- **Colour:** `tokens/colors.css`. Greens 500/800/900, Blues 100/300/500/700, Lime, Butter, Red 500 (star only), Beiges 50–300. Separate semantic set: success, info, warning, error — always with icon + words.
- **Type:** Fraunces (24px+, headlines, italic accent on 1–2 words) + Figtree (UI/body; alternates tested: Instrument Sans, Bricolage Grotesque, Onest). Body 16px min, 17px in teen app.
- **Spacing:** 4px base (4, 8, 12, 16, 24, 32, 48, 64).
- **Radius:** 14 clinical card · 16 input · 20 row · 28 card · 40 sheet · pill buttons/chips.
- **Depth:** no shadows at rest. Only floating elements (menus, toasts, FAB, sheets) get `0 12px 32px rgba(31,47,22,.18)`.
- **States:** hover darkens one step; pressed darkens again + scale .97; focus = 3px Beige gap + 3px #3F64A8 ring; loading keeps width; disabled = Beige 300 fill.
- **Targets:** 48px min in app, 40px in dense clinical tables. List rows 56px.
- **Motion:** 120 fast / 220 base / 320 slow / 420 celebrate. Standard `cubic-bezier(.2,.7,.2,1)`, celebrate `cubic-bezier(.34,1.56,.64,1)` (teen app only). Reduced motion: slides → fades, bounce → static, plant growth → crossfade.
- **Layout:** phone 375 (4 col, 16 margin, 12 gutter, top bar + 4 tabs); tablet 600–1023 (8 col, side rail); desktop portal 1024+ (12 col beside 240px sidebar, 1200 max).
- **Dark mode:** all three surfaces. Deep greens (#16241D page, #1F3128 surface), lime becomes primary action, status colours keep meaning with dark fills and light text.

## Brand elements
- **Mascot:** the red star with a round red face, big cream eyes with dark pupils looking right, small smile. Teen app, card and celebrations only.
- **Plants:** one per level — Tiny sprout, Seedling, Clover, Mini cactus, Succulent, Fern, Monstera, Palm, Pine, Giant oak. On a Sky tile (#AFE1DF), 22% radius, never cropped. Earned = full colour, current = dark ring, upcoming = 40% opacity.
- **Card shapes:** classic wallet card, vertical lanyard badge, round tag, star charm. All carry NFC, QR and Folio ID.

## Iconography
Lucide (CDN, `https://unpkg.com/lucide-static@0.460.0/icons/<name>.svg`) as a stand-in for the brand's paper-cut icons. 2px stroke, sizes 16/20/24/32, always with a label. Icon tiles: 32/40/48/64, icon at half size, colour by meaning (Blue 100 visits, Butter bloodwork, Lime 100 meds, Beige 200 notes, Error bg attention).

## Components covered in v4
Buttons (4 variants × 6 states), icon buttons, FAB, links · text fields + errors, text area, dropdown, date picker, time slots, search, switches, segmented controls, radio pills, checkboxes · list rows, cards, avatars, step counter · status pills, banners, inline notices, alerts, toasts · bottom sheet, dialog · loading/empty/error states · tab bar, top bar, portal sidebar, tabs, breadcrumbs · calendar, visit prep, reminders + task ownership, meds/supplies, notes, levels + sign-off, sharing + access log · clinical table, blood sugar chart.

## Index
- `Folio Design System v4.dc.html` — the full system (sections 00–23)
- `styles.css` — entry point (imports `tokens/*`)
- `tokens/` — colors, fonts, typography, spacing (radius, motion, targets)
- `assets/logo/` — wordmark, Levels mark, star, f icon
- `assets/plants/` — 10 level plants
- `SKILL.md`

## Open items
- SVG wordmark and f icon (current PNG is 269px wide).
- Final plant files with updated eyes, ideally transparent and compressed.
- Paper-cut icon set as SVG to replace Lucide.
