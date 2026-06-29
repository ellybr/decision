"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase, type Space } from "@/lib/supabase";

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

export default function JoinPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [color, setColor] = useState(1);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    // Already a member of this space?
    const existing = localStorage.getItem(`venn_member_${id}`);
    if (existing) {
      localStorage.setItem("venn_space_id", id);
      router.replace(`/space/${id}`);
      return;
    }

    async function load() {
      const { data } = await supabase.from("spaces").select("*").eq("id", id).single();
      setSpace(data as Space);
      setLoading(false);
    }
    load();
  }, [id, router]);

  async function join() {
    if (!name.trim() || !space) return;
    setJoining(true);

    const memberId = generateId();
    const member = { id: memberId, name: name.trim(), color };
    const updatedMembers = [...(space.members ?? []), member];

    const { error } = await supabase
      .from("spaces")
      .update({ members: updatedMembers })
      .eq("id", id);

    if (error) { setJoining(false); return; }

    localStorage.setItem("venn_space_id", id);
    localStorage.setItem(`venn_member_${id}`, memberId);
    router.push(`/space/${id}`);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-pink-50">
      <p className="text-gray-400">Loading…</p>
    </div>
  );

  if (!space) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-pink-50">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Space not found.</p>
        <button onClick={() => router.push("/")} className="px-6 py-2 rounded-full bg-gray-800 text-white text-sm font-semibold">Create a new space</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-3">
            <div className="w-7 h-7 rounded-full bg-pink-400 opacity-80 -mr-2 z-10" />
            <div className="w-7 h-7 rounded-full bg-violet-500 opacity-80" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">Venn</h1>
          <p className="text-gray-500 mt-1">You&apos;re joining <span className="font-semibold text-gray-700">{space.name}</span></p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your name</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Marcus"
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 outline-none focus:border-violet-400 transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && join()}
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

          <button
            onClick={join}
            disabled={joining || !name.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white font-bold text-base hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {joining ? "Joining…" : "Join space →"}
          </button>
        </div>
      </div>
    </div>
  );
}
