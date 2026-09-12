import React, { useState, useMemo, useCallback, useEffect } from "react"
import {
  Search,
  CheckCircle2,
  Circle,
  Flame,
  Trophy,
  Target,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  Clock,
  Zap,
} from "lucide-react"

import { problems as problemsApi } from "../../api/client"
import { useAuth } from "../../contexts/AuthContext"

const difficultyBadge = (d) => {
  if (d === "Easy") return "text-success bg-success/12 border-success/25"
  if (d === "Medium") return "text-warning bg-warning/12 border-warning/25"
  return "text-danger bg-danger/12 border-danger/25"
}

const difficultyDot = (d) => {
  if (d === "Easy") return "bg-success"
  if (d === "Medium") return "bg-warning"
  return "bg-danger"
}

const TABS = [
  { key: "all", label: "All" },
  { key: "unsolved", label: "Unsolved" },
  { key: "solved", label: "Solved" },
  { key: "daily", label: "Daily" },
]

const DIFFICULTY_ORDER = { Easy: 0, Medium: 1, Hard: 2 }

const SortIcon = ({ col, sortKey, sortDir }) => {
  if (sortKey !== col) return <ArrowUpDown size={12} className="text-text-tertiary" />
  return sortDir === "asc"
    ? <ArrowUp size={12} className="text-accent" />
    : <ArrowDown size={12} className="text-accent" />
}

const ProblemsPage = ({ onNavigateToProblem }) => {
  const { user } = useAuth()
  const [allProblems, setAllProblems] = useState([])
  const [allTopics, setAllTopics] = useState([])
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("All")
  const [topicFilter, setTopicFilter] = useState("All")
  const [sortKey, setSortKey] = useState("id")
  const [sortDir, setSortDir] = useState("asc")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    problemsApi.list()
      .then((res) => {
        setAllProblems(res.problems)
        setAllTopics(res.allTopics)
      })
      .catch(() => {})
  }, [])

  const handleSort = useCallback((key) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"))
        return key
      }
      setSortDir("asc")
      return key
    })
  }, [])

  const filtered = useMemo(() => {
    let list = [...allProblems]

    if (activeTab === "solved") list = list.filter((p) => p.solved)
    else if (activeTab === "unsolved") list = list.filter((p) => !p.solved)
    else if (activeTab === "daily") list = list.filter((p) => p.isDaily)

    if (difficultyFilter !== "All") {
      list = list.filter((p) => p.difficulty === difficultyFilter)
    }

    if (topicFilter !== "All") {
      list = list.filter((p) => p.topics.includes(topicFilter))
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.topics.some((t) => t.toLowerCase().includes(q)) ||
          p.difficulty.toLowerCase().includes(q) ||
          String(p.id).includes(q)
      )
    }

    list.sort((a, b) => {
      let cmp = 0
      if (sortKey === "id") cmp = a.id - b.id
      else if (sortKey === "title") cmp = a.title.localeCompare(b.title)
      else if (sortKey === "difficulty") cmp = DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
      else if (sortKey === "acceptance") cmp = a.acceptance - b.acceptance
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [allProblems, activeTab, difficultyFilter, topicFilter, search, sortKey, sortDir])

  const totalSolved = allProblems.filter((p) => p.solved).length
  const dailyProblem = allProblems.find((p) => p.isDaily)

  return (
    <div className="min-h-screen bg-void font-sans text-text-secondary antialiased">
      <div className="mx-auto max-w-[1120px] px-8 py-6 space-y-5">

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Problems</h1>
            <p className="text-sm font-medium text-text-tertiary mt-1">
              Practice and sharpen your competitive edge
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-xs bg-surface border border-border px-3.5 py-2 rounded-lg">
              <span className="flex items-center gap-1.5 font-semibold text-text-secondary">
                <Target size={13} className="text-success" />
                <strong className="text-success font-mono">{totalSolved}</strong>
                <span className="text-text-tertiary">/ {allProblems.length} solved</span>
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1.5 font-semibold text-text-secondary">
                <Flame size={13} className="text-danger" />
                <span className="text-text-tertiary">Streak</span>
                <strong className="text-warning font-mono">{user?.streak || 0}d</strong>
              </span>
            </div>
          </div>
        </header>

        {dailyProblem && (
          <div className="rounded-xl bg-surface border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-elevated border border-border shrink-0">
                <Zap size={20} className="text-accent" strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-elevated px-2 py-0.5 rounded-md">Daily Challenge</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${difficultyBadge(dailyProblem.difficulty)}`}>
                    {dailyProblem.difficulty}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-text-primary mt-1">
                  #{dailyProblem.id} — {dailyProblem.title}
                </h3>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {dailyProblem.topics.join(" · ")}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToProblem && onNavigateToProblem(dailyProblem)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-accent bg-elevated hover:bg-border border border-border rounded-lg transition-colors shrink-0"
            >
              <Clock size={13} />
              Solve Now
            </button>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search problems by title, topic, or number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm font-medium bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-lg border transition-all ${
                showFilters
                  ? "bg-accent/12 text-accent border-accent/25"
                  : "bg-surface text-text-tertiary border-border hover:text-text-primary hover:border-text-tertiary"
              }`}
            >
              <Filter size={14} />
              Filters
              {(difficultyFilter !== "All" || topicFilter !== "All") && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-black text-white">
                  {(difficultyFilter !== "All" ? 1 : 0) + (topicFilter !== "All" ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 px-1">
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
                            ? "bg-success/12 text-success border-success/25"
                            : d === "Medium"
                            ? "bg-warning/12 text-warning border-warning/25"
                            : d === "Hard"
                            ? "bg-danger/12 text-danger border-danger/25"
                            : "bg-text-primary/10 text-text-primary border-text-primary/20"
                          : "bg-surface text-text-tertiary border-border hover:text-text-primary"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <span className="text-border">|</span>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Topic</span>
                <div className="relative">
                  <select
                    value={topicFilter}
                    onChange={(e) => setTopicFilter(e.target.value)}
                    className="appearance-none text-[11px] font-bold pl-3 pr-7 py-1.5 rounded-lg border bg-surface text-text-secondary border-border focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="All">All Topics</option>
                    {allTopics.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                </div>
              </div>

              {(difficultyFilter !== "All" || topicFilter !== "All") && (
                <>
                  <span className="text-border">|</span>
                  <button
                    onClick={() => { setDifficultyFilter("All"); setTopicFilter("All") }}
                    className="text-[11px] font-bold text-danger hover:text-danger/80 transition-colors"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 border-b border-border">
          {TABS.map((tab) => {
            const count =
              tab.key === "all"
                ? allProblems.length
                : tab.key === "solved"
                ? allProblems.filter((p) => p.solved).length
                : tab.key === "unsolved"
                ? allProblems.filter((p) => !p.solved).length
                : allProblems.filter((p) => p.isDaily).length
            return (
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
                    activeTab === tab.key ? "text-accent/70" : "text-text-tertiary"
                  }`}>
                    {count}
                  </span>
                </span>
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
                )}
              </button>
            )
          })}
        </div>

        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="grid grid-cols-[48px_1fr_140px_100px_100px_90px] gap-4 px-5 py-2.5 border-b border-border text-[10px] font-bold uppercase tracking-wider text-text-tertiary select-none">
            <button onClick={() => handleSort("id")} className="flex items-center gap-1 hover:text-text-primary transition-colors text-left">
              # <SortIcon col="id" sortKey={sortKey} sortDir={sortDir} />
            </button>
            <button onClick={() => handleSort("title")} className="flex items-center gap-1 hover:text-text-primary transition-colors text-left">
              Title <SortIcon col="title" sortKey={sortKey} sortDir={sortDir} />
            </button>
            <span>Topics</span>
            <button onClick={() => handleSort("difficulty")} className="flex items-center gap-1 hover:text-text-primary transition-colors text-left">
              Difficulty <SortIcon col="difficulty" sortKey={sortKey} sortDir={sortDir} />
            </button>
            <button onClick={() => handleSort("acceptance")} className="flex items-center gap-1 hover:text-text-primary transition-colors text-left">
              Acceptance <SortIcon col="acceptance" sortKey={sortKey} sortDir={sortDir} />
            </button>
            <span className="text-right">Status</span>
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="flex justify-center mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-elevated border border-border">
                  <Search size={20} className="text-text-tertiary" />
                </div>
              </div>
              <p className="text-sm font-bold text-text-tertiary">No problems found</p>
              <p className="text-xs text-text-tertiary mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filtered.map((problem) => (
                <div
                  key={problem.id}
                  onClick={() => onNavigateToProblem && onNavigateToProblem(problem)}
                  className="grid grid-cols-[48px_1fr_140px_100px_100px_90px] gap-4 px-5 py-3 items-center hover:bg-elevated transition-colors cursor-pointer group"
                >
                  <span className="text-xs font-mono font-bold text-text-tertiary">{problem.id}</span>

                  <div className="flex items-center gap-2.5 min-w-0">
                    {problem.solved ? (
                      <CheckCircle2 size={15} className="text-success shrink-0" />
                    ) : problem.attempted ? (
                      <Circle size={15} className="text-warning shrink-0" />
                    ) : (
                      <Circle size={15} className="text-text-tertiary shrink-0" />
                    )}
                    <span className="text-sm font-semibold text-text-secondary group-hover:text-text-primary truncate transition-colors">
                      {problem.title}
                    </span>
                    {problem.isDaily && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-warning bg-warning/12 border border-warning/25 px-1.5 py-0.5 rounded shrink-0">
                        <Flame size={9} className="text-warning fill-warning" />
                        Daily
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 min-w-0">
                    {problem.topics.slice(0, 2).map((t) => (
                      <span key={t} className="text-[10px] font-bold text-text-tertiary bg-elevated px-1.5 py-0.5 rounded truncate max-w-[70px]">
                        {t}
                      </span>
                    ))}
                    {problem.topics.length > 2 && (
                      <span className="text-[10px] font-bold text-text-tertiary">+{problem.topics.length - 2}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${difficultyDot(problem.difficulty)}`} />
                    <span className={`text-[11px] font-mono font-bold ${difficultyBadge(problem.difficulty).split(" ")[0]}`}>
                      {problem.difficulty}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-semibold text-text-tertiary">{problem.acceptance}%</span>

                  <div className="text-right">
                    {problem.solved ? (
                      <span className="text-[10px] font-bold text-success bg-success/12 border border-success/25 px-2 py-0.5 rounded-md">
                        Solved
                      </span>
                    ) : problem.attempted ? (
                      <span className="text-[10px] font-bold text-warning bg-warning/12 border border-warning/25 px-2 py-0.5 rounded-md">
                        Attempted
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-text-tertiary">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-text-tertiary font-medium px-1">
          <span>Showing <strong className="text-text-secondary font-mono">{filtered.length}</strong> of {allProblems.length} problems</span>
          <span className="flex items-center gap-1.5">
            <Trophy size={12} className="text-warning" />
            <span className="text-text-tertiary">
              <strong className="text-success font-mono">{allProblems.filter((p) => p.solved).length}</strong> solved
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default ProblemsPage
