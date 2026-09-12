import React, { useState, useMemo, useCallback, useEffect } from "react"
import {
  Trophy,
  Medal,
  ArrowUp,
  ArrowDown,
  Minus,
  Search,
  Crown,
  Flame,
  ChevronDown,
  Loader2,
} from "lucide-react"

import { leaderboard } from "../../api/client"
import { useAuth } from "../../contexts/AuthContext"
import { difficultyBadge } from "../../utils/badges"

const TIER_COLORS = {
  Bronze: { text: "#cd7f32", bg: "#cd7f32/12", border: "#cd7f32/25" },
  Silver: { text: "#c0c0c0", bg: "#c0c0c0/12", border: "#c0c0c0/25" },
  Gold: { text: "#ffd700", bg: "#ffd700/12", border: "#ffd700/25" },
  Platinum: { text: "#00ced1", bg: "#00ced1/12", border: "#00ced1/25" },
  Diamond: { text: "#b9f2ff", bg: "#b9f2ff/12", border: "#b9f2ff/25" },
  Master: { text: "#ff6b6b", bg: "#ff6b6b/12", border: "#ff6b6b/25" },
  Grandmaster: { text: "#ffd700", bg: "#ffd700/12", border: "#ffd700/25" },
}

const TABS = [
  { key: "global", label: "Global" },
  { key: "friends", label: "Friends" },
  { key: "weekly", label: "Weekly" },
]

const SORT_OPTIONS = [
  { key: "rating", label: "Rating" },
  { key: "wins", label: "Wins" },
]

const TierBadge = ({ tier }) => {
  const colors = TIER_COLORS[tier] || TIER_COLORS.Bronze
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${difficultyBadge(tier).split(" ").slice(1).join(" ")}`}
      style={{
        color: colors.text,
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      {tier === "Grandmaster" && <Crown size={10} style={{ color: colors.text }} />}
      {tier === "Master" && <Flame size={10} style={{ color: colors.text }} />}
      {tier}
    </span>
  )
}

const RankChange = ({ change }) => {
  if (change > 0) return <ArrowUp size={13} className="text-success" />
  if (change < 0) return <ArrowDown size={13} className="text-danger" />
  return <Minus size={13} className="text-text-tertiary" />
}

const RankBadge = ({ rank }) => {
  if (rank === 1) return <Crown size={16} className="text-warning fill-warning/30" />
  if (rank === 2) return <Medal size={16} className="text-[#c0c0c0]" />
  if (rank === 3) return <Medal size={16} className="text-[#cd7f32]" />
  return <span className="text-xs font-mono font-bold text-text-tertiary">#{rank}</span>
}

const LeaderboardPage = ({ onNavigate: _onNavigate }) => {
  const { user } = useAuth()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("global")
  const [sortKey, setSortKey] = useState("rating")
  const [sortDir, setSortDir] = useState("desc")
  const [showSort, setShowSort] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchPlayers() {
      setLoading(true)
      setError(null)
      try {
        let data
        if (activeTab === "friends") {
          data = await leaderboard.friends()
        } else if (activeTab === "weekly") {
          data = await leaderboard.weekly()
        } else {
          data = await leaderboard.global()
        }
        if (!cancelled) {
          const list = Array.isArray(data) ? data : data.players || data.data || []
          setPlayers(list)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load leaderboard")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchPlayers()
    return () => { cancelled = true }
  }, [activeTab])

  const handleSort = useCallback((key) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"))
        return key
      }
      setSortDir("desc")
      return key
    })
  }, [])

  const filtered = useMemo(() => {
    let list = [...players]

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter((p) => p.username.toLowerCase().includes(q))
    }

    list.sort((a, b) => {
      let cmp = 0
      if (sortKey === "rating") cmp = a.rating - b.rating
      else if (sortKey === "wins") cmp = a.wins - b.wins
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [players, search, sortKey, sortDir])

  const currentUserRank = useMemo(() => {
    if (!user) return null
    return players.findIndex((p) => p.id === user.id || p.username === user.username) + 1
  }, [players, user])

  return (
    <div className="min-h-screen bg-void font-sans text-text-secondary antialiased">
      <div className="mx-auto max-w-[1120px] px-8 py-6 space-y-5">

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
              Leaderboard
            </h1>
            <p className="text-sm font-medium text-text-tertiary mt-1">
              Top competitive coders ranked by performance
            </p>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 text-xs bg-surface border border-border px-3.5 py-2 rounded-lg">
                <span className="flex items-center gap-1.5 font-semibold text-text-secondary">
                  <Trophy size={13} className="text-warning" />
                  <strong className="text-warning font-mono">
                    #{currentUserRank || "—"}
                  </strong>
                  <span className="text-text-tertiary">this week</span>
                </span>
              </div>
            </div>
          )}
        </header>

        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search players by username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm font-medium bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <span className="text-xs">✕</span>
              </button>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSort(!showSort)}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold bg-surface text-text-tertiary border border-border rounded-lg hover:text-text-primary hover:border-text-tertiary transition-all"
            >
              Sort: {SORT_OPTIONS.find((o) => o.key === sortKey)?.label}
              <ChevronDown size={14} />
            </button>
            {showSort && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { handleSort(opt.key); setShowSort(false) }}
                    className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors ${
                      sortKey === opt.key
                        ? "bg-elevated text-text-primary"
                        : "text-text-secondary hover:bg-elevated hover:text-text-primary"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-4 py-2.5 text-xs font-bold transition-colors ${
                activeTab === tab.key
                  ? "text-text-primary"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {tab.label}
              </span>
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-xl border border-border bg-surface px-5 py-24 text-center">
            <Loader2 size={28} className="animate-spin mx-auto text-accent mb-3" />
            <p className="text-sm font-bold text-text-tertiary">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-border bg-surface px-5 py-24 text-center">
            <p className="text-sm font-bold text-danger mb-1">Error loading leaderboard</p>
            <p className="text-xs text-text-tertiary">{error}</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="grid grid-cols-[60px_1fr_120px_100px_120px_80px] gap-4 px-5 py-2.5 border-b border-border text-[10px] font-bold uppercase tracking-wider text-text-tertiary select-none">
                <span>Rank</span>
                <span>Player</span>
                <button onClick={() => handleSort("rating")} className="flex items-center gap-1 hover:text-text-primary transition-colors text-left">
                  Rating {sortKey === "rating" && (sortDir === "asc" ? <ArrowUp size={12} className="text-text-secondary" /> : <ArrowDown size={12} className="text-text-secondary" />)}
                </button>
                <span>W / L</span>
                <span>Tier</span>
                <span className="text-right">Change</span>
              </div>

              {filtered.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-elevated border border-border">
                      <Search size={20} className="text-text-tertiary" />
                    </div>
                  </div>
                  <p className="text-sm font-bold text-text-tertiary">No players found</p>
                  <p className="text-xs text-text-tertiary mt-1">Try adjusting your search</p>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {filtered.map((player, index) => (
                    <div
                      key={player.id}
                      className={`grid grid-cols-[60px_1fr_120px_100px_120px_80px] gap-4 px-5 py-3 items-center transition-colors ${
                        (user && (player.id === user.id || player.username === user.username))
                          ? "bg-elevated"
                          : "hover:bg-elevated/50"
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <RankBadge rank={player.rank || index + 1} />
                      </div>

                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={player.avatar}
                          alt={player.username}
                          className="w-7 h-7 rounded-full bg-elevated border border-border shrink-0"
                        />
                        <span className={`text-sm font-semibold truncate ${
                          (user && (player.id === user.id || player.username === user.username)) ? "text-text-primary" : "text-text-secondary"
                        }`}>
                          {player.username}
                        </span>
                        {(user && (player.id === user.id || player.username === user.username)) && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded shrink-0">
                            You
                          </span>
                        )}
                      </div>

                      <span className="text-sm font-mono font-bold text-text-primary">{player.rating?.toLocaleString()}</span>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-semibold text-success">{player.wins}</span>
                        <span className="text-text-tertiary">/</span>
                        <span className="text-xs font-mono font-semibold text-danger">{player.losses}</span>
                      </div>

                      <TierBadge tier={player.tier} />

                      <div className="flex items-center justify-end gap-1">
                        <RankChange change={player.rankChange} />
                        <span className="text-[10px] font-mono text-text-tertiary">
                          {player.rankChange > 0 ? `+${player.rankChange}` : player.rankChange}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-text-tertiary font-medium px-1">
              <span>Showing <strong className="text-text-secondary font-mono">{filtered.length}</strong> of {players.length} players</span>
              {user && (
                <span className="flex items-center gap-1.5">
                  <Trophy size={12} className="text-warning" />
                  <span className="text-text-tertiary">
                    Your rank: <strong className="text-text-primary font-mono">#{currentUserRank || "—"}</strong>
                  </span>
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default LeaderboardPage
