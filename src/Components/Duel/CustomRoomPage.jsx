import React, { useState, useCallback, useRef, useEffect, useMemo } from "react"
import {
  ChevronLeft,
  Copy,
  Check,
  Hash,
  X,
  Loader,
} from "lucide-react"
import {
  SwordsIcon,
  UsersIcon,
  FlameIcon,
  ShieldIcon,
  HandshakeIcon,
  MedalIcon,
  CodeIcon,
} from "../ui/Icons"
import MonacoEditor from "../ui/MonacoEditor"
import OutputTerminal from "../ui/OutputTerminal"

const formatOptions = [
  { id: "sprint", name: "Sprint", desc: "5 problems, 10 minutes" },
  { id: "standard", name: "Standard", desc: "10 problems, 30 minutes" },
  { id: "extended", name: "Extended", desc: "15 problems, 60 minutes" },
]

const difficultyColor = (d) => {
  if (!d) return "text-text-tertiary bg-elevated/50 border-border"
  const dl = d.toLowerCase()
  if (dl === "easy") return "text-success bg-success/10 border-success/20"
  if (dl === "medium") return "text-warning bg-warning/10 border-warning/20"
  return "text-danger bg-danger/10 border-danger/20"
}

function useWebSocket() {
  const wsRef = useRef(null)
  const handlersRef = useRef({})
  const pendingRef = useRef([])
  const reconnectRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const connect = useCallback(() => {
    const token = localStorage.getItem("dcode_token")
    if (!token) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return
    const ws = new WebSocket(`ws://localhost:8000/ws?token=${token}`)
    wsRef.current = ws
    ws.onopen = () => {
      setIsConnected(true)
      const queued = pendingRef.current
      pendingRef.current = []
      for (const msg of queued) {
        try {
          ws.send(JSON.stringify(msg))
        } catch {}
      }
    }
    ws.onclose = () => {
      setIsConnected(false)
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      reconnectRef.current = setTimeout(() => connect(), 3000)
    }
    ws.onerror = () => {
      setIsConnected(false)
    }
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (handlersRef.current[msg.type]) handlersRef.current[msg.type](msg)
      } catch {}
    }
  }, [])
  const send = useCallback((msg) => {
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg))
      return true
    }
    pendingRef.current.push(msg)
    if (!ws || ws.readyState === WebSocket.CLOSED) connect()
    return false
  }, [connect])
  const on = useCallback((type, handler) => {
    handlersRef.current[type] = handler
  }, [])
  const disconnect = useCallback(() => {
    if (reconnectRef.current) clearTimeout(reconnectRef.current)
    pendingRef.current = []
    if (wsRef.current) wsRef.current.close()
    wsRef.current = null
    setIsConnected(false)
  }, [])
  return useMemo(() => ({ send, on, disconnect, connect, isConnected }), [send, on, disconnect, connect, isConnected])
}

// NOTE: effects must depend on the stable callbacks (ws.send etc.), never on
// the whole ws object, or the socket gets torn down on every render.

const Header = ({ onBack, roomCode }) => (
  <header className="h-14 flex items-center justify-between px-5 bg-void border-b border-border shrink-0 select-none">
    <div className="flex items-center gap-3.5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-bold text-text-tertiary hover:text-text-primary transition-colors"
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline">Back</span>
      </button>
      <div className="w-px h-5 bg-border" />
      <div className="flex items-center gap-2">
        <SwordsIcon size={14} className="text-text-tertiary" />
        <span className="text-sm font-bold text-text-primary font-sans">
          Custom Room
        </span>
      </div>
    </div>
    {roomCode && <RoomCodeDisplay code={roomCode} />}
  </header>
)

const RoomCodeDisplay = ({ code }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-1.5">
      <Hash size={12} className="text-text-tertiary" />
      <span className="font-mono text-sm font-bold text-text-primary tracking-wider">
        {code}
      </span>
      <button
        onClick={handleCopy}
        className="p-1 rounded hover:bg-elevated text-text-tertiary hover:text-text-primary transition-colors"
        title="Copy code"
      >
        {copied ? (
          <Check size={12} className="text-success" />
        ) : (
          <Copy size={12} />
        )}
      </button>
    </div>
  )
}

const CreateRoom = ({ onBack, onCreate }) => {
  const [format, setFormat] = useState("sprint")

  const handleCreate = () => {
    onCreate({ format })
  }

  return (
    <div className="flex flex-col h-screen bg-void text-text-secondary antialiased">
      <Header onBack={onBack} />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-text-primary font-sans">
              Create Room
            </h1>
            <p className="text-sm text-text-tertiary font-sans">
              Set up a custom duel and invite a friend
            </p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-text-tertiary">
                Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {formatOptions.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`px-3 py-3 text-xs font-mono font-bold rounded-lg border transition-all ${
                      format === f.id
                        ? "text-accent bg-accent/10 border-accent/20"
                        : "text-text-tertiary bg-void border-border hover:border-text-tertiary"
                    }`}
                  >
                    <div>{f.name}</div>
                    <div className="text-[9px] font-normal mt-1 opacity-60">
                      {f.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleCreate}
              className="w-full px-6 py-3 text-sm font-mono font-bold text-white bg-accent hover:bg-accent-muted rounded-xl transition-colors"
            >
              Create &amp; Enter Room
            </button>
            <button
              onClick={onBack}
              className="w-full px-6 py-3 text-sm font-mono font-bold text-text-tertiary bg-surface hover:bg-elevated border border-border rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const JoinRoom = ({ onBack, onJoin, serverError }) => {
  const [roomCode, setRoomCode] = useState("")
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef(null)
  const errorTimerRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    return () => clearTimeout(errorTimerRef.current)
  }, [])

  useEffect(() => {
    if (serverError) {
      clearTimeout(errorTimerRef.current)
      setError(serverError)
      setJoining(false)
    }
  }, [serverError])

  const handleJoin = () => {
    if (roomCode.length < 4) return
    setJoining(true)
    setError("")
    clearTimeout(errorTimerRef.current)
    errorTimerRef.current = setTimeout(() => {
      setError("Room not found or is full")
      setJoining(false)
    }, 8000)
    onJoin({ code: roomCode.toUpperCase() })
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleJoin()
  }

  return (
    <div className="flex flex-col h-screen bg-void text-text-secondary antialiased">
      <Header onBack={onBack} />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-text-primary font-sans">
              Join Room
            </h1>
            <p className="text-sm text-text-tertiary font-sans">
              Enter a room code to join an existing duel
            </p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-text-tertiary">
                Room Code
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase().slice(0, 6))
                    setError("")
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full bg-void border border-border rounded-lg px-4 py-3 font-mono text-lg font-bold text-text-primary tracking-[0.3em] text-center placeholder:text-text-tertiary placeholder:tracking-[0.2em] placeholder:font-normal focus:outline-none focus:border-accent/50 transition-colors"
                />
                {roomCode && (
                  <button
                    onClick={() => setRoomCode("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-primary transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {error && (
                <p className="text-[11px] font-mono text-danger">{error}</p>
              )}
              <p className="text-[10px] font-mono text-text-tertiary">
                {roomCode.length}/6 characters
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleJoin}
              disabled={roomCode.length < 4 || joining}
              className="w-full px-6 py-3 text-sm font-mono font-bold text-white bg-accent hover:bg-accent-muted rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {joining ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <UsersIcon size={14} />
                  Join Room
                </>
              )}
            </button>
            <button
              onClick={onBack}
              className="w-full px-6 py-3 text-sm font-mono font-bold text-text-tertiary bg-surface hover:bg-elevated border border-border rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const Lobby = ({ onBack, roomCode, format }) => {
  const [copied, setCopied] = useState(false)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fmt = formatOptions.find((f) => f.id === format) || formatOptions[0]

  return (
    <div className="flex flex-col h-screen bg-void text-text-secondary antialiased">
      <Header onBack={onBack} roomCode={roomCode} />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-5">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-3 bg-surface border border-border rounded-xl px-6 py-4">
              <Hash size={20} className="text-text-tertiary" />
              <span className="font-mono text-3xl font-bold text-text-primary tracking-[0.3em]">
                {roomCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-lg hover:bg-elevated text-text-tertiary hover:text-text-primary transition-colors"
                title="Copy room code"
              >
                {copied ? (
                  <Check size={16} className="text-success" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
            <div className="flex items-center justify-center gap-3 text-[10px] font-mono">
              <span className="px-2.5 py-1 rounded-md border text-accent bg-accent/10 border-accent/20">
                {fmt.name}
              </span>
              <span className="text-text-tertiary">{fmt.desc}</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-text-tertiary">
                Status
              </span>
              <span className="text-[10px] font-mono text-warning flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                Waiting for opponent
              </span>
            </div>

            <div className="flex items-center gap-3 bg-void border border-dashed border-border rounded-lg px-4 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-elevated text-text-tertiary">
                <UsersIcon size={16} />
              </div>
              <div className="flex-1">
                <span className="text-sm text-text-tertiary font-mono animate-pulse">
                  Waiting for opponent to join...
                </span>
                <p className="text-[10px] font-mono text-text-tertiary mt-1">
                  Share the code above to invite a friend
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onBack}
            className="w-full px-6 py-3 text-sm font-mono font-bold text-text-tertiary bg-surface hover:bg-elevated border border-border rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <X size={14} />
            Leave Room
          </button>
        </div>
      </div>
    </div>
  )
}

const DuelView = ({
  onForfeit,
  problem,
  questionIndex,
  totalQuestions,
  opponent,
  player,
  timeLeft,
  scores,
  opponentActivity,
  code,
  setCode,
  runStatus,
  submitStatus,
  runResults,
  onRun,
  onSubmit,
  submitted,
  opponentScore,
  resultData,
  onRematch,
  rematchStatus,
  scorePopup,
  opponentGone,
}) => {
  const timeMinutes = Math.floor(timeLeft / 60)
  const timeSeconds = timeLeft % 60
  const isLow = timeLeft <= 60

  if (resultData) {
    return <DuelResult data={resultData} onRematch={onRematch} rematchStatus={rematchStatus} onForfeit={onForfeit} />
  }

  return (
    <div className="flex flex-col h-screen bg-void text-text-secondary antialiased">
      <header className="h-14 flex items-center justify-between px-5 bg-void border-b border-border shrink-0 select-none">
        <div className="flex items-center gap-3">
          <SwordsIcon size={14} className="text-text-tertiary" />
          <span className="text-sm font-bold text-text-primary font-sans">
            Duel
          </span>
          <span className="text-[10px] font-mono text-text-tertiary">
            Q{(questionIndex || 0) + 1}/{totalQuestions || 1}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-1.5">
            <FlameIcon size={12} className={isLow ? "text-danger" : "text-warning"} />
            <span className={`font-mono text-sm font-bold ${isLow ? "text-danger" : "text-text-primary"}`}>
              {timeMinutes}:{String(timeSeconds).padStart(2, "0")}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-1.5">
            <TrophyIcon size={12} className="text-accent" />
            <span className="font-mono text-sm font-bold text-text-primary">
              {scores?.[player?.id] || 0}
            </span>
          </div>
          <button
            onClick={onForfeit}
            className="px-3 py-1.5 text-[10px] font-mono font-bold text-danger bg-danger/10 border border-danger/20 rounded-lg hover:bg-danger/20 transition-colors"
          >
            Forfeit
          </button>
        </div>
      </header>

      {opponentGone && (
        <div className="flex items-center justify-between px-5 py-2 text-xs font-bold text-warning shrink-0">
          <span>
            <Loader size={12} className="animate-spin mr-1" />
            Opponent disconnected — waiting {opponentGone.seconds}s
          </span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[300px] flex flex-col border-r border-border bg-surface shrink-0 overflow-y-auto">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-text-tertiary">
                Problem
              </span>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${difficultyColor(problem?.difficulty)}`}>
                {problem?.difficulty}
              </span>
            </div>
            <h3 className="text-sm font-bold text-text-primary font-sans mt-2">
              {problem?.title || "Loading..."}
            </h3>
          </div>

          <div className="px-4 py-3 space-y-3">
            {problem?.description && (
              <div className="text-[11px] text-text-secondary leading-relaxed font-sans whitespace-pre-wrap">
                {problem.description}
              </div>
            )}

            {problem?.examples?.map((ex, i) => (
              <div key={i} className="bg-void border border-border rounded-lg p-3 space-y-2">
                <span className="text-[9px] font-mono font-bold text-text-tertiary uppercase">
                  Example {i + 1}
                </span>
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-text-tertiary">
                    <span className="text-accent">Input:</span>{" "}
                    <span className="text-text-secondary">{ex.input}</span>
                  </div>
                  <div className="text-[10px] font-mono text-text-tertiary">
                    <span className="text-success">Output:</span>{" "}
                    <span className="text-text-secondary">{ex.output}</span>
                  </div>
                </div>
              </div>
            ))}

            {problem?.constraints?.length > 0 && (
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold text-text-tertiary uppercase">
                  Constraints
                </span>
                {problem.constraints.map((c, i) => (
                  <div key={i} className="text-[10px] font-mono text-text-secondary">
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-auto px-4 py-3 border-t border-border space-y-2">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-text-tertiary">
              Opponent
            </span>
            <div className="flex items-center gap-3 bg-void border border-border rounded-lg px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-elevated text-text-secondary text-[10px] font-bold font-mono">
                {(opponent?.username || "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-text-primary font-mono truncate">
                  {opponent?.username || "Unknown"}
                </div>
                <div className="text-[9px] font-mono text-text-tertiary flex items-center gap-1">
                  <span className={`h-1 w-1 rounded-full ${
                    opponentActivity === "coding" ? "bg-success animate-pulse" :
                    opponentActivity === "running" ? "bg-warning animate-pulse" :
                    opponentActivity === "submitting" ? "bg-accent animate-pulse" :
                    "bg-text-tertiary"
                  }`} />
                  {opponentActivity || "idle"}
                </div>
              </div>
              <span className="font-mono text-[10px] font-bold text-text-tertiary">
                {opponentScore || 0} pts
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <MonacoEditor
            value={code}
            onChange={setCode}
            language="javascript"
            onRun={onRun}
            onSubmit={onSubmit}
          />

          <OutputTerminal status={runStatus || (submitted ? "passed" : "idle")} results={runResults} />

          <div className="h-12 flex items-center justify-end gap-3 px-4 border-t border-border bg-surface shrink-0">
            <button
              onClick={onRun}
              disabled={runStatus === "running" || submitStatus === "running"}
              className="px-5 py-2 text-xs font-mono font-bold text-text-primary bg-elevated hover:bg-base border border-border rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CodeIcon size={13} />
              Run
            </button>
            <button
              onClick={onSubmit}
              disabled={runStatus === "running" || submitStatus === "running" || submitted}
              className={`px-5 py-2 text-xs font-mono font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 ${
                submitted
                  ? "text-success bg-success/10 border border-success/20"
                  : "text-white bg-accent hover:bg-accent-muted"
              }`}
            >
              {submitStatus === "running" ? (
                <>
                  <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : submitted ? (
                <>
                  <Check size={13} />
                  Submitted
                </>
              ) : (
                <>
                  <SwordsIcon size={13} />
                  Submit
                </>
              )}
            </button>
          </div>
        </div>
      </div>

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
    </div>
  )
}

const TrophyIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
)

const DuelResult = ({ data, onRematch, rematchStatus, onForfeit }) => {
  const isWin = data.result === "win"
  const isDraw = data.result === "draw"

  return (
    <div className="flex flex-col h-screen bg-void text-text-secondary antialiased">
      <Header onBack={onForfeit} />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-3">
            <div className={`inline-flex items-center justify-center h-20 w-20 rounded-2xl ${
              isWin ? "bg-success/10 border border-success/20" :
              isDraw ? "bg-warning/10 border border-warning/20" :
              "bg-danger/10 border border-danger/20"
            }`}>
              {isWin ? (
                <MedalIcon size={36} className="text-success" />
              ) : isDraw ? (
                <HandshakeIcon size={36} className="text-warning" />
              ) : (
                <ShieldIcon size={36} className="text-danger" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-text-primary font-sans">
              {isWin ? "Victory!" : isDraw ? "Draw" : "Defeat"}
            </h1>
            <p className="text-sm text-text-tertiary font-sans">{data.reason}</p>
            {data.ratingChange !== 0 && (
              <p className={`text-sm font-mono font-bold ${data.ratingChange > 0 ? "text-success" : "text-danger"}`}>
                {data.ratingChange > 0 ? "+" : ""}{data.ratingChange} rating
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-text-tertiary">
                You
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-text-tertiary">Score</span>
                  <span className="text-sm font-mono font-bold text-text-primary">{data.yourTotalScore}</span>
                </div>
                {data.yourScore && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-text-tertiary">Accuracy</span>
                      <span className="text-xs font-mono font-bold text-text-primary">{data.yourScore.accuracy}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-text-tertiary">Solved</span>
                      <span className="text-xs font-mono font-bold text-text-primary">{data.yourScore.problemsCompleted}/{data.problemsTotal}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-text-tertiary">
                Opponent
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-text-tertiary">Score</span>
                  <span className="text-sm font-mono font-bold text-text-primary">{data.opponentTotalScore}</span>
                </div>
                {data.opponentScore && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-text-tertiary">Accuracy</span>
                      <span className="text-xs font-mono font-bold text-text-primary">{data.opponentScore.accuracy}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-text-tertiary">Solved</span>
                      <span className="text-xs font-mono font-bold text-text-primary">{data.opponentScore.problemsCompleted}/{data.problemsTotal}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={onRematch}
              disabled={rematchStatus === "voted"}
              className="w-full px-6 py-3 text-sm font-mono font-bold text-white bg-accent hover:bg-accent-muted rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <SwordsIcon size={14} />
              {rematchStatus === "voted" ? "Waiting for opponent..." : "Rematch"}
            </button>
            <button
              onClick={onForfeit}
              className="w-full px-6 py-3 text-sm font-mono font-bold text-text-tertiary bg-surface hover:bg-elevated border border-border rounded-xl transition-colors"
            >
              Leave
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const CustomRoomPage = ({ onBack }) => {
  const [phase, setPhase] = useState("select")
  const [roomCode, setRoomCode] = useState("")
  const [roomId, setRoomId] = useState("")
  const [format, setFormat] = useState("sprint")
  const [problem, setProblem] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [opponent, setOpponent] = useState(null)
  const [player, setPlayer] = useState(null)
  const [code, setCode] = useState("")
  const [runStatus, setRunStatus] = useState("idle")
  const [submitStatus, setSubmitStatus] = useState("idle")
  const [runResults, setRunResults] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [scores, setScores] = useState({})
  const [opponentActivity, setOpponentActivity] = useState("idle")
  const [opponentScore, setOpponentScore] = useState(0)
  const [resultData, setResultData] = useState(null)
  const [rematchStatus, setRematchStatus] = useState("")
  const [scorePopup, setScorePopup] = useState(null)
  const [joinError, setJoinError] = useState("")
  const [opponentGone, setOpponentGone] = useState(null)
  const [notice, setNotice] = useState(null)

  const ws = useWebSocket()
  const { isConnected } = ws
  const timerRef = useRef(null)
  const playerIdRef = useRef(null)
  const submitTimerRef = useRef(null)
  const noticeTimerRef = useRef(null)
  const goneTimerRef = useRef(null)

  const showNotice = (message) => {
    setNotice(message)
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
    noticeTimerRef.current = setTimeout(() => setNotice(null), 4000)
  }

  useEffect(() => {
    ws.on("test_room_created", (msg) => {
      setRoomCode(msg.roomCode)
      setRoomId(`test-${msg.roomCode}`)
      setFormat(msg.format?.id || "sprint")
      setPhase("lobby")
    })

    ws.on("test_room_joined", (msg) => {
      setJoinError("")
      setRoomCode(msg.roomCode)
      setRoomId(`test-${msg.roomCode}`)
      setProblem(msg.question)
      setOpponent(msg.opponent)
      setPlayer(msg.player)
      playerIdRef.current = msg.player?.id
      setTotalQuestions(msg.totalQuestions)
      setFormat(msg.format?.id || "sprint")
      setTimeLeft(msg.timeLimit)
      setPhase("duel")
    })

    ws.on("test_opponent_joined", (msg) => {
      setRoomCode(msg.roomCode)
      setRoomId(`test-${msg.roomCode}`)
      setProblem(msg.question)
      setOpponent(msg.opponent)
      setPlayer(msg.player)
      playerIdRef.current = msg.player?.id
      setTotalQuestions(msg.totalQuestions)
      setFormat(msg.format?.id || "sprint")
      setTimeLeft(msg.timeLimit)
      setPhase("duel")
    })

    ws.on("duel_run_result", (msg) => {
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current)
      setRunResults(msg.result)
      setRunStatus("idle")
    })

    ws.on("duel_submit_result", (msg) => {
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current)
      setRunResults(msg.result)
      setSubmitStatus("idle")
      setSubmitted(true)
      if (msg.totalScore !== undefined) {
        setScores((prev) => ({ ...prev, [playerIdRef.current]: msg.totalScore }))
      }
      const pts = msg.scoreData?.total || 0
      const tier = msg.scoreData?.tier || "bronze"
      const label = tier === "platinum" ? "Full Pass" : tier === "gold" ? "Strong" : tier === "silver" ? "Partial" : "Failed"
      setScorePopup({ points: pts, label, status: msg.result?.status || "wrong_answer" })
      setTimeout(() => setScorePopup(null), 1500)
    })

    ws.on("next_question", (msg) => {
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current)
      setProblem(msg.question)
      setQuestionIndex(msg.questionIndex)
      setTotalQuestions(msg.totalQuestions)
      setScores(msg.scores)
      setCode("")
      setRunResults(null)
      setRunStatus("idle")
      setSubmitStatus("idle")
      setSubmitted(false)
      setOpponentActivity("coding")
    })

    ws.on("all_questions_done", () => {
      setOpponentActivity("finished")
    })

    ws.on("opponent_activity", (msg) => {
      setOpponentActivity(msg.activity)
    })

    ws.on("opponent_submitted", (msg) => {
      setOpponentActivity("coding")
      if (msg.totalScore !== undefined) {
        setOpponentScore(msg.totalScore)
      }
    })

    ws.on("duel_result", (msg) => {
      setResultData(msg)
    })

    ws.on("player_disconnected", () => {
      setResultData({
        result: "win",
        reason: "Opponent disconnected",
        ratingChange: 10,
        yourScore: null,
        opponentScore: null,
        yourTotalScore: 0,
        opponentTotalScore: 0,
        format: {},
        problemsTotal: 0,
      })
    })

    ws.on("opponent_gone", (msg) => {
      setOpponentGone({ seconds: msg.graceSeconds || 30 })
      setOpponentActivity("idle")
    })

    ws.on("rematch_status", () => {
      setRematchStatus("voted")
    })

    ws.on("rematch_start", (msg) => {
      setProblem(msg.problem)
      setOpponent(msg.opponent)
      setPlayer(msg.player)
      setTotalQuestions(msg.totalQuestions)
      setTimeLeft(msg.timeLimit)
      setQuestionIndex(0)
      setCode("")
      setRunResults(null)
      setRunStatus("idle")
      setSubmitStatus("idle")
      setSubmitted(false)
      setScores({})
      setOpponentScore(0)
      setOpponentActivity("coding")
      setResultData(null)
      setRematchStatus("")
    })

    ws.on("error", (msg) => {
      console.error("WS error:", msg.message)
      if (msg.message) setJoinError(msg.message)
    })

    return () => {
      ws.disconnect()
    }
  }, [ws.on, ws.disconnect])

  const timerActive = timeLeft > 0 && phase === "duel"

  useEffect(() => {
    if (!timerActive) return
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [timerActive])

  const handleConnect = useCallback(() => {
    ws.connect()
  }, [ws.connect])

  const handleCreate = useCallback(
    ({ format: fmt }) => {
      setFormat(fmt)
      setRoomCode("")
      setRoomId("")
      setJoinError("")
      setPhase("creating")
      handleConnect()
      ws.send({ type: "create_test_room", formatId: fmt })
    },
    [ws, handleConnect]
  )

  const handleJoin = useCallback(
    ({ code }) => {
      setRoomCode(code)
      setJoinError("")
      handleConnect()
      ws.send({ type: "join_test_room", roomCode: code })
    },
    [ws, handleConnect]
  )

  const handleRun = useCallback(() => {
    if (!code.trim() || runStatus === "running") return
    setRunStatus("running")
    setRunResults(null)
    ws.send({ type: "duel_run", roomId, code })
    ws.send({ type: "activity_update", roomId, activity: "running" })
  }, [code, runStatus, ws, roomId])

  const handleSubmit = useCallback(() => {
    if (!code.trim() || submitStatus === "running" || submitted) return
    setSubmitStatus("running")
    ws.send({ type: "duel_submit", roomId, code })
    ws.send({ type: "activity_update", roomId, activity: "submitting" })
  }, [code, submitStatus, submitted, ws, roomId])

  const handleRematch = useCallback(() => {
    ws.send({ type: "rematch_vote", roomId })
  }, [ws, roomId])

  const handleCodeChange = useCallback(
    (val) => {
      setCode(val)
      if (phase === "duel" && roomId) {
        ws.send({ type: "activity_update", roomId, activity: "coding" })
      }
    },
    [ws, roomId, phase]
  )

  const handleLeave = useCallback(() => {
    ws.disconnect()
    onBack()
  }, [ws, onBack])

  useEffect(() => {
    if (code && phase === "duel" && roomId) {
      const timeout = setTimeout(() => {
        ws.send({ type: "activity_update", roomId, activity: "coding" })
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [code, phase, roomId, ws])

  if (phase === "duel") {
    return (
      <DuelView
        onForfeit={handleLeave}
        problem={problem}
        questionIndex={questionIndex}
        totalQuestions={totalQuestions}
        opponent={opponent}
        player={player}
        timeLeft={timeLeft}
        scores={scores}
        opponentActivity={opponentActivity}
        code={code}
        setCode={handleCodeChange}
        runStatus={runStatus}
        submitStatus={submitStatus}
        runResults={runResults}
        onRun={handleRun}
        onSubmit={handleSubmit}
        submitted={submitted}
        opponentScore={opponentScore}
        resultData={resultData}
        onRematch={handleRematch}
        rematchStatus={rematchStatus}
        scorePopup={scorePopup}
        opponentGone={opponentGone}
      />
    )
  }

  if (phase === "lobby") {
    return (
      <Lobby
        onBack={handleLeave}
        roomCode={roomCode}
        format={format}
      />
    )
  }

  if (phase === "creating") {
    return (
      <div className="flex flex-col h-screen bg-void text-text-secondary antialiased">
        <Header onBack={() => setPhase("select")} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="h-10 w-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-mono text-text-tertiary">Creating room...</p>
            <button
              onClick={() => setPhase("select")}
              className="px-6 py-2.5 text-xs font-mono font-bold text-text-tertiary bg-surface hover:bg-elevated border border-border rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === "create") {
    return (
      <CreateRoom
        onBack={() => setPhase("select")}
        onCreate={handleCreate}
      />
    )
  }

  if (phase === "join") {
    return (
      <JoinRoom
        onBack={() => setPhase("select")}
        onJoin={handleJoin}
        serverError={joinError}
      />
    )
  }

  return (
    <div className="flex flex-col h-screen bg-void text-text-secondary antialiased">
      <Header onBack={onBack} />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-text-primary font-sans">
              Custom Room
            </h1>
            <p className="text-sm text-text-tertiary font-sans">
              Create a private duel room or join one with a code
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setPhase("create")}
              className="bg-surface border border-border rounded-xl p-6 text-center space-y-3 hover:border-accent/40 transition-all group cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-elevated text-text-secondary mx-auto group-hover:text-accent transition-colors">
                <SwordsIcon size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary font-sans">
                  Create Room
                </h3>
                <p className="text-[10px] text-text-tertiary mt-1 font-sans">
                  Host a new duel room
                </p>
              </div>
            </button>

            <button
              onClick={() => setPhase("join")}
              className="bg-surface border border-border rounded-xl p-6 text-center space-y-3 hover:border-accent/40 transition-all group cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-elevated text-text-secondary mx-auto group-hover:text-accent transition-colors">
                <Hash size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary font-sans">
                  Join Room
                </h3>
                <p className="text-[10px] text-text-tertiary mt-1 font-sans">
                  Enter a room code
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomRoomPage
