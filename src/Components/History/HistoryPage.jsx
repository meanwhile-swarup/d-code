import React, { useState, useMemo, useEffect } from "react"
import {
  Clock,
  Trophy,
  Target,
  Flame,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Zap,
  Loader2,
} from "lucide-react"
import { duels, submissions } from "../../api/client"
import { difficultyBadge, resultBadge } from "../../utils/badges"

function formatDuration(start, end) {
  if (!start || !end) return "N/A"
  const ms = new Date(end) - new Date(start)
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  return `${mins}:${String(secs).padStart(2, "0")}`
}

const HistoryPage = ({ onNavigate: _onNavigate }) => {
  const [activeTab, setActiveTab] = useState("duels")
  const [resultFilter, setResultFilter] = useState("All")
  const [difficultyFilter, setDifficultyFilter] = useState("All")
  const [sortKey, setSortKey] = useState("date")
  const [sortDir, setSortDir] = useState("desc")
  const [duelHistory, setDuelHistory] = useState([])
  const [solvedList, setSolvedList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [duelData, solvedData] = await Promise.all([
          duels.list(),
          submissions.solved(),
        ])
        setDuelHistory(
          duelData.map((d) => ({
            id: d.id,
            date: d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }) : "N/A",
            opponent: d.opponent?.username || "Unknown",
            opponentAvatar: d.opponent?.username?.charAt(0)?.toUpperCase() || "?",
            result: d.result || "pending",
            score: d.result === "W" ? "W" : d.result === "L" ? "L" : d.result === "D" ? "D" : "–",
            problem: d.problemId ? `Problem #${d.problemId}` : (d.format ? d.format : "—"),
            difficulty: "N/A",
            ratingChange: null,
            type: d.type === "test" ? "Casual" : "Ranked",
            duration: d.createdAt && d.completedAt ? formatDuration(d.createdAt, d.completedAt) : "N/A",
          }))
        )
        setSolvedList(
          solvedData.map((s) => ({
            id: s.id,
            title: s.title,
            difficulty: s.difficulty,
            solvedDate: s.solvedAt ? new Date(s.solvedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }) : "N/A",
            runtime: s.runtime != null ? `${s.runtime}ms` : "N/A",
            language: s.language || "Unknown",
          }))
        )
      } catch (err) {
        console.error("Failed to fetch history:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredDuels = useMemo(() => {
    let list = [...duelHistory]

    if (resultFilter !== "All") {
      const target = resultFilter === "Wins" ? "W" : resultFilter === "Losses" ? "L" : resultFilter === "Draws" ? "D" : "pending"
      list = list.filter((d) => d.result === target)
    }

    list.sort((a, b) => {
      let cmp = 0
      if (sortKey === "date") cmp = new Date(a.date) - new Date(b.date)
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [duelHistory, resultFilter, sortKey, sortDir])

  const filteredSolved = useMemo(() => {
    let list = [...solvedList]

    if (difficultyFilter !== "All") {
      list = list.filter((p) => p.difficulty === difficultyFilter)
    }

    list.sort((a, b) => new Date(b.solvedDate) - new Date(a.solvedDate))

    return list
  }, [solvedList, difficultyFilter])

  const wins = duelHistory.filter((d) => d.result === "W").length
  const losses = duelHistory.filter((d) => d.result === "L").length

  if (loading) {
    return (
      <div className="min-h-screen bg-void font-sans text-text-secondary antialiased">
        <div className="mx-auto max-w-[1120px] px-8 py-6 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-void font-sans text-text-secondary antialiased">
      <div className="mx-auto max-w-[1120px] px-8 py-6 space-y-5">

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
              Match History
            </h1>
            <p className="text-sm font-medium text-text-tertiary mt-1">
              Track your duels and solved problems
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs bg-surface border border-border px-3.5 py-2 rounded-lg">
            <span className="flex items-center gap-1.5 font-semibold text-text-secondary">
              <Trophy size={13} className="text-success" />
              <strong className="text-success font-mono">{wins}W</strong>
            </span>
            <span className="text-border">-</span>
            <span className="flex items-center gap-1.5 font-semibold text-text-secondary">
              <Target size={13} className="text-danger" />
              <strong className="text-danger font-mono">{losses}L</strong>
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1.5 font-semibold text-text-secondary">
              <Zap size={13} className="text-info" />
              <strong className="text-info font-mono">{solvedList.length}</strong>
              <span className="text-text-tertiary">solved</span>
            </span>
          </div>
        </header>

        <div className="flex items-center gap-1 border-b border-border">
          {[
            { key: "duels", label: "Duels", count: duelHistory.length },
            { key: "solved", label: "Solved Problems", count: solvedList.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-4 py-2.5 text-xs font-bold transition-colors ${
                activeTab === tab.key
                  ? "text-accent"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {tab.label}
                <span className={`text-[10px] font-mono ${
                  activeTab === tab.key ? "text-accent/60" : "text-text-tertiary"
                }`}>
                  {tab.count}
                </span>
              </span>
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {activeTab === "duels" ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Result</span>
                  <div className="relative">
                    <select
                      value={resultFilter}
                      onChange={(e) => setResultFilter(e.target.value)}
                      className="appearance-none text-[11px] font-bold pl-3 pr-7 py-1.5 rounded-lg border bg-surface text-text-secondary border-border focus:outline-none focus:border-accent cursor-pointer"
                    >
                      <option value="All">All</option>
                      <option value="Wins">Wins</option>
                      <option value="Losses">Losses</option>
                      <option value="Draws">Draws</option>
                      <option value="Pending">Pending</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                  </div>
                </div>

                <span className="text-border">|</span>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Sort</span>
                  <div className="relative">
                    <select
                      value={`${sortKey}-${sortDir}`}
                      onChange={(e) => {
                        const [key, dir] = e.target.value.split("-")
                        setSortKey(key)
                        setSortDir(dir)
                      }}
                      className="appearance-none text-[11px] font-bold pl-3 pr-7 py-1.5 rounded-lg border bg-surface text-text-secondary border-border focus:outline-none focus:border-accent cursor-pointer"
                    >
                      <option value="date-desc">Recent</option>
                      <option value="date-asc">Oldest</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface overflow-hidden">
                <div className="grid grid-cols-[100px_1fr_60px_80px_1fr_80px_100px_80px_70px] gap-3 px-5 py-2.5 border-b border-border text-[10px] font-bold uppercase tracking-wider text-text-tertiary select-none">
                  <span>Date</span>
                  <span>Opponent</span>
                  <span>Result</span>
                  <span>Score</span>
                  <span>Problem</span>
                  <span>Difficulty</span>
                  <span>Rating</span>
                  <span>Type</span>
                  <span className="text-right">Duration</span>
                </div>

                {filteredDuels.length === 0 ? (
                  <div className="px-5 py-16 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-elevated border border-border">
                        <Clock size={20} className="text-text-tertiary" />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-text-tertiary">No matches found</p>
                    <p className="text-xs text-text-tertiary mt-1">{duelHistory.length === 0 ? "Play a ranked duel to see it here" : "Try adjusting your filters"}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {filteredDuels.map((duel) => (
                      <div
                        key={duel.id}
                        className="grid grid-cols-[100px_1fr_60px_80px_1fr_80px_100px_80px_70px] gap-3 px-5 py-3 items-center hover:bg-elevated transition-colors"
                      >
                        <span className="text-xs font-mono text-text-tertiary">{duel.date}</span>

                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-elevated border border-border text-[10px] font-black font-mono text-text-tertiary">
                            {duel.opponentAvatar}
                          </div>
                          <span className="text-sm font-semibold text-text-primary truncate">{duel.opponent}</span>
                        </div>

                        <div>
                          <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded border ${resultBadge(duel.result)}`}>
                            {duel.result}
                          </span>
                        </div>

                        <span className="text-xs font-mono font-bold text-text-primary">{duel.score}</span>

                        <span className="text-xs font-semibold text-text-secondary truncate">{duel.problem}</span>

                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            duel.difficulty === "Easy" ? "bg-success" : duel.difficulty === "Medium" ? "bg-warning" : "bg-danger"
                          }`} />
                          <span className={`text-[11px] font-mono font-bold ${difficultyBadge(duel.difficulty).split(" ")[0]}`}>
                            {duel.difficulty}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {duel.ratingChange == null ? (
                            <span className="text-xs font-mono text-text-tertiary">—</span>
                          ) : duel.ratingChange > 0 ? (
                            <TrendingUp size={12} className="text-success" />
                          ) : (
                            <TrendingDown size={12} className="text-danger" />
                          )}
                          {duel.ratingChange != null && (
                            <span className={`text-xs font-mono font-bold ${duel.ratingChange > 0 ? "text-success" : "text-danger"}`}>
                              {duel.ratingChange > 0 ? "+" : ""}{duel.ratingChange}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${duel.type === "Ranked" ? "text-warning bg-warning/10 border-warning/25" : "text-text-tertiary bg-elevated border-border"}`}>
                            {duel.type}
                          </span>
                        </div>

                        <span className="text-xs font-mono text-text-tertiary text-right">{duel.duration}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-text-tertiary font-medium px-1">
                <span>Showing <strong className="text-text-secondary font-mono">{filteredDuels.length}</strong> of {duelHistory.length} matches</span>
                <span className="flex items-center gap-1.5">
                  <Flame size={12} className="text-danger" />
                  <span className="text-text-tertiary">
                    <strong className="text-success font-mono">{wins}</strong> wins
                  </span>
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Difficulty</span>
                  <div className="flex gap-1">
                    {["All", "Easy", "Medium", "Hard"].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficultyFilter(d)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                          difficultyFilter === d
                            ? d === "Easy"
                              ? "bg-success/10 text-success border-success/25"
                              : d === "Medium"
                              ? "bg-warning/10 text-warning border-warning/25"
                              : d === "Hard"
                              ? "bg-danger/10 text-danger border-danger/25"
                              : "bg-text-primary/10 text-text-primary border-text-primary/20"
                            : "bg-surface text-text-tertiary border-border hover:text-text-primary"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface overflow-hidden">
                <div className="grid grid-cols-[1fr_100px_120px_80px_100px] gap-4 px-5 py-2.5 border-b border-border text-[10px] font-bold uppercase tracking-wider text-text-tertiary select-none">
                  <span>Problem</span>
                  <span>Difficulty</span>
                  <span>Solved Date</span>
                  <span>Runtime</span>
                  <span>Language</span>
                </div>

                {filteredSolved.length === 0 ? (
                  <div className="px-5 py-16 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-elevated border border-border">
                        <Target size={20} className="text-text-tertiary" />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-text-tertiary">No problems found</p>
                    <p className="text-xs text-text-tertiary mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {filteredSolved.map((problem) => (
                      <div
                        key={problem.id}
                        className="grid grid-cols-[1fr_100px_120px_80px_100px] gap-4 px-5 py-3 items-center hover:bg-elevated transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-sm font-semibold text-text-secondary group-hover:text-text-primary truncate transition-colors">
                            {problem.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            problem.difficulty === "Easy" ? "bg-success" : problem.difficulty === "Medium" ? "bg-warning" : "bg-danger"
                          }`} />
                          <span className={`text-[11px] font-mono font-bold ${difficultyBadge(problem.difficulty).split(" ")[0]}`}>
                            {problem.difficulty}
                          </span>
                        </div>

                        <span className="text-xs font-mono text-text-tertiary">{problem.solvedDate}</span>

                        <span className="text-xs font-mono font-semibold text-text-primary">{problem.runtime}</span>

                        <div>
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded border bg-elevated border-border text-text-tertiary">
                            {problem.language}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-text-tertiary font-medium px-1">
                <span>Showing <strong className="text-text-secondary font-mono">{filteredSolved.length}</strong> of {solvedList.length} problems</span>
                <span className="flex items-center gap-1.5">
                  <Trophy size={12} className="text-warning" />
                  <span className="text-text-tertiary">
                    <strong className="text-success font-mono">{solvedList.length}</strong> solved
                  </span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default HistoryPage
