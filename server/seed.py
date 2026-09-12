import json
from datetime import datetime, timezone
from passlib.context import CryptContext
from database import engine, SessionLocal, Base
from models import (
    User, Problem, Puzzle, Achievement,
    UserAchievement, Friend, ActivityLog
)

from sqlalchemy import text

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def migrate_and_update_problems(db):
    try:
        db.execute(text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS param_types JSON DEFAULT '[]'::json;"))
        db.execute(text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS return_type VARCHAR DEFAULT 'auto';"))
        db.execute(text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS is_mutation BOOLEAN DEFAULT FALSE;"))
        db.execute(text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS mutate_arg INTEGER DEFAULT 0;"))
        db.commit()
    except Exception as e:
        db.rollback()

    problem_type_map = {
        1: {"param_types": ["array", "number"], "return_type": "array", "order_matters": False},
        2: {"param_types": ["string"], "return_type": "boolean"},
        3: {"param_types": ["linked_list"], "return_type": "linked_list"},
        4: {"param_types": ["number"], "return_type": "number"},
        5: {"param_types": ["array"], "return_type": "number"},
        6: {"param_types": ["number"], "return_type": "boolean"},
        7: {"param_types": ["matrix"], "return_type": "matrix"},
        8: {"param_types": ["array"], "return_type": "array"},
        9: {"param_types": ["matrix"], "return_type": "boolean"},
        10: {"param_types": ["matrix"], "return_type": "number"},
        11: {"param_types": ["array"], "return_type": "number"},
        12: {"param_types": ["binary_tree"], "return_type": "matrix"},
        13: {"param_types": ["array", "array"], "return_type": "array"},
        14: {"param_types": ["binary_tree"], "return_type": "binary_tree"},
        15: {"param_types": ["array"], "return_type": "number"},
        16: {"param_types": ["string", "string"], "return_type": "number"},
        17: {"param_types": ["array", "array"], "return_type": "number"},
        18: {"param_types": ["array"], "return_type": "number"},
    }

    for p_id, spec in problem_type_map.items():
        p = db.query(Problem).filter(Problem.id == p_id).first()
        if p:
            p.param_types = spec.get("param_types", [])
            p.return_type = spec.get("return_type", "auto")
            if "order_matters" in spec:
                p.order_matters = spec["order_matters"]
            if "is_mutation" in spec:
                p.is_mutation = spec["is_mutation"]
            if "mutate_arg" in spec:
                p.mutate_arg = spec["mutate_arg"]
    db.commit()


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        migrate_and_update_problems(db)
        if db.query(Problem).count() > 0:
            return

        now = datetime.now(timezone.utc)

        problems = [
            Problem(
                id=1,
                title="Two Sum",
                difficulty="Easy",
                topics=["Array", "Hash Table"],
                acceptance=49.2,
                description="Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
                input_format="The first line contains an array of integers.\nThe second line contains the target integer.",
                output_format="Return an array of two indices.",
                constraints=json.dumps([
                    "2 <= nums.length <= 10^4",
                    "-10^9 <= nums[i] <= 10^9",
                    "-10^9 <= target <= 10^9",
                    "Only one valid answer exists."
                ]),
                examples=json.dumps([
                    {
                        "input": "nums = [2, 7, 11, 15], target = 9",
                        "output": "[0, 1]",
                        "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
                    },
                    {
                        "input": "nums = [3, 2, 4], target = 6",
                        "output": "[1, 2]",
                        "explanation": ""
                    }
                ]),
                starter_code="function twoSum(nums, target) {\n  \n  \n}",
                order_matters=False,
                time_limit=30,
                memory_limit=256,
            ),
            Problem(
                id=2,
                title="Valid Parentheses",
                difficulty="Easy",
                topics=["Stack", "String"],
                acceptance=40.1,
                description="Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
                input_format="A string containing only parentheses characters.",
                output_format="Return true if the string is valid, false otherwise.",
                constraints=json.dumps([
                    "1 <= s.length <= 10^4",
                    "s consists of parentheses only '()[]{}'."
                ]),
                examples=json.dumps([
                    {
                        "input": "s = \"()\"",
                        "output": "true",
                        "explanation": ""
                    },
                    {
                        "input": "s = \"()[]{}\"",
                        "output": "true",
                        "explanation": ""
                    },
                    {
                        "input": "s = \"(]\"",
                        "output": "false",
                        "explanation": ""
                    }
                ]),
                starter_code="function isValid(s) {\n  \n  \n}",
                order_matters=True,
                time_limit=30,
                memory_limit=256,
            ),
            Problem(
                id=3,
                title="Reverse Linked List",
                difficulty="Easy",
                topics=["Linked List", "Recursion"],
                acceptance=72.5,
                description="Given the head of a singly linked list, reverse the list, and return the reversed list.",
                input_format="The head of a singly linked list.",
                output_format="Return the head of the reversed linked list.",
                constraints=json.dumps([
                    "The number of nodes in the list is the range [0, 5000]",
                    "-5000 <= Node.val <= 5000"
                ]),
                examples=json.dumps([
                    {
                        "input": "head = [1, 2, 3, 4, 5]",
                        "output": "[5, 4, 3, 2, 1]",
                        "explanation": ""
                    },
                    {
                        "input": "head = [1, 2]",
                        "output": "[2, 1]",
                        "explanation": ""
                    }
                ]),
                starter_code="function reverseList(head) {\n  \n  \n}",
                order_matters=True,
                time_limit=30,
                memory_limit=256,
            ),
            Problem(
                id=4,
                title="Climbing Stairs",
                difficulty="Easy",
                topics=["Dynamic Programming", "Math"],
                acceptance=51.3,
                description="You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
                input_format="An integer n representing the number of steps.",
                output_format="Return the number of distinct ways to climb to the top.",
                constraints=json.dumps([
                    "1 <= n <= 45"
                ]),
                examples=json.dumps([
                    {
                        "input": "n = 2",
                        "output": "2",
                        "explanation": "1. 1 step + 1 step\n2. 2 steps"
                    },
                    {
                        "input": "n = 3",
                        "output": "3",
                        "explanation": "1. 1 step + 1 step + 1 step\n2. 1 step + 2 steps\n3. 2 steps + 1 step"
                    }
                ]),
                starter_code="function climbStairs(n) {\n  \n  \n}",
                order_matters=True,
                time_limit=30,
                memory_limit=256,
            ),
            Problem(
                id=5,
                title="Maximum Subarray",
                difficulty="Medium",
                topics=["Array", "Dynamic Programming", "Divide and Conquer"],
                acceptance=50.1,
                description="Given an integer array nums, find the subarray with the largest sum, and return its sum.",
                input_format="An array of integers.",
                output_format="Return the sum of the maximum subarray.",
                constraints=json.dumps([
                    "1 <= nums.length <= 10^5",
                    "-10^4 <= nums[i] <= 10^4"
                ]),
                examples=json.dumps([
                    {
                        "input": "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
                        "output": "6",
                        "explanation": "The subarray [4, -1, 2, 1] has the largest sum 6."
                    },
                    {
                        "input": "nums = [1]",
                        "output": "1",
                        "explanation": "The subarray [1] has the largest sum 1."
                    }
                ]),
                starter_code="function maxSubArray(nums) {\n  \n  \n}",
                order_matters=True,
                time_limit=30,
                memory_limit=256,
            ),
            Problem(
                id=6,
                title="Palindrome Number",
                difficulty="Easy",
                topics=["Math"],
                acceptance=52.4,
                description="Given an integer x, return true if x is palindrome integer.\n\nAn integer is a palindrome when it reads the same backward as forward.",
                input_format="An integer x.",
                output_format="Return true if x is a palindrome, false otherwise.",
                constraints=json.dumps([
                    "-2^31 <= x <= 2^31 - 1"
                ]),
                examples=json.dumps([
                    {
                        "input": "x = 121",
                        "output": "true",
                        "explanation": "121 reads as 121 from left to right and from right to left."
                    },
                    {
                        "input": "x = -121",
                        "output": "false",
                        "explanation": "From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome."
                    }
                ]),
                starter_code="function isPalindrome(x) {\n  \n  \n}",
                order_matters=True,
                time_limit=30,
                memory_limit=256,
            ),
            Problem(
                id=7,
                title="Merge Intervals",
                difficulty="Medium",
                topics=["Array", "Sorting"],
                acceptance=46.8,
                description="Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
                input_format="An array of intervals.",
                output_format="Return an array of merged intervals.",
                constraints=json.dumps([
                    "1 <= intervals.length <= 10^4",
                    "intervals[i].length == 2",
                    "0 <= start_i <= end_i <= 10^4"
                ]),
                examples=json.dumps([
                    {
                        "input": "intervals = [[1,3],[2,6],[8,10],[15,18]]",
                        "output": "[[1,6],[8,10],[15,18]]",
                        "explanation": "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]."
                    },
                    {
                        "input": "intervals = [[1,4],[4,5]]",
                        "output": "[[1,5]]",
                        "explanation": "Intervals [1,4] and [4,5] are considered overlapping."
                    }
                ]),
                starter_code="function merge(intervals) {\n  \n  \n}",
                order_matters=True,
                time_limit=30,
                memory_limit=256,
            ),
            Problem(
                id=8,
                title="Product of Array Except Self",
                difficulty="Medium",
                topics=["Array", "Prefix Sum"],
                acceptance=64.2,
                description="Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].\n\nThe product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.\n\nYou must write an algorithm that runs in O(n) time and without using the division operation.",
                input_format="An array of integers.",
                output_format="Return an array of products.",
                constraints=json.dumps([
                    "2 <= nums.length <= 10^5",
                    "-30 <= nums[i] <= 30",
                    "The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer."
                ]),
                examples=json.dumps([
                    {
                        "input": "nums = [1, 2, 3, 4]",
                        "output": "[24, 12, 8, 6]",
                        "explanation": ""
                    },
                    {
                        "input": "nums = [-1, 1, 0, -3, 3]",
                        "output": "[0, 0, 9, 0, 0]",
                        "explanation": ""
                    }
                ]),
                starter_code="function productExceptSelf(nums) {\n  \n  \n}",
                order_matters=True,
                time_limit=30,
                memory_limit=256,
            ),
            Problem(
                id=9,
                title="Valid Sudoku",
                difficulty="Medium",
                topics=["Array", "Hash Table", "Matrix"],
                acceptance=56.3,
                description="Determine if a 9 x 9 Sudoku board is valid. Only the filled cells need to be validated according to the following rules:\n\n1. Each row must contain the digits 1-9 without repetition.\n2. Each column must contain the digits 1-9 without repetition.\n3. Each of the nine 3 x 3 sub-boxes must contain the digits 1-9 without repetition.",
                input_format="A 9x9 2D array representing the Sudoku board.",
                output_format="Return true if the board is valid, false otherwise.",
                constraints=json.dumps([
                    "board.length == 9",
                    "board[i].length == 9",
                    "board[i][j] is a digit 1-9 or '.'"
                ]),
                examples=json.dumps([
                    {
                        "input": "board = [[\"5\",\"3\",\".\",\".\",\"7\",\".\",\".\",\".\",\".\"],[\"6\",\".\",\".\",\"1\",\"9\",\"5\",\".\",\".\",\".\"],[\".\",\"9\",\"8\",\".\",\".\",\".\",\".\",\"6\",\".\"],[\"8\",\".\",\".\",\".\",\"6\",\".\",\".\",\".\",\"3\"],[\"4\",\".\",\".\",\"8\",\".\",\"3\",\".\",\".\",\"1\"],[\"7\",\".\",\".\",\".\",\"2\",\".\",\".\",\".\",\"6\"],[\".\",\"6\",\".\",\".\",\".\",\".\",\"2\",\"8\",\".\"],[\".\",\".\",\".\",\"4\",\"1\",\"9\",\".\",\".\",\"5\"],[\".\",\".\",\".\",\".\",\"8\",\".\",\".\",\"7\",\"9\"]]",
                        "output": "true",
                        "explanation": ""
                    }
                ]),
                starter_code="function isValidSudoku(board) {\n  \n  \n}",
                order_matters=True,
                time_limit=30,
                memory_limit=256,
            ),
            Problem(
                id=10,
                title="Number of Islands",
                difficulty="Medium",
                topics=["DFS", "BFS", "Union Find", "Matrix"],
                acceptance=57.8,
                description="Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
                input_format="An m x n grid of '1's and '0's.",
                output_format="Return the number of islands.",
                constraints=json.dumps([
                    "m == grid.length",
                    "n == grid[i].length",
                    "1 <= m, n <= 300",
                    "grid[i][j] is '0' or '1'."
                ]),
                examples=json.dumps([
                    {
                        "input": "grid = [[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]",
                        "output": "1",
                        "explanation": ""
                    },
                    {
                        "input": "grid = [[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"1\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]]",
                        "output": "3",
                        "explanation": ""
                    }
                ]),
                starter_code="function numIslands(grid) {\n  \n  \n}",
                order_matters=True,
                time_limit=30,
                memory_limit=256,
            ),
            Problem(
                id=11,
                title="Container With Most Water",
                difficulty="Medium",
                topics=["Array", "Two Pointers", "Greedy"],
                acceptance=54.6,
                description="You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.",
                input_format="An array of integers representing heights.",
                output_format="Return the maximum area.",
                constraints=json.dumps([
                    "n == height.length",
                    "2 <= n <= 10^5",
                    "0 <= height[i] <= 10^4"
                ]),
                examples=json.dumps([
                    {
                        "input": "height = [1,8,6,2,5,4,8,3,7]",
                        "output": "49",
                        "explanation": "The maximum area is obtained by choosing index 1 (height=8) and index 8 (height=7). Area = min(8, 7) * (8 - 1) = 49."
                    }
                ]),
                starter_code="function maxArea(height) {\n  \n  \n}",
                order_matters=True,
                time_limit=30,
                memory_limit=256,
            ),
            Problem(
                id=12,
                title="Binary Tree Level Order Traversal",
                difficulty="Medium",
                topics=["Tree", "BFS", "Binary Tree"],
                acceptance=62.1,
                description="Given the root of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).",
                input_format="The root of a binary tree.",
                output_format="Return a 2D array of level order traversals.",
                constraints=json.dumps([
                    "The number of nodes is in range [0, 2000]",
                    "-1000 <= Node.val <= 1000"
                ]),
                examples=json.dumps([
                    {
                        "input": "root = [3, 9, 20, null, null, 15, 7]",
                        "output": "[[3],[9,20],[15,7]]",
                        "explanation": ""
                    }
                ]),
                starter_code="function levelOrder(root) {\n  \n  \n}",
                order_matters=True,
                time_limit=30,
                memory_limit=256,
            ),
            Problem(
                id=13,
                title="LRU Cache",
                difficulty="Hard",
                topics=["Hash Table", "Linked List", "Design"],
                acceptance=40.5,
                description="Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRUCache class:\n- LRUCache(int capacity) Initialize the LRU cache with positive size capacity.\n- int get(int key) Return the value of the key if the key exists, otherwise return -1.\n- void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.",
                input_format="A series of get and put operations.",
                output_format="Return results of get operations.",
                constraints=json.dumps([
                    "1 <= capacity <= 3000",
                    "0 <= key <= 10^4",
                    "0 <= value <= 10^5",
                    "At most 2 * 10^5 calls will be made to get and put."
                ]),
                examples=json.dumps([
                    {
                        "input": "LRUCache(2), put(1,1), put(2,2), get(1), put(3,3), get(2)",
                        "output": "[null, null, null, 1, null, -1]",
                        "explanation": "The cache evicts key 2."
                    }
                ]),
                starter_code="class LRUCache {\n  constructor(capacity) {\n  }\n\n  get(key) {\n  }\n\n  put(key, value) {\n  }\n}",
                order_matters=True,
                time_limit=30,
                memory_limit=256,
            ),
            Problem(
                id=14,
                title="Serialize and Deserialize Binary Tree",
                difficulty="Hard",
                topics=["Tree", "DFS", "BFS", "Design", "Binary Tree"],
                acceptance=53.2,
                description="Design an algorithm to serialize and deserialize a binary tree. There is no restriction on how your serialization/deserialization algorithm should work.\n\nYou need to ensure a binary tree can be serialized to a string and this string can be deserialized to the original tree structure.",
                input_format="The root of a binary tree.",
                output_format="A serialized string that can be deserialized back to the original tree.",
                constraints=json.dumps([
                    "The number of nodes is in range [0, 10^4]",
                    "-1000 <= Node.val <= 1000"
                ]),
                examples=json.dumps([
                    {
                        "input": "root = [1, 2, 3, null, null, 4, 5]",
                        "output": "[1, 2, 3, null, null, 4, 5]",
                        "explanation": "The serialized form should match the input."
                    }
                ]),
                starter_code="class Codec {\n  serialize(root) {\n  }\n\n  deserialize(data) {\n  }\n}",
                order_matters=True,
                time_limit=30,
                memory_limit=256,
            ),
            Problem(
                id=15,
                title="Trapping Rain Water",
                difficulty="Hard",
                topics=["Array", "Two Pointers", "Stack", "Dynamic Programming"],
                acceptance=58.7,
                description="Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
                input_format="An array of non-negative integers.",
                output_format="Return the total amount of trapped water.",
                constraints=json.dumps([
                    "n == height.length",
                    "1 <= n <= 2 * 10^4",
                    "0 <= height[i] <= 10^5"
                ]),
                examples=json.dumps([
                    {
                        "input": "height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]",
                        "output": "6",
                        "explanation": "6 units of rain water are trapped."
                    }
                ]),
                starter_code="function trap(height) {\n  \n  \n}",
                order_matters=True,
                time_limit=30,
                memory_limit=256,
            ),
            Problem(
                id=16,
                title="Edit Distance",
                difficulty="Hard",
                topics=["Dynamic Programming", "String"],
                acceptance=52.1,
                description="Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.\n\nYou have the following three operations permitted on a word:\n1. Insert a character\n2. Delete a character\n3. Replace a character",
                input_format="Two strings word1 and word2.",
                output_format="Return the minimum number of operations.",
                constraints=json.dumps([
                    "0 <= word1.length, word2.length <= 500",
                    "word1 and word2 consist of lowercase English letters."
                ]),
                examples=json.dumps([
                    {
                        "input": "word1 = \"horse\", word2 = \"ros\"",
                        "output": "3",
                        "explanation": "horse -> rorse (replace 'h' with 'r')\nrorse -> rose (remove 'r')\nrose -> ros (remove 'e')"
                    }
                ]),
                starter_code="function minDistance(word1, word2) {\n  \n  \n}",
                order_matters=True,
                time_limit=30,
                memory_limit=256,
            ),
            Problem(
                id=17,
                title="Median of Two Sorted Arrays",
                difficulty="Hard",
                topics=["Array", "Binary Search", "Divide and Conquer"],
                acceptance=35.8,
                description="Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log (m+n)).",
                input_format="Two sorted arrays of integers.",
                output_format="Return the median as a float.",
                constraints=json.dumps([
                    "nums1.length == m",
                    "nums2.length == n",
                    "0 <= m <= 1000",
                    "0 <= n <= 1000",
                    "1 <= m + n <= 2000",
                    "-10^6 <= nums1[i], nums2[i] <= 10^6"
                ]),
                examples=json.dumps([
                    {
                        "input": "nums1 = [1, 3], nums2 = [2]",
                        "output": "2.0",
                        "explanation": "merged array = [1, 2, 3] and median is 2."
                    },
                    {
                        "input": "nums1 = [1, 2], nums2 = [3, 4]",
                        "output": "2.5",
                        "explanation": "merged array = [1, 2, 3, 4] and median is (2 + 3) / 2 = 2.5."
                    }
                ]),
                starter_code="function findMedianSortedArrays(nums1, nums2) {\n  \n  \n}",
                order_matters=True,
                time_limit=30,
                memory_limit=256,
            ),
            Problem(
                id=18,
                title="Best Time to Buy and Sell Stock",
                difficulty="Easy",
                topics=["Array", "Dynamic Programming"],
                acceptance=54.2,
                description="You are given an array prices where prices[i] is the price of a given stock on the ith day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.",
                input_format="An array of stock prices.",
                output_format="Return the maximum profit.",
                constraints=json.dumps([
                    "1 <= prices.length <= 10^5",
                    "0 <= prices[i] <= 10^4"
                ]),
                examples=json.dumps([
                    {
                        "input": "prices = [7, 1, 5, 3, 6, 4]",
                        "output": "5",
                        "explanation": "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 - 1 = 5."
                    },
                    {
                        "input": "prices = [7, 6, 4, 3, 1]",
                        "output": "0",
                        "explanation": "No transactions are done, max profit = 0."
                    }
                ]),
                starter_code="function maxProfit(prices) {\n  \n  \n}",
                order_matters=True,
                time_limit=30,
                memory_limit=256,
            ),
        ]
        db.add_all(problems)

        puzzles = [
            Puzzle(
                id=1,
                title="Array Mapping",
                difficulty="Easy",
                language="JavaScript",
                code="const nums = [1, 2, 3, 4];\nconst doubled = nums.map(x => x * 2);\nconsole.log(doubled);",
                question="What will be the output of this code?",
                answers=json.dumps(["[1, 2, 3, 4]", "[2, 4, 6, 8]", "[1, 4, 9, 16]", "[2, 3, 4, 5]"]),
                correct_index=1,
                xp=10,
                explanation="The .map() method creates a new array by applying the function to each element. x * 2 doubles each number: [1*2, 2*2, 3*2, 4*2] = [2, 4, 6, 8].",
            ),
            Puzzle(
                id=2,
                title="String Reverse",
                difficulty="Easy",
                language="JavaScript",
                code="const str = 'hello';\nconst reversed = str.split('').reverse().join('');\nconsole.log(reversed);",
                question="What will be the output of this code?",
                answers=json.dumps(["'hello'", "'olleh'", "'hELLO'", "'olleH'"]),
                correct_index=1,
                xp=10,
                explanation="split('') converts string to array of characters, reverse() reverses the array, join('') combines back to string. 'hello' -> ['h','e','l','l','o'] -> ['o','l','l','e','h'] -> 'olleh'.",
            ),
            Puzzle(
                id=3,
                title="Object Destructuring",
                difficulty="Medium",
                language="JavaScript",
                code="const user = { name: 'Alex', age: 25, city: 'NYC' };\nconst { name, ...rest } = user;\nconsole.log(name, rest);",
                question="What will be the output of this code?",
                answers=json.dumps([
                    "'Alex' { age: 25, city: 'NYC' }",
                    "'Alex' { name: 'Alex' }",
                    "undefined { age: 25, city: 'NYC' }",
                    "'Alex' {}"
                ]),
                correct_index=0,
                xp=15,
                explanation="Object destructuring extracts 'name' into a variable and the rest operator ...rest captures all remaining properties into a new object.",
            ),
            Puzzle(
                id=4,
                title="Promise Execution",
                difficulty="Medium",
                language="JavaScript",
                code="const promise = new Promise((resolve) => {\n  resolve('A');\n});\n\npromise.then(val => console.log(val));\nconsole.log('B');",
                question="What will be the order of output?",
                answers=json.dumps(["'A' then 'B'", "'B' then 'A'", "'A' only", "'B' only"]),
                correct_index=1,
                xp=20,
                explanation="Promises are asynchronous. The synchronous code (console.log('B')) runs first, then the .then() callback runs with 'A'.",
            ),
            Puzzle(
                id=5,
                title="Array Filter",
                difficulty="Easy",
                language="JavaScript",
                code="const arr = [1, 2, 3, 4, 5, 6];\nconst result = arr.filter(x => x % 2 === 0);\nconsole.log(result);",
                question="What will be the output of this code?",
                answers=json.dumps(["[1, 3, 5]", "[2, 4, 6]", "[1, 2, 3, 4, 5, 6]", "[]"]),
                correct_index=1,
                xp=10,
                explanation="The .filter() method keeps only elements that pass the test. x % 2 === 0 checks for even numbers, so it keeps 2, 4, 6.",
            ),
            Puzzle(
                id=6,
                title="Closure Scope",
                difficulty="Medium",
                language="JavaScript",
                code="function outer() {\n  let count = 0;\n  return function inner() {\n    count++;\n    return count;\n  };\n}\n\nconst fn = outer();\nconsole.log(fn());\nconsole.log(fn());\nconsole.log(fn());",
                question="What will be the output?",
                answers=json.dumps(["1 1 1", "1 2 3", "0 1 2", "undefined undefined undefined"]),
                correct_index=1,
                xp=20,
                explanation="Closures retain access to their outer scope. The inner function captures 'count' and increments it each time. Each call returns the next value: 1, 2, 3.",
            ),
        ]
        db.add_all(puzzles)

        achievements = [
            Achievement(id="ach-001", name="First Blood", description="Solve your first problem", icon="droplet", condition_key="first_solve"),
            Achievement(id="ach-002", name="Speed Demon", description="Solve a problem in under 5 minutes", icon="zap", condition_key="fast_solve"),
            Achievement(id="ach-003", name="Streak Master", description="Maintain a 7-day solving streak", icon="flame", condition_key="streak_7"),
            Achievement(id="ach-004", name="Duel Champion", description="Win 10 duels", icon="swords", condition_key="wins_10"),
            Achievement(id="ach-005", name="Puzzle Master", description="Solve 20 puzzles", icon="puzzle", condition_key="puzzles_20"),
            Achievement(id="ach-006", name="Hard Hitter", description="Solve 5 hard problems", icon="skull", condition_key="hard_5"),
            Achievement(id="ach-007", name="Social Butterfly", description="Add 5 friends", icon="users", condition_key="friends_5"),
            Achievement(id="ach-008", name="Rising Star", description="Reach 1500 rating", icon="star", condition_key="rating_1500"),
            Achievement(id="ach-009", name="Code Warrior", description="Complete 50 submissions", icon="terminal", condition_key="submissions_50"),
            Achievement(id="ach-010", name="Legend", description="Reach top 10 on leaderboard", icon="crown", condition_key="top_10"),
        ]
        db.add_all(achievements)

        db.commit()
        print("Database seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()
