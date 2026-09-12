import React, { useState, useEffect } from "react"
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { SwordsIcon, TrophyIcon, TargetIcon, FlameIcon, CodeIcon, GamepadIcon, UsersIcon, BrainIcon } from "../ui/Icons"
import { useAuth } from "../../contexts/AuthContext"
import { difficultyBadge } from "../../utils/badges"
import { duels, submissions } from "../../api/client"

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

const Dashboard = ({ onNavigate }) => {
  const { user } = useAuth()
  const [recentDuels, setRecentDuels] = useState([])
  const [continueSolving, setContinueSolving] = useState([])

  useEffect(() => {
    duels.list()
      .then((data) => {
        const mapped = (Array.isArray(data) ? data : []).slice(0, 3).map((d) => ({
          opponent: d.opponent?.username,
          result: d.result,
          score: "",
          problem: "",
          ratingChange: d.ratingChange || 0,
        }))
        setRecentDuels(mapped)
      })
      .catch(() => setRecentDuels([]))

    submissions.solved()
      .then((data) => {
        const mapped = (Array.isArray(data) ? data : []).slice(0, 4).map((s) => ({
          name: s.title,
          difficulty: s.difficulty,
          progress: 100,
        }))
        setContinueSolving(mapped)
      })
      .catch(() => setContinueSolving([]))
  }, [])

  return (
    <div className="min-h-screen bg-void font-sans text-text-secondary antialiased">
      <div className="mx-auto max-w-[1120px] px-8 py-6 space-y-6">

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
              {getGreeting()}, <span className="text-accent">{user?.name || "Coder"}</span>
            </h1>
            <p className="text-sm font-medium text-text-tertiary mt-1">Ready to solve some problems?</p>
          </div>
        </header>

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <button
              onClick={() => onNavigate && onNavigate("duel")}
              className="group rounded-xl bg-accent p-5 text-left transition-all hover:bg-accent-muted active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/15 text-white">
                    <SwordsIcon size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white leading-none">Ranked Duel</h3>
                    <p className="text-xs font-medium text-white/70 mt-1">Compete for rating & rank</p>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center text-white group-hover:bg-white group-hover:text-accent transition-colors">
                  <ArrowRight size={18} strokeWidth={2.5} />
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate && onNavigate("casual")}
              className="group rounded-xl bg-surface border border-border hover:border-border p-5 text-left transition-all hover:bg-elevated"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-elevated text-text-secondary border border-border">
                    <GamepadIcon size={24} className="text-text-secondary" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-text-primary group-hover:text-text-primary transition-colors leading-none">Casual Duel</h3>
                  <p className="text-xs text-text-tertiary mt-1">Practice without rating changes</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate && onNavigate("custom")}
              className="group rounded-xl bg-surface border border-border hover:border-border p-5 text-left transition-all hover:bg-elevated"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-elevated text-text-secondary border border-border">
                   <UsersIcon size={24} className="text-text-secondary" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-text-primary group-hover:text-text-primary transition-colors leading-none">Custom Room</h3>
                  <p className="text-xs text-text-tertiary mt-1">Play with friends</p>
                </div>
              </div>
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {[
            { icon: TrophyIcon, label: "Rating", value: user?.rating || 1000 },
            { icon: TargetIcon, label: "W / L", value: `${user?.wins || 0}–${user?.losses || 0}` },
            { icon: FlameIcon, label: "Solved", value: user?.solved || 0 },
            { icon: CodeIcon, label: "Rank", value: `#${user?.rank || "---"}` },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="rounded-xl bg-surface border border-border p-4 flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-elevated">
                  <Icon size={22} className="text-text-secondary" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-extrabold font-mono text-text-primary leading-tight truncate">{s.value}</p>
                  <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              </div>
            )
          })}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <section className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Recent Duels</span>
                <button onClick={() => onNavigate && onNavigate("history")} className="text-xs font-bold text-text-tertiary hover:text-text-primary transition-colors">
                  View all
                </button>
              </div>
              <div className="divide-y divide-border-subtle">
                {recentDuels.map((duel, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-elevated transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black font-mono ${
                        duel.result === "W" ? "bg-success/12 text-success border border-success/25" : "bg-danger/12 text-danger border border-danger/25"
                      }`}>
                        {duel.result}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-text-primary">{duel.opponent}</span>
                        <p className="text-xs text-text-tertiary mt-0.5">{duel.problem}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-text-primary">{duel.score}</span>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {duel.ratingChange > 0 ? <TrendingUp size={12} className="text-success" /> : <TrendingDown size={12} className="text-danger" />}
                        <span className={`text-xs font-mono font-bold ${duel.ratingChange > 0 ? "text-success" : "text-danger"}`}>
                          {duel.ratingChange > 0 ? "+" : ""}{duel.ratingChange}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Continue Solving</span>
                <button onClick={() => onNavigate && onNavigate("problems")} className="text-xs font-bold text-text-tertiary hover:text-text-primary transition-colors">
                  View All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {continueSolving.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-surface hover:border-border hover:bg-elevated transition-all cursor-pointer group">
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors truncate">{item.name}</span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${difficultyBadge(item.difficulty)}`}>{item.difficulty}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                          <div className={`h-full rounded-full ${item.progress === 100 ? "bg-success" : "bg-accent"}`} style={{ width: `${item.progress}%` }} />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-text-tertiary">{item.progress}%</span>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-elevated text-text-tertiary group-hover:text-accent group-hover:bg-accent/12 transition-colors">
                       <CodeIcon size={16} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => onNavigate && onNavigate("puzzles")}
              className="w-full rounded-xl bg-surface border border-border hover:border-border p-4 text-left transition-all hover:bg-elevated group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-elevated text-text-secondary border border-border">
                   <BrainIcon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-text-primary group-hover:text-text-primary transition-colors">Daily Puzzle</h3>
                  <p className="text-xs text-text-tertiary">Test your knowledge</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate && onNavigate("leaderboard")}
              className="w-full rounded-xl bg-surface border border-border hover:border-border p-4 text-left transition-all hover:bg-elevated group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-elevated text-text-secondary border border-border">
                   <TrophyIcon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-text-primary group-hover:text-text-primary transition-colors">Leaderboard</h3>
                  <p className="text-xs text-text-tertiary">See your rank</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
