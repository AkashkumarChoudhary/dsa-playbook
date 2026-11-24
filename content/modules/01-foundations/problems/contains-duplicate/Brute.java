import java.util.*;

class Solution {
    public boolean containsDuplicate(int[] nums) {
        for (int i = 0; i < nums.length; i++) { // @L:outer
            for (int j = i + 1; j < nums.length; j++) { // @L:inner
                if (nums[i] == nums[j]) { // @L:compare
                    return true; // @L:found
                }
            }
        }
        return false; // @L:none
    }
}
