import type { Problem, ProblemSpec } from '../../../../../src/content-types';
import better from './Better.java?raw';
import brute from './Brute.java?raw';
import optimal from './Optimal.java?raw';
import spec from './spec.json';
import starter from './Starter.java?raw';

export const containsDuplicate: Problem = {
  id: 'contains-duplicate',
  moduleId: 'foundations',
  title: 'Contains Duplicate',
  patternIds: ['hashing'],
  difficulty: 'easy',
  core: true,
  sheets: ['neetcode150'],
  source: { name: 'LeetCode 217', url: 'https://leetcode.com/problems/contains-duplicate/' },
  statement: '<p>You get an array of whole numbers called <code>nums</code>. The numbers can be negative. Return <code>true</code> if any value appears at least twice. Return <code>false</code> if every value is different.</p>',
  limits: ['1 ≤ nums.length ≤ 100,000', '-1,000,000,000 ≤ nums[i] ≤ 1,000,000,000'],
  examples: [
    { input: 'nums = [1, 2, 3, 1]', output: 'true', note: 'The number 1 appears twice.' },
    { input: 'nums = [1, 2, 3, 4]', output: 'false', note: 'Every number is different.' },
  ],
  spot: {
    prompt: 'Which idea fits this problem best?',
    options: ['Check every pair of numbers', 'Remember the numbers you have already seen', 'Count up to the biggest number'],
    answer: 1,
    clues: [
      { kind: 'size', text: 'Up to 100,000 numbers. Checking every pair is about 5 billion checks, which is too slow.' },
      { kind: 'words', text: '"Any value appears twice" is really the question "have I seen this before?"' },
      { kind: 'shape', text: 'One unsorted list. The order of the numbers does not change the answer.' },
      { kind: 'bottleneck', text: 'The slow way searches for an equal number again and again. A HashSet answers in about one step on average.' },
    ],
  },
  hints: [
    'What is the slowest correct way? Say its Big-O out loud.',
    'For each number, the slow way asks "is there an equal number somewhere?" Can you answer that faster?',
    'Keep a HashSet. If add() returns false, that value was already there.',
  ],
  approaches: [
    {
      level: 'brute',
      title: 'Compare every pair',
      idea: 'For each index i, look at every later index j. If two values match, return true. If no pair matches, return false.',
      java: brute,
      time: 'O(n²)',
      space: 'O(1)',
      nextStepRemoves: 'The inner loop searches the rest of the list for every number. Putting equal numbers side by side turns that search into one look at a neighbour.',
      traceId: 'contains-duplicate/brute',
    },
    {
      level: 'better',
      title: 'Sort, then check neighbours',
      idea: 'Copy the array and put the copy in order. Equal numbers now sit side by side. One walk through the list that compares each number with the one before it finds any repeat. You will learn how sorting works in Module 7.',
      java: better,
      time: 'O(n log n)',
      space: 'O(n)',
      nextStepRemoves: 'Putting every number in order does more work than we need. We only need to know if a value was seen before. A HashSet answers that directly.',
    },
    {
      level: 'optimal',
      title: 'Remember what you have seen',
      idea: 'Walk the array once. Keep a HashSet of values seen so far. If the current value is already in the set, return true. Otherwise add it and move on. On average, each add takes about one step.',
      java: optimal,
      time: 'O(n)',
      space: 'O(n)',
      traceId: 'contains-duplicate/optimal',
    },
  ],
  edgeCases: [
    'Only one number. There is no pair, so the answer is false.',
    'All numbers are the same, like [7, 7, 7]. The answer is true at the second number.',
    'The repeat is at the very end. You must look at every number before you say false.',
    'Very large and very small numbers. They are safe because we only compare them.',
  ],
  mistakes: [
    'Starting the inner loop at j = 0. Then every number matches itself and the answer is always true.',
    'Putting nums itself in order. That changes the array of whoever gave it to you. Work on a copy instead.',
    'Storing the index in the set instead of the value. Every index is different, so nothing ever repeats.',
  ],
  explain30:
    'The simple way compares every pair. That is O(n²), which is too slow for 100,000 numbers. I only need to know if I have seen a value before. So I walk the array once with a HashSet. If add() returns false, it was already there and I return true. On average that is O(n) time, and it is O(n) space.',
  hook: 'Seen it before? Use a HashSet.',
  related: [
    { title: 'Valid Anagram', why: 'Also asks a "have I seen this?" question, but counts letters.' },
    { title: 'Two Sum', why: 'Replaces an inner search loop with one HashMap lookup.' },
  ],
  lookAlikes: [
    { title: 'Contains Duplicate II', why: 'Same idea, but only the last k numbers count. You will learn it with the sliding window in Module 5.' },
    { title: 'Find the Duplicate Number', why: 'No extra space is allowed, so a HashSet is not an option. You will learn the trick in Module 10.' },
  ],
  // JSON types are wider than ProblemSpec. The content check validates every field.
  spec: spec as unknown as ProblemSpec,
  starter,
};
