"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase, type Space, type Member, type VoteOption } from "@/lib/supabase";

// ── Themes ────────────────────────────────────────────────────────────────────

const THEMES = [
  { label: "Rose",    swatch: "#f43f5e", panel: "from-pink-50 to-rose-50",     border: "border-pink-200",    tag: "bg-pink-100 text-pink-800 border-pink-200",       button: "bg-rose-500 hover:bg-rose-600 text-white",    input: "focus:border-rose-400" },
  { label: "Violet",  swatch: "#8b5cf6", panel: "from-violet-50 to-purple-50", border: "border-violet-200",  tag: "bg-violet-100 text-violet-800 border-violet-200", button: "bg-violet-500 hover:bg-violet-600 text-white",  input: "focus:border-violet-400" },
  { label: "Sky",     swatch: "#0ea5e9", panel: "from-sky-50 to-blue-50",      border: "border-sky-200",     tag: "bg-sky-100 text-sky-800 border-sky-200",          button: "bg-sky-500 hover:bg-sky-600 text-white",      input: "focus:border-sky-400" },
  { label: "Emerald", swatch: "#10b981", panel: "from-emerald-50 to-teal-50",  border: "border-emerald-200", tag: "bg-emerald-100 text-emerald-800 border-emerald-200", button: "bg-emerald-500 hover:bg-emerald-600 text-white", input: "focus:border-emerald-400" },
  { label: "Orange",  swatch: "#f97316", panel: "from-orange-50 to-amber-50",  border: "border-orange-200",  tag: "bg-orange-100 text-orange-800 border-orange-200", button: "bg-orange-500 hover:bg-orange-600 text-white",  input: "focus:border-orange-400" },
  { label: "Indigo",  swatch: "#6366f1", panel: "from-indigo-50 to-blue-50",   border: "border-indigo-200",  tag: "bg-indigo-100 text-indigo-800 border-indigo-200", button: "bg-indigo-500 hover:bg-indigo-600 text-white",  input: "focus:border-indigo-400" },
];

// ── Topics ────────────────────────────────────────────────────────────────────

const TOPICS = [
  { id: "dinner",   emoji: "🍽️", label: "Dinner",   placeholder: "Add a restaurant or dish…",  verb: "eating at" },
  { id: "movie",    emoji: "🎬", label: "Movie",    placeholder: "Add a movie…",               verb: "watching" },
  { id: "activity", emoji: "🎯", label: "Activity", placeholder: "Add an activity…",           verb: "doing" },
  { id: "travel",   emoji: "✈️", label: "Travel",   placeholder: "Add a destination…",         verb: "going to" },
  { id: "other",    emoji: "💡", label: "Other",    placeholder: "Add an option…",             verb: "going with" },
];

const QUICK: Record<string, string[]> = {
  dinner:   ["Pizza", "Sushi", "Tacos", "Burgers", "Thai food", "Ramen"],
  movie:    ["Action", "Comedy", "Horror", "Rom-com", "Documentary", "Thriller"],
  activity: ["Bowling", "Hiking", "Board games", "Cooking at home", "Mini golf", "Museum"],
  travel:   ["Beach", "Mountains", "City trip", "Road trip", "Europe", "Staycation"],
  other:    [],
};

// ── Decision logic ────────────────────────────────────────────────────────────

function resolveVenn(members: Member[], options: VoteOption[], topicId: string) {
  if (!options.length) return null;
  const topic = TOPICS.find((t) => t.id === topicId) ?? TOPICS[0];

  const tally = new Map<string, { text: string; voters: Set<string> }>();
  for (const opt of options) {
    const key = opt.text.trim().toLowerCase();
    if (!tally.has(key)) tally.set(key, { text: opt.text, voters: new Set() });
    tally.get(key)!.voters.add(opt.memberId);
  }

  const ranked = [...tally.values()].sort((a, b) => b.voters.size - a.voters.size);
  const best = ranked[0].voters.size;
  const topTier = ranked.filter((r) => r.voters.size === best);
  const winner = topTier[Math.floor(Math.random() * topTier.length)];

  const total = members.length;
  const count = winner.voters.size;

  let message: string;
  if (count === total && total > 1) {
    message = `Everyone agreed — you're ${topic.verb}`;
  } else if (count > 1) {
    message = `${count} of you picked this — you're ${topic.verb}`;
  } else {
    message = `We picked at random — you're ${topic.verb}`;
  }

  return { text: winner.text, message, voters: count, total };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SpacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [myInput, setMyInput] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setInviteUrl(`${window.location.origin}/join/${id}`); }, [id]);

  useEffect(() => {
    const mid = localStorage.getItem(`venn_member_${id}`);
    if (!mid) { router.replace(`/join/${id}`); return; }
    setMyMemberId(mid);
  }, [id, router]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      const { data } = await supabase.from("spaces").select("*").eq("id", id).single();
      if (!cancelled) { setSpace(data as Space); setLoading(false); }
    }
    load();

    const ch = supabase
      .channel(`space-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "spaces", filter: `id=eq.${id}` },
        (p) => { if (!cancelled) setSpace(p.new as Space); })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => {
    if (space?.result) setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
  }, [space?.result]);

  // ── Loading / error ───────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-pink-50">
      <p className="text-gray-400">Loading your space…</p>
    </div>
  );

  if (!space || !myMemberId) return null;

  // ── Derived ───────────────────────────────────────────────────────────────

  const me = space.members.find((m) => m.id === myMemberId);
  const others = space.members.filter((m) => m.id !== myMemberId);
  const myTheme = THEMES[me?.color ?? 0];
  const currentTopic = TOPICS.find((t) => t.id === space.topic) ?? TOPICS[0];
  const myOptions = space.options.filter((o) => o.memberId === myMemberId);
  const canDecide = space.options.length > 0;
  const quickSuggestions = QUICK[space.topic] ?? [];

  // ── Update helpers ────────────────────────────────────────────────────────

  async function updateSpace(updates: Partial<Space>) {
    setSpace((p) => p ? { ...p, ...updates } : p);
    await supabase.from("spaces").update(updates).eq("id", id);
  }

  function updateMe(changes: Partial<Member>) {
    if (!me || !space) return;
    const updated = space.members.map((m) => m.id === myMemberId ? { ...m, ...changes } : m);
    updateSpace({ members: updated });
  }

  function addOption() {
    if (!space || !myMemberId) return;
    const t = myInput.trim();
    if (!t) return;
    const already = myOptions.some((o) => o.text.toLowerCase() === t.toLowerCase());
    if (already) return;
    setMyInput("");
    updateSpace({ options: [...space.options, { memberId: myMemberId, text: t }], result: null });
  }

  function removeOption(text: string) {
    if (!space) return;
    updateSpace({ options: space.options.filter((o) => !(o.memberId === myMemberId && o.text === text)), result: null });
  }

  async function decide() {
    if (!canDecide || !space) return;
    setDeciding(true);
    setTimeout(async () => {
      const result = resolveVenn(space.members, space.options, space.topic);
      await updateSpace({ result });
      setDeciding(false);
    }, 1200);
  }

  async function startFresh() {
    await updateSpace({ options: [], result: null });
  }

  async function setTopic(topicId: string) {
    await updateSpace({ topic: topicId, options: [], result: null });
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50" onClick={() => setShowColorPicker(false)}>
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-full bg-pink-400 opacity-80 -mr-2 z-10" />
              <div className="w-5 h-5 rounded-full bg-violet-500 opacity-80" />
            </div>
            <div>
              <h1 className="font-black text-gray-900 leading-none">Venn</h1>
              <p className="text-xs text-gray-400 leading-none">{space.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={copyInvite} className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors">
              {copied ? "✓ Copied!" : "Invite +"}
            </button>
            <button onClick={startFresh} className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors">
              🔄 Fresh start
            </button>
          </div>
        </div>

        {/* Topic chips */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTopic(t.id)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                space.topic === t.id
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"
              }`}
            >
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Member panels */}
        <div className={`grid gap-4 mb-8 ${space.members.length > 2 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}`}>

          {/* MY panel */}
          {me && (
            <div className={`rounded-2xl border-2 bg-gradient-to-br p-5 shadow-sm ${myTheme.panel} ${myTheme.border}`}
              onClick={(e) => e.stopPropagation()}>

              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 min-w-0">
                  {editingName ? (
                    <input autoFocus
                      className="text-lg font-bold text-gray-700 bg-transparent border-b-2 border-gray-400 outline-none w-full"
                      value={me.name}
                      onChange={(e) => updateMe({ name: e.target.value })}
                      onBlur={() => setEditingName(false)}
                      onKeyDown={(e) => e.key === "Enter" && setEditingName(false)} />
                  ) : (
                    <button className="text-lg font-bold text-gray-700 flex items-center gap-1 group" onClick={() => setEditingName(true)}>
                      <span>{me.name}</span>
                      <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
                    </button>
                  )}
                  <span className="text-xs text-gray-400">You</span>
                </div>
                <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="w-7 h-7 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                    style={{ backgroundColor: myTheme.swatch }}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  />
                  {showColorPicker && (
                    <div className="absolute right-0 top-9 z-20 bg-white rounded-xl shadow-xl border border-gray-100 p-3 flex gap-2">
                      {THEMES.map((t, ti) => (
                        <button key={t.label} title={t.label}
                          className={`w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform ${me.color === ti ? "border-gray-700 scale-110" : "border-white"}`}
                          style={{ backgroundColor: t.swatch }}
                          onClick={() => { updateMe({ color: ti }); setShowColorPicker(false); }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {myOptions.length === 0 && quickSuggestions.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-1.5">Quick add:</p>
                  <div className="flex flex-wrap gap-1">
                    {quickSuggestions.map((s) => (
                      <button key={s}
                        className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                        onClick={() => {
                          const already = myOptions.some((o) => o.text.toLowerCase() === s.toLowerCase());
                          if (!already) updateSpace({ options: [...space.options, { memberId: myMemberId, text: s }], result: null });
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mb-3">
                <input type="text"
                  placeholder={currentTopic.placeholder}
                  className={`flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 outline-none transition-colors ${myTheme.input}`}
                  value={myInput}
                  onChange={(e) => setMyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addOption()} />
                <button className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${myTheme.button}`} onClick={addOption}>Add</button>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                {myOptions.length === 0
                  ? <p className="text-xs text-gray-400 italic">No options yet…</p>
                  : myOptions.map((opt, j) => (
                    <span key={j} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border font-medium ${myTheme.tag}`}>
                      {opt.text}
                      <button className="opacity-50 hover:opacity-100 transition-opacity" onClick={() => removeOption(opt.text)}>✕</button>
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* THEIR panels */}
          {others.map((member) => {
            const theme = THEMES[member.color] ?? THEMES[1];
            const theirOptions = space.options.filter((o) => o.memberId === member.id);
            return (
              <div key={member.id} className={`rounded-2xl border-2 bg-gradient-to-br p-5 shadow-sm ${theme.panel} ${theme.border}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: theme.swatch }} />
                  <p className="font-bold text-gray-700">{member.name}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[60px] items-start">
                  {theirOptions.length === 0
                    ? <p className="text-xs text-gray-400 italic">Waiting for their picks…</p>
                    : theirOptions.map((opt, j) => (
                      <span key={j} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border font-medium ${theme.tag}`}>{opt.text}</span>
                    ))}
                </div>
              </div>
            );
          })}

          {/* Invite card — shown if group has < 6 members */}
          {space.members.length < 6 && (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center text-center gap-2 min-h-[120px]">
              <p className="text-sm font-semibold text-gray-400">Add someone</p>
              <button onClick={copyInvite} className="text-xs px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-medium">
                {copied ? "✓ Link copied!" : "Copy invite link"}
              </button>
            </div>
          )}
        </div>

        {/* Decide button */}
        <div className="flex justify-center mb-8">
          <button
            disabled={!canDecide || deciding}
            onClick={decide}
            className={`px-12 py-4 rounded-full text-xl font-black tracking-tight transition-all duration-200 ${
              canDecide && !deciding
                ? "bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-lg hover:shadow-xl hover:scale-105 animate-pulse-ring cursor-pointer"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
          >
            {deciding
              ? <span className="flex items-center gap-3">
                  <span className="inline-block w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin-fast" />
                  Finding overlap…
                </span>
              : "◎ Venn it"}
          </button>
        </div>

        {/* Result */}
        {space.result && (
          <div ref={resultRef} className="animate-bounce-in">
            <div className={`rounded-3xl p-8 text-center shadow-xl border-2 ${
              space.result.voters === space.result.total && space.result.total > 1
                ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
                : space.result.voters > 1
                ? "bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200"
                : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
            }`}>
              <div className="text-3xl mb-3">
                {space.result.voters === space.result.total && space.result.total > 1 ? "🎉" : space.result.voters > 1 ? "◎" : "🎲"}
              </div>
              <p className="text-gray-500 mb-2">{space.result.message}</p>
              <p className="text-4xl font-black text-gray-900 mb-4">{space.result.text}</p>
              {space.result.voters === space.result.total && space.result.total > 1 && (
                <p className="text-emerald-600 text-sm font-medium">Perfect overlap — the Venn works! 🎯</p>
              )}
              <div className="flex gap-3 justify-center mt-6">
                <button onClick={decide} className="px-6 py-2 rounded-full border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:border-gray-400 transition-colors">
                  🔄 Pick again
                </button>
                <button onClick={startFresh} className="px-6 py-2 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
                  New decision
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-gray-300 text-xs mt-10">Venn — find your overlap 💕</p>
      </div>
    </div>
  );
}
