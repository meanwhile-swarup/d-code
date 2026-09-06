import React, { useState, useEffect, useRef } from "react"
import { Terminal, ChevronUp, ChevronDown, Check, X, RotateCcw } from "lucide-react"

const OutputTerminal = ({ status, results }) => {
  const [expanded, setExpanded] = useState(true)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [results])

  if (status === "idle" && !results) return null

  const renderResults = () => {
    if (!results) {
      if (status === "running") {
        return [{ type: "info", text: "> Running tests..." }]
      }
      if (status === "failed") {
        return [{ type: "error", text: "> Execution failed. Check your code and try again." }]
      }
      return null
    }

    if (results.error) {
      return [{ type: "error", text: `> ${results.error}` }]
    }

    const lines = []
    const testsTotal = results.testsTotal || 0
    const testsPassed = results.testsPassed || 0
    const runtime = results.runtime || 0
    const testResults = Array.isArray(results.results) ? results.results : []

    lines.push({ type: "info", text: `> Running ${testsTotal} test(s)...` })
    lines.push({ type: "info", text: "" })

    for (const r of testResults) {
      if (r.passed) {
        lines.push({ type: "success", text: `  Test ${r.testCase}: PASSED (${r.runtime}ms)` })
      } else {
        lines.push({ type: "error", text: `  Test ${r.testCase}: FAILED` })
        if (r.args) {
          lines.push({ type: "info", text: `    Input: ${JSON.stringify(r.args)}` })
        }
        if (r.expected !== undefined) {
          lines.push({ type: "info", text: `    Expected: ${JSON.stringify(r.expected)}` })
        }
        if (r.error) {
          lines.push({ type: "error", text: `    ${r.error}` })
        }
        if (r.actual !== undefined && r.actual !== null) {
          lines.push({ type: "warn", text: `    Actual: ${typeof r.actual === 'object' ? JSON.stringify(r.actual) : String(r.actual)}` })
        } else if (!r.error) {
          lines.push({ type: "warn", text: `    Actual: undefined` })
        }
      }
    }

    lines.push({ type: "info", text: "" })
    if (results.status === "accepted") {
      lines.push({ type: "success", text: `All ${testsPassed}/${testsTotal} tests passed! (${runtime}ms avg)` })
    } else {
      lines.push({ type: "error", text: `${testsPassed}/${testsTotal} tests passed` })
    }

    return lines
  }

  const outputLines = renderResults()

  return (
    <div className="border-t border-border bg-void shrink-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full h-9 flex items-center justify-between px-4 hover:bg-base transition-colors select-none cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Terminal size={13} className={
            status === "running" ? "text-warning" :
            status === "passed" || (results && results.status === "accepted") ? "text-success" :
            "text-danger"
          } />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-tertiary">
            Output
          </span>
          {status === "running" && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-warning">
              <RotateCcw size={10} className="animate-spin" /> Running...
            </span>
          )}
          {results && results.status === "accepted" && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-success">
              <Check size={10} /> Passed
            </span>
          )}
          {results && results.status !== "accepted" && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-danger">
              <X size={10} /> Failed
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown size={14} className="text-text-tertiary" /> : <ChevronUp size={14} className="text-text-tertiary" />}
        </div>
      </button>

      {expanded && (
        <div
          ref={scrollRef}
          className="max-h-[150px] overflow-y-auto px-4 pb-3 font-mono text-[11px] leading-5"
        >
          {outputLines && outputLines.map((line, i) => (
            <div
              key={i}
              className={`whitespace-pre-wrap py-px ${
                line.type === "error"
                  ? "text-danger"
                  : line.type === "warn"
                  ? "text-warning"
                  : line.type === "success"
                  ? "text-success"
                  : "text-text-secondary"
              }`}
            >
              {line.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OutputTerminal
