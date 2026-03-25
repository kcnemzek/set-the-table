"use client";

import { useState, useEffect } from "react";
import { ChefHat, Link as LinkIcon, Users, Plus, X, RefreshCw } from "lucide-react";
import BottomSheet from "@/components/shared/BottomSheet";
import { useAppContext } from "@/store/context";

interface AppMenuSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function AppMenuSheet({ open, onClose }: AppMenuSheetProps) {
  const version = process.env.NEXT_PUBLIC_VERSION ?? "—";
  const { state, addFamilyMember, removeFamilyMember } = useAppContext();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [newName, setNewName] = useState("");

  // Load share token when sheet opens
  useEffect(() => {
    if (!open || shareUrl) return;
    fetch("/api/share-token")
      .then((r) => r.json())
      .then(({ token }) => setShareUrl(`${window.location.origin}/view/${token}`))
      .catch(() => {});
  }, [open, shareUrl]);

  function handleCopyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    }).catch(() => {});
  }

  async function handleResetLink() {
    try {
      const res = await fetch("/api/share-token", { method: "DELETE" });
      const { token } = await res.json();
      setShareUrl(`${window.location.origin}/view/${token}`);
      setCopyState("idle");
    } catch { /* ignore */ }
  }

  function handleAddMember() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addFamilyMember(trimmed);
    setNewName("");
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Menu">
      <div className="px-4 py-4 space-y-5">

        {/* Branding */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <ChefHat size={20} className="text-brand-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">Mom, What&apos;s for Dinner?</p>
            <p className="text-xs text-gray-500">v{version}</p>
          </div>
        </div>

        {/* Family share link */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <LinkIcon size={15} className="text-gray-500" />
            <p className="text-sm font-medium text-gray-700">Family View Link</p>
          </div>
          <p className="text-xs text-gray-500">
            Share this link with your family so they can see the menu (read-only).
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              disabled={!shareUrl}
              className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {copyState === "copied" ? "Copied!" : !shareUrl ? "…" : "Copy Link"}
            </button>
            <button
              onClick={handleResetLink}
              title="Reset link (old link will stop working)"
              className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Family members */}
        <div className="space-y-2 pb-2">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-gray-500" />
            <p className="text-sm font-medium text-gray-700">Family Members</p>
          </div>
          <p className="text-xs text-gray-500">
            These names appear on the family view so everyone can identify themselves.
          </p>

          {state.familyMembers.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {state.familyMembers.map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-gray-200 rounded-full"
                >
                  <span className="text-sm text-gray-700">{name}</span>
                  <button
                    onClick={() => removeFamilyMember(name)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
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
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-400"
            />
            <button
              onClick={handleAddMember}
              disabled={!newName.trim()}
              className="p-2.5 rounded-xl bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 disabled:opacity-40 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

      </div>
    </BottomSheet>
  );
}
