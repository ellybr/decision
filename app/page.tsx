"use client";

import { useState, useRef } from "react";

interface ColorTheme {
  label: string;
  swatch: string;
  panel: string;
  border: string;
  tag: string;
  button: string;
  buttonHover: string;
  inputFocus: string;
}

const THEMES: ColorTheme[] = [
  {
    label: "Rose",
    swatch: "#f43f5e",
    panel: "from-pink-50 to-rose-50",
    border: "border-pink-200",
    tag: "bg-pink-100 text-pink-800 border-pink-200",
    button: "bg-rose-500 text-white",
    buttonHover: "hover:bg-rose-600",
    inputFocus: "focus:border-rose-400",
  },
  {
    label: "Violet",
    swatch: "#8b5cf6",
    panel: "from-violet-50 to-purple-50",
    border: "border-violet-200",
    tag: "bg-violet-100 text-violet-800 border-violet-200",
    button: "bg-violet-500 text-white",
    buttonHover: "hover:bg-violet-600",
    inputFocus: "focus:border-violet-400",
  },
  {
    label: "Sky",
    swatch: "#0ea5e9",
    panel: "from-sky-50 to-blue-50",
    border: "border-sky-200",
    tag: "bg-sky-100 text-sky-800 border-sky-200",
    button: "bg-sky-500 text-white",
    buttonHover: "hover:bg-sky-600",
    inputFocus: "focus:border-sky-400",
  },
  {
    label: "Emerald",
    swatch: "#10b981",
    panel: "from-emerald-50 to-teal-50",
    border: "border-emerald-200",
    tag: "bg-emerald-100 text-emerald-800 border-emerald-200",
    button: "bg-emerald-500 text-white",
    buttonHover: "hover:bg-emerald-600",
    inputFocus: "focus:border-emerald-400",
  },
  {
    label: "Orange",
    swatch: "#f97316",
    panel: "from-orange-50 to-amber-50",
    border: "border-orange-200",
    tag: "bg-orange-100 text-orange-800 border-orange-200",
    button: "bg-orange-500 text-white",
    buttonHover: "hover:bg-orange-600",
    inputFocus: "focus:border-orange-400",
  },
  {
    label: "Indigo",
    swatch: "#6366f1",
    panel: "from-indigo-50 to-blue-50",
    border: "border-indigo-200",
    tag: "bg-indigo-100 text-indigo-800 border-indigo-200",
    button: "bg-indigo-500 text-white",
    buttonHover: "hover:bg-indigo-600",
    inputFocus: "focus:border-indigo-400",
  },
];

interface PersonState {
  name: string;
  options: string[];
  input: string;
  themeIndex: number;
}

const SUGGESTIONS = [
  "Pizza", "Sushi", "Tacos", "Burgers", "Pasta",
  "Thai food", "Indian curry", "Ramen", "Salad", "BBQ",
  "Chinese takeout", "Greek food", "Sandwiches", "Steak", "Seafood",
];

const DECISION_MESSAGES = {
  match: [
    "Great minds think alike! You both want",
    "You're on the same page — tonight it's",
    "Boom! You both picked",
    "No fight needed, you both agreed on",
  ],
  compromise: [
    "After careful deliberation… it's",
    "The dinner gods have spoken:",
    "Stop arguing. You're having",
    "The algorithm of love has decided:",
    "Destiny (and randomness) says:",
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function Home() {
  const [people, setPeople] = useState<[PersonState, PersonState]>([
    { name: "You", options: [], input: "", themeIndex: 0 },
    { name: "Your partner", options: [], input: "", themeIndex: 1 },
  ]);
  const [result, setResult] = useState<{ food: string; message: string; isMatch: boolean } | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [editingName, setEditingName] = useState<0 | 1 | null>(null);
  const [showThemePicker, setShowThemePicker] = useState<0 | 1 | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  function updatePerson(index: 0 | 1, updates: Partial<PersonState>) {
    setPeople((prev) => {
      const next: [PersonState, PersonState] = [{ ...prev[0] }, { ...prev[1] }];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }

  function addOption(index: 0 | 1) {
    const trimmed = people[index].input.trim();
    if (!trimmed || people[index].options.includes(trimmed)) return;
    updatePerson(index, { options: [...people[index].options, trimmed], input: "" });
  }

  function removeOption(personIndex: 0 | 1, optionIndex: number) {
    updatePerson(personIndex, {
      options: people[personIndex].options.filter((_, i) => i !== optionIndex),
    });
  }

  function decide() {
    const [p1, p2] = people;
    const allOptions = [...p1.options, ...p2.options];
    if (allOptions.length === 0) return;

    setDeciding(true);
    setResult(null);

    setTimeout(() => {
      const p2Lower = p2.options.map((o) => o.toLowerCase());
      const matches = p1.options.filter((o) => p2Lower.includes(o.toLowerCase()));
      const isMatch = matches.length > 0;
      const food = pickRandom(isMatch ? matches : allOptions);
      const message = pickRandom(isMatch ? DECISION_MESSAGES.match : DECISION_MESSAGES.compromise);

      setResult({ food, message, isMatch });
      setDeciding(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }, 1200);
  }

  function reset() {
    setResult(null);
    setPeople([
      { name: "You", options: [], input: "", themeIndex: 0 },
      { name: "Your partner", options: [], input: "", themeIndex: 1 },
    ]);
  }

  const canDecide = people[0].options.length + people[1].options.length > 0;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-violet-50"
      onClick={() => setShowThemePicker(null)}
    >
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🍽️</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Dinner Decider</h1>
          <p className="text-gray-500 text-lg">No more arguing. Just eat.</p>
        </div>

        {/* Person panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {([0, 1] as const).map((i) => {
            const person = people[i];
            const theme = THEMES[person.themeIndex];

            return (
              <div
                key={i}
                className={`rounded-2xl border-2 bg-gradient-to-br p-6 shadow-sm ${theme.panel} ${theme.border}`}
              >
                {/* Name row + color picker */}
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {editingName === i ? (
                      <input
                        autoFocus
                        className="text-xl font-bold text-gray-700 bg-transparent border-b-2 border-gray-400 outline-none w-full"
                        value={person.name}
                        onChange={(e) => updatePerson(i, { name: e.target.value })}
                        onBlur={() => setEditingName(null)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingName(null)}
                      />
                    ) : (
                      <button
                        className="text-xl font-bold text-gray-700 hover:text-gray-900 flex items-center gap-1 group truncate"
                        onClick={() => setEditingName(i)}
                      >
                        <span className="truncate">{person.name}</span>
                        <span className="text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">✏️</span>
                      </button>
                    )}
                  </div>

                  {/* Color swatch button */}
                  <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      title="Pick a color"
                      className="w-7 h-7 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
                      style={{ backgroundColor: theme.swatch }}
                      onClick={() => setShowThemePicker(showThemePicker === i ? null : i)}
                    />
                    {showThemePicker === i && (
                      <div className="absolute right-0 top-9 z-20 bg-white rounded-xl shadow-xl border border-gray-100 p-3 flex gap-2">
                        {THEMES.map((t, ti) => (
                          <button
                            key={t.label}
                            title={t.label}
                            className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${person.themeIndex === ti ? "border-gray-700 scale-110" : "border-white"}`}
                            style={{ backgroundColor: t.swatch }}
                            onClick={() => {
                              updatePerson(i, { themeIndex: ti });
                              setShowThemePicker(null);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick suggestions */}
                {person.options.length === 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-2">Quick add:</p>
                    <div className="flex flex-wrap gap-1">
                      {SUGGESTIONS.slice(0, 6).map((s) => (
                        <button
                          key={s}
                          className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                          onClick={() => {
                            if (!person.options.includes(s)) {
                              updatePerson(i, { options: [...person.options, s] });
                            }
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Add a dinner option…"
                    className={`flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 outline-none transition-colors ${theme.inputFocus}`}
                    value={person.input}
                    onChange={(e) => updatePerson(i, { input: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && addOption(i)}
                  />
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${theme.button} ${theme.buttonHover}`}
                    onClick={() => addOption(i)}
                  >
                    Add
                  </button>
                </div>

                {/* Options list */}
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {person.options.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No options yet…</p>
                  ) : (
                    person.options.map((opt, j) => (
                      <span
                        key={j}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border font-medium ${theme.tag}`}
                      >
                        {opt}
                        <button
                          className="ml-1 opacity-50 hover:opacity-100 transition-opacity text-xs leading-none"
                          onClick={() => removeOption(i, j)}
                          aria-label={`Remove ${opt}`}
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Decide button */}
        <div className="flex justify-center mb-8">
          <button
            disabled={!canDecide || deciding}
            onClick={decide}
            className={`
              px-12 py-4 rounded-full text-xl font-bold transition-all duration-200
              ${canDecide && !deciding
                ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-lg hover:shadow-xl hover:scale-105 animate-pulse-ring cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            {deciding ? (
              <span className="flex items-center gap-3">
                <span className="inline-block w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin-fast" />
                Deciding…
              </span>
            ) : (
              "✨ Decide for us!"
            )}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div ref={resultRef} className="animate-bounce-in">
            <div className={`rounded-3xl p-8 text-center shadow-xl border-2 ${
              result.isMatch
                ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
                : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
            }`}>
              <div className="text-4xl mb-3">{result.isMatch ? "🎉" : "🎲"}</div>
              <p className="text-gray-500 text-base mb-2">{result.message}</p>
              <p className="text-4xl font-black text-gray-800 mb-4">{result.food}</p>
              {result.isMatch ? (
                <p className="text-emerald-600 text-sm font-medium">You both had this on your list — great minds!</p>
              ) : (
                <p className="text-amber-600 text-sm font-medium">No overlap found, so we picked from your combined list. Accept your fate.</p>
              )}
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={decide}
                  className="px-6 py-2 rounded-full border-2 border-gray-300 text-gray-600 text-sm font-semibold hover:border-gray-400 hover:text-gray-800 transition-colors"
                >
                  🔄 Pick again
                </button>
                <button
                  onClick={reset}
                  className="px-6 py-2 rounded-full bg-gray-800 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
                >
                  Start over
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-gray-400 text-xs mt-10">
          Built with love to end dinner arguments forever 💕
        </p>
      </div>
    </div>
  );
}
