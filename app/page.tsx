"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function generateId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default function LandingPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  // If this device already has a couple, go straight there
  useEffect(() => {
    const id = localStorage.getItem("couple_id");
    if (id) {
      router.replace(`/couple/${id}`);
    } else {
      setChecking(false);
    }
  }, [router]);

  async function createSpace() {
    setCreating(true);
    setError("");
    const id = generateId();

    const { error } = await supabase.from("couples").insert({
      id,
      p1_name: "You",
      p2_name: "Your partner",
      p1_options: [],
      p2_options: [],
      p1_theme: 0,
      p2_theme: 1,
      p2_joined: false,
      result: null,
    });

    if (error) {
      setError("Couldn't create your space. Check your Supabase setup.");
      setCreating(false);
      return;
    }

    localStorage.setItem("couple_id", id);
    localStorage.setItem("couple_role", "p1");
    router.push(`/couple/${id}`);
  }

  async function joinWithCode() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setJoining(true);
    setError("");

    const { data, error } = await supabase
      .from("couples")
      .select("id")
      .eq("id", trimmed)
      .single();

    if (error || !data) {
      setError("Space not found. Double-check the code.");
      setJoining(false);
      return;
    }

    localStorage.setItem("couple_id", trimmed);
    localStorage.setItem("couple_role", "p2");
    await supabase.from("couples").update({ p2_joined: true }).eq("id", trimmed);
    router.push(`/couple/${trimmed}`);
  }

  if (checking) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-violet-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        <div className="text-6xl mb-4">🍽️</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Dinner Decider</h1>
        <p className="text-gray-500 mb-10">Your permanent dinner-picking space.</p>

        {/* Create */}
        <button
          onClick={createSpace}
          disabled={creating}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 text-white text-lg font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mb-4"
        >
          {creating ? "Setting up…" : "Create our space →"}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">or join one</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Join */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter space code"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-violet-400 uppercase tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && joinWithCode()}
            maxLength={8}
          />
          <button
            onClick={joinWithCode}
            disabled={joining || !code.trim()}
            className="px-5 py-3 rounded-xl bg-violet-500 text-white font-semibold text-sm hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {joining ? "…" : "Join"}
          </button>
        </div>

        {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  );
}
