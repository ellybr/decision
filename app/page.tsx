"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function generateId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function LandingPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function createRoom() {
    setCreating(true);
    setError("");
    const id = generateId();

    const { error } = await supabase.from("rooms").insert({
      id,
      p1_name: "You",
      p2_name: "Your partner",
      p1_options: [],
      p2_options: [],
      p1_theme: 0,
      p2_theme: 1,
      result: null,
    });

    if (error) {
      setError("Couldn't create a room. Check your Supabase setup.");
      setCreating(false);
      return;
    }

    localStorage.setItem(`room_${id}_role`, "p1");
    router.push(`/room/${id}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-violet-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        <div className="text-6xl mb-4">🍽️</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-3">Dinner Decider</h1>
        <p className="text-gray-500 text-lg mb-10">
          Stop arguing about what to eat.<br />Add your options, we&apos;ll decide.
        </p>

        <button
          onClick={createRoom}
          disabled={creating}
          className="px-10 py-4 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 text-white text-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {creating ? "Creating…" : "Create a room →"}
        </button>

        {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}

        <div className="mt-12 grid grid-cols-3 gap-4">
          {[
            { icon: "🔗", label: "Create a room" },
            { icon: "📱", label: "Share the link" },
            { icon: "✨", label: "Get your answer" },
          ].map((step) => (
            <div key={step.label} className="text-sm text-gray-400">
              <div className="text-2xl mb-1">{step.icon}</div>
              {step.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
