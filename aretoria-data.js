/**
 * Aretoria v1 — realm, guardian and dialogue data (no DOM, importable in node for tests).
 *
 * Cosmology: V1 "horizontal" Aretoria — six VIA-virtue realms plus the Shadow Realm
 * (seven environments), entered from the Axial Realm (the shared realm of existence,
 * where Eirena the Eternal Weaver holds the golden thread). Irishnu, the Guide, greets
 * you in the hub. Names, temples and virtues come from Cassidy's Aretoria project notes;
 * the Shadow Realm has no named central guardian there, so it uses the neutral name
 * "Guardian of the Veil". Since v25 every realm host is presented as that realm's
 * Guardian and described as a warrior suited to the realm (guardian.warrior).
 * v26 wires painted guardian portraits, Irishnu's portrait, and realm backdrops.
 * v27 adds the Axial hub painted backdrop (HUB.realmBackdrop = RP('axial')); entry still uses SHRINE_IMAGE.
 * v28: mobile portrait siblings under .../mobile/ (~576×1024); pickArtPath + ART_MOBILE_MQ for responsive art.
 *
 * (Authoring note, never shown to visitors: Irishnu is a wise fool at heart. He does
 * what is needed and often wraps it in dry wit, a riddle or gentle misdirection, but the
 * sincere guidance always comes first and the humour is never announced or named.)
 *
 * Dialogue trees are scripted (no AI). A choice's `next` is a node id in the same tree
 * or one of: '@hub' (return to the Axial hub), '@close' (close the dialogue),
 * '@realm:<id>' (travel straight to another realm). A choice with `save: true` stores the
 * text typed in that node's input under the legacy per-day key
 * "mec-realm:YYYY-MM-DD:<realm>" (same key portal.js has always used).
 */

export const GROUNDING = 'How does this fit my real circumstances?';

/* Cassidy's own words (from his Aretoria note and creed). Keep verbatim; never paraphrase. */
export const OPENING = "Within me blooms Aretoria, a constellation of legendary realms where ancient advisors, masters of space and time, guide adventurous souls who rise to the challenge of creating, building, and adventuring in an ever-expanding universe.";
export const CLOSING = "Thus, I stand—a testament to the power of a life lived with intention and grace.";
export const CREED = {
  title: "The Divine Evolution Creed",
  paragraphs: [
      "I affirm one infinite, eternal God: omnipotent, omniscient, omnipresent, omni-benevolent, and omnitemporal, encompassing the ruliad of all possible rules, computations, histories, and possibilities. All that is, all that could be, all that is imagined, and even all that appears as non-being or impossibility exists within and as expressions of this single self-existent reality, with the material realm, and nature itself, existing as a portion of this reality.",
      "Within this oneness exists eternal relationality: a divine community of persons in perfect unity, love, and distinction — the fundamental pattern of consciousness and relationship.",
      "Humanity is not separate from this reality but literally of its kind: intelligences on an eternal journey of growth, refinement, and exaltation. Our purpose is to progress toward godhood — to become joint-heirs and co-creators, increasing in glory, intelligence, and creative power forever.",
      "We live this truth through reason, science, ethical discipline, and secular wisdom in daily life. Evidence, liberty, critical inquiry, and human flourishing are the proper methods for navigating existence. Revelation, when it occurs, aligns with and accelerates natural law rather than violating it.",
      "Thus, the cosmos is a living, evolving divinity awakening and dancing through us, as us. Through God, we are becoming more fully conscious and glorious in and as the universe. Every act of learning, creation, love, and moral courage participates in this grand divinization. We are evolving facets of the divine, called to consciously accelerate its unfolding."
  ],
  affirmation: ["This is the nature of reality.", "This is who we are.", "I am part of this."]
};


/**
 * How long a narration line (the opening line, the closing line) stays on screen before
 * it moves on by itself: about 4 s plus 60 ms per character. Visitors can always tap,
 * click, or press Enter/Space to move on sooner.
 */
export const READ_BASE_MS = 4000;
export const READ_PER_CHAR_MS = 60;
export function readMs(text) {
  const n = String(text == null ? '' : text).trim().length;
  return READ_BASE_MS + READ_PER_CHAR_MS * n;
}

/** Legacy-compatible storage key for a realm's reflection on a Gregorian date. */
export function reflectionKey(iso, realmId) {
  return `mec-realm:${iso}:${realmId}`;
}

const pad = (n) => String(n).padStart(2, '0');
export function isoDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Which of Cassidy's rituals falls on this (local) date, and which realm suits it.
 * Sunday → weekly self-audit (Justice) · 1st/3rd Saturday → relationship reflection
 * (Humanity) · last day of the month → monthly review (Temperance) · otherwise the
 * daily reflection (Wisdom).
 */
export function ritualFor(date) {
  const dow = date.getDay();
  const dom = date.getDate();
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  if (dow === 0) return { id: 'sunday-audit', name: 'the Sunday self-audit', realm: 'justice',
    line: 'It is Sunday: the evening of your weekly self-audit and 1–10 scorecard.' };
  if (dow === 6 && (dom <= 7 || (dom >= 15 && dom <= 21))) return { id: 'relationship', name: 'the relationship reflection', realm: 'humanity',
    line: 'It is the ' + (dom <= 7 ? 'first' : 'third') + ' Saturday: your relationship reflection, held in the Empathy and Compassion temples.' };
  if (dom === last) return { id: 'monthly', name: 'the monthly review', realm: 'temperance',
    line: 'It is the last day of the month: time for your monthly review.' };
  return { id: 'daily', name: 'the daily reflection', realm: 'wisdom',
    line: 'Today is a day for your daily reflection.' };
}

/** Replace {tokens} in dialogue text. Unknown tokens are left as-is (tests catch them). */
export function fillTokens(text, ctx) {
  return String(text).replace(/\{(\w+)\}/g, (m, k) => (ctx && ctx[k] != null ? String(ctx[k]) : m));
}

export const TOKENS = ['ritual', 'ritualLine', 'suggest', 'suggestTemple', 'suggestId', 'weekday'];

export function tokenContext(date, realms = REALMS) {
  const r = ritualFor(date);
  const sug = realms.find((x) => x.id === r.realm) || realms[0];
  return {
    ritual: r.name,
    ritualLine: r.line,
    suggest: sug.name,
    suggestTemple: sug.temple,
    suggestId: sug.id,
    weekday: date.toLocaleDateString('en-US', { weekday: 'long' })
  };
}

/* -------------------------------------------------------------------------- */
/* Hub: the Axial Realm and Irishnu                                            */
/* -------------------------------------------------------------------------- */

export const HUB = {
  id: 'axial',
  name: 'The Axial Realm',
  sub: 'The shared realm of existence',
  virtues: ['Beauty', 'Graciousness', 'Integrity', 'Purposefulness', 'Wonder'],
  thread: 'Eirena the Eternal Weaver holds the golden thread that connects every realm.'
};

export const GUIDE = {
  id: 'irishnu',
  name: 'Irishnu',
  title: 'the Guide',
  source: 'notes', // name/persona from notes; appearance is not described there
  color: '#f1d58e',
  dialogue: {
    start: 'greet',
    nodes: {
      greet: {
        text: 'Ah, Cassidy. Right on time, or time is right on you; from the center it is hard to tell which. Welcome to the Axial Realm, the one whole that holds every realm within it. Eirena the Eternal Weaver holds the golden thread. I hold the doors, and, when it is needed, the traveler’s attention.',
        choices: [
          { label: 'What are the realms?', next: 'realms' },
          { label: 'Where should I go today?', next: 'today' },
          { label: 'Why is there a Shadow Realm?', next: 'shadow' },
          { label: 'I know the way. Let me explore.', next: 'go' }
        ]
      },
      realms: {
        text: 'Six realms of light, one for each great virtue: Wisdom, Courage, Humanity, Justice, Temperance and Transcendence. Call them six rooms in one house. Travelers like to call it a mansion; it still has only one front door, and you are standing in it. Eighty-one virtues live in those rooms, and the few that refuse to pick just one (Beauty, Graciousness, Integrity, Purposefulness, Wonder) stay here on the axis with me. Each realm has a temple and a Guardian, a warrior of its own kind, who will speak with you.',
        choices: [
          { label: 'Where should I go today?', next: 'today' },
          { label: 'And the Shadow Realm?', next: 'shadow' },
          { label: 'Who are you, really?', next: 'who' },
          { label: 'Thank you. I’ll explore.', next: 'go' }
        ]
      },
      who: {
        text: 'Your guide. I point at doors, and now and then at the one walking through them; he is the door that matters most and opens least. Every realm out there is one face of the same whole, Cassidy, and so are you. I am simply the reminder, wearing a robe so you will take me seriously.',
        choices: [
          { label: 'Where should I go today?', next: 'today' },
          { label: 'Then remind me: let me explore.', next: 'go' }
        ]
      },
      today: {
        text: '{ritualLine} I could pretend to consult the stars, but the calendar already did: the {suggest} Realm suits it, and its Guardian waits in the {suggestTemple}. Whatever door you take, keep one small question in your pocket on the way back: how does this fit my real circumstances? It is a little question. It opens all the big doors.',
        choices: [
          { label: 'Take me to {suggest}.', next: '@realm:{suggestId}' },
          { label: 'Tell me about the realms first.', next: 'realms' },
          { label: 'I’ll choose my own gate.', next: 'go' }
        ]
      },
      shadow: {
        text: 'Every lamp worth lighting throws a shadow. That is not the lamp failing; that is the lamp working. Aretoria walks the middle path: darkness is not evil to deny but a distortion, an imbalance on the way to becoming whole. Below the axis lies the Veil of Shadows, an obsidian labyrinth with a mirror pool and a dim flame of awareness. Go there when anger, envy or regret calls. No one is judged there. The mirror does not even remember faces.',
        choices: [
          { label: 'What are the realms of light?', next: 'realms' },
          { label: 'Where should I go today?', next: 'today' },
          { label: 'I understand. Let me explore.', next: 'go' }
        ]
      },
      go: {
        text: 'Then choose a gate. Touch one and you will cross; I have yet to see one refuse. To come home, follow the golden thread back to the axis, the only road in Aretoria that grows shorter the farther you walk it. The Hall of Virtues and your Creed wait here too, and so do I. Leaving the center is the one thing I have never managed.',
        choices: [
          { label: 'Walk the realms', next: '@close' },
          { label: 'Open the Hall of Virtues', next: '@hall' },
          { label: 'Read my Creed', next: '@creed' }
        ]
      }
    }
  }
};

/* -------------------------------------------------------------------------- */
/* The seven environments                                                      */
/* -------------------------------------------------------------------------- */

/** Guardian portraits: assets/aretoria/guardians/<guardian slug>.jpg (landscape 1024×576). */
export const GUARDIAN_DIR = 'assets/aretoria/guardians/';
export const GP = (slug) => `${GUARDIAN_DIR}${slug}.jpg`;
/** Mobile portrait guardians: assets/aretoria/guardians/mobile/<slug>.jpg (~576×1024). */
export const GPm = (slug) => `${GUARDIAN_DIR}mobile/${slug}.jpg`;

/** Realm painted backdrops: assets/aretoria/realms/<realm id>.jpg (landscape 1024×576). */
export const REALM_DIR = 'assets/aretoria/realms/';
export const RP = (realmId) => `${REALM_DIR}${realmId}.jpg`;
/** Mobile portrait realm backdrops: assets/aretoria/realms/mobile/<id>.jpg (~576×1024). */
export const RPm = (realmId) => `${REALM_DIR}mobile/${realmId}.jpg`;

/** matchMedia query for portrait art (aligned with CSS @media max-width: 699px). */
export const ART_MOBILE_MQ = '(max-width: 699px)';

export const REALMS = [
  {
    id: 'courage', name: 'Courage', color: '#ef7a4f', order: 1,
    temple: 'Forge of Valor',
    templeDesc: 'An anvil-shaped fortress of obsidian, glowing with inner flames, where virtues are tempered like steel.',
    landscape: 'Jagged mountains, rivers of molten determination, storm-swept peaks.',
    virtues: ['Courage', 'Assertiveness', 'Confidence', 'Determination', 'Enthusiasm', 'Optimism', 'Passion', 'Perseverance', 'Resilience', 'Tenacity', 'Honesty'],
    particles: 'embers',
    guardianPortrait: GP('valorix'),
    realmBackdrop: RP('courage'),
    guardian: {
      name: 'Valorix', title: 'the Stormheart', source: 'notes',
      warrior: 'storm-forged champion',
      look: 'Storm-forged champion: colossal knight armored in lightning-forged plates, mane of thunderclouds, eyes like embers.'
    },
    dialogue: {
      start: 'greet',
      nodes: {
        greet: {
          text: 'Cassidy! Stand with me on the anvil-ground. I am Valorix the Stormheart, Guardian of Courage, a champion forged in the storm itself. Courage is not the absence of fear, but the thunder that drowns it out. What battle brings you to the Forge of Valor?',
          choices: [
            { label: 'Something I’ve been avoiding.', next: 'virtue' },
            { label: 'I’m angry and need somewhere to put it.', next: 'anger' },
            { label: 'Tell me about your realm.', next: 'virtue' }
          ]
        },
        virtue: {
          text: 'Feel the fear. It is the edge of the known. Honor it as a signal, not a sentence. My forge tempers Assertiveness, Determination and Resilience. Endura the Unbroken wears her scars as veins of gold, and Auriel the Dawnbringer reminds us that every night ends.',
          choices: [
            { label: 'Help me face it.', next: 'reflect' },
            { label: 'What about anger?', next: 'anger' }
          ]
        },
        anger: {
          text: 'Then strike the anvil, not the person. Anger shaped well becomes a force for change: standing up for yourself, holding a boundary, speaking plainly. Unshaped, it only burns. Let us shape it.',
          choices: [
            { label: 'Show me what to forge.', next: 'reflect' }
          ]
        },
        reflect: {
          text: 'For your weekly 1–10 scorecard, Courage asks one thing: what is one thing you have been avoiding that you could face today, in a single deliberate step?',
          input: { placeholder: 'One step I will take…' },
          choices: [
            { label: 'Seal it in the forge', next: 'bless', save: true },
            { label: 'I’ll carry it unwritten', next: 'bless' }
          ]
        },
        bless: {
          text: 'Say it with a fist to your chest: “I feel the edge. I choose the step. I am the force.” Then ask yourself honestly how this fits your real circumstances. Go, Cassidy. I answer every time.',
          choices: [
            { label: 'Return to the Axial hub', next: '@hub' },
            { label: 'Stay by the forge', next: '@close' }
          ]
        }
      }
    }
  },
  {
    id: 'justice', name: 'Justice', color: '#f1d58e', order: 2,
    temple: 'Scales of Equity',
    templeDesc: 'An enormous balance beam suspended in the air, engraved in gold with laws and oaths.',
    landscape: 'Grand halls of marble and balanced scales amid orderly cities.',
    virtues: ['Justice', 'Fairness', 'Integrity', 'Honor', 'Loyalty', 'Trust', 'Sincerity', 'Truthfulness', 'Respect', 'Responsibility', 'Reliability', 'Dignity'],
    particles: 'dust',
    guardianPortrait: GP('justar'),
    realmBackdrop: RP('justice'),
    guardian: {
      name: 'Justar', title: 'the Balancer', source: 'notes',
      warrior: 'paladin of the balance',
      look: 'Paladin of the balance: scale-bearing holy knight upholding fairness.'
    },
    dialogue: {
      start: 'greet',
      nodes: {
        greet: {
          text: 'Be welcome under the Scales of Equity, Cassidy. I am Justar the Balancer, Guardian of Justice, a paladin sworn to the balance. My blade stays sheathed; the scale does my fighting. Every oath engraved on this beam was once a small choice. I do not condemn; I weigh. What would you place on the scales?',
          choices: [
            { label: 'My week.', next: 'audit' },
            { label: 'What do the scales measure?', next: 'virtue' },
            { label: 'A decision about fairness.', next: 'virtue' }
          ]
        },
        virtue: {
          text: 'Integrity, Fairness, Honor, Responsibility. Rectus the Unswerving stands like a pillar, Valoris the Oath-Guardian watches over your vows, Creda the Trust-Guardian safeguards trust, and Verax the Open speaks plainly. Justice begins with being honest about what was yours to carry.',
          choices: [
            { label: 'Weigh my week with me.', next: 'audit' }
          ]
        },
        audit: {
          text: 'Weigh as your Sunday self-audit does. Separate the karma you could control from the karma you could not. Hold yourself to the first; release the second without shame.',
          choices: [
            { label: 'I’m ready to weigh it.', next: 'reflect' },
            { label: 'Remind me of the virtues first.', next: 'virtue' }
          ]
        },
        reflect: {
          text: 'Where did you act with integrity this week, and where did the scales tip? Name one thing that was truly yours to make right.',
          input: { placeholder: 'Where the scales tipped, and what I’ll set right…' },
          choices: [
            { label: 'Engrave it on the beam', next: 'bless', save: true },
            { label: 'Weigh it in silence', next: 'bless' }
          ]
        },
        bless: {
          text: 'The beam steadies. Balance is not perfection, Cassidy; it is honest correction, made again and again. Ask how this fits your real circumstances, then keep your word to yourself.',
          choices: [
            { label: 'Return to the Axial hub', next: '@hub' },
            { label: 'Remain in the marble halls', next: '@close' }
          ]
        }
      }
    }
  },
  {
    id: 'humanity', name: 'Humanity', color: '#6fd39a', order: 3,
    temple: 'Hearth of Hearts',
    templeDesc: 'A circular pavilion of living wood and crystal veins, warm as an eternal bonfire, with a fountain of empathy at its core.',
    landscape: 'Blooming meadows, rivers of empathy, groves of bioluminescent vines, bridges of woven light.',
    virtues: ['Love', 'Empathy', 'Compassion', 'Loyalty', 'Unity', 'Kindness', 'Patience', 'Peace', 'Harmony', 'Generosity', 'Acceptance', 'Gentleness'],
    particles: 'lanterns',
    guardianPortrait: GP('amara'),
    realmBackdrop: RP('humanity'),
    guardian: {
      name: 'Amara', title: 'the Heartbloom', source: 'notes',
      warrior: 'warrior-healer',
      look: 'Warrior-healer: vine- and rose-crowned defender whose chest opens into an infinite garden of light.'
    },
    dialogue: {
      start: 'greet',
      nodes: {
        greet: {
          text: 'Come in from the cold, dear one. I am Amara the Heartbloom, Guardian of Humanity, a warrior-healer: these hands bind wounds, and when a heart must be defended, they hold the shield. Sit by the Hearth of Hearts. The fountain of empathy has been flowing all day, waiting for you. How is your heart, Cassidy?',
          choices: [
            { label: 'Full. I want to share it.', next: 'virtue' },
            { label: 'Heavy. Someone is on my mind.', next: 'heavy' },
            { label: 'Tell me about the Hearth.', next: 'virtue' }
          ]
        },
        virtue: {
          text: 'Four virtues hold this realm together: empathy, compassion, loyalty and unity. Mercy the Healer soothes pain, Coris the Reflector feels with you, Symphona the Weaver turns discord into harmony, and Concord the Circle binds us all.',
          choices: [
            { label: 'Help me reflect on my people.', next: 'reflect' },
            { label: 'Someone is weighing on me.', next: 'heavy' }
          ]
        },
        heavy: {
          text: 'Then let us not hurry. Patience is a virtue of this realm too. Tempora the Timeless is in no rush, and Seren the Still can calm any storm. Step into the pool of their story and let your heart weave with theirs.',
          choices: [
            { label: 'I’m ready to reflect.', next: 'reflect' }
          ]
        },
        reflect: {
          text: 'On the first and third Saturdays you enter the Empathy and Compassion temples for your relationship reflection. Ask with me now: how did my actions ripple through my people? Who could use my empathy or loyalty, and how will I show it?',
          input: { placeholder: 'Who, and how I’ll show it…' },
          choices: [
            { label: 'Let the fountain keep it', next: 'bless', save: true },
            { label: 'Hold it in my heart', next: 'bless' }
          ]
        },
        bless: {
          text: 'May your kindness be a spark in Aretoria’s dawn. Before you go, ask gently how this fits your real circumstances. Then go and love someone in a way they can feel.',
          choices: [
            { label: 'Return to the Axial hub', next: '@hub' },
            { label: 'Stay by the hearth', next: '@close' }
          ]
        }
      }
    }
  },
  {
    id: 'temperance', name: 'Temperance', color: '#8fd8d0', order: 4,
    temple: 'Veil of Balance',
    templeDesc: 'A translucent dome of silk-like energy that shifts to keep its equilibrium.',
    landscape: 'Serene meadows and calm seas with minimalist architecture; a tempering pool.',
    virtues: ['Temperance', 'Moderation', 'Self-discipline', 'Forgiveness', 'Humility', 'Contentment', 'Tact', 'Commitment', 'Modesty'],
    particles: 'mist',
    guardianPortrait: GP('moder'),
    realmBackdrop: RP('temperance'),
    guardian: {
      name: 'Moder', title: 'the Equilibrator', source: 'notes',
      warrior: 'disciplined monk-warrior',
      look: 'Disciplined monk-warrior: silk-robed balancer harmonizing extremes.'
    },
    dialogue: {
      start: 'greet',
      nodes: {
        greet: {
          text: 'Breathe with the tide, Cassidy. In… and out. I am Moder the Equilibrator, Guardian of Temperance, a monk-warrior who trained a lifetime to strike once, and to know when not to strike at all. The Veil of Balance moves so it never has to break. What feels out of balance?',
          choices: [
            { label: 'I’ve been running hot.', next: 'pool' },
            { label: 'Teach me balance.', next: 'virtue' },
            { label: 'I need to let something go.', next: 'virtue' }
          ]
        },
        virtue: {
          text: 'Moderation, Self-discipline, Forgiveness, Contentment. Regula holds the reins on impulse, Absolva the Releaser lets old grudges dissolve, and Paxara the Serene finds joy in enough. Restraint and release are not opposites; they are two hands on the same thread.',
          choices: [
            { label: 'Let me reflect.', next: 'reflect' },
            { label: 'Where do I cool down?', next: 'pool' }
          ]
        },
        pool: {
          text: 'This is the tempering pool, where the archway from the Shadow Realm opens. Fire cools here into measured passion. Ask it: how do I harness this fire without burning?',
          choices: [
            { label: 'I’m ready to reflect.', next: 'reflect' }
          ]
        },
        reflect: {
          text: 'Let your monthly review begin here, in the stillness. Where do you need more restraint, and where more forgiveness, toward others or yourself?',
          input: { placeholder: 'More restraint in… more forgiveness for…' },
          choices: [
            { label: 'Let the veil hold it', next: 'bless', save: true },
            { label: 'Release it to the tide', next: 'bless' }
          ]
        },
        bless: {
          text: 'Enough is a feast, Cassidy. Ask how this fits your real circumstances, then take one breath slower than you want to. Balance travels with you.',
          choices: [
            { label: 'Return to the Axial hub', next: '@hub' },
            { label: 'Linger by the calm sea', next: '@close' }
          ]
        }
      }
    }
  },
  {
    id: 'wisdom', name: 'Wisdom', color: '#7fb8ff', order: 5,
    temple: 'Prism of Insight',
    templeDesc: 'A towering structure of iridescent crystal that refracts light into rainbows of wisdom.',
    landscape: 'Ancient forests of glowing trees, crystal-clear lakes reflecting infinite possibilities, floating libraries.',
    virtues: ['Wisdom', 'Vision', 'Understanding', 'Creativity', 'Imagination', 'Equanimity', 'Wonder', 'Orderliness', 'Purposefulness', 'Preparedness', 'Idealism', 'Flexibility', 'Ethicality'],
    particles: 'motes',
    guardianPortrait: GP('sophia'),
    realmBackdrop: RP('wisdom'),
    guardian: {
      name: 'Sophia', title: 'the Eternal Oracle', source: 'notes',
      warrior: 'battle-sage',
      look: 'Battle-sage: luminous figure with eyes holding the weight of ages, robes woven from threads of time.'
    },
    dialogue: {
      start: 'greet',
      nodes: {
        greet: {
          text: 'Welcome, Cassidy. I am Sophia the Eternal Oracle, Guardian of Wisdom, a battle-sage who wins most battles before they begin. The Prism has been turning your light into colors all day. I have no quick answers to give you, only the quiet truth that lasts. What are you seeking?',
          choices: [
            { label: 'Clarity on a decision.', next: 'virtue' },
            { label: 'To understand my day.', next: 'reflect' },
            { label: 'Tell me of your realm.', next: 'lore' }
          ]
        },
        lore: {
          text: 'Floating libraries drift over lakes that reflect every possibility. Elowen the Dreamshaper asks “what if?”, Orion the Starweaver weaves dreams from constellations, Calyx the Stillpoint keeps the waters calm, and Lumora the Farseeing looks down the roads ahead.',
          choices: [
            { label: 'And what of a decision?', next: 'virtue' },
            { label: 'Let me reflect.', next: 'reflect' }
          ]
        },
        virtue: {
          text: 'True wisdom balances heart and mind. Vision shows you the road, Understanding shows you the people on it, and Equanimity keeps you steady enough to see both. Do not hurry the answer. Let it surface.',
          choices: [
            { label: 'Help me reflect.', next: 'reflect' }
          ]
        },
        reflect: {
          text: 'For your daily reflection, look into the lake: what are you seeing more clearly today than you did yesterday?',
          input: { placeholder: 'Today I see more clearly…' },
          choices: [
            { label: 'Write it in the floating library', next: 'bless', save: true },
            { label: 'Keep it in silence', next: 'bless' }
          ]
        },
        bless: {
          text: 'Light passes through you and becomes many colors; that is not confusion, it is richness. Now ask the question that keeps wisdom honest: how does this fit your real circumstances? Go gently, Cassidy.',
          choices: [
            { label: 'Return to the Axial hub', next: '@hub' },
            { label: 'Stay beneath the Prism', next: '@close' }
          ]
        }
      }
    }
  },
  {
    id: 'transcendence', name: 'Transcendence', color: '#c9a7f0', order: 6,
    temple: 'Nebula of Awe',
    templeDesc: 'A swirling galaxy-shaped sanctuary that expands with every act of appreciation.',
    landscape: 'Ethereal clouds and starry voids, with temples that phase in and out of visibility.',
    virtues: ['Gratitude', 'Hope', 'Joyfulness', 'Beauty', 'Reverence', 'Faith', 'Service', 'Thankfulness'],
    particles: 'stars',
    guardianPortrait: GP('auria'),
    realmBackdrop: RP('transcendence'),
    guardian: {
      name: 'Auria', title: 'the Awestruck', source: 'notes',
      warrior: 'celestial seraph-knight',
      look: 'Celestial seraph-knight: galaxy-robed, winged, inspiring wonder.'
    },
    dialogue: {
      start: 'greet',
      nodes: {
        greet: {
          text: 'Oh, Cassidy, look up. I am Auria the Awestruck, Guardian of Transcendence, a seraph-knight of the high stars: my wings are for lifting others, my lance for keeping wonder safe. The Nebula grew a little when you arrived; it expands with every act of appreciation. What have you come to celebrate?',
          choices: [
            { label: 'Something good happened.', next: 'virtue' },
            { label: 'I need hope.', next: 'hope' },
            { label: 'Show me your realm.', next: 'virtue' }
          ]
        },
        virtue: {
          text: 'Gratitude, Joy, Beauty, Reverence. Thankara the Appreciator sings over every gift, Gleam the Reveler dances, Esthara reveals splendor, and Sanctus guards the altar. Festivals and celebrations are sacred work here. Joy shared is joy made real.',
          choices: [
            { label: 'Let me give thanks.', next: 'reflect' },
            { label: 'And hope?', next: 'hope' }
          ]
        },
        hope: {
          text: 'Lumen the Beacon carries a lantern for dark paths. Hope is not pretending the night is not there; it is knowing the stars are still in it. Look: those temples fade and return. So does light.',
          choices: [
            { label: 'Let me reflect.', next: 'reflect' }
          ]
        },
        reflect: {
          text: 'Name it so the Nebula can grow: what filled you with awe, hope or gratitude recently?',
          input: { placeholder: 'I’m grateful for…' },
          choices: [
            { label: 'Add it to the stars', next: 'bless', save: true },
            { label: 'Keep it as a private star', next: 'bless' }
          ]
        },
        bless: {
          text: 'There. Did you see it brighten? Carry that wonder down to earth with you, and ask how it fits your real circumstances. Your next festival is closer than you think.',
          choices: [
            { label: 'Return to the Axial hub', next: '@hub' },
            { label: 'Float among the stars', next: '@close' }
          ]
        }
      }
    }
  },
  {
    id: 'shadow', name: 'Shadow', color: '#8a7fa6', order: 7,
    temple: 'Veil of Shadows',
    templeDesc: 'An obsidian labyrinth of veiled chambers; a mirror pool reveals inner distortions, and a dim flame of awareness burns at its heart.',
    landscape: 'A misty twilight expanse of echoing caverns, thorny thickets and twisted mirrors, with bridges to Courage, Humanity and Temperance.',
    virtues: [], // cautionary aspects, not virtues
    aspects: ['Revenge (Vexara)', 'Envy (Invidia)', 'Deceit (Slytheron)', 'Destructive Desire (Ravena)', 'Greed (Aurum)', 'Wrath'],
    particles: 'fog',
    guardianPortrait: GP('shadow'),
    realmBackdrop: RP('shadow'),
    guardian: {
      name: 'Guardian of the Veil', title: 'the Veiled Sentinel', source: 'neutral',
      warrior: 'veiled sentinel',
      look: 'Veiled sentinel: hooded guardian holding the dim flame of awareness (no central guardian is named in the notes).'
    },
    dialogue: {
      start: 'greet',
      nodes: {
        greet: {
          text: 'In Aretoria’s whole, what shadow calls? I am the Guardian of the Veil, the veiled sentinel who stands watch where the light grows thin. You entered the misty veil, Cassidy. That took honesty. Nothing here is judged. The mirror pool only shows what is bent, so that it can be made straight.',
          choices: [
            { label: 'Something dark is pulling at me.', next: 'aspects' },
            { label: 'What is this place?', next: 'veil' },
            { label: 'Show me the way out.', next: 'bridges' }
          ]
        },
        veil: {
          text: 'The Veil of Shadows. Around us lie the aspect temples: Vexara’s smoldering fortress of revenge, Invidia’s tower of cracked emeralds, Slytheron’s halls of masks, Ravena’s volcanic pit, Aurum’s vault of crumbling gold. None is evil to deny; each is a distortion asking to be integrated.',
          choices: [
            { label: 'I recognize one of them.', next: 'aspects' },
            { label: 'Where do the bridges lead?', next: 'bridges' }
          ]
        },
        aspects: {
          text: 'Then name it, and the dim flame grows. Every shadow protects something: revenge guards a wound, envy hides a longing, deceit shields a fear. Look into the pool: how does this distort your becoming, and what light redeems it?',
          choices: [
            { label: 'I’ll look.', next: 'reflect' }
          ]
        },
        reflect: {
          text: 'What feeling are you resisting, and what is it trying to protect?',
          input: { placeholder: 'The feeling… what it protects…' },
          choices: [
            { label: 'Let the pool hold it', next: 'bridges', save: true },
            { label: 'Leave it unspoken', next: 'bridges' }
          ]
        },
        bridges: {
          text: 'From shadow to wholeness. Three bridges leave this place: the iron bridge to Courage for resilience, the living vines to Humanity for empathy, and the twilight archway to Temperance, where the tempering pool cools any fire. Ask how this fits your real circumstances, then choose your light.',
          choices: [
            { label: 'Cross the iron bridge to Courage', next: '@realm:courage' },
            { label: 'Follow the vines to Humanity', next: '@realm:humanity' },
            { label: 'Pass the twilight arch to Temperance', next: '@realm:temperance' },
            { label: 'Return to the Axial hub', next: '@hub' }
          ]
        }
      }
    }
  }
];

export const REALM_IDS = REALMS.map((r) => r.id);

/* -------------------------------------------------------------------------- */
/* Guardians + Guide portraits; realm painted backdrops                        */
/*                                                                            */
/* Guardian: assets/aretoria/guardians/<slug>.jpg via GP('<slug>').            */
/* Guide:    assets/aretoria/guardians/irishnu.jpg via IRISHNU_PORTRAIT.       */
/* Backdrop: assets/aretoria/realms/<realm id>.jpg via RP('<realm id>').       */
/* Axial hub: HUB.realmBackdrop = RP('axial'); entry cinematic keeps SHRINE_IMAGE. */
/* All are lazy-loaded (never precached); drawn SVG / CSS scenes are fallback. */
/* -------------------------------------------------------------------------- */

/* GUARDIAN_DIR / GP() / REALM_DIR / RP() are defined above REALMS. */
export const IRISHNU_PORTRAIT = GP('irishnu');
GUIDE.portrait = IRISHNU_PORTRAIT;
/** Axial hub painted floating-island backdrop (entry cinematic still uses SHRINE_IMAGE). */
HUB.realmBackdrop = RP('axial');

/* HUB_ART:BEGIN — generated by qa/aretoria-backdrops/build/apply_anchors.py; edit anchors.json, not this block */
/**
 * Axial hub art anchors, in backdrop-image pixels. Each realm point is where that gate's ARCH sits:
 * the end of its painted path. `rune` is the floor sigil the Creed orb sits on. Shadow's x is always
 * the viewport centre (cx); only its y comes from here. layoutHub() maps these through background
 * cover + position (posX/posY) + the .ar-layer scale(1.06), so gates stay on their paths at any size.
 */
export const HUB_ART = {
  desk: { w: 1280, h: 720, posX: 0.5, posY: 0.45, rune: [640, 366], gates: { courage: [320, 350], justice: [434, 281], humanity: [558, 258], temperance: [722, 258], wisdom: [846, 281], transcendence: [960, 350], shadow: [640, 500] } },
  mob: { w: 576, h: 1248, posX: 0.5, posY: 0.45, rune: [288, 665], layout: 'grid', band: [4, 514, 572, 788] }
};
/* HUB_ART:END */

/** "Guardian of Courage" … "Guardian of the Shadow Realm". */
export function guardianRole(r) {
  return r.id === 'shadow' ? 'Guardian of the Shadow Realm' : `Guardian of ${r.name}`;
}
/** Full name with epithet, e.g. "Valorix the Stormheart" / "Guardian of the Veil". */
export function guardianFullName(r) {
  const g = r.guardian;
  return g.source === 'notes' ? `${g.name} ${g.title}` : g.name;
}
/** One-line description, e.g. "Valorix the Stormheart, Guardian of Courage, a storm-forged champion". */
export function guardianLine(r) {
  const g = r.guardian;
  return r.id === 'shadow'
    ? `${g.name}, ${g.title} of the Shadow Realm`
    : `${guardianFullName(r)}, ${guardianRole(r)}, ${article(g.warrior)} ${g.warrior}`;
}
function article(w) { return /^[aeiou]/i.test(w || '') ? 'an' : 'a'; }
/** Portrait path for a realm's Guardian, or null to use the drawn figure. */
export function guardianPortraitPath(r) {
  return r && typeof r.guardianPortrait === 'string' && r.guardianPortrait ? r.guardianPortrait : null;
}
/** Irishnu the Guide portrait path, or null to use the drawn Guide figure. */
export function irishnuPortraitPath() {
  return GUIDE && typeof GUIDE.portrait === 'string' && GUIDE.portrait ? GUIDE.portrait : null;
}
/** Painted realm backdrop path, or null to keep the CSS/SVG-only scene. */
export function realmBackdropPath(r) {
  return r && typeof r.realmBackdrop === 'string' && r.realmBackdrop ? r.realmBackdrop : null;
}

/**
 * Map a desktop landscape art URL to its mobile portrait sibling.
 * Scheme: insert `/mobile/` before the filename.
 *   assets/aretoria/realms/courage.jpg     → assets/aretoria/realms/mobile/courage.jpg
 *   assets/aretoria/guardians/valorix.jpg  → assets/aretoria/guardians/mobile/valorix.jpg
 *   assets/aretoria/shrine.jpg             → assets/aretoria/mobile/shrine.jpg
 * Virtue advisor thumbs stay shared (no mobile/ siblings in this pass).
 */
export function mobileArtPath(desktopPath) {
  if (!desktopPath || typeof desktopPath !== 'string') return null;
  if (desktopPath === SHRINE_IMAGE) return SHRINE_IMAGE_MOBILE;
  const i = desktopPath.lastIndexOf('/');
  if (i < 0) return null;
  // already a mobile path
  if (desktopPath.slice(0, i).endsWith('/mobile')) return desktopPath;
  return `${desktopPath.slice(0, i + 1)}mobile/${desktopPath.slice(i + 1)}`;
}

/** Pick desktop or mobile art URL. `preferMobile` comes from matchMedia(ART_MOBILE_MQ). */
export function pickArtPath(desktopPath, preferMobile) {
  if (!desktopPath) return null;
  if (preferMobile) {
    const m = mobileArtPath(desktopPath);
    if (m) return m;
  }
  return desktopPath;
}

/* -------------------------------------------------------------------------- */
/* Integrity checks (used by mec.test.js and as a dev-time guard)              */
/* -------------------------------------------------------------------------- */

export const SPECIAL = ['@hub', '@close', '@hall', '@creed'];

/** Resolve a templated `next` (e.g. '@realm:{suggestId}') for validation. */
function resolveNext(next, ctx) {
  return String(next).replace(/\{(\w+)\}/g, (m, k) => (ctx && ctx[k] != null ? ctx[k] : m));
}

/** Returns a list of problems (empty array = OK) for one dialogue tree. */
export function validateTree(tree, realmIds = REALM_IDS, ctx = { suggestId: 'wisdom' }) {
  const errs = [];
  if (!tree || !tree.nodes) return ['missing tree'];
  const ids = Object.keys(tree.nodes);
  if (!tree.nodes[tree.start]) errs.push(`start node "${tree.start}" missing`);
  const seen = new Set([tree.start]);
  const queue = [tree.start];
  while (queue.length) {
    const id = queue.shift();
    const n = tree.nodes[id];
    if (!n) continue;
    if (!n.text || typeof n.text !== 'string') errs.push(`${id}: no text`);
    if (!Array.isArray(n.choices) || n.choices.length < 1 || n.choices.length > 4) errs.push(`${id}: needs 1-4 choices`);
    for (const c of n.choices || []) {
      if (!c.label) errs.push(`${id}: choice without label`);
      const nx = resolveNext(c.next, ctx);
      if (SPECIAL.includes(nx)) continue;
      if (nx.startsWith('@realm:')) {
        if (!realmIds.includes(nx.slice(7))) errs.push(`${id}: bad realm target ${nx}`);
        continue;
      }
      if (!tree.nodes[nx]) { errs.push(`${id}: choice points to missing node "${nx}"`); continue; }
      if (c.save && !n.input) errs.push(`${id}: save choice on node without input`);
      if (!seen.has(nx)) { seen.add(nx); queue.push(nx); }
    }
    if (n.input) {
      for (const c of n.choices || []) if (c.save && !c.next) errs.push(`${id}: save without next`);
    }
  }
  for (const id of ids) if (!seen.has(id)) errs.push(`${id}: unreachable`);
  return errs;
}

export function validateAll() {
  const errs = [];
  const gi = validateTree(GUIDE.dialogue);
  errs.push(...gi.map((e) => `irishnu/${e}`));
  for (const r of REALMS) {
    if (!r.guardian || !r.guardian.name) errs.push(`${r.id}: no guardian`);
    errs.push(...validateTree(r.dialogue).map((e) => `${r.id}/${e}`));
  }
  for (const v of VIRTUES) {
    if (!REALM_IDS.includes(v.realm)) errs.push(`virtue ${v.slug}: bad realm ${v.realm}`);
    errs.push(...validateTree(advisorDialogue(v)).map((e) => `virtue ${v.slug}/${e}`));
  }
  return errs;
}

/* -------------------------------------------------------------------------- */
/* Hall of Virtues: the single virtue list (Cassidy's note, Acceptance..Zest)  */
/*                                                                            */
/* To reveal a new advisor later: drop <slug>.jpg into                         */
/* assets/aretoria/portraits/ and add `portrait: P('<slug>')` to that entry   */
/* (P = tall portrait, like Cassidy's own; G = landscape/generated art).      */
/* All 81 virtues have art as of v24: 22 of Cassidy's own + 59 generated.      */
/* Optional `greet` / `teach` / `ask` / `bless` lines customise the dialogue;  */
/* without them a gentle default script is used.                              */
/*                                                                            */
/* realm: from the V1 realm mapping in Cassidy's Grok notes (fit: 'notes').    */
/* Six virtues are not mapped there and use a best fit (fit: 'best').          */
/* -------------------------------------------------------------------------- */

export const PORTRAIT_DIR = 'assets/aretoria/portraits/';
export const SHRINE_IMAGE = 'assets/aretoria/shrine.jpg';
/** Entry shrine mobile portrait (~576×1024), door-biased crop. */
export const SHRINE_IMAGE_MOBILE = 'assets/aretoria/mobile/shrine.jpg';
const P = (slug) => `${PORTRAIT_DIR}${slug}.jpg`;   // Cassidy's own portraits (tall, ~2:3)
/* Generated portraits (1024×576 landscape, figure centred). The `wide` flag lets the UI
   show them in a landscape frame when an advisor speaks; small frames crop to the centre. */
const G = (slug) => { WIDE.add(slug); return P(slug); };
const WIDE = new Set();
export const slugify = (name) => String(name).toLowerCase().replace(/[^a-z]/g, '');

function V(name, realm, essence, extra = {}) {
  const slug = slugify(name);
  return { slug, name, realm, fit: 'notes', essence, ...extra, ...(WIDE.has(slug) ? { wide: true } : {}) };
}

export const VIRTUES = [
  V('Acceptance', 'humanity', 'Embracing what is, so you can act from peace instead of resistance.', { portrait: P('acceptance'),
    greet: 'Come closer, Cassidy. I am woven of starlight and stillness. I do not ask the universe to be other than it is. I only ask it what comes next.',
    teach: 'Acceptance is not surrender. It is the ground you stand on before you move. Whatever you stop fighting, you can finally work with.',
    ask: 'What are you still arguing with that has already happened? What would change if you accepted it today?' }),
  V('Assertiveness', 'courage', 'Speaking your truth and holding your ground with respect.', { portrait: P('assertiveness'),
    greet: 'Stand up straight, Cassidy. I wear the red of a heart that refuses to stay silent. Say what you mean. Say it kindly. But say it.',
    teach: 'Assertiveness lives between silence and aggression. It is a boundary drawn clearly enough that no one has to guess where you stand.',
    ask: 'What needs to be said that you have been swallowing? To whom, and in what words?' }),
  V('Authenticity', 'justice', 'Living so that the outside matches the inside.', { fit: 'best', portrait: P('authenticity'),
    greet: 'I have worn many robes across many ages, Cassidy, and every color in them is my own. Be welcome. Here, no one needs a mask.',
    teach: 'Authenticity is integrity turned inward: your words, choices and face all telling the same story. It is the quiet justice you do to yourself.',
    ask: 'Where today did you act like someone you are not? What would the true version of you have done?' }),
  V('Beauty', 'transcendence', 'Seeing and creating splendor that lifts the spirit.', { portrait: P('beauty'),
    greet: 'Look into my mirror, Cassidy. It does not show a face. It shows what you are able to see. Today, let it show you something lovely.',
    teach: 'Beauty is not decoration. It is a doorway. Every time you notice it, you widen the world a little; every time you make it, you give that doorway to someone else.',
    ask: 'What was the most beautiful thing you noticed recently, and what could you make beautiful tomorrow?' }),
  V('Caring', 'humanity', 'Tending to others and yourself with attention and warmth.', { portrait: P('caring'),
    greet: 'Sit, sit. You have been carrying a great deal, haven’t you? I keep a small light in my palm for travelers. Warm your hands a while.',
    teach: 'Caring is attention made practical: noticing what someone needs and quietly providing it. Do not forget to tend your own garden as well.',
    ask: 'Who needs tending this week, including you, and what is one small act of care you can give?' }),
  V('Cleanliness', 'justice', 'Clearing clutter of space, body and mind so clarity can enter.', { portrait: P('cleanliness'),
    greet: 'Breathe, Cassidy. The air here has been washed by starlight. Clear water, clear space, clear mind. That is where good choices are born.',
    teach: 'Cleanliness is respect made visible: for your body, your home and the people who share them. A cleared surface invites a clear thought.',
    ask: 'What one space, habit or thought could you clear out this week to make room for clarity?' }),
  V('Commitment', 'temperance', 'Keeping faith with your promises over time.', { portrait: P('commitment'),
    greet: 'I hold a heart between two hands, Cassidy, bound by rings and an anchor. Every vow you keep makes it shine a little brighter.',
    teach: 'Commitment is temperance stretched across time: choosing the same good thing again on the days it is not exciting. Its strength is quiet and cumulative.',
    ask: 'Which promise, to yourself or someone else, most deserves your recommitment this week?' }),
  V('Compassion', 'humanity', 'Feeling with another’s suffering and moving to ease it.', { portrait: P('compassion'),
    greet: 'Your heart is welcome here, Cassidy, whole or bruised. See, I hold one too. It glows brighter when it is shared.',
    teach: 'Compassion is empathy that moves its feet. You feel the pain, and then you do something kind about it, for others and for yourself.',
    ask: 'Whose suffering touched you recently, and what is one kind thing you could do about it?' }),
  V('Confidence', 'courage', 'Trusting your worth and your ability to meet what comes.', { portrait: P('confidence'),
    greet: 'Raise your eyes, Cassidy. This crown is not for me alone. Every soul who knows its worth wears one, even if no one else can see it.',
    teach: 'Confidence is not certainty of success. It is certainty that you will meet the outcome with integrity. Build it from evidence: promises kept, fears faced.',
    ask: 'What evidence do you already have that you can handle what is in front of you?' }),
  V('Consideration', 'humanity', 'Thoughtful awareness: seeing all sides before acting.', { portrait: P('consideration'),
    greet: 'Pause with me, Cassidy. I hold a small scale of light, one pan for your needs and one for theirs. Let us see how it settles.',
    teach: 'Consideration is mindful deliberation, the gentle art of seeing all sides before acting. It turns reactions into choices.',
    ask: 'Whose perspective did you overlook recently? How might the situation look from where they stand?' }),
  V('Contentment', 'temperance', 'Profound inner peace and the gentle acceptance of what is.', { portrait: P('contentment'),
    greet: 'Rest a moment, Cassidy. My bowl is full of warm light, and it is enough. I think you may already have more than you notice.',
    teach: 'Contentment is quiet fulfillment: not wanting nothing, but knowing that what is here is sufficient for this moment. Enough is a feast.',
    ask: 'What in your life right now is already enough? Name three things.' }),
  V('Cooperation', 'justice', 'Unity, mutual support and the joyful power of working together.', { portrait: P('cooperation'),
    greet: 'Open your hands, Cassidy. Light grows strongest where many hands meet. Who are you building with?',
    teach: 'Cooperation is the joyful power of working toward a shared purpose. It asks you to bring your strength and leave room for everyone else’s.',
    ask: 'Where could you invite someone in instead of carrying it alone?' }),
  V('Courage', 'courage', 'Acting in the presence of fear when the action serves your principles.', { portrait: P('courage'),
    greet: 'Cassidy. I have walked through the abyss and come back. Stand at my shoulder a moment. What is the edge in front of you?',
    teach: 'Feel the fear. It is the edge of the known. Honor it as a signal, not a sentence. True bravery is not the absence of fear; it is choosing to act in its presence when the action serves your principles.',
    ask: 'Name the single, deliberate step you will take toward what frightens you.',
    bless: 'Say it with a breath or a fist to the chest: “I feel the edge. I choose the step. I am the force.” Then ask how it fits your real circumstances. I answer every time, Cassidy.' }),
  V('Creativity', 'wisdom', 'Making the new from the given; asking “what if?”', { portrait: P('creativity'),
    greet: 'Ah, Cassidy! Every color in my robe was once an idea nobody had tried. Shall we try another?',
    teach: 'Creativity twists the threads of the ordinary into the extraordinary. Let your mind wander like a river finding new paths, then build what you find.',
    ask: 'What is one thing you could create, build or reimagine this week, just because you can?' }),
  V('Detachment', 'humanity', 'Loving fully while holding outcomes lightly.', { portrait: P('detachment'),
    greet: 'Float with me, Cassidy. Up here, the things that clutch at you look smaller. Let us loosen their grip together.',
    teach: 'Detachment is not coldness. It is release: caring deeply while letting go of what you cannot control. Your heart stays open and your hands stay free.',
    ask: 'What outcome are you gripping too tightly? What would it feel like to hold it with open hands?' }),
  V('Determination', 'courage', 'Relentless resolve that carries a goal through difficulty.', { portrait: P('determination'),
    greet: 'You found me at the stone, Cassidy. I have been working it all night. Some things do not move until you decide they will.',
    teach: 'Determination is the decision made once and kept every morning. It does not need to be loud. It just needs to keep showing up.',
    ask: 'What goal deserves your stubbornness right now, and what will you do on it tomorrow morning?' }),
  V('Dignity', 'justice', 'Honoring the worth in yourself and in every person.', { portrait: P('dignity'),
    greet: 'Be welcome, Cassidy. You carry yourself like someone who knows his worth. Good. Now let us make sure everyone around you is treated as though they do too.',
    teach: 'Dignity is the respect owed to every person simply for being one, yourself included. It is a quiet standard you keep even when no one is watching.',
    ask: 'Where did you, or someone near you, lose a little dignity recently? How can it be restored?' }),
  V('Empathy', 'humanity', 'Feeling with another and seeing through their eyes.', { portrait: P('empathy'),
    greet: 'Step inside the star, Cassidy. Every point of it is someone else’s view of the world. From here, you can see through all of them.',
    teach: 'Empathy is the thread that binds souls. Step into the pool of another’s story and let your heart weave with theirs before you judge or advise.',
    ask: 'Whose world could you step into this week? What do you think they are feeling right now?' }),
  V('Encouragement', 'humanity', 'Lifting others’ spirits and belief in themselves.', { portrait: G('encouragement') }),
  V('Enthusiasm', 'courage', 'Wholehearted energy that sparks action and joy.', { portrait: G('enthusiasm') }),
  V('Equanimity', 'wisdom', 'Steadiness of mind in calm and in storm.', { portrait: G('equanimity') }),
  V('Ethicality', 'wisdom', 'Choosing the right action even when it costs.', { portrait: G('ethicality') }),
  V('Excellence', 'justice', 'Doing your best work as an offering, not for applause.', { portrait: G('excellence') }),
  V('Fairness', 'justice', 'Giving everyone an even scale.', { portrait: G('fairness') }),
  V('Faith', 'transcendence', 'Trusting what cannot yet be seen.', { portrait: G('faith') }),
  V('Flexibility', 'wisdom', 'Adapting gracefully when the path changes.', { portrait: G('flexibility') }),
  V('Forgiveness', 'temperance', 'Releasing grudges so the heart can move freely.', { portrait: P('forgiveness'),
    greet: 'Let the golden light fall on you, Cassidy. Nothing you carry is too heavy to set down here.',
    teach: 'Forgiveness is release, not approval. You let go of the debt so it stops collecting interest in your heart, and you keep the lesson.',
    ask: 'Who, perhaps yourself, are you ready to forgive, even a little? What would you let go of?' }),
  V('Friendliness', 'humanity', 'Warm openness that makes others feel welcome.', { portrait: G('friendliness') }),
  V('Generosity', 'humanity', 'Giving freely of time, attention and resources.', { portrait: G('generosity') }),
  V('Gentleness', 'humanity', 'Strength that chooses a soft touch.', { portrait: G('gentleness') }),
  V('Graciousness', 'humanity', 'Poise and warmth in giving and receiving.', { portrait: G('graciousness') }),
  V('Gratitude', 'transcendence', 'Noticing gifts and giving thanks.', { portrait: G('gratitude') }),
  V('Harmony', 'humanity', 'Bringing discordant notes into one song.', { portrait: G('harmony') }),
  V('Helpfulness', 'humanity', 'Lending strength where it is needed.', { portrait: G('helpfulness') }),
  V('Honesty', 'courage', 'Telling the truth, especially when it is hard.', { portrait: G('honesty') }),
  V('Honor', 'justice', 'Keeping your sacred vows and duties.', { portrait: G('honor') }),
  V('Hope', 'transcendence', 'A lantern for dark paths.', { portrait: G('hope') }),
  V('Humility', 'temperance', 'A grounded view of yourself, neither high nor low.', { portrait: G('humility') }),
  V('Idealism', 'wisdom', 'Shaping lofty ideals into goals.', { portrait: G('idealism') }),
  V('Integrity', 'justice', 'Standing firm and whole, word and deed as one.', { portrait: G('integrity') }),
  V('Imagination', 'wisdom', 'Seeing worlds that do not yet exist.', { portrait: G('imagination') }),
  V('Joyfulness', 'transcendence', 'Delight that spreads.', { portrait: G('joyfulness') }),
  V('Justice', 'justice', 'Upholding fairness for all.', { portrait: G('justice') }),
  V('Kindness', 'humanity', 'Goodwill offered freely.', { portrait: G('kindness') }),
  V('Love', 'humanity', 'The bond that holds every realm together.', { portrait: G('love') }),
  V('Loyalty', 'justice', 'Steadfast faithfulness to people and principles.', { portrait: G('loyalty') }),
  V('Moderation', 'temperance', 'Neither too much nor too little.', { portrait: G('moderation') }),
  V('Modesty', 'temperance', 'Letting your work speak without needing the spotlight.', { portrait: G('modesty') }),
  V('Optimism', 'courage', 'The dawn that follows every night.', { portrait: G('optimism') }),
  V('Orderliness', 'wisdom', 'Structuring chaos into clarity.', { portrait: G('orderliness') }),
  V('Passion', 'courage', 'The fire that fuels zeal.', { portrait: G('passion') }),
  V('Patience', 'humanity', 'Enduring with calm, trusting timing.', { portrait: G('patience') }),
  V('Peace', 'humanity', 'Stillness that calms storms.', { portrait: G('peace') }),
  V('Perseverance', 'courage', 'Enduring through every trial.', { portrait: G('perseverance') }),
  V('Preparedness', 'wisdom', 'Readying yourself for challenges ahead.', { portrait: G('preparedness') }),
  V('Purposefulness', 'wisdom', 'Aligning actions with what matters most.', { portrait: G('purposefulness') }),
  V('Quietudeness', 'temperance', 'A cultivated inner quiet.', { fit: 'best', portrait: P('quietudeness') }),
  V('Reliability', 'justice', 'Being someone others can count on.', { portrait: G('reliability') }),
  V('Resilience', 'courage', 'Rebounding from setbacks stronger than before.', { portrait: P('resilience'),
    greet: 'Pull up a stool by the forge, Cassidy. I have been hammered more times than I can count. Look at me. Still here, and stronger at the seams.',
    teach: 'Resilience is the art of weaving strength from fractures. Bend, but never break; each trial forges you anew, and the scars become veins of gold.',
    ask: 'What setback are you recovering from, and what has it taught you that makes you stronger?' }),
  V('Resolve', 'courage', 'A firm decision that does not waver under pressure.', { fit: 'best', portrait: P('resolve'),
    greet: 'You walked a long way through the forest to find me, Cassidy. That is resolve already. Lean on my staff a moment.',
    teach: 'Resolve is the decision behind the decision: settled so deeply that pressure cannot reopen it. Decide once, then let the decision carry you.',
    ask: 'What have you already decided in your heart but not yet committed to? Seal it here.' }),
  V('Respect', 'justice', 'Honoring the worth and boundaries of all.', { portrait: G('respect') }),
  V('Responsibility', 'justice', 'Owning your tasks and their consequences.', { portrait: G('responsibility') }),
  V('Reverence', 'transcendence', 'Honoring the sacred in all things.', { portrait: P('reverence'),
    greet: 'Hush, Cassidy. Listen to the stars. I am made of them, and so are you. Everything here is holy if you look long enough.',
    teach: 'Reverence is honoring the sacred, the vastness that holds you and the small things that carry it. It turns ordinary moments into temples.',
    ask: 'Where did you feel the sacred recently, in a person, place or moment?' }),
  V('Self-discipline', 'temperance', 'Mastery over impulse in service of what matters.', { portrait: G('selfdiscipline') }),
  V('Serenity', 'temperance', 'Calm clarity, untroubled at the center.', { fit: 'best', portrait: G('serenity') }),
  V('Service', 'transcendence', 'Aiding others as an offering.', { portrait: G('service') }),
  V('Sincerity', 'justice', 'Speaking plainly and meaning it.', { portrait: G('sincerity') }),
  V('Tact', 'temperance', 'Navigating tension with gentle words.', { portrait: G('tact') }),
  V('Temperance', 'temperance', 'Balance in all things.', { portrait: G('temperance') }),
  V('Tenacity', 'courage', 'Clinging fiercely to worthy goals.', { portrait: G('tenacity') }),
  V('Thankfulness', 'transcendence', 'A heart that keeps saying thank you.', { portrait: G('thankfulness') }),
  V('Tolerance', 'humanity', 'A bridge across differences.', { portrait: G('tolerance') }),
  V('Trust', 'justice', 'Safeguarding bonds and giving faith.', { portrait: G('trust') }),
  V('Truthfulness', 'justice', 'Faithfulness to what is real.', { portrait: G('truthfulness') }),
  V('Understanding', 'wisdom', 'Deep comprehension of people and things.', { portrait: G('understanding') }),
  V('Unity', 'humanity', 'Binding all together in one circle.', { portrait: G('unity') }),
  V('Vision', 'wisdom', 'Seeing the roads ahead.', { portrait: G('vision') }),
  V('Wisdom', 'wisdom', 'Balancing heart and mind toward the quiet truth.', { portrait: G('wisdom') }),
  V('Wonder', 'wisdom', 'Awe that keeps the world new.', { portrait: G('wonder') }),
  V('Xeniality', 'humanity', 'Hospitality and welcome to strangers.', { fit: 'best', portrait: G('xeniality') }),
  V('Zest', 'courage', 'Living with vigor and eagerness.', { fit: 'best', portrait: G('zest') })
];

export const virtueBySlug = (slug) => VIRTUES.find((v) => v.slug === slug) || null;
export const advisorsFor = (realmId) => VIRTUES.filter((v) => v.realm === realmId && v.portrait);
export const advisorTitle = (v) => `Advisor of ${v.name}`;
export const advisorKey = (iso, v) => `mec-realm:${iso}:${v.realm}:${v.slug}`;

/** Scripted dialogue for a virtue advisor (custom lines if present, gentle defaults otherwise). */
export function advisorDialogue(v) {
  const realm = REALMS.find((r) => r.id === v.realm);
  const lname = v.name.toLowerCase();
  return {
    start: 'greet',
    nodes: {
      greet: {
        text: v.greet || `Welcome, Cassidy. I am the Advisor of ${v.name}, from the ${realm.name} Realm. What I hold is this: ${v.essence.charAt(0).toLowerCase()}${v.essence.slice(1)}`,
        choices: [
          { label: 'What do you teach?', next: 'teach' },
          { label: 'Ask me your question.', next: 'reflect' },
          { label: 'I only came to see you.', next: 'bless' }
        ]
      },
      teach: {
        text: v.teach || `${v.name}: ${v.essence} It is one of the virtues you seek to compound within yourself, and ${realm.guardian.name}, ${guardianRole(realm)}, guards it in the ${realm.temple}.`,
        choices: [
          { label: 'Ask me your question.', next: 'reflect' },
          { label: 'Thank you.', next: 'bless' }
        ]
      },
      reflect: {
        text: v.ask || `Where could ${lname} show up in your day tomorrow?`,
        input: { placeholder: 'A sentence or two…' },
        choices: [
          { label: 'Keep my answer', next: 'bless', save: true },
          { label: 'Hold it in silence', next: 'bless' }
        ]
      },
      bless: {
        text: v.bless || `Go with ${lname}, Cassidy. Before you do, ask: how does this fit my real circumstances?`,
        choices: [
          { label: `Stay in the ${realm.name} Realm`, next: '@close' },
          { label: 'Return to the Axial hub', next: '@hub' }
        ]
      }
    }
  };
}
