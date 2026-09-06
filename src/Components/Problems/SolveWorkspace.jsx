import React, { useState, useCallback, useEffect } from "react"
import {
  ChevronLeft,
  Play,
  Send,
  Copy,
  Check,
  X,
  FileCode,
  RotateCcw,
  Zap,
  Clock,
} from "lucide-react"
import MonacoEditor from "../ui/MonacoEditor"
import OutputTerminal from "../ui/OutputTerminal"
import { execute, problems as problemsApi } from "../../api/client"

const difficultyBadge = (d) => {
  if (d === "Easy") return "text-success bg-success/10 border-success/20"
  if (d === "Medium") return "text-warning bg-warning/10 border-warning/20"
  return "text-danger bg-danger/10 border-danger/20"
}

const ProblemPanel = ({ problem }) => (
  <div className="w-[42%] min-w-[320px] flex flex-col border-r border-border bg-base shrink-0">
    <div className="px-5 py-2.5 border-b border-border-subtle flex items-center justify-between">
      <span className="text-[10px] font-sans font-bold text-text-tertiary uppercase tracking-wider">Problem Statement</span>
      <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border uppercase ${difficultyBadge(problem.difficulty)}`}>
        {problem.difficulty}
      </span>
    </div>

    <div className="flex-1 overflow-y-auto p-6 space-y-5 font-sans text-xs">
      <div>
        <h1 className="text-lg font-bold text-text-primary mb-2">{problem.title}</h1>
        <div className="flex flex-wrap gap-1.5">
          {problem.topics.map((t) => (
            <span key={t} className="text-[10px] font-sans font-bold text-text-tertiary bg-surface border border-border px-2.5 py-0.5 rounded-lg">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="text-text-secondary leading-relaxed space-y-2 border-t border-border-subtle pt-4">
        <p className="whitespace-pre-line">{problem.description}</p>
      </div>

      <div className="space-y-2.5 border-t border-border-subtle pt-4">
        <h3 className="text-[10px] font-sans font-bold uppercase tracking-wider text-text-tertiary">
          Examples
        </h3>
        {problem.examples.map((ex, i) => (
          <div key={i} className="rounded-lg bg-surface border border-border overflow-hidden text-[11px]">
            <div className="px-3.5 py-1.5 bg-surface border-b border-border-subtle text-[9px] font-mono font-bold text-text-tertiary uppercase">
              Example {i + 1}
            </div>
            <div className="p-3.5 space-y-2 font-mono">
              <div>
                <span className="text-text-tertiary text-[10px] block mb-0.5">Input:</span>
                <span className="text-text-secondary">{ex.input}</span>
              </div>
              <div>
                <span className="text-text-tertiary text-[10px] block mb-0.5">Output:</span>
                <span className="text-success">{ex.output}</span>
              </div>
              {ex.explanation && (
                <div className="text-text-tertiary text-[10px] font-sans pt-1.5 border-t border-border-subtle">
                  {ex.explanation}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 border-t border-border-subtle pt-4 pb-2">
        <h3 className="text-[10px] font-sans font-bold uppercase tracking-wider text-text-tertiary">
          Constraints
        </h3>
        <ul className="space-y-1 font-mono text-[11px] text-text-tertiary">
          {problem.constraints.map((c, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span className="text-text-tertiary">•</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
)

const CodeEditor = ({ starterCode, onRun, onSubmit, runStatus, submitStatus, onCodeChange }) => {
  const [code, setCode] = useState(starterCode)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCodeChange = (newCode) => {
    setCode(newCode)
    if (onCodeChange) onCodeChange(newCode)
  }

  return (
    <div className="flex-1 flex flex-col bg-base border-r border-border min-w-0">
      <div className="h-10 flex items-center justify-between px-4 bg-void border-b border-border shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-base border border-border border-b-0 rounded-t-lg text-xs font-semibold text-text-primary">
            <FileCode size={13} className="text-text-tertiary" />
            <span className="font-mono text-xs">solution.js</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-text-tertiary">JavaScript</span>
          <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-elevated text-text-tertiary hover:text-text-primary transition-colors" title="Copy code">
            {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      <MonacoEditor
        value={code}
        onChange={handleCodeChange}
        onRun={onRun}
        onSubmit={onSubmit}
      />

      <div className="h-8 flex items-center justify-between px-4 bg-void border-t border-border shrink-0 text-[10px] font-mono text-text-tertiary select-none">
        <div className="flex items-center gap-3">
          <span>JavaScript</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-2">
          {runStatus === "running" && (
            <span className="flex items-center gap-1 text-warning">
              <RotateCcw size={10} className="animate-spin" /> Running tests...
            </span>
          )}
          {runStatus === "passed" && (
            <span className="flex items-center gap-1 text-success">
              <Check size={10} /> Passed
            </span>
          )}
          {runStatus === "failed" && (
            <span className="flex items-center gap-1 text-danger">
              <X size={10} /> Failed
            </span>
          )}
          {submitStatus === "submitting" && (
            <span className="flex items-center gap-1 text-warning">
              <RotateCcw size={10} className="animate-spin" /> Submitting...
            </span>
          )}
          {submitStatus === "submitted" && (
            <span className="flex items-center gap-1 text-success">
              <Check size={10} /> Accepted
            </span>
          )}
          {runStatus === "idle" && submitStatus === "idle" && <span>Ready</span>}
        </div>
      </div>

      <div className="h-14 flex items-center justify-end gap-3 px-4 bg-void border-t border-border shrink-0">
        <button
          onClick={onRun}
          disabled={runStatus === "running" || submitStatus === "submitting"}
          className="flex items-center gap-1.5 px-5 py-2 text-xs font-mono font-bold text-text-secondary bg-elevated hover:bg-border border border-border rounded-xl transition-colors disabled:opacity-50"
        >
          <Play size={12} /> Run
        </button>
        <button
          onClick={onSubmit}
          disabled={runStatus === "running" || submitStatus === "submitting" || submitStatus === "submitted"}
          className="flex items-center gap-1.5 px-6 py-2 text-xs font-mono font-bold text-white bg-success hover:bg-success/80 rounded-xl transition-colors disabled:opacity-50"
        >
          <Send size={12} /> Submit
        </button>
      </div>
    </div>
  )
}

const SolveWorkspace = ({ problem, onBack }) => {
  const [runStatus, setRunStatus] = useState("idle")
  const [submitStatus, setSubmitStatus] = useState("idle")
  const [fullProblem, setFullProblem] = useState(problem)
  const [loading, setLoading] = useState(!problem.examples)
  const [code, setCode] = useState(problem.starterCode || "")
  const [runResults, setRunResults] = useState(null)

  useEffect(() => {
    if (!problem.examples || !problem.starterCode) {
      setLoading(true)
      problemsApi.get(problem.id)
        .then((data) => {
          setFullProblem(data)
          setCode(data.starterCode || "")
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [problem.id])

  const runClientFallback = useCallback((codeToRun, isSubmit = false) => {
    const examples = fullProblem.examples || []
    if (examples.length === 0) {
      return { status: "wrong_answer", testsPassed: 0, testsTotal: 0, runtime: 0, results: [] }
    }

    let fnName = null
    const fnMatch = codeToRun.match(/(?:function|const|let|var)\s+([a-zA-Z0-9_$]+)/)
    if (fnMatch) fnName = fnMatch[1]

    if (!fnName) {
      return {
        status: "wrong_answer",
        testsPassed: 0,
        testsTotal: examples.length,
        runtime: 0,
        results: examples.map((ex, i) => ({
          testCase: i + 1,
          passed: false,
          args: [ex.input],
          expected: ex.output,
          actual: null,
          error: "Could not find function name in code",
          runtime: 0,
        })),
      }
    }

    let userFn
    try {
      const caller = new Function(codeToRun + `\nreturn typeof ${fnName} !== 'undefined' ? ${fnName} : null;`)
      userFn = caller()
    } catch (err) {
      return {
        status: "wrong_answer",
        testsPassed: 0,
        testsTotal: examples.length,
        runtime: 0,
        results: examples.map((ex, i) => ({
          testCase: i + 1,
          passed: false,
          args: [ex.input],
          expected: ex.output,
          actual: null,
          error: `${err.name}: ${err.message}`,
          runtime: 0,
        })),
      }
    }

    const testResults = []
    let allPassed = true
    let totalTime = 0

    const cases = isSubmit ? examples : examples.slice(0, 3)

    for (let i = 0; i < cases.length; i++) {
      const ex = cases[i]
      const inputStr = ex.input
      const outputStr = ex.output

      const rawVals = (inputStr.match(/=\s*(\[.*?\]|\d+|"[^"]*"|'[^']*'|\{.*?\})/g) || [])
        .map(s => s.replace(/^=\s*/, ""))

      const args = []
      for (const v of rawVals) {
        try { args.push(JSON.parse(v)) } catch { args.push(v) }
      }
      if (args.length === 0 && inputStr) {
        args.push(inputStr)
      }

      let expected
      try { expected = JSON.parse(outputStr) } catch { expected = outputStr }

      const start = performance.now()
      let actual = null
      let errorText = ""
      let passed = false

      try {
        actual = userFn(...args)
        if (actual === undefined) {
          errorText = "Function returned undefined. Make sure your function has a return statement."
          actual = "undefined"
          passed = false
        } else {
          const normA = JSON.stringify(actual)
          const normE = JSON.stringify(expected)

          if (Array.isArray(actual) && Array.isArray(expected)) {
            const sortA = JSON.stringify(actual.map(x => Array.isArray(x) ? [...x].sort((a, b) => a - b) : x).sort())
            const sortE = JSON.stringify(expected.map(x => Array.isArray(x) ? [...x].sort((a, b) => a - b) : x).sort())
            passed = sortA === sortE
          } else {
            passed = normA === normE
          }
          if (!passed) errorText = "Wrong Answer"
        }
      } catch (err) {
        errorText = `Runtime Error: ${err.name}: ${err.message}`
        actual = null
        passed = false
      }

      const elapsed = Math.round(performance.now() - start)
      totalTime += elapsed

      if (!passed) allPassed = false

      testResults.push({
        testCase: i + 1,
        passed,
        args,
        expected,
        actual,
        error: errorText,
        runtime: elapsed,
      })
    }

    const passedCount = testResults.filter(r => r.passed).length
    return {
      status: allPassed ? "accepted" : "wrong_answer",
      testsPassed: passedCount,
      testsTotal: testResults.length,
      runtime: Math.round(totalTime / testResults.length) || 1,
      results: testResults,
    }
  }, [fullProblem])

  const handleRun = useCallback(() => {
    setRunStatus("running")
    setRunResults(null)
    execute.run({ problem_id: fullProblem.id, code, language: "javascript" })
      .then((res) => {
        if (!res || res.error) {
          const fallbackRes = runClientFallback(code, false)
          setRunResults(fallbackRes)
          setRunStatus(fallbackRes.status === "accepted" ? "passed" : "failed")
          return
        }
        setRunResults(res)
        setRunStatus(res.status === "accepted" ? "passed" : "failed")
      })
      .catch(() => {
        const fallbackRes = runClientFallback(code, false)
        setRunResults(fallbackRes)
        setRunStatus(fallbackRes.status === "accepted" ? "passed" : "failed")
      })
  }, [fullProblem.id, code, runClientFallback])

  const handleSubmit = useCallback(() => {
    setSubmitStatus("submitting")
    setRunResults(null)
    execute.submit({ problem_id: fullProblem.id, code, language: "javascript" })
      .then((res) => {
        if (!res || res.error) {
          const fallbackRes = runClientFallback(code, true)
          setRunResults(fallbackRes)
          setSubmitStatus(fallbackRes.status === "accepted" ? "submitted" : "idle")
          setTimeout(() => setSubmitStatus("idle"), 3000)
          return
        }
        setRunResults(res)
        setSubmitStatus("submitted")
        setTimeout(() => setSubmitStatus("idle"), 3000)
      })
      .catch(() => {
        const fallbackRes = runClientFallback(code, true)
        setRunResults(fallbackRes)
        setSubmitStatus("submitted")
        setTimeout(() => setSubmitStatus("idle"), 3000)
      })
  }, [fullProblem.id, code, runClientFallback])

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-void text-text-secondary antialiased overflow-hidden items-center justify-center">
        <div className="text-accent font-mono text-sm animate-pulse">Loading problem...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-void text-text-secondary antialiased overflow-hidden">
      <header className="h-14 flex items-center justify-between px-6 bg-void border-b border-border shrink-0 select-none">
        <div className="flex items-center gap-3.5">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-text-tertiary hover:text-text-primary transition-colors">
            <ChevronLeft size={16} />
            <span>Problems</span>
          </button>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-primary font-sans">{fullProblem.title}</span>
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${difficultyBadge(fullProblem.difficulty)}`}>
              {fullProblem.difficulty}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-surface border border-border px-3.5 py-1.5 rounded-xl text-xs font-mono text-text-tertiary">
            <span className="flex items-center gap-1.5"><Clock size={14} className="text-success" /> {problem?.timeLimit ? `${Math.floor(problem.timeLimit / 60)}:${String(problem.timeLimit % 60).padStart(2, '0')}` : '30:00'}</span>
            <span className="w-px h-3 bg-border" />
            <span className="flex items-center gap-1.5"><Zap size={14} className="text-warning" /> {problem?.memoryLimit || 256} MB</span>
          </div>
          <span className="text-xs font-mono font-bold text-text-tertiary bg-surface border border-border px-3 py-1 rounded-lg">
            #{fullProblem.id}
          </span>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden p-4 gap-4">
        <div className="w-full flex border border-border rounded-2xl overflow-hidden bg-base">
          <ProblemPanel problem={fullProblem} />
          <CodeEditor
            starterCode={fullProblem.starterCode}
            onRun={handleRun}
            onSubmit={handleSubmit}
            runStatus={runStatus}
            submitStatus={submitStatus}
            onCodeChange={setCode}
          />
        </div>
      </div>

      <OutputTerminal
        status={runStatus !== "idle" ? runStatus : submitStatus !== "idle" ? submitStatus : "idle"}
        results={runResults}
      />
    </div>
  )
}

export default SolveWorkspace
