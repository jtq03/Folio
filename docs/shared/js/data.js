/* Folio prototype data. Everything here is fictional demo data.
   Source: Figma Wireframes page ("Level system · Type 1 diabetes", patient app, clinician views).
   Skill and level wording is a PROPOSAL still to be tested with a diabetes clinician. */
window.Folio = window.Folio || {};

(function (F) {
  /* ---------- Level system (10 levels, 5 skill areas) ---------- */
  F.LEVELS = [
    { n: 1, name: 'Observer', phase: 'Aware', leads: 'Family does everything',
      can: 'Name my diabetes and what insulin is for. Tell a parent when I feel low or high.',
      evidence: 'Explains diabetes in my own words at a visit. Folio profile set up with a parent.',
      unlocks: 'Parent-managed profile, Folio ID card' },
    { n: 2, name: 'Learner', phase: 'Aware', leads: 'Family, with me present',
      can: 'Know my insulin types and doses. Spot the signs of a low and a high. Answer one clinician question myself. Carry my Folio card.',
      evidence: 'Answers "how are you feeling?" alone. Can name my insulin and doses.',
      unlocks: 'Read-only view of my own profile' },
    { n: 3, name: 'Participant', phase: 'Involved', leads: 'Family guides',
      can: 'Explain diabetes to someone else. Look at my sensor or pump data with my care team. Take insulin on a routine with reminders.',
      evidence: 'Talks through my sensor data in clinic. Asks one prepared question.',
      unlocks: 'My own login' },
    { n: 4, name: 'Contributor', phase: 'Involved', leads: 'Family guides, I contribute',
      can: 'Keep my own appointment list. Book my blood work at a time that fits school or work, and know if I need to fast. Prepare 2 or 3 questions. Spend part of a visit alone with the clinician. Know my allergies and diabetes history basics.',
      evidence: 'Time alone with the clinician. Fills in the history form with help.',
      unlocks: 'Appointment list, my questions for next visit' },
    { n: 5, name: 'Partner', phase: 'Shared', leads: 'Shared, family backs up',
      can: 'Give my own insulin with spot checks. Walk through my low-sugar plan. Say how I am doing unprompted. Know who to call and when.',
      evidence: 'Low-sugar plan walk-through. Several weeks of my own routine without parent prompting.',
      unlocks: 'Low-sugar plan, who-to-call card' },
    { n: 6, name: 'Manager', phase: 'Shared', leads: 'I do, family backs up',
      can: 'Request my own insulin refills and reorder pump and sensor supplies before they run out. Book and reschedule appointments. Add records and links to my Folio. Explain my privacy and consent rights.',
      evidence: 'Books one appointment and reorders one supply myself, without a parent reminding me. Privacy teach-back.',
      unlocks: 'Add records and links to my Folio' },
    { n: 7, name: 'Leader', phase: 'Leading', leads: 'I lead, family on call',
      can: 'Set the agenda for my visit. Take part in a care decision, like a dose change. Manage school, work, travel and sleep around diabetes. Know what my insurance and government funding cover for supplies, and who applies.',
      evidence: 'Leads a visit with my own agenda. Explains what covers my supplies and who applies.',
      unlocks: 'Visit agenda tool, share with clinicians' },
    { n: 8, name: 'Navigator', phase: 'Leading', leads: 'I lead end to end',
      can: 'Handle a new problem, like a sick day or a high, start to finish. Manage pharmacy and supply costs. Know what adult diabetes services exist. Decide what family sees.',
      evidence: 'Handles a real or simulated sick day. Shortlist of adult clinics.',
      unlocks: 'I control what my family can see' },
    { n: 9, name: 'Planner', phase: 'Independent', leads: 'I run it, preparing to move',
      can: 'Meet or choose my adult team. Move my records through my Folio. Do a joint or practice visit. Have an emergency plan and contacts.',
      evidence: 'First adult contact made. Transfer packet complete.',
      unlocks: 'Transfer packet for the adult team' },
    { n: 10, name: 'Owner', phase: 'Independent', leads: 'Me, family by invitation',
      can: 'Run all five areas. Advocate for myself with clinicians I have never met. Family helps because I ask.',
      evidence: 'Holds Level 9 steadily for months. Final sign-off and transfer.',
      unlocks: 'Full control, family access by invitation' }
  ];

  F.PHASE_TONE = { Aware: 'blue-100', Involved: 'blue-300', Shared: 'green-500', Leading: 'green-500', Independent: 'green-900' };

  /* Five skill areas scored at every level. status: learning | help | own */
  F.SKILLS = [
    { id: 'know',    name: 'Know my health',      sub: 'Name your condition, allergies and main history' },
    { id: 'manage',  name: 'Manage my care',      sub: 'Put meds on a routine with reminders' },
    { id: 'speak',   name: 'Speak up',            sub: 'Prepare 2 or 3 questions before a visit' },
    { id: 'run',     name: 'Run my care',         sub: 'Book visits and blood work, keep supplies from running out' },
    { id: 'support', name: 'Own my support',      sub: 'Spend part of each visit alone with your doctor' }
  ];
  F.SKILL_STATUS = { learning: 'Learning', help: 'With help', own: 'On my own' };
  /* One plain line per status, shown wherever the labels appear (research: testers could not tell With help from Learning) */
  F.SKILL_STATUS_HELP = { learning: 'Still learning how. Practising with the care team.', help: 'Does it with a reminder or a hand from family or the care team.', own: 'Does it without being reminded.' };

  F.MOVE_UP_RULES = [
    'At least 4 of 5 skill areas meet the level, none is more than one level behind, the clinician signs off in person at a routine visit and the patient confirms. Family is informed, not given a veto.',
    'Pace: about 3 months minimum per level, typically 6 to 9. Starting around 13, ten levels is roughly 5 to 6 years. Not everyone reaches 10 by 18.',
    'A hard stretch, such as a high-glucose period or illness, pauses progress. It never costs a level. A starting assessment places teens who already have skills above Level 1.',
    'Proposal only: skills adapted from the five TRAQ readiness domains, written here for type 1 diabetes, and still to be tested with a diabetes clinician.'
  ];

  /* ---------- Resources (patient app) ---------- */
  F.RESOURCES = [
    { id: 'r1', title: 'What is the adult system like?', kind: 'Guide', mins: '5 min read', tags: ['Learn'], skill: 'know',
      body: 'Adult clinics run differently. Appointments can be shorter, you are expected to speak for yourself, and nobody chases you if you miss a visit. That is not a bad thing. It means you are in charge. Folio helps you walk in already knowing the questions to ask.' },
    { id: 'r2', title: 'Prepare for your next visit', kind: 'Checklist', mins: '3 min', tags: ['Visits'], skill: 'speak',
      body: 'Before you go: write down 2 or 3 questions. Bring your Folio card. Check your medication list is up to date. Decide what you want to do alone and what you want a parent in the room for.' },
    { id: 'r3', title: 'How to ask a doctor a hard question', kind: 'Video', mins: '4 min', tags: ['Speaking up', 'Learn'], skill: 'speak',
      body: 'Start with "I want to understand...". Say the worry out loud before the question. If you do not follow the answer, say "Can you explain that another way?" Doctors want you to ask. Practise it once with someone you trust.' },
    { id: 'r4', title: 'Build your low-sugar plan', kind: 'Worksheet', mins: '8 min', tags: ['Learn', 'Visits'], skill: 'manage',
      body: 'A low-sugar plan answers three things: how I know I am going low, what I do first, and who I call. Fill each in once while you feel fine so that you do not have to think about it on a bad day. Go through it with your care team.' },
    { id: 'r5', title: 'Who do I call, and when?', kind: 'Guide', mins: '4 min read', tags: ['Learn'], skill: 'know',
      body: 'Routine questions go to your clinic line. Urgent but not an emergency goes to the after-hours number. An emergency is always 911. Save all three in your Folio contacts so they are one tap away.' },
    { id: 'r6', title: 'Speaking up when you are nervous', kind: 'Video', mins: '6 min', tags: ['Speaking up'], skill: 'speak',
      body: 'Nerves are normal. Try this: tell the doctor you get anxious in new clinics and ask them to explain what they are doing as they go. Folio can put that line at the top of your profile so you never have to say it twice.' },
    { id: 'r7', title: 'Keeping your own appointment list', kind: 'Checklist', mins: '3 min', tags: ['Visits'], skill: 'run',
      body: 'One list, one place: date, clinic, what it is for, and what you want to ask. Add reminders for the day before. Tick appointments off once you have been so that you can see the pattern.' },
    { id: 'r8', title: 'Using the adult pharmacy line', kind: 'Guide', mins: '4 min read', tags: ['Learn', 'Visits'], skill: 'run',
      body: 'Adult pharmacies may ask you, not a parent, for refill details. Have your medication list ready, know your prescriber, and ask about delivery or reminders if remembering refills is hard.' }
,
    /* v2 research additions: short type 1 diabetes guides linked to skills. Drafts until a diabetes educator reviews them. */
    { id: 'r9', title: 'Insulin at meals', kind: 'Guide', mins: '3 min read', tags: ['Learn'], skill: 'manage', review: true,
      body: 'Rapid-acting insulin covers the food you eat. Your care team sets your plan, including when to give it for a meal. Ask them how early to bolus and what to do if you forget. A meal reminder on your phone is a good first step.' },
    { id: 'r10', title: 'Carb counting basics', kind: 'Guide', mins: '4 min read', tags: ['Learn'], skill: 'manage', review: true,
      body: 'Carb counting means estimating the carbohydrates in a meal so your insulin matches it. Start with the foods you eat most, check labels, and ask your dietitian for a carb guide. Your care team gives you your own insulin-to-carb plan.' },
    { id: 'r11', title: 'Eating through the day', kind: 'Guide', mins: '3 min read', tags: ['Learn'], skill: 'know', review: true,
      body: 'Skipping meals can make your blood sugar harder to manage. Regular meals or snacks help keep things steady, especially on busy school or work days. Keep a snack and fast sugar with you so you are never caught out.' },
    { id: 'r12', title: 'Sports, exercise and lows', kind: 'Guide', mins: '4 min read', tags: ['Learn'], skill: 'manage', review: true,
      body: 'Activity usually lowers blood sugar, sometimes hours later. Check before, during and after sports, and carry fast sugar. Ask your care team how to adjust your plan for game days.' },
    { id: 'r13', title: 'Warning signs and when to call', kind: 'Checklist', mins: '3 min', tags: ['Learn'], skill: 'know', review: true,
      body: 'A low can feel shaky, sweaty or confused. A high can mean feeling very thirsty, peeing a lot or feeling tired. Follow your plan first. Call your care team if your numbers stay high or you feel sick. If you are throwing up or very unwell, get help right away, and call 911 in an emergency.' },
    { id: 'r14', title: 'What changes in adult care', kind: 'Guide', mins: '4 min read', tags: ['Learn', 'Visits'], skill: 'run', review: true,
      body: 'Adult care can mean more visits a year, with blood work before each one, and you book them yourself. Labs are often closed on weekends and some tests need fasting, so pick times that fit school or work. Reorder supplies and prescriptions early so they never run out.' },
    { id: 'r15', title: 'Reordering supplies before you run out', kind: 'Checklist', mins: '3 min', tags: ['Visits'], skill: 'run', review: true,
      body: 'Check how many sensors, infusion sets and insulin you have left. Reorder well before you run out, since deliveries can take time. Know your pharmacy, your supplier and who pays. Set a reminder so you are not relying on someone else to notice.' },
    { id: 'r16', title: 'Help paying for diabetes supplies', kind: 'Guide', mins: '3 min read', tags: ['Learn'], skill: 'run', review: true,
      body: 'Pumps and supplies can be expensive. Government programs and insurance may help cover them, and someone usually has to apply and renew. Ask your diabetes team which programs apply to you, who fills in the forms, and when they renew.' }
  ];

  /* ---------- v2 research fields: safe defaults for any patient (seed and saved demo data) ---------- */
  F.CARE_TASKS = [
    { id: 'k1', label: 'Book my blood work', detail: 'Labs are often closed on weekends. Check if it needs fasting.' },
    { id: 'k2', label: 'Reorder pump and sensor supplies', detail: 'Order well before you run out.' },
    { id: 'k3', label: 'Check how long my prescriptions last', detail: 'Know when repeats run out so you can book in time.' },
    { id: 'k4', label: 'Find out what covers my supplies', detail: 'Ask who applies for funding and when it renews.' }
  ];
  F.defaults = function (p) {
    if (!Array.isArray(p.meds)) p.meds = [];
    if (p.medsConfirmed === undefined) p.medsConfirmed = null;
    if (!Array.isArray(p.supportThisVisit)) p.supportThisVisit = [];
    if (p.decisionSupport === undefined) p.decisionSupport = null;
    if (!Array.isArray(p.careTasks)) p.careTasks = F.CARE_TASKS.map(function (t) { return { id: t.id, label: t.label, detail: t.detail, done: false }; });
    if (!p.plant || !Array.isArray(p.plant.events)) p.plant = { events: [] };
    return p;
  };

  /* ---------- Seed patients ---------- */
  function days(n) { return new Date(Date.UTC(2026, 9, 28) - n * 864e5).toISOString().slice(0, 10); }

  function P(id, first, last, age, folioId, level, skills, lastNote, attention, extra) {
    return Object.assign({
      id: id, first: first, last: last, age: age, folioId: folioId,
      condition: 'Type 1 diabetes', level: level, skills: skills, lastNote: lastNote, attention: !!attention,
      optedIn: true, transferred: false, celebrate: null,
      levelSignoff: { level: level, by: 'Dr. A. Okafor', date: days(60) },
      shareNotes: true,
      wantDoctorKnow: '', questions: [],
      howToWork: [], contacts: [], careTeam: [], links: [], notes: []
    }, extra || {});
  }
  function sk(a, b, c, d, e) { return { know: a, manage: b, speak: c, run: d, support: e }; }

  F.SEED = {
    v: 1,
    clinic: { doctor: 'Dr. A. Okafor', org: "Sample Children's Hospital", team: 'Paediatric team' },
    patients: [
      P('p1', 'Maya', 'R.', 17, '48210937', 4, sk('own', 'help', 'own', 'own', 'learning'), '2026-10-12', false, {
        levelSignoff: { level: 4, by: 'Dr. A. Okafor', date: '2026-09-14' },
        wantDoctorKnow: 'I get anxious in new clinics. Please explain what you are doing as you go. I still want a parent in the room for big decisions.',
        questions: ['Can I switch to the adult pharmacy line?', 'Who do I call after hours?'],
        howToWork: [
          { by: 'Patient: Maya', date: 'Oct 2026', text: 'I get anxious in new clinics. Please explain what you are doing as you go.' },
          { by: 'Peds team: Dr. Okafor', date: 'Sept 2026', text: 'Likes a parent in the room for big decisions. Offer part of the visit one-on-one.' },
          { by: 'Patient: Maya', date: 'Oct 2026', text: 'Texts or portal messages work better for me than phone calls.' }
        ],
        contacts: [
          { id: 'c1', name: 'Priya R.', rel: 'Mother, primary contact', phone: '(555) 010-2234', visible: true },
          { id: 'c2', name: 'Dev R.', rel: 'Father', phone: '(555) 010-8871', visible: true },
          { id: 'c3', name: 'Anika R.', rel: 'Sister, 21, emergency only', phone: '(555) 010-4410', visible: false }
        ],
        careTeam: [
          { id: 't1', name: 'Dr. A. Okafor', role: 'Paediatrician', phone: '(555) 010-3000' },
          { id: 't2', name: 'Dr. L. Marsh', role: 'Specialist (endocrinology)', phone: '(555) 010-3100' },
          { id: 't3', name: 'Not added yet', role: 'Adult family doctor', phone: '' },
          { id: 't4', name: 'Corner Pharmacy', role: 'Pharmacy', phone: '(555) 010-9900' }
        ],
        links: [
          { id: 'l1', title: 'Hospital records portal', sub: "Sample Children's Hospital", url: 'https://example.org/portal' },
          { id: 'l2', title: 'Current medication list (PDF)', sub: 'Added by Maya, Oct 2026', url: 'https://example.org/meds.pdf' },
          { id: 'l3', title: 'Specialist letter, endocrinology clinic', sub: 'Shared link, expires Dec 2026', url: 'https://example.org/letter' }
        ],
        notes: [
          { id: 'n1', kind: 'Handoff note', author: 'Dr. Okafor', role: 'peds', date: '2026-10-12', draft: true, shared: true,
            text: 'For the adult team: Maya does best when the plan is clear before the visit. Pump and sensor user. Recent A1C trend is in the linked records.',
            fields: { meds: 'Rapid-acting insulin by pump, long-acting pens as backup, glucagon. Repeats last until March 2027.', referrals: 'Adult endocrinology referral sent Oct 2026. Adult family doctor not chosen yet.', upcoming: 'Blood work due Dec 2026, before the next endocrinology visit.', managed: 'Insulin pump and glucose sensor since age 12. A1C trend in the hospital records portal.', watch: 'Lows after soccer. Gets anxious in new clinics, so explain each step.' } },
          { id: 'n2', kind: 'Visit takeaway', author: 'Dr. Okafor', role: 'peds', date: '2026-10-12', shared: true,
            text: 'Practise your low-sugar plan out loud. Bring one question about soccer days.' },
          { id: 'n3', kind: 'Visit takeaway', author: 'Dr. Marsh', role: 'peds', date: '2026-09-14', shared: false,
            text: 'The new dose is working. Keep logging so we can see the pattern.' }
        ],
        meds: [
          { id: 'm1', name: 'Rapid-acting insulin', detail: 'Through my insulin pump', kind: 'medication' },
          { id: 'm2', name: 'Long-acting insulin pens', detail: 'Backup if my pump stops working', kind: 'medication' },
          { id: 'm3', name: 'Glucagon', detail: 'For a severe low. My family knows where it is', kind: 'medication' },
          { id: 'm4', name: 'Glucose sensor', detail: 'Continuous glucose monitor', kind: 'supply' },
          { id: 'm5', name: 'Pump infusion sets', detail: 'Changed every few days', kind: 'supply' }
        ],
        medsConfirmed: { by: 'Dr. A. Okafor', date: '2026-10-12' },
        supportThisVisit: [
          { id: 's1', label: 'Big decisions', by: 'Peds team: Dr. Okafor', date: 'Oct 2026', text: 'Maya prefers a parent for major decisions. Explain options simply, check she understands, and ask if she wants a family member called.' },
          { id: 's2', label: 'Being seen alone', by: 'Peds team: Dr. Okafor', date: 'Oct 2026', text: 'She is still learning to be the only patient in the room. Explain each step as you go and ask what she needs.' }
        ],
        decisionSupport: { name: 'Priya R.', rel: 'Mother' },
        careTasks: [
          { id: 'k1', label: 'Book my blood work', detail: 'Labs are often closed on weekends. Check if it needs fasting.', done: false },
          { id: 'k2', label: 'Reorder pump and sensor supplies', detail: 'Order well before you run out.', done: false },
          { id: 'k3', label: 'Check how long my prescriptions last', detail: 'Know when repeats run out so you can book in time.', done: true },
          { id: 'k4', label: 'Find out what covers my supplies', detail: 'Ask who applies for funding and when it renews.', done: false }
        ],
        plant: { events: [
          { id: 'g1', type: 'practice', label: 'You set two insulin reminders', date: '2026-10-20' },
          { id: 'g2', type: 'careTask', label: 'You checked how long your prescriptions last', date: '2026-10-24' }
        ] }
      }),
      P('p2', 'Theo', 'K.', 15, '33901148', 2, sk('own', 'learning', 'help', 'learning', 'learning'), '2026-09-30', true),
      P('p3', 'Priya', 'S.', 16, '77142093', 7, sk('own', 'own', 'own', 'own', 'help'), '2026-10-22', false),
      P('p4', 'Jordan', 'L.', 17, '15028841', 5, sk('own', 'help', 'help', 'learning', 'learning'), '2026-10-03', false),
      P('p5', 'Sam', 'W.', 14, '99214470', 3, sk('help', 'learning', 'learning', 'learning', 'learning'), '2026-08-29', true),
      P('p6', 'Ana', 'M.', 18, '60483315', 9, sk('own', 'own', 'own', 'own', 'own'), '2026-10-20', false),
      P('p7', 'Eli', 'T.', 13, '22767089', 1, sk('learning', 'learning', 'learning', 'learning', 'learning'), '2026-10-08', false)
    ]
  };

  /* Fill in plain defaults so every patient has something to show in every view. */
  F.SEED.patients.forEach(function (p) {
    if (!p.contacts.length) p.contacts = [{ id: 'c' + p.id, name: 'Parent or guardian', rel: 'Primary contact', phone: '(555) 010-0000', visible: true }];
    if (!p.careTeam.length) p.careTeam = [{ id: 't' + p.id, name: 'Dr. A. Okafor', role: 'Paediatrician', phone: '(555) 010-3000' }];
    if (!p.howToWork.length) p.howToWork = [{ by: 'Peds team: Dr. Okafor', date: 'Oct 2026', text: 'Check in with ' + p.first + ' first, then the family.' }];
    if (!p.wantDoctorKnow) p.wantDoctorKnow = 'Nothing added yet.';
    F.defaults(p);
  });

  /* Doctor-facing and patient-facing copy that is shared across views */
  F.COPY = {
    noRecords: 'These open outside Folio. Folio stores no health records.',
    star: 'Your story, carried forward'
  };

  /* ---------- v2 additions: program settings, team, cards, access log, resources ---------- */
  F.SEED.v = 2;
  var AVP = { p1: 'a3', p2: 'a5', p3: 'a2', p4: 'a7', p5: 'a1', p6: 'a4', p7: 'a6' };
  F.SEED.patients.forEach(function (p) { p.avatar = AVP[p.id] || 'a1'; p.photo = ''; });
  F.SEED.program = { requiredSkills: 4, minMonths: 3, inPerson: true };
  F.SEED.me = 'u1';
  F.SEED.team = [
    { id: 'u1', name: 'Dr. A. Okafor', email: 'a.okafor@sample-childrens.example', role: 'Admin', title: 'Paediatrician', active: true, invited: false, avatar: 'a8' },
    { id: 'u2', name: 'Dr. L. Marsh', email: 'l.marsh@sample-childrens.example', role: 'Clinician', title: 'Endocrinologist', active: true, invited: false, avatar: 'a4' },
    { id: 'u3', name: 'Nina Park', email: 'n.park@sample-childrens.example', role: 'Nurse', title: 'Diabetes nurse educator', active: true, invited: false, avatar: 'a6' },
    { id: 'u4', name: 'Sam Ortiz', email: 's.ortiz@sample-childrens.example', role: 'Coordinator', title: 'Clinic coordinator', active: true, invited: false },
    { id: 'u5', name: 'Jo Bell', email: 'j.bell@sample-childrens.example', role: 'Clinician', title: 'Registrar', active: false, invited: true }
  ];
  F.ROLES = {
    Admin: 'Everything, including team, cards and settings.',
    Clinician: 'View patients, run visits, sign off levels, write notes.',
    Nurse: 'View patients, update skills, write notes. Cannot sign off a level.',
    Coordinator: 'Add patients and manage cards. Cannot see clinical notes.'
  };
  F.CARD_SHAPES = { rounded: 'Rounded card', square: 'Square corners', tab: 'Keyring tab' };
  var ATTN = { p2: 'No visit note since Sep 30', p5: 'Progress paused after illness. Check in.' };
  function tok(seed) {
    var a = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', x = 0, o = '';
    for (var i = 0; i < seed.length; i++) x = (x * 31 + seed.charCodeAt(i)) >>> 0;
    for (var j = 0; j < 22; j++) { x = (x * 1664525 + 1013904223) >>> 0; o += a[(x >>> 16) % a.length]; }
    return o;
  }
  F.SEED.patients.forEach(function (p) {
    p.attentionReason = p.attention ? ATTN[p.id] || 'Needs a check-in' : '';
    p.card = { status: p.id === 'p7' ? 'unassigned' : 'active', shape: 'rounded', token: tok('folio' + p.id), issued: '2026-0' + (3 + (+p.id.slice(1) % 5)) + '-1' + (+p.id.slice(1) % 9), lastTap: p.id === 'p1' ? '2026-10-12' : '' };
    if (p.id === 'p7') p.card.token = '';
  });
  F.SEED.resources = F.RESOURCES.map(function (r) { return Object.assign({ published: true }, r); });
  F.SEED.access = [
    { id: 'a1', pid: 'p1', who: 'Dr. A. Okafor', how: 'Portal', time: '2026-10-12T14:02:00' },
    { id: 'a2', pid: 'p1', who: 'Sample General ED', how: 'Card tap (NFC)', time: '2026-10-03T22:41:00' },
    { id: 'a3', pid: 'p3', who: 'Dr. L. Marsh', how: 'Portal', time: '2026-10-22T09:15:00' },
    { id: 'a4', pid: 'p6', who: 'Westside Adult Diabetes Clinic', how: 'Card tap (QR)', time: '2026-10-20T10:30:00' },
    { id: 'a5', pid: 'p4', who: 'Nina Park', how: 'Portal', time: '2026-10-03T11:20:00' }
  ];
})(window.Folio);
