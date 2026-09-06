import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  ChevronLeft,
  Play,
  Send,
  FileCode,
  RotateCcw,
  Check,
  X,
} from "lucide-react"
import { GamepadIcon, TimerIcon } from "../ui/Icons"
import MonacoEditor from "../ui/MonacoEditor"
import OutputTerminal from "../ui/OutputTerminal"
import { problems as problemsApi } from "../../api/client"

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

const difficultyColor = (d) => {
  if (d === "Easy") return "text-success bg-success/10 border-success/20"
  if (d === "Medium") return "text-warning bg-warning/10 border-warning/20"
  return "text-danger bg-danger/10 border-danger/20"
}

const MatchHeader = ({ timeLeft, onLeave, problem }) => {
  const isLowTime = timeLeft < 60
  const isCriticalTime = timeLeft < 30

  return (
    <header className="h-[72px] flex items-center justify-between px-5 bg-void border-b border-border shrink-0 select-none">
      <div className="flex items-center gap-3 min-w-[200px]">
        <button
          onClick={onLeave}
          className="flex items-center gap-1.5 text-xs font-sans font-bold text-text-tertiary hover:text-text-primary transition-colors duration-150"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Exit</span>
        </button>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-info bg-info/10 border border-info/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <GamepadIcon size={12} className="text-text-tertiary" /> Practice
          </span>
          {problem?.difficulty && (
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider border px-2 py-1 rounded-lg ${difficultyColor(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center flex-1">
        <div className={`flex items-center gap-3 px-6 py-2.5 rounded-xl border transition-all duration-300 ${
          isCriticalTime
            ? "bg-danger/10 border-danger/30 text-danger"
            : isLowTime
              ? "bg-warning/10 border-warning/30 text-warning"
              : "bg-surface border-border text-text-primary"
        }`}>
          <TimerIcon size={16} className={isCriticalTime ? "animate-pulse" : ""} />
          <span className={`text-xl font-mono font-bold tabular-nums ${isCriticalTime ? "animate-pulse" : ""}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end min-w-[200px]">
        <button
          onClick={onLeave}
          className="flex items-center gap-1.5 text-xs font-sans font-bold text-text-tertiary hover:text-danger transition-colors duration-150 px-3 py-2 rounded-xl hover:bg-danger/10"
        >
          Leave
        </button>
      </div>
    </header>
  )
}

const ProblemPanel = ({ problem }) => {
  if (!problem) return (
    <div className="flex-[3] min-w-[280px] flex flex-col border-r border-border bg-base shrink-0 items-center justify-center">
      <span className="text-xs text-text-tertiary animate-pulse">Loading problem...</span>
    </div>
  )

  return (
    <div className="flex-[3] min-w-[280px] flex flex-col border-r border-border bg-base shrink-0">
      <div className="px-4 py-2.5 border-b border-border-subtle flex items-center justify-between">
        <span className="text-[10px] font-sans font-bold text-text-tertiary uppercase tracking-wider">Problem Statement</span>
        <span className="text-[10px] font-mono text-text-tertiary">Practice</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
        <div>
          <h1 className="text-base font-bold text-text-primary mb-1">{problem.title}</h1>
          <div className="flex items-center gap-3 text-[10px] font-mono text-text-tertiary">
            <span className={`px-1.5 py-0.5 rounded border ${difficultyColor(problem.difficulty)}`}>{problem.difficulty}</span>
          </div>
        </div>

        <div className="text-text-secondary leading-relaxed space-y-2 border-t border-border-subtle pt-3">
          <p className="whitespace-pre-line">{problem.description}</p>
        </div>

        {problem.inputFormat && (
          <div className="space-y-1.5 border-t border-border-subtle pt-3">
            <h3 className="text-[10px] font-sans font-bold uppercase tracking-wider text-text-tertiary">Input Format</h3>
            <p className="text-text-secondary font-mono text-[11px] bg-surface rounded-md p-2 border border-border">{problem.inputFormat}</p>
          </div>
        )}

        {problem.outputFormat && (
          <div className="space-y-1.5 border-t border-border-subtle pt-3">
            <h3 className="text-[10px] font-sans font-bold uppercase tracking-wider text-text-tertiary">Output Format</h3>
            <p className="text-text-secondary font-mono text-[11px] bg-surface rounded-md p-2 border border-border">{problem.outputFormat}</p>
          </div>
        )}

        {problem.examples?.length > 0 && (
          <div className="space-y-2 border-t border-border-subtle pt-3">
            <h3 className="text-[10px] font-sans font-bold uppercase tracking-wider text-text-tertiary">Examples</h3>
            {problem.examples.map((ex, i) => (
              <div key={i} className="rounded-md bg-surface border border-border overflow-hidden text-[11px]">
                <div className="px-2.5 py-1 bg-surface border-b border-border-subtle text-[9px] font-mono font-bold text-text-tertiary uppercase">
                  Example {i + 1}
                </div>
                <div className="p-2.5 space-y-1.5 font-mono">
                  <div>
                    <span className="text-text-tertiary text-[10px] block">IN:</span>
                    <span className="text-text-secondary">{ex.input}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary text-[10px] block">OUT:</span>
                    <span className="text-success">{ex.output}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const CasualDuelPage = ({ onBack }) => {
  const [timeLeft, setTimeLeft] = useState(1200)
  const [runStatus, setRunStatus] = useState("idle")
  const [submitStatus, setSubmitStatus] = useState("idle")
  const [runResults, setRunResults] = useState(null)
  const [code, setCode] = useState("")
  const [problem, setProblem] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    problemsApi.list().then((res) => {
      const allProblems = res?.problems || []
      if (allProblems.length > 0) {
        const random = allProblems[Math.floor(Math.random() * allProblems.length)]
        problemsApi.get(random.id).then((p) => {
          setProblem(p)
          setCode(p.starterCode || "")
        })
      }
    }).catch(() => {})

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0))
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleRun = useCallback(() => {
    if (!problem) return
    setRunStatus("running")
    setRunResults(null)
    const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
    const token = localStorage.getItem("dcode_token")
    fetch(`${BASE}/api/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
      body: JSON.stringify({ problem_id: problem.id, code, language: "javascript", mode: "run" }),
    })
      .then(r => r.json())
      .then(json => {
        const res = json.data !== undefined ? json.data : json
        setRunResults(res)
        setRunStatus(res.status === "accepted" ? "passed" : "failed")
      })
      .catch(() => setRunStatus("failed"))
  }, [code, problem])

  const handleSubmit = useCallback(() => {
    if (!problem) return
    setSubmitStatus("submitting")
    setRunResults(null)
    const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
    const token = localStorage.getItem("dcode_token")
    fetch(`${BASE}/api/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
      body: JSON.stringify({ problem_id: problem.id, code, language: "javascript", mode: "submit" }),
    })
      .then(r => r.json())
      .then(json => {
        const res = json.data !== undefined ? json.data : json
        setRunResults(res)
        setSubmitStatus("submitted")
        setTimeout(() => setSubmitStatus("idle"), 3000)
      })
      .catch(() => setSubmitStatus("idle"))
  }, [code, problem])

  return (
    <div className="flex flex-col h-screen bg-void text-text-secondary antialiased overflow-hidden">
      <MatchHeader timeLeft={timeLeft} onLeave={onBack} problem={problem} />

      <div className="flex-1 flex min-h-0 overflow-hidden p-4 gap-4">
        <div className="flex-1 flex border border-border rounded-2xl overflow-hidden bg-base">
          <ProblemPanel problem={problem} />
          <div className="flex-[5] flex flex-col bg-base min-w-0">
            <div className="h-10 flex items-center justify-between px-4 bg-void border-b border-border shrink-0 select-none">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-base border border-border border-b-0 rounded-t-lg text-xs font-semibold text-text-primary">
                  <FileCode size={13} className="text-accent" />
                  <span className="font-mono text-xs">solution.js</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-text-tertiary">JavaScript (Practice)</span>
            </div>
            <MonacoEditor value={code} onChange={setCode} onRun={handleRun} onSubmit={handleSubmit} />
            <div className="h-8 flex items-center justify-between px-4 bg-void border-t border-border shrink-0 text-[10px] font-mono text-text-tertiary select-none">
              <div className="flex items-center gap-3">
                <span>JavaScript</span>
                <span>UTF-8</span>
              </div>
              <div className="flex items-center gap-2">
                {runStatus === "running" && <span className="flex items-center gap-1 text-warning"><RotateCcw size={10} className="animate-spin" /> Running...</span>}
                {runStatus === "passed" && <span className="flex items-center gap-1 text-success"><Check size={10} /> Passed</span>}
                {runStatus === "failed" && <span className="flex items-center gap-1 text-danger"><X size={10} /> Failed</span>}
                {submitStatus === "submitting" && <span className="flex items-center gap-1 text-warning"><RotateCcw size={10} className="animate-spin" /> Submitting...</span>}
                {runStatus === "idle" && submitStatus === "idle" && <span>Ready</span>}
              </div>
            </div>
            <OutputTerminal
              status={runStatus !== "idle" ? runStatus : submitStatus !== "idle" ? submitStatus : "idle"}
              results={runResults}
            />
            <div className="h-14 flex items-center justify-end gap-3 px-4 bg-void border-t border-border shrink-0">
              <button onClick={handleRun} disabled={runStatus === "running"} className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-sans font-bold text-text-secondary bg-elevated hover:bg-border border border-border rounded-xl transition-all duration-150 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]">
                <Play size={12} /> Run
              </button>
              <button onClick={handleSubmit} disabled={submitStatus === "submitting"} className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-sans font-bold text-white bg-success hover:bg-success/80 rounded-xl transition-all duration-200 shadow-lg shadow-success/20 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]">
                <Send size={12} /> Submit
              </button>
            </div>
          </div>
          <div className="flex-[2] min-w-[220px] flex flex-col bg-base border-l border-border shrink-0 p-4 space-y-4">
            <div className="bg-surface border border-border rounded-xl p-4">
              <span className="text-[10px] font-sans font-bold text-text-tertiary uppercase tracking-wider block">Practice Mode</span>
              <p className="text-xs text-text-tertiary mt-2 font-sans">No rating changes. Train your speed and problem-solving skills with server-side judging.</p>
            </div>
            {problem && (
              <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-sans font-bold text-text-tertiary uppercase tracking-wider block">Problem Info</span>
                <div className="space-y-1.5 text-[10px] font-mono">
                  <div className="flex justify-between"><span className="text-text-tertiary">ID</span><span className="text-text-secondary">{problem.id}</span></div>
                  <div className="flex justify-between"><span className="text-text-tertiary">Difficulty</span><span className={difficultyColor(problem.difficulty).split(" ")[0]}>{problem.difficulty}</span></div>
                  <div className="flex justify-between"><span className="text-text-tertiary">Tests</span><span className="text-text-secondary">{problem.examples?.length || 0}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CasualDuelPage
