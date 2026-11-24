# DSA Playbook — Problem Map

The full list of practice problems, module by module. Use it to check that nothing important is missing.

## How to read this

- Each problem appears **once**, in the first module where you have learned every idea it needs.
- `#` is the order to learn inside a module: easy first, and each one builds on the ones before.
- **LC** is the LeetCode number. **GfG** means the problem is on GeeksforGeeks only.
- **Source:** NC150 = NeetCode 150. Striver-BS = Striver binary search PDF. Striver-Rec = Striver recursion PDF. The `#` after Striver is the entry number in that PDF. Extra = not on those lists, but often asked.
- A row can have two sources (for example NC150 + Striver-BS). So in the summary, NC150 + Striver + Extra can add up to more than the total.
- **Notes** say when NeetCode files a problem under another topic, and where a later module shows a better way.
- **Revisit** lines point back to earlier problems to solve again with the new idea. They are not new rows.
- Difficulty is LeetCode's. For GfG it is GfG's ("Basic" is shown as Easy).

## Summary

| Module | Part | NC150 | Striver | Extra | Total |
|---|---|---|---|---|---|
| M1 Foundations | 1 | 1 | 0 | 0 | 1 |
| M2 Arrays & Strings | 2 | 10 | 1 | 5 | 16 |
| M3 Hashing | 2 | 7 | 0 | 4 | 11 |
| M4 Two Pointers | 3 | 6 | 1 | 4 | 10 |
| M5 Sliding Window | 3 | 4 | 0 | 6 | 10 |
| M6 Recursion Basics | 4 | 1 | 7 | 2 | 9 |
| M7 Sorting | 4 | 1 | 2 | 5 | 8 |
| M8 Binary Search | 5 | 7 | 32 | 1 | 34 |
| M9 Stack & Queue | 5 | 6 | 0 | 7 | 13 |
| M10 Linked List | 6 | 11 | 0 | 6 | 17 |
| M11 Backtracking | 6 | 9 | 10 | 3 | 16 |
| M12 Trees | 7 | 15 | 0 | 12 | 27 |
| M13 Heap | 7 | 7 | 0 | 4 | 11 |
| M14 Tries | 7 | 3 | 0 | 2 | 5 |
| M15 Graphs | 8 | 14 | 0 | 6 | 20 |
| M16 Advanced Graphs | 8 | 4 | 0 | 4 | 8 |
| M17 1-D DP | 9 | 9 | 0 | 4 | 13 |
| M18 2-D DP | 9 | 10 | 1 | 10 | 21 |
| M19 Greedy & Intervals | 10 | 13 | 0 | 5 | 18 |
| M20 Bits & Math | 10 | 9 | 0 | 6 | 15 |
| M21 Range Queries | 11 | 0 | 0 | 4 | 4 |
| M22 String Algorithms | 11 | 0 | 0 | 6 | 6 |
| M23 Advanced DP | 12 | 1 | 0 | 10 | 11 |
| M24 Graph Algorithms II | 12 | 1 | 0 | 7 | 8 |
| M25 More Patterns | 13 | 1 | 0 | 6 | 7 |
| M26 Interview & Meta | 14 | 0 | 0 | 0 | 0 |
| **All** | | **150** | **54** | **129** | **319** |

## M1 Foundations (Part 1)

**Teaches:** Big-O, reading the input limits, the Java toolkit, dry runs, and the brute → better → optimal method.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 217 | [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/) | Easy | NC150 | HashSet; brute → better → optimal | Model problem (already built). NeetCode: Arrays & Hashing. |

## M2 Arrays & Strings (Part 2)

**Teaches:** Walk and change arrays in place, keep a running best, prefix sums, Kadane, 2-D grids, and strings with StringBuilder.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 344 | [Reverse String](https://leetcode.com/problems/reverse-string/) | Easy | Striver-Rec #02, #04 | swap from both ends | Striver's "reverse an array". Redo it with recursion in M6. |
| 2 | 66 | [Plus One](https://leetcode.com/problems/plus-one/) | Easy | NC150 | carry from the right | NeetCode: Math & Geometry. |
| 3 | 268 | [Missing Number](https://leetcode.com/problems/missing-number/) | Easy | NC150 | sum formula | NeetCode: Bit Manipulation. M20 shows the XOR way. |
| 4 | 189 | [Rotate Array](https://leetcode.com/problems/rotate-array/) | Medium | Extra | reverse three times |  |
| 5 | 151 | [Reverse Words in a String](https://leetcode.com/problems/reverse-words-in-a-string/) | Medium | Extra | split, then rebuild with StringBuilder |  |
| 6 | 271 | [Encode and Decode Strings](https://leetcode.com/problems/encode-and-decode-strings/) | Medium | NC150 | length + '#' before each word | NeetCode: Arrays & Hashing. LC Premium. Free copy: [LintCode 659](https://www.lintcode.com/problem/659/). |
| 7 | 121 | [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) | Easy | NC150 | running min price | NeetCode: Sliding Window. One pass with the lowest price so far is enough. |
| 8 | 303 | [Range Sum Query - Immutable](https://leetcode.com/problems/range-sum-query-immutable/) | Easy | Extra | prefix sums |  |
| 9 | 238 | [Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self/) | Medium | NC150 | prefix and suffix products | NeetCode: Arrays & Hashing. |
| 10 | 53 | [Maximum Subarray](https://leetcode.com/problems/maximum-subarray/) | Medium | NC150 | Kadane | NeetCode: Greedy. |
| 11 | 918 | [Maximum Sum Circular Subarray](https://leetcode.com/problems/maximum-sum-circular-subarray/) | Medium | Extra | Kadane for max and for min |  |
| 12 | 152 | [Maximum Product Subarray](https://leetcode.com/problems/maximum-product-subarray/) | Medium | NC150 | Kadane, keep max and min | NeetCode: 1-D DP. A negative number swaps max and min. |
| 13 | 31 | [Next Permutation](https://leetcode.com/problems/next-permutation/) | Medium | Extra | find the dip, swap, reverse the tail |  |
| 14 | 54 | [Spiral Matrix](https://leetcode.com/problems/spiral-matrix/) | Medium | NC150 | shrink four borders | NeetCode: Math & Geometry. |
| 15 | 48 | [Rotate Image](https://leetcode.com/problems/rotate-image/) | Medium | NC150 | transpose, then reverse each row | NeetCode: Math & Geometry. |
| 16 | 73 | [Set Matrix Zeroes](https://leetcode.com/problems/set-matrix-zeroes/) | Medium | NC150 | first row and column as markers | NeetCode: Math & Geometry. |

## M3 Hashing (Part 2)

**Teaches:** HashSet to remember what you saw, HashMap to count and group, and prefix sum + HashMap.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 242 | [Valid Anagram](https://leetcode.com/problems/valid-anagram/) | Easy | NC150 | count letters (int[26]) |  |
| 2 | 1 | [Two Sum](https://leetcode.com/problems/two-sum/) | Easy | NC150 | HashMap value → index; look up the partner |  |
| 3 | 169 | [Majority Element](https://leetcode.com/problems/majority-element/) | Easy | Extra | count; then Boyer-Moore voting | Voting is the O(1)-space follow-up, explained on the spot. |
| 4 | 49 | [Group Anagrams](https://leetcode.com/problems/group-anagrams/) | Medium | NC150 | group by a key |  |
| 5 | 347 | [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/) | Medium | NC150 | count + buckets by frequency | M13 adds the heap way. |
| 6 | 36 | [Valid Sudoku](https://leetcode.com/problems/valid-sudoku/) | Medium | NC150 | a HashSet per row, column and box |  |
| 7 | 128 | [Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence/) | Medium | NC150 | HashSet; start only at the first number of a run |  |
| 8 | 380 | [Insert Delete GetRandom O(1)](https://leetcode.com/problems/insert-delete-getrandom-o1/) | Medium | Extra | HashMap + ArrayList; swap with last to delete |  |
| 9 | 2013 | [Detect Squares](https://leetcode.com/problems/detect-squares/) | Medium | NC150 | HashMap of point counts | NeetCode: Math & Geometry. Only needs a HashMap. |
| 10 | 560 | [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/) | Medium | Extra | prefix sum + HashMap of counts | Trap: looks like sliding window, but negative numbers break it. |
| 11 | 525 | [Contiguous Array](https://leetcode.com/problems/contiguous-array/) | Medium | Extra | prefix sum + first index seen | Turn each 0 into -1 first. |

## M4 Two Pointers (Part 3)

**Teaches:** Two indexes that move toward each other or the same way, and expand-from-the-center.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 125 | [Valid Palindrome](https://leetcode.com/problems/valid-palindrome/) | Easy | NC150, Striver-Rec #02 | two ends, skip non-letters | Striver checks a palindrome with recursion. Redo it that way in M6. |
| 2 | 680 | [Valid Palindrome II](https://leetcode.com/problems/valid-palindrome-ii/) | Easy | Extra | two ends; one skip allowed |  |
| 3 | 283 | [Move Zeroes](https://leetcode.com/problems/move-zeroes/) | Easy | Extra | read and write pointers |  |
| 4 | 26 | [Remove Duplicates from Sorted Array](https://leetcode.com/problems/remove-duplicates-from-sorted-array/) | Easy | Extra | read and write pointers |  |
| 5 | 88 | [Merge Sorted Array](https://leetcode.com/problems/merge-sorted-array/) | Easy | Extra | fill from the back |  |
| 6 | 167 | [Two Sum II - Input Array Is Sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/) | Medium | NC150 | two ends; move by the sum |  |
| 7 | 11 | [Container With Most Water](https://leetcode.com/problems/container-with-most-water/) | Medium | NC150 | two ends; move the shorter side |  |
| 8 | 647 | [Palindromic Substrings](https://leetcode.com/problems/palindromic-substrings/) | Medium | NC150 | expand from each center | NeetCode: 1-D DP. |
| 9 | 5 | [Longest Palindromic Substring](https://leetcode.com/problems/longest-palindromic-substring/) | Medium | NC150 | expand from each center | NeetCode: 1-D DP. Manacher (M22) does it in O(n). |
| 10 | 42 | [Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water/) | Hard | NC150 | two ends with left max and right max | Also: prefix max arrays (M2) or a stack (M9). |

## M5 Sliding Window (Part 3)

**Teaches:** A fixed window, or a window that grows and shrinks, over a subarray or substring, often with counts.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 643 | [Maximum Average Subarray I](https://leetcode.com/problems/maximum-average-subarray-i/) | Easy | Extra | fixed window |  |
| 2 | 438 | [Find All Anagrams in a String](https://leetcode.com/problems/find-all-anagrams-in-a-string/) | Medium | Extra | fixed window + letter counts |  |
| 3 | 567 | [Permutation in String](https://leetcode.com/problems/permutation-in-string/) | Medium | NC150 | fixed window + letter counts |  |
| 4 | 3 | [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) | Medium | NC150 | grow and shrink + a set |  |
| 5 | 209 | [Minimum Size Subarray Sum](https://leetcode.com/problems/minimum-size-subarray-sum/) | Medium | Extra | shrink while sum ≥ target | Works because all numbers are positive. |
| 6 | 1004 | [Max Consecutive Ones III](https://leetcode.com/problems/max-consecutive-ones-iii/) | Medium | Extra | window with at most k zeros |  |
| 7 | 904 | [Fruit Into Baskets](https://leetcode.com/problems/fruit-into-baskets/) | Medium | Extra | window with at most 2 kinds |  |
| 8 | 424 | [Longest Repeating Character Replacement](https://leetcode.com/problems/longest-repeating-character-replacement/) | Medium | NC150 | window size − top count ≤ k |  |
| 9 | 992 | [Subarrays with K Different Integers](https://leetcode.com/problems/subarrays-with-k-different-integers/) | Hard | Extra | exactly K = atMost(K) − atMost(K−1) |  |
| 10 | 76 | [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/) | Hard | NC150 | shrink while all needed letters are inside |  |

**Note:** Sliding Window Maximum (LC 239) is NeetCode's 6th window problem. It needs a monotonic deque, so it lives in M25.

## M6 Recursion Basics (Part 4)

**Teaches:** Base case, the call stack, recursion trees, and pick / not-pick to list subsets. Memo is only a preview here.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | GfG | [1 to n Without Loop](https://www.geeksforgeeks.org/problems/print-1-to-n-without-using-loops-1587115620/1) | Easy | Striver-Rec #01 | base case + call stack | Also print n to 1 ([GfG](https://www.geeksforgeeks.org/problems/print-n-to-1-without-loop/1)) and a name n times ([GfG](https://www.geeksforgeeks.org/problems/print-gfg-n-times/1)): print before vs after the call. |
| 2 | GfG | [Sum of Natural Numbers](https://www.geeksforgeeks.org/problems/sum-of-series2811/1) | Easy | Striver-Rec #02 | return n + f(n−1) |  |
| 3 | GfG | [Factorial](https://www.geeksforgeeks.org/problems/factorial5739/1) | Easy | Striver-Rec #02, #03 | parameter style vs return style |  |
| 4 | GfG | [Pyramid Pattern](https://www.geeksforgeeks.org/problems/triangle-pattern-1661492263/1) | Easy | Striver-Rec #07 | one call per row, no loops | Striver: "all kinds of patterns". Print it with recursion only. |
| 5 | 509 | [Fibonacci Number](https://leetcode.com/problems/fibonacci-number/) | Easy | Striver-Rec #04, #05 | two calls → recursion tree | Memo is a preview here. Full DP in M17. |
| 6 | GfG | [Tower Of Hanoi](https://www.geeksforgeeks.org/problems/tower-of-hanoi-1587115621/1) | Medium | Extra | trust the smaller call |  |
| 7 | 779 | [K-th Symbol in Grammar](https://leetcode.com/problems/k-th-symbol-in-grammar/) | Medium | Extra | answer for n from the answer for n−1 |  |
| 8 | 78 | [Subsets](https://leetcode.com/problems/subsets/) | Medium | NC150, Striver-Rec #06 | pick / not-pick | NeetCode: Backtracking. Striver: "print all subsequences". His #06 also counts subsets with sum K: see M18. |
| 9 | GfG | [Subset Sums](https://www.geeksforgeeks.org/problems/subset-sums2234/1) | Medium | Striver-Rec #12 | pick / not-pick, collect sums |  |

**Revisit:** Reverse String (LC 344, M2) and Valid Palindrome (LC 125, M4): solve them again with recursion (Striver-Rec #02, #04).

## M7 Sorting (Part 4)

**Teaches:** Merge sort, quick sort, partition (Dutch flag), custom order, and "sort first, then scan".

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | GfG | [Merge Sort](https://www.geeksforgeeks.org/problems/merge-sort/1) | Medium | Striver-Rec #08 | split, sort halves, merge | Test it on LC 912 Sort an Array too. |
| 2 | GfG | [Quick Sort](https://www.geeksforgeeks.org/problems/quick-sort/1) | Medium | Striver-Rec #09 | partition around a pivot |  |
| 3 | 75 | [Sort Colors](https://leetcode.com/problems/sort-colors/) | Medium | Extra | Dutch flag: three pointers |  |
| 4 | 179 | [Largest Number](https://leetcode.com/problems/largest-number/) | Medium | Extra | custom comparator (a+b vs b+a) |  |
| 5 | 15 | [3Sum](https://leetcode.com/problems/3sum/) | Medium | NC150 | sort, fix one, two pointers | NeetCode: Two Pointers. Needs sort first (M7) + two pointers (M4). |
| 6 | 18 | [4Sum](https://leetcode.com/problems/4sum/) | Medium | Extra | sort, fix two, two pointers |  |
| 7 | GfG | [Count Inversions](https://www.geeksforgeeks.org/problems/inversion-of-array-1587115620/1) | Medium | Extra | count while merging |  |
| 8 | 315 | [Count of Smaller Numbers After Self](https://leetcode.com/problems/count-of-smaller-numbers-after-self/) | Hard | Extra | merge sort that tracks indexes | M21 shows the Fenwick tree way. |

## M8 Binary Search (Part 5)

**Teaches:** Search a sorted space: exact value, first or last true, rotated arrays, search on the answer, and 2-D grids.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 704 | [Binary Search](https://leetcode.com/problems/binary-search/) | Easy | NC150, Striver-BS #01 | exact match |  |
| 2 | GfG | [Implement Lower Bound](https://www.geeksforgeeks.org/problems/implement-lower-bound/1) | Easy | Striver-BS #02 | first index with a[i] ≥ x |  |
| 3 | GfG | [Implement Upper Bound](https://www.geeksforgeeks.org/problems/implement-upper-bound/1) | Easy | Striver-BS #03 | first index with a[i] > x |  |
| 4 | 35 | [Search Insert Position](https://leetcode.com/problems/search-insert-position/) | Easy | Striver-BS #04 | lower bound |  |
| 5 | GfG | [Floor in Sorted Array](https://www.geeksforgeeks.org/problems/floor-in-a-sorted-array-1587115620/1) | Easy | Striver-BS #05 | last ≤ x, first ≥ x | Do the ceil too: [Ceil in Sorted Array](https://www.geeksforgeeks.org/problems/ceil-in-a-sorted-array/1). |
| 6 | 34 | [Find First and Last Position of Element in Sorted Array](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/) | Medium | Striver-BS #06 | lower bound + upper bound |  |
| 7 | GfG | [Count Occurrences in Sorted](https://www.geeksforgeeks.org/problems/number-of-occurrence2259/1) | Medium | Striver-BS #07 | last − first + 1 |  |
| 8 | 33 | [Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array/) | Medium | NC150, Striver-BS #08 | one half is always sorted |  |
| 9 | 81 | [Search in Rotated Sorted Array II](https://leetcode.com/problems/search-in-rotated-sorted-array-ii/) | Medium | Striver-BS #09 | same, but trim ends on duplicates |  |
| 10 | 153 | [Find Minimum in Rotated Sorted Array](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/) | Medium | NC150, Striver-BS #10 | compare middle with the right end |  |
| 11 | GfG | [Find Rotation Count](https://www.geeksforgeeks.org/problems/rotation4723/1) | Easy | Striver-BS #11 | index of the minimum |  |
| 12 | 540 | [Single Element in a Sorted Array](https://leetcode.com/problems/single-element-in-a-sorted-array/) | Medium | Striver-BS #12 | pairs: even / odd index |  |
| 13 | 162 | [Find Peak Element](https://leetcode.com/problems/find-peak-element/) | Medium | Striver-BS #13 | walk toward the higher side |  |
| 14 | 981 | [Time Based Key-Value Store](https://leetcode.com/problems/time-based-key-value-store/) | Medium | NC150 | HashMap + last time ≤ t |  |
| 15 | 528 | [Random Pick with Weight](https://leetcode.com/problems/random-pick-with-weight/) | Medium | Extra | prefix sums + lower bound |  |
| 16 | 69 | [Sqrt(x)](https://leetcode.com/problems/sqrtx/) | Easy | Striver-BS #14 | last x with x·x ≤ n |  |
| 17 | GfG | [Nth Root of M](https://www.geeksforgeeks.org/problems/find-nth-root-of-m5843/1) | Medium | Striver-BS #15 | search the answer; stop early on overflow |  |
| 18 | 875 | [Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/) | Medium | NC150, Striver-BS #16 | search the answer: lowest speed |  |
| 19 | 1482 | [Minimum Number of Days to Make m Bouquets](https://leetcode.com/problems/minimum-number-of-days-to-make-m-bouquets/) | Medium | Striver-BS #17 | search the answer: earliest day |  |
| 20 | 1283 | [Find the Smallest Divisor Given a Threshold](https://leetcode.com/problems/find-the-smallest-divisor-given-a-threshold/) | Medium | Striver-BS #18 | search the answer: smallest divisor |  |
| 21 | 1011 | [Capacity To Ship Packages Within D Days](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/) | Medium | Striver-BS #19 | search the answer: smallest capacity |  |
| 22 | 1539 | [Kth Missing Positive Number](https://leetcode.com/problems/kth-missing-positive-number/) | Easy | Striver-BS #20 | missing count = a[i] − (i+1) |  |
| 23 | GfG | [Aggressive Cows](https://www.geeksforgeeks.org/problems/aggressive-cows/1) | Medium | Striver-BS #21 | search the answer: max of the min gap | LeetCode twin: LC 1552. |
| 24 | GfG | [Allocate Minimum Pages](https://www.geeksforgeeks.org/problems/allocate-minimum-number-of-pages0937/1) | Medium | Striver-BS #22 | search the answer: min of the max | Striver: Book Allocation. |
| 25 | 410 | [Split Array Largest Sum](https://leetcode.com/problems/split-array-largest-sum/) | Hard | Striver-BS #23 | same as book allocation |  |
| 26 | GfG | [Painter's Partition Problem](https://www.geeksforgeeks.org/problems/the-painters-partition-problem1535/1) | Hard | Striver-BS #24 | same as book allocation |  |
| 27 | 774 | [Minimize Max Distance to Gas Station](https://leetcode.com/problems/minimize-max-distance-to-gas-station/) | Hard | Striver-BS #25 | search on a decimal answer | LC Premium. Free copy: [GfG](https://www.geeksforgeeks.org/problems/minimize-max-distance-to-gas-station/1). |
| 28 | GfG | [Row with Max 1s in Rowwise Sorted](https://www.geeksforgeeks.org/problems/row-with-max-1s0023/1) | Medium | Striver-BS #28 | lower bound of 1 in each row |  |
| 29 | 74 | [Search a 2D Matrix](https://leetcode.com/problems/search-a-2d-matrix/) | Medium | NC150, Striver-BS #29 | treat the grid as one sorted list |  |
| 30 | 240 | [Search a 2D Matrix II](https://leetcode.com/problems/search-a-2d-matrix-ii/) | Medium | Striver-BS #30 | start top-right; drop a row or a column | Not binary search, but Striver lists it here. |
| 31 | 1901 | [Find a Peak Element II](https://leetcode.com/problems/find-a-peak-element-ii/) | Medium | Striver-BS #31 | binary search on columns |  |
| 32 | 4 | [Median of Two Sorted Arrays](https://leetcode.com/problems/median-of-two-sorted-arrays/) | Hard | NC150, Striver-BS #26 | binary search the cut in the smaller array |  |
| 33 | GfG | [K-th of Two Sorted Arrays](https://www.geeksforgeeks.org/problems/k-th-element-of-two-sorted-array1317/1) | Medium | Striver-BS #27 | same cut idea, for the k-th |  |
| 34 | GfG | [Median in a Row-Wise Sorted Matrix](https://www.geeksforgeeks.org/problems/median-in-a-row-wise-sorted-matrix1527/1) | Medium | Striver-BS #32 | search the value; count how many ≤ mid |  |

## M9 Stack & Queue (Part 5)

**Teaches:** Stacks for matching and undo, queues, and the monotonic stack (next greater or smaller).

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 20 | [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/) | Easy | NC150 | stack of open brackets |  |
| 2 | 232 | [Implement Queue using Stacks](https://leetcode.com/problems/implement-queue-using-stacks/) | Easy | Extra | two stacks |  |
| 3 | 155 | [Min Stack](https://leetcode.com/problems/min-stack/) | Medium | NC150 | keep the min with each item |  |
| 4 | 150 | [Evaluate Reverse Polish Notation](https://leetcode.com/problems/evaluate-reverse-polish-notation/) | Medium | NC150 | stack of numbers |  |
| 5 | 394 | [Decode String](https://leetcode.com/problems/decode-string/) | Medium | Extra | stack of counts and strings |  |
| 6 | 735 | [Asteroid Collision](https://leetcode.com/problems/asteroid-collision/) | Medium | Extra | stack; settle each crash |  |
| 7 | 496 | [Next Greater Element I](https://leetcode.com/problems/next-greater-element-i/) | Easy | Extra | monotonic stack |  |
| 8 | 739 | [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/) | Medium | NC150 | monotonic stack of indexes |  |
| 9 | 901 | [Online Stock Span](https://leetcode.com/problems/online-stock-span/) | Medium | Extra | monotonic stack with spans |  |
| 10 | 853 | [Car Fleet](https://leetcode.com/problems/car-fleet/) | Medium | NC150 | sort by position, then a stack of arrival times | Needs sorting (M7) + a stack. |
| 11 | 402 | [Remove K Digits](https://leetcode.com/problems/remove-k-digits/) | Medium | Extra | increasing stack; pop bigger digits |  |
| 12 | 907 | [Sum of Subarray Minimums](https://leetcode.com/problems/sum-of-subarray-minimums/) | Medium | Extra | previous / next smaller → count |  |
| 13 | 84 | [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/) | Hard | NC150 | previous / next smaller bar |  |

**Revisit:** Trapping Rain Water (LC 42, M4): solve it again with a stack.

## M10 Linked List (Part 6)

**Teaches:** Pointer moves: reverse, merge, fast and slow, dummy head, and designs that mix a list with a HashMap.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 206 | [Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/) | Easy | NC150 | prev / cur / next |  |
| 2 | 21 | [Merge Two Sorted Lists](https://leetcode.com/problems/merge-two-sorted-lists/) | Easy | NC150 | dummy head |  |
| 3 | 876 | [Middle of the Linked List](https://leetcode.com/problems/middle-of-the-linked-list/) | Easy | Extra | fast and slow |  |
| 4 | 141 | [Linked List Cycle](https://leetcode.com/problems/linked-list-cycle/) | Easy | NC150 | fast and slow |  |
| 5 | 142 | [Linked List Cycle II](https://leetcode.com/problems/linked-list-cycle-ii/) | Medium | Extra | fast and slow, then find the start |  |
| 6 | 287 | [Find the Duplicate Number](https://leetcode.com/problems/find-the-duplicate-number/) | Medium | NC150 | fast and slow on index links | Binary search on the value (M8) also works. |
| 7 | 234 | [Palindrome Linked List](https://leetcode.com/problems/palindrome-linked-list/) | Easy | Extra | middle + reverse half |  |
| 8 | 160 | [Intersection of Two Linked Lists](https://leetcode.com/problems/intersection-of-two-linked-lists/) | Easy | Extra | switch heads at the end |  |
| 9 | 19 | [Remove Nth Node From End of List](https://leetcode.com/problems/remove-nth-node-from-end-of-list/) | Medium | NC150 | gap of n between two pointers |  |
| 10 | 328 | [Odd Even Linked List](https://leetcode.com/problems/odd-even-linked-list/) | Medium | Extra | two chains, then join |  |
| 11 | 2 | [Add Two Numbers](https://leetcode.com/problems/add-two-numbers/) | Medium | NC150 | walk both lists with a carry |  |
| 12 | 143 | [Reorder List](https://leetcode.com/problems/reorder-list/) | Medium | NC150 | middle + reverse + merge |  |
| 13 | 148 | [Sort List](https://leetcode.com/problems/sort-list/) | Medium | Extra | merge sort on a list | Uses merge sort from M7. |
| 14 | 138 | [Copy List with Random Pointer](https://leetcode.com/problems/copy-list-with-random-pointer/) | Medium | NC150 | HashMap old → new (or weave copies) |  |
| 15 | 146 | [LRU Cache](https://leetcode.com/problems/lru-cache/) | Medium | NC150 | HashMap + doubly linked list |  |
| 16 | 23 | [Merge k Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/) | Hard | NC150 | merge in pairs (divide and conquer) | M13 adds the heap way. |
| 17 | 25 | [Reverse Nodes in k-Group](https://leetcode.com/problems/reverse-nodes-in-k-group/) | Hard | NC150 | reverse k at a time |  |

## M11 Backtracking (Part 6)

**Teaches:** Choose, explore, undo. Prune bad paths, skip duplicates, build permutations, fill boards and walk grids.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 77 | [Combinations](https://leetcode.com/problems/combinations/) | Medium | Extra | choose, explore, undo |  |
| 2 | 17 | [Letter Combinations of a Phone Number](https://leetcode.com/problems/letter-combinations-of-a-phone-number/) | Medium | NC150 | one level per digit |  |
| 3 | 22 | [Generate Parentheses](https://leetcode.com/problems/generate-parentheses/) | Medium | NC150 | add '(' or ')' only when allowed | Official NeetCode: Stack. The PDF lists it under Backtracking. |
| 4 | 39 | [Combination Sum](https://leetcode.com/problems/combination-sum/) | Medium | NC150, Striver-Rec #10 | reuse allowed: stay on the same index |  |
| 5 | 40 | [Combination Sum II](https://leetcode.com/problems/combination-sum-ii/) | Medium | NC150, Striver-Rec #11 | sort; skip the same value at the same level |  |
| 6 | 90 | [Subsets II](https://leetcode.com/problems/subsets-ii/) | Medium | NC150, Striver-Rec #13 | sort; skip duplicates | Striver: "Subset Sum II". |
| 7 | 46 | [Permutations](https://leetcode.com/problems/permutations/) | Medium | NC150, Striver-Rec #14, #15 | used[] array, or swap in place | Striver #14 uses used[]; #15 swaps. |
| 8 | 47 | [Permutations II](https://leetcode.com/problems/permutations-ii/) | Medium | Extra | sort + used[] + skip duplicates |  |
| 9 | 131 | [Palindrome Partitioning](https://leetcode.com/problems/palindrome-partitioning/) | Medium | NC150, Striver-Rec #19 | cut a palindrome prefix, recurse |  |
| 10 | 79 | [Word Search](https://leetcode.com/problems/word-search/) | Medium | NC150 | grid DFS; mark, then unmark |  |
| 11 | GfG | [Rat in Maze](https://www.geeksforgeeks.org/problems/rat-in-a-maze-problem/1) | Medium | Striver-Rec #21 | grid paths; mark, then unmark |  |
| 12 | 60 | [Permutation Sequence](https://leetcode.com/problems/permutation-sequence/) | Hard | Striver-Rec #20 | factorial blocks pick each digit | No need to list all permutations. |
| 13 | GfG | [M-Coloring Problem](https://www.geeksforgeeks.org/problems/m-coloring-problem-1587115620/1) | Medium | Striver-Rec #18 | try each color; check neighbors | The graph is just a neighbor list here, explained on the spot. Graphs come in M15. |
| 14 | 698 | [Partition to K Equal Sum Subsets](https://leetcode.com/problems/partition-to-k-equal-sum-subsets/) | Medium | Extra | fill k buckets; prune hard | M23 shows the bitmask DP way. |
| 15 | 51 | [N-Queens](https://leetcode.com/problems/n-queens/) | Hard | NC150, Striver-Rec #16 | one queen per row; sets for columns and diagonals |  |
| 16 | 37 | [Sudoku Solver](https://leetcode.com/problems/sudoku-solver/) | Hard | Striver-Rec #17 | try 1–9 in each empty cell |  |

## M12 Trees (Part 7)

**Teaches:** DFS (pre, in, post order), BFS by level, views, paths, building trees, and BST rules.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 144 | [Binary Tree Preorder Traversal](https://leetcode.com/problems/binary-tree-preorder-traversal/) | Easy | Extra | DFS; then with your own stack |  |
| 2 | 94 | [Binary Tree Inorder Traversal](https://leetcode.com/problems/binary-tree-inorder-traversal/) | Easy | Extra | DFS; then with your own stack | M25 adds Morris (O(1) space). |
| 3 | 104 | [Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/) | Easy | NC150 | height from the children |  |
| 4 | 100 | [Same Tree](https://leetcode.com/problems/same-tree/) | Easy | NC150 | walk two trees together |  |
| 5 | 226 | [Invert Binary Tree](https://leetcode.com/problems/invert-binary-tree/) | Easy | NC150 | swap children |  |
| 6 | 101 | [Symmetric Tree](https://leetcode.com/problems/symmetric-tree/) | Easy | Extra | compare left with mirrored right |  |
| 7 | 572 | [Subtree of Another Tree](https://leetcode.com/problems/subtree-of-another-tree/) | Easy | NC150 | same-tree check at each node |  |
| 8 | 110 | [Balanced Binary Tree](https://leetcode.com/problems/balanced-binary-tree/) | Easy | NC150 | height, or -1 if not balanced |  |
| 9 | 543 | [Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree/) | Easy | NC150 | height up, best answer in a variable |  |
| 10 | 102 | [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/) | Medium | NC150 | BFS by level |  |
| 11 | 103 | [Binary Tree Zigzag Level Order Traversal](https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/) | Medium | Extra | BFS; flip direction each level |  |
| 12 | 199 | [Binary Tree Right Side View](https://leetcode.com/problems/binary-tree-right-side-view/) | Medium | NC150 | last node of each level |  |
| 13 | GfG | [Top View of Binary Tree](https://www.geeksforgeeks.org/problems/top-view-of-binary-tree/1) | Medium | Extra | BFS with column numbers |  |
| 14 | 987 | [Vertical Order Traversal of a Binary Tree](https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree/) | Hard | Extra | (column, row, value), then sort |  |
| 15 | 662 | [Maximum Width of Binary Tree](https://leetcode.com/problems/maximum-width-of-binary-tree/) | Medium | Extra | BFS with position numbers |  |
| 16 | GfG | [Tree Boundary Traversal](https://www.geeksforgeeks.org/problems/boundary-traversal-of-binary-tree/1) | Medium | Extra | left edge + leaves + right edge |  |
| 17 | 1448 | [Count Good Nodes in Binary Tree](https://leetcode.com/problems/count-good-nodes-in-binary-tree/) | Medium | NC150 | pass the max so far down |  |
| 18 | 236 | [Lowest Common Ancestor of a Binary Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/) | Medium | Extra | return what each side found |  |
| 19 | 863 | [All Nodes Distance K in Binary Tree](https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/) | Medium | Extra | parent map + BFS |  |
| 20 | 105 | [Construct Binary Tree from Preorder and Inorder Traversal](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/) | Medium | NC150 | root from preorder; split by inorder index |  |
| 21 | 235 | [Lowest Common Ancestor of a Binary Search Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/) | Medium | NC150 | BST: go left or right by value |  |
| 22 | 98 | [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/) | Medium | NC150 | pass (min, max) limits down |  |
| 23 | 230 | [Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/) | Medium | NC150 | inorder of a BST is sorted |  |
| 24 | 450 | [Delete Node in a BST](https://leetcode.com/problems/delete-node-in-a-bst/) | Medium | Extra | replace with the inorder successor |  |
| 25 | 173 | [Binary Search Tree Iterator](https://leetcode.com/problems/binary-search-tree-iterator/) | Medium | Extra | inorder with a stack, one step at a time |  |
| 26 | 124 | [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/) | Hard | NC150 | gain up, best path in a variable | A tree DP. M23 goes further. |
| 27 | 297 | [Serialize and Deserialize Binary Tree](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/) | Hard | NC150 | preorder with null markers |  |

## M13 Heap (Part 7)

**Teaches:** PriorityQueue for top K, merging k sorted lists, two heaps for a median, and "take the best now".

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 703 | [Kth Largest Element in a Stream](https://leetcode.com/problems/kth-largest-element-in-a-stream/) | Easy | NC150 | min-heap of size k |  |
| 2 | 1046 | [Last Stone Weight](https://leetcode.com/problems/last-stone-weight/) | Easy | NC150 | max-heap |  |
| 3 | 215 | [Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/) | Medium | NC150 | min-heap of size k | M25 shows quickselect. |
| 4 | 973 | [K Closest Points to Origin](https://leetcode.com/problems/k-closest-points-to-origin/) | Medium | NC150 | max-heap of size k |  |
| 5 | 692 | [Top K Frequent Words](https://leetcode.com/problems/top-k-frequent-words/) | Medium | Extra | count + heap with a tie rule |  |
| 6 | 767 | [Reorganize String](https://leetcode.com/problems/reorganize-string/) | Medium | Extra | max-heap; place the most common letter next |  |
| 7 | 621 | [Task Scheduler](https://leetcode.com/problems/task-scheduler/) | Medium | NC150 | max-heap + cooldown queue | A counting formula also works. |
| 8 | 378 | [Kth Smallest Element in a Sorted Matrix](https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/) | Medium | Extra | k-way merge with a min-heap | Binary search on the value (M8) also works. |
| 9 | 355 | [Design Twitter](https://leetcode.com/problems/design-twitter/) | Medium | NC150 | merge k feeds with a heap |  |
| 10 | 502 | [IPO](https://leetcode.com/problems/ipo/) | Hard | Extra | sort by capital + max-heap of profits |  |
| 11 | 295 | [Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream/) | Hard | NC150 | two heaps |  |

**Revisit:** Top K Frequent Elements (LC 347, M3) and Merge k Sorted Lists (LC 23, M10): solve them again with a heap.

## M14 Tries (Part 7)

**Teaches:** A prefix tree for words and prefixes.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 208 | [Implement Trie (Prefix Tree)](https://leetcode.com/problems/implement-trie-prefix-tree/) | Medium | NC150 | node with 26 children |  |
| 2 | 648 | [Replace Words](https://leetcode.com/problems/replace-words/) | Medium | Extra | walk the trie to the shortest root |  |
| 3 | 1268 | [Search Suggestions System](https://leetcode.com/problems/search-suggestions-system/) | Medium | Extra | trie (or sort + binary search) |  |
| 4 | 211 | [Design Add and Search Words Data Structure](https://leetcode.com/problems/design-add-and-search-words-data-structure/) | Medium | NC150 | trie + DFS for '.' |  |
| 5 | 212 | [Word Search II](https://leetcode.com/problems/word-search-ii/) | Hard | NC150 | trie + grid backtracking |  |

## M15 Graphs (Part 8)

**Teaches:** BFS, DFS, grids, multi-source BFS, cycles, topological sort (DFS and Kahn), and Union-Find.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 733 | [Flood Fill](https://leetcode.com/problems/flood-fill/) | Easy | Extra | DFS or BFS on a grid |  |
| 2 | 200 | [Number of Islands](https://leetcode.com/problems/number-of-islands/) | Medium | NC150 | count DFS starts |  |
| 3 | 695 | [Max Area of Island](https://leetcode.com/problems/max-area-of-island/) | Medium | NC150 | DFS returns the size |  |
| 4 | 547 | [Number of Provinces](https://leetcode.com/problems/number-of-provinces/) | Medium | Extra | DFS on an adjacency matrix | Union-Find also works. |
| 5 | 323 | [Number of Connected Components in an Undirected Graph](https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/) | Medium | NC150 | DFS or Union-Find | LC Premium. Free copy: [LintCode 3651](https://www.lintcode.com/problem/3651/). |
| 6 | 133 | [Clone Graph](https://leetcode.com/problems/clone-graph/) | Medium | NC150 | DFS + HashMap old → new |  |
| 7 | 130 | [Surrounded Regions](https://leetcode.com/problems/surrounded-regions/) | Medium | NC150 | DFS from the border first |  |
| 8 | 417 | [Pacific Atlantic Water Flow](https://leetcode.com/problems/pacific-atlantic-water-flow/) | Medium | NC150 | DFS from each ocean, then overlap |  |
| 9 | 994 | [Rotting Oranges](https://leetcode.com/problems/rotting-oranges/) | Medium | NC150 | multi-source BFS |  |
| 10 | 286 | [Walls and Gates](https://leetcode.com/problems/walls-and-gates/) | Medium | NC150 | multi-source BFS from the gates | LC Premium. Free copy: [LintCode 663](https://www.lintcode.com/problem/663/). |
| 11 | 542 | [01 Matrix](https://leetcode.com/problems/01-matrix/) | Medium | Extra | multi-source BFS from the zeros |  |
| 12 | 127 | [Word Ladder](https://leetcode.com/problems/word-ladder/) | Hard | NC150 | BFS over words |  |
| 13 | 261 | [Graph Valid Tree](https://leetcode.com/problems/graph-valid-tree/) | Medium | NC150 | n−1 edges + all connected | LC Premium. Free copy: [LintCode 178](https://www.lintcode.com/problem/178/). |
| 14 | 207 | [Course Schedule](https://leetcode.com/problems/course-schedule/) | Medium | NC150 | cycle check / Kahn's topological sort |  |
| 15 | 210 | [Course Schedule II](https://leetcode.com/problems/course-schedule-ii/) | Medium | NC150 | Kahn's topological order |  |
| 16 | 802 | [Find Eventual Safe States](https://leetcode.com/problems/find-eventual-safe-states/) | Medium | Extra | reverse graph + Kahn, or DFS colors |  |
| 17 | 269 | [Alien Dictionary](https://leetcode.com/problems/alien-dictionary/) | Hard | NC150 | edges from word order, then topological sort | NeetCode: Advanced Graphs. Only needs M15 ideas. LC Premium. Free copy: [LintCode 892](https://www.lintcode.com/problem/892/). |
| 18 | 684 | [Redundant Connection](https://leetcode.com/problems/redundant-connection/) | Medium | NC150 | Union-Find: first edge inside one group |  |
| 19 | 1319 | [Number of Operations to Make Network Connected](https://leetcode.com/problems/number-of-operations-to-make-network-connected/) | Medium | Extra | Union-Find: count groups |  |
| 20 | 721 | [Accounts Merge](https://leetcode.com/problems/accounts-merge/) | Medium | Extra | Union-Find on emails |  |

## M16 Advanced Graphs (Part 8)

**Teaches:** Weighted shortest paths (Dijkstra, Bellman-Ford, Floyd-Warshall) and minimum spanning trees.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 743 | [Network Delay Time](https://leetcode.com/problems/network-delay-time/) | Medium | NC150 | Dijkstra |  |
| 2 | 1631 | [Path With Minimum Effort](https://leetcode.com/problems/path-with-minimum-effort/) | Medium | Extra | Dijkstra on a grid (max step) |  |
| 3 | 778 | [Swim in Rising Water](https://leetcode.com/problems/swim-in-rising-water/) | Hard | NC150 | Dijkstra on the max height so far |  |
| 4 | 1976 | [Number of Ways to Arrive at Destination](https://leetcode.com/problems/number-of-ways-to-arrive-at-destination/) | Medium | Extra | Dijkstra + count the ways |  |
| 5 | 787 | [Cheapest Flights Within K Stops](https://leetcode.com/problems/cheapest-flights-within-k-stops/) | Medium | NC150 | Bellman-Ford with k+1 rounds |  |
| 6 | GfG | [Bellman Ford](https://www.geeksforgeeks.org/problems/distance-from-the-source-bellman-ford-algorithm/1) | Medium | Extra | relax all edges n−1 times; spot negative cycles |  |
| 7 | 1334 | [Find the City With the Smallest Number of Neighbors at a Threshold Distance](https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/) | Medium | Extra | Floyd-Warshall |  |
| 8 | 1584 | [Min Cost to Connect All Points](https://leetcode.com/problems/min-cost-to-connect-all-points/) | Medium | NC150 | MST: Prim (heap) or Kruskal (Union-Find) |  |

## M17 1-D DP (Part 9)

**Teaches:** Turn a recursion tree into memo or a table that depends on one changing value.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 70 | [Climbing Stairs](https://leetcode.com/problems/climbing-stairs/) | Easy | NC150 | dp[i] = dp[i−1] + dp[i−2] | Fibonacci again (M6), now with memo and a table. |
| 2 | 746 | [Min Cost Climbing Stairs](https://leetcode.com/problems/min-cost-climbing-stairs/) | Easy | NC150 | min of the two steps back |  |
| 3 | 198 | [House Robber](https://leetcode.com/problems/house-robber/) | Medium | NC150 | take it or skip it |  |
| 4 | 213 | [House Robber II](https://leetcode.com/problems/house-robber-ii/) | Medium | NC150 | House Robber twice (it is a circle) |  |
| 5 | 740 | [Delete and Earn](https://leetcode.com/problems/delete-and-earn/) | Medium | Extra | turn it into House Robber |  |
| 6 | 91 | [Decode Ways](https://leetcode.com/problems/decode-ways/) | Medium | NC150 | one or two digits back |  |
| 7 | 322 | [Coin Change](https://leetcode.com/problems/coin-change/) | Medium | NC150 | fewest coins for each amount |  |
| 8 | 279 | [Perfect Squares](https://leetcode.com/problems/perfect-squares/) | Medium | Extra | fewest squares for each number |  |
| 9 | 377 | [Combination Sum IV](https://leetcode.com/problems/combination-sum-iv/) | Medium | Extra | count ordered ways | Order matters here. Compare with Coin Change II (M18). |
| 10 | 139 | [Word Break](https://leetcode.com/problems/word-break/) | Medium | NC150 | dp[i]: can this prefix be split? |  |
| 11 | 300 | [Longest Increasing Subsequence](https://leetcode.com/problems/longest-increasing-subsequence/) | Medium | NC150 | dp[i]: best ending at i | M23 shows the O(n log n) way. |
| 12 | 673 | [Number of Longest Increasing Subsequence](https://leetcode.com/problems/number-of-longest-increasing-subsequence/) | Medium | Extra | LIS + count |  |
| 13 | 329 | [Longest Increasing Path in a Matrix](https://leetcode.com/problems/longest-increasing-path-in-a-matrix/) | Hard | NC150 | grid DFS + memo | NeetCode: 2-D DP. Needs grid DFS (M15) + memo. |

## M18 2-D DP (Part 9)

**Teaches:** Grid DP, knapsack (0/1 and unbounded), two-string DP (the LCS family), and stock state machines.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 62 | [Unique Paths](https://leetcode.com/problems/unique-paths/) | Medium | NC150 | grid: from top + from left |  |
| 2 | 64 | [Minimum Path Sum](https://leetcode.com/problems/minimum-path-sum/) | Medium | Extra | grid DP with min |  |
| 3 | 120 | [Triangle](https://leetcode.com/problems/triangle/) | Medium | Extra | bottom-up, row by row |  |
| 4 | 221 | [Maximal Square](https://leetcode.com/problems/maximal-square/) | Medium | Extra | min of three neighbors + 1 |  |
| 5 | GfG | [0 - 1 Knapsack Problem](https://www.geeksforgeeks.org/problems/0-1-knapsack-problem0945/1) | Medium | Extra | take or skip; dp[item][weight] |  |
| 6 | 416 | [Partition Equal Subset Sum](https://leetcode.com/problems/partition-equal-subset-sum/) | Medium | NC150 | 0/1 knapsack (subset sum) | NeetCode: 1-D DP. |
| 7 | GfG | [Count Subsets with Sum](https://www.geeksforgeeks.org/problems/perfect-sum-problem5633/1) | Medium | Striver-Rec #06 | 0/1 knapsack, count the ways | Striver counts these with plain recursion (M6 idea). DP makes it fast. |
| 8 | 494 | [Target Sum](https://leetcode.com/problems/target-sum/) | Medium | NC150 | count subsets for a target (knapsack) |  |
| 9 | GfG | [Knapsack with Duplicate Items](https://www.geeksforgeeks.org/problems/knapsack-with-duplicate-items4201/1) | Medium | Extra | unbounded knapsack |  |
| 10 | 518 | [Coin Change II](https://leetcode.com/problems/coin-change-ii/) | Medium | NC150 | unbounded knapsack, count the ways |  |
| 11 | 1143 | [Longest Common Subsequence](https://leetcode.com/problems/longest-common-subsequence/) | Medium | NC150 | two strings: match → diagonal |  |
| 12 | 516 | [Longest Palindromic Subsequence](https://leetcode.com/problems/longest-palindromic-subsequence/) | Medium | Extra | LCS of s and reversed s |  |
| 13 | 72 | [Edit Distance](https://leetcode.com/problems/edit-distance/) | Medium | NC150 | insert / delete / replace |  |
| 14 | 97 | [Interleaving String](https://leetcode.com/problems/interleaving-string/) | Medium | NC150 | dp[i][j]: used i of s1 and j of s2 |  |
| 15 | 115 | [Distinct Subsequences](https://leetcode.com/problems/distinct-subsequences/) | Hard | NC150 | count the ways to match |  |
| 16 | 44 | [Wildcard Matching](https://leetcode.com/problems/wildcard-matching/) | Hard | Extra | '*' matches empty or one more |  |
| 17 | 10 | [Regular Expression Matching](https://leetcode.com/problems/regular-expression-matching/) | Hard | NC150 | '*' repeats the letter before it |  |
| 18 | 122 | [Best Time to Buy and Sell Stock II](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/) | Medium | Extra | states: holding or not | A one-line greedy also works (M19). |
| 19 | 309 | [Best Time to Buy and Sell Stock with Cooldown](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/) | Medium | NC150 | states: hold, sold, rest |  |
| 20 | 714 | [Best Time to Buy and Sell Stock with Transaction Fee](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/) | Medium | Extra | hold / free states with a fee |  |
| 21 | 188 | [Best Time to Buy and Sell Stock IV](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iv/) | Hard | Extra | states per number of trades | Covers Stock III too (k = 2). |

## M19 Greedy & Intervals (Part 10)

**Teaches:** Make the best local choice and check why it is safe; sort, merge and count intervals.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 455 | [Assign Cookies](https://leetcode.com/problems/assign-cookies/) | Easy | Extra | sort both; match the smallest |  |
| 2 | 55 | [Jump Game](https://leetcode.com/problems/jump-game/) | Medium | NC150 | track the farthest reach |  |
| 3 | 45 | [Jump Game II](https://leetcode.com/problems/jump-game-ii/) | Medium | NC150 | levels of reach (like BFS) |  |
| 4 | 134 | [Gas Station](https://leetcode.com/problems/gas-station/) | Medium | NC150 | restart when the tank goes below 0 |  |
| 5 | 1899 | [Merge Triplets to Form Target Triplet](https://leetcode.com/problems/merge-triplets-to-form-target-triplet/) | Medium | NC150 | keep only safe triplets |  |
| 6 | 763 | [Partition Labels](https://leetcode.com/problems/partition-labels/) | Medium | NC150 | last index of each letter |  |
| 7 | 846 | [Hand of Straights](https://leetcode.com/problems/hand-of-straights/) | Medium | NC150 | count map + start from the smallest | TreeMap version in M25. |
| 8 | 678 | [Valid Parenthesis String](https://leetcode.com/problems/valid-parenthesis-string/) | Medium | NC150 | track min and max open count |  |
| 9 | 135 | [Candy](https://leetcode.com/problems/candy/) | Hard | Extra | two passes: left, then right |  |
| 10 | 252 | [Meeting Rooms](https://leetcode.com/problems/meeting-rooms/) | Easy | NC150 | sort by start; check overlap | LC Premium. Free copy: [LintCode 920](https://www.lintcode.com/problem/920/). |
| 11 | 56 | [Merge Intervals](https://leetcode.com/problems/merge-intervals/) | Medium | NC150 | sort by start; merge |  |
| 12 | 57 | [Insert Interval](https://leetcode.com/problems/insert-interval/) | Medium | NC150 | before, overlap, after |  |
| 13 | 986 | [Interval List Intersections](https://leetcode.com/problems/interval-list-intersections/) | Medium | Extra | two pointers on two lists |  |
| 14 | 435 | [Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/) | Medium | NC150 | sort by end; keep the earliest end |  |
| 15 | 452 | [Minimum Number of Arrows to Burst Balloons](https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/) | Medium | Extra | sort by end; shoot at the end |  |
| 16 | 253 | [Meeting Rooms II](https://leetcode.com/problems/meeting-rooms-ii/) | Medium | NC150 | sorted starts and ends (or a min-heap) | LC Premium. Free copy: [LintCode 919](https://www.lintcode.com/problem/919/). M25 sweep line revisits it. |
| 17 | 1094 | [Car Pooling](https://leetcode.com/problems/car-pooling/) | Medium | Extra | +people at start, −people at end |  |
| 18 | 1851 | [Minimum Interval to Include Each Query](https://leetcode.com/problems/minimum-interval-to-include-each-query/) | Hard | NC150 | sort queries + min-heap |  |

## M20 Bits & Math (Part 10)

**Teaches:** Digit math, GCD, primes (sieve), fast power, and bit tricks (XOR, masks, shifts).

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 202 | [Happy Number](https://leetcode.com/problems/happy-number/) | Easy | NC150 | digit squares + HashSet | Fast and slow pointers (M10) also work. |
| 2 | 7 | [Reverse Integer](https://leetcode.com/problems/reverse-integer/) | Medium | NC150 | pop digits; check overflow first |  |
| 3 | 43 | [Multiply Strings](https://leetcode.com/problems/multiply-strings/) | Medium | NC150 | school multiply into an int array |  |
| 4 | 1071 | [Greatest Common Divisor of Strings](https://leetcode.com/problems/greatest-common-divisor-of-strings/) | Easy | Extra | GCD of the lengths |  |
| 5 | 204 | [Count Primes](https://leetcode.com/problems/count-primes/) | Medium | Extra | sieve of Eratosthenes |  |
| 6 | 50 | [Pow(x, n)](https://leetcode.com/problems/powx-n/) | Medium | NC150 | fast power: square and halve |  |
| 7 | 231 | [Power of Two](https://leetcode.com/problems/power-of-two/) | Easy | Extra | n & (n−1) == 0 |  |
| 8 | 191 | [Number of 1 Bits](https://leetcode.com/problems/number-of-1-bits/) | Easy | NC150 | n & (n−1) drops the lowest 1 |  |
| 9 | 136 | [Single Number](https://leetcode.com/problems/single-number/) | Easy | NC150 | XOR cancels pairs |  |
| 10 | 338 | [Counting Bits](https://leetcode.com/problems/counting-bits/) | Easy | NC150 | bits[i] = bits[i >> 1] + (i & 1) | A tiny DP (M17). |
| 11 | 190 | [Reverse Bits](https://leetcode.com/problems/reverse-bits/) | Easy | NC150 | shift out, shift in |  |
| 12 | 260 | [Single Number III](https://leetcode.com/problems/single-number-iii/) | Medium | Extra | XOR, then split by the lowest set bit |  |
| 13 | 371 | [Sum of Two Integers](https://leetcode.com/problems/sum-of-two-integers/) | Medium | NC150 | XOR for sum, AND << 1 for carry |  |
| 14 | 29 | [Divide Two Integers](https://leetcode.com/problems/divide-two-integers/) | Medium | Extra | subtract shifted divisors |  |
| 15 | 421 | [Maximum XOR of Two Numbers in an Array](https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/) | Medium | Extra | bit trie (M14), best bit first |  |

**Revisit:** Missing Number (LC 268, M2) with XOR. Subsets (LC 78, M6) with a bitmask loop.

## M21 Range Queries (Part 11)

**Teaches:** Answer many range questions fast: segment tree, Fenwick tree, sparse table.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 307 | [Range Sum Query - Mutable](https://leetcode.com/problems/range-sum-query-mutable/) | Medium | Extra | Fenwick tree or segment tree |  |
| 2 | GfG | [Range Minimum Query](https://www.geeksforgeeks.org/problems/range-minimum-query/1) | Medium | Extra | segment tree | If the array never changes, a sparse table answers in O(1). |
| 3 | 1649 | [Create Sorted Array through Instructions](https://leetcode.com/problems/create-sorted-array-through-instructions/) | Hard | Extra | Fenwick tree over values |  |
| 4 | 732 | [My Calendar III](https://leetcode.com/problems/my-calendar-iii/) | Hard | Extra | segment tree with lazy updates | A sweep line with TreeMap (M25) also works. |

**Revisit:** Count of Smaller Numbers After Self (LC 315, M7) with a Fenwick tree.

## M22 String Algorithms (Part 11)

**Teaches:** Fast pattern search: KMP, Z-function, Rabin-Karp rolling hash, Manacher.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 28 | [Find the Index of the First Occurrence in a String](https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/) | Easy | Extra | KMP (prefix function) | Brute force passes. Learn KMP here, then try Z and Rabin-Karp on it. |
| 2 | 1392 | [Longest Happy Prefix](https://leetcode.com/problems/longest-happy-prefix/) | Hard | Extra | prefix function (or hashing) |  |
| 3 | 214 | [Shortest Palindrome](https://leetcode.com/problems/shortest-palindrome/) | Hard | Extra | KMP on s + '#' + reverse(s) |  |
| 4 | 2223 | [Sum of Scores of Built Strings](https://leetcode.com/problems/sum-of-scores-of-built-strings/) | Hard | Extra | Z-function: add up the z values | Rare in interviews, but the cleanest Z drill. |
| 5 | 686 | [Repeated String Match](https://leetcode.com/problems/repeated-string-match/) | Medium | Extra | Rabin-Karp rolling hash (or KMP) |  |
| 6 | 1044 | [Longest Duplicate Substring](https://leetcode.com/problems/longest-duplicate-substring/) | Hard | Extra | binary search on length + rolling hash |  |

**Revisit:** Longest Palindromic Substring (LC 5) and Palindromic Substrings (LC 647), both M4: solve them again with Manacher.

## M23 Advanced DP (Part 12)

**Teaches:** LIS with binary search, interval DP, tree DP, bitmask DP and digit DP.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 354 | [Russian Doll Envelopes](https://leetcode.com/problems/russian-doll-envelopes/) | Hard | Extra | sort, then LIS with binary search | Redo LC 300 the O(n log n) way first. |
| 2 | GfG | [Matrix Chain Multiplication](https://www.geeksforgeeks.org/problems/matrix-chain-multiplication0303/1) | Hard | Extra | interval DP: try every split |  |
| 3 | 1547 | [Minimum Cost to Cut a Stick](https://leetcode.com/problems/minimum-cost-to-cut-a-stick/) | Hard | Extra | interval DP over cut points |  |
| 4 | 312 | [Burst Balloons](https://leetcode.com/problems/burst-balloons/) | Hard | NC150 | interval DP: pick the last balloon | NeetCode: 2-D DP. |
| 5 | 337 | [House Robber III](https://leetcode.com/problems/house-robber-iii/) | Medium | Extra | tree DP: (rob, skip) from each child |  |
| 6 | 968 | [Binary Tree Cameras](https://leetcode.com/problems/binary-tree-cameras/) | Hard | Extra | tree DP with 3 states |  |
| 7 | 834 | [Sum of Distances in Tree](https://leetcode.com/problems/sum-of-distances-in-tree/) | Hard | Extra | rerooting: two DFS passes |  |
| 8 | 464 | [Can I Win](https://leetcode.com/problems/can-i-win/) | Medium | Extra | bitmask of used numbers + memo |  |
| 9 | 847 | [Shortest Path Visiting All Nodes](https://leetcode.com/problems/shortest-path-visiting-all-nodes/) | Hard | Extra | BFS over (node, mask) |  |
| 10 | 902 | [Numbers At Most N Given Digit Set](https://leetcode.com/problems/numbers-at-most-n-given-digit-set/) | Hard | Extra | digit DP (tight or free) |  |
| 11 | 233 | [Number of Digit One](https://leetcode.com/problems/number-of-digit-one/) | Hard | Extra | digit DP / count per position |  |

**Revisit:** Partition to K Equal Sum Subsets (LC 698, M11) with bitmask DP. Binary Tree Maximum Path Sum (LC 124, M12) as tree DP.

## M24 Graph Algorithms II (Part 12)

**Teaches:** Bipartite check, 0-1 BFS, bridges and articulation points, strongly connected components, and Euler paths.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 785 | [Is Graph Bipartite?](https://leetcode.com/problems/is-graph-bipartite/) | Medium | Extra | BFS or DFS 2-coloring |  |
| 2 | 886 | [Possible Bipartition](https://leetcode.com/problems/possible-bipartition/) | Medium | Extra | build the graph, then 2-color |  |
| 3 | 1368 | [Minimum Cost to Make at Least One Valid Path in a Grid](https://leetcode.com/problems/minimum-cost-to-make-at-least-one-valid-path-in-a-grid/) | Hard | Extra | 0-1 BFS with a deque |  |
| 4 | 1192 | [Critical Connections in a Network](https://leetcode.com/problems/critical-connections-in-a-network/) | Hard | Extra | Tarjan: bridges (low-link) |  |
| 5 | GfG | [Articulation Point](https://www.geeksforgeeks.org/problems/articulation-point-1/1) | Hard | Extra | Tarjan: cut vertices |  |
| 6 | GfG | [Count Strongly Connected Components](https://www.geeksforgeeks.org/problems/strongly-connected-components-kosarajus-algo/1) | Medium | Extra | Kosaraju (or Tarjan) |  |
| 7 | 332 | [Reconstruct Itinerary](https://leetcode.com/problems/reconstruct-itinerary/) | Hard | NC150 | Euler path: Hierholzer | NeetCode: Advanced Graphs. The fast way is an Euler path, taught here. |
| 8 | 2097 | [Valid Arrangement of Pairs](https://leetcode.com/problems/valid-arrangement-of-pairs/) | Hard | Extra | Euler path: Hierholzer |  |

## M25 More Patterns (Part 13)

**Teaches:** Monotonic deque, TreeMap, sweep line, reservoir sampling, meet in the middle, quickselect and Morris traversal.

| # | LC | Problem | Difficulty | Source | Pattern | Notes |
|---|---|---|---|---|---|---|
| 1 | 239 | [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/) | Hard | NC150 | monotonic deque | NeetCode: Sliding Window. A heap way works after M13, but slower. |
| 2 | 1438 | [Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit](https://leetcode.com/problems/longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit/) | Medium | Extra | two monotonic deques |  |
| 3 | 862 | [Shortest Subarray with Sum at Least K](https://leetcode.com/problems/shortest-subarray-with-sum-at-least-k/) | Hard | Extra | prefix sums + monotonic deque | Negative numbers break the normal window. |
| 4 | 729 | [My Calendar I](https://leetcode.com/problems/my-calendar-i/) | Medium | Extra | TreeMap floor / ceiling |  |
| 5 | 218 | [The Skyline Problem](https://leetcode.com/problems/the-skyline-problem/) | Hard | Extra | sweep line + TreeMap of heights |  |
| 6 | 382 | [Linked List Random Node](https://leetcode.com/problems/linked-list-random-node/) | Medium | Extra | reservoir sampling | The follow-up (length unknown) is the point. |
| 7 | 1755 | [Closest Subsequence Sum](https://leetcode.com/problems/closest-subsequence-sum/) | Hard | Extra | meet in the middle: split, list sums, sort + binary search |  |

**Revisit:** Quickselect and Morris have no new rows. They are faster or lighter ways to solve problems you know. Quickselect: LC 215, LC 973, LC 347. Morris: LC 94, LC 230. Sweep line: LC 253. TreeMap: LC 846, LC 981.

## M26 Interview & Meta (Part 14)

**Teaches:** The interview script, thinking out loud, picking a pattern, and mock rounds.

No new problems here. Mock rounds reuse problems from M1–M25, with the title hidden and a timer.

- **Warm-up round (30 min):** one Easy + one Medium from the Basics (M1–M7).
- **Core round (45 min):** two Mediums from M8–M14, from different patterns.
- **Hard round (60 min):** one Medium + one Hard from M15–M20.
- **Mixed round (45 min):** two problems picked from all started modules, weighted toward weak patterns.
- **Look-alike round:** two problems that look the same but need different patterns (for example LC 209 vs LC 560).

Each round follows the script: understand → brute force and its Big-O → find the repeated work → match a pattern with the clues → plan → code → dry run → final Big-O.

## Coverage check

- **NC150: 150/150 placed.** Each one appears exactly once.
- **Striver-BS: 32/32 PDF entries placed** (32 rows).
- **Striver-Rec: 21/21 PDF entries placed** (22 rows). Some entries hold several small drills, so they became more than one row. Entries #14 and #15 are the same problem solved two ways, so they share one row.
- **Extra: 129.**
- **Total: 319 problems.** 14 rows are on both NC150 and a Striver list.
- No LeetCode number appears twice.

Where each Striver entry went:

- **Striver-BS:** #01 → LC 704 (M8); #02 → Implement Lower Bound (M8); #03 → Implement Upper Bound (M8); #04 → LC 35 (M8); #05 → Floor in Sorted Array (M8); #06 → LC 34 (M8); #07 → Count Occurrences in Sorted (M8); #08 → LC 33 (M8); #09 → LC 81 (M8); #10 → LC 153 (M8); #11 → Find Rotation Count (M8); #12 → LC 540 (M8); #13 → LC 162 (M8); #14 → LC 69 (M8); #15 → Nth Root of M (M8); #16 → LC 875 (M8); #17 → LC 1482 (M8); #18 → LC 1283 (M8); #19 → LC 1011 (M8); #20 → LC 1539 (M8); #21 → Aggressive Cows (M8); #22 → Allocate Minimum Pages (M8); #23 → LC 410 (M8); #24 → Painter's Partition Problem (M8); #25 → LC 774 (M8); #26 → LC 4 (M8); #27 → K-th of Two Sorted Arrays (M8); #28 → Row with Max 1s in Rowwise Sorted (M8); #29 → LC 74 (M8); #30 → LC 240 (M8); #31 → LC 1901 (M8); #32 → Median in a Row-Wise Sorted Matrix (M8).
- **Striver-Rec:** #01 → 1 to n Without Loop (M6); #02 → LC 344 (M2), LC 125 (M4), Sum of Natural Numbers (M6), Factorial (M6); #03 → Factorial (M6); #04 → LC 344 (M2), LC 509 (M6); #05 → LC 509 (M6); #06 → LC 78 (M6), Count Subsets with Sum (M18); #07 → Pyramid Pattern (M6); #08 → Merge Sort (M7); #09 → Quick Sort (M7); #10 → LC 39 (M11); #11 → LC 40 (M11); #12 → Subset Sums (M6); #13 → LC 90 (M11); #14 → LC 46 (M11); #15 → LC 46 (M11); #16 → LC 51 (M11); #17 → LC 37 (M11); #18 → M-Coloring Problem (M11); #19 → LC 131 (M11); #20 → LC 60 (M11); #21 → Rat in Maze (M11).

## NeetCode 150: PDF vs the official list

I checked the PDF against NeetCode's own data file, the one behind neetcode.io/practice (`github.com/neetcode-gh/leetcode`, file `.problemSiteData.json`, rows marked `neetcode150`). Both have the same 150 problems, the same LeetCode links and the same difficulty. Only one thing differs:

- **Generate Parentheses (LC 22):** the PDF puts it under Backtracking (#75). The official list puts it under **Stack**. So the PDF shows Stack 6 and Backtracking 10; the official list has Stack 7 and Backtracking 9. The official list wins. Here it lives in M11 either way, because it needs pruning.
- Small order note: the PDF index lists Heap before Tries. The official data lists Tries before Heap. Same problems.

## Choices you may want to check

- **Subsets (LC 78) is in M6.** Pick / not-pick is taught there (Striver's order). NeetCode files it under Backtracking.
- **LC 5 and LC 647 are in M4.** Their usual answer is expand-from-the-center, a two-pointer idea. NeetCode files them under 1-D DP.
- **Sliding Window Maximum (LC 239) is in M25,** because the spec puts the monotonic deque there. If the deque moves to M9, this problem moves too.
- **Reconstruct Itinerary (LC 332) is in M24,** because the fast answer is an Euler path.
- **Merge k Sorted Lists (LC 23) is in M10** (merge in pairs). The heap way is a revisit in M13.
- **Digit math lives in M20,** so Reverse Integer, Happy Number and Multiply Strings sit there. Missing Number and Plus One need no digit math, so they sit in M2.
- **LC 28 is in M22** even though brute force passes, because it is the standard KMP drill.
- **Quickselect and Morris have no rows of their own.** No common problem needs them; they are better ways to solve problems you know.

## Left out on purpose

- 3Sum Closest (LC 16): a small change to 3Sum.
- Best Time to Buy and Sell Stock III (LC 123): Stock IV with k = 2 covers it.
- Next Greater Element II (LC 503) and Maximal Rectangle (LC 85): small twists on NGE I and Largest Rectangle.
- Basic Calculator I and II (LC 224, 227): asked at few companies; RPN and Decode String teach the stack ideas.
- Postorder iterative (LC 145), Bottom View and Left View (GfG): same ideas as the traversals and views already listed.
- LFU Cache (LC 460): rare and very long. LRU Cache teaches the idea.
- Reverse Pairs (LC 493) and Count of Range Sum (LC 327): the same merge-sort counting as Count Inversions and LC 315.
- Word Break II (LC 140) and Restore IP Addresses (LC 93): more of the same backtracking.
- Palindrome Partitioning II (LC 132) and Cherry Pickup II (LC 1463): rarer DP shapes. MCM and grid DP cover the ideas.
- Wiggle Sort II (LC 324): the one problem that truly needs quickselect, but it is rare.
- Path with Maximum Probability (LC 1514) and Shortest Path in Binary Matrix (LC 1091): Dijkstra and grid BFS again.
- Job Sequencing and Fractional Knapsack (GfG): textbook greedy, rarely asked at product companies.
- Partition Array Into Two Arrays to Minimize Sum Difference (LC 2035): the same meet-in-the-middle idea as LC 1755, but harder.
- Bubble, selection and insertion sort: taught inside the M7 lessons, not asked as problems.
- Easy warm-ups such as Pascal's Triangle (LC 118), Longest Common Prefix (LC 14), Palindrome Number (LC 9) and Isomorphic Strings (LC 205): fine to add later as lesson drills.
