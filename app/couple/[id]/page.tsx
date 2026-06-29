"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase, type Couple } from "@/lib/supabase";

// ── Themes ────────────────────────────────────────────────────────────────────

interface Theme {
  label: string; swatch: string;
  panel: string; border: string; tag: string;
  button: string; buttonHover: string; inputFocus: string;
}

const THEMES: Theme[] = [
  { label: "Rose",    swatch: "#f43f5e", panel: "from-pink-50 to-rose-50",     border: "border-pink-200",    tag: "bg-pink-100 text-pink-800 border-pink-200",     button: "bg-rose-500 text-white",    buttonHover: "hover:bg-rose-600",    inputFocus: "focus:border-rose-400" },
  { label: "Violet",  swatch: "#8b5cf6", panel: "from-violet-50 to-purple-50", border: "border-violet-200",  tag: "bg-violet-100 text-violet-800 border-violet-200", button: "bg-violet-500 text-white",  buttonHover: "hover:bg-violet-600",  inputFocus: "focus:border-violet-400" },
  { label: "Sky",     swatch: "#0ea5e9", panel: "from-sky-50 to-blue-50",      border: "border-sky-200",     tag: "bg-sky-100 text-sky-800 border-sky-200",         button: "bg-sky-500 text-white",     buttonHover: "hover:bg-sky-600",     inputFocus: "focus:border-sky-400" },
  { label: "Emerald", swatch: "#10b981", panel: "from-emerald-50 to-teal-50",  border: "border-emerald-200", tag: "bg-emerald-100 text-emerald-800 border-emerald-200", button: "bg-emerald-500 text-white", buttonHover: "hover:bg-emerald-600", inputFocus: "focus:border-emerald-400" },
  { label: "Orange",  swatch: "#f97316", panel: "from-orange-50 to-amber-50",  border: "border-orange-200",  tag: "bg-orange-100 text-orange-800 border-orange-200", button: "bg-orange-500 text-white",  buttonHover: "hover:bg-orange-600",  inputFocus: "focus:border-orange-400" },
  { label: "Indigo",  swatch: "#6366f1", panel: "from-indigo-50 to-blue-50",   border: "border-indigo-200",  tag: "bg-indigo-100 text-indigo-800 border-indigo-200", button: "bg-indigo-500 text-white",  buttonHover: "hover:bg-indigo-600",  inputFocus: "focus:border-indigo-400" },
];

// ── Decision ──────────────────────────────────────────────────────────────────

const SUGGESTIONS = ["Pizza", "Sushi", "Tacos", "Burgers", "Pasta", "Thai food", "Indian curry", "Ramen", "Salad", "BBQ"];

const MESSAGES = {
  match: ["Great minds think alike! You both want", "You're on the same page — tonight it's", "No fight needed, you both agreed on"],
  compromise: ["After careful deliberation… it's", "The dinner gods have spoken:", "Stop arguing. You're having", "The algorithm of love has decided:"],
};

function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CouplePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<"p1" | "p2" | null>(null);
  const [myInput, setMyInput] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const origin = window.location.origin;
    setInviteUrl(`${origin}/join/${id}`);
  }, [id]);

  // Role from localStorage
  useEffect(() => {
    if (!id) return;
    const stored = localStorage.getItem("couple_role");
    setMyRole(stored === "p1" ? "p1" : "p2");
  }, [id]);

  // Load + realtime
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase.from("couples").select("*").eq("id", id).single();
      if (cancelled) return;
      setCouple(error || !data ? null : (data as Couple));
      setLoading(false);
    }
    load();

    const ch = supabase
      .channel(`couple-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "couples", filter: `id=eq.${id}` },
        (p) => { if (!cancelled) setCouple(p.new as Couple); })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => {
    if (couple?.result) setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
  }, [couple?.result]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  async function update(updates: Partial<Couple>) {
    if (!couple) return;
    setCouple((p) => (p ? { ...p, ...updates } : p));
    await supabase.from("couples").update(updates).eq("id", id);
  }

  // ── Loading / error ───────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-violet-50">
      <p className="text-gray-400 text-lg">Loading your space…</p>
    </div>
  );

  if (!couple || !myRole) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-violet-50">
      <div className="text-center">
        <div className="text-4xl mb-4">🤔</div>
        <p className="text-gray-600 mb-4">Space not found.</p>
        <button onClick={() => { localStorage.removeItem("couple_id"); localStorage.removeItem("couple_role"); router.push("/"); }}
          className="px-6 py-2 rounded-full bg-gray-800 text-white text-sm font-semibold">
          Start over
        </button>
      </div>
    </div>
  );

  // ── Derived data ──────────────────────────────────────────────────────────

  const myOpts    = (myRole === "p1" ? couple.p1_options : couple.p2_options) ?? [];
  const myName    = myRole === "p1" ? couple.p1_name : couple.p2_name;
  const myThemeI  = myRole === "p1" ? couple.p1_theme : couple.p2_theme;
  const theirOpts = (myRole === "p1" ? couple.p2_options : couple.p1_options) ?? [];
  const theirName = myRole === "p1" ? couple.p2_name : couple.p1_name;
  const theirThemeI = myRole === "p1" ? couple.p2_theme : couple.p1_theme;
  const myT = THEMES[myThemeI] ?? THEMES[0];
  const theirT = THEMES[theirThemeI] ?? THEMES[1];

  const myOptsKey    = myRole === "p1" ? "p1_options"   : "p2_options";
  const myNameKey    = myRole === "p1" ? "p1_name"      : "p2_name";
  const myThemeKey   = myRole === "p1" ? "p1_theme"     : "p2_theme";

  const canDecide = myOpts.length + theirOpts.length > 0;
  const partnerPending = !couple.p2_joined;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function addOption() {
    const t = myInput.trim();
    if (!t || myOpts.includes(t)) return;
    setMyInput("");
    update({ [myOptsKey]: [...myOpts, t] });
  }

  function removeOption(j: number) {
    update({ [myOptsKey]: myOpts.filter((_, i) => i !== j) });
  }

  async function decide() {
    const all = [...myOpts, ...theirOpts];
    if (!all.length) return;
    setDeciding(true);
    setTimeout(async () => {
      const tl = theirOpts.map((o) => o.toLowerCase());
      const matches = myOpts.filter((o) => tl.includes(o.toLowerCase()));
      const isMatch = matches.length > 0;
      const food = pickRandom(isMatch ? matches : all);
      const message = pickRandom(isMatch ? MESSAGES.match : MESSAGES.compromise);
      await update({ result: { food, message, isMatch } });
      setDeciding(false);
    }, 1200);
  }

  async function startFresh() {
    await update({ p1_options: [], p2_options: [], result: null });
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-violet-50" onClick={() => setShowThemePicker(false)}>
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-700">🍽️ Dinner Decider</h1>
            <p className="text-xs text-gray-400 font-mono">{id}</p>
          </div>
          <button
            onClick={startFresh}
            className="text-sm px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors"
          >
            🔄 Start fresh
          </button>
        </div>

        {/* Invite banner — only shown until partner joins */}
        {partnerPending && myRole === "p1" && (
          <div className="mb-6 rounded-2xl bg-violet-50 border border-violet-200 px-5 py-4">
            <p className="text-sm font-semibold text-violet-800 mb-1">👋 Invite your partner</p>
            <p className="text-xs text-violet-500 mb-3">Send them this link once — they'll always come back to this space.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white border border-violet-200 rounded-lg px-3 py-2 text-violet-700 truncate">{inviteUrl}</code>
              <button
                onClick={copyInvite}
                className="shrink-0 px-4 py-2 rounded-lg bg-violet-500 text-white text-xs font-semibold hover:bg-violet-600 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {/* MY panel */}
          <div className={`rounded-2xl border-2 bg-gradient-to-br p-6 shadow-sm ${myT.panel} ${myT.border}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <input autoFocus className="text-xl font-bold text-gray-700 bg-transparent border-b-2 border-gray-400 outline-none w-full"
                    value={myName}
                    onChange={(e) => update({ [myNameKey]: e.target.value })}
                    onBlur={() => setEditingName(false)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingName(false)} />
                ) : (
                  <button className="text-xl font-bold text-gray-700 hover:text-gray-900 flex items-center gap-1 group" onClick={() => setEditingName(true)}>
                    <span className="truncate">{myName}</span>
                    <span className="text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
                  </button>
                )}
                <span className="text-xs text-gray-400">You</span>
              </div>
              <div className="relative shrink-0">
                <button title="Pick a color"
                  className="w-7 h-7 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
                  style={{ backgroundColor: myT.swatch }}
                  onClick={(e) => { e.stopPropagation(); setShowThemePicker(!showThemePicker); }} />
                {showThemePicker && (
                  <div className="absolute right-0 top-9 z-20 bg-white rounded-xl shadow-xl border border-gray-100 p-3 flex gap-2">
                    {THEMES.map((t, ti) => (
                      <button key={t.label} title={t.label}
                        className={`w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform ${myThemeI === ti ? "border-gray-700 scale-110" : "border-white"}`}
                        style={{ backgroundColor: t.swatch }}
                        onClick={() => { update({ [myThemeKey]: ti }); setShowThemePicker(false); }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {myOpts.length === 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-2">Quick add:</p>
                <div className="flex flex-wrap gap-1">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                      onClick={() => { if (!myOpts.includes(s)) update({ [myOptsKey]: [...myOpts, s] }); }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="Add a dinner option…"
                className={`flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 outline-none transition-colors ${myT.inputFocus}`}
                value={myInput}
                onChange={(e) => setMyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addOption()} />
              <button className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${myT.button} ${myT.buttonHover}`} onClick={addOption}>Add</button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {myOpts.length === 0 ? <p className="text-sm text-gray-400 italic">No options yet…</p>
                : myOpts.map((opt, j) => (
                  <span key={j} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border font-medium ${myT.tag}`}>
                    {opt}
                    <button className="ml-1 opacity-50 hover:opacity-100 text-xs" onClick={() => removeOption(j)}>✕</button>
                  </span>
                ))}
            </div>
          </div>

          {/* THEIR panel */}
          <div className={`rounded-2xl border-2 bg-gradient-to-br p-6 shadow-sm ${theirT.panel} ${theirT.border}`}>
            <div className="mb-4 flex items-center gap-2">
              <div>
                <p className="text-xl font-bold text-gray-700">{theirName}</p>
                <span className="text-xs text-gray-400">Your partner</span>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm ml-auto shrink-0" style={{ backgroundColor: theirT.swatch }} />
            </div>

            <div className="flex flex-wrap gap-2 min-h-[100px] items-start">
              {theirOpts.length === 0 ? (
                <div className="w-full text-center py-6">
                  {partnerPending
                    ? <><p className="text-sm text-gray-400 italic mb-1">Partner hasn't joined yet</p><p className="text-xs text-gray-300">Share the invite link above</p></>
                    : <><p className="text-sm text-gray-400 italic mb-1">Waiting for their picks…</p><p className="text-xs text-gray-300">They'll appear here live</p></>
                  }
                </div>
              ) : theirOpts.map((opt, j) => (
                <span key={j} className={`inline-flex items-center px-3 py-1 rounded-full text-sm border font-medium ${theirT.tag}`}>{opt}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Decide */}
        <div className="flex justify-center mb-8">
          <button disabled={!canDecide || deciding} onClick={decide}
            className={`px-12 py-4 rounded-full text-xl font-bold transition-all duration-200 ${canDecide && !deciding
              ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-lg hover:shadow-xl hover:scale-105 animate-pulse-ring cursor-pointer"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
            {deciding
              ? <span className="flex items-center gap-3"><span className="inline-block w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin-fast" />Deciding…</span>
              : "✨ Decide for us!"}
          </button>
        </div>

        {/* Result */}
        {couple.result && (
          <div ref={resultRef} className="animate-bounce-in">
            <div className={`rounded-3xl p-8 text-center shadow-xl border-2 ${couple.result.isMatch
              ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
              : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"}`}>
              <div className="text-4xl mb-3">{couple.result.isMatch ? "🎉" : "🎲"}</div>
              <p className="text-gray-500 text-base mb-2">{couple.result.message}</p>
              <p className="text-4xl font-black text-gray-800 mb-4">{couple.result.food}</p>
              {couple.result.isMatch
                ? <p className="text-emerald-600 text-sm font-medium">You both had this — great minds!</p>
                : <p className="text-amber-600 text-sm font-medium">No overlap, so we picked from your combined list. Accept your fate.</p>}
              <div className="flex gap-3 justify-center mt-6">
                <button onClick={decide} className="px-6 py-2 rounded-full border-2 border-gray-300 text-gray-600 text-sm font-semibold hover:border-gray-400 transition-colors">
                  🔄 Pick again
                </button>
                <button onClick={startFresh} className="px-6 py-2 rounded-full bg-gray-800 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
                  Start fresh
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-gray-400 text-xs mt-10">Built with love to end dinner arguments forever 💕</p>
      </div>
    </div>
  );
}
