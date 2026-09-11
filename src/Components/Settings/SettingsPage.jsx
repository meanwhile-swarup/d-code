import React, { useState } from "react"
import {
  Settings,
  Save,
  Check,
  X,
} from "lucide-react"
import { users } from "../../api/client"
import { useAuth } from "../../contexts/AuthContext"

const SettingsPage = ({ onNavigate: _onNavigate }) => {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
  })
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState(null)

  const handleSave = async () => {
    setSaving(true)
    setSaveResult(null)
    try {
      await users.update(user.id, { name: form.name, bio: form.bio })
      setUser({ ...user, name: form.name, bio: form.bio })
      setSaveResult("success")
      setTimeout(() => setSaveResult(null), 3000)
    } catch (_err) {
      setSaveResult("error")
      setTimeout(() => setSaveResult(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full px-3 py-2 text-xs bg-void border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"

  return (
    <div className="min-h-screen bg-void font-sans text-text-secondary antialiased p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">

        <div className="rounded-xl bg-surface border border-border p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-elevated border border-border flex items-center justify-center">
            <Settings size={20} className="text-text-tertiary" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-text-primary">Settings</h1>
            <p className="text-xs text-text-tertiary">Manage your account preferences</p>
          </div>
        </div>

        <div className="rounded-xl bg-surface border border-border p-6 space-y-2">
          <div className="w-full py-4 px-1 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Account
            </span>
          </div>
          <div className="grid gap-4 pt-4 pb-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-1.5">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-1.5">Username</label>
              <input
                type="text"
                value={user?.username || ""}
                disabled
                className={`${inputClass} opacity-50 cursor-not-allowed`}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-1.5">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className={`${inputClass} opacity-50 cursor-not-allowed`}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-1.5">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className={`${inputClass} min-h-[80px] resize-y`}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
            saveResult === "success"
              ? "bg-success/10 border border-success/25 text-success"
              : saveResult === "error"
              ? "bg-danger/10 border border-danger/25 text-danger"
              : "bg-accent text-white hover:bg-accent-muted"
          } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {saving ? (
            <><span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" /> Saving...</>
          ) : saveResult === "success" ? (
            <><Check size={14} /> Saved</>
          ) : saveResult === "error" ? (
            <><X size={14} /> Failed to save</>
          ) : (
            <><Save size={14} /> Save Changes</>
          )}
        </button>
      </div>
    </div>
  )
}

export default SettingsPage
