import json
import sys
import time
from judge import execute_judge

def run_tests():
    print("=" * 60)
    print("RUNNING LEETCODE-STYLE JUDGE REGRESSION & INTEGRATION SUITE")
    print("=" * 60)

    passed_count = 0
    total_count = 0

    def assert_test(name, result, expected_status, expected_passed, expected_total):
        nonlocal passed_count, total_count
        total_count += 1
        status = result.get("status")
        tests_passed = result.get("testsPassed", 0)
        tests_total = result.get("testsTotal", 0)

        ok = (status == expected_status and tests_passed == expected_passed and tests_total == expected_total)
        if ok:
            passed_count += 1
            print(f"[PASS] {name} | status={status}, passed={tests_passed}/{tests_total}")
        else:
            print(f"[FAIL] {name}")
            print(f"       Expected: status={expected_status}, passed={expected_passed}/{expected_total}")
            print(f"       Actual:   status={status}, passed={tests_passed}/{tests_total}")
            print(f"       Result:   {json.dumps(result, indent=2)}")

    # 1. Array Test (Two Sum)
    two_sum_code = """
    function twoSum(nums, target) {
        const map = new Map();
        for (let i = 0; i < nums.length; i++) {
            const diff = target - nums[i];
            if (map.has(diff)) {
                return [map.get(diff), i];
            }
            map.set(nums[i], i);
        }
        return [];
    }
    """
    two_sum_cases = [
        {"args": [[2, 7, 11, 15], 9], "expected": [0, 1]},
        {"args": [[3, 2, 4], 6], "expected": [1, 2]}
    ]
    res = execute_judge(
        code=two_sum_code,
        test_cases=two_sum_cases,
        param_types=["array", "number"],
        return_type="array",
        order_matters=False
    )
    assert_test("1. Arrays - Two Sum", res, "accepted", 2, 2)

    # 2. Linked List Test (Reverse Linked List)
    reverse_list_code = """
    function reverseList(head) {
        let prev = null;
        let current = head;
        while (current !== null) {
            const next = current.next;
            current.next = prev;
            prev = current;
            current = next;
        }
        return prev;
    }
    """
    reverse_list_cases = [
        {"args": [[1, 2, 3, 4, 5]], "expected": [5, 4, 3, 2, 1]},
        {"args": [[]], "expected": []},
        {"args": [[1]], "expected": [1]}
    ]
    res = execute_judge(
        code=reverse_list_code,
        test_cases=reverse_list_cases,
        param_types=["linked_list"],
        return_type="linked_list"
    )
    assert_test("2. Linked List - Reverse List ([1,2,3,4,5], [], [1])", res, "accepted", 3, 3)

    # 3. Binary Tree Test (Level Order Traversal)
    level_order_code = """
    function levelOrder(root) {
        if (!root) return [];
        const result = [];
        const queue = [root];
        while (queue.length > 0) {
            const levelSize = queue.length;
            const currentLevel = [];
            for (let i = 0; i < levelSize; i++) {
                const node = queue.shift();
                currentLevel.push(node.val);
                if (node.left) queue.push(node.left);
                if (node.right) queue.push(node.right);
            }
            result.push(currentLevel);
        }
        return result;
    }
    """
    level_order_cases = [
        {"args": [[3, 9, 20, None, None, 15, 7]], "expected": [[3], [9, 20], [15, 7]]},
        {"args": [[]], "expected": []}
    ]
    res = execute_judge(
        code=level_order_code,
        test_cases=level_order_cases,
        param_types=["binary_tree"],
        return_type="matrix"
    )
    assert_test("3. Binary Tree - Level Order Traversal", res, "accepted", 2, 2)

    # 4. Invert Binary Tree (TreeNode in -> TreeNode out)
    invert_tree_code = """
    function invertTree(root) {
        if (!root) return null;
        const temp = root.left;
        root.left = invertTree(root.right);
        root.right = invertTree(temp);
        return root;
    }
    """
    invert_tree_cases = [
        {"args": [[4, 2, 7, 1, 3, 6, 9]], "expected": [4, 7, 2, 9, 6, 3, 1]},
        {"args": [[]], "expected": []}
    ]
    res = execute_judge(
        code=invert_tree_code,
        test_cases=invert_tree_cases,
        param_types=["binary_tree"],
        return_type="binary_tree"
    )
    assert_test("4. Binary Tree - Invert Tree (returns TreeNode)", res, "accepted", 2, 2)

    # 5. Multiple Arguments (Merge Two Sorted Lists)
    merge_lists_code = """
    function mergeTwoLists(list1, list2) {
        const dummy = new ListNode(0);
        let current = dummy;
        while (list1 !== null && list2 !== null) {
            if (list1.val <= list2.val) {
                current.next = list1;
                list1 = list1.next;
            } else {
                current.next = list2;
                list2 = list2.next;
            }
            current = current.next;
        }
        current.next = list1 !== null ? list1 : list2;
        return dummy.next;
    }
    """
    merge_lists_cases = [
        {"args": [[1, 2, 4], [1, 3, 4]], "expected": [1, 1, 2, 3, 4, 4]},
        {"args": [[], []], "expected": []},
        {"args": [[], [0]], "expected": [0]}
    ]
    res = execute_judge(
        code=merge_lists_code,
        test_cases=merge_lists_cases,
        param_types=["linked_list", "linked_list"],
        return_type="linked_list"
    )
    assert_test("5. Multiple Linked List Arguments - Merge Two Lists", res, "accepted", 3, 3)

    # 6. In-place Mutation Problem (Reverse String in-place)
    reverse_string_code = """
    function reverseString(s) {
        let left = 0, right = s.length - 1;
        while (left < right) {
            const temp = s[left];
            s[left] = s[right];
            s[right] = temp;
            left++;
            right--;
        }
    }
    """
    reverse_string_cases = [
        {"args": [["h", "e", "l", "l", "o"]], "expected": ["o", "l", "l", "e", "h"]},
        {"args": [["H", "a", "n", "n", "a", "h"]], "expected": ["h", "a", "n", "n", "a", "H"]}
    ]
    res = execute_judge(
        code=reverse_string_code,
        test_cases=reverse_string_cases,
        param_types=["array"],
        return_type="void",
        is_mutation=True,
        mutate_arg=0
    )
    assert_test("6. In-place Mutation - Reverse String", res, "accepted", 2, 2)

    # 7. Edge Cases & Safety: Cyclic Linked List
    cyclic_list_code = """
    function makeCycle(head) {
        if (!head || !head.next) return head;
        head.next.next = head; // Create 2-node cycle
        return head;
    }
    """
    res = execute_judge(
        code=cyclic_list_code,
        test_cases=[{"args": [[1, 2, 3]], "expected": [1, 2, 3]}],
        param_types=["linked_list"],
        return_type="linked_list"
    )
    assert_test("7. Safety - Cyclic Linked List (No hanging/infinite loop)", res, "wrong_answer", 0, 1)

    # 8. Edge Cases & Safety: Runtime Error Handling
    runtime_error_code = """
    function badFn(head) {
        return head.nonExistentMethod.abc();
    }
    """
    res = execute_judge(
        code=runtime_error_code,
        test_cases=[{"args": [[1, 2]], "expected": [2, 1]}],
        param_types=["linked_list"],
        return_type="linked_list"
    )
    assert_test("8. Reliability - Runtime Error Caught Cleanly", res, "wrong_answer", 0, 1)

    # 9. Edge Cases & Safety: Syntax Error Handling
    syntax_error_code = "function broken( { return 1; "
    res = execute_judge(
        code=syntax_error_code,
        test_cases=[{"args": [1], "expected": 1}],
        param_types=["number"],
        return_type="number"
    )
    assert_test("9. Reliability - Syntax Error Caught Cleanly", res, "compilation_error", 0, 0)

    # 10. Edge Cases & Safety: Timeout (Infinite Loop)
    infinite_loop_code = """
    function infinite(head) {
        while(true) {}
        return head;
    }
    """
    res = execute_judge(
        code=infinite_loop_code,
        test_cases=[{"args": [[1]], "expected": [1]}],
        param_types=["linked_list"],
        return_type="linked_list",
        time_limit=1
    )
    assert_test("10. Reliability - Infinite Loop Timeout (1s)", res, "timeout", 0, 1)

    print("=" * 60)
    print(f"RESULTS: {passed_count}/{total_count} TEST SUITES PASSED")
    print("=" * 60)
    if passed_count == total_count:
        print("ALL REGRESSION & INTEGRATION TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    run_tests()
