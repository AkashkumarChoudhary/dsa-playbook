import java.util.*;

class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>(); // @L:init
        for (int num : nums) { // @L:loop
            if (!seen.add(num)) { // @L:check
                return true; // @L:found
            }
        }
        return false; // @L:none
    }
}
