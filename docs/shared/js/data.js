/* Folio prototype data. Everything here is fictional demo data.
   Source: Figma Wireframes page ("Level system · Type 1 diabetes", patient app, clinician views).
   Skill and level wording is a PROPOSAL still to be tested with a diabetes clinician. */
window.Folio = window.Folio || {};

(function (F) {
  /* ---------- Level system (10 levels, 5 skill areas) ---------- */
  F.LEVELS = [
    { n: 1, name: 'Observer', phase: 'Aware', you: 'Your family leads for now. You watch and learn how it works.', leads: 'Family does everything',
      can: 'Name my diabetes and what insulin is for. Tell a parent when I feel low or high.',
      evidence: 'Explains diabetes in my own words at a visit. Folio profile set up with a parent.',
      unlocks: 'Parent-managed profile, Folio ID card' },
    { n: 2, name: 'Learner', phase: 'Aware', you: 'Your family leads, and you are part of it.', leads: 'Family, with me present',
      can: 'Know my insulin types and doses. Spot the signs of a low and a high. Answer one clinician question myself. Carry my Folio card.',
      evidence: 'Answers "how are you feeling?" alone. Can name my insulin and doses.',
      unlocks: 'Read-only view of my own profile' },
    { n: 3, name: 'Participant', phase: 'Involved', you: 'Your family guides you as you start doing parts yourself.', leads: 'Family guides',
      can: 'Explain diabetes to someone else. Look at my sensor or pump data with my care team. Take insulin on a routine with reminders.',
      evidence: 'Talks through my sensor data in clinic. Asks one prepared question.',
      unlocks: 'My own login' },
    { n: 4, name: 'Contributor', phase: 'Involved', you: 'Your family guides, and you pitch in.', leads: 'Family guides, I contribute',
      can: 'Keep my own appointment list. Book my blood work at a time that fits school or work, and know if I need to fast. Prepare 2 or 3 questions. Spend part of a visit alone with the clinician. Know my allergies and diabetes history basics.',
      evidence: 'Time alone with the clinician. Fills in the history form with help.',
      unlocks: 'Appointment list, my questions for next visit' },
    { n: 5, name: 'Partner', phase: 'Shared', you: 'You and your family share it. They back you up.', leads: 'Shared, family backs up',
      can: 'Give my own insulin with spot checks. Walk through my low-sugar plan. Say how I am doing unprompted. Know who to call and when.',
      evidence: 'Low-sugar plan walk-through. Several weeks of my own routine without parent prompting.',
      unlocks: 'Low-sugar plan, who-to-call card' },
    { n: 6, name: 'Manager', phase: 'Shared', you: 'You do most of it. Your family backs you up.', leads: 'I do, family backs up',
      can: 'Request my own insulin refills and reorder pump and sensor supplies before they run out. Book and reschedule appointments. Add records and links to my Folio. Explain my privacy and consent rights.',
      evidence: 'Books one appointment and reorders one supply myself, without a parent reminding me. Privacy teach-back.',
      unlocks: 'Add records and links to my Folio' },
    { n: 7, name: 'Leader', phase: 'Leading', you: 'You lead. Your family is there if you call.', leads: 'I lead, family on call',
      can: 'Set the agenda for my visit. Take part in a care decision, like a dose change. Manage school, work, travel and sleep around diabetes. Know what my insurance and government funding cover for supplies, and who applies.',
      evidence: 'Leads a visit with my own agenda. Explains what covers my supplies and who applies.',
      unlocks: 'Visit agenda tool, share with clinicians' },
    { n: 8, name: 'Navigator', phase: 'Leading', you: 'You lead from start to finish.', leads: 'I lead end to end',
      can: 'Handle a new problem, like a sick day or a high, start to finish. Manage pharmacy and supply costs. Know what adult diabetes services exist. Decide what family sees.',
      evidence: 'Handles a real or simulated sick day. Shortlist of adult clinics.',
      unlocks: 'I control what my family can see' },
    { n: 9, name: 'Planner', phase: 'Independent', you: 'You run it and get ready to move to adult care.', leads: 'I run it, preparing to move',
      can: 'Meet or choose my adult team. Move my records through my Folio. Do a joint or practice visit. Have an emergency plan and contacts.',
      evidence: 'First adult contact made. Transfer packet complete.',
      unlocks: 'Transfer packet for the adult team' },
    { n: 10, name: 'Owner', phase: 'Independent', you: 'You own it. Family helps when you ask.', leads: 'Me, family by invitation',
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
      body: 'Pumps and supplies can be expensive. Government programs and insurance may help cover them, and someone usually has to apply and renew. Ask your diabetes team which programs apply to you, who fills in the forms, and when they renew.' },
    /* v5: health behaviour guides. A diabetes-specific readiness study (READDY, Kamoun et al. 2022) found teens least confident
       about alcohol, tobacco, sexual health and pregnancy. Drafts until a diabetes educator reviews them. */
    { id: 'r17', title: 'Alcohol and type 1 diabetes', kind: 'Guide', mins: '4 min read', tags: ['Learn'], skill: 'manage', review: true,
      body: 'Alcohol can cause lows, sometimes many hours later and overnight. If you drink, eat carbs with it and check your glucose more often, including before bed. Tell a friend you have diabetes and how to help, because a low can look like being drunk. Carry something that says you have diabetes. Make a plan with your care team before a party.' },
    { id: 'r18', title: 'Driving with type 1 diabetes', kind: 'Guide', mins: '3 min read', tags: ['Learn'], skill: 'manage', review: true,
      body: 'Check your glucose before you drive and every few hours on long trips. Never drive when you are low. Treat it first and wait until you feel fine and your glucose is back where your care team says it should be. Keep fast sugar in the car. Ask your care team what the licence rules are where you live.' },
    { id: 'r19', title: 'Sex, relationships and diabetes', kind: 'Guide', mins: '3 min read', tags: ['Learn'], skill: 'support', review: true,
      body: 'Sex is physical activity, so it can lower your blood sugar. Keep fast sugar close by. If you wear a pump, ask your care team what to do with it. Birth control and safer sex are normal questions to ask your care team, and they will not judge. Condoms also protect against infections.' },
    { id: 'r20', title: 'Planning for pregnancy one day', kind: 'Guide', mins: '3 min read', tags: ['Learn'], skill: 'know', review: true,
      body: 'If you might want children one day, planning ahead matters with type 1 diabetes. Blood sugar before and early in pregnancy affects the baby, so care teams plan it with you first. Until then, use birth control that works for you. You can ask your care team about this at any age, even years ahead.' }
  ];

  /* ---------- v5 readiness check: 15 diabetes questions, 3 per Folio skill ----------
     Written for Folio, not copied from a licensed scale (TRANSITION-Q is sold by CanChild). Topics follow Folio's five skills and the
     four READDY domains (diabetes knowledge, health system navigation, insulin self-management, health behaviours).
     Answers use Folio's own words. A skill's result is the middle of its three answers, so no single score is ever shown.
     The check is the teen's view: it never changes a level or a skill status. Each question doubles as a goal with three small steps.
     Questions and steps are drafts for a diabetes educator to review. */
  F.CHECK_ANS = [
    { v: 'learning', label: 'Not yet', sub: 'I don\'t do this yet' },
    { v: 'help', label: 'With help', sub: 'With a reminder or a hand' },
    { v: 'own', label: 'On my own', sub: 'Without being reminded' }
  ];
  F.CHECK_WORD = { learning: 'Not yet', help: 'With help', own: 'On my own' };
  F.CHECK = [
    { id: 'q1', skill: 'know', q: 'I can explain type 1 diabetes to someone new in a few sentences.', goal: 'Explain my diabetes in a few sentences', link: '#/about', linkLabel: 'My diabetes in 3 sentences',
      steps: ['Write your 3 sentences in About me.', 'Say them out loud once to someone at home.', 'Say them at your next visit before anyone else answers.'] },
    { id: 'q2', skill: 'know', q: 'I know the signs of a low and a high, and what to do first.', goal: 'Know my lows and highs, and what to do first', res: 'r13',
      steps: ['Read Warning signs and when to call.', 'Write down the first thing you do for a low.', 'Show someone at home where your fast sugar is.'] },
    { id: 'q3', skill: 'know', q: 'I can name my insulin, my devices and any allergies.', goal: 'Name my insulin, devices and allergies', link: '#/about', linkLabel: 'My medications and allergies',
      steps: ['Check that your list in About me is complete.', 'Say your insulin names out loud without looking.', 'Ask your care team to confirm the list at your next visit.'] },
    { id: 'q4', skill: 'manage', q: 'I work out and give my own insulin for meals.', goal: 'Give my own insulin for meals', res: 'r9',
      steps: ['Read Insulin at meals.', 'Set a meal reminder on your phone.', 'Work out one meal dose yourself, then check it with someone.'] },
    { id: 'q5', skill: 'manage', q: 'I change my sensor and my pump site or pen needles when they are due.', goal: 'Change my sensor and sites on time',
      steps: ['Ask your care team to watch you do one change.', 'Put the next change date in your calendar.', 'Do the next one yourself, with someone nearby.'] },
    { id: 'q6', skill: 'manage', q: 'I follow my plan on sick days and sports days.', goal: 'Follow my plan on sick days and sports days', res: 'r12',
      steps: ['Read Sports, exercise and lows.', 'Ask your care team for your sick day plan and save a photo of it.', 'Pack fast sugar in your sports bag.'] },
    { id: 'q7', skill: 'speak', q: 'At visits, I answer questions about how I am doing myself.', goal: 'Answer my care team\'s questions myself', res: 'r3',
      steps: ['Before the visit, ask your parent to let you answer first.', 'Think about how the last few weeks went.', 'If you do not follow a question, say "Can you explain that another way?"'] },
    { id: 'q8', skill: 'speak', q: 'I bring 2 or 3 of my own questions to each visit.', goal: 'Bring my own questions to visits', res: 'r2',
      steps: ['Add one question in About me when it comes to mind.', 'Read Prepare for your next visit.', 'Ask at least one of them yourself.'] },
    { id: 'q9', skill: 'speak', q: 'I tell my care team when something is not working, like a dose or a device.', goal: 'Tell my care team when something is not working', res: 'r5',
      steps: ['Write down what is not working and when it happens.', 'Add it to your questions for the next visit.', 'Save your clinic\'s number for things that cannot wait.'] },
    { id: 'q10', skill: 'run', q: 'I book or change my own appointments and blood work.', goal: 'Book my own appointments and blood work', res: 'r7',
      steps: ['Save your clinic\'s booking number.', 'Book your next blood work, and check if it needs fasting.', 'Add a reminder in Run my care so it shows in Coming up.'] },
    { id: 'q11', skill: 'run', q: 'I reorder insulin and supplies before they run out.', goal: 'Reorder before I run out', res: 'r15',
      steps: ['Count what you have left of each supply.', 'Add a refill date to each one in About me.', 'Place the next order yourself.'] },
    { id: 'q12', skill: 'run', q: 'I know my pharmacy, my supplier and who pays for my supplies.', goal: 'Know my pharmacy, supplier and who pays', res: 'r16',
      steps: ['Add your pharmacy to your care team.', 'Ask a parent which programs or insurance cover your supplies.', 'Read Help paying for diabetes supplies.'] },
    { id: 'q13', skill: 'support', q: 'I spend part of each visit alone with my doctor or nurse.', goal: 'Spend part of each visit on my own', res: 'r2',
      steps: ['Tell your parent before the visit that you want some time alone.', 'Ask your care team for it at the start of the visit.', 'Use the time for a question you would not ask in front of family.'] },
    { id: 'q14', skill: 'support', q: 'I decide who in my family helps, and with what.', goal: 'Decide who helps me, and with what', link: '#/levels', linkLabel: 'Run my care',
      steps: ['Look at who does each Run my care task.', 'Take one job over from your parent.', 'Choose what your parent can see in About me.'] },
    { id: 'q15', skill: 'support', q: 'I tell someone when diabetes is getting me down.', goal: 'Talk to someone when diabetes gets me down', res: 'r6',
      steps: ['Pick one person you could tell, at home, at school or in your care team.', 'Ask your care team who you can talk to about stress or mood.', 'If it is hard to say, add it to your questions for the next visit.'] }
  ];
  F.CHECK_RANK = { learning: 0, help: 1, own: 2 };
  /* The middle of a skill's three answers (skipped questions are left out). No answers at all leaves the skill out. */
  F.checkSkills = function (answers) {
    var out = {};
    F.SKILLS.forEach(function (s) {
      var v = F.CHECK.filter(function (q) { return q.skill === s.id && answers[q.id]; }).map(function (q) { return answers[q.id]; })
        .sort(function (a, b) { return F.CHECK_RANK[a] - F.CHECK_RANK[b]; });
      if (v.length) out[s.id] = v[Math.floor((v.length - 1) / 2)];
    });
    return out;
  };
  F.checkItem = function (id) { return F.CHECK.filter(function (q) { return q.id === id; })[0]; };

  /* ---------- v2 research fields: safe defaults for any patient (seed and saved demo data) ---------- */
  F.CARE_TASKS = [
    { id: 'k1', label: 'Book my blood work', detail: 'Labs are often closed on weekends. Check if it needs fasting.', owner: 'teen' },
    { id: 'k2', label: 'Reorder pump and sensor supplies', detail: 'Order well before you run out.', owner: 'parent' },
    { id: 'k3', label: 'Check how long my prescriptions last', detail: 'Know when repeats run out so you can book in time.', owner: 'shared' },
    { id: 'k4', label: 'Find out what covers my supplies', detail: 'Ask who applies for funding and when it renews.', owner: 'parent' },
    /* v3: losing primary care at transition was linked with more DKA (Shulman et al. 2018, Ontario) */
    { id: 'k5', label: 'Find an adult family doctor', detail: 'Ask your clinic how to find one before you turn 18.', owner: 'shared' }
  ];
  /* Who does each Run my care task right now. The parent home shows this so tasks can move to the teen one at a time. */
  F.OWNERS = { parent: 'Parent', shared: 'Shared', teen: 'Me' };
  /* What a teen can let a parent see. Everything is off until the teen turns it on. Never notes, never glucose. */
  F.PARENT_SHARE = [
    { k: 'level', label: 'My level and skills', sub: 'Where I am and what I am working on' },
    { k: 'tasks', label: 'Run my care tasks', sub: 'Who does what, so jobs can move to me' },
    { k: 'visit', label: 'My next visit', sub: 'The date and place only' }
  ];
  F.defaults = function (p) {
    if (!Array.isArray(p.meds)) p.meds = [];
    if (p.medsConfirmed === undefined) p.medsConfirmed = null;
    if (!Array.isArray(p.supportThisVisit)) p.supportThisVisit = [];
    if (p.decisionSupport === undefined) p.decisionSupport = null;
    if (!Array.isArray(p.careTasks)) p.careTasks = [];
    F.CARE_TASKS.forEach(function (t) {
      var have = p.careTasks.filter(function (x) { return x.id === t.id; })[0];
      if (!have) p.careTasks.push({ id: t.id, label: t.label, detail: t.detail, done: false, owner: t.owner });
      else if (!have.owner) have.owner = t.owner;
    });
    if (!p.plant || !Array.isArray(p.plant.events)) p.plant = { events: [] };
    /* v3 first-run fields */
    if (!Array.isArray(p.allergies)) p.allergies = [];
    if (p.noAllergies === undefined) p.noAllergies = false;
    if (p.selfCheck === undefined) p.selfCheck = null;
    if (!p.parentShare || typeof p.parentShare !== 'object') p.parentShare = { level: false, tasks: false, visit: false };
    /* v5 fields: readiness checks (newest last), up to 3 goals, the 3-sentence summary */
    if (!Array.isArray(p.checks)) p.checks = [];
    if (!Array.isArray(p.goals)) p.goals = [];
    if (p.summary3 === undefined) p.summary3 = null;
    if (p.checks.length && !p.selfCheck) { var lc = p.checks[p.checks.length - 1]; p.selfCheck = { skills: lc.skills, date: lc.date }; }
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
          { id: 'n1', kind: 'Handoff note', author: 'Dr. Okafor', role: 'peds', date: '2026-10-12', draft: false, shared: true,
            text: 'For the adult team: Maya does best when the plan is clear before the visit. Pump and sensor user. Recent A1C trend is in the linked records.',
            fields: { meds: 'Rapid-acting insulin by pump, long-acting pens as backup, glucagon. Repeats last until March 2027.', referrals: 'Adult endocrinology referral sent Oct 2026. Adult family doctor not chosen yet.', upcoming: 'Blood work due Dec 2026, before the next endocrinology visit.', managed: 'Insulin pump and glucose sensor since age 12. A1C trend in the hospital records portal.', watch: 'Lows after soccer. Gets anxious in new clinics, so explain each step.' } },
          { id: 'n2', kind: 'Visit takeaway', author: 'Dr. Okafor', role: 'peds', date: '2026-10-12', shared: true,
            text: 'Practise your low-sugar plan out loud. Bring one question about soccer days.' },
          { id: 'n3', kind: 'Visit takeaway', author: 'Dr. Marsh', role: 'peds', date: '2026-09-14', shared: false,
            text: 'The new dose is working. Keep logging so we can see the pattern.' }
        ],
        meds: [
          { id: 'm1', name: 'Rapid-acting insulin', detail: 'Through my insulin pump', kind: 'medication', refill: '2026-12-15' },
          { id: 'm2', name: 'Long-acting insulin pens', detail: 'Backup if my pump stops working', kind: 'medication' },
          { id: 'm3', name: 'Glucagon', detail: 'For a severe low. My family knows where it is', kind: 'medication' },
          { id: 'm4', name: 'Glucose sensor', detail: 'Continuous glucose monitor', kind: 'supply', refill: '2026-11-27' },
          { id: 'm5', name: 'Pump infusion sets', detail: 'Changed every few days', kind: 'supply' }
        ],
        medsConfirmed: { by: 'Dr. A. Okafor', date: '2026-10-12' },
        allergies: [{ id: 'al1', name: 'Penicillin', reaction: 'Rash' }],
        parentShare: { level: true, tasks: true, visit: true },
        supportThisVisit: [
          { id: 's1', label: 'Big decisions', by: 'Peds team: Dr. Okafor', date: 'Oct 2026', text: 'Maya prefers a parent for major decisions. Explain options simply, check she understands, and ask if she wants a family member called.' },
          { id: 's2', label: 'Being seen alone', by: 'Peds team: Dr. Okafor', date: 'Oct 2026', text: 'She is still learning to be the only patient in the room. Explain each step as you go and ask what she needs.' }
        ],
        decisionSupport: { name: 'Priya R.', rel: 'Mother' },
        careTasks: [
          { id: 'k1', label: 'Book my blood work', detail: 'Labs are often closed on weekends. Check if it needs fasting.', done: false, due: '2026-12-07' },
          { id: 'k2', label: 'Reorder pump and sensor supplies', detail: 'Order well before you run out.', done: false },
          { id: 'k3', label: 'Check how long my prescriptions last', detail: 'Know when repeats run out so you can book in time.', done: true },
          { id: 'k4', label: 'Find out what covers my supplies', detail: 'Ask who applies for funding and when it renews.', done: false }
        ],
        /* v5 demo: one readiness check from her October visit, two goals she picked, and her 3-sentence summary */
        checks: [{ date: '2026-10-12', answers: { q1: 'own', q2: 'own', q3: 'own', q4: 'help', q5: 'own', q6: 'learning', q7: 'own', q8: 'own', q9: 'help', q10: 'own', q11: 'help', q12: 'own', q13: 'learning', q14: 'help', q15: 'learning' } }],
        goals: [{ id: 'q13', date: '2026-10-12', done: [true, false, false] }, { id: 'q6', date: '2026-10-12', done: [false, false, false] }],
        summary3: { s1: 'I have type 1 diabetes and use an insulin pump and a glucose sensor.', s2: 'I count carbs for meals and my pump gives my rapid-acting insulin. I keep long-acting pens as a backup.', s3: 'I get anxious in new clinics, so please explain what you are doing as you go.', date: '2026-10-20' },
        plant: { events: [
          { id: 'g1', type: 'practice', label: 'You set two insulin reminders', date: '2026-10-20' },
          { id: 'g2', type: 'careTask', label: 'You checked how long your prescriptions last', date: '2026-10-24' }
        ] }
      }),
      P('p2', 'Theo', 'K.', 15, '33901148', 2, sk('own', 'learning', 'help', 'learning', 'learning'), '2026-09-30', true),
      P('p3', 'Priya', 'S.', 16, '77142093', 7, sk('own', 'own', 'own', 'own', 'help'), '2026-10-22', false),
      P('p4', 'Jordan', 'L.', 17, '15028841', 5, sk('own', 'help', 'help', 'learning', 'learning'), '2026-10-03', false, {
        notes: [{ id: 'n4', kind: 'Handoff note', author: 'Dr. Okafor', role: 'peds', date: '2026-10-03', draft: true, shared: true,
          text: 'For the adult team: Jordan is still choosing an adult clinic. Draft until the referral is sent.',
          fields: { meds: '', referrals: 'Adult endocrinology referral not sent yet.', upcoming: '', managed: 'Insulin pens and a glucose sensor.', watch: '' } }]
      }),
      P('p5', 'Sam', 'W.', 14, '99214470', 3, sk('help', 'learning', 'learning', 'learning', 'learning'), '2026-08-29', true),
      P('p6', 'Ana', 'M.', 18, '60483315', 9, sk('own', 'own', 'own', 'own', 'own'), '2026-10-20', false),
      P('p7', 'Eli', 'T.', 13, '22767089', 1, sk('learning', 'learning', 'learning', 'learning', 'learning'), '2026-10-08', false),
      /* Trade-show cards: four people with printed Folio tags (FO-1001 to FO-1004). cardId is the code printed on the tag,
         and the setup screen accepts it as well as the 8-digit Folio ID. Fictional demo profiles, nothing sensitive. */
      P('p8', 'Sam', 'Orr', 14, '51730264', 2, sk('help', 'learning', 'help', 'learning', 'learning'), '2026-10-16', false, {
        cardId: 'FO-1001',
        levelSignoff: { level: 2, by: 'Dr. A. Okafor', date: '2026-09-02' },
        wantDoctorKnow: 'I am still learning the names of my insulins. Please say them slowly and write them down for me.',
        questions: ['How do I know if a low is serious?'],
        contacts: [{ id: 'c81', name: 'Lena Orr', rel: 'Mother, primary contact', phone: '(555) 014-2201', visible: true }],
        careTeam: [
          { id: 't81', name: 'Dr. A. Okafor', role: 'Paediatrician', phone: '(555) 010-3000' },
          { id: 't82', name: 'Nina Park', role: 'Diabetes nurse educator', phone: '(555) 010-3200' }
        ],
        notes: [{ id: 'n81', kind: 'Visit takeaway', author: 'Nina Park', role: 'peds', date: '2026-10-16', shared: true, text: 'Great job naming your fast and slow insulin today. Next time, show me how you check your sensor.' }],
        meds: [
          { id: 'm81', name: 'Rapid-acting insulin pen', detail: 'For meals, a parent helps with the dose', kind: 'medication' },
          { id: 'm82', name: 'Long-acting insulin pen', detail: 'Once a day at bedtime', kind: 'medication' },
          { id: 'm83', name: 'Glucose sensor', detail: 'Continuous glucose monitor', kind: 'supply' }
        ],
        noAllergies: true
      }),
      P('p9', 'Amber', 'Baiden', 16, '64028715', 5, sk('own', 'help', 'own', 'help', 'learning'), '2026-10-21', false, {
        cardId: 'FO-1002',
        levelSignoff: { level: 5, by: 'Dr. L. Marsh', date: '2026-08-27' },
        wantDoctorKnow: 'I play basketball four days a week. Please ask about my practice schedule before changing doses.',
        questions: ['Can I adjust my basal on game days myself?', 'What should I pack for a tournament weekend?'],
        contacts: [
          { id: 'c91', name: 'Grace Baiden', rel: 'Mother, primary contact', phone: '(555) 016-4410', visible: true },
          { id: 'c92', name: 'Kofi Baiden', rel: 'Father', phone: '(555) 016-4477', visible: true }
        ],
        careTeam: [
          { id: 't91', name: 'Dr. L. Marsh', role: 'Specialist (endocrinology)', phone: '(555) 010-3100' },
          { id: 't92', name: 'Nina Park', role: 'Diabetes nurse educator', phone: '(555) 010-3200' }
        ],
        notes: [{ id: 'n91', kind: 'Visit takeaway', author: 'Dr. Marsh', role: 'peds', date: '2026-10-21', shared: true, text: 'Your game-day plan is working. Try running your own correction doses this month and bring your notes.' }],
        meds: [
          { id: 'm91', name: 'Rapid-acting insulin', detail: 'Through my insulin pump', kind: 'medication' },
          { id: 'm92', name: 'Glucagon nasal spray', detail: 'In my sports bag', kind: 'medication' },
          { id: 'm93', name: 'Pump infusion sets', detail: 'Changed every 3 days', kind: 'supply' }
        ],
        medsConfirmed: { by: 'Dr. L. Marsh', date: '2026-10-21' },
        noAllergies: true,
        parentShare: { level: true, tasks: true, visit: false }
      }),
      P('p10', 'Lauren', 'Martin', 17, '70356148', 8, sk('own', 'own', 'own', 'help', 'own'), '2026-10-25', false, {
        cardId: 'FO-1003',
        levelSignoff: { level: 8, by: 'Dr. A. Okafor', date: '2026-10-01' },
        wantDoctorKnow: 'I start university next fall in another city. I want to meet my adult team before I move.',
        questions: ['Can you send my referral to a clinic near campus?', 'How do I refill prescriptions in a new province?'],
        contacts: [{ id: 'c101', name: 'Mark Martin', rel: 'Father, primary contact', phone: '(555) 018-7720', visible: true }],
        careTeam: [
          { id: 't101', name: 'Dr. A. Okafor', role: 'Paediatrician', phone: '(555) 010-3000' },
          { id: 't102', name: 'Dr. L. Marsh', role: 'Specialist (endocrinology)', phone: '(555) 010-3100' },
          { id: 't103', name: 'Dr. S. Patel', role: 'Adult family doctor', phone: '(555) 010-5500' }
        ],
        notes: [{ id: 'n101', kind: 'Visit takeaway', author: 'Dr. Okafor', role: 'peds', date: '2026-10-25', shared: true, text: 'You booked your own blood work this time. Next step: call the pharmacy yourself for your next refill.' }],
        meds: [
          { id: 'm101', name: 'Rapid-acting insulin pen', detail: 'For meals and corrections', kind: 'medication' },
          { id: 'm102', name: 'Long-acting insulin pen', detail: 'Every morning', kind: 'medication' },
          { id: 'm103', name: 'Glucose sensor', detail: 'Continuous glucose monitor', kind: 'supply' }
        ],
        medsConfirmed: { by: 'Dr. A. Okafor', date: '2026-10-25' },
        allergies: [{ id: 'al101', name: 'Adhesive tape', reaction: 'Skin irritation' }],
        summary3: { s1: 'I have type 1 diabetes and use insulin pens and a glucose sensor.', s2: 'I count carbs, dose my own insulin and book my own blood work.', s3: 'I am moving for university, so I need a clear plan for refills and a new clinic.', date: '2026-10-25' }
      }),
      P('p11', 'Jake', 'Querin', 17, '83140572', 6, sk('own', 'own', 'help', 'own', 'learning'), '2026-10-28', false, {
        cardId: 'FO-1004',
        levelSignoff: { level: 6, by: 'Dr. A. Okafor', date: '2026-10-28' },
        wantDoctorKnow: 'I like to understand the why behind a change. Talk to me first, then my mom if I ask. I do my best at morning visits.',
        questions: ['Can I try a pump before I move to adult care?', 'What changes when I turn 18?'],
        howToWork: [
          { by: 'Patient: Jake', date: 'Oct 2026', text: 'Talk to me first. I will bring my mom in if I want her there.' },
          { by: 'Peds team: Dr. Okafor', date: 'Oct 2026', text: 'Jake is confident with doses and carb counting. Give him the plan in writing so he can look back at it.' },
          { by: 'Patient: Jake', date: 'Oct 2026', text: 'Texts work better for me than phone calls during school.' }
        ],
        contacts: [
          { id: 'c111', name: 'Dana Querin', rel: 'Mother, primary contact', phone: '(555) 012-6630', visible: true },
          { id: 'c112', name: 'Chris Querin', rel: 'Father', phone: '(555) 012-6688', visible: true }
        ],
        careTeam: [
          { id: 't111', name: 'Dr. A. Okafor', role: 'Paediatrician', phone: '(555) 010-3000' },
          { id: 't112', name: 'Dr. L. Marsh', role: 'Specialist (endocrinology)', phone: '(555) 010-3100' },
          { id: 't113', name: 'Nina Park', role: 'Diabetes nurse educator', phone: '(555) 010-3200' },
          { id: 't114', name: 'Dr. R. Chen', role: 'Adult family doctor', phone: '(555) 010-5800' },
          { id: 't115', name: 'Main Street Pharmacy', role: 'Pharmacy', phone: '(555) 010-9950' }
        ],
        links: [
          { id: 'l111', title: 'Hospital records portal', sub: "Sample Children's Hospital", url: 'https://example.org/portal' },
          { id: 'l112', title: 'My insulin plan (PDF)', sub: 'Added by Jake, Oct 2026', url: 'https://example.org/plan.pdf' }
        ],
        notes: [
          { id: 'n111', kind: 'Visit takeaway', author: 'Dr. Okafor', role: 'peds', date: '2026-10-28', shared: true,
            text: 'Level 6 signed off. You ran the whole visit today. Next: practise asking the adult team your own questions.' },
          { id: 'n112', kind: 'Visit takeaway', author: 'Nina Park', role: 'peds', date: '2026-09-30', shared: true,
            text: 'Your sick-day plan was spot on. Keep your ketone strips in your school bag.' }
        ],
        meds: [
          { id: 'm111', name: 'Rapid-acting insulin pen', detail: 'For meals and corrections', kind: 'medication', refill: '2026-12-10' },
          { id: 'm112', name: 'Long-acting insulin pen', detail: 'Every night at 9', kind: 'medication' },
          { id: 'm113', name: 'Glucagon', detail: 'For a severe low. My family and coach know where it is', kind: 'medication' },
          { id: 'm114', name: 'Glucose sensor', detail: 'Continuous glucose monitor', kind: 'supply', refill: '2026-11-30' }
        ],
        medsConfirmed: { by: 'Dr. A. Okafor', date: '2026-10-28' },
        noAllergies: true,
        parentShare: { level: true, tasks: false, visit: true },
        careTasks: [
          { id: 'k1', label: 'Book my blood work', detail: 'Labs are often closed on weekends. Check if it needs fasting.', done: true, doneDate: '2026-10-20', owner: 'teen' },
          { id: 'k2', label: 'Reorder pump and sensor supplies', detail: 'Order well before you run out.', done: false, due: '2026-11-28', owner: 'teen' },
          { id: 'k3', label: 'Check how long my prescriptions last', detail: 'Know when repeats run out so you can book in time.', done: true, doneDate: '2026-10-02', owner: 'teen' },
          { id: 'k4', label: 'Find out what covers my supplies', detail: 'Ask who applies for funding and when it renews.', done: false, owner: 'shared' }
        ],
        nextVisit: { iso: '2026-12-03T09:30', where: "Sample Children's Hospital, diabetes clinic", note: 'Bring my questions about the pump.' },
        summary3: { s1: 'I have type 1 diabetes and use insulin pens and a glucose sensor.', s2: 'I count carbs and give my own insulin for meals and corrections.', s3: 'Please explain the why behind any change, and talk to me first.', date: '2026-10-28' },
        plant: { events: [
          { id: 'g111', type: 'signOff', label: 'Signed off to Level 6', date: '2026-10-28' },
          { id: 'g112', type: 'careTask', label: 'You booked your own blood work', date: '2026-10-29' }
        ] }
      })
    ]
  };

  /* Fill in plain defaults so every patient has something to show in every view. */
  F.SEED.patients.forEach(function (p) {
    (p.checks || []).forEach(function (c) { if (!c.skills) c.skills = F.checkSkills(c.answers); });
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
  var AVP = { p1: 'a3', p2: 'a5', p3: 'a2', p4: 'a7', p5: 'a1', p6: 'a4', p7: 'a6', p8: 'a1', p9: 'a2', p10: 'a6', p11: 'a7' };
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
  F.CARD_SHAPES = { rounded: 'Rounded card', square: 'Square corners', tab: 'Keyring tab', star: 'Star tag', cloud: 'Cloud tag', heart: 'Heart tag', tag: 'Luggage tag' };
  /* The shape of each printed trade-show tag */
  var TAG_SHAPE = { p8: 'star', p9: 'cloud', p10: 'heart', p11: 'tag' };
  var ATTN = { p2: 'No visit note since Sep 30', p5: 'Progress paused after illness. Check in.' };
  function tok(seed) {
    var a = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', x = 0, o = '';
    for (var i = 0; i < seed.length; i++) x = (x * 31 + seed.charCodeAt(i)) >>> 0;
    for (var j = 0; j < 22; j++) { x = (x * 1664525 + 1013904223) >>> 0; o += a[(x >>> 16) % a.length]; }
    return o;
  }
  /* Card tokens are frozen here, so a printed QR code (qr-codes/, made by tools/make-qr-pngs.js) keeps working in every
     fresh browser. They equal tok('folio' + id) today; the literal list protects them if tok() ever changes.
     Replace card in the portal makes a new random token, and the old printed QR code stops working. p7 (Eli) is the
     sample patient with no card yet, so the portal can show issuing one. */
  F.CARD_TOKENS = {
    p1: 'hyqPr8wzQ3vMTrpPTGWVCL', p2: 'KHH96SWsbgvVP4jh8unr7a', p3: 'cRJt4C7jfvc5JEwKmhNVSP', p4: 'E2KMHExcAJbvEgJVA5Wrnd',
    p5: '7a47pqG5DXTDzTWpQRnWRT', p6: 'yi5rma8WYcSMvv9zMDNsCg',
    p8: 'tBp5GWHGnnzkk2gdfdnsAj', p9: 'VKqnDGazsBgugCuFu2NemH', p10: 'HdJeRf2KNqaE2AnYmN7qJF', p11: 'a5KywZbCRDR6VczaBixUd4'
  };
  /* Production base for QR payloads, so a code looks and scans the same from localhost, a preview or GitHub Pages */
  F.PROD_BASE = 'https://jtq03.github.io/Folio/';
  F.cardUrlProd = function (token) { return F.PROD_BASE + 'card/?t=' + encodeURIComponent(token) + '&via=qr'; };
  F.SEED.patients.forEach(function (p) {
    p.attentionReason = p.attention ? ATTN[p.id] || 'Needs a check-in' : '';
    p.card = { status: p.id === 'p7' ? 'unassigned' : 'active', shape: TAG_SHAPE[p.id] || 'rounded', token: F.CARD_TOKENS[p.id] || tok('folio' + p.id), issued: '2026-0' + (3 + (+p.id.slice(1) % 5)) + '-1' + (+p.id.slice(1) % 9), lastTap: p.id === 'p1' ? '2026-10-12' : '' };
    if (p.id === 'p7') p.card.token = '';
  });
  F.SEED.resources = F.RESOURCES.map(function (r) { return Object.assign({ published: true }, r); });
  F.SEED.access = [
    { id: 'a1', pid: 'p1', who: 'Dr. A. Okafor', how: 'Portal', time: '2026-10-12T14:02:00' },
    { id: 'a2', pid: 'p1', who: 'Sample General ED', how: 'Card tap (NFC)', time: '2026-10-03T22:41:00' },
    { id: 'a3', pid: 'p3', who: 'Dr. L. Marsh', how: 'Portal', time: '2026-10-22T09:15:00' },
    { id: 'a4', pid: 'p6', who: 'Westside Adult Diabetes Clinic', how: 'Card tap (QR)', time: '2026-10-20T10:30:00' },
    { id: 'a5', pid: 'p4', who: 'Nina Park', how: 'Portal', time: '2026-10-03T11:20:00' },
    { id: 'a6', pid: 'p11', who: 'Dr. A. Okafor', how: 'Portal', time: '2026-10-28T10:05:00' }
  ];
})(window.Folio);
