"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const THEMES = [
  { label: "Rose",    swatch: "#f43f5e" },
  { label: "Violet",  swatch: "#8b5cf6" },
  { label: "Sky",     swatch: "#0ea5e9" },
  { label: "Emerald", swatch: "#10b981" },
  { label: "Orange",  swatch: "#f97316" },
  { label: "Indigo",  swatch: "#6366f1" },
];

function generateId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [spaceName, setSpaceName] = useState("");
  const [color, setColor] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const existing = localStorage.getItem("venn_space_id");
    if (existing) {
      router.replace(`/space/${existing}`);
    } else {
      setChecking(false);
    }
  }, [router]);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    setError("");

    const spaceId = generateId();
    const memberId = generateId();
    const member = { id: memberId, name: name.trim(), color };

    const { error } = await supabase.from("spaces").insert({
      id: spaceId,
      name: spaceName.trim() || "Our Space",
      topic: "dinner",
      members: [member],
      options: [],
      result: null,
    });

    if (error) {
      setError(`Error: ${error.message}`);
      setCreating(false);
      return;
    }

    localStorage.setItem("venn_space_id", spaceId);
    localStorage.setItem(`venn_member_${spaceId}`, memberId);
    router.push(`/space/${spaceId}`);
  }

  if (checking) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="w-8 h-8 rounded-full bg-pink-400 opacity-80 -mr-3 z-10" />
            <div className="w-8 h-8 rounded-full bg-violet-500 opacity-80" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">Venn</h1>
          <p className="text-gray-400 mt-1">Find your overlap.</p>
        </div>

        {/* Create form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your name</label>
            <input
              type="text"
              placeholder="e.g. Elly"
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 outline-none focus:border-violet-400 transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Space name <span className="font-normal normal-case text-gray-400">(optional)</span></label>
            <input
              type="text"
              placeholder="e.g. Date Night, Girl Trip…"
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 outline-none focus:border-violet-400 transition-colors"
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your color</label>
            <div className="mt-2 flex gap-2">
              {THEMES.map((t, i) => (
                <button
                  key={t.label}
                  title={t.label}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === i ? "border-gray-800 scale-110" : "border-white shadow"}`}
                  style={{ backgroundColor: t.swatch }}
                  onClick={() => setColor(i)}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={create}
            disabled={creating || !name.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white font-bold text-base hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Creating…" : "Create my space →"}
          </button>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          You&apos;ll get an invite link to share with your group.
        </p>
      </div>
    </div>
  );
}
