import type { DrillItem } from '../../src/content-types';

/** Hand-written Spot-It items for Module 1. Built problems add their own "interview" items. */
export const foundationsDrills: DrillItem[] = [
  {
    id: 'username-taken',
    kind: 'reallife',
    moduleId: 'foundations',
    prompt: '<p>A sign-up form must reject a username that is already taken. The site has 2 million users. The check must feel instant.</p>',
    acceptedPatternIds: ['hashing'],
    clueExplanation: 'Words: "already taken" means "have I seen this before?". Size: 2 million names are too many to scan on every sign-up. A HashSet of names answers in about one step on average.',
  },
  {
    id: 'ticket-scanned-twice',
    kind: 'reallife',
    moduleId: 'foundations',
    prompt: '<p>A train gate scans tickets all day. It must beep when the same ticket is scanned a second time.</p>',
    acceptedPatternIds: ['hashing'],
    clueExplanation: 'Words: "a second time" is a repeat check. Bottleneck: searching every earlier scan again is the repeated work. Keep the scanned ticket numbers in a HashSet.',
  },
  {
    id: 'guests-both-days',
    kind: 'reallife',
    moduleId: 'foundations',
    prompt: '<p>You have the guest list from Saturday and the guest list from Sunday. Each list has 50,000 names. Find the guests who came on both days.</p>',
    acceptedPatternIds: ['hashing'],
    clueExplanation: 'Size: 50,000 × 50,000 pair checks is 2.5 billion, which is too slow. Bottleneck: for each Sunday guest you search Saturday again. Put the Saturday names in a HashSet, then check each Sunday name.',
  },
  {
    id: 'repeat-or-most',
    kind: 'lookalike',
    moduleId: 'foundations',
    prompt: '<p><b>Task A:</b> Does any number in the list appear twice?</p><p><b>Task B:</b> Which number appears the most times?</p><p>Which idea fits <b>Task B</b>?</p>',
    acceptedPatternIds: ['counting'],
    clueExplanation: 'Task A only needs yes or no, so a HashSet is enough. Task B needs how many times each number appears. A HashMap from number to count gives that in one pass. You will learn counting with a HashMap in Module 3.',
  },
  {
    id: 'repeat-or-near-repeat',
    kind: 'lookalike',
    moduleId: 'foundations',
    prompt: '<p><b>Task A:</b> Does any number appear twice anywhere in the list?</p><p><b>Task B:</b> Are two equal numbers at most k places apart?</p><p>Which idea fits <b>Task B</b>?</p>',
    acceptedPatternIds: ['fixed-window'],
    clueExplanation: 'Words: "at most k places apart" means only nearby numbers count. Keep a HashSet of just the last k numbers, and drop the oldest as you move. You will learn this as the sliding window in Module 5.',
  },
  {
    id: 'repeat-or-pair-sum',
    kind: 'lookalike',
    moduleId: 'foundations',
    prompt: '<p><b>Task A:</b> Does any number appear twice?</p><p><b>Task B:</b> Do any two numbers add up to a target?</p><p>Which idea fits <b>Task B</b>?</p>',
    acceptedPatternIds: ['partner-lookup'],
    clueExplanation: 'Bottleneck: for each number, the slow way searches the list for its partner, which is the target minus the number. A HashMap of the numbers seen so far finds the partner in about one step. You will learn this partner lookup in Module 3.',
  },
];
