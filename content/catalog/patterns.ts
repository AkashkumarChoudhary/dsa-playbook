import type { Pattern } from '../../src/content-types';

const P = (moduleId: string, lessonId: string, id: string, title: string): Pattern => ({ id, moduleId, lessonId, title });

/** Every pattern. Each one has exactly one lesson that teaches it. Mastery is measured per pattern (spec §9.3). */
export const catalogPatterns: Pattern[] = [
  P('arrays-strings', 'in-place-array-moves', 'in-place-array', 'Change the array in place'),
  P('arrays-strings', 'running-value', 'running-value', 'One pass with a running value'),
  P('arrays-strings', 'prefix-sums', 'prefix-sum', 'Prefix sums'),
  P('arrays-strings', 'kadane', 'kadane', 'Kadane: best subarray'),
  P('arrays-strings', 'grid-walks', 'grid-walk', 'Walk a 2-D grid'),
  P('arrays-strings', 'strings-stringbuilder', 'string-building', 'Build strings with StringBuilder'),

  P('hashing', 'hashset-seen-before', 'hashing', 'HashSet: seen it before?'),
  P('hashing', 'hashmap-counting', 'counting', 'Count with a HashMap'),
  P('hashing', 'hashmap-partner', 'partner-lookup', 'Find the partner with a HashMap'),
  P('hashing', 'group-by-key', 'group-by-key', 'Group by a key'),
  P('hashing', 'prefix-sum-hashmap', 'prefix-sum-map', 'Prefix sum + HashMap'),

  P('two-pointers', 'pointers-from-both-ends', 'opposite-pointers', 'Two pointers from both ends'),
  P('two-pointers', 'pointers-same-way', 'same-direction-pointers', 'Two pointers going the same way'),
  P('two-pointers', 'expand-from-center', 'expand-center', 'Expand from the center'),

  P('sliding-window', 'fixed-window', 'fixed-window', 'Fixed-size sliding window'),
  P('sliding-window', 'grow-shrink-window', 'variable-window', 'Window that grows and shrinks'),
  P('sliding-window', 'exactly-k-trick', 'exactly-k-window', 'Exactly K with two windows'),

  P('recursion-basics', 'base-case-call-stack', 'base-case-recursion', 'Recursion: base case + smaller call'),
  P('recursion-basics', 'recursion-trees', 'recursion-tree', 'Recursion tree'),
  P('recursion-basics', 'pick-not-pick', 'pick-not-pick', 'Pick or not pick'),

  P('sorting', 'merge-sort', 'merge-sort', 'Merge sort: split and merge'),
  P('sorting', 'quick-sort-partition', 'partition', 'Partition around a pivot'),
  P('sorting', 'custom-sort-order', 'custom-order', 'Sort in a custom order'),
  P('sorting', 'sort-then-scan', 'sort-then-scan', 'Sort first, then scan'),

  P('binary-search', 'binary-search-basics', 'binary-search', 'Binary search for a value'),
  P('binary-search', 'first-or-last-true', 'bounds-search', 'First or last true (bounds)'),
  P('binary-search', 'rotated-arrays', 'rotated-search', 'Search a rotated array'),
  P('binary-search', 'search-on-answer', 'answer-search', 'Binary search on the answer'),
  P('binary-search', 'sorted-grid-search', 'grid-search', 'Search a sorted grid'),
  P('binary-search', 'two-arrays-cut', 'cut-search', 'Binary search the cut'),

  P('stack-queue', 'stack-matching', 'stack-matching', 'Stack for matching pairs'),
  P('stack-queue', 'stack-process-undo', 'stack-process', 'Stack to process and undo'),
  P('stack-queue', 'queues', 'queue', 'Queue: first in, first out'),
  P('stack-queue', 'monotonic-stack', 'monotonic-stack', 'Monotonic stack'),

  P('linked-list', 'reverse-a-list', 'list-reverse', 'Reverse links in place'),
  P('linked-list', 'dummy-head-merge', 'dummy-head', 'Dummy head and merge'),
  P('linked-list', 'fast-slow-pointers', 'list-pointers', 'Fast, slow and gap pointers'),
  P('linked-list', 'list-plus-hashmap', 'list-design', 'List + HashMap design'),

  P('backtracking', 'choose-explore-undo', 'backtracking', 'Choose, explore, undo'),
  P('backtracking', 'prune-and-skip', 'prune-dedupe', 'Prune and skip duplicates'),
  P('backtracking', 'build-permutations', 'permutations', 'Build permutations'),
  P('backtracking', 'boards-and-grids', 'board-backtracking', 'Backtrack on a board or grid'),

  P('trees', 'tree-walks', 'tree-dfs', 'Tree DFS: pre, in, post order'),
  P('trees', 'answers-from-children', 'bottom-up-tree', 'Answer from the children'),
  P('trees', 'level-by-level', 'tree-bfs', 'Tree BFS by level'),
  P('trees', 'tree-views', 'tree-views', 'Tree views and columns'),
  P('trees', 'build-trees', 'tree-build', 'Build a tree from walks'),
  P('trees', 'bst-rules', 'bst', 'BST rules'),

  P('heap', 'top-k-heap', 'top-k', 'Top K with a heap'),
  P('heap', 'k-way-merge', 'k-way-merge', 'K-way merge with a heap'),
  P('heap', 'two-heaps', 'two-heaps', 'Two heaps for a median'),
  P('heap', 'best-item-now', 'best-now', 'Take the best item now'),

  P('tries', 'trie-basics', 'trie', 'Trie: a prefix tree'),
  P('tries', 'trie-with-dfs', 'trie-dfs', 'Trie + DFS search'),

  P('graphs', 'graph-dfs', 'graph-dfs', 'Graph DFS'),
  P('graphs', 'graph-bfs', 'graph-bfs', 'Graph BFS: fewest steps'),
  P('graphs', 'multi-source-bfs', 'multi-source-bfs', 'BFS from many starts'),
  P('graphs', 'topological-sort', 'topo-sort', 'Topological sort'),
  P('graphs', 'union-find', 'union-find', 'Union-Find'),

  P('advanced-graphs', 'dijkstra', 'dijkstra', 'Dijkstra'),
  P('advanced-graphs', 'bellman-ford', 'bellman-ford', 'Bellman-Ford'),
  P('advanced-graphs', 'floyd-warshall', 'floyd-warshall', 'Floyd-Warshall'),
  P('advanced-graphs', 'minimum-spanning-tree', 'mst', 'Minimum spanning tree'),

  P('dp-1d', 'memo-and-table', 'step-dp', 'DP on steps (like Fibonacci)'),
  P('dp-1d', 'take-or-skip', 'take-or-skip', 'Take it or skip it'),
  P('dp-1d', 'amount-dp', 'amount-dp', 'DP over amounts'),
  P('dp-1d', 'split-a-string-dp', 'split-dp', 'Split a string with DP'),
  P('dp-1d', 'longest-increasing', 'lis', 'Longest increasing subsequence'),

  P('dp-2d', 'grid-dp', 'grid-dp', 'Grid DP'),
  P('dp-2d', 'knapsack-01', 'knapsack', '0/1 knapsack'),
  P('dp-2d', 'unbounded-knapsack', 'unbounded-knapsack', 'Unbounded knapsack'),
  P('dp-2d', 'two-string-dp', 'two-string-dp', 'Two-string DP (LCS family)'),
  P('dp-2d', 'stock-states', 'state-dp', 'State machine DP'),

  P('greedy-intervals', 'greedy-choice', 'greedy', 'Best choice now (greedy)'),
  P('greedy-intervals', 'farthest-reach', 'reach', 'Farthest reach'),
  P('greedy-intervals', 'merge-intervals', 'merge-intervals', 'Sort and merge intervals'),
  P('greedy-intervals', 'earliest-end-first', 'interval-scheduling', 'Keep the earliest end'),
  P('greedy-intervals', 'count-overlaps', 'overlap-count', 'Count overlaps'),

  P('bits-math', 'digit-math', 'digit-math', 'Digit math'),
  P('bits-math', 'gcd-and-primes', 'number-theory', 'GCD and primes'),
  P('bits-math', 'fast-power', 'fast-power', 'Fast power'),
  P('bits-math', 'bit-basics', 'bit-tricks', 'Bit masks and shifts'),
  P('bits-math', 'xor-tricks', 'xor', 'XOR tricks'),

  P('range-queries', 'segment-tree', 'segment-tree', 'Segment tree'),
  P('range-queries', 'fenwick-tree', 'fenwick-tree', 'Fenwick tree'),
  P('range-queries', 'sparse-table', 'sparse-table', 'Sparse table'),

  P('string-algorithms', 'kmp', 'kmp', 'KMP prefix function'),
  P('string-algorithms', 'z-function', 'z-function', 'Z-function'),
  P('string-algorithms', 'rolling-hash', 'rolling-hash', 'Rolling hash'),
  P('string-algorithms', 'manacher', 'manacher', 'Manacher'),

  P('advanced-dp', 'lis-fast', 'lis-fast', 'LIS with binary search'),
  P('advanced-dp', 'interval-dp', 'interval-dp', 'Interval DP'),
  P('advanced-dp', 'tree-dp', 'tree-dp', 'Tree DP'),
  P('advanced-dp', 'bitmask-dp', 'bitmask-dp', 'Bitmask DP'),
  P('advanced-dp', 'digit-dp', 'digit-dp', 'Digit DP'),

  P('graph-algorithms-2', 'two-color-graph', 'bipartite', 'Two-coloring (bipartite)'),
  P('graph-algorithms-2', 'zero-one-bfs', 'zero-one-bfs', '0-1 BFS'),
  P('graph-algorithms-2', 'bridges-cut-points', 'bridges', 'Bridges and cut points'),
  P('graph-algorithms-2', 'strongly-connected', 'scc', 'Strongly connected parts'),
  P('graph-algorithms-2', 'euler-path', 'euler-path', 'Euler path'),

  P('more-patterns', 'monotonic-deque', 'monotonic-deque', 'Monotonic deque'),
  P('more-patterns', 'treemap', 'treemap', 'Ordered map (TreeMap)'),
  P('more-patterns', 'sweep-line', 'sweep-line', 'Sweep line'),
  P('more-patterns', 'reservoir-sampling', 'reservoir', 'Reservoir sampling'),
  P('more-patterns', 'meet-in-the-middle', 'meet-middle', 'Meet in the middle'),
  P('more-patterns', 'quickselect', 'quickselect', 'Quickselect'),
  P('more-patterns', 'morris-traversal', 'morris', 'Morris traversal'),
];
