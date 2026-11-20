/* Writes notes/level-curriculum.md from docs/shared/js/data.js, so the review document always matches the app.
   Run from the repo root: node tools/make-curriculum-doc.js */
const fs = require('fs'), path = require('path');
global.window = {}; global.document = {};
require(path.join(__dirname, '..', 'docs', 'shared', 'js', 'data.js'));
const F = window.Folio;
const res = {}; F.RESOURCES.forEach(r => { res[r.id] = r; });
const area = id => F.AREA_BY_ID[id].name;
const L = [];
const WHY = {
  1: 'Understanding comes first. A teen who can say what type 1 is and why insulin matters has a reason for everything that follows.',
  2: 'Daily routines (insulin names, checking glucose, treating a low) are the safety floor, and answering for yourself starts the habit of speaking up early.',
  3: 'Once the routine is known, the teen does it with their hands: giving insulin, changing sites and reading data with the team.',
  4: 'Food and activity build on dosing. Time alone with the clinician starts here, in line with CPS 2023 advice to offer it from early adolescence.',
  5: 'Highs, lows and sick days need the earlier skills in place. Teaching friends and coaches spreads safety beyond the family.',
  6: 'With self-care steady, the focus turns to the conversation and the calendar: speaking up, raising problems, booking visits and naming mood.',
  7: 'School, work, driving, parties and relationships are where independence is tested, and READDY found teens least confident about these health behaviours.',
  8: 'Supplies, pharmacy, coverage and records are the health system navigation skills adult care assumes, and the area where teens most often rely on parents.',
  9: 'Privacy and consent come just before transfer, so the teen controls family sharing and decisions before adult teams take over.',
  10: 'The last level is the move itself: finding the adult team, sending records and speaking up with clinicians they have never met.'
};
L.push('# Folio level curriculum (type 1 diabetes)', '');
L.push('> Generated from `docs/shared/js/data.js` by `node tools/make-curriculum-doc.js`. Do not edit by hand; change data.js and run the script again.', '');
L.push('**Status: proposal. ' + F.CURRICULUM_FLAG + '**', '');
L.push('Each of the 10 levels has its own goal and 4 skills, 40 in all. A teen moves up when at least 3 of the 4 skills in their level are On my own (a program can set 2 to 4), a clinician signs off in person at a routine visit, and the teen confirms. The five areas (Know my health, Manage my care, Speak up, Run my care, Own my support) are kept as theme tags for colour and reporting.', '');
L.push('Sources: Folio\'s earlier 10-level proposal (level names and "can" text), the TRAQ and READDY readiness domains (knowledge, self-management, speaking up, health system navigation, health behaviours) and the Canadian Paediatric Society 2023 transition position statement. No licensed questionnaire items are copied.', '');
L.push('## Coverage by area', '');
L.push('| Level | Goal | ' + F.AREAS.map(a => a.name).join(' | ') + ' |');
L.push('|---|---|' + F.AREAS.map(() => '---').join('|') + '|');
F.LEVELS.forEach(l => { L.push('| ' + l.n + ' ' + l.name + ' | ' + l.goal + ' | ' + F.AREAS.map(a => l.skills.filter(s => s.area === a.id).length || '').join(' | ') + ' |'); });
L.push('| **Total** | | ' + F.AREAS.map(a => '**' + F.ALL_SKILLS.filter(s => s.area === a.id).length + '**').join(' | ') + ' |', '');
F.LEVELS.forEach(l => {
  L.push('## Level ' + l.n + ': ' + l.name + '. ' + l.goal, '');
  L.push('*' + l.intro + '*', '');
  L.push('- **Phase:** ' + l.phase + '. **Who leads:** ' + l.leads + '. **Folio unlocks:** ' + l.unlocks);
  L.push('- **Plant:** ' + l.plant.name + ' ("' + l.plant.nick + '"), ' + l.plant.trait.charAt(0).toLowerCase() + l.plant.trait.slice(1) + '. ' + l.plant.story);
  L.push('- **Plant lines:** ' + l.plant.pokes.map(x => '"' + x + '"').join(' / ') + ' Idle: "' + l.plant.idle + '"');
  L.push('- **Why this order:** ' + WHY[l.n], '');
  l.skills.forEach(s => {
    const st = s.sticker;
    L.push('### ' + s.id + ' ' + s.name + ' (' + area(s.area) + ')', '');
    L.push('**' + s.can + '**', '');
    L.push('How:');
    s.how.forEach((x, i) => L.push((i + 1) + '. ' + x));
    L.push('', '- **What the clinic sees:** ' + s.evidence);
    L.push('- **Guide:** ' + (s.guide ? res[s.guide].title + ' (' + s.guide + (res[s.guide].review ? ', draft for educator review' : '') + ')' : 'none yet'));
    L.push('- **Sticker:** ' + st.name + '. ' + st.shape + ', ' + st.color + ', ' + st.icon + ' icon, ' + st.material + ', size ' + st.size + '. ' + st.story + ' *' + st.detail + '.* Back: "' + st.back + '"', '');
  });
});
L.push('## Readiness check mapping', '');
L.push('The 15 readiness check questions keep their wording and ids. Each now samples skills in the curriculum, and the answers suggest a starting level (the first level whose sampled answers are not all On my own). A clinician applies the suggestion in Visit mode; the check never changes a level by itself.', '');
L.push('| Question | Samples |', '|---|---|');
F.CHECK.forEach(q => L.push('| ' + q.id + ' ' + q.q + ' | ' + q.skills.map(id => id + ' ' + F.SKILL_BY_ID[id].name).join(', ') + ' |'));
const unsampled = F.ALL_SKILLS.filter(s => !F.CHECK.some(q => q.skills.indexOf(s.id) >= 0));
L.push('', 'Not sampled by any question: ' + unsampled.map(s => s.id + ' ' + s.name).join(', ') + '.', '');
L.push('## Open questions for the diabetes educator', '');
[
  'Is the order right? In particular, should highs, lows and sick days (Level 5) come before food and activity (Level 4)?',
  'Are 4 skills per level and "3 of 4 on their own" the right bar, or should some safety skills (treating a low, sick days) be required at every level?',
  'Level 7 "Parties and relationships" covers alcohol, sex and safety. Is this the right level and wording for a 15 to 16 year old?',
  'Level 9 "Yes, no or not yet" and "My privacy rights" need a check against Ontario consent law (PHIPA, Health Care Consent Act).',
  'Which skills need a written guide? Skills with no guide yet: ' + F.ALL_SKILLS.filter(s => !s.guide).map(s => s.id).join(', ') + '.',
  'Do the "What the clinic sees" lines match what a nurse educator can realistically observe in a routine visit?',
  'Should glucagon teaching sit with the low plan (L5-01) or earlier with treating a low (L2-03)?',
  'The readiness check samples ' + (F.ALL_SKILLS.length - unsampled.length) + ' of ' + F.ALL_SKILLS.length + ' skills. Which unsampled skills most need a question?'
].forEach(x => L.push('- ' + x));
L.push('');
const out = path.join(__dirname, '..', 'notes', 'level-curriculum.md');
fs.writeFileSync(out, L.join('\n'));
console.log('Wrote ' + out + ' (' + F.ALL_SKILLS.length + ' skills)');
