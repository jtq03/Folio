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
      can: 'Explain diabetes to someone else. Keep a simple glucose log. Take insulin on a routine with reminders.',
      evidence: 'Glucose log reviewed in clinic. Asks one prepared question.',
      unlocks: 'My own login, glucose log' },
    { n: 4, name: 'Contributor', phase: 'Involved', leads: 'Family guides, I contribute',
      can: 'Keep my own appointment list. Prepare 2 or 3 questions. Spend part of a visit alone with the clinician. Know my allergies and diabetes history basics.',
      evidence: 'Time alone with the clinician. Fills in the history form with help.',
      unlocks: 'Appointment list, my questions for next visit' },
    { n: 5, name: 'Partner', phase: 'Shared', leads: 'Shared, family backs up',
      can: 'Give my own insulin with spot checks. Walk through my low-sugar plan. Say how I am doing unprompted. Know who to call and when.',
      evidence: 'Low-sugar plan walk-through. Several weeks of my own routine without parent prompting.',
      unlocks: 'Low-sugar plan, who-to-call card' },
    { n: 6, name: 'Manager', phase: 'Shared', leads: 'I do, family backs up',
      can: 'Request my own insulin and supply refills. Book and reschedule appointments. Add records and links to my Folio. Explain my privacy and consent rights.',
      evidence: 'Books one appointment and requests one refill myself. Privacy teach-back.',
      unlocks: 'Add records and links to my Folio' },
    { n: 7, name: 'Leader', phase: 'Leading', leads: 'I lead, family on call',
      can: 'Set the agenda for my visit. Take part in a care decision, like a dose change. Manage school, work, travel and sleep around diabetes. Know what my insurance covers.',
      evidence: 'Leads a visit with my own agenda. Explains my insurance basics.',
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
    { id: 'run',     name: 'Run my appointments', sub: 'Keep your own appointment list' },
    { id: 'support', name: 'Own my support',      sub: 'Spend part of each visit alone with your doctor' }
  ];
  F.SKILL_STATUS = { learning: 'Learning', help: 'With help', own: 'On my own' };

  F.MOVE_UP_RULES = [
    'At least 4 of 5 skill areas meet the level, none is more than one level behind, the clinician signs off in person at a routine visit and the patient confirms. Family is informed, not given a veto.',
    'Pace: about 3 months minimum per level, typically 6 to 9. Starting around 13, ten levels is roughly 5 to 6 years. Not everyone reaches 10 by 18.',
    'A hard stretch, such as a high-glucose period or illness, pauses progress. It never costs a level. A starting assessment places teens who already have skills above Level 1.',
    'Proposal only: skills adapted from the five TRAQ readiness domains, written here for type 1 diabetes, and still to be tested with a diabetes clinician.'
  ];

  /* ---------- Resources (patient app) ---------- */
  F.RESOURCES = [
    { id: 'r1', title: 'What is the adult system like?', kind: 'Guide', mins: '5 min read', tags: ['Learn'],
      body: 'Adult clinics run differently. Appointments can be shorter, you are expected to speak for yourself, and nobody chases you if you miss a visit. That is not a bad thing. It means you are in charge. Folio helps you walk in already knowing the questions to ask.' },
    { id: 'r2', title: 'Prepare for your next visit', kind: 'Checklist', mins: '3 min', tags: ['Visits'],
      body: 'Before you go: write down 2 or 3 questions. Bring your Folio card. Check your medication list is up to date. Decide what you want to do alone and what you want a parent in the room for.' },
    { id: 'r3', title: 'How to ask a doctor a hard question', kind: 'Video', mins: '4 min', tags: ['Speaking up', 'Learn'],
      body: 'Start with "I want to understand...". Say the worry out loud before the question. If you do not follow the answer, say "Can you explain that another way?" Doctors want you to ask. Practise it once with someone you trust.' },
    { id: 'r4', title: 'Build your flare plan', kind: 'Worksheet', mins: '8 min', tags: ['Learn', 'Visits'],
      body: 'A flare plan answers three things: how I know something is wrong, what I do first, and who I call. Fill each in once while you feel fine so that you do not have to think about it on a bad day.' },
    { id: 'r5', title: 'Who do I call, and when?', kind: 'Guide', mins: '4 min read', tags: ['Learn'],
      body: 'Routine questions go to your clinic line. Urgent but not an emergency goes to the after-hours number. An emergency is always 911. Save all three in your Folio contacts so they are one tap away.' },
    { id: 'r6', title: 'Speaking up when you are nervous', kind: 'Video', mins: '6 min', tags: ['Speaking up'],
      body: 'Nerves are normal. Try this: tell the doctor you get anxious in new clinics and ask them to explain what they are doing as they go. Folio can put that line at the top of your profile so you never have to say it twice.' },
    { id: 'r7', title: 'Keeping your own appointment list', kind: 'Checklist', mins: '3 min', tags: ['Visits'],
      body: 'One list, one place: date, clinic, what it is for, and what you want to ask. Add reminders for the day before. Tick appointments off once you have been so that you can see the pattern.' },
    { id: 'r8', title: 'Using the adult pharmacy line', kind: 'Guide', mins: '4 min read', tags: ['Learn', 'Visits'],
      body: 'Adult pharmacies may ask you, not a parent, for refill details. Have your medication list ready, know your prescriber, and ask about delivery or reminders if remembering refills is hard.' }
  ];

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
            text: 'For the adult team: a routine keeps symptoms down. Does best when the plan is clear before the visit.' },
          { id: 'n2', kind: 'Visit takeaway', author: 'Dr. Okafor', role: 'peds', date: '2026-10-12', shared: true,
            text: 'Practise your flare plan out loud. Bring one soccer question.' },
          { id: 'n3', kind: 'Visit takeaway', author: 'Dr. Marsh', role: 'peds', date: '2026-09-14', shared: false,
            text: 'The new dose is working. Keep logging so we can see the pattern.' }
        ]
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
