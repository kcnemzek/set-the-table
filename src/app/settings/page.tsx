"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ChefHat, UserPlus, Trash2, Crown, Users, LogOut, Link as LinkIcon, Plus, X, RefreshCw, ShoppingBag } from "lucide-react";
import clsx from "clsx";
import type { Household, HouseholdRole } from "@/types";
import { useAppContext } from "@/store/context";

const ROLE_LABELS: Record<HouseholdRole, string> = {
  "executive-chef": "Executive Chef",
  "sous-chef": "Sous Chef",
  "commensal": "At the Table",
};

const ROLE_OPTIONS: HouseholdRole[] = ["executive-chef", "sous-chef", "commensal"];

export default function SettingsPage() {
  const { data: session } = useSession();
  const { state, dispatch } = useAppContext();

  // Household
  const [household, setHousehold] = useState<Household | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [householdName, setHouseholdName] = useState("");
  const [creating, setCreating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<HouseholdRole>("sous-chef");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Share link
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);

  // Stores
  const [newStore, setNewStore] = useState("");

  const loadHousehold = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/household");
      if (!res.ok) { setHousehold(null); return; }
      const data = await res.json();
      setHousehold(data && typeof data === "object" && "members" in data ? data as Household : null);
    } catch {
      setHousehold(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHousehold(); }, [loadHousehold]);

  useEffect(() => {
    fetch("/api/share-token")
      .then((r) => r.json())
      .then(({ token }) => setShareUrl(`${window.location.origin}/view/${token}`))
      .catch(() => {});
  }, []);

  // ── Household handlers ────────────────────────────────

  async function handleCreate() {
    if (!householdName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: householdName.trim() }),
      });
      if (!res.ok) {
        const { error: e } = await res.json();
        setError(e ?? "Failed to create household");
        return;
      }
      setHousehold(await res.json());
      setCreateOpen(false);
      setHouseholdName("");
    } finally {
      setCreating(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setError("");
    try {
      const res = await fetch("/api/household/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      if (!res.ok) {
        const { error: e } = await res.json();
        setError(e ?? "Failed to send invite");
        return;
      }
      setInviteEmail("");
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 3000);
      await loadHousehold();
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveHouseholdMember(userId: string) {
    setError("");
    const res = await fetch(`/api/household/members?userId=${userId}`, { method: "DELETE" });
    if (!res.ok) {
      const { error: e } = await res.json();
      setError(e ?? "Failed to remove member");
      return;
    }
    await loadHousehold();
  }

  async function handleRevokeInvite(email: string) {
    setError("");
    const res = await fetch(`/api/household/members?email=${encodeURIComponent(email)}`, { method: "DELETE" });
    if (!res.ok) {
      const { error: e } = await res.json();
      setError(e ?? "Failed to revoke invite");
      return;
    }
    await loadHousehold();
  }

  async function handleLeave() {
    if (!confirm("Are you sure you want to leave this household?")) return;
    setError("");
    const res = await fetch("/api/household", { method: "DELETE" });
    if (!res.ok) {
      const { error: e } = await res.json();
      setError(e ?? "Failed to leave household");
      return;
    }
    setHousehold(null);
  }

  // ── Share link handlers ───────────────────────────────

  function handleCopyShareUrl() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareUrlCopied(true);
      setTimeout(() => setShareUrlCopied(false), 2500);
    }).catch(() => {});
  }

  async function handleResetShareLink() {
    try {
      const res = await fetch("/api/share-token", { method: "DELETE" });
      const { token } = await res.json();
      setShareUrl(`${window.location.origin}/view/${token}`);
    } catch { /* ignore */ }
  }

  // ── Store handlers ────────────────────────────────────

  function handleAddStore() {
    const trimmed = newStore.trim();
    if (!trimmed) return;
    dispatch({ type: "ADD_STORE", name: trimmed });
    setNewStore("");
  }

  const myMember = household?.members?.find((m) => m.userId === session?.user?.id);
  const isChef = myMember?.role === "executive-chef";

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Settings</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* ── Household ───────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gray-50">
          <Users size={16} className="text-brand-500" />
          <h2 className="text-sm font-semibold text-gray-700">Your Household</h2>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-gray-500">Loading…</div>
        ) : !household ? (
          <div className="px-4 py-6 space-y-4">
            <p className="text-sm text-gray-600">
              You&apos;re cooking solo. Create a household to share your menu and invite your family.
            </p>
            {!createOpen ? (
              <button
                onClick={() => setCreateOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
              >
                <ChefHat size={16} />
                Create a Household
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="e.g. The Nemzek Table"
                  spellCheck
                  autoCorrect="on"
                  autoCapitalize="words"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={creating || !householdName.trim()}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors"
                  >
                    {creating ? "Creating…" : "Create"}
                  </button>
                  <button
                    onClick={() => { setCreateOpen(false); setHouseholdName(""); }}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <div className="px-4 py-4">
              <p className="font-semibold text-gray-800">{household.name}</p>
              {myMember && (
                <p className="text-xs text-brand-500 mt-0.5 font-medium">
                  {isChef && <Crown size={11} className="inline mr-1 -mt-0.5" />}
                  {ROLE_LABELS[myMember.role]}
                </p>
              )}
            </div>

            <div className="px-4 py-3 space-y-2.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Members</p>
              {(household.members ?? []).map((m) => (
                <div key={m.userId} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {m.name}
                      {m.userId === session?.user?.id && (
                        <span className="ml-1.5 text-xs text-gray-400 font-normal">you</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{ROLE_LABELS[m.role]}</p>
                  </div>
                  {isChef && m.userId !== session?.user?.id && (
                    <button
                      onClick={() => handleRemoveHouseholdMember(m.userId)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {(household.pendingInvites ?? []).length > 0 && (
              <div className="px-4 py-3 space-y-2.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending Invites</p>
                {(household.pendingInvites ?? []).map((inv) => (
                  <div key={inv.email} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-gray-700">{inv.email}</p>
                      <p className="text-xs text-gray-400">{ROLE_LABELS[inv.role]} · invited by {inv.invitedBy}</p>
                    </div>
                    {isChef && (
                      <button
                        onClick={() => handleRevokeInvite(inv.email)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        title="Revoke invite"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isChef && (
              <div className="px-4 py-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Invite Someone</p>
                <p className="text-xs text-gray-500">
                  Ask them to sign in with their Google account — they&apos;ll be added automatically when they log in.
                </p>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="their@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
                <div className="flex gap-2">
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as HouseholdRole)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleInvite}
                    disabled={inviting || !inviteEmail.trim()}
                    className={clsx(
                      "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                      inviteSuccess
                        ? "bg-green-500 text-white"
                        : "bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
                    )}
                  >
                    <UserPlus size={14} />
                    {inviteSuccess ? "Saved!" : inviting ? "Saving…" : "Invite"}
                  </button>
                </div>
              </div>
            )}

            <div className="px-4 py-4">
              <button
                onClick={handleLeave}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors"
              >
                <LogOut size={14} />
                Leave Household
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Share Link ──────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gray-50">
          <LinkIcon size={16} className="text-brand-500" />
          <h2 className="text-sm font-semibold text-gray-700">Read-Only Link</h2>
        </div>
        <div className="px-4 py-4 space-y-3">
          <p className="text-sm text-gray-600">
            Share this with anyone who just wants to see the menu — no sign-in required.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCopyShareUrl}
              disabled={!shareUrl}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {shareUrlCopied ? "Copied!" : !shareUrl ? "…" : "Copy Link"}
            </button>
            <button
              onClick={handleResetShareLink}
              title="Reset link — the old link will stop working"
              className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── My Stores ───────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gray-50">
          <ShoppingBag size={16} className="text-brand-500" />
          <h2 className="text-sm font-semibold text-gray-700">My Stores</h2>
        </div>
        <div className="px-4 py-4 space-y-3">
          <p className="text-xs text-gray-500">
            These appear in the grocery list when tagging items to a store.
          </p>

          {state.stores.length > 0 && (
            <div className="space-y-1.5">
              {state.stores.map((store) => (
                <div key={store} className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="flex-1 text-sm text-gray-800">{store}</span>
                  <button
                    onClick={() => dispatch({ type: "REMOVE_STORE", name: store })}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newStore}
              onChange={(e) => setNewStore(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddStore()}
              placeholder="Add a store…"
              className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <button
              onClick={handleAddStore}
              disabled={!newStore.trim()}
              className="p-2.5 rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Role guide ──────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gray-50">
          <ChefHat size={16} className="text-brand-500" />
          <h2 className="text-sm font-semibold text-gray-700">Roles</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { role: "executive-chef" as HouseholdRole, desc: "Full access — manages the menu, recipes, events, and household." },
            { role: "sous-chef" as HouseholdRole, desc: "Can view and edit the menu, groceries, and events." },
            { role: "commensal" as HouseholdRole, desc: "View-only — sees the menu and grocery list." },
          ].map(({ role, desc }) => (
            <div key={role} className="px-4 py-3">
              <p className="text-sm font-medium text-gray-800">{ROLE_LABELS[role]}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── About ───────────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 text-center space-y-1">
          <p className="text-sm font-semibold text-gray-700">SetTheTable</p>
          <p className="text-xs text-gray-400">Because dinner is set.</p>
          <a
            href="https://www.setthetable.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-brand-500 hover:text-brand-600 transition-colors"
          >
            setthetable.io
          </a>
        </div>
      </section>
    </div>
  );
}
