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
 * (Authoring note, never shown to visitors: Irishnu is Cassidy himself, his old LARP name (he/him). He does
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
        text: 'Six realms of light, one for each great virtue: Wisdom, Courage, Humanity, Justice, Temperance and Transcendence. Call them six rooms in one house. Travelers like to call it a mansion; it still has only one front door, and you are standing in it. Eighty-one virtues live in those rooms, and the few that refuse to pick just one (Beauty, Graciousness, Integrity, Purposefulness, Wonder) stay here on the axis with me. Each realm has a temple and a Guardian, a warrior of its own kind. But the counsel comes from the virtues themselves: they are the advisors. The Guardians mostly keep the kettle warm and the doors honest.',
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
      "start": "greet",
      "nodes": {
        "greet": {
          "text": "Cassidy! Good. Boots on the anvil-ground. I am Valorix the Stormheart, Guardian of Courage. Courage is not the absence of fear, but the thunder that drowns it out. So. What battle brought you to the Forge of Valor?",
          "choices": [
            {
              "label": "Something I’ve been avoiding.",
              "next": "virtue"
            },
            {
              "label": "I’m angry and need somewhere to put it.",
              "next": "anger"
            },
            {
              "label": "Who are you, under the armor?",
              "next": "who"
            },
            {
              "label": "Tell me about your realm.",
              "next": "virtue"
            }
          ]
        },
        "who": {
          "text": "The first storm that made me broke my first armor. I walked out of it anyway. That is the whole story. Moder trained beside me here once, and still cools my steel at the tempering pool. Irishnu calls me “loud.” Irishnu is correct.",
          "choices": [
            {
              "label": "And the realm itself?",
              "next": "virtue"
            },
            {
              "label": "Then help me face something.",
              "next": "reflect"
            }
          ]
        },
        "virtue": {
          "text": "Listen to my advisors, not me. They are the virtues of this forge: Assertiveness, Determination, Resilience, Perseverance, Honesty. Resilience wears her scars as veins of gold. Optimism swears every night ends. Find their gates along the ridge.",
          "choices": [
            {
              "label": "Help me face it.",
              "next": "reflect"
            },
            {
              "label": "What about anger?",
              "next": "anger"
            }
          ]
        },
        "anger": {
          "text": "Then strike the anvil, not the person. Shaped anger holds a boundary and speaks plainly. Unshaped, it only burns, and that is my realm’s shadow: bravado, wrath, charging just to feel brave. Let us shape it.",
          "choices": [
            {
              "label": "Show me what to forge.",
              "next": "reflect"
            }
          ]
        },
        "reflect": {
          "text": "For your weekly scorecard. One fear. Not five. Name the one you will walk toward this week, and the first step you will take.",
          "input": {
            "placeholder": "The fear… my first step…"
          },
          "choices": [
            {
              "label": "Seal it in the forge",
              "next": "bless",
              "save": true
            },
            {
              "label": "I’ll carry it unwritten",
              "next": "bless"
            }
          ]
        },
        "bless": {
          "text": "Fist to chest: “I feel the edge. I choose the step. I am the force.” Again, louder. Good. The forge will be hot when you come back to tell me how it went.",
          "choices": [
            {
              "label": "Return to the Axial hub",
              "next": "@hub"
            },
            {
              "label": "Stay by the forge",
              "next": "@close"
            }
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
      "start": "greet",
      "nodes": {
        "greet": {
          "text": "Be welcome under the Scales of Equity, Cassidy. I am Justar the Balancer, Guardian of Justice. My blade stays sheathed; the scale does my fighting. Every oath on this beam began as a small choice. I do not condemn. I weigh. What would you place on the scales?",
          "choices": [
            {
              "label": "My week.",
              "next": "audit"
            },
            {
              "label": "What do the scales measure?",
              "next": "virtue"
            },
            {
              "label": "Have you ever weighed wrong?",
              "next": "who"
            }
          ]
        },
        "who": {
          "text": "Once. Early. I weighed a traveler and found only debt. Amara sat him at her hearth and found the reason. Since then the beam carries mercy as a counterweight. Irishnu calls that the one joke I have ever told.",
          "choices": [
            {
              "label": "What do the scales measure?",
              "next": "virtue"
            },
            {
              "label": "Then weigh my week.",
              "next": "audit"
            }
          ]
        },
        "virtue": {
          "text": "My advisors are the virtues engraved here: Integrity, Fairness, Honor, Trust, Truthfulness, Responsibility. Honor keeps your vows; Trust guards what others gave you. Hear them before you hear me. Justice begins with what was yours to carry.",
          "choices": [
            {
              "label": "Weigh my week with me.",
              "next": "audit"
            }
          ]
        },
        "audit": {
          "text": "Weigh as your Sunday self-audit does. Separate what you could control from what you could not. Hold yourself to the first. Release the second without shame. A scale that only punishes is broken; that is this realm’s shadow.",
          "choices": [
            {
              "label": "I’m ready to weigh it.",
              "next": "reflect"
            },
            {
              "label": "Remind me of the virtues first.",
              "next": "virtue"
            }
          ]
        },
        "reflect": {
          "text": "Then the plain question: what promise do you owe, and to whom? Yourself counts. Name it, and the day you will keep it.",
          "input": {
            "placeholder": "The promise, to whom, and when…"
          },
          "choices": [
            {
              "label": "Engrave it on the beam",
              "next": "bless",
              "save": true
            },
            {
              "label": "Weigh it in silence",
              "next": "bless"
            }
          ]
        },
        "bless": {
          "text": "The beam steadies. Balance is not perfection, Cassidy; it is honest correction, made again and again. I will keep this page open until the promise is paid.",
          "choices": [
            {
              "label": "Return to the Axial hub",
              "next": "@hub"
            },
            {
              "label": "Remain in the marble halls",
              "next": "@close"
            }
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
      "start": "greet",
      "nodes": {
        "greet": {
          "text": "Come in from the cold, dear one. I am Amara the Heartbloom, Guardian of Humanity. These hands bind wounds, and when a heart must be defended, they hold the shield. The fountain of empathy has been flowing all day for you. How is your heart, Cassidy?",
          "choices": [
            {
              "label": "Full. I want to share it.",
              "next": "virtue"
            },
            {
              "label": "Heavy. Someone is on my mind.",
              "next": "heavy"
            },
            {
              "label": "How did your garden begin?",
              "next": "who"
            }
          ]
        },
        "who": {
          "text": "With a wound I refused to let scar shut. Things grew in it. Justar learned mercy at this fire, and I learned from Justar that love without truth is only comfort. Eirena’s thread runs warmest here. I like to think that is my doing.",
          "choices": [
            {
              "label": "Tell me about the Hearth.",
              "next": "virtue"
            },
            {
              "label": "Someone is on my mind.",
              "next": "heavy"
            }
          ]
        },
        "virtue": {
          "text": "The virtues are your counsel here, not me: Empathy, Compassion, Kindness, Patience, Unity. Empathy will sit inside your view; Compassion will get up and do something about it. I just keep the fire going while they talk.",
          "choices": [
            {
              "label": "Help me reflect on my people.",
              "next": "reflect"
            },
            {
              "label": "Someone is weighing on me.",
              "next": "heavy"
            }
          ]
        },
        "heavy": {
          "text": "Then we won’t hurry. Patience lives here too, and Peace can calm almost any storm. One warning, gently: this realm’s shadow is giving until you vanish. Your heart is one of the people at this hearth.",
          "choices": [
            {
              "label": "I’m ready to reflect.",
              "next": "reflect"
            }
          ]
        },
        "reflect": {
          "text": "This is your relationship reflection, first and third Saturdays. Who should feel your love this week, and how will they know it?",
          "input": {
            "placeholder": "Who, and how they’ll know…"
          },
          "choices": [
            {
              "label": "Let the fountain keep it",
              "next": "bless",
              "save": true
            },
            {
              "label": "Hold it in my heart",
              "next": "bless"
            }
          ]
        },
        "bless": {
          "text": "Oh, that’s lovely. May your kindness be a spark in Aretoria’s dawn. Go and love someone in a way they can feel, and come back and tell me their face.",
          "choices": [
            {
              "label": "Return to the Axial hub",
              "next": "@hub"
            },
            {
              "label": "Stay by the hearth",
              "next": "@close"
            }
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
      "start": "greet",
      "nodes": {
        "greet": {
          "text": "Breathe with the tide, Cassidy. In… and out. I am Moder the Equilibrator, Guardian of Temperance. I trained a lifetime to strike once… and to know when not to strike at all. The Veil of Balance moves so it never breaks. What feels out of balance?",
          "choices": [
            {
              "label": "I’ve been running hot.",
              "next": "pool"
            },
            {
              "label": "Teach me balance.",
              "next": "virtue"
            },
            {
              "label": "Where did you learn stillness?",
              "next": "who"
            }
          ]
        },
        "who": {
          "text": "At Valorix’s forge. I was the hottest student there. Burned every blade. So I walked here… and sat… for a long time. He still visits. I still cool his steel. Irishnu says we are one guardian with two moods.",
          "choices": [
            {
              "label": "Teach me balance.",
              "next": "virtue"
            },
            {
              "label": "I’ve been running hot.",
              "next": "pool"
            }
          ]
        },
        "virtue": {
          "text": "Your advisors here are quiet ones. Moderation. Self-discipline. Forgiveness. Contentment. Humility. Listen to them one at a time. Restraint and release… two hands on the same thread. Too much restraint, and you go numb. That is my realm’s shadow.",
          "choices": [
            {
              "label": "Let me reflect.",
              "next": "reflect"
            },
            {
              "label": "Where do I cool down?",
              "next": "pool"
            }
          ]
        },
        "pool": {
          "text": "The tempering pool. The archway from the Shadow Realm opens here. Fire cools… into measured passion. Put your hands in. Ask the water how to keep the flame without the burn.",
          "choices": [
            {
              "label": "I’m ready to reflect.",
              "next": "reflect"
            }
          ]
        },
        "reflect": {
          "text": "Let your monthly review begin in the stillness. One thing. What will you set down: a habit, a grudge, a weight that was never yours?",
          "input": {
            "placeholder": "I will set down…"
          },
          "choices": [
            {
              "label": "Let the veil hold it",
              "next": "bless",
              "save": true
            },
            {
              "label": "Release it to the tide",
              "next": "bless"
            }
          ]
        },
        "bless": {
          "text": "Enough is a feast, Cassidy. Take one breath slower than you want to. There. Balance travels with you.",
          "choices": [
            {
              "label": "Return to the Axial hub",
              "next": "@hub"
            },
            {
              "label": "Linger by the calm sea",
              "next": "@close"
            }
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
      "start": "greet",
      "nodes": {
        "greet": {
          "text": "Welcome, Cassidy. I am Sophia the Eternal Oracle, Guardian of Wisdom, a battle-sage who wins most battles before they begin. The Prism has been turning your light into colors all day. I have no quick answers, only the quiet truth that lasts. What are you seeking?",
          "choices": [
            {
              "label": "Clarity on a decision.",
              "next": "virtue"
            },
            {
              "label": "To understand my day.",
              "next": "reflect"
            },
            {
              "label": "Tell me of your realm.",
              "next": "lore"
            },
            {
              "label": "Do you ever doubt?",
              "next": "who"
            }
          ]
        },
        "who": {
          "text": "Doubt is how I keep my robes woven. Irishnu and I have argued since before the axis had a name; I ask why, Irishnu asks why not. Eirena’s thread passes through this Prism and comes out as seven colors. Which one is the true thread? Yes.",
          "choices": [
            {
              "label": "Tell me of your realm.",
              "next": "lore"
            },
            {
              "label": "Help me reflect.",
              "next": "reflect"
            }
          ]
        },
        "lore": {
          "text": "Floating libraries drift over lakes that reflect every possibility. My advisors are the virtues who shelve them: Vision looks down the roads ahead, Imagination asks “what if?”, Equanimity keeps the water still enough to read.",
          "choices": [
            {
              "label": "And what of a decision?",
              "next": "virtue"
            },
            {
              "label": "Let me reflect.",
              "next": "reflect"
            }
          ]
        },
        "virtue": {
          "text": "Wisdom balances heart and mind. Vision shows the road; Understanding shows the people on it. But beware this realm’s shadow: the library can become a hiding place. Thinking forever is just a slower way of not choosing.",
          "choices": [
            {
              "label": "Help me reflect.",
              "next": "reflect"
            }
          ]
        },
        "reflect": {
          "text": "For your daily reflection, look into the lake: what are you seeing more clearly today than you did yesterday?",
          "input": {
            "placeholder": "Today I see more clearly…"
          },
          "choices": [
            {
              "label": "Write it in the floating library",
              "next": "bless",
              "save": true
            },
            {
              "label": "Keep it in silence",
              "next": "bless"
            }
          ]
        },
        "bless": {
          "text": "Light passes through you and becomes many colors; that is not confusion, it is richness. One last thing: which belief of yours deserves a second look? Carry that question, not an answer. Go gently, Cassidy.",
          "choices": [
            {
              "label": "Return to the Axial hub",
              "next": "@hub"
            },
            {
              "label": "Stay beneath the Prism",
              "next": "@close"
            }
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
      "start": "greet",
      "nodes": {
        "greet": {
          "text": "Oh, Cassidy, look up! I am Auria the Awestruck, Guardian of Transcendence. My wings are for lifting others, my lance for keeping wonder safe. The Nebula grew a little when you arrived; it grows with every act of appreciation. What have you come to celebrate?",
          "choices": [
            {
              "label": "Something good happened.",
              "next": "virtue"
            },
            {
              "label": "I need hope.",
              "next": "hope"
            },
            {
              "label": "Why are you always so amazed?",
              "next": "who"
            }
          ]
        },
        "who": {
          "text": "Because I almost stopped being! Long ago I flew so high I forgot the ground, and the stars went dull. Amara sent me down to sit with people again. Now I come back to the axis just to watch Eirena weave. It never gets old. Nothing does, if you look.",
          "choices": [
            {
              "label": "Show me your realm.",
              "next": "virtue"
            },
            {
              "label": "I need hope.",
              "next": "hope"
            }
          ]
        },
        "virtue": {
          "text": "Meet my advisors, the brightest virtues in the sky: Gratitude, Joyfulness, Beauty, Reverence, Service. Gratitude sings over every gift; Joyfulness can’t sit still. Festivals are sacred work here. Joy shared is joy made real!",
          "choices": [
            {
              "label": "Let me give thanks.",
              "next": "reflect"
            },
            {
              "label": "And hope?",
              "next": "hope"
            }
          ]
        },
        "hope": {
          "text": "Hope carries a lantern for dark paths. It isn’t pretending the night isn’t there; it’s knowing the stars are still in it. And careful: wonder can turn into floating away from what hurts. That’s my realm’s shadow. Bring your feet with you.",
          "choices": [
            {
              "label": "Let me reflect.",
              "next": "reflect"
            }
          ]
        },
        "reflect": {
          "text": "Name it so the Nebula can grow: what filled you with awe, hope or gratitude recently?",
          "input": {
            "placeholder": "I’m grateful for…"
          },
          "choices": [
            {
              "label": "Add it to the stars",
              "next": "bless",
              "save": true
            },
            {
              "label": "Keep it as a private star",
              "next": "bless"
            }
          ]
        },
        "bless": {
          "text": "There! Did you see it brighten? Now: what small wonder will you stop for this week, on purpose, even if it makes you late? Your next festival is closer than you think.",
          "choices": [
            {
              "label": "Return to the Axial hub",
              "next": "@hub"
            },
            {
              "label": "Float among the stars",
              "next": "@close"
            }
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
      "start": "greet",
      "nodes": {
        "greet": {
          "text": "You came through the veil, Cassidy. That took honesty. I am the Guardian of the Veil. I keep watch where the light grows thin. Nothing here is judged. The mirror pool only shows what is bent, so it can be made straight. What calls you here?",
          "choices": [
            {
              "label": "Something dark is pulling at me.",
              "next": "aspects"
            },
            {
              "label": "What is this place?",
              "next": "veil"
            },
            {
              "label": "Why have you no name?",
              "next": "who"
            },
            {
              "label": "Show me the way out.",
              "next": "bridges"
            }
          ]
        },
        "who": {
          "text": "A name is something to hide behind. Here, nothing hides. The other guardians cross my bridges when their own shadows grow. Irishnu does not joke here. Even Eirena’s golden thread passes through, dimmed, but never cut.",
          "choices": [
            {
              "label": "What is this place?",
              "next": "veil"
            },
            {
              "label": "Something is pulling at me.",
              "next": "aspects"
            }
          ]
        },
        "veil": {
          "text": "The Veil of Shadows. Around us lie the aspect temples: Vexara’s smoldering fortress of revenge, Invidia’s tower of cracked emeralds, Slytheron’s halls of masks, Ravena’s volcanic pit, Aurum’s vault of crumbling gold. None is evil to deny; each is a distortion asking to be made whole.",
          "choices": [
            {
              "label": "I recognize one of them.",
              "next": "aspects"
            },
            {
              "label": "Where do the bridges lead?",
              "next": "bridges"
            }
          ]
        },
        "aspects": {
          "text": "Then name it, and the dim flame grows. Every shadow protects something. Revenge guards a wound. Envy hides a longing. Deceit shields a fear. Look into the pool.",
          "choices": [
            {
              "label": "I’ll look.",
              "next": "reflect"
            }
          ]
        },
        "reflect": {
          "text": "What feeling are you resisting? And what is it trying to protect?",
          "input": {
            "placeholder": "The feeling… what it protects…"
          },
          "choices": [
            {
              "label": "Let the pool hold it",
              "next": "bridges",
              "save": true
            },
            {
              "label": "Leave it unspoken",
              "next": "bridges"
            }
          ]
        },
        "bridges": {
          "text": "From shadow to wholeness. The iron bridge to Courage, for resilience. The living vines to Humanity, for empathy. The twilight arch to Temperance, where fire cools. Which will you cross? And what will you carry back into the light?",
          "choices": [
            {
              "label": "Cross the iron bridge to Courage",
              "next": "@realm:courage"
            },
            {
              "label": "Follow the vines to Humanity",
              "next": "@realm:humanity"
            },
            {
              "label": "Pass the twilight arch to Temperance",
              "next": "@realm:temperance"
            },
            {
              "label": "Return to the Axial hub",
              "next": "@hub"
            }
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
/** Irishnu is Cassidy's own LARP persona (he/him). Face crop for the round dialogue avatar. */
export const IRISHNU_AVATAR = GP('irishnu-face');
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
    ask: 'What was the most beautiful thing you noticed recently, and what will you make a little more beautiful before the week is out?' }),
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
    bless: 'Say it with a breath or a fist to the chest: “I feel the edge. I choose the step. I am the force.” I answer every time, Cassidy.' }),
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
    ask: 'What goal deserves your stubbornness right now, and what is the first move you will make on it?' }),
  V('Dignity', 'justice', 'Honoring the worth in yourself and in every person.', { portrait: P('dignity'),
    greet: 'Be welcome, Cassidy. You carry yourself like someone who knows his worth. Good. Now let us make sure everyone around you is treated as though they do too.',
    teach: 'Dignity is the respect owed to every person simply for being one, yourself included. It is a quiet standard you keep even when no one is watching.',
    ask: 'Where did you, or someone near you, lose a little dignity recently? How can it be restored?' }),
  V('Empathy', 'humanity', 'Feeling with another and seeing through their eyes.', { portrait: P('empathy'),
    greet: 'Step inside the star, Cassidy. Every point of it is someone else’s view of the world. From here, you can see through all of them.',
    teach: 'Empathy is the thread that binds souls. Step into the pool of another’s story and let your heart weave with theirs before you judge or advise.',
    ask: 'Whose world could you step into this week? What do you think they are feeling right now?' }),
  V('Encouragement', 'humanity', 'Lifting others’ spirits and belief in themselves.', { portrait: G('encouragement'), ask: "Who near you is about to quit on something good? What will you say to them?" }),
  V('Enthusiasm', 'courage', 'Wholehearted energy that sparks action and joy.', { portrait: G('enthusiasm'), ask: "What still makes you lean forward in your chair? When will you give it an hour?" }),
  V('Equanimity', 'wisdom', 'Steadiness of mind in calm and in storm.', { portrait: G('equanimity'), ask: "What rattled you lately that will not matter in a year? How would steady-you answer it?" }),
  V('Ethicality', 'wisdom', 'Choosing the right action even when it costs.', { portrait: G('ethicality'), ask: "Where is the right thing costing you something right now? Are you willing to pay it?" }),
  V('Excellence', 'justice', 'Doing your best work as an offering, not for applause.', { portrait: G('excellence'), ask: "What piece of work deserves your best this week, even if no one will notice?" }),
  V('Fairness', 'justice', 'Giving everyone an even scale.', { portrait: G('fairness'), ask: "Who might be getting less than an even scale from you? What would fair look like?" }),
  V('Faith', 'transcendence', 'Trusting what cannot yet be seen.', { portrait: G('faith'), ask: "What are you trusting that you cannot yet see? What small act would honor that trust?" }),
  V('Flexibility', 'wisdom', 'Adapting gracefully when the path changes.', { portrait: G('flexibility'), ask: "Which plan are you holding so rigidly it has started to crack? What could bend?" }),
  V('Forgiveness', 'temperance', 'Releasing grudges so the heart can move freely.', { portrait: P('forgiveness'),
    greet: 'Let the golden light fall on you, Cassidy. Nothing you carry is too heavy to set down here.',
    teach: 'Forgiveness is release, not approval. You let go of the debt so it stops collecting interest in your heart, and you keep the lesson.',
    ask: 'Who, perhaps yourself, are you ready to forgive, even a little? What would you let go of?' }),
  V('Friendliness', 'humanity', 'Warm openness that makes others feel welcome.', { portrait: G('friendliness'), ask: "Who could you greet first, warmly, this week, before they greet you?" }),
  V('Generosity', 'humanity', 'Giving freely of time, attention and resources.', { portrait: G('generosity'), ask: "What could you give away (time, attention, a thing) without expecting it back?" }),
  V('Gentleness', 'humanity', 'Strength that chooses a soft touch.', { portrait: G('gentleness'), ask: "Where are you pressing harder than the moment needs? What would a softer touch be?" }),
  V('Graciousness', 'humanity', 'Poise and warmth in giving and receiving.', { portrait: G('graciousness'), ask: "What gift or compliment did you brush aside? How could you receive it fully?" }),
  V('Gratitude', 'transcendence', 'Noticing gifts and giving thanks.', { portrait: G('gratitude'), ask: "Name three gifts from this week that you have not yet said thank you for." }),
  V('Harmony', 'humanity', 'Bringing discordant notes into one song.', { portrait: G('harmony'), ask: "Which two parts of your life are out of tune? What one note could bring them together?" }),
  V('Helpfulness', 'humanity', 'Lending strength where it is needed.', { portrait: G('helpfulness'), ask: "Whose load could you lighten with an hour of your strength?" }),
  V('Honesty', 'courage', 'Telling the truth, especially when it is hard.', { portrait: G('honesty'), ask: "What truth have you been softening until it is no longer true? Say it plainly here." }),
  V('Honor', 'justice', 'Keeping your sacred vows and duties.', { portrait: G('honor'), ask: "Which vow, spoken or silent, has gone quiet? How will you keep it again?" }),
  V('Hope', 'transcendence', 'A lantern for dark paths.', { portrait: G('hope'), ask: "What are you hoping for that you have stopped saying out loud? Say it here." }),
  V('Humility', 'temperance', 'A grounded view of yourself, neither high nor low.', { portrait: G('humility'), ask: "Where were you sure you were right, and were not? What did it teach you?" }),
  V('Idealism', 'wisdom', 'Shaping lofty ideals into goals.', { portrait: G('idealism'), ask: "Which lofty ideal of yours needs one concrete goal attached to it?" }),
  V('Integrity', 'justice', 'Standing firm and whole, word and deed as one.', { portrait: G('integrity'), ask: "Where do your words and your deeds disagree right now? Which one will move?" }),
  V('Imagination', 'wisdom', 'Seeing worlds that do not yet exist.', { portrait: G('imagination'), ask: "If nothing could fail, what world would you sketch first?" }),
  V('Joyfulness', 'transcendence', 'Delight that spreads.', { portrait: G('joyfulness'), ask: "What delighted you lately, and who can you share it with?" }),
  V('Justice', 'justice', 'Upholding fairness for all.', { portrait: G('justice'), ask: "Who is waiting on someone to stand up for what is fair? Could it be you?" }),
  V('Kindness', 'humanity', 'Goodwill offered freely.', { portrait: G('kindness'), ask: "What small kindness could you offer a stranger before the day ends?" }),
  V('Love', 'humanity', 'The bond that holds every realm together.', { portrait: G('love'), ask: "Who holds part of your world together? How will they feel your love this week?" }),
  V('Loyalty', 'justice', 'Steadfast faithfulness to people and principles.', { portrait: G('loyalty'), ask: "Who has stood by you quietly? How will you stand by them?" }),
  V('Moderation', 'temperance', 'Neither too much nor too little.', { portrait: G('moderation'), ask: "What do you have too much of right now, and what too little?" }),
  V('Modesty', 'temperance', 'Letting your work speak without needing the spotlight.', { portrait: G('modesty'), ask: "What good work of yours could you let speak for itself this week?" }),
  V('Optimism', 'courage', 'The dawn that follows every night.', { portrait: G('optimism'), ask: "What night are you in, and what is the first sign of its dawn?" }),
  V('Orderliness', 'wisdom', 'Structuring chaos into clarity.', { portrait: G('orderliness'), ask: "Which corner of chaos, in your space or schedule, will you bring into order?" }),
  V('Passion', 'courage', 'The fire that fuels zeal.', { portrait: G('passion'), ask: "What fire in you has been banked too long? How will you feed it?" }),
  V('Patience', 'humanity', 'Enduring with calm, trusting timing.', { portrait: G('patience'), ask: "What are you rushing that needs more time to ripen?" }),
  V('Peace', 'humanity', 'Stillness that calms storms.', { portrait: G('peace'), ask: "Where can you make one quiet minute of peace today, and for whom?" }),
  V('Perseverance', 'courage', 'Enduring through every trial.', { portrait: G('perseverance'), ask: "What hard thing are you close to finishing? What is the next mile?" }),
  V('Preparedness', 'wisdom', 'Readying yourself for challenges ahead.', { portrait: G('preparedness'), ask: "What challenge is coming that you can ready yourself for now?" }),
  V('Purposefulness', 'wisdom', 'Aligning actions with what matters most.', { portrait: G('purposefulness'), ask: "Of everything on your list, which one task actually serves what matters most?" }),
  V('Quietudeness', 'temperance', 'A cultivated inner quiet.', { fit: 'best', portrait: P('quietudeness'), ask: "Where is the noise loudest in you? What would ten minutes of quiet reveal?" }),
  V('Reliability', 'justice', 'Being someone others can count on.', { portrait: G('reliability'), ask: "Who is counting on you right now? What will you deliver, and by when?" }),
  V('Resilience', 'courage', 'Rebounding from setbacks stronger than before.', { portrait: P('resilience'),
    greet: 'Pull up a stool by the forge, Cassidy. I have been hammered more times than I can count. Look at me. Still here, and stronger at the seams.',
    teach: 'Resilience is the art of weaving strength from fractures. Bend, but never break; each trial forges you anew, and the scars become veins of gold.',
    ask: 'What setback are you recovering from, and what has it taught you that makes you stronger?' }),
  V('Resolve', 'courage', 'A firm decision that does not waver under pressure.', { fit: 'best', portrait: P('resolve'),
    greet: 'You walked a long way through the forest to find me, Cassidy. That is resolve already. Lean on my staff a moment.',
    teach: 'Resolve is the decision behind the decision: settled so deeply that pressure cannot reopen it. Decide once, then let the decision carry you.',
    ask: 'What have you already decided in your heart but not yet committed to? Seal it here.' }),
  V('Respect', 'justice', 'Honoring the worth and boundaries of all.', { portrait: G('respect'), ask: "Whose boundary or worth did you step past? How can you honor it next time?" }),
  V('Responsibility', 'justice', 'Owning your tasks and their consequences.', { portrait: G('responsibility'), ask: "What consequence of yours are you still leaving for someone else to carry?" }),
  V('Reverence', 'transcendence', 'Honoring the sacred in all things.', { portrait: P('reverence'),
    greet: 'Hush, Cassidy. Listen to the stars. I am made of them, and so are you. Everything here is holy if you look long enough.',
    teach: 'Reverence is honoring the sacred, the vastness that holds you and the small things that carry it. It turns ordinary moments into temples.',
    ask: 'Where did you feel the sacred recently, in a person, place or moment?' }),
  V('Self-discipline', 'temperance', 'Mastery over impulse in service of what matters.', { portrait: G('selfdiscipline'), ask: "Which impulse keeps winning? What will you do the next time it calls?" }),
  V('Serenity', 'temperance', 'Calm clarity, untroubled at the center.', { fit: 'best', portrait: G('serenity'), ask: "What would you stop fighting if you trusted the center to hold?" }),
  V('Service', 'transcendence', 'Aiding others as an offering.', { portrait: G('service'), ask: "What could you offer someone this week as a gift, not a trade?" }),
  V('Sincerity', 'justice', 'Speaking plainly and meaning it.', { portrait: G('sincerity'), ask: "Where did you say what was expected instead of what you meant?" }),
  V('Tact', 'temperance', 'Navigating tension with gentle words.', { portrait: G('tact'), ask: "Which hard conversation needs gentler words, not softer truth?" }),
  V('Temperance', 'temperance', 'Balance in all things.', { portrait: G('temperance'), ask: "Where in your life is “enough” already here, if you would let it be?" }),
  V('Tenacity', 'courage', 'Clinging fiercely to worthy goals.', { portrait: G('tenacity'), ask: "Which worthy goal have you loosened your grip on? Grip it again: how?" }),
  V('Thankfulness', 'transcendence', 'A heart that keeps saying thank you.', { portrait: G('thankfulness'), ask: "Who shaped you and has never heard you say thank you?" }),
  V('Tolerance', 'humanity', 'A bridge across differences.', { portrait: P('tolerance'), ask: "Whose difference bothers you most? What bridge could you build toward them?" }),
  V('Trust', 'justice', 'Safeguarding bonds and giving faith.', { portrait: G('trust'), ask: "Who has trusted you with something fragile? How are you keeping it safe?" }),
  V('Truthfulness', 'justice', 'Faithfulness to what is real.', { portrait: G('truthfulness'), ask: "What have you told yourself lately that is not quite real?" }),
  V('Understanding', 'wisdom', 'Deep comprehension of people and things.', { portrait: G('understanding'), ask: "Who do you not yet understand? What question could you ask them?" }),
  V('Unity', 'humanity', 'Binding all together in one circle.', { portrait: G('unity'), ask: "Who has drifted out of your circle that belongs in it?" }),
  V('Vision', 'wisdom', 'Seeing the roads ahead.', { portrait: G('vision'), ask: "Picture yourself a year from now. What is the first road toward that view?" }),
  V('Wisdom', 'wisdom', 'Balancing heart and mind toward the quiet truth.', { portrait: G('wisdom'), ask: "Where are your heart and your mind disagreeing? What does each one know?" }),
  V('Wonder', 'wisdom', 'Awe that keeps the world new.', { portrait: G('wonder'), ask: "What ordinary thing could you look at today as if seeing it for the first time?" }),
  V('Xeniality', 'humanity', 'Hospitality and welcome to strangers.', { fit: 'best', portrait: G('xeniality'), ask: "Who is new to your world and could use a real welcome?" }),
  V('Zest', 'courage', 'Living with vigor and eagerness.', { fit: 'best', portrait: G('zest'), ask: "What would you do today with twice the vigor and half the hesitation?" })
];

export const virtueBySlug = (slug) => VIRTUES.find((v) => v.slug === slug) || null;
export const advisorsFor = (realmId) => VIRTUES.filter((v) => v.realm === realmId && v.portrait);
export const advisorTitle = (v) => `Advisor of ${v.name}`;
export const advisorKey = (iso, v) => `mec-realm:${iso}:${v.realm}:${v.slug}`;

/** Rotating farewells for advisors without a custom `bless` (no shared closing formula). */
const BLESS = [
  (n) => `Go with ${n}, Cassidy. I will be here when you want counsel again.`,
  (n) => `Carry ${n} lightly. It grows heavier with use, in the good way.`,
  (n) => `That answer is a seed. Let ${n} water it.`,
  (n) => `Thank you for listening, Cassidy. ${n.charAt(0).toUpperCase() + n.slice(1)} rarely gets such a good audience.`,
  (n) => `Walk on. If you forget me, ${n} will find a way to remind you.`,
  (n) => `Well spoken. Come back and tell me what ${n} changed.`,
  (n) => `Keep that close, Cassidy. ${n.charAt(0).toUpperCase() + n.slice(1)} is patient, but it likes to be practiced.`
];

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
        text: v.teach || `${v.name}: ${v.essence} I am one of the ${realm.name} Realm’s advisors. ${realm.guardian.name} keeps the ${realm.temple}; the counsel is mine to give.`,
        choices: [
          { label: 'Ask me your question.', next: 'reflect' },
          { label: 'Thank you.', next: 'bless' }
        ]
      },
      reflect: {
        text: v.ask || `Where is ${lname} missing from your days right now?`,
        input: { placeholder: 'A sentence or two…' },
        choices: [
          { label: 'Keep my answer', next: 'bless', save: true },
          { label: 'Hold it in silence', next: 'bless' }
        ]
      },
      bless: {
        text: v.bless || BLESS[VIRTUES.indexOf(v) % BLESS.length](lname),
        choices: [
          { label: `Stay in the ${realm.name} Realm`, next: '@close' },
          { label: 'Return to the Axial hub', next: '@hub' }
        ]
      }
    }
  };
}
