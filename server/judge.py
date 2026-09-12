import json
import subprocess
import tempfile
import os
import time
from typing import Optional
from database import get_db
from models import Problem

TIMEOUT_SECONDS = 5

NODE_TEMPLATE = """
const userCode = process.argv[2];
const testCasesJson = process.argv[3];
const metadataJson = process.argv[4] || '{}';

function ListNode(val, next) {
  this.val = (val === undefined ? 0 : val);
  this.next = (next === undefined ? null : next);
}

function TreeNode(val, left, right) {
  this.val = (val === undefined ? 0 : val);
  this.left = (left === undefined ? null : left);
  this.right = (right === undefined ? null : right);
}

function deserialize(value, typeStr) {
  if (value === null || value === undefined) {
    if (typeStr === 'linked_list' || typeStr === 'binary_tree') return null;
    return value;
  }

  if (typeStr === 'linked_list') {
    if (!Array.isArray(value) || value.length === 0) return null;
    let dummy = new ListNode(0);
    let curr = dummy;
    for (let i = 0; i < value.length; i++) {
      const v = (value[i] !== null && typeof value[i] === 'object') ? null : value[i];
      curr.next = new ListNode(v);
      curr = curr.next;
    }
    return dummy.next;
  }

  if (typeStr === 'binary_tree') {
    if (!Array.isArray(value) || value.length === 0 || value[0] === null) return null;
    let root = new TreeNode(value[0]);
    let queue = [root];
    let i = 1;
    while (queue.length > 0 && i < value.length) {
      let node = queue.shift();
      if (node !== null) {
        if (i < value.length && value[i] !== null && value[i] !== undefined) {
          node.left = new TreeNode(value[i]);
          queue.push(node.left);
        } else {
          node.left = null;
        }
        i++;

        if (i < value.length && value[i] !== null && value[i] !== undefined) {
          node.right = new TreeNode(value[i]);
          queue.push(node.right);
        } else {
          node.right = null;
        }
        i++;
      }
    }
    return root;
  }

  if (typeStr === 'matrix' || typeStr === 'array') {
    if (Array.isArray(value)) {
      return JSON.parse(JSON.stringify(value));
    }
  }

  return value;
}

function serialize(value, typeStr) {
  if (value === null || value === undefined) {
    if (typeStr === 'linked_list' || typeStr === 'binary_tree') return [];
    return value;
  }

  let effectiveType = typeStr;
  if (!effectiveType || effectiveType === 'auto') {
    if (typeof value === 'object') {
      if ('val' in value && 'next' in value) effectiveType = 'linked_list';
      else if ('val' in value && ('left' in value || 'right' in value)) effectiveType = 'binary_tree';
    }
  }

  if (effectiveType === 'linked_list') {
    if (!(typeof value === 'object' && value !== null && 'val' in value)) {
      return Array.isArray(value) ? value : [];
    }
    let res = [];
    let curr = value;
    let visited = new Set();
    const MAX_NODES = 10000;
    while (curr !== null && curr !== undefined && typeof curr === 'object' && res.length < MAX_NODES) {
      if (visited.has(curr)) break;
      visited.add(curr);
      res.push(curr.val);
      curr = curr.next;
    }
    return res;
  }

  if (effectiveType === 'binary_tree') {
    if (!(typeof value === 'object' && 'val' in value)) {
      return Array.isArray(value) ? value : [];
    }
    let res = [];
    let queue = [value];
    let visited = new Set();
    const MAX_NODES = 10000;

    while (queue.length > 0 && res.length < MAX_NODES) {
      let node = queue.shift();
      if (node !== null && node !== undefined) {
        if (visited.has(node)) break;
        visited.add(node);
        res.push(node.val);
        queue.push(node.left !== undefined ? node.left : null);
        queue.push(node.right !== undefined ? node.right : null);
      } else {
        res.push(null);
      }
    }
    while (res.length > 0 && res[res.length - 1] === null) {
      res.pop();
    }
    return res;
  }

  return value;
}

function compareOutputs(actual, expected, returnType, orderMatters, isMutation, mutatedArgVal) {
  let finalActual = isMutation ? mutatedArgVal : actual;

  let serActual = serialize(finalActual, returnType);
  let serExpected = serialize(expected, returnType);

  if (serActual === serExpected) return true;

  if (typeof serActual === 'number' && typeof serExpected === 'number') {
    return Math.abs(serActual - serExpected) < 1e-5;
  }

  if (Array.isArray(serActual) && Array.isArray(serExpected)) {
    if (serActual.length !== serExpected.length) return false;

    if (!orderMatters && serActual.every(x => typeof x !== 'object')) {
      let sortedActual = [...serActual].sort();
      let sortedExpected = [...serExpected].sort();
      return JSON.stringify(sortedActual) === JSON.stringify(sortedExpected);
    }

    return JSON.stringify(serActual) === JSON.stringify(serExpected);
  }

  return JSON.stringify(serActual) === JSON.stringify(serExpected);
}

try {
  const testCases = JSON.parse(testCasesJson);
  const metadata = JSON.parse(metadataJson);
  const paramTypes = metadata.paramTypes || [];
  const returnType = metadata.returnType || 'auto';
  const isMutation = !!metadata.isMutation;
  const mutateArg = metadata.mutateArg || 0;
  const orderMatters = metadata.orderMatters !== false;

  let userFn;
  try {
    const fnMatch = userCode.match(/(?:function\\s+(\\w+)|class\\s+(\\w+))/);
    if (!fnMatch) throw new Error("No function or class definition found in solution code");
    const entityName = fnMatch[1] || fnMatch[2];
    const evaluator = new Function("ListNode", "TreeNode", `${userCode}\\nreturn ${entityName};`);
    userFn = evaluator(ListNode, TreeNode);
  } catch (e) {
    console.log(JSON.stringify({
      status: "compilation_error",
      error: e.message || String(e),
      testsPassed: 0,
      testsTotal: 0,
      runtime: 0,
      results: []
    }));
    process.exit(0);
  }

  let instance = null;
  let fnToCall = userFn;
  if (typeof userFn === 'function' && userFn.toString().startsWith('class')) {
    try {
      instance = new userFn();
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance)).filter(m => m !== 'constructor');
      if (methods.length > 0) {
        fnToCall = instance[methods[0]].bind(instance);
      }
    } catch (e) {}
  }

  const results = [];
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const rawArgs = tc.args || [];

    const deserializedArgs = rawArgs.map((arg, idx) => {
      const pType = paramTypes[idx] || 'auto';
      return deserialize(arg, pType);
    });

    // Cycle support (LeetCode convention): a trailing integer arg that the
    // function does not declare is treated as `pos` — the index the list
    // tail connects to (-1 = no cycle). It is consumed by the harness and
    // never passed to the user function. Only applies to linked-list
    // problems with a scalar (boolean) return type.
    let callArgs = deserializedArgs;
    const lastIdx = deserializedArgs.length - 1;
    if (
      returnType === 'boolean' &&
      lastIdx > 0 &&
      typeof deserializedArgs[lastIdx] === 'number' &&
      Number.isInteger(deserializedArgs[lastIdx]) &&
      paramTypes.some((t) => t === 'linked_list')
    ) {
      const pos = deserializedArgs[lastIdx];
      for (let k = lastIdx - 1; k >= 0; k--) {
        const pTypeK = paramTypes[k] || 'auto';
        const candidate = deserializedArgs[k];
        if (
          (pTypeK === 'linked_list' || pTypeK === 'auto') &&
          candidate !== null && typeof candidate === 'object' && 'next' in candidate
        ) {
          if (pos >= 0) {
            let target = candidate;
            for (let s = 0; s < pos && target !== null && typeof target === 'object'; s++) {
              target = target.next;
            }
            if (target !== null && typeof target === 'object') {
              let tail = candidate;
              let guard = 0;
              while (tail !== null && typeof tail === 'object' && tail.next !== null && typeof tail.next === 'object' && guard++ < 10000) {
                tail = tail.next;
              }
              if (tail !== null && typeof tail === 'object') tail.next = target;
            }
          }
          break;
        }
      }
      if (typeof fnToCall === 'function' && fnToCall.length < deserializedArgs.length) {
        callArgs = deserializedArgs.slice(0, lastIdx);
      }
    }

    const start = Date.now();
    let rawActual, error = null;
    try {
      rawActual = fnToCall(...callArgs);
    } catch (e) {
      error = e.message || String(e);
    }
    const runtime = Date.now() - start;

    let mutatedArgVal = undefined;
    if (isMutation && deserializedArgs.length > mutateArg) {
      mutatedArgVal = deserializedArgs[mutateArg];
    }

    const serializedActual = isMutation ? serialize(mutatedArgVal, paramTypes[mutateArg] || 'auto') : serialize(rawActual, returnType);
    const passed = !error && compareOutputs(rawActual, tc.expected, returnType, orderMatters, isMutation, mutatedArgVal);

    results.push({
      testCase: i + 1,
      passed: passed,
      args: tc.args,
      expected: tc.expected,
      actual: serializedActual,
      error: error,
      runtime: runtime
    });
  }

  const passed = results.filter(r => r.passed).length;
  console.log(JSON.stringify({
    status: passed === results.length ? "accepted" : "wrong_answer",
    testsPassed: passed,
    testsTotal: results.length,
    runtime: Math.round(results.reduce((s, r) => s + r.runtime, 0) / (results.length || 1)),
    results: results
  }));
} catch (e) {
  console.log(JSON.stringify({
    status: "compilation_error",
    error: e.message || String(e),
    testsPassed: 0,
    testsTotal: 0,
    runtime: 0,
    results: []
  }));
}
"""


def parse_test_input(input_str: str):
    """Parse test input like 'nums = [2, 7, 11, 15], target = 9' -> [[2,7,11,15], 9]"""
    args = []
    input_str = input_str.strip()

    i = 0
    while i < len(input_str):
        if input_str[i] == '=':
            value_start = i + 1
            while value_start < len(input_str) and input_str[value_start] == ' ':
                value_start += 1

            j = value_start
            depth = 0
            in_string = False
            string_char = None

            while j < len(input_str):
                c = input_str[j]
                if in_string:
                    if c == '\\':
                        j += 2
                        continue
                    if c == string_char:
                        in_string = False
                else:
                    if c in '"\'':
                        in_string = True
                        string_char = c
                    elif c in '([{':
                        depth += 1
                    elif c in ')]}':
                        if depth == 0:
                            break
                        depth -= 1
                    elif c == ',' and depth == 0:
                        break
                j += 1

            value_str = input_str[value_start:j].strip()
            args.append(parse_value(value_str))
            i = j + 1
        else:
            i += 1

    return args


def parse_value(value_str: str):
    """Parse a value string into a Python object"""
    value_str = value_str.strip()

    if value_str.startswith('[') and value_str.endswith(']'):
        inner = value_str[1:-1].strip()
        if not inner:
            return []
        return [parse_value(v.strip()) for v in split_args(inner)]
    elif value_str.startswith('"') and value_str.endswith('"'):
        return value_str[1:-1]
    elif value_str.startswith("'") and value_str.endswith("'"):
        return value_str[1:-1]
    elif value_str in ('true', 'True'):
        return True
    elif value_str in ('false', 'False'):
        return False
    elif value_str in ('null', 'None'):
        return None
    elif '.' in value_str:
        try:
            return float(value_str)
        except ValueError:
            return value_str
    else:
        try:
            return int(value_str)
        except ValueError:
            try:
                return float(value_str)
            except ValueError:
                return value_str


def split_args(s: str):
    """Split a string by commas, respecting brackets and quotes"""
    args = []
    depth = 0
    current = []
    in_string = False
    string_char = None

    for c in s:
        if in_string:
            current.append(c)
            if c == '\\':
                continue
            if c == string_char:
                in_string = False
        else:
            if c in '"\'':
                in_string = True
                string_char = c
                current.append(c)
            elif c in '([{':
                depth += 1
                current.append(c)
            elif c in ')]}':
                depth -= 1
                current.append(c)
            elif c == ',' and depth == 0:
                args.append(''.join(current).strip())
                current = []
            else:
                current.append(c)

    if current:
        args.append(''.join(current).strip())

    return args


def parse_expected_output(output_str: str):
    """Parse expected output like '[0, 1]' -> [0, 1]"""
    output_str = output_str.strip()
    return parse_value(output_str)


def get_test_problems(count: int = 5) -> list:
    """Get test problems for duel mode"""
    return [
        {
            "id": "test_1",
            "title": "Hello World",
            "description": "Return the string 'Hello, World!'",
            "function_name": "helloWorld",
            "test_cases": [
                {"args": [], "expected": "Hello, World!"}
            ],
            "difficulty": "easy",
            "param_types": [],
            "return_type": "string"
        },
        {
            "id": "test_2",
            "title": "Add Two Numbers",
            "description": "Return the sum of two numbers",
            "function_name": "add",
            "test_cases": [
                {"args": [2, 3], "expected": 5},
                {"args": [-1, 1], "expected": 0},
                {"args": [0, 0], "expected": 0}
            ],
            "difficulty": "easy",
            "param_types": ["number", "number"],
            "return_type": "number"
        },
        {
            "id": "test_3",
            "title": "Double Input",
            "description": "Return the input number multiplied by 2",
            "function_name": "double",
            "test_cases": [
                {"args": [5], "expected": 10},
                {"args": [-3], "expected": -6},
                {"args": [0], "expected": 0}
            ],
            "difficulty": "easy",
            "param_types": ["number"],
            "return_type": "number"
        },
        {
            "id": "test_4",
            "title": "Return the String",
            "description": "Return the same string that was passed in",
            "function_name": "returnString",
            "test_cases": [
                {"args": ["hello"], "expected": "hello"},
                {"args": [""], "expected": ""},
                {"args": ["test123"], "expected": "test123"}
            ],
            "difficulty": "easy",
            "param_types": ["string"],
            "return_type": "string"
        },
        {
            "id": "test_5",
            "title": "Is Positive",
            "description": "Return true if the number is positive, false otherwise",
            "function_name": "isPositive",
            "test_cases": [
                {"args": [5], "expected": True},
                {"args": [-5], "expected": False},
                {"args": [0], "expected": False}
            ],
            "difficulty": "easy",
            "param_types": ["number"],
            "return_type": "boolean"
        }
    ][:count]


def execute_judge(
    code: str,
    test_cases: list,
    param_types: list = None,
    return_type: str = "auto",
    is_mutation: bool = False,
    mutate_arg: int = 0,
    order_matters: bool = True,
    time_limit: int = 5
) -> dict:
    """Execute code using Node.js subprocess with type-awareness"""
    metadata = {
        "paramTypes": param_types or [],
        "returnType": return_type or "auto",
        "isMutation": is_mutation,
        "mutateArg": mutate_arg,
        "orderMatters": order_matters
    }
    return _execute_code(code, test_cases, metadata, time_limit)


def judge_code(code: str, problem_id: int, mode: str = "submit") -> dict:
    """Judge user code against problem test cases"""
    start_time = time.time()
    db_gen = get_db()
    db = next(db_gen)

    try:
        problem = db.query(Problem).filter(Problem.id == problem_id).first()
        if not problem:
            return {
                "status": "error",
                "error": "Problem not found",
                "tests_passed": 0,
                "tests_total": 0,
                "runtime": 0,
                "results": []
            }

        raw_examples = problem.examples
        if isinstance(raw_examples, str):
            raw_examples = json.loads(raw_examples)
        raw_examples = raw_examples or []

        test_cases = []
        for example in (raw_examples[:3] if mode == "run" else raw_examples):
            args = parse_test_input(example.get("input", ""))
            expected = parse_expected_output(example.get("output", ""))
            test_cases.append({"args": args, "expected": expected})

        if not test_cases:
            return {
                "status": "error",
                "error": "No test cases found for this problem",
                "tests_passed": 0,
                "tests_total": 0,
                "runtime": 0,
                "results": []
            }

        param_types = problem.param_types or []
        if isinstance(param_types, str):
            param_types = json.loads(param_types)

        res = execute_judge(
            code=code,
            test_cases=test_cases,
            param_types=param_types,
            return_type=problem.return_type or "auto",
            is_mutation=problem.is_mutation or False,
            mutate_arg=problem.mutate_arg or 0,
            order_matters=problem.order_matters if problem.order_matters is not None else True,
            time_limit=problem.time_limit or 5
        )
        res["runtime"] = round((time.time() - start_time) * 1000)
        return res

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "tests_passed": 0,
            "tests_total": 0,
            "runtime": 0,
            "results": []
        }
    finally:
        db.close()


def judge_test_problem(code: str, problem: dict) -> dict:
    """Judge code against a test problem (for duel mode)"""
    start_time = time.time()
    try:
        test_cases = problem.get("test_cases", [])
        param_types = problem.get("param_types", [])
        return_type = problem.get("return_type", "auto")
        is_mutation = problem.get("is_mutation", False)
        mutate_arg = problem.get("mutate_arg", 0)
        order_matters = problem.get("order_matters", True)

        res = execute_judge(
            code=code,
            test_cases=test_cases,
            param_types=param_types,
            return_type=return_type,
            is_mutation=is_mutation,
            mutate_arg=mutate_arg,
            order_matters=order_matters
        )
        res["runtime"] = round((time.time() - start_time) * 1000)
        return res
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "tests_passed": 0,
            "tests_total": 0,
            "runtime": 0,
            "results": []
        }


def _execute_code(code: str, test_cases: list, metadata: dict = None, time_limit: int = 5) -> dict:
    """Execute code using Node.js subprocess"""
    try:
        test_cases_json = json.dumps(test_cases)
        metadata_json = json.dumps(metadata or {})

        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.js',
            delete=False,
            dir=tempfile.gettempdir()
        ) as f:
            f.write(NODE_TEMPLATE)
            script_path = f.name

        try:
            result = subprocess.run(
                ["node", script_path, code, test_cases_json, metadata_json],
                capture_output=True,
                text=True,
                timeout=time_limit or TIMEOUT_SECONDS
            )

            if result.returncode != 0:
                return {
                    "status": "compilation_error",
                    "error": result.stderr.strip() or "Execution failed",
                    "testsPassed": 0,
                    "testsTotal": len(test_cases),
                    "tests_passed": 0,
                    "tests_total": len(test_cases),
                    "runtime": 0,
                    "results": []
                }

            output = result.stdout.strip()
            if not output:
                return {
                    "status": "compilation_error",
                    "error": "No output from judge",
                    "testsPassed": 0,
                    "testsTotal": len(test_cases),
                    "tests_passed": 0,
                    "tests_total": len(test_cases),
                    "runtime": 0,
                    "results": []
                }

            return json.loads(output)

        except subprocess.TimeoutExpired:
            return {
                "status": "timeout",
                "error": f"Execution timed out after {time_limit or TIMEOUT_SECONDS} seconds",
                "testsPassed": 0,
                "testsTotal": len(test_cases),
                "tests_passed": 0,
                "tests_total": len(test_cases),
                "runtime": (time_limit or TIMEOUT_SECONDS) * 1000,
                "results": []
            }
        finally:
            if os.path.exists(script_path):
                os.unlink(script_path)

    except json.JSONDecodeError as e:
        return {
            "status": "compilation_error",
            "error": f"Failed to parse judge output: {str(e)}",
            "testsPassed": 0,
            "testsTotal": len(test_cases),
            "tests_passed": 0,
            "tests_total": len(test_cases),
            "runtime": 0,
            "results": []
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "testsPassed": 0,
            "testsTotal": len(test_cases),
            "tests_passed": 0,
            "tests_total": len(test_cases),
            "runtime": 0,
            "results": []
        }
