// Builds the problem catalog and the three sheet lists from docs/curriculum/problem-map.md.
// Usage: node scripts/build-catalog.mjs          (write the files)
//        node scripts/build-catalog.mjs --check  (fail if the files on disk are out of date)
// The problem map gives the rows. The MAP table below adds each problem's patterns and its core flag.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAP_FILE = join(ROOT, 'docs', 'curriculum', 'problem-map.md');

/** Problem-map module number → catalog module id (content/catalog/modules.ts). */
const MODULE_IDS = [
  null, 'foundations', 'arrays-strings', 'hashing', 'two-pointers', 'sliding-window', 'recursion-basics', 'sorting',
  'binary-search', 'stack-queue', 'linked-list', 'backtracking', 'trees', 'heap', 'tries', 'graphs', 'advanced-graphs',
  'dp-1d', 'dp-2d', 'greedy-intervals', 'bits-math', 'range-queries', 'string-algorithms', 'advanced-dp',
  'graph-algorithms-2', 'more-patterns', 'interview-meta',
];

/** NeetCode 150 in its official order (neetcode-gh/leetcode .problemSiteData.json, the data behind neetcode.io/practice). */
const NC150_ORDER = [
  'contains-duplicate', 'valid-anagram', 'two-sum', 'group-anagrams', 'top-k-frequent-elements',
  'product-of-array-except-self', 'valid-sudoku', 'encode-and-decode-strings', 'longest-consecutive-sequence',
  'valid-palindrome', 'two-sum-ii-input-array-is-sorted', '3sum', 'container-with-most-water', 'trapping-rain-water',
  'best-time-to-buy-and-sell-stock', 'longest-substring-without-repeating-characters',
  'longest-repeating-character-replacement', 'permutation-in-string', 'minimum-window-substring',
  'sliding-window-maximum', 'valid-parentheses', 'min-stack', 'evaluate-reverse-polish-notation',
  'generate-parentheses', 'daily-temperatures', 'car-fleet', 'largest-rectangle-in-histogram', 'binary-search',
  'search-a-2d-matrix', 'koko-eating-bananas', 'find-minimum-in-rotated-sorted-array',
  'search-in-rotated-sorted-array', 'time-based-key-value-store', 'median-of-two-sorted-arrays',
  'reverse-linked-list', 'merge-two-sorted-lists', 'reorder-list', 'remove-nth-node-from-end-of-list',
  'copy-list-with-random-pointer', 'add-two-numbers', 'linked-list-cycle', 'find-the-duplicate-number', 'lru-cache',
  'merge-k-sorted-lists', 'reverse-nodes-in-k-group', 'invert-binary-tree', 'maximum-depth-of-binary-tree',
  'diameter-of-binary-tree', 'balanced-binary-tree', 'same-tree', 'subtree-of-another-tree',
  'lowest-common-ancestor-of-a-binary-search-tree', 'binary-tree-level-order-traversal',
  'binary-tree-right-side-view', 'count-good-nodes-in-binary-tree', 'validate-binary-search-tree',
  'kth-smallest-element-in-a-bst', 'construct-binary-tree-from-preorder-and-inorder-traversal',
  'binary-tree-maximum-path-sum', 'serialize-and-deserialize-binary-tree', 'implement-trie-prefix-tree',
  'design-add-and-search-words-data-structure', 'word-search-ii', 'kth-largest-element-in-a-stream',
  'last-stone-weight', 'k-closest-points-to-origin', 'kth-largest-element-in-an-array', 'task-scheduler',
  'design-twitter', 'find-median-from-data-stream', 'subsets', 'combination-sum', 'permutations', 'subsets-ii',
  'combination-sum-ii', 'word-search', 'palindrome-partitioning', 'letter-combinations-of-a-phone-number',
  'n-queens', 'number-of-islands', 'clone-graph', 'max-area-of-island', 'pacific-atlantic-water-flow',
  'surrounded-regions', 'rotting-oranges', 'walls-and-gates', 'course-schedule', 'course-schedule-ii',
  'redundant-connection', 'number-of-connected-components-in-an-undirected-graph', 'graph-valid-tree', 'word-ladder',
  'reconstruct-itinerary', 'min-cost-to-connect-all-points', 'network-delay-time', 'swim-in-rising-water',
  'alien-dictionary', 'cheapest-flights-within-k-stops', 'climbing-stairs', 'min-cost-climbing-stairs',
  'house-robber', 'house-robber-ii', 'longest-palindromic-substring', 'palindromic-substrings', 'decode-ways',
  'coin-change', 'maximum-product-subarray', 'word-break', 'longest-increasing-subsequence',
  'partition-equal-subset-sum', 'unique-paths', 'longest-common-subsequence',
  'best-time-to-buy-and-sell-stock-with-cooldown', 'coin-change-ii', 'target-sum', 'interleaving-string',
  'longest-increasing-path-in-a-matrix', 'distinct-subsequences', 'edit-distance', 'burst-balloons',
  'regular-expression-matching', 'maximum-subarray', 'jump-game', 'jump-game-ii', 'gas-station', 'hand-of-straights',
  'merge-triplets-to-form-target-triplet', 'partition-labels', 'valid-parenthesis-string', 'insert-interval',
  'merge-intervals', 'non-overlapping-intervals', 'meeting-rooms', 'meeting-rooms-ii',
  'minimum-interval-to-include-each-query', 'rotate-image', 'spiral-matrix', 'set-matrix-zeroes', 'happy-number',
  'plus-one', 'powx-n', 'multiply-strings', 'detect-squares', 'single-number', 'number-of-1-bits', 'counting-bits',
  'reverse-bits', 'missing-number', 'sum-of-two-integers', 'reverse-integer',
];

/**
 * Problem id → [pattern ids (space separated, the main one first), core (1 or 0)].
 * Core problems decide "mastered" (spec §9.3). Every pattern has 1 to 3 core problems.
 */
const MAP = {
  // M1 Foundations
  'contains-duplicate': ['hashing', 1],

  // M2 Arrays & Strings
  'reverse-string': ['in-place-array', 1],
  'plus-one': ['in-place-array', 0],
  'missing-number': ['running-value', 0],
  'rotate-array': ['in-place-array', 1],
  'reverse-words-in-a-string': ['string-building', 1],
  'encode-and-decode-strings': ['string-building', 1],
  'best-time-to-buy-and-sell-stock': ['running-value', 1],
  'range-sum-query-immutable': ['prefix-sum', 1],
  'product-of-array-except-self': ['prefix-sum', 1],
  'maximum-subarray': ['kadane', 1],
  'maximum-sum-circular-subarray': ['kadane', 0],
  'maximum-product-subarray': ['kadane', 1],
  'next-permutation': ['in-place-array', 0],
  'spiral-matrix': ['grid-walk', 1],
  'rotate-image': ['grid-walk', 1],
  'set-matrix-zeroes': ['grid-walk', 0],

  // M3 Hashing
  'valid-anagram': ['counting', 1],
  'two-sum': ['partner-lookup', 1],
  'majority-element': ['counting', 0],
  'group-anagrams': ['group-by-key', 1],
  'top-k-frequent-elements': ['counting group-by-key', 1],
  'valid-sudoku': ['hashing', 0],
  'longest-consecutive-sequence': ['hashing', 1],
  'insert-delete-getrandom-o1': ['partner-lookup', 0],
  'detect-squares': ['counting', 0],
  'subarray-sum-equals-k': ['prefix-sum-map', 1],
  'contiguous-array': ['prefix-sum-map', 1],

  // M4 Two Pointers
  'valid-palindrome': ['opposite-pointers', 1],
  'valid-palindrome-ii': ['opposite-pointers', 0],
  'move-zeroes': ['same-direction-pointers', 1],
  'remove-duplicates-from-sorted-array': ['same-direction-pointers', 1],
  'merge-sorted-array': ['same-direction-pointers', 0],
  'two-sum-ii-input-array-is-sorted': ['opposite-pointers', 1],
  'container-with-most-water': ['opposite-pointers', 0],
  'palindromic-substrings': ['expand-center', 1],
  'longest-palindromic-substring': ['expand-center manacher', 1],
  'trapping-rain-water': ['opposite-pointers', 0],

  // M5 Sliding Window
  'maximum-average-subarray-i': ['fixed-window', 1],
  'find-all-anagrams-in-a-string': ['fixed-window', 1],
  'permutation-in-string': ['fixed-window', 1],
  'longest-substring-without-repeating-characters': ['variable-window', 1],
  'minimum-size-subarray-sum': ['variable-window', 1],
  'max-consecutive-ones-iii': ['variable-window', 0],
  'fruit-into-baskets': ['variable-window', 0],
  'longest-repeating-character-replacement': ['variable-window', 1],
  'subarrays-with-k-different-integers': ['exactly-k-window', 1],
  'minimum-window-substring': ['variable-window', 0],

  // M6 Recursion Basics
  '1-to-n-without-loop': ['base-case-recursion', 1],
  'sum-of-natural-numbers': ['base-case-recursion', 0],
  'factorial': ['base-case-recursion', 1],
  'pyramid-pattern': ['base-case-recursion', 0],
  'fibonacci-number': ['recursion-tree', 1],
  'tower-of-hanoi': ['recursion-tree', 1],
  'k-th-symbol-in-grammar': ['base-case-recursion', 0],
  'subsets': ['pick-not-pick', 1],
  'subset-sums': ['pick-not-pick', 1],

  // M7 Sorting
  'merge-sort': ['merge-sort', 1],
  'quick-sort': ['partition', 1],
  'sort-colors': ['partition', 1],
  'largest-number': ['custom-order', 1],
  '3sum': ['sort-then-scan opposite-pointers', 1],
  '4sum': ['sort-then-scan', 0],
  'count-inversions': ['merge-sort', 1],
  'count-of-smaller-numbers-after-self': ['merge-sort', 0],

  // M8 Binary Search
  'binary-search': ['binary-search', 1],
  'implement-lower-bound': ['bounds-search', 1],
  'implement-upper-bound': ['bounds-search', 0],
  'search-insert-position': ['bounds-search', 0],
  'floor-in-sorted-array': ['bounds-search', 0],
  'find-first-and-last-position-of-element-in-sorted-array': ['bounds-search', 1],
  'count-occurrences-in-sorted': ['bounds-search', 0],
  'search-in-rotated-sorted-array': ['rotated-search', 1],
  'search-in-rotated-sorted-array-ii': ['rotated-search', 0],
  'find-minimum-in-rotated-sorted-array': ['rotated-search', 1],
  'find-rotation-count': ['rotated-search', 0],
  'single-element-in-a-sorted-array': ['bounds-search', 0],
  'find-peak-element': ['binary-search', 1],
  'time-based-key-value-store': ['bounds-search', 0],
  'random-pick-with-weight': ['bounds-search prefix-sum', 0],
  'sqrtx': ['answer-search', 1],
  'nth-root-of-m': ['answer-search', 0],
  'koko-eating-bananas': ['answer-search', 1],
  'minimum-number-of-days-to-make-m-bouquets': ['answer-search', 0],
  'find-the-smallest-divisor-given-a-threshold': ['answer-search', 0],
  'capacity-to-ship-packages-within-d-days': ['answer-search', 1],
  'kth-missing-positive-number': ['bounds-search', 0],
  'aggressive-cows': ['answer-search', 0],
  'allocate-minimum-pages': ['answer-search', 0],
  'split-array-largest-sum': ['answer-search', 0],
  'painters-partition-problem': ['answer-search', 0],
  'minimize-max-distance-to-gas-station': ['answer-search', 0],
  'row-with-max-1s-in-rowwise-sorted': ['grid-search', 1],
  'search-a-2d-matrix': ['grid-search', 1],
  'search-a-2d-matrix-ii': ['grid-search', 0],
  'find-a-peak-element-ii': ['grid-search', 0],
  'median-of-two-sorted-arrays': ['cut-search', 1],
  'k-th-of-two-sorted-arrays': ['cut-search', 1],
  'median-in-a-row-wise-sorted-matrix': ['answer-search grid-search', 0],

  // M9 Stack & Queue
  'valid-parentheses': ['stack-matching', 1],
  'implement-queue-using-stacks': ['queue', 1],
  'min-stack': ['stack-process', 1],
  'evaluate-reverse-polish-notation': ['stack-process', 1],
  'decode-string': ['stack-process', 1],
  'asteroid-collision': ['stack-process', 0],
  'next-greater-element-i': ['monotonic-stack', 1],
  'daily-temperatures': ['monotonic-stack', 1],
  'online-stock-span': ['monotonic-stack', 0],
  'car-fleet': ['stack-process sort-then-scan', 0],
  'remove-k-digits': ['monotonic-stack', 0],
  'sum-of-subarray-minimums': ['monotonic-stack', 0],
  'largest-rectangle-in-histogram': ['monotonic-stack', 1],

  // M10 Linked List
  'reverse-linked-list': ['list-reverse', 1],
  'merge-two-sorted-lists': ['dummy-head', 1],
  'middle-of-the-linked-list': ['list-pointers', 1],
  'linked-list-cycle': ['list-pointers', 1],
  'linked-list-cycle-ii': ['list-pointers', 0],
  'find-the-duplicate-number': ['list-pointers', 1],
  'palindrome-linked-list': ['list-pointers list-reverse', 0],
  'intersection-of-two-linked-lists': ['list-pointers', 0],
  'remove-nth-node-from-end-of-list': ['list-pointers', 0],
  'odd-even-linked-list': ['dummy-head', 0],
  'add-two-numbers': ['dummy-head', 1],
  'reorder-list': ['list-pointers list-reverse', 0],
  'sort-list': ['merge-sort dummy-head', 0],
  'copy-list-with-random-pointer': ['list-design', 1],
  'lru-cache': ['list-design', 1],
  'merge-k-sorted-lists': ['dummy-head merge-sort', 0],
  'reverse-nodes-in-k-group': ['list-reverse', 1],

  // M11 Backtracking
  'combinations': ['backtracking', 1],
  'letter-combinations-of-a-phone-number': ['backtracking', 1],
  'generate-parentheses': ['prune-dedupe', 1],
  'combination-sum': ['backtracking', 1],
  'combination-sum-ii': ['prune-dedupe', 1],
  'subsets-ii': ['prune-dedupe', 1],
  'permutations': ['permutations', 1],
  'permutations-ii': ['permutations prune-dedupe', 0],
  'palindrome-partitioning': ['backtracking', 0],
  'word-search': ['board-backtracking', 1],
  'rat-in-maze': ['board-backtracking', 0],
  'permutation-sequence': ['permutations', 0],
  'm-coloring-problem': ['backtracking', 0],
  'partition-to-k-equal-sum-subsets': ['prune-dedupe', 0],
  'n-queens': ['board-backtracking', 1],
  'sudoku-solver': ['board-backtracking', 1],

  // M12 Trees
  'binary-tree-preorder-traversal': ['tree-dfs', 1],
  'binary-tree-inorder-traversal': ['tree-dfs morris', 1],
  'maximum-depth-of-binary-tree': ['bottom-up-tree', 1],
  'same-tree': ['tree-dfs', 1],
  'invert-binary-tree': ['tree-dfs', 0],
  'symmetric-tree': ['tree-dfs', 0],
  'subtree-of-another-tree': ['tree-dfs', 0],
  'balanced-binary-tree': ['bottom-up-tree', 1],
  'diameter-of-binary-tree': ['bottom-up-tree', 1],
  'binary-tree-level-order-traversal': ['tree-bfs', 1],
  'binary-tree-zigzag-level-order-traversal': ['tree-bfs', 1],
  'binary-tree-right-side-view': ['tree-views', 1],
  'top-view-of-binary-tree': ['tree-views', 1],
  'vertical-order-traversal-of-a-binary-tree': ['tree-views', 0],
  'maximum-width-of-binary-tree': ['tree-bfs', 0],
  'tree-boundary-traversal': ['tree-views', 0],
  'count-good-nodes-in-binary-tree': ['tree-dfs', 0],
  'lowest-common-ancestor-of-a-binary-tree': ['bottom-up-tree', 0],
  'all-nodes-distance-k-in-binary-tree': ['tree-bfs', 0],
  'construct-binary-tree-from-preorder-and-inorder-traversal': ['tree-build', 1],
  'lowest-common-ancestor-of-a-binary-search-tree': ['bst', 1],
  'validate-binary-search-tree': ['bst', 1],
  'kth-smallest-element-in-a-bst': ['bst', 1],
  'delete-node-in-a-bst': ['bst', 0],
  'binary-search-tree-iterator': ['bst', 0],
  'binary-tree-maximum-path-sum': ['bottom-up-tree', 0],
  'serialize-and-deserialize-binary-tree': ['tree-build', 1],

  // M13 Heap
  'kth-largest-element-in-a-stream': ['top-k', 1],
  'last-stone-weight': ['best-now', 1],
  'kth-largest-element-in-an-array': ['top-k quickselect', 1],
  'k-closest-points-to-origin': ['top-k', 1],
  'top-k-frequent-words': ['top-k counting', 0],
  'reorganize-string': ['best-now', 1],
  'task-scheduler': ['best-now', 1],
  'kth-smallest-element-in-a-sorted-matrix': ['k-way-merge', 1],
  'design-twitter': ['k-way-merge', 1],
  'ipo': ['best-now sort-then-scan', 0],
  'find-median-from-data-stream': ['two-heaps', 1],

  // M14 Tries
  'implement-trie-prefix-tree': ['trie', 1],
  'replace-words': ['trie', 0],
  'search-suggestions-system': ['trie', 1],
  'design-add-and-search-words-data-structure': ['trie-dfs', 1],
  'word-search-ii': ['trie-dfs', 1],

  // M15 Graphs
  'flood-fill': ['graph-dfs', 1],
  'number-of-islands': ['graph-dfs', 1],
  'max-area-of-island': ['graph-dfs', 1],
  'number-of-provinces': ['graph-dfs', 0],
  'number-of-connected-components-in-an-undirected-graph': ['graph-dfs union-find', 0],
  'clone-graph': ['graph-dfs', 0],
  'surrounded-regions': ['graph-dfs', 0],
  'pacific-atlantic-water-flow': ['graph-dfs', 0],
  'rotting-oranges': ['multi-source-bfs', 1],
  'walls-and-gates': ['multi-source-bfs', 1],
  '01-matrix': ['multi-source-bfs', 1],
  'word-ladder': ['graph-bfs', 1],
  'graph-valid-tree': ['union-find graph-dfs', 0],
  'course-schedule': ['topo-sort', 1],
  'course-schedule-ii': ['topo-sort', 1],
  'find-eventual-safe-states': ['topo-sort', 0],
  'alien-dictionary': ['topo-sort', 1],
  'redundant-connection': ['union-find', 1],
  'number-of-operations-to-make-network-connected': ['union-find', 1],
  'accounts-merge': ['union-find', 1],

  // M16 Advanced Graphs
  'network-delay-time': ['dijkstra', 1],
  'path-with-minimum-effort': ['dijkstra', 1],
  'swim-in-rising-water': ['dijkstra', 0],
  'number-of-ways-to-arrive-at-destination': ['dijkstra', 0],
  'cheapest-flights-within-k-stops': ['bellman-ford', 1],
  'bellman-ford': ['bellman-ford', 1],
  'find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance': ['floyd-warshall', 1],
  'min-cost-to-connect-all-points': ['mst', 1],

  // M17 1-D DP
  'climbing-stairs': ['step-dp', 1],
  'min-cost-climbing-stairs': ['step-dp', 1],
  'house-robber': ['take-or-skip', 1],
  'house-robber-ii': ['take-or-skip', 1],
  'delete-and-earn': ['take-or-skip', 0],
  'decode-ways': ['step-dp', 1],
  'coin-change': ['amount-dp', 1],
  'perfect-squares': ['amount-dp', 1],
  'combination-sum-iv': ['amount-dp', 0],
  'word-break': ['split-dp', 1],
  'longest-increasing-subsequence': ['lis', 1],
  'number-of-longest-increasing-subsequence': ['lis', 0],
  'longest-increasing-path-in-a-matrix': ['lis graph-dfs', 0],

  // M18 2-D DP
  'unique-paths': ['grid-dp', 1],
  'minimum-path-sum': ['grid-dp', 1],
  'triangle': ['grid-dp', 0],
  'maximal-square': ['grid-dp', 1],
  '0-1-knapsack-problem': ['knapsack', 1],
  'partition-equal-subset-sum': ['knapsack', 1],
  'count-subsets-with-sum': ['knapsack', 0],
  'target-sum': ['knapsack', 1],
  'knapsack-with-duplicate-items': ['unbounded-knapsack', 1],
  'coin-change-ii': ['unbounded-knapsack', 1],
  'longest-common-subsequence': ['two-string-dp', 1],
  'longest-palindromic-subsequence': ['two-string-dp', 0],
  'edit-distance': ['two-string-dp', 1],
  'interleaving-string': ['two-string-dp', 0],
  'distinct-subsequences': ['two-string-dp', 1],
  'wildcard-matching': ['two-string-dp', 0],
  'regular-expression-matching': ['two-string-dp', 0],
  'best-time-to-buy-and-sell-stock-ii': ['state-dp', 1],
  'best-time-to-buy-and-sell-stock-with-cooldown': ['state-dp', 1],
  'best-time-to-buy-and-sell-stock-with-transaction-fee': ['state-dp', 0],
  'best-time-to-buy-and-sell-stock-iv': ['state-dp', 1],

  // M19 Greedy & Intervals
  'assign-cookies': ['greedy', 1],
  'jump-game': ['reach', 1],
  'jump-game-ii': ['reach', 1],
  'gas-station': ['greedy', 1],
  'merge-triplets-to-form-target-triplet': ['greedy', 0],
  'partition-labels': ['greedy', 1],
  'hand-of-straights': ['greedy counting', 0],
  'valid-parenthesis-string': ['greedy', 0],
  'candy': ['greedy', 0],
  'meeting-rooms': ['merge-intervals', 1],
  'merge-intervals': ['merge-intervals', 1],
  'insert-interval': ['merge-intervals', 1],
  'interval-list-intersections': ['merge-intervals', 0],
  'non-overlapping-intervals': ['interval-scheduling', 1],
  'minimum-number-of-arrows-to-burst-balloons': ['interval-scheduling', 1],
  'meeting-rooms-ii': ['overlap-count sweep-line', 1],
  'car-pooling': ['overlap-count', 1],
  'minimum-interval-to-include-each-query': ['merge-intervals best-now', 0],

  // M20 Bits & Math
  'happy-number': ['digit-math hashing', 0],
  'reverse-integer': ['digit-math', 1],
  'multiply-strings': ['digit-math', 1],
  'greatest-common-divisor-of-strings': ['number-theory', 1],
  'count-primes': ['number-theory', 1],
  'powx-n': ['fast-power', 1],
  'power-of-two': ['bit-tricks', 1],
  'number-of-1-bits': ['bit-tricks', 1],
  'single-number': ['xor', 1],
  'counting-bits': ['bit-tricks', 0],
  'reverse-bits': ['bit-tricks', 1],
  'single-number-iii': ['xor', 1],
  'sum-of-two-integers': ['xor bit-tricks', 0],
  'divide-two-integers': ['bit-tricks', 0],
  'maximum-xor-of-two-numbers-in-an-array': ['xor trie', 0],

  // M21 Range Queries
  'range-sum-query-mutable': ['fenwick-tree segment-tree', 1],
  'range-minimum-query': ['segment-tree sparse-table', 1],
  'create-sorted-array-through-instructions': ['fenwick-tree', 1],
  'my-calendar-iii': ['segment-tree', 1],

  // M22 String Algorithms
  'find-the-index-of-the-first-occurrence-in-a-string': ['kmp', 1],
  'longest-happy-prefix': ['kmp', 1],
  'shortest-palindrome': ['kmp', 0],
  'sum-of-scores-of-built-strings': ['z-function', 1],
  'repeated-string-match': ['rolling-hash', 1],
  'longest-duplicate-substring': ['rolling-hash answer-search', 0],

  // M23 Advanced DP
  'russian-doll-envelopes': ['lis-fast', 1],
  'matrix-chain-multiplication': ['interval-dp', 1],
  'minimum-cost-to-cut-a-stick': ['interval-dp', 1],
  'burst-balloons': ['interval-dp', 1],
  'house-robber-iii': ['tree-dp', 1],
  'binary-tree-cameras': ['tree-dp', 1],
  'sum-of-distances-in-tree': ['tree-dp', 1],
  'can-i-win': ['bitmask-dp', 1],
  'shortest-path-visiting-all-nodes': ['bitmask-dp graph-bfs', 0],
  'numbers-at-most-n-given-digit-set': ['digit-dp', 1],
  'number-of-digit-one': ['digit-dp', 1],

  // M24 Graph Algorithms II
  'is-graph-bipartite': ['bipartite', 1],
  'possible-bipartition': ['bipartite', 1],
  'minimum-cost-to-make-at-least-one-valid-path-in-a-grid': ['zero-one-bfs', 1],
  'critical-connections-in-a-network': ['bridges', 1],
  'articulation-point': ['bridges', 1],
  'count-strongly-connected-components': ['scc', 1],
  'reconstruct-itinerary': ['euler-path', 1],
  'valid-arrangement-of-pairs': ['euler-path', 1],

  // M25 More Patterns
  'sliding-window-maximum': ['monotonic-deque', 1],
  'longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit': ['monotonic-deque', 1],
  'shortest-subarray-with-sum-at-least-k': ['monotonic-deque', 1],
  'my-calendar-i': ['treemap', 1],
  'the-skyline-problem': ['sweep-line', 1],
  'linked-list-random-node': ['reservoir', 1],
  'closest-subsequence-sum': ['meet-middle', 1],
};

const ROW = /^\| (\d+) \| (GfG|\d+) \| \[(.+?)\]\((\S+?)\) \| (Easy|Medium|Hard) \| ([^|]+?) \|/;
const LC_URL = /^https:\/\/leetcode\.com\/problems\/([a-z0-9-]+)\/$/;
const SOURCE_SHEET = { NC150: 'neetcode150', 'Striver-BS': 'striver-bs', 'Striver-Rec': 'striver-recursion' };

const kebab = (s) => s.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** "NC150, Striver-Rec #14, #15" → { neetcode150: [], 'striver-recursion': [14, 15] } */
function parseSource(source) {
  const out = {};
  let current = null;
  for (const raw of source.split(',')) {
    const token = raw.trim();
    if (token === 'Extra') continue;
    const name = Object.keys(SOURCE_SHEET).find((k) => token === k || token.startsWith(`${k} `));
    if (name) {
      current = SOURCE_SHEET[name];
      out[current] = [];
    } else if (!token.startsWith('#') || !current) {
      throw new Error(`Unknown source "${token}" in "${source}"`);
    }
    for (const m of token.matchAll(/#(\d+)/g)) out[current].push(Number(m[1]));
  }
  return out;
}

export function parseProblemMap(text) {
  const rows = [];
  let moduleNo = null;
  for (const line of text.split('\n')) {
    const heading = /^## M(\d+) /.exec(line);
    if (heading) { moduleNo = Number(heading[1]); continue; }
    const m = ROW.exec(line);
    if (!m || moduleNo === null) continue;
    const [, , lc, title, url, difficulty, source] = m;
    const slug = LC_URL.exec(url)?.[1];
    if (lc !== 'GfG' && !slug) throw new Error(`LeetCode row without a LeetCode link: ${title}`);
    rows.push({ id: slug ?? kebab(title), title, moduleId: MODULE_IDS[moduleNo], difficulty: difficulty.toLowerCase(), url, lc: lc === 'GfG' ? undefined : Number(lc), sources: parseSource(source) });
  }
  return rows;
}

export function buildCatalog(text) {
  const rows = parseProblemMap(text);
  const seen = new Set();
  for (const r of rows) {
    if (seen.has(r.id)) throw new Error(`Duplicate problem id: ${r.id}`);
    seen.add(r.id);
    if (!MAP[r.id]) throw new Error(`No pattern mapping for ${r.id}. Add it to MAP in scripts/build-catalog.mjs.`);
  }
  for (const id of Object.keys(MAP)) if (!seen.has(id)) throw new Error(`MAP lists ${id}, which is not in the problem map.`);
  const problems = rows.map((r) => ({
    id: r.id, title: r.title, moduleId: r.moduleId, difficulty: r.difficulty,
    patternIds: MAP[r.id][0].split(' '), sheets: Object.keys(r.sources), url: r.url, lc: r.lc, core: MAP[r.id][1] === 1,
  }));

  const nc = rows.filter((r) => r.sources.neetcode150).map((r) => r.id);
  const missing = nc.filter((id) => !NC150_ORDER.includes(id));
  const extra = NC150_ORDER.filter((id) => !nc.includes(id));
  if (missing.length || extra.length) throw new Error(`NeetCode 150 mismatch. Not in the order list: ${missing.join(', ')}. Not in the map: ${extra.join(', ')}`);

  // Striver order: the smallest #NN of each row. Rows that share a number keep the problem map's order.
  const striver = (sheet) => rows
    .map((r, index) => ({ id: r.id, index, n: r.sources[sheet] }))
    .filter((r) => r.n)
    .sort((a, b) => Math.min(...a.n) - Math.min(...b.n) || a.index - b.index)
    .map((r) => r.id);

  return { problems, sheets: { neetcode150: [...NC150_ORDER], 'striver-bs': striver('striver-bs'), 'striver-recursion': striver('striver-recursion') } };
}

const q = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const HEADER = '// Generated by scripts/build-catalog.mjs from docs/curriculum/problem-map.md. Do not edit by hand.\n';

function problemsFile(problems) {
  const line = (p) => `  { id: ${q(p.id)}, title: ${q(p.title)}, moduleId: ${q(p.moduleId)}, difficulty: ${q(p.difficulty)}, patternIds: [${p.patternIds.map(q).join(', ')}], sheets: [${p.sheets.map(q).join(', ')}], url: ${q(p.url)}, ${p.lc === undefined ? '' : `lc: ${p.lc}, `}core: ${p.core} },`;
  return `${HEADER}import type { CatalogProblem } from '../../src/content-types';\n\nexport const catalogProblems: CatalogProblem[] = [\n${problems.map(line).join('\n')}\n];\n`;
}

function sheetFile(name, ids) {
  return `${HEADER}export const ${name}: string[] = [\n${ids.map((id) => `  ${q(id)},`).join('\n')}\n];\n`;
}

/** Path (from the repo root) → file text. */
export function renderFiles(text) {
  const { problems, sheets } = buildCatalog(text);
  return {
    'content/catalog/problems.ts': problemsFile(problems),
    'content/sheets/neetcode150.ts': sheetFile('neetcode150', sheets.neetcode150),
    'content/sheets/striver-bs.ts': sheetFile('striverBs', sheets['striver-bs']),
    'content/sheets/striver-recursion.ts': sheetFile('striverRecursion', sheets['striver-recursion']),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = renderFiles(readFileSync(MAP_FILE, 'utf8'));
  if (process.argv.includes('--check')) {
    const stale = Object.entries(files).filter(([path, body]) => {
      try { return readFileSync(join(ROOT, path), 'utf8') !== body; } catch { return true; }
    });
    for (const [path] of stale) console.error(`out of date: ${path}`);
    if (stale.length) { console.error('Run: node scripts/build-catalog.mjs'); process.exit(1); }
    console.log('Catalog files match docs/curriculum/problem-map.md');
  } else {
    for (const [path, body] of Object.entries(files)) {
      mkdirSync(dirname(join(ROOT, path)), { recursive: true });
      writeFileSync(join(ROOT, path), body);
    }
    console.log(`Wrote ${Object.keys(files).length} files.`);
  }
}
