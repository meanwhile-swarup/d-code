import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  ChevronLeft,
  Play,
  Send,
  Copy,
  Check,
  AlertTriangle,
  X,
  FileCode,
  RotateCcw,
  Loader,
  Hash,
} from "lucide-react"
import {
  SwordsIcon,
  LightningIcon,
  FlameIcon,
  CrownIcon,
  ShieldIcon,
  HandshakeIcon,
  TargetIcon,
  GaugeIcon,
  MedalIcon,
  FlaskIcon,
  TimerIcon,
} from "../ui/Icons"
import MonacoEditor from "../ui/MonacoEditor"
import OutputTerminal from "../ui/OutputTerminal"

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

const tierFeedback = (tier) => {
  const map = {
    failed: { label: "Failed", color: "text-danger", bg: "bg-danger/10", border: "border-danger/20", icon: X },
    partial: { label: "Partial", color: "text-warning", bg: "bg-warning/10", border: "border-warning/20", icon: TargetIcon },
    strong_partial: { label: "Strong Partial", color: "text-warning", bg: "bg-warning/10", border: "border-warning/20", icon: TargetIcon },
    almost_there: { label: "Almost There", color: "text-accent", bg: "bg-accent/10", border: "border-accent/20", icon: LightningIcon },
    accepted: { label: "Accepted", color: "text-success", bg: "bg-success/10", border: "border-success/20", icon: Check },
  }
  return map[tier] || map.failed
}

const activityLabel = (activity) => {
  const map = {
    coding: "Coding",
    thinking: "Thinking",
    running: "Running",
    submitting: "Submitting",
    idle: "Idle",
  }
  return map[activity] || "Coding"
}

const activityColor = (activity) => {
  const map = {
    coding: "bg-success",
    thinking: "bg-info",
    running: "bg-warning",
    submitting: "bg-accent",
    idle: "bg-text-tertiary",
  }
  return map[activity] || "bg-text-tertiary"
}

const DUEL_FORMATS = [
  { id: "sprint", name: "Sprint", problems: 5, durationMinutes: 10, icon: LightningIcon, color: "text-warning", bgColor: "bg-warning/10", borderColor: "border-warning/20" },
  { id: "standard", name: "Standard", problems: 10, durationMinutes: 30, icon: SwordsIcon, color: "text-accent", bgColor: "bg-accent/10", borderColor: "border-accent/20" },
  { id: "extended", name: "Extended", problems: 15, durationMinutes: 60, icon: FlameIcon, color: "text-danger", bgColor: "bg-danger/10", borderColor: "border-danger/20" },
]

// ═══════════════════════════════════════════════════════════
// WEBSOCKET HOOK
// ═══════════════════════════════════════════════════════════

function useWebSocket() {
  const wsRef = useRef(null)
  const handlersRef = useRef({})
  const reconnectRef = useRef(null)

  const connect = useCallback(() => {
    const token = localStorage.getItem("dcode_token")
    if (!token) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(`ws://localhost:8000/ws?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => console.log("[WS] connected")
    ws.onclose = () => {
      console.log("[WS] disconnected, reconnecting...")
      reconnectRef.current = setTimeout(() => connect(), 3000)
    }
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (handlersRef.current[msg.type]) {
          handlersRef.current[msg.type](msg)
        }
      } catch {}
    }
  }, [])

  const send = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const on = useCallback((type, handler) => {
    handlersRef.current[type] = handler
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectRef.current) clearTimeout(reconnectRef.current)
    if (wsRef.current) wsRef.current.close()
    wsRef.current = null
  }, [])

  return { send, on, disconnect, connect }
}

// ═══════════════════════════════════════════════════════════
// PLAYER AVATAR
// ═══════════════════════════════════════════════════════════

const PlayerAvatar = ({ username, size = "md", ring = null }) => {
  const sizes = {
    sm: "h-7 w-7 text-[9px]",
    md: "h-9 w-9 text-[10px]",
    lg: "h-12 w-12 text-xs",
    xl: "h-16 w-16 text-sm",
  }
  const ringStyles = {
    green: "ring-2 ring-success ring-offset-2 ring-offset-void",
    red: "ring-2 ring-danger ring-offset-2 ring-offset-void",
    violet: "ring-2 ring-accent ring-offset-2 ring-offset-void",
  }
  return (
    <div className={`${sizes[size]} flex items-center justify-center rounded-xl bg-elevated text-text-secondary font-bold font-sans ${ring ? ringStyles[ring] : ""}`}>
      {(username || "??").slice(0, 2).toUpperCase()}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MATCHMAKING VIEW
// ═══════════════════════════════════════════════════════════

const MatchmakingView = ({ onFindMatch, onCancel, searching, onCreateTest, onJoinTest, testMode, setTestMode, testRoomCode, setTestRoomCode, testJoining, waitingForOpponent, selectedFormat, setSelectedFormat }) => {
  if (waitingForOpponent && testRoomCode) {
    return (
      <div className="flex flex-col h-screen bg-void text-text-secondary antialiased items-center justify-center">
        <div className="w-full max-w-md space-y-8 px-6">
          <div className="text-center space-y-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-info/10 text-info mx-auto relative">
              <Loader size={32} className="animate-spin" />
              <div className="absolute inset-0 rounded-2xl border-2 border-info/20 animate-ping" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary font-sans">Waiting for Opponent</h1>
            <p className="text-sm text-text-tertiary font-sans">
              Share this room code with a friend to start the duel
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <div className="text-center">
              <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-text-tertiary block mb-3">Room Code</label>
              <div className="flex items-center justify-center gap-3 bg-void border border-border rounded-xl px-6 py-5">
                <Hash size={18} className="text-info" />
                <span className="font-mono text-4xl font-bold text-text-primary tracking-[0.35em]">{testRoomCode}</span>
              </div>
              <p className="text-[10px] font-sans text-text-tertiary mt-3">Open another tab, sign in with a different account, and enter this code</p>
            </div>

            <button
              onClick={onCancel}
              className="w-full px-4 py-3 text-xs font-sans font-bold text-text-secondary bg-elevated hover:bg-border border border-border rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (waitingForOpponent) {
    return (
      <div className="flex flex-col h-screen bg-void text-text-secondary antialiased items-center justify-center">
        <div className="w-full max-w-md space-y-8 px-6">
          <div className="text-center space-y-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 text-accent mx-auto relative">
              <SwordsIcon size={32} />
              <div className="absolute inset-0 rounded-2xl border-2 border-accent/20 animate-ping" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary font-sans">Looking for Opponent</h1>
            <p className="text-sm text-text-tertiary font-sans">
              Matching you with a player of similar skill...
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6">
            <button
              onClick={onCancel}
              className="w-full px-4 py-3 text-xs font-sans font-bold text-text-secondary bg-elevated hover:bg-border border border-border rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-void text-text-secondary antialiased items-center justify-center">
      <div className="w-full max-w-lg space-y-8 px-6">
        <div className="text-center space-y-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 text-accent mx-auto relative">
            <SwordsIcon size={32} />
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent flex items-center justify-center">
              <LightningIcon size={10} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text-primary font-sans">Duel Arena</h1>
          <p className="text-sm text-text-tertiary font-sans">
            Compete head-to-head or test the system
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
          <button
            onClick={() => setTestMode(false)}
            className={`flex-1 px-4 py-3 text-xs font-sans font-bold rounded-lg transition-all duration-150 ${
              !testMode
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "text-text-tertiary hover:text-text-secondary hover:bg-elevated"
            }`}
          >
            <SwordsIcon size={14} className="inline mr-2" />
            Find Match
          </button>
          <button
            onClick={() => setTestMode(true)}
            className={`flex-1 px-4 py-3 text-xs font-sans font-bold rounded-lg transition-all duration-150 ${
              testMode
                ? "bg-info text-white shadow-lg shadow-info/20"
                : "text-text-tertiary hover:text-text-secondary hover:bg-elevated"
            }`}
          >
            <FlaskIcon size={14} className="inline mr-2" />
            Test Mode
          </button>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
          {!testMode ? (
            <>
              {/* Format Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-text-tertiary">Duel Format</label>
                <div className="grid grid-cols-3 gap-3">
                  {DUEL_FORMATS.map((f) => {
                    const FormatIcon = f.icon
                    const isSelected = selectedFormat === f.id
                    return (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFormat(f.id)}
                        className={`relative px-3 py-4 rounded-xl text-center transition-all duration-200 border ${
                          isSelected
                            ? `${f.bgColor} ${f.borderColor} ${f.color} scale-[1.02] shadow-lg`
                            : "bg-void border-border text-text-tertiary hover:border-text-tertiary hover:bg-elevated"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-current" />
                        )}
                        <FormatIcon size={18} className={`mx-auto mb-2 ${isSelected ? "text-current" : "text-text-tertiary"}`} />
                        <div className="text-xs font-sans font-bold">{f.name}</div>
                        <div className="text-[9px] font-mono mt-1 opacity-70">{f.problems}p / {f.durationMinutes}m</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2 text-center">
                {searching ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-accent">
                      <Loader size={16} className="animate-spin" />
                      <span className="text-sm font-sans font-bold">Searching for opponent...</span>
                    </div>
                    <p className="text-xs text-text-tertiary font-mono">
                      {DUEL_FORMATS.find(f => f.id === selectedFormat)?.problems} problems, {DUEL_FORMATS.find(f => f.id === selectedFormat)?.durationMinutes} minutes
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-text-tertiary font-sans">
                    Server judges all code. Real problems, real scoring.
                  </p>
                )}
              </div>

              {searching ? (
                <button
                  onClick={onCancel}
                  className="w-full px-4 py-3 text-xs font-sans font-bold text-text-secondary bg-elevated hover:bg-border border border-border rounded-xl transition-all duration-150"
                >
                  Cancel Search
                </button>
              ) : (
                <button
                  onClick={() => onFindMatch(selectedFormat)}
                  className="w-full px-4 py-3.5 text-sm font-sans font-bold text-white bg-accent hover:bg-accent-muted rounded-xl transition-all duration-200 shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <LightningIcon size={14} className="inline mr-2" />
                  Find Match
                </button>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2 text-center">
                 <FlaskIcon size={20} className="text-info mx-auto" />
                <p className="text-xs text-text-tertiary font-sans">
                  Create a room and share the code, or join an existing room.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={onCreateTest}
                  className="w-full px-4 py-3.5 text-sm font-sans font-bold text-white bg-info hover:bg-info/80 rounded-xl transition-all duration-200 shadow-lg shadow-info/25 hover:shadow-info/40"
                >
                  Create Room
                </button>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testRoomCode}
                    onChange={(e) => setTestRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    maxLength={6}
                    className="flex-1 bg-void border border-border rounded-xl px-4 py-3 text-sm font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-info/50 focus:ring-1 focus:ring-info/20 transition-all"
                  />
                  <button
                    onClick={onJoinTest}
                    disabled={testRoomCode.length < 4 || testJoining}
                    className="px-5 py-3 text-xs font-sans font-bold text-white bg-info hover:bg-info/80 rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testJoining ? <Loader size={14} className="animate-spin" /> : "Join"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// DUEL HEADER
// ═══════════════════════════════════════════════════════════

const DuelHeader = ({ timeLeft, opponent, player, onForfeit, onBack, matchType, questionIndex, totalQuestions, myScore, oppScore, format }) => {
  const isLowTime = timeLeft < 60
  const isCriticalTime = timeLeft < 30

  return (
    <header className="h-[72px] flex items-center justify-between px-5 bg-void border-b border-border shrink-0 select-none">
      {/* Left: Exit + Format */}
      <div className="flex items-center gap-3 min-w-[180px]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-sans font-bold text-text-tertiary hover:text-text-primary transition-colors duration-150"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Exit</span>
        </button>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
            matchType === "Test" ? "text-info bg-info/10 border border-info/20" : "text-accent bg-accent/10 border border-accent/20"
          }`}>
            {format?.name || matchType}
          </span>
          {totalQuestions > 0 && (
            <span className="text-[10px] font-mono font-bold text-text-tertiary bg-elevated border border-border px-2 py-1 rounded-lg">
              {(questionIndex || 0) + 1}/{totalQuestions}
            </span>
          )}
        </div>
      </div>

      {/* Center: Scoreboard */}
      <div className="flex items-center gap-5">
        {/* Player */}
        <div className="flex items-center gap-3">
          <PlayerAvatar username={player?.username} size="md" ring="green" />
          <div className="text-right">
            <div className="text-[10px] font-sans font-bold text-success uppercase tracking-wider">You</div>
            <div className="text-[11px] font-sans text-text-tertiary">{player?.username || "Player"}</div>
          </div>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center px-4">
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-mono font-bold transition-colors duration-200 ${myScore > oppScore ? "text-success" : myScore < oppScore ? "text-danger" : "text-text-primary"}`}>
              {(myScore || 0).toFixed(1)}
            </span>
            <span className="text-sm text-text-tertiary font-mono">:</span>
            <span className={`text-2xl font-mono font-bold transition-colors duration-200 ${oppScore > myScore ? "text-success" : oppScore < myScore ? "text-danger" : "text-text-primary"}`}>
              {(oppScore || 0).toFixed(1)}
            </span>
          </div>
        </div>

        {/* Opponent */}
        <div className="flex items-center gap-3">
          <div className="text-left">
            <div className="text-[10px] font-sans font-bold text-danger uppercase tracking-wider">Opponent</div>
            <div className="text-[11px] font-sans text-text-tertiary">{opponent?.username || "Opponent"}</div>
          </div>
          <PlayerAvatar username={opponent?.username} size="md" ring="red" />
        </div>
      </div>

      {/* Right: Timer + Forfeit */}
      <div className="flex items-center gap-3 min-w-[180px] justify-end">
        {/* Timer */}
        <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all duration-300 ${
          isCriticalTime
            ? "bg-danger/10 border-danger/30 text-danger"
            : isLowTime
              ? "bg-warning/10 border-warning/30 text-warning"
              : "bg-surface border-border text-text-primary"
        }`}>
          <TimerIcon size={14} className={isCriticalTime ? "animate-pulse" : ""} />
          <span className={`text-base font-mono font-bold tabular-nums ${isCriticalTime ? "animate-pulse" : ""}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <button
          onClick={onForfeit}
          className="flex items-center gap-1.5 text-[10px] font-sans font-bold text-text-tertiary hover:text-danger transition-colors duration-150 px-2 py-1.5 rounded-lg hover:bg-danger/10"
        >
          <AlertTriangle size={12} />
          Forfeit
        </button>
      </div>
    </header>
  )
}

// ═══════════════════════════════════════════════════════════
// PROBLEM PANEL
// ═══════════════════════════════════════════════════════════

const ProblemPanel = ({ problem }) => {
  if (!problem) return (
    <div className="w-[320px] flex flex-col border-r border-border bg-base shrink-0 items-center justify-center">
      <Loader size={20} className="text-text-tertiary animate-spin" />
    </div>
  )

  return (
    <div className="w-[320px] flex flex-col border-r border-border bg-base shrink-0">
      <div className="px-4 py-2.5 border-b border-border-subtle flex items-center justify-between">
        <span className="text-[10px] font-sans font-bold text-text-tertiary uppercase tracking-wider">Problem Statement</span>
        <span className="text-[10px] font-mono text-text-tertiary">ID: {problem.id}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
        <div>
          <h1 className="text-base font-bold text-text-primary mb-2">{problem.title}</h1>
          <div className="flex items-center gap-3 text-[10px] font-mono text-text-tertiary">
            <span className={`px-2 py-0.5 rounded-md border ${difficultyColor(problem.difficulty)}`}>{problem.difficulty}</span>
          </div>
        </div>

        <div className="text-text-secondary leading-relaxed space-y-2 border-t border-border-subtle pt-3">
          <p className="whitespace-pre-line">{problem.description}</p>
        </div>

        {problem.examples?.length > 0 && (
          <div className="space-y-2 border-t border-border-subtle pt-3">
            <h3 className="text-[10px] font-sans font-bold uppercase tracking-wider text-text-tertiary">Examples</h3>
            {problem.examples.map((ex, i) => (
              <div key={i} className="rounded-lg bg-surface border border-border overflow-hidden text-[11px]">
                <div className="px-3 py-1.5 bg-surface border-b border-border-subtle text-[9px] font-mono font-bold text-text-tertiary uppercase">
                  Example {i + 1}
                </div>
                <div className="p-3 space-y-2 font-mono">
                  {ex.input && (
                    <div>
                      <span className="text-text-tertiary text-[10px] block mb-0.5">Input:</span>
                      <span className="text-text-secondary">{ex.input}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-text-tertiary text-[10px] block mb-0.5">Output:</span>
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

// ═══════════════════════════════════════════════════════════
// CODE EDITOR
// ═══════════════════════════════════════════════════════════

const CodeEditor = ({ onRun, onSubmit, runStatus, submitStatus, code, onCodeChange, runResults, submitted }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-base overflow-hidden">
      <div className="h-10 flex items-center justify-between px-4 bg-void border-b border-border shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-base border border-border border-b-0 rounded-t-lg text-xs font-semibold text-text-primary">
            <FileCode size={13} className="text-accent" />
            <span className="font-mono text-xs">solution.js</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-text-tertiary">Node.js v18</span>
          <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-elevated text-text-tertiary hover:text-text-primary transition-colors" title="Copy code">
            {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      <MonacoEditor value={code} onChange={onCodeChange} onRun={onRun} onSubmit={onSubmit} />

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
        <button
          onClick={onRun}
          disabled={runStatus === "running" || submitStatus === "submitting" || submitted}
          className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-sans font-bold text-text-secondary bg-elevated hover:bg-border border border-border rounded-xl transition-all duration-150 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Play size={12} /> Run
        </button>
        <button
          onClick={onSubmit}
          disabled={runStatus === "running" || submitStatus === "submitting" || submitted}
          className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-sans font-bold text-white bg-success hover:bg-success/80 rounded-xl transition-all duration-200 shadow-lg shadow-success/20 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Send size={12} />
          {submitted ? "Submitted" : "Submit Solution"}
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// OPPONENT PANEL
// ═══════════════════════════════════════════════════════════

const OpponentPanel = ({ opponent, opponentProgress, opponentActivity, opponentScore, opponentCompleted }) => {
  const tier = tierFeedback(opponentProgress?.tier || "failed")

  return (
    <div className="w-[240px] flex flex-col bg-base border-l border-border shrink-0 select-none">
      <div className="px-4 py-2.5 border-b border-border-subtle flex items-center justify-between">
        <span className="text-[10px] font-sans font-bold text-text-tertiary uppercase tracking-wider">Opponent</span>
        <span className="flex items-center gap-1.5 text-[10px] font-sans font-bold text-success">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Live
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
        {/* Opponent Info Card */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <PlayerAvatar username={opponent?.username} size="lg" ring="red" />
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-text-primary truncate">{opponent?.username || "Opponent"}</h2>
              <p className="text-[10px] font-mono text-text-tertiary">{opponent?.rating || 1200} ELO</p>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-text-tertiary block">Activity</span>
          <div className="flex items-center gap-2.5">
            <div className={`h-3 w-3 rounded-full ${activityColor(opponentActivity)} ${opponentActivity !== "idle" ? "animate-pulse" : ""}`} />
            <span className="text-xs font-sans font-bold text-text-secondary">{activityLabel(opponentActivity)}</span>
          </div>
          <div className="flex gap-1">
            {["coding", "thinking", "running", "submitting"].map((a) => (
              <div
                key={a}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  opponentActivity === a ? activityColor(a) : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Score */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
          <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-text-tertiary block">Score</span>
          <div className="text-2xl font-mono font-bold text-text-primary tabular-nums">{(opponentScore || 0).toFixed(1)}</div>
        </div>

        {/* Progress */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-text-tertiary block">Progress</span>
          <div className="text-xs font-sans text-text-secondary">
            {opponentCompleted || 0} problems solved
          </div>
          {opponentProgress && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${tier.bg} border ${tier.border}`}>
              {React.createElement(tier.icon, { size: 14, className: tier.color })}
              <span className={`text-xs font-sans font-bold ${tier.color}`}>{tier.label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ROUND NOTIFICATION
// ═══════════════════════════════════════════════════════════

const RoundNotification = ({ notification }) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (!notification || !visible) return null

  const myTier = tierFeedback(notification.myTier)
  const oppTier = tierFeedback(notification.oppTier)

  return (
    <div className="flex items-center justify-center gap-4 py-3 bg-void/95 border-b border-border shrink-0 animate-in slide-in-from-top duration-300">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${myTier.bg} border ${myTier.border}`}>
        {React.createElement(myTier.icon, { size: 14, className: myTier.color })}
        <span className={`text-xs font-sans font-bold ${myTier.color}`}>You: {myTier.label}</span>
      </div>
      <div className="text-text-tertiary text-xs font-mono">vs</div>
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${oppTier.bg} border ${oppTier.border}`}>
        {React.createElement(oppTier.icon, { size: 14, className: oppTier.color })}
        <span className={`text-xs font-sans font-bold ${oppTier.color}`}>Opponent: {oppTier.label}</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// STAT BADGE (for results)
// ═══════════════════════════════════════════════════════════

const StatBadge = ({ icon: Icon, label, value, color = "text-text-primary" }) => (
  <div className="flex flex-col items-center gap-1.5 px-3 py-2">
    <Icon size={16} className="text-text-tertiary" />
    <span className={`text-lg font-mono font-bold tabular-nums ${color}`}>{value}</span>
    <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-text-tertiary">{label}</span>
  </div>
)

// ═══════════════════════════════════════════════════════════
// COMPARISON BAR (for results)
// ═══════════════════════════════════════════════════════════

const ComparisonBar = ({ label, yourValue, oppValue, suffix = "" }) => {
  const total = yourValue + oppValue || 1
  const yourPct = (yourValue / total) * 100
  const oppPct = (oppValue / total) * 100

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-sans">
        <span className="font-mono font-bold text-text-primary">{yourValue}{suffix}</span>
        <span className="font-bold uppercase tracking-wider text-text-tertiary">{label}</span>
        <span className="font-mono font-bold text-text-primary">{oppValue}{suffix}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-border gap-1">
        <div
          className={`rounded-full transition-all duration-700 ${yourValue >= oppValue ? "bg-success" : "bg-text-tertiary"}`}
          style={{ width: `${yourPct}%` }}
        />
        <div
          className={`rounded-full transition-all duration-700 ${oppValue > yourValue ? "bg-danger" : "bg-text-tertiary"}`}
          style={{ width: `${oppPct}%` }}
        />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// RESULT MODAL
// ═══════════════════════════════════════════════════════════

const ResultModal = ({ result, onBack, onRematch, rematchVotes }) => {
  if (!result) return null
  const won = result.result === "win"
  const draw = result.result === "draw"

  const ResultIcon = draw ? HandshakeIcon : won ? CrownIcon : ShieldIcon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden font-sans animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className={`relative p-8 text-center space-y-4 ${
          draw ? "bg-warning/5" : won ? "bg-success/5" : "bg-danger/5"
        }`}>
          {/* Decorative corner accents */}
          {won && (
            <>
              <div className="absolute top-3 left-3 text-success/20"><CrownIcon size={16} /></div>
              <div className="absolute top-3 right-3 text-success/20"><CrownIcon size={16} /></div>
            </>
          )}

          <div className={`flex h-20 w-20 items-center justify-center rounded-2xl mx-auto relative ${
            draw ? "bg-warning/10 text-warning" : won ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          }`}>
            <ResultIcon size={36} />
            {won && <div className="absolute inset-0 rounded-2xl border-2 border-success/20 animate-ping" />}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              {draw ? "Draw" : won ? "Victory!" : "Defeat"}
            </h2>
            <p className="text-xs text-text-tertiary mt-1.5">{result.reason}</p>
          </div>
        </div>

        {/* Performance Stats */}
        {result.yourScore && result.opponentScore && (
          <div className="px-6 py-4 border-t border-border">
            <div className="flex justify-center gap-6">
              <StatBadge
                icon={TargetIcon}
                label="Accuracy"
                value={`${result.yourScore?.accuracy || 0}%`}
                color={won ? "text-success" : "text-text-primary"}
              />
              <StatBadge
                icon={GaugeIcon}
                label="Avg Speed"
                value={`${result.yourScore?.avgTimePerProblem || 0}s`}
                color={result.yourScore?.avgTimePerProblem < result.opponentScore?.avgTimePerProblem ? "text-success" : "text-text-primary"}
              />
              <StatBadge
                icon={MedalIcon}
                label="Solved"
                value={`${result.yourScore?.problemsCompleted || 0}/${result.problemsTotal || 0}`}
                color={(result.yourScore?.problemsCompleted || 0) > (result.opponentScore?.problemsCompleted || 0) ? "text-success" : "text-text-primary"}
              />
            </div>
          </div>
        )}

        {/* Score Comparison */}
        <div className="px-6 py-4 space-y-3">
          {result.yourScore && result.opponentScore ? (
            <>
              {/* Player Headers */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-success/10 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-success">YOU</span>
                  </div>
                  <span className="text-xs font-sans font-bold text-text-primary">{result.yourTotalScore?.toFixed(1) || "0.0"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-sans font-bold text-text-primary">{result.opponentTotalScore?.toFixed(1) || "0.0"}</span>
                  <div className="h-6 w-6 rounded-lg bg-danger/10 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-danger">OPP</span>
                  </div>
                </div>
              </div>

              {/* Comparison Bars */}
              <ComparisonBar
                label="Score"
                yourValue={result.yourTotalScore || 0}
                oppValue={result.opponentTotalScore || 0}
              />
              <ComparisonBar
                label="Accuracy"
                yourValue={result.yourScore?.accuracy || 0}
                oppValue={result.opponentScore?.accuracy || 0}
                suffix="%"
              />
              <ComparisonBar
                label="Problems"
                yourValue={result.yourScore?.problemsCompleted || 0}
                oppValue={result.opponentScore?.problemsCompleted || 0}
              />
            </>
          ) : (
            <div className="bg-void border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-text-tertiary">Match completed via forfeit</p>
            </div>
          )}
        </div>

        {/* Rating Change */}
        {result.ratingChange !== undefined && result.ratingChange !== null && (
          <div className="px-6 pb-4">
            <div className={`flex items-center justify-center gap-2 py-3 rounded-xl border ${
              result.ratingChange > 0
                ? "bg-success/5 border-success/20"
                : result.ratingChange < 0
                  ? "bg-danger/5 border-danger/20"
                  : "bg-void border-border"
            }`}>
              <MedalIcon size={14} className={result.ratingChange > 0 ? "text-success" : result.ratingChange < 0 ? "text-danger" : "text-text-tertiary"} />
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-text-tertiary">Rating Change</span>
              <span className={`text-base font-mono font-bold ${result.ratingChange > 0 ? "text-success" : result.ratingChange < 0 ? "text-danger" : "text-text-tertiary"}`}>
                {result.ratingChange > 0 ? "+" : ""}{result.ratingChange}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onRematch}
            className="flex-1 px-4 py-3 text-sm font-sans font-bold text-white bg-accent hover:bg-accent-muted rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw size={14} />
            Rematch
            {rematchVotes > 0 && (
              <span className="text-[10px] opacity-80 bg-white/20 px-1.5 py-0.5 rounded-md">{rematchVotes}/2</span>
            )}
          </button>
          <button
            onClick={onBack}
            className="flex-1 px-4 py-3 text-sm font-sans font-bold text-text-secondary bg-elevated hover:bg-border border border-border rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

const ForfeitModal = ({ onClose, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <div className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden font-sans">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger"><AlertTriangle size={20} /></div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Forfeit Match?</h3>
            <p className="text-[11px] text-text-tertiary mt-0.5">You will lose this match and rating points.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-xs font-sans font-bold text-text-secondary bg-elevated hover:bg-border border border-border rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]">Keep Fighting</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 text-xs font-sans font-bold text-white bg-danger hover:bg-danger/80 rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]">Forfeit</button>
        </div>
      </div>
    </div>
  </div>
)

// ═══════════════════════════════════════════════════════════
// MAIN DUEL PAGE
// ═══════════════════════════════════════════════════════════

const DuelPage = ({ onBack }) => {
  const { send, on, disconnect, connect } = useWebSocket()

  const [phase, setPhase] = useState("matchmaking")
  const [searching, setSearching] = useState(false)
  const [testMode, setTestMode] = useState(false)
  const [testRoomCode, setTestRoomCode] = useState("")
  const [testJoining, setTestJoining] = useState(false)
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState("sprint")

  const [problem, setProblem] = useState(null)
  const [opponent, setOpponent] = useState(null)
  const [player, setPlayer] = useState(null)
  const [roomId, setRoomId] = useState(null)
  const [timeLeft, setTimeLeft] = useState(300)
  const [format, setFormat] = useState(null)

  const [code, setCode] = useState("")
  const [runStatus, setRunStatus] = useState("idle")
  const [submitStatus, setSubmitStatus] = useState("idle")
  const [runResults, setRunResults] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const [opponentProgress, setOpponentProgress] = useState(null)
  const [opponentActivity, setOpponentActivity] = useState("coding")
  const [opponentScore, setOpponentScore] = useState(0)
  const [opponentCompleted, setOpponentCompleted] = useState(0)

  const [result, setResult] = useState(null)
  const [showForfeit, setShowForfeit] = useState(false)

  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [myScore, setMyScore] = useState(0)
  const [oppScore, setOppScore] = useState(0)
  const [roundNotification, setRoundNotification] = useState(null)
  const [rematchVotes, setRematchVotes] = useState(0)
  const [scorePopup, setScorePopup] = useState(null)

  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  // Connect WebSocket
  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  // Timer
  const startTimer = useCallback((seconds) => {
    setTimeLeft(seconds)
    startTimeRef.current = Date.now()
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const remaining = Math.max(0, seconds - elapsed)
      setTimeLeft(remaining)
      if (remaining <= 0) clearInterval(timerRef.current)
    }, 1000)
  }, [])

  // WebSocket handlers
  useEffect(() => {
    on("match_found", (msg) => {
      setPhase("duel")
      setProblem(msg.problem)
      setOpponent(msg.opponent)
      setPlayer(msg.player)
      setRoomId(msg.roomId)
      setFormat(msg.format)
      setQuestionIndex(msg.questionIndex || 0)
      setTotalQuestions(msg.totalQuestions || 0)
      setCode(msg.problem?.starterCode || "")
      setSearching(false)
      startTimer(msg.timeLimit)
    })

    on("test_room_created", (msg) => {
      setTestRoomCode(msg.roomCode)
      setWaitingForOpponent(true)
      setFormat(msg.format)
    })

    on("test_opponent_joined", (msg) => {
      setPhase("duel")
      setProblem(msg.question)
      setOpponent(msg.opponent)
      setRoomId(`test-${msg.roomCode}`)
      setCode(msg.question?.starterCode || "")
      setWaitingForOpponent(false)
      setTotalQuestions(msg.totalQuestions || 0)
      setFormat(msg.format)
      startTimer(msg.timeLimit)
    })

    on("test_room_joined", (msg) => {
      setPhase("duel")
      setProblem(msg.question)
      setOpponent(msg.opponent)
      setPlayer(msg.player)
      setRoomId(`test-${msg.roomCode}`)
      setCode(msg.question?.starterCode || "")
      setTotalQuestions(msg.totalQuestions || 0)
      setFormat(msg.format)
      startTimer(msg.timeLimit)
    })

    on("next_question", (msg) => {
      setProblem(msg.question)
      setQuestionIndex(msg.questionIndex)
      setTotalQuestions(msg.totalQuestions)
      setCode(msg.question?.starterCode || "")
      setSubmitted(false)
      setRunStatus("idle")
      setSubmitStatus("idle")
      setRunResults(null)
      setOpponentProgress(null)
      setRoundNotification(null)
      setOpponentActivity("coding")
      if (msg.scores && player?.userId) {
        setMyScore(msg.scores[player.userId] || 0)
        const oppId = opponent?.userId
        setOppScore(oppId ? (msg.scores[oppId] || 0) : 0)
      }
    })

    on("round_result", (msg) => {
      const mySub = msg.submissions?.find(s => s.userId === player?.userId)
      const oppSub = msg.submissions?.find(s => s.userId !== player?.userId)
      setMyScore(msg.scores?.[player?.userId] || 0)
      setOppScore(msg.scores?.[opponent?.userId] || 0)
      setRoundNotification({
        myTier: mySub?.tier || "failed",
        oppTier: oppSub?.tier || "failed",
      })
    })

    on("opponent_submitted", (msg) => {
      setOpponentProgress({ tier: msg.tier, score: msg.score })
      setOpponentScore(msg.totalScore || 0)
      setOpponentCompleted(msg.problemsCompleted || 0)
      setOpponentActivity(msg.activity || "coding")
    })

    on("opponent_activity", (msg) => {
      setOpponentActivity(msg.activity)
    })

    on("duel_run_result", (msg) => {
      setRunResults(msg.result)
      setRunStatus(msg.result.status === "accepted" ? "passed" : "failed")
    })

    on("duel_submit_result", (msg) => {
      setRunResults(msg.result)
      setSubmitStatus("submitted")
      setSubmitted(true)
      if (msg.totalScore !== undefined) setMyScore(msg.totalScore)
      const pts = msg.scoreData?.total || 0
      const tier = msg.scoreData?.tier || "bronze"
      const label = tier === "platinum" ? "Full Pass" : tier === "gold" ? "Strong" : tier === "silver" ? "Partial" : "Failed"
      setScorePopup({ points: pts, label, status: msg.result?.status || "wrong_answer" })
      setTimeout(() => setScorePopup(null), 1500)
      setTimeout(() => setSubmitStatus("idle"), 3000)
    })

    on("all_questions_done", () => {
      // Player finished all questions, waiting for opponent or match end
    })

    on("duel_result", (msg) => {
      if (timerRef.current) clearInterval(timerRef.current)
      setResult({
        result: msg.result,
        reason: msg.reason,
        ratingChange: msg.ratingChange,
        yourScore: msg.yourScore,
        opponentScore: msg.opponentScore,
        yourTotalScore: msg.yourTotalScore,
        opponentTotalScore: msg.opponentTotalScore,
        format: msg.format,
        problemsTotal: msg.problemsTotal,
      })
    })

    on("rematch_status", (msg) => {
      setRematchVotes(msg.votes)
    })

    on("rematch_start", (msg) => {
      setProblem(msg.problem)
      setOpponent(msg.opponent)
      setPlayer(msg.player)
      setFormat(msg.format)
      setQuestionIndex(0)
      setTotalQuestions(msg.totalQuestions)
      setCode(msg.problem?.starterCode || "")
      setResult(null)
      setSubmitted(false)
      setRunStatus("idle")
      setSubmitStatus("idle")
      setRunResults(null)
      setMyScore(0)
      setOppScore(0)
      setOpponentProgress(null)
      setOpponentActivity("coding")
      setOpponentScore(0)
      setOpponentCompleted(0)
      setRematchVotes(0)
      startTimer(msg.timeLimit)
    })

    on("player_disconnected", () => {
      setOpponentActivity("idle")
      setOpponentProgress(null)
    })

    on("waiting", (msg) => {
      setWaitingForOpponent(true)
    })

    on("error", (msg) => {
      console.error("[WS error]", msg.message)
      setSearching(false)
      setTestJoining(false)
      setWaitingForOpponent(false)
    })
  }, [on, player, opponent, startTimer])

  const handleFindMatch = useCallback((formatId) => {
    console.log("[DUEL] Find match requested, formatId:", formatId, "typeof:", typeof formatId)
    if (!formatId || !["sprint", "standard", "extended"].includes(formatId)) {
      console.error("[DUEL] Invalid formatId:", formatId)
      return
    }
    setSearching(true)
    send({ type: "find_match", formatId })
  }, [send])

  const handleCancelSearch = useCallback(() => {
    setSearching(false)
    setWaitingForOpponent(false)
    setTestJoining(false)
    setTestRoomCode("")
    send({ type: "cancel_match" })
  }, [send])

  const handleCreateTest = useCallback(() => {
    send({ type: "create_test_room", formatId: selectedFormat })
  }, [send, selectedFormat])

  const handleJoinTest = useCallback(() => {
    if (testRoomCode.length < 4) return
    setTestJoining(true)
    send({ type: "join_test_room", roomCode: testRoomCode })
  }, [testRoomCode, send])

  const handleRun = useCallback(() => {
    if (!roomId) return
    setRunStatus("running")
    setRunResults(null)
    send({ type: "duel_run", roomId, code })
    send({ type: "activity_update", roomId, activity: "running" })
  }, [roomId, code, send])

  const handleSubmit = useCallback(() => {
    if (!roomId || submitted) return
    setSubmitStatus("submitting")
    setRunResults(null)
    send({ type: "duel_submit", roomId, code })
    send({ type: "activity_update", roomId, activity: "submitting" })
  }, [roomId, code, submitted, send])

  const handleForfeitConfirm = useCallback(() => {
    send({ type: "forfeit", roomId })
    setShowForfeit(false)
    onBack()
  }, [roomId, send, onBack])

  const handleRematch = useCallback(() => {
    send({ type: "rematch_vote", roomId })
  }, [roomId, send])

  if (phase === "matchmaking") {
    return (
      <MatchmakingView
        onFindMatch={handleFindMatch}
        onCancel={handleCancelSearch}
        searching={searching}
        onCreateTest={handleCreateTest}
        onJoinTest={handleJoinTest}
        testMode={testMode}
        setTestMode={setTestMode}
        testRoomCode={testRoomCode}
        setTestRoomCode={setTestRoomCode}
        testJoining={testJoining}
        waitingForOpponent={waitingForOpponent}
        selectedFormat={selectedFormat}
        setSelectedFormat={setSelectedFormat}
      />
    )
  }

  const matchType = roomId?.startsWith("test-") ? "Test" : "Ranked"

  return (
    <div className="flex flex-col h-screen bg-void text-text-secondary antialiased overflow-hidden">
      <DuelHeader
        timeLeft={timeLeft}
        opponent={opponent}
        player={player}
        matchType={matchType}
        format={format}
        onForfeit={() => setShowForfeit(true)}
        onBack={onBack}
        questionIndex={questionIndex}
        totalQuestions={totalQuestions}
        myScore={myScore}
        oppScore={oppScore}
      />

      {/* Round Notification */}
      <RoundNotification notification={roundNotification} />

      {/* Score Popup */}
      {scorePopup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div className={`flex flex-col items-center gap-1 px-12 py-6 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 ${
              scorePopup.status === "accepted"
                ? "bg-success/15 border-success/40 shadow-success/30"
                : scorePopup.points > 0
                  ? "bg-warning/15 border-warning/40 shadow-warning/30"
                  : "bg-danger/15 border-danger/40 shadow-danger/30"
            }`} style={{ animation: "scorePopupIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards, scorePopupOut 0.3s ease-in 1.2s forwards" }}>
              <div className={`text-4xl font-mono font-black tracking-tight ${
                scorePopup.status === "accepted" ? "text-success" : scorePopup.points > 0 ? "text-warning" : "text-danger"
              }`}>
                +{scorePopup.points.toFixed(1)}
              </div>
              <div className={`text-[11px] font-sans font-bold uppercase tracking-[0.15em] mt-1 ${
                scorePopup.status === "accepted" ? "text-success/80" : scorePopup.points > 0 ? "text-warning/80" : "text-danger/80"
              }`}>
                {scorePopup.label}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex min-h-0 overflow-hidden p-4 gap-4">
        <div className="flex-1 flex border border-border rounded-2xl overflow-hidden bg-base">
          <ProblemPanel problem={problem} />
          <CodeEditor onRun={handleRun} onSubmit={handleSubmit} runStatus={runStatus} submitStatus={submitStatus} code={code} onCodeChange={setCode} runResults={runResults} submitted={submitted} />
          <OpponentPanel opponent={opponent} opponentProgress={opponentProgress} opponentActivity={opponentActivity} opponentScore={opponentScore} opponentCompleted={opponentCompleted} />
        </div>
      </div>

      {result && <ResultModal result={result} onBack={onBack} onRematch={handleRematch} rematchVotes={rematchVotes} />}
      {showForfeit && <ForfeitModal onClose={() => setShowForfeit(false)} onConfirm={handleForfeitConfirm} />}
    </div>
  )
}

export default DuelPage
