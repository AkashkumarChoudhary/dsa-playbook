import type { Lesson } from '../../../../src/content-types';

export const bruteBetterOptimal: Lesson = {
  id: 'brute-better-optimal',
  moduleId: 'foundations',
  title: 'Brute force, better, optimal',
  minutes: 10,
  summary: 'Start with the simple slow answer. Then find the work it repeats and remove it, one step at a time.',
  example: `<p>You get a list of numbers. Does any number appear twice?</p>
<ul><li>[3, 8, 1, 8] has a repeat. The number 8 appears twice.</li><li>[3, 8, 1, 5] has no repeat.</li></ul>
<p>The list can hold 100,000 numbers. How do you answer fast?</p>`,
  everyday: `<p>Think of a guard checking names at a party door.</p>
<p>The slow guard walks through the whole hall for every new guest and looks at every face. The fast guard keeps a guest list at the door. Each new name needs one look at the list.</p>`,
  steps: [
    { icon: '🐢', title: 'Write the brute force', text: 'Compare every pair of numbers. It is slow, but it is correct. It is your starting point.' },
    { icon: '🔢', title: 'Count its cost', text: '100,000 numbers make about 5 billion pairs. At 100 million steps a second, that takes about 50 seconds.' },
    { icon: '🔁', title: 'Find the repeated work', text: 'For each number, the inner loop searches the list again. That search is the work we keep repeating.' },
    { icon: '🚶', title: 'Make it better', text: 'Put the list in order first. Equal numbers then sit side by side, so one pass finds a repeat. You will learn sorting in Module 7.' },
    { icon: '🚀', title: 'Make it optimal', text: 'Keep a HashSet of numbers you have seen. Checking it takes about one step, so one pass is enough.' },
    { icon: '✅', title: 'Check the new cost', text: 'One pass over 100,000 numbers is 100,000 steps. That takes about one millisecond.' },
  ],
  viz: [
    { label: 'Brute force: compare every pair', traceId: 'contains-duplicate/brute', input: { nums: [3, 8, 1, 8] } },
    { label: 'Optimal: remember what you have seen', traceId: 'contains-duplicate/optimal', input: { nums: [3, 8, 1, 8] } },
  ],
  deep: `<h4>The numbers</h4>
<p>With n numbers there are n × (n − 1) ÷ 2 pairs. For n = 100,000 that is 100,000 × 99,999 ÷ 2, which is about 5,000,000,000 pairs.</p>
<p>Putting the list in order takes about n × log₂ n steps. You will learn why in Module 7. log₂ 100,000 is about 17, so that is about 1,700,000 steps. The HashSet way takes about 100,000 steps.</p>
<h4>Why a HashSet is fast</h4>
<p>A HashSet turns each value into a number called a hash code. The hash code says which bucket the value lives in. So it checks one bucket, not the whole list. This is O(1) on average. Many values can land in the same bucket, so the worst case is slower.</p>
<h4>Why O(n) is the best we can do</h4>
<p>The repeat might be the very last number. So any correct answer must look at every number at least once. That means O(n) time is the lower limit.</p>
<h4>The trade</h4>
<p>The HashSet saves time but uses O(n) extra memory. If memory is very tight, putting the list in order is the better choice.</p>`,
  spot: {
    size: 'n can be 100,000. About 5 billion pair checks are far too many. You need O(n log n) or O(n).',
    words: 'Words like "appears twice", "duplicate" or "seen before".',
    shape: 'One unsorted list. The order of the numbers does not change the answer.',
    bottleneck: 'An inner loop searches for an equal value again and again. A HashSet answers "have I seen it?" in about one step.',
  },
  traps: [
    {
      looksLike: '"Find the duplicate number", but you may not change the array or use extra memory.',
      butIs: 'A different trick that treats the values like links. You will learn it in Module 10.',
      why: 'A HashSet uses extra memory, so the rules forbid it.',
    },
    {
      looksLike: '"Are two equal numbers at most k places apart?"',
      butIs: 'The same HashSet idea, but you keep only the last k numbers. You will learn this as the sliding window in Module 5.',
      why: 'Numbers that are far apart do not count.',
    },
  ],
  template: {
    title: 'Seen before? Use a HashSet',
    java: `Set<Integer> seen = new HashSet<>();
for (int x : nums) {
    if (!seen.add(x)) {
        // x was already in the set
    }
}`,
  },
  complexityFacts: [
    { q: 'HashSet add or contains: how fast?', a: 'O(1) on average', why: 'It jumps straight to one bucket instead of searching.' },
    { q: 'Checking every pair of n numbers?', a: 'O(n²)', why: 'There are about n × n ÷ 2 pairs.' },
    { q: 'Putting n numbers in order with Arrays.sort?', a: 'O(n log n)', why: 'You will learn why in Module 7.' },
  ],
  realLife: [
    { text: 'A sign-up form checks if a username is taken. It looks in a set of names, not through every user one by one.', tier: 'educational' },
    { text: 'Java’s HashSet is backed by a hash table. Add and contains take constant time when the hash spreads values well.', tier: 'confirmed', source: 'Java SE API documentation, HashSet' },
  ],
  mistakes: [
    'Jumping to the clever answer without saying the brute force. Interviewers want to see your path.',
    'Putting the input array itself in order when the caller still needs it. Work on a copy instead.',
    'Saying a HashSet is always O(1). Say "O(1) on average", because many values in one bucket make it slower.',
  ],
  interview: [
    'Say the brute force and its Big-O first, in one or two sentences.',
    'Name the repeated work out loud. For example, "the inner loop searches the list again".',
    'State the trade. The HashSet saves time but uses O(n) extra memory.',
  ],
  quiz: [
    {
      q: 'What should you say first in an interview?',
      options: ['Only the optimal answer', 'The brute force and its Big-O', 'The Java syntax for HashSet', 'Nothing until the code is done'],
      answer: 1,
      why: 'The brute force shows you understand the problem. Its cost tells you how much faster you need to be.',
    },
    {
      q: 'The brute force compares every pair. What is the repeated work?',
      options: ['Reading the input', 'Searching the list again for each number', 'Printing the answer', 'Making the array'],
      answer: 1,
      why: 'For every number, the inner loop scans the list again. A HashSet replaces that scan with one look.',
    },
    {
      q: 'n is 100,000. Which cost is fast enough?',
      options: ['O(n²)', 'O(n³)', 'O(n)', 'O(2ⁿ)'],
      answer: 2,
      why: 'O(n) is about 100,000 steps. O(n²) is about 10 billion steps, which is far too slow.',
    },
  ],
  problemIds: ['contains-duplicate'],
};
