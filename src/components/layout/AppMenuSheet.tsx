"use client";

import { useState, useEffect } from "react";
import { Link as LinkIcon, Users, Plus, X, RefreshCw, Copy, Check, ShoppingBag, Settings } from "lucide-react";
import BottomSheet from "@/components/shared/BottomSheet";
import { useAppContext } from "@/store/context";
import type { FamilyMember } from "@/types";

interface AppMenuSheetProps {
  open: boolean;
  onClose: () => void;
}

type Tab = "family" | "settings";

export default function AppMenuSheet({ open, onClose }: AppMenuSheetProps) {
  const { state, dispatch, addFamilyMember, removeFamilyMember } = useAppContext();
  const [tab, setTab] = useState<Tab>("family");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newStore, setNewStore] = useState("");

  useEffect(() => {
    if (!open || shareUrl) return;
    fetch("/api/share-token")
      .then((r) => r.json())
      .then(({ token }) => setShareUrl(`${window.location.origin}/view/${token}`))
      .catch(() => {});
  }, [open, shareUrl]);

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

  function inviteUrl(member: FamilyMember) {
    return `${window.location.origin}/view/${member.inviteToken}`;
  }

  function handleCopyInvite(member: FamilyMember) {
    navigator.clipboard.writeText(inviteUrl(member)).then(() => {
      setCopiedId(member.id);
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(() => {});
  }

  async function handleAddMember() {
    const trimmed = newName.trim();
    if (!trimmed || adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/family-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        const { member } = await res.json();
        addFamilyMember(member as FamilyMember);
        setNewName("");
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveMember(member: FamilyMember) {
    try {
      await fetch(`/api/family-members/${member.id}`, { method: "DELETE" });
      removeFamilyMember(member.id);
    } catch { /* ignore */ }
  }

  function handleAddStore() {
    const trimmed = newStore.trim();
    if (!trimmed) return;
    dispatch({ type: "ADD_STORE", name: trimmed });
    setNewStore("");
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Menu">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-4">
        {([
          { key: "family", label: "Family", Icon: Users },
          { key: "settings", label: "Settings", Icon: Settings },
        ] as { key: Tab; label: string; Icon: React.ElementType }[]).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-5">
        {tab === "family" && (
          <>
            {/* Family members */}
            <div className="space-y-2 pb-2">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-gray-500" />
                <p className="text-sm font-medium text-gray-700">Family Members</p>
              </div>
              <p className="text-xs text-gray-500">
                Each person gets their own invite link so you know who added what to the grocery list.
              </p>

              {state.familyMembers.length > 0 && (
                <div className="space-y-2 pt-1">
                  {state.familyMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      <span className="flex-1 text-sm font-medium text-gray-800 min-w-0 truncate">
                        {member.name}
                      </span>
                      <button
                        onClick={() => handleCopyInvite(member)}
                        title="Copy invite link"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-600 text-xs font-medium hover:bg-brand-100 active:bg-brand-200 transition-colors flex-shrink-0"
                      >
                        {copiedId === member.id ? <Check size={12} /> : <Copy size={12} />}
                        {copiedId === member.id ? "Copied!" : "Copy link"}
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                  placeholder="Add a name…"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:border-brand-400"
                />
                <button
                  onClick={handleAddMember}
                  disabled={!newName.trim() || adding}
                  className="p-2.5 rounded-xl bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 disabled:opacity-40 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Read-only share link */}
            <div className="space-y-2 border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2">
                <LinkIcon size={15} className="text-gray-500" />
                <p className="text-sm font-medium text-gray-700">Read-Only Family Link</p>
              </div>
              <p className="text-xs text-gray-500">
                Share this link for read-only access — no identity or grocery list.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyShareUrl}
                  disabled={!shareUrl}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  {shareUrlCopied ? "Copied!" : !shareUrl ? "…" : "Copy Link"}
                </button>
                <button
                  onClick={handleResetShareLink}
                  title="Reset link (old link will stop working)"
                  className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </>
        )}

        {tab === "settings" && (
          <>
            {/* My Stores */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShoppingBag size={15} className="text-gray-500" />
                <p className="text-sm font-medium text-gray-700">My Stores</p>
              </div>
              <p className="text-xs text-gray-500">
                These appear in the grocery list when tagging items to a store.
              </p>

              {state.stores.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {state.stores.map((store) => (
                    <div
                      key={store}
                      className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      <span className="flex-1 text-sm text-gray-800">{store}</span>
                      <button
                        onClick={() => dispatch({ type: "REMOVE_STORE", name: store })}
                        className="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newStore}
                  onChange={(e) => setNewStore(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddStore()}
                  placeholder="Add a store…"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:border-brand-400"
                />
                <button
                  onClick={handleAddStore}
                  disabled={!newStore.trim()}
                  className="p-2.5 rounded-xl bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 disabled:opacity-40 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* About */}
            <div className="border-t border-gray-100 pt-4 space-y-1 text-center">
              <p className="text-xs font-semibold text-gray-700">SetTheTable</p>
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
          </>
        )}
      </div>
    </BottomSheet>
  );
}
