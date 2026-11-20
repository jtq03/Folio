/* Folio prototype data. Everything here is fictional demo data.
   Source: Figma Wireframes page ("Level system · Type 1 diabetes", patient app, clinician views).
   Skill and level wording is a PROPOSAL still to be tested with a diabetes clinician. */
window.Folio = window.Folio || {};

(function (F) {
  /* ---------- Level system v2: 10 levels, each with its own goal and its own 4 skills (40 in all) ----------
     A PROPOSAL that needs review by a diabetes educator before any real use. Built on Folio's 10 level names and their
     earlier "can" text, the TRAQ and READDY readiness domains (knowledge, self-management, speaking up, health system
     navigation, health behaviours) and the Canadian Paediatric Society 2023 transition guidance. No licensed instrument
     items are copied. The five areas (F.AREAS) are now a theme tag for colour and reporting, not the structure.
     Contract (the app's sticker and plant components read exactly these fields):
     level { n, name, phase, goal, intro, leads, unlocks, you, can, evidence, plant: { key, name, nick, trait, image, pokes[3], idle, story }, skills[4] }
     skill { id, area, name, can, how[3], evidence, guide, sticker: { id, name, shape, color, icon, material, size, story, detail, back } } */
  function SK(id, area, name, can, how, evidence, guide, st) {
    return { id: id, area: area, name: name, can: can, how: how, evidence: evidence, guide: guide,
      sticker: { id: 'st-' + id, name: st[0], shape: st[1], color: st[2], icon: st[3], material: st[4], size: st[5], story: st[6], detail: st[7], back: st[8] } };
  }
  function PL(key, name, nick, trait, image, pokes, idle, story) { return { key: key, name: name, nick: nick, trait: trait, image: image, pokes: pokes, idle: idle, story: story }; }

  F.LEVELS = [
    { n: 1, name: 'Observer', phase: 'Aware', goal: 'Learn your condition', leads: 'Family does everything',
      intro: 'This is where it starts. You find out what type 1 diabetes is, why insulin matters and who is on your team, while your family leads.',
      you: 'Your family leads for now. You watch and learn how it works.',
      can: 'Name my diabetes and what insulin is for. Tell a parent when I feel low or high.',
      evidence: 'Explains diabetes in my own words at a visit. Folio profile set up with a parent.',
      unlocks: 'Parent-managed profile, Folio ID card',
      plant: PL('sprout', 'Tiny sprout', 'Pip', 'Curious, a bit sleepy, asks what everything is', 1,
        ['Oh! Hi. I just poked out of the soil.', 'Is this what sunlight feels like? Tell me more.', 'I am small, but I am paying attention.'],
        'Pip is soaking up the light and listening.',
        'Every plant starts as something tiny that does not know much yet. Pip only needs light, water and a little patience, just like you at the start.'),
      skills: [
        SK('L1-01', 'know', 'What type 1 is', 'I can say in my own words what type 1 diabetes is, and that it is nobody\'s fault.',
          ['Read a short guide about type 1 with someone at home.', 'Ask your diabetes nurse to draw how insulin and sugar work.', 'Tell one friend or relative what type 1 is in two sentences.'],
          'Explains type 1 in their own words at a visit.', null,
          ['First page', 'circle', 'blue', 'book', 'matte', 'M', 'The very first page of your story. A little dog-eared already, because good stories get read twice.', 'Matte vinyl circle, 40 mm, soft-touch finish', 'Day one. Not your fault, and not the end of anything.']),
        SK('L1-02', 'know', 'Why insulin', 'I can explain what insulin does and why my body needs it every day.',
          ['Read Insulin at meals.', 'Look at your pens or pump with your care team and ask what each one is for.', 'Explain to a parent why you cannot skip insulin, even on a day you feel fine.'],
          'Says what insulin does and why it is needed daily.', 'r9',
          ['Key keeper', 'drop', 'sky', 'key', 'glossy', 'S', 'Insulin is the key that lets sugar into your cells. This one jingles a little when you walk.', 'Glossy die-cut drop, 32 mm, waterproof', 'Insulin unlocks the energy. Keep the key close.']),
        SK('L1-03', 'manage', 'Lows and highs', 'I can tell an adult when I feel low or high.',
          ['Read Warning signs and when to call.', 'Write down how a low feels for you, in your own words.', 'Next time you feel off, say so to an adult straight away.'],
          'Names two signs of a low and two of a high, and says who to tell.', 'r13',
          ['Body radar', 'cloud', 'butter', 'bell', 'puffy', 'M', 'Your body sends little weather reports. This puffy cloud listens for shaky, sweaty and super thirsty.', 'Puffy 3D cloud, 42 mm, squishes when you press it', 'Feel off? Say so. Every time.']),
        SK('L1-04', 'support', 'My team and my card', 'I know who is on my care team, and I carry my Folio card.',
          ['Look at your care team list in About me with a parent.', 'Meet your diabetes nurse and learn their name.', 'Keep your Folio card in your bag or phone case for a week.'],
          'Names their doctor and nurse. Folio profile set up with a parent.', null,
          ['Crew badge', 'shield', 'teal', 'users', 'enamel', 'M', 'Every hero has a crew. This badge is shiny proof that you are not doing this alone.', 'Enamel-look shield, 38 mm, gold edge', 'My crew: family, care team, me.'])
      ] },
    { n: 2, name: 'Learner', phase: 'Aware', goal: 'Know your daily routine', leads: 'Family, with me present',
      intro: 'Now you get to know the everyday stuff. You learn your insulins, how to check your glucose and what to do for a low, and you start answering for yourself.',
      you: 'Your family leads, and you are part of it.',
      can: 'Know my insulin types and doses. Spot the signs of a low and a high. Answer one clinician question myself. Carry my Folio card.',
      evidence: 'Answers "how are you feeling?" alone. Can name my insulin and doses.',
      unlocks: 'Read-only view of my own profile',
      plant: PL('seedling', 'Seedling', 'Sid', 'Asks why about everything, likes a routine', 2,
        ['Morning water, then sunlight. Same time tomorrow?', 'Why does that leaf go that way? Just wondering.', 'I like knowing what comes next.'],
        'Sid is stretching toward the window, right on schedule.',
        'A seedling has its first real leaves and a daily rhythm. Sid grows best with the same small things done every day.'),
      skills: [
        SK('L2-01', 'know', 'My insulins', 'I can name my insulins, what each one is for, and my usual doses.',
          ['Read Insulin at meals.', 'Check your medication list in About me with a parent.', 'Say your insulin names and doses out loud without looking.'],
          'Names each insulin, what it is for and the usual dose.', 'r9',
          ['Name tag', 'ticket', 'beige', 'pill', 'washi', 'M', 'Fast one, slow one. You know them by name now, like two friends with very different personalities.', 'Washi paper ticket, 45 mm, tear-off edge', 'Hello, my insulins are...']),
        SK('L2-02', 'manage', 'Checking my glucose', 'I can check my glucose with my sensor or meter and read the number and the arrow.',
          ['Ask your nurse to show you what the trend arrows mean.', 'Check your glucose before lunch for a week, with a reminder.', 'Tell a parent what the number and arrow say, and what you will do.'],
          'Shows how they check glucose and reads the trend arrow.', null,
          ['Number reader', 'hex', 'lime', 'chart', 'glossy', 'S', 'Numbers are just information, not grades. This little hexagon reads the arrow and keeps its cool.', 'Glossy hexagon, 30 mm, rounded corners', 'A number is a clue, not a score.']),
        SK('L2-03', 'manage', 'Treating a low', 'I can treat a low with fast sugar and check again after.',
          ['Read Build your low-sugar plan with a parent.', 'Pack fast sugar in your bag, your room and your sports kit.', 'Practise your low steps out loud: treat, wait, check again.'],
          'Walks through what they do first for a low.', 'r4',
          ['Fast sugar hero', 'heart', 'butter', 'drop', 'glitter', 'M', 'Treat, wait, check again. This sparkly heart has juice box energy and it is always ready.', 'Glitter vinyl heart, 40 mm, catches the light', 'Fast sugar first. Then breathe.']),
        SK('L2-04', 'speak', 'Answer for myself', 'I can answer "how have things been?" at a visit before my parent does.',
          ['Read How to ask a doctor a hard question.', 'Before the visit, ask your parent to let you answer first.', 'Answer the first question at your visit yourself.'],
          'Answers "how are you feeling?" alone.', 'r3',
          ['First word', 'circle', 'sky', 'chat', 'puffy', 'S', 'The first time you answered for yourself. Small bubble, big moment.', 'Puffy speech bubble, 30 mm', 'I said it first.'])
      ] },
    { n: 3, name: 'Participant', phase: 'Involved', goal: 'Use your insulin and devices', leads: 'Family guides',
      intro: 'Time to get hands-on. You give your own insulin with someone watching, change your sensor and sites, and look at your data with your care team.',
      you: 'Your family guides you as you start doing parts yourself.',
      can: 'Explain diabetes to someone else. Look at my sensor or pump data with my care team. Take insulin on a routine with reminders.',
      evidence: 'Talks through my sensor data in clinic. Asks one prepared question.',
      unlocks: 'My own login',
      plant: PL('clover', 'Clover', 'Lucky', 'Hands-on and a little bit lucky, but mostly practised', 3,
        ['Four leaves today. Practice, not luck.', 'Want to try it yourself? I will watch.', 'I spread out when I am ready.'],
        'Lucky is turning a leaf over to see how it works.',
        'Clover spreads by doing, one runner at a time. Lucky says the luck part is mostly practice that nobody saw.'),
      skills: [
        SK('L3-01', 'manage', 'Giving my insulin', 'I can give a pen dose or a pump bolus myself, with someone watching.',
          ['Read Insulin at meals.', 'Give one dose a day yourself while a parent watches.', 'Ask your nurse to check your technique at the next visit.'],
          'Gives a dose or bolus with good technique while the nurse watches.', 'r9',
          ['Steady hand', 'hex', 'blue', 'hand', 'enamel', 'M', 'Calm hands, careful steps. This badge looks like it belongs on a jacket, because you earned it.', 'Enamel-look hexagon, 38 mm, raised edge', 'Steady hands. My dose, my way.']),
        SK('L3-02', 'manage', 'Sensor and site changes', 'I can change my sensor and pump site or pen needles when they are due.',
          ['Ask your care team to watch you do one change.', 'Put the next change date in your calendar.', 'Do the next change yourself, with someone nearby.'],
          'Does a sensor or site change in clinic, or describes one step by step.', null,
          ['Fresh start', 'leaf', 'teal', 'refresh', 'matte', 'S', 'New site, new sensor, fresh start. This leaf flips over every few days, just like you.', 'Matte leaf, 32 mm, peels clean', 'Change day? Done.']),
        SK('L3-03', 'know', 'Reading my data', 'I can look at my sensor or pump data with my care team and spot one pattern.',
          ['Ask your care team to show you your data screen.', 'Find one time of day when things tend to go up or down.', 'Bring that pattern to your next visit as a question.'],
          'Talks through their sensor or pump data in clinic.', null,
          ['Pattern spotter', 'drop', 'lime', 'eye', 'holo', 'M', 'You noticed something the graph was trying to say. This holographic drop changes colour when you tilt it, like a good clue.', 'Holographic drop, 38 mm, rainbow shift', 'I spotted the pattern.']),
        SK('L3-04', 'speak', 'One prepared question', 'I can bring one question I prepared and ask it myself.',
          ['Read Prepare for your next visit.', 'Add one question in About me when it comes to mind.', 'Ask it yourself at the visit, before anyone else does.'],
          'Asks one prepared question at a visit.', 'r2',
          ['Question ticket', 'ticket', 'butter', 'message', 'glossy', 'S', 'Admit one question. This ticket gets you a real answer, so hold on to it.', 'Glossy ticket stub, 34 mm, perforated look', 'Admit one question.'])
      ] },
    { n: 4, name: 'Contributor', phase: 'Involved', goal: 'Balance food and activity', leads: 'Family guides, I contribute',
      intro: 'Food and fun do not have to be a fight. You learn to count carbs, plan for active days and spend part of your visit on your own.',
      you: 'Your family guides, and you pitch in.',
      can: 'Keep my own appointment list. Book my blood work at a time that fits school or work, and know if I need to fast. Prepare 2 or 3 questions. Spend part of a visit alone with the clinician. Know my allergies and diabetes history basics.',
      evidence: 'Time alone with the clinician. Fills in the history form with help.',
      unlocks: 'Appointment list, my questions for next visit',
      plant: PL('cactus', 'Mini cactus', 'Spike', 'Tough on the outside, plans every snack', 4,
        ['I store up for long days. Snack packed?', 'Spiky? Me? I just know what I need.', 'Game day! Did you plan for it?'],
        'Spike is sunbathing and counting, very quietly.',
        'A cactus is good at balance: it saves what it needs for later and handles a hot day without fuss. Spike plans ahead so the fun stays fun.'),
      skills: [
        SK('L4-01', 'manage', 'Counting carbs', 'I can count the carbs in my usual meals and snacks.',
          ['Read Carb counting basics.', 'Count the carbs in your three most common meals.', 'Check one count with your dietitian or a parent.'],
          'Counts carbs for a usual meal with the dietitian.', 'r10',
          ['Carb counter', 'circle', 'green', 'food', 'puffy', 'M', 'Part maths, part snack. This puffy apple knows that every food can fit with a plan.', 'Puffy round sticker, 40 mm, soft and squishy', 'Count it, cover it, enjoy it.']),
        SK('L4-02', 'manage', 'Active days', 'I can plan for sports and activity so I stay safe from lows.',
          ['Read Sports, exercise and lows.', 'Pack fast sugar in your sports bag.', 'Make a game-day plan with your care team and try it once.'],
          'Describes their plan for an active day, before and after.', 'r12',
          ['Game day', 'star', 'lime', 'bolt', 'glossy', 'M', 'Full energy, full plan. This star shows up to practice early with snacks in its pocket.', 'Glossy star, 40 mm, sports-bag tough', 'Play hard. Plan first.']),
        SK('L4-03', 'know', 'My allergies and history', 'I can name my allergies, my devices and when I was diagnosed.',
          ['Check your allergies and medications in About me.', 'Ask a parent when and where you were diagnosed.', 'Fill in a history form at your visit with a little help.'],
          'Fills in the history form with help.', null,
          ['My story so far', 'shield', 'beige', 'log', 'matte', 'M', 'A tiny file of the important stuff. This shield keeps your story straight so nobody has to guess.', 'Matte shield, 38 mm, paper texture', 'Allergies, devices, diagnosis day. Got it.']),
        SK('L4-04', 'support', 'Time on my own', 'I can spend part of my visit alone with my clinician.',
          ['Tell your parent before the visit that you want some time alone.', 'Ask for it at the start of the visit.', 'Use the time for a question you would not ask in front of family.'],
          'Spends part of the visit alone with the clinician.', 'r2',
          ['Solo seat', 'flower', 'sky', 'team', 'washi', 'S', 'Just you and your clinician for a few minutes. This flower blooms in quiet rooms.', 'Washi flower, 32 mm, hand-torn look', 'A few minutes that are just mine.'])
      ] },
    { n: 5, name: 'Partner', phase: 'Shared', goal: 'Handle highs, lows and sick days', leads: 'Shared, family backs up',
      intro: 'This level is about the tricky days. You learn your low plan inside out, follow your sick day plan and know exactly who to call.',
      you: 'You and your family share it. They back you up.',
      can: 'Give my own insulin with spot checks. Walk through my low-sugar plan. Say how I am doing unprompted. Know who to call and when.',
      evidence: 'Low-sugar plan walk-through. Several weeks of my own routine without parent prompting.',
      unlocks: 'Low-sugar plan, who-to-call card',
      plant: PL('succulent', 'Succulent', 'Sully', 'Calm in a storm, always keeps a backup', 5,
        ['Rough day? I saved some water for this.', 'Plan first, panic never.', 'I have a backup for my backup.'],
        'Sully is sitting very still, ready for any weather.',
        'Succulents store what they need for dry spells, so a hard week does not knock them over. Sully is proof that a plan makes bad days smaller.'),
      skills: [
        SK('L5-01', 'manage', 'My low plan', 'I can walk someone through my low-sugar plan, including when glucagon is needed.',
          ['Read Build your low-sugar plan.', 'Fill in your plan while you feel fine.', 'Walk through it out loud with your care team.'],
          'Walks through their low-sugar plan, including glucagon.', 'r4',
          ['Plan in my pocket', 'shield', 'butter', 'alert', 'enamel', 'M', 'Ready before you need it. This shield does not panic, because it already knows step one.', 'Enamel-look shield, 38 mm, bold outline', 'Step one is already decided.']),
        SK('L5-02', 'manage', 'Sick days and ketones', 'I can follow my sick day plan and check ketones when I am unwell.',
          ['Ask your care team for your sick day plan and save a photo of it.', 'Learn how to check ketones with your nurse.', 'Walk through what you would do on a real or pretend sick day.'],
          'Handles a real or practice sick day using the plan.', 'r13',
          ['Storm watcher', 'cloud', 'sky', 'thermo', 'holo', 'M', 'When you feel rotten, this cloud keeps an eye on the forecast. It shimmers when you tilt it, just to cheer you up.', 'Holographic cloud, 42 mm, rainbow sheen', 'Sick day? Follow the plan, call if unsure.']),
        SK('L5-03', 'know', 'Who to call', 'I know who to call for routine questions, after hours and in an emergency.',
          ['Read Who do I call, and when?', 'Save your clinic, after-hours and emergency numbers in Folio.', 'Tell someone at home which number you would use for three different problems.'],
          'Says who to call for routine, urgent and emergency problems.', 'r5',
          ['Speed dial', 'circle', 'teal', 'phone', 'glossy', 'S', 'Three numbers, zero guessing. This round little phone already knows who picks up.', 'Glossy circle, 30 mm, phone-case size', 'Clinic, after hours, 911.']),
        SK('L5-04', 'support', 'Teach my people', 'I can show a friend, coach or teacher how to help me if I go low.',
          ['Pick one person at school or sport who should know.', 'Show them where your fast sugar is and what a low looks like.', 'Tell your care team who you taught.'],
          'Names who they taught and what they told them.', null,
          ['Helper network', 'hex', 'green', 'users', 'glitter', 'M', 'You built your own safety net. This sparkly hexagon connects all the people who have your back.', 'Glitter hexagon, 38 mm, sparkly edge', 'My people know what to do.'])
      ] },
    { n: 6, name: 'Manager', phase: 'Shared', goal: 'Speak up and book your visits', leads: 'I do, family backs up',
      intro: 'You start running the conversation. You say how things are going, tell your team when something is not working, and book your own visits.',
      you: 'You do most of it. Your family backs you up.',
      can: 'Request my own insulin refills and reorder pump and sensor supplies before they run out. Book and reschedule appointments. Add records and links to my Folio. Explain my privacy and consent rights.',
      evidence: 'Books one appointment and reorders one supply myself, without a parent reminding me. Privacy teach-back.',
      unlocks: 'Add records and links to my Folio',
      plant: PL('fern', 'Fern', 'Fern', 'Unfurls slowly, then speaks up', 6,
        ['Unfurling. Give me a second. Okay, I have something to say.', 'Did you tell them what is not working?', 'My calendar is very leafy this month.'],
        'Fern is uncurling one frond at a time.',
        'Fern fronds start curled up tight and open when they are ready. Fern took a while to speak up too, and now it is hard to get a word in.'),
      skills: [
        SK('L6-01', 'speak', 'Say how I am doing', 'I can tell my care team how things are going before they have to ask.',
          ['Read Speaking up when you are nervous.', 'Think about how the last few weeks went before the visit.', 'Start the visit by saying one thing that went well and one that did not.'],
          'Says how things are going without being prompted.', 'r6',
          ['Open mic', 'circle', 'lime', 'chat', 'foil', 'M', 'You took the mic. This foil bubble shines brightest when you go first.', 'Gold foil circle, 40 mm, mirror shine', 'I go first now.']),
        SK('L6-02', 'run', 'Book my own visits', 'I can book, change and keep track of my appointments and blood work.',
          ['Read Keeping your own appointment list.', 'Save your clinic\'s booking number.', 'Book your next blood work yourself, and check if it needs fasting.'],
          'Books or reschedules one appointment without a parent reminding them.', 'r7',
          ['Calendar keeper', 'ticket', 'teal', 'calendar', 'matte', 'M', 'Dates in, reminders on. This ticket has never once been late, and it is a bit smug about it.', 'Matte ticket, 45 mm, punched corner', 'Booked it myself.']),
        SK('L6-03', 'speak', 'When something is not working', 'I can tell my care team when a dose, a device or a plan is not working for me.',
          ['Write down what is not working and when it happens.', 'Add it to your questions for the next visit.', 'Call or message the clinic yourself if it cannot wait.'],
          'Raises a problem with a dose, device or plan themselves.', 'r3',
          ['Plot twist', 'hex', 'beige', 'edit', 'glossy', 'S', 'Plans are allowed to change. This hexagon holds a pencil, ready to rewrite the bits that do not fit.', 'Glossy hexagon, 30 mm', 'If it is not working, I say so.']),
        SK('L6-04', 'support', 'Talk about how I feel', 'I can tell someone when diabetes is getting me down, and I know who on my team helps with stress and mood.',
          ['Pick one person you could tell, at home, at school or on your care team.', 'Ask your care team who you can talk to about stress or mood.', 'If it is hard to say, add it to your questions for the next visit.'],
          'Knows who to talk to about mood and has used it or planned to.', 'r6',
          ['Heart check', 'heart', 'sky', 'heart', 'puffy', 'M', 'Feelings count too. This soft puffy heart is for the days that are heavy, and for saying so out loud.', 'Puffy heart, 40 mm, extra squishy', 'Hard days are allowed. Talking helps.'])
      ] },
    { n: 7, name: 'Leader', phase: 'Leading', goal: 'Fit diabetes into your life', leads: 'I lead, family on call',
      intro: 'Diabetes comes with you to school, work, parties and road trips. You make plans that fit your life and set the agenda for your visits.',
      you: 'You lead. Your family is there if you call.',
      can: 'Set the agenda for my visit. Take part in a care decision, like a dose change. Manage school, work, travel and sleep around diabetes. Know what my insurance and government funding cover for supplies, and who applies.',
      evidence: 'Leads a visit with my own agenda. Explains what covers my supplies and who applies.',
      unlocks: 'Visit agenda tool, share with clinicians',
      plant: PL('monstera', 'Monstera', 'Monty', 'Big leaves, big plans, fits in anywhere', 7,
        ['Road trip? I am already packed.', 'Big plans today. Diabetes is coming along, obviously.', 'Every leaf gets a window. That is just good planning.'],
        'Monty is stretching into a new corner of the room.',
        'Monstera leaves grow holes so wind passes through without tearing them. Monty fits into any room and bends with whatever the day brings.'),
      skills: [
        SK('L7-01', 'support', 'School and work plan', 'I can tell school or work what they need to know, and keep my supplies with me.',
          ['Read Eating through the day.', 'Make a short list of what school or work needs to know.', 'Talk to one teacher, coach or manager about it yourself.'],
          'Describes their plan for school or work and who knows about it.', 'r11',
          ['Backpack ready', 'shield', 'lime', 'bag', 'matte', 'M', 'Snacks, sensor, plan. This shield rides along in your backpack and never forgets the fast sugar.', 'Matte shield, 38 mm, scuff-proof', 'Packed and ready.']),
        SK('L7-02', 'manage', 'Driving, travel and late nights', 'I can plan for driving, travel, sleepovers and late nights.',
          ['Read Driving with type 1 diabetes.', 'Make a packing list for a night away.', 'Plan one trip or late night with your care team, then try it.'],
          'Explains their plan for driving, travel or a night away.', 'r18',
          ['Night owl', 'cloud', 'blue', 'moon', 'glitter', 'M', 'Out late, still on it. This glittery cloud floats past midnight with a snack in its pocket.', 'Glitter cloud, 42 mm, starry sparkle', 'Late night, good plan.']),
        SK('L7-03', 'know', 'Parties and relationships', 'I know how alcohol, parties and sex can affect my glucose, and how to stay safe.',
          ['Read Alcohol and type 1 diabetes.', 'Read Sex, relationships and diabetes.', 'Ask your care team one question about it, alone if you prefer.'],
          'Can say how alcohol affects lows and what they would do.', 'r17',
          ['Real talk', 'heart', 'teal', 'chat', 'glossy', 'S', 'Grown-up questions get honest answers. This heart has heard it all and does not judge.', 'Glossy heart, 30 mm', 'Ask anything. Stay safe.']),
        SK('L7-04', 'speak', 'Set the agenda', 'I can set the agenda for my visit and take part in a care decision, like a dose change.',
          ['Read Prepare for your next visit.', 'Write your top three things for the visit.', 'Start the visit by sharing your agenda, then help decide one change.'],
          'Leads a visit with their own agenda.', 'r2',
          ['Agenda setter', 'star', 'blue', 'visit', 'foil', 'M', 'You ran the meeting. This shiny star sits at the head of the table.', 'Silver foil star, 40 mm, mirror shine', 'My visit, my list.'])
      ] },
    { n: 8, name: 'Navigator', phase: 'Leading', goal: 'Run your supplies, records and coverage', leads: 'I lead end to end',
      intro: 'Behind every good day is a pharmacy order, a form and a file somewhere. You learn to keep supplies coming, know who pays and find your own records.',
      you: 'You lead from start to finish.',
      can: 'Handle a new problem, like a sick day or a high, start to finish. Manage pharmacy and supply costs. Know what adult diabetes services exist. Decide what family sees.',
      evidence: 'Handles a real or simulated sick day. Shortlist of adult clinics.',
      unlocks: 'Supplies and coverage in my Folio',
      plant: PL('palm', 'Palm', 'Pal', 'Travels well and always knows where the supplies are', 8,
        ['Supplies counted. Refill ordered. Coconut, anyone?', 'Forms? I have a folder for that.', 'I go where the sun goes, and I pack well.'],
        'Pal is checking the supply shelf, again, happily.',
        'Palms grow tall in places that are hard to grow in, because their roots find what they need. Pal keeps everything stocked so nothing runs out.'),
      skills: [
        SK('L8-01', 'run', 'Refills before I run out', 'I can reorder insulin and supplies myself before they run out.',
          ['Read Reordering supplies before you run out.', 'Add a refill date to each supply in About me.', 'Place the next order yourself.'],
          'Reorders one supply without a parent reminding them.', 'r15',
          ['Never run dry', 'drop', 'teal', 'refresh', 'glossy', 'M', 'Full shelf, calm mind. This drop refills itself, in spirit at least.', 'Glossy drop, 38 mm, water-resistant', 'Ordered before I ran out.']),
        SK('L8-02', 'run', 'My pharmacy', 'I can call or visit my pharmacy and handle a refill on my own.',
          ['Read Using the adult pharmacy line.', 'Add your pharmacy to your care team.', 'Pick up or call in one refill yourself.'],
          'Handles one pharmacy refill on their own.', 'r8',
          ['Pharmacy pro', 'hex', 'sky', 'pill', 'matte', 'S', 'You know the counter, the line and the right questions. This hexagon gets a nod from the pharmacist.', 'Matte hexagon, 30 mm', 'I handle my own refills.']),
        SK('L8-03', 'run', 'Who pays', 'I know what covers my supplies, who applies and when it renews.',
          ['Read Help paying for diabetes supplies.', 'Ask a parent which programs or insurance cover your supplies.', 'Put the renewal date in your calendar.'],
          'Explains what covers their supplies and who applies.', 'r16',
          ['Paperwork boss', 'ticket', 'green', 'card', 'foil', 'M', 'Forms are a superpower nobody brags about. This foil ticket does, a little.', 'Gold foil ticket, 45 mm, embossed look', 'I know who pays and when it renews.']),
        SK('L8-04', 'know', 'My records', 'I can find my health records and add a letter or result to my Folio.',
          ['Ask your clinic how to get into the hospital records portal.', 'Find your last clinic letter.', 'Add a link to it in your Folio.'],
          'Shows a record or link they added to their Folio.', null,
          ['Record keeper', 'leaf', 'beige', 'link', 'enamel', 'M', 'Your story, filed where you can find it. This leaf is pressed between the pages for safekeeping.', 'Enamel-look leaf, 38 mm, raised edge', 'My records, my links.'])
      ] },
    { n: 9, name: 'Planner', phase: 'Independent', goal: 'Take charge of privacy and consent', leads: 'I run it, preparing to move',
      intro: 'Your health information is yours. You decide what your family sees, learn your rights and choose who helps with big decisions.',
      you: 'You run it and get ready to move to adult care.',
      can: 'Meet or choose my adult team. Move my records through my Folio. Do a joint or practice visit. Have an emergency plan and contacts.',
      evidence: 'First adult contact made. Transfer packet complete.',
      unlocks: 'I control what my family can see',
      plant: PL('pine', 'Pine', 'Pine', 'Evergreen, private and very good at boundaries', 9,
        ['Some things stay under my branches. Your call.', 'Yes, no or not yet. All good answers.', 'Evergreen means I decide when things change.'],
        'Pine is standing tall and keeping a few things to itself.',
        'Pines stay green all year and keep their needles close. Pine knows that sharing is a choice, and that saying not yet is allowed.'),
      skills: [
        SK('L9-01', 'support', 'What my family sees', 'I can decide what my family sees in Folio, and change it when I want.',
          ['Look at who does each Run my care task.', 'Choose what your parent can see in About me.', 'Tell your parent what you chose and why.'],
          'Has set their own family sharing in Folio.', null,
          ['Window blinds', 'shield', 'sky', 'eye', 'matte', 'S', 'Open a little, open a lot, or closed for now. This shield lets you set the view.', 'Matte shield, 30 mm', 'I choose who sees what.']),
        SK('L9-02', 'know', 'My privacy rights', 'I can explain my privacy and consent rights, including time alone with my clinician.',
          ['Ask your care team what they can share, and with whom.', 'Find out when you can see a clinician without a parent.', 'Explain it back to your care team in your own words.'],
          'Privacy and consent teach-back.', null,
          ['Rights reader', 'shield', 'blue', 'lock', 'holo', 'M', 'Your information, your rules. This holographic lock looks different from every angle, like the fine print.', 'Holographic shield, 38 mm, rainbow shift', 'My health information is mine.']),
        SK('L9-03', 'speak', 'Yes, no or not yet', 'I can agree to or say no to a test or treatment after asking my questions.',
          ['Read How to ask a doctor a hard question.', 'Ask what happens if you say yes, and if you say no.', 'Make one care decision yourself, with your team.'],
          'Asks questions and gives their own answer to a care decision.', 'r3',
          ['Three words', 'flower', 'lime', 'check', 'puffy', 'M', 'Yes, no and not yet are all real answers. This puffy flower has a petal for each.', 'Puffy flower, 40 mm', 'I decide after I ask.']),
        SK('L9-04', 'support', 'My big decision helper', 'I can choose who helps me with big decisions, and tell my care team.',
          ['Think about who you trust most for big choices.', 'Ask them if they are happy to be your helper.', 'Tell your care team, so it shows in your Folio.'],
          'Has named who helps with big decisions.', null,
          ['Wingmate', 'heart', 'beige', 'hand', 'washi', 'S', 'Big choices are easier with the right person beside you. This washi heart is a hand to hold.', 'Washi heart, 32 mm, paper texture', 'My choice of helper.'])
      ] },
    { n: 10, name: 'Owner', phase: 'Independent', goal: 'Move to adult care and own it', leads: 'Me, family by invitation',
      intro: 'The last level brings it all together. You find your adult team, move your records and speak up with clinicians you have never met.',
      you: 'You own it. Family helps when you ask.',
      can: 'Run all five areas. Advocate for myself with clinicians I have never met. Family helps because I ask.',
      evidence: 'Holds Level 9 steadily for months. Final sign-off and transfer.',
      unlocks: 'Full control, family access by invitation',
      plant: PL('oak', 'Giant oak', 'Oakley', 'Deep roots, wide shade, room for everyone', 10,
        ['Deep roots. New soil. No problem.', 'I have grown a lot. Want to sit in the shade?', 'All of this started with a tiny sprout.'],
        'Oakley is rustling quietly, proud of every ring.',
        'Oaks take years to grow and stand for a very long time. Oakley carries every level in its rings and is ready for any new place.'),
      skills: [
        SK('L10-01', 'run', 'Find my adult team', 'I can find and choose my adult diabetes clinic and an adult family doctor.',
          ['Read What changes in adult care.', 'Make a shortlist of adult clinics with your care team.', 'Contact one clinic or family doctor yourself.'],
          'First adult contact made.', 'r14',
          ['Trailblazer', 'leaf', 'green', 'map', 'holo', 'M', 'New path, your map. This holographic leaf points the way and shimmers when you move.', 'Holographic leaf, 40 mm, rainbow shift', 'I found my next team.']),
        SK('L10-02', 'run', 'Move my records', 'I can send my records and handoff note to my new team through Folio.',
          ['Check your links and medication list are up to date.', 'Ask your care team to share the handoff note.', 'Show your Folio card at your first adult visit.'],
          'Transfer packet complete.', null,
          ['Suitcase packed', 'ticket', 'sky', 'send', 'glitter', 'M', 'Everything important, packed and sent ahead. This glittery ticket is one way, and that is exciting.', 'Glitter ticket, 45 mm', 'My story travels with me.']),
        SK('L10-03', 'speak', 'Speak up with new clinicians', 'I can explain my diabetes and what I need to a clinician I have never met.',
          ['Read What is the adult system like?', 'Practise your diabetes in 3 sentences out loud.', 'Do a joint or practice visit with your adult team.'],
          'Explains their diabetes and needs to a new clinician.', 'r1',
          ['New room, same me', 'circle', 'butter', 'chat', 'enamel', 'M', 'New faces, same confident you. This enamel badge walks into any waiting room like it owns the place.', 'Enamel-look circle, 40 mm, gold rim', 'New room, same me.']),
        SK('L10-04', 'support', 'Run it all', 'I run all parts of my care, and my family helps when I ask.',
          ['Look back at every level in your Folio.', 'Choose how your family stays involved, if at all.', 'Final sign-off with your care team.'],
          'Holds every skill steadily. Final sign-off and transfer.', null,
          ['Folio owner', 'star', 'red', 'star', 'foil', 'L', 'The big one. This red foil star is for running your own care, start to finish. You earned every point of it.', 'Red foil star, 55 mm, mirror shine, peels clean', 'Your story, carried forward.'])
      ] }
  ];

  F.PHASE_TONE = { Aware: 'blue-100', Involved: 'blue-300', Shared: 'green-500', Leading: 'green-500', Independent: 'green-900' };

  /* Five theme areas. Each skill carries one as a tag for colour and reporting. tone is a v4 colour name. */
  F.AREAS = [
    { id: 'know',    name: 'Know my health',  label: 'Know my health',  tone: 'blue',   icon: 'book',  sub: 'Understand type 1, insulin, your history and your rights' },
    { id: 'manage',  name: 'Manage my care',  label: 'Manage my care',  tone: 'green',  icon: 'drop',  sub: 'Insulin, devices, food, activity, highs, lows and sick days' },
    { id: 'speak',   name: 'Speak up',        label: 'Speak up',        tone: 'butter', icon: 'chat',  sub: 'Answer, ask and decide with your care team' },
    { id: 'run',     name: 'Run my care',     label: 'Run my care',     tone: 'teal',   icon: 'clock', sub: 'Visits, refills, coverage and moving to adult care' },
    { id: 'support', name: 'Own my support',  label: 'Own my support',  tone: 'beige',  icon: 'users', sub: 'Your people, time alone, privacy and how you feel' }
  ];
  /* Compatibility alias: older callers read F.SKILLS as the five areas. New code uses F.AREAS and the level skills. */
  F.SKILLS = F.AREAS;
  F.AREA_BY_ID = {}; F.AREAS.forEach(function (a) { F.AREA_BY_ID[a.id] = a; });
  F.ALL_SKILLS = [];
  F.SKILL_BY_ID = {};
  /* s.level is the level number; s.sub repeats s.can for older list rows that print a name and a sub line */
  F.LEVELS.forEach(function (l) { l.skills.forEach(function (s) { s.level = l.n; s.sub = s.can; F.ALL_SKILLS.push(s); F.SKILL_BY_ID[s.id] = s; }); });
  F.skillsOfLevel = function (n) { var l = F.LEVELS[Math.min(Math.max(+n || 1, 1), 10) - 1]; return l.skills; };
  F.levelOfSkill = function (id) { var s = F.SKILL_BY_ID[id]; return s ? s.level : 0; };
  F.isSkillId = function (id) { return Object.prototype.hasOwnProperty.call(F.SKILL_BY_ID, id); };
  /* The advance rule: at least this many of a level's skills on their own (default 3 of 4). */
  F.needToAdvance = function (req, n) { var k = F.skillsOfLevel(n).length; req = +req || Math.ceil(0.75 * k); return Math.max(1, Math.min(k, req)); };
  /* A full skill map for someone at level n: lower levels own, this level from `cur` (or learning), higher levels learning. */
  F.skillMap = function (n, cur) {
    var m = {}; cur = cur || {};
    F.ALL_SKILLS.forEach(function (s) { m[s.id] = s.level < n ? 'own' : s.level === n ? (F.SKILL_STATUS[cur[s.id]] ? cur[s.id] : 'learning') : 'learning'; });
    return m;
  };

  F.SKILL_STATUS = { learning: 'Learning', help: 'With help', own: 'On my own' };
  /* One plain line per status, shown wherever the labels appear (research: testers could not tell With help from Learning) */
  F.SKILL_STATUS_HELP = { learning: 'Still learning how. Practising with the care team.', help: 'Does it with a reminder or a hand from family or the care team.', own: 'Does it without being reminded.' };

  F.MOVE_UP_RULES = [
    'Each level has its own goal and 4 skills. A teen moves up when at least 3 of the 4 are on their own (the program can set 2 to 4), the clinician signs off in person at a routine visit and the teen confirms. Family is informed, not given a veto.',
    'Pace: about 3 months minimum per level, typically 6 to 9. Starting around 13, ten levels is roughly 5 to 6 years. Not everyone reaches 10 by 18.',
    'A hard stretch, such as a high-glucose period or illness, pauses progress. It never costs a level. The readiness check suggests a starting level for teens who already have skills above Level 1.',
    'Proposal only: the 40 skills draw on the TRAQ and READDY readiness domains and the Canadian Paediatric Society 2023 transition guidance, written here for type 1 diabetes. Needs review by a diabetes educator.'
  ];
  F.CURRICULUM_FLAG = 'Proposal. Needs review by a diabetes educator before any real use.';

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
  /* Level system v2: each question samples skills in the new curriculum. The 15 questions keep their ids (saved goals and
     answers point at them) and their area tag (q.skill) for the teen's per-area view. q.skills lists the level skills a
     question speaks to, and q.lv is the lowest level it samples. Mapping (needs the diabetes educator's review too):
       q1 L1-01 L1-02 | q2 L1-03 L2-03 | q3 L2-01 L4-03 | q4 L3-01 L4-01 | q5 L2-02 L3-02 | q6 L4-02 L5-01 L5-02
       q7 L2-04 L6-01 | q8 L3-04 L7-04 | q9 L6-03 | q10 L6-02 | q11 L8-01 L8-02 | q12 L8-03 | q13 L4-04
       q14 L9-01 L9-04 L10-04 | q15 L6-04
     Every level is sampled by at least one question. Skills no question samples start as Learning in a placement. */
  F.CHECK_MAP = { q1: ['L1-01', 'L1-02'], q2: ['L1-03', 'L2-03'], q3: ['L2-01', 'L4-03'], q4: ['L3-01', 'L4-01'], q5: ['L2-02', 'L3-02'],
    q6: ['L4-02', 'L5-01', 'L5-02'], q7: ['L2-04', 'L6-01'], q8: ['L3-04', 'L7-04'], q9: ['L6-03'], q10: ['L6-02'], q11: ['L8-01', 'L8-02'],
    q12: ['L8-03'], q13: ['L4-04'], q14: ['L9-01', 'L9-04', 'L10-04'], q15: ['L6-04'] };
  F.CHECK.forEach(function (q) { q.skills = F.CHECK_MAP[q.id] || []; q.lv = Math.min.apply(null, q.skills.map(function (id) { return F.levelOfSkill(id); })); });
  function middle(v) { v = v.slice().sort(function (a, b) { return F.CHECK_RANK[a] - F.CHECK_RANK[b]; }); return v.length ? v[Math.floor((v.length - 1) / 2)] : ''; }
  /* The teen's view of one level skill from a check: the middle of the answers to the questions that sample it, or ''. */
  F.checkSkillView = function (answers, sid) {
    answers = answers || {};
    return middle(F.CHECK.filter(function (q) { return q.skills.indexOf(sid) >= 0 && answers[q.id]; }).map(function (q) { return answers[q.id]; }));
  };
  /* A suggested starting place from a check: the first level whose sampled answers are not all On my own (levels
     below it count as done), and that level's statuses from the answers (unsampled skills stay Learning).
     It is a suggestion for the care team. Only a clinician applies it, in Visit mode. */
  F.checkPlace = function (answers) {
    answers = answers || {}; var level = 10;
    for (var n = 1; n <= 10; n++) {
      var ids = F.skillsOfLevel(n).map(function (s) { return s.id; });
      var got = F.CHECK.filter(function (q) { return answers[q.id] && q.skills.some(function (id) { return ids.indexOf(id) >= 0; }); }).map(function (q) { return answers[q.id]; });
      if (!got.length || got.some(function (v) { return v !== 'own'; })) { level = n; break; }
    }
    var skills = {}; F.skillsOfLevel(level).forEach(function (s) { skills[s.id] = F.checkSkillView(answers, s.id) || 'learning'; });
    return { level: level, skills: skills };
  };

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
  /* Level system v2 migration for one patient. Idempotent, never drops data.
     Old model: p.skills = { know, manage, speak, run, support } scored at every level. New model: one status per skill id
     for all 40 skills. Lower levels become On my own, the current level takes the old area status of each skill's area
     tag, higher levels stay Learning. The old map is kept as p.skillsV1 for reference. A map that already uses skill ids
     only gains missing ids (lower levels On my own, the rest Learning). p.earned (skill id to ISO date) is backfilled for
     On my own skills that have no date: from the sign-off date, stepping back about 4 months per level. */
  F.upgradeSkills = function (p) {
    var lvl = Math.min(Math.max(+p.level || 1, 1), 10), m = p.skills && typeof p.skills === 'object' ? p.skills : {};
    var hasNew = Object.keys(m).some(F.isSkillId), hasOld = F.AREAS.some(function (a) { return m[a.id] !== undefined; });
    if (hasOld) {
      var old = {}; F.AREAS.forEach(function (a) { if (m[a.id] !== undefined) { old[a.id] = m[a.id]; delete m[a.id]; } });
      if (!p.skillsV1) p.skillsV1 = old;
      if (!hasNew) { var cur = {}; F.skillsOfLevel(lvl).forEach(function (s) { cur[s.id] = F.SKILL_STATUS[old[s.area]] ? old[s.area] : 'learning'; }); m = F.skillMap(lvl, cur); }
    }
    F.ALL_SKILLS.forEach(function (s) { if (!F.SKILL_STATUS[m[s.id]]) m[s.id] = s.level < lvl ? 'own' : 'learning'; });
    p.skills = m;
    if (!p.earned || typeof p.earned !== 'object') p.earned = {};
    var base = (p.levelSignoff && p.levelSignoff.date) || p.lastNote || '2026-10-01', t0 = Date.parse(base + 'T12:00:00Z') || Date.now();
    var iso = function (t) { return new Date(t).toISOString().slice(0, 10); };
    F.ALL_SKILLS.forEach(function (s, i) {
      if (m[s.id] !== 'own' || p.earned[s.id]) return;
      if (s.level < lvl) p.earned[s.id] = iso(t0 - (lvl - 1 - s.level) * 120 * 864e5 - (3 - i % 4) * 9 * 864e5);
      else { var after = p.lastNote && p.lastNote > base ? p.lastNote : base; p.earned[s.id] = after; }
    });
    return p;
  };
  F.defaults = function (p) {
    if (F.upgradeSkills) F.upgradeSkills(p);
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
  /* Level system v2 seeds: the four statuses of the patient's CURRENT level, in skill order. Lower levels are On my own,
     higher levels Learning (F.skillMap). Earned dates are backfilled from the sign-off date in F.defaults. */
  function sk(level, a, b, c, d) { var ids = F.skillsOfLevel(level).map(function (s) { return s.id; }), cur = {}; [a, b, c, d].forEach(function (v, i) { cur[ids[i]] = v; }); return F.skillMap(level, cur); }

  F.SEED = {
    v: 1,
    clinic: { doctor: 'Dr. A. Okafor', org: "Sample Children's Hospital", team: 'Paediatric team' },
    patients: [
      P('p1', 'Maya', 'R.', 17, '48210937', 4, sk(4, 'own', 'help', 'own', 'learning'), '2026-10-12', false, {
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
      P('p2', 'Theo', 'K.', 15, '33901148', 2, sk(2, 'own', 'learning', 'help', 'learning'), '2026-09-30', true),
      P('p3', 'Priya', 'S.', 16, '77142093', 7, sk(7, 'own', 'own', 'own', 'help'), '2026-10-22', false),
      P('p4', 'Jordan', 'L.', 17, '15028841', 5, sk(5, 'own', 'help', 'learning', 'help'), '2026-10-03', false, {
        notes: [{ id: 'n4', kind: 'Handoff note', author: 'Dr. Okafor', role: 'peds', date: '2026-10-03', draft: true, shared: true,
          text: 'For the adult team: Jordan is still choosing an adult clinic. Draft until the referral is sent.',
          fields: { meds: '', referrals: 'Adult endocrinology referral not sent yet.', upcoming: '', managed: 'Insulin pens and a glucose sensor.', watch: '' } }]
      }),
      P('p5', 'Sam', 'W.', 14, '99214470', 3, sk(3, 'help', 'learning', 'learning', 'learning'), '2026-08-29', true),
      P('p6', 'Ana', 'M.', 18, '60483315', 9, sk(9, 'own', 'own', 'own', 'help'), '2026-10-20', false),
      P('p7', 'Eli', 'T.', 13, '22767089', 1, sk(1, 'learning', 'help', 'learning', 'learning'), '2026-10-08', false),
      /* Trade-show cards: four people with printed Folio tags (FO-1001 to FO-1004). cardId is the code printed on the tag,
         and the setup screen accepts it as well as the 8-digit Folio ID. Fictional demo profiles, nothing sensitive. */
      P('p8', 'Sam', 'Orr', 14, '51730264', 2, sk(2, 'own', 'help', 'help', 'learning'), '2026-10-16', false, {
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
      P('p9', 'Amber', 'Baiden', 16, '64028715', 5, sk(5, 'own', 'help', 'own', 'learning'), '2026-10-21', false, {
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
      P('p10', 'Lauren', 'Martin', 17, '70356148', 8, sk(8, 'own', 'help', 'own', 'own'), '2026-10-25', false, {
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
      P('p11', 'Jake', 'Querin', 17, '83140572', 6, sk(6, 'own', 'own', 'learning', 'help'), '2026-10-28', false, {
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
  /* Card shapes offered in the portal, in picker order. 'rounded' (the ID card) is the default; old saved values
     (square, tab) and anything unknown render as the ID card, so no migration is needed. */
  F.CARD_SHAPES = { star: 'Star', heart: 'Heart', cloud: 'Cloud', tag: 'Tag', rounded: 'ID card' };
  F.cardShape = function (s) { return Object.prototype.hasOwnProperty.call(F.CARD_SHAPES, s) ? s : 'rounded'; };
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
