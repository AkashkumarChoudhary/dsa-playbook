import type { Sheet } from '../../src/content-types';
import { neetcode150 } from './neetcode150';
import { striverBs } from './striver-bs';
import { striverRecursion } from './striver-recursion';

/** The three problem lists, credited by name (spec §3). The id lists are generated. */
export const sheets: Sheet[] = [
  { id: 'neetcode150', title: 'NeetCode 150', credit: 'The list and its order come from NeetCode (neetcode.io).', problemIds: neetcode150 },
  { id: 'striver-bs', title: 'Striver Binary Search', credit: 'The list and its order come from Striver (takeUforward), binary search sheet.', problemIds: striverBs },
  { id: 'striver-recursion', title: 'Striver Recursion', credit: 'The list and its order come from Striver (takeUforward), recursion sheet.', problemIds: striverRecursion },
];
