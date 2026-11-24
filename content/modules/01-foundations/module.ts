import type { Module } from '../../../src/content-types';

export const foundations: Module = {
  id: 'foundations',
  order: 1,
  level: 'basics',
  icon: '🧱',
  title: 'Foundations',
  summary: 'How to think about speed, how to read the limits, and how to turn a slow answer into a fast one.',
  status: 'building',
  outcomes: [
    'Write a brute force and say its Big-O.',
    'Find the work a slow answer repeats.',
    'Use a HashSet to answer "have I seen this before?" in about one step on average.',
  ],
  lessonIds: ['brute-better-optimal'],
  problemIds: ['contains-duplicate'],
  quiz: [],
  cheatsheet: [],
  glossary: [
    { term: 'Brute force', aka: [], def: 'The simplest correct answer. It usually checks every option, so it is often slow.' },
    { term: 'Big-O', aka: ['time complexity'], def: 'A way to say how the number of steps grows when the input grows.' },
    { term: 'HashSet', aka: [], def: 'A Java set that can add a value or check for it in about one step on average.' },
  ],
};
