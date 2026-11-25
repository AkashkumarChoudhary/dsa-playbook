import type { CatalogLesson } from '../../src/content-types';

const L = (moduleId: string, id: string, title: string, minutes: number, patternId?: string): CatalogLesson =>
  patternId ? { id, moduleId, title, minutes, patternId } : { id, moduleId, title, minutes };

/**
 * Every planned lesson, module by module. Pattern lessons name their pattern.
 * Ids are drafts until the module's part starts (spec §5). Once a lesson is built, its id never changes.
 */
export const catalogLessons: CatalogLesson[] = [
  // M1 Foundations: the draft list from spec §5
  L('foundations', 'what-is-dsa', 'What DSA is and why it helps', 10),
  L('foundations', 'big-o-time', 'Big-O for time', 20),
  L('foundations', 'big-o-space', 'Big-O for memory', 15),
  L('foundations', 'reading-limits', 'Read the limits first', 15),
  L('foundations', 'java-toolkit', 'Your Java toolkit and what each part costs', 25),
  L('foundations', 'how-to-dry-run', 'How to dry run code', 15),
  L('foundations', 'brute-better-optimal', 'Brute force, better, optimal', 10),
  L('foundations', 'edge-cases', 'Find the edge cases', 15),
  L('foundations', 'interview-script', 'The interview script', 15),

  // M2 Arrays & Strings
  L('arrays-strings', 'in-place-array-moves', 'Change an array in place', 20, 'in-place-array'),
  L('arrays-strings', 'running-value', 'Keep a running value in one pass', 15, 'running-value'),
  L('arrays-strings', 'prefix-sums', 'Prefix sums', 20, 'prefix-sum'),
  L('arrays-strings', 'kadane', 'Kadane: the best subarray sum', 20, 'kadane'),
  L('arrays-strings', 'grid-walks', 'Walk a 2-D grid', 20, 'grid-walk'),
  L('arrays-strings', 'strings-stringbuilder', 'Strings and StringBuilder', 15, 'string-building'),

  // M3 Hashing
  L('hashing', 'hashset-seen-before', 'HashSet: have I seen it?', 20, 'hashing'),
  L('hashing', 'hashmap-counting', 'HashMap: count things', 20, 'counting'),
  L('hashing', 'hashmap-partner', 'HashMap: find the partner', 20, 'partner-lookup'),
  L('hashing', 'group-by-key', 'Group things by a key', 15, 'group-by-key'),
  L('hashing', 'prefix-sum-hashmap', 'Prefix sum + HashMap', 25, 'prefix-sum-map'),

  // M4 Two Pointers
  L('two-pointers', 'pointers-from-both-ends', 'Two pointers from both ends', 20, 'opposite-pointers'),
  L('two-pointers', 'pointers-same-way', 'Two pointers going the same way', 20, 'same-direction-pointers'),
  L('two-pointers', 'expand-from-center', 'Expand from the center', 20, 'expand-center'),

  // M5 Sliding Window
  L('sliding-window', 'fixed-window', 'A window of fixed size', 20, 'fixed-window'),
  L('sliding-window', 'grow-shrink-window', 'A window that grows and shrinks', 25, 'variable-window'),
  L('sliding-window', 'exactly-k-trick', 'Exactly K with two windows', 15, 'exactly-k-window'),

  // M6 Recursion Basics
  L('recursion-basics', 'base-case-call-stack', 'Base case and the call stack', 20, 'base-case-recursion'),
  L('recursion-basics', 'pass-down-or-return-up', 'Pass it down or return it up', 15),
  L('recursion-basics', 'recursion-trees', 'Recursion trees', 20, 'recursion-tree'),
  L('recursion-basics', 'pick-not-pick', 'Pick or not pick', 25, 'pick-not-pick'),

  // M7 Sorting
  L('sorting', 'simple-sorts', 'Bubble, selection and insertion sort', 20),
  L('sorting', 'merge-sort', 'Merge sort', 25, 'merge-sort'),
  L('sorting', 'quick-sort-partition', 'Quick sort and partition', 25, 'partition'),
  L('sorting', 'custom-sort-order', 'Sort in your own order', 15, 'custom-order'),
  L('sorting', 'sort-then-scan', 'Sort first, then scan', 20, 'sort-then-scan'),

  // M8 Binary Search
  L('binary-search', 'binary-search-basics', 'Binary search: halve the range', 20, 'binary-search'),
  L('binary-search', 'first-or-last-true', 'First or last true (lower and upper bound)', 25, 'bounds-search'),
  L('binary-search', 'rotated-arrays', 'Search a rotated array', 20, 'rotated-search'),
  L('binary-search', 'search-on-answer', 'Binary search on the answer', 25, 'answer-search'),
  L('binary-search', 'sorted-grid-search', 'Search a sorted grid', 20, 'grid-search'),
  L('binary-search', 'two-arrays-cut', 'Binary search the cut in two arrays', 25, 'cut-search'),

  // M9 Stack & Queue
  L('stack-queue', 'stack-matching', 'Stacks for matching pairs', 20, 'stack-matching'),
  L('stack-queue', 'stack-process-undo', 'Stacks to process and undo', 20, 'stack-process'),
  L('stack-queue', 'queues', 'Queues: first in, first out', 15, 'queue'),
  L('stack-queue', 'monotonic-stack', 'Monotonic stack: next greater or smaller', 25, 'monotonic-stack'),

  // M10 Linked List
  L('linked-list', 'linked-list-basics', 'What a linked list is', 15),
  L('linked-list', 'reverse-a-list', 'Reverse a list in place', 20, 'list-reverse'),
  L('linked-list', 'dummy-head-merge', 'Dummy head and merging', 20, 'dummy-head'),
  L('linked-list', 'fast-slow-pointers', 'Fast, slow and gap pointers', 25, 'list-pointers'),
  L('linked-list', 'list-plus-hashmap', 'Lists plus a HashMap', 25, 'list-design'),

  // M11 Backtracking
  L('backtracking', 'choose-explore-undo', 'Choose, explore, undo', 25, 'backtracking'),
  L('backtracking', 'prune-and-skip', 'Prune paths and skip duplicates', 25, 'prune-dedupe'),
  L('backtracking', 'build-permutations', 'Build permutations', 20, 'permutations'),
  L('backtracking', 'boards-and-grids', 'Fill boards and walk grids', 25, 'board-backtracking'),

  // M12 Trees
  L('trees', 'tree-walks', 'Tree walks: pre, in and post order', 25, 'tree-dfs'),
  L('trees', 'answers-from-children', 'Answers from the children', 25, 'bottom-up-tree'),
  L('trees', 'level-by-level', 'Level by level (BFS)', 20, 'tree-bfs'),
  L('trees', 'tree-views', 'Tree views and columns', 20, 'tree-views'),
  L('trees', 'build-trees', 'Build and save trees', 20, 'tree-build'),
  L('trees', 'bst-rules', 'Binary search tree rules', 25, 'bst'),

  // M13 Heap
  L('heap', 'heap-basics', 'How a heap works', 15),
  L('heap', 'top-k-heap', 'Top K with a heap', 20, 'top-k'),
  L('heap', 'k-way-merge', 'Merge K sorted lists', 20, 'k-way-merge'),
  L('heap', 'two-heaps', 'Two heaps for the median', 20, 'two-heaps'),
  L('heap', 'best-item-now', 'Take the best item now', 20, 'best-now'),

  // M14 Tries
  L('tries', 'trie-basics', 'Build a trie', 25, 'trie'),
  L('tries', 'trie-with-dfs', 'Search a trie with DFS', 20, 'trie-dfs'),

  // M15 Graphs
  L('graphs', 'graph-basics', 'Graphs: nodes and edges', 20),
  L('graphs', 'graph-dfs', 'Depth-first search (DFS)', 25, 'graph-dfs'),
  L('graphs', 'graph-bfs', 'Breadth-first search (BFS)', 25, 'graph-bfs'),
  L('graphs', 'multi-source-bfs', 'BFS from many starts', 20, 'multi-source-bfs'),
  L('graphs', 'topological-sort', 'Order with prerequisites', 25, 'topo-sort'),
  L('graphs', 'union-find', 'Union-Find groups', 25, 'union-find'),

  // M16 Advanced Graphs
  L('advanced-graphs', 'dijkstra', 'Dijkstra: shortest paths', 25, 'dijkstra'),
  L('advanced-graphs', 'bellman-ford', 'Bellman-Ford and limited stops', 20, 'bellman-ford'),
  L('advanced-graphs', 'floyd-warshall', 'All pairs with Floyd-Warshall', 20, 'floyd-warshall'),
  L('advanced-graphs', 'minimum-spanning-tree', 'Minimum spanning trees', 25, 'mst'),

  // M17 1-D DP
  L('dp-1d', 'memo-and-table', 'From recursion to memo to table', 25, 'step-dp'),
  L('dp-1d', 'take-or-skip', 'Take it or skip it', 20, 'take-or-skip'),
  L('dp-1d', 'amount-dp', 'The best way to make an amount', 25, 'amount-dp'),
  L('dp-1d', 'split-a-string-dp', 'Can this prefix be split?', 20, 'split-dp'),
  L('dp-1d', 'longest-increasing', 'Longest increasing subsequence', 25, 'lis'),

  // M18 2-D DP
  L('dp-2d', 'grid-dp', 'DP on a grid', 20, 'grid-dp'),
  L('dp-2d', 'knapsack-01', '0/1 knapsack', 25, 'knapsack'),
  L('dp-2d', 'unbounded-knapsack', 'Unbounded knapsack', 20, 'unbounded-knapsack'),
  L('dp-2d', 'two-string-dp', 'Two strings: the LCS family', 25, 'two-string-dp'),
  L('dp-2d', 'stock-states', 'States: the stock problems', 20, 'state-dp'),

  // M19 Greedy & Intervals
  L('greedy-intervals', 'greedy-choice', 'Make the best choice now', 25, 'greedy'),
  L('greedy-intervals', 'farthest-reach', 'Track the farthest reach', 20, 'reach'),
  L('greedy-intervals', 'merge-intervals', 'Sort and merge intervals', 20, 'merge-intervals'),
  L('greedy-intervals', 'earliest-end-first', 'Keep the earliest end', 20, 'interval-scheduling'),
  L('greedy-intervals', 'count-overlaps', 'Count overlaps with starts and ends', 20, 'overlap-count'),

  // M20 Bits & Math
  L('bits-math', 'digit-math', 'Work with digits', 20, 'digit-math'),
  L('bits-math', 'gcd-and-primes', 'GCD and primes', 20, 'number-theory'),
  L('bits-math', 'fast-power', 'Fast power', 15, 'fast-power'),
  L('bits-math', 'bit-basics', 'Bits, masks and shifts', 25, 'bit-tricks'),
  L('bits-math', 'xor-tricks', 'XOR tricks', 20, 'xor'),

  // M21 Range Queries
  L('range-queries', 'segment-tree', 'Segment trees', 30, 'segment-tree'),
  L('range-queries', 'lazy-updates', 'Range updates with lazy marks', 25),
  L('range-queries', 'fenwick-tree', 'Fenwick trees', 25, 'fenwick-tree'),
  L('range-queries', 'sparse-table', 'Sparse tables', 20, 'sparse-table'),

  // M22 String Algorithms
  L('string-algorithms', 'kmp', 'KMP and the prefix function', 30, 'kmp'),
  L('string-algorithms', 'z-function', 'The Z-function', 20, 'z-function'),
  L('string-algorithms', 'rolling-hash', 'Rolling hash (Rabin-Karp)', 25, 'rolling-hash'),
  L('string-algorithms', 'manacher', 'Manacher: every palindrome fast', 25, 'manacher'),

  // M23 Advanced DP
  L('advanced-dp', 'lis-fast', 'LIS with binary search', 20, 'lis-fast'),
  L('advanced-dp', 'interval-dp', 'Interval DP: try every split', 30, 'interval-dp'),
  L('advanced-dp', 'tree-dp', 'DP on trees', 25, 'tree-dp'),
  L('advanced-dp', 'bitmask-dp', 'Bitmask DP', 25, 'bitmask-dp'),
  L('advanced-dp', 'digit-dp', 'Digit DP', 25, 'digit-dp'),

  // M24 Graph Algorithms II
  L('graph-algorithms-2', 'two-color-graph', 'Two-color a graph', 20, 'bipartite'),
  L('graph-algorithms-2', 'zero-one-bfs', '0-1 BFS with a deque', 20, 'zero-one-bfs'),
  L('graph-algorithms-2', 'bridges-cut-points', 'Bridges and cut points', 30, 'bridges'),
  L('graph-algorithms-2', 'strongly-connected', 'Strongly connected parts', 25, 'scc'),
  L('graph-algorithms-2', 'euler-path', 'Euler paths', 25, 'euler-path'),

  // M25 More Patterns
  L('more-patterns', 'monotonic-deque', 'Monotonic deque', 25, 'monotonic-deque'),
  L('more-patterns', 'treemap', 'Ordered maps with TreeMap', 20, 'treemap'),
  L('more-patterns', 'sweep-line', 'Sweep line', 25, 'sweep-line'),
  L('more-patterns', 'reservoir-sampling', 'Reservoir sampling', 15, 'reservoir'),
  L('more-patterns', 'meet-in-the-middle', 'Meet in the middle', 25, 'meet-middle'),
  L('more-patterns', 'quickselect', 'Quickselect', 20, 'quickselect'),
  L('more-patterns', 'morris-traversal', 'Morris traversal', 20, 'morris'),

  // M26 Interview & Meta
  L('interview-meta', 'full-interview-script', 'The full interview script', 20),
  L('interview-meta', 'think-out-loud', 'Think out loud', 15),
  L('interview-meta', 'choose-a-pattern', 'Choose a pattern with the clues', 20),
  L('interview-meta', 'mock-rounds', 'How mock rounds work', 15),
];
