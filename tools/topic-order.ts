export interface TopicTerm {
  label: string;
  pattern: RegExp;
  /** curriculum module number that teaches it (spec §5) */
  module: number;
}

export const TOPIC_TERMS: TopicTerm[] = [
  { label: 'prefix sum', pattern: /\bprefix sums?\b/i, module: 2 },
  { label: 'two pointers', pattern: /\btwo[- ]pointers?\b/i, module: 4 },
  { label: 'sliding window', pattern: /\bsliding window\b/i, module: 5 },
  { label: 'recursion', pattern: /\brecursi(on|ve)\b/i, module: 6 },
  { label: 'sorting', pattern: /\b(sorting|merge sort|quick ?sort)\b/i, module: 7 },
  { label: 'binary search', pattern: /\bbinary search\b/i, module: 8 },
  { label: 'monotonic stack', pattern: /\bmonotonic (stack|queue|deque)\b/i, module: 9 },
  { label: 'linked list', pattern: /\blinked lists?\b/i, module: 10 },
  { label: 'backtracking', pattern: /\bbacktrack(ing)?\b/i, module: 11 },
  { label: 'binary tree', pattern: /\b(binary trees?|binary search trees?|BST)\b/i, module: 12 },
  { label: 'heap', pattern: /\b(heaps?|priority queues?)\b/i, module: 13 },
  { label: 'trie', pattern: /\btrie\b/i, module: 14 },
  { label: 'graph', pattern: /\b(graphs?|BFS|DFS|breadth-first|depth-first)\b/i, module: 15 },
  { label: 'topological sort', pattern: /\btopological\b/i, module: 15 },
  { label: 'union-find', pattern: /\b(union[- ]find|disjoint set)\b/i, module: 15 },
  { label: 'shortest path', pattern: /\b(dijkstra|bellman|shortest paths?|minimum spanning)\b/i, module: 16 },
  { label: 'dynamic programming', pattern: /\b(dynamic programming|memoi[sz]ation)\b/i, module: 17 },
  { label: 'greedy', pattern: /\bgreedy\b/i, module: 19 },
  { label: 'bit manipulation', pattern: /\b(bitmasks?|bit manipulation|XOR)\b/i, module: 20 },
  { label: 'segment tree', pattern: /\b(segment trees?|fenwick)\b/i, module: 21 },
  { label: 'string matching', pattern: /\b(KMP|rabin-karp|z-function)\b/i, module: 22 },
];
