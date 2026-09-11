import React, { useState, useEffect } from "react"
import { Zap, Trophy, Target, Flame, Check, X, Code2, ChevronDown } from "lucide-react"
import { puzzles as puzzlesApi } from "../../api/client"
import { difficultyBadge } from "../../utils/badges"

const PuzzlesPage = ({ _onNavigate }) => {
  const [selectedPuzzle, setSelectedPuzzle] = useState(null)
  const [answers, setAnswers] = useState({})
  const [difficultyFilter, setDifficultyFilter] = useState("All")
  const [languageFilter, setLanguageFilter] = useState("All")
  const [puzzleList, setPuzzleList] = useState([])
  const [daily, setDaily] = useState(null)
  const [loading, setLoading] = useState(true)

  const normalize = (p) => {
    let options = p.options
    if (!options && p.answers) {
      if (Array.isArray(p.answers)) options = p.answers
      else if (typeof p.answers === "string") {
        try {
          const parsed = JSON.parse(p.answers)
          options = Array.isArray(parsed) ? parsed : []
        } catch {
          options = []
        }
      }
    }
    return { ...p, options: options || [] }
  }

  useEffect(() => {
    const fetchPuzzles = async () => {
      try {
        const [listData, dailyData] = await Promise.all([
          puzzlesApi.list(),
          puzzlesApi.daily().catch(() => null),
        ])
        const normalized = (Array.isArray(listData) ? listData : []).map(normalize)
        const normalizedDaily = dailyData ? normalize(dailyData) : null
        setPuzzleList(normalized)
        setDaily(normalizedDaily)
        const initial = {}
        for (const p of normalized) {
          if (p.attempted && p.correct) initial[p.id] = p.correctIndex
        }
        if (normalizedDaily && normalizedDaily.attempted && normalizedDaily.correct != null) {
          initial[normalizedDaily.id] = normalizedDaily.correctIndex
        }
        setAnswers(initial)
      } catch (err) {
        console.error("Failed to fetch puzzles:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchPuzzles()
  }, [])

  const filteredPuzzles = puzzleList.filter((p) => {
    if (difficultyFilter !== "All" && p.difficulty !== difficultyFilter) return false
    if (languageFilter !== "All" && p.language !== languageFilter) return false
    return true
  })

  const handleAnswer = async (puzzleId, optionIndex) => {
    if (answers[puzzleId] !== undefined) return
    const target = puzzleList.find((p) => p.id === puzzleId) || (daily?.id === puzzleId ? daily : null)
    if (target?.attempted) return
    setAnswers((prev) => ({ ...prev, [puzzleId]: optionIndex }))
    try {
      const res = await puzzlesApi.attempt(puzzleId, optionIndex)
      const correct = res?.correct ?? (optionIndex === target?.correctIndex)
      setPuzzleList((prev) =>
        prev.map((p) =>
          p.id === puzzleId
            ? { ...p, attempted: true, correct }
            : p
        )
      )
      if (daily?.id === puzzleId) {
        setDaily((prev) => (prev ? { ...prev, attempted: true, correct } : prev))
      }
    } catch (err) {
      console.error("Failed to submit answer:", err)
      setAnswers((prev) => {
        const next = { ...prev }
        delete next[puzzleId]
        return next
      })
    }
  }

  const isCorrect = (puzzleId, correctIndex) => {
    return answers[puzzleId] === correctIndex
  }

  const languageBadge = (lang) => {
    if (lang === "JavaScript") return "text-warning bg-warning/12 border border-warning/25"
    return "text-info bg-info/12 border border-info/25"
  }

  const attempted = puzzleList.filter((p) => p.attempted).length
  const correct = puzzleList.filter((p) => p.correct).length
  const streak = (() => {
    let s = 0
    for (let i = puzzleList.length - 1; i >= 0; i--) {
      if (puzzleList[i].correct) s++
      else break
    }
    return s
  })()
  const xp = puzzleList.filter((p) => p.correct).reduce((sum, p) => sum + p.xp, 0)
  const rank = attempted === 0 ? "-" : correct === attempted ? "S" : correct / attempted > 0.8 ? "A" : correct / attempted > 0.6 ? "B" : "C"

  const stats = [
    { icon: Target, label: "Attempted", value: attempted },
    { icon: Check, label: "Correct", value: correct },
    { icon: Flame, label: "Streak", value: streak },
    { icon: Zap, label: "XP", value: xp.toLocaleString() },
    { icon: Trophy, label: "Rank", value: rank },
  ]

  const filters = [
    { label: "Difficulty", value: difficultyFilter, onChange: setDifficultyFilter, options: ["All", "Easy", "Medium", "Hard"] },
    { label: "Language", value: languageFilter, onChange: setLanguageFilter, options: ["All", "JavaScript", "Python"] },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-text-secondary antialiased">
        <div className="mx-auto max-w-[1120px] px-8 py-6 flex items-center justify-center">
          <div className="text-sm font-medium text-text-tertiary">Loading puzzles...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-void text-text-secondary antialiased">
      <div className="mx-auto max-w-[1120px] px-8 py-6 space-y-6">
        <header className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Puzzles</h1>
            <p className="text-sm font-medium text-text-tertiary mt-1">Test your code knowledge</p>
          </div>
        </header>

        {daily && (
          <section className="rounded-xl border border-warning/25 bg-warning/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/12">
              <Flame size={18} className="text-warning" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-warning uppercase tracking-wider">Daily Puzzle</p>
              <p className="text-sm font-bold text-text-primary truncate">{daily.title}</p>
              <p className="text-[11px] text-text-tertiary">
                {daily.difficulty} · {daily.xp} XP
                {daily.attempted && (
                  <span className={`ml-2 font-bold ${daily.correct ? "text-success" : "text-danger"}`}>
                    {daily.correct ? "Completed" : "Attempted"}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedPuzzle(daily.id)
                document.getElementById(`puzzle-${daily.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
              }}
              className="px-4 py-2 rounded-lg bg-warning/12 text-warning text-xs font-bold border border-warning/25 hover:bg-warning/20 transition-colors shrink-0"
            >
              {daily.attempted ? "Review" : "Solve Now"}
            </button>
          </section>
        )}

        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="rounded-xl bg-surface border border-border p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-elevated">
                  <Icon size={18} className="text-text-secondary" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-extrabold font-mono text-text-primary leading-tight truncate">{s.value}</p>
                  <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              </div>
            )
          })}
        </section>

        <section className="flex flex-wrap items-center gap-3">
          {filters.map((f) => (
            <div key={f.label} className="relative">
              <select
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                className="appearance-none bg-surface border border-border rounded-lg px-3 py-2 pr-8 text-sm font-medium text-text-primary hover:border-text-tertiary/40 focus:outline-none focus:border-accent transition-colors cursor-pointer"
              >
                {f.options.map((opt) => (
                  <option key={opt} value={opt}>{opt === "All" ? `All ${f.label}s` : opt}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            </div>
          ))}
          <span className="text-xs font-medium text-text-tertiary">{filteredPuzzles.length} puzzles</span>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPuzzles.map((puzzle) => {
            const isSelected = selectedPuzzle === puzzle.id
            const hasAnswered = answers[puzzle.id] !== undefined || puzzle.attempted
            const wasCorrect = puzzle.correct === true || (hasAnswered && isCorrect(puzzle.id, puzzle.correctIndex))

            return (
              <div
                key={puzzle.id}
                id={`puzzle-${puzzle.id}`}
                onClick={() => setSelectedPuzzle(isSelected ? null : puzzle.id)}
                className={`rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? hasAnswered
                      ? wasCorrect
                        ? "bg-surface border-success/50"
                        : "bg-surface border-danger/50"
                      : "bg-surface border-accent/50"
                    : "bg-surface border-border hover:border-text-tertiary/40"
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-bold text-text-primary leading-snug">{puzzle.title}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${difficultyBadge(puzzle.difficulty)}`}>
                        {puzzle.difficulty}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${languageBadge(puzzle.language)}`}>
                        {puzzle.language}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Zap size={12} className="text-info" />
                    <span className="text-[10px] font-bold text-info">{puzzle.xp} XP</span>
                    {hasAnswered && (
                      <span className={`ml-auto text-[10px] font-bold ${wasCorrect ? "text-success" : "text-danger"}`}>
                        {wasCorrect ? "Correct" : "Wrong"}
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className="border-t border-border p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                    <div className="rounded-lg bg-void border border-border p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Code2 size={12} className="text-text-secondary" />
                        <span className="text-[10px] font-bold text-text-tertiary uppercase">Code</span>
                      </div>
                      <pre className="text-xs font-mono text-text-primary whitespace-pre-wrap overflow-x-auto">{puzzle.code}</pre>
                    </div>

                    <p className="text-sm font-semibold text-text-primary">{puzzle.question}</p>

                    <div className="grid grid-cols-2 gap-2">
                      {(puzzle.options || []).map((option, idx) => {
                        const letter = String.fromCharCode(65 + idx)
                        const isSelectedOption = answers[puzzle.id] === idx
                        const isCorrectOption = idx === puzzle.correctIndex
                        const showResult = hasAnswered

                        return (
                          <button
                            key={idx}
                            onClick={() => handleAnswer(puzzle.id, idx)}
                            disabled={hasAnswered}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              showResult
                                ? isCorrectOption
                                  ? "bg-success/12 border-success/50 text-success"
                                  : isSelectedOption && !isCorrectOption
                                    ? "bg-danger/12 border-danger/50 text-danger"
                                    : "bg-void border-border text-text-tertiary"
                                : isSelectedOption
                                  ? "bg-accent/12 border-accent/50 text-accent"
                                  : "bg-void border-border text-text-primary hover:border-text-tertiary/40"
                            }`}
                          >
                            <span className="text-[10px] font-mono font-bold opacity-60">{letter}.</span>
                            <span className="text-xs font-medium ml-1">{option}</span>
                          </button>
                        )
                      })}
                    </div>

                    {hasAnswered && (
                      <div className={`rounded-lg p-3 border ${wasCorrect ? "bg-success/8 border-success/25" : "bg-danger/8 border-danger/25"}`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {wasCorrect ? <Check size={14} className="text-success" /> : <X size={14} className="text-danger" />}
                          <span className={`text-xs font-bold ${wasCorrect ? "text-success" : "text-danger"}`}>
                            {wasCorrect ? "Correct!" : "Incorrect"}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary">{puzzle.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </section>

        {filteredPuzzles.length === 0 && (
          <section className="rounded-xl border border-border bg-surface p-12 text-center">
            <p className="text-sm font-bold text-text-tertiary">
              {puzzleList.length === 0 ? "No puzzles available right now" : "No puzzles match these filters"}
            </p>
          </section>
        )}
      </div>
    </div>
  )
}

export default PuzzlesPage
