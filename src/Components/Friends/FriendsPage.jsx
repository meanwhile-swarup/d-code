import React, { useState, useEffect } from "react"
import {
  UserPlus,
  Search,
  Swords,
  Check,
  X,
  Clock,
  Star,
} from "lucide-react"
import { friends as friendsApi, users as usersApi } from "../../api/client"
import { statusBadge } from "../../utils/badges"

const FriendsPage = ({ onNavigate }) => {
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("friends")
  const [friendsList, setFriendsList] = useState([])
  const [requestsList, setRequestsList] = useState([])
  const [sentList, setSentList] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchFriends = async () => {
    try {
      setLoading(true)
      const data = await friendsApi.list()
      setFriendsList(data.friends || [])
      setRequestsList(data.pendingReceived || [])
      setSentList(data.pendingSent || [])
    } catch {
      showToast("Failed to load friends", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFriends()
  }, [])

  const handleSearchUsers = async (query) => {
    setUserSearch(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }
    try {
      setSearching(true)
      const data = await usersApi.search(query.trim())
      setSearchResults(data || [])
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleSendRequest = async (id, username) => {
    try {
      await friendsApi.request(id)
      setSearchResults((prev) =>
        prev.map((u) => (u.id === id ? { ...u, friendshipStatus: "sent" } : u))
      )
      fetchFriends()
      showToast(`Friend request sent to ${username}`)
    } catch (err) {
      showToast(err.message || "Failed to send request", "error")
    }
  }

  const handleAcceptRequest = async (id) => {
    try {
      await friendsApi.accept(id)
      await fetchFriends()
      showToast("Friend request accepted")
    } catch {
      showToast("Failed to accept request", "error")
    }
  }

  const handleDeclineRequest = async (id) => {
    try {
      await friendsApi.remove(id)
      await fetchFriends()
      showToast("Request declined")
    } catch {
      showToast("Failed to decline request", "error")
    }
  }

  const handleCancelSent = async (id) => {
    try {
      await friendsApi.remove(id)
      await fetchFriends()
      showToast("Request cancelled")
    } catch {
      showToast("Failed to cancel request", "error")
    }
  }

  const handleRemoveFriend = async (id, username) => {
    try {
      await friendsApi.remove(id)
      await fetchFriends()
      showToast(`Removed ${username}`)
    } catch {
      showToast("Failed to remove friend", "error")
    }
  }

  const filteredFriends = friendsList.filter(
    (f) =>
      f.username?.toLowerCase().includes(search.toLowerCase()) ||
      f.name?.toLowerCase().includes(search.toLowerCase())
  )

  const displayName = (f) => f.name || f.username || "Unknown"
  const displayAvatar = (f) => f.avatar || (f.username?.slice(0, 2).toUpperCase() || "?")

  return (
    <div className="min-h-screen bg-void text-text-secondary antialiased">
      <div className="mx-auto max-w-[1120px] px-8 py-6 space-y-6">
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-lg ${
              toast.type === "success"
                ? "bg-success/12 border-success/25 text-success"
                : "bg-danger/12 border-danger/25 text-danger"
            }`}
          >
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        )}

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Friends</h1>
            <p className="text-sm font-medium text-text-tertiary mt-1">Connect with fellow coders</p>
          </div>
          <button
            onClick={() => {
              setShowAddModal(true)
              setUserSearch("")
              setSearchResults([])
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:bg-accent-muted transition-colors"
          >
            <UserPlus size={16} strokeWidth={2.5} />
            Add Friend
          </button>
        </header>

        <div className="flex gap-1 p-1 bg-surface rounded-lg border border-border">
          {[
            { id: "friends", label: "Friends", count: friendsList.length },
            { id: "requests", label: "Requests", count: requestsList.length },
            { id: "sent", label: "Sent", count: sentList.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-accent/12 text-accent border border-accent/25"
                  : "text-text-tertiary hover:text-text-primary hover:bg-elevated"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    activeTab === tab.id
                      ? "bg-accent/20 text-accent"
                      : "bg-border text-text-tertiary"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-text-tertiary text-sm">Loading...</div>
        ) : (
          <>
            {activeTab === "friends" && (
              <div className="space-y-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search friends..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent/50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="rounded-xl bg-surface border border-border p-4 hover:border-text-tertiary/40 transition-all"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="h-12 w-12 rounded-xl bg-elevated border border-border flex items-center justify-center text-sm font-black text-text-primary shrink-0">
                          {displayAvatar(friend)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-text-primary truncate">
                              {displayName(friend)}
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${statusBadge(
                                "Online"
                              )}`}
                            >
                              Friend
                            </span>
                          </div>
                          <p className="text-xs text-text-tertiary truncate">
                            @{friend.username}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-text-tertiary">
                            <span className="flex items-center gap-1">
                              <Star size={10} className="text-warning" />
                              <span className="font-mono">{friend.rating ?? 1000}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3.5">
                        <button
                          onClick={() => onNavigate && onNavigate("duel")}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent/12 text-accent text-xs font-bold border border-accent/25 hover:bg-accent/20 transition-colors"
                        >
                          <Swords size={13} strokeWidth={2.2} />
                          Challenge
                        </button>
                        <button
                          onClick={() => handleRemoveFriend(friend.id, friend.username)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-elevated text-text-secondary text-xs font-bold border border-border hover:bg-danger/10 hover:text-danger hover:border-danger/25 transition-colors"
                        >
                          <X size={13} strokeWidth={2.2} />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredFriends.length === 0 && (
                  <div className="text-center py-12 text-text-tertiary text-sm">
                    {friendsList.length === 0
                      ? "No friends yet — use Add Friend to find coders"
                      : `No friends found matching "${search}"`}
                  </div>
                )}
              </div>
            )}

            {activeTab === "requests" && (
              <div className="space-y-3">
                {requestsList.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border hover:border-text-tertiary/40 transition-all"
                  >
                    <div className="h-12 w-12 rounded-xl bg-elevated border border-border flex items-center justify-center text-sm font-black text-text-primary shrink-0">
                      {displayAvatar(request)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-primary">{displayName(request)}</span>
                        <span className="text-xs text-text-tertiary">@{request.username}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-text-tertiary">
                        <span className="flex items-center gap-1">
                          <Star size={10} className="text-warning" />
                          <span className="font-mono">{request.rating ?? 1000}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          Pending
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-success/12 text-success text-xs font-bold border border-success/25 hover:bg-success/20 transition-colors"
                      >
                        <Check size={14} strokeWidth={2.5} />
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(request.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-danger/12 text-danger text-xs font-bold border border-danger/25 hover:bg-danger/20 transition-colors"
                      >
                        <X size={14} strokeWidth={2.5} />
                        Decline
                      </button>
                    </div>
                  </div>
                ))}

                {requestsList.length === 0 && (
                  <div className="text-center py-12 text-text-tertiary text-sm">
                    No pending friend requests
                  </div>
                )}
              </div>
            )}

            {activeTab === "sent" && (
              <div className="space-y-3">
                {sentList.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border hover:border-text-tertiary/40 transition-all"
                  >
                    <div className="h-12 w-12 rounded-xl bg-elevated border border-border flex items-center justify-center text-sm font-black text-text-primary shrink-0">
                      {displayAvatar(request)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-primary">{displayName(request)}</span>
                        <span className="text-xs text-text-tertiary">@{request.username}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-text-tertiary">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          Request sent — awaiting response
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelSent(request.id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-elevated text-text-secondary text-xs font-bold border border-border hover:bg-danger/10 hover:text-danger hover:border-danger/25 transition-colors"
                    >
                      <X size={14} strokeWidth={2.5} />
                      Cancel
                    </button>
                  </div>
                ))}

                {sentList.length === 0 && (
                  <div className="text-center py-12 text-text-tertiary text-sm">
                    No sent requests
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="rounded-xl bg-surface border border-border p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">Add Friend</h3>
              <button onClick={() => setShowAddModal(false)} className="text-text-tertiary hover:text-text-primary">
                <X size={16} />
              </button>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search by username or name (min 2 chars)..."
                value={userSearch}
                onChange={(e) => handleSearchUsers(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-void border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent/50"
              />
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {searching && <p className="text-xs text-text-tertiary text-center py-4">Searching...</p>}
              {!searching && userSearch.trim().length >= 2 && searchResults.length === 0 && (
                <p className="text-xs text-text-tertiary text-center py-4">No users found</p>
              )}
              {!searching && userSearch.trim().length < 2 && (
                <p className="text-xs text-text-tertiary text-center py-4">Type at least 2 characters to search</p>
              )}
              {searchResults.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-void border border-border">
                  <div className="h-10 w-10 rounded-lg bg-elevated border border-border flex items-center justify-center text-xs font-black text-text-primary shrink-0">
                    {u.avatar || u.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">{u.name || u.username}</p>
                    <p className="text-xs text-text-tertiary truncate">@{u.username} · <span className="font-mono">{u.rating ?? 1000}</span></p>
                  </div>
                  {u.friendshipStatus === "none" && (
                    <button
                      onClick={() => handleSendRequest(u.id, u.username)}
                      className="px-3 py-1.5 rounded-lg bg-accent/12 text-accent text-xs font-bold border border-accent/25 hover:bg-accent/20 transition-colors"
                    >
                      Add
                    </button>
                  )}
                  {u.friendshipStatus === "sent" && (
                    <span className="text-[11px] font-bold text-text-tertiary">Sent</span>
                  )}
                  {u.friendshipStatus === "received" && (
                    <span className="text-[11px] font-bold text-warning">Check Requests</span>
                  )}
                  {u.friendshipStatus === "friends" && (
                    <span className="text-[11px] font-bold text-success">Friends</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FriendsPage
