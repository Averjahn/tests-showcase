"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TestComponentProps } from "../shared/TestInterface";
import tasksRaw from "./tasks.json";

type SlotQuestion = "Кто?" | "Что делает?" | "Что делают?" | "Что?" | "Кого?" | "Кого?/Что?";

type WordDef = { id: number; word: string; question: SlotQuestion };
type PhraseDef = { id: number; phrase: string; image: string; words: [WordDef, WordDef, WordDef] };
type TaskDef = PhraseDef[]; // always 4 phrases per task

type LevelIndex = 0 | 1 | 2;
type ResultState = "idle" | "ok" | "bad";
type SlotState = [string | null, string | null, string | null];

type WordToken = { id: string; text: string; cat: 0 | 1 | 2 };

const TASKS = tasksRaw as unknown as TaskDef[];
const LEVEL_LABELS = ["1", "2", "3"] as const;

function formatTime(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function phraseCountForLevel(level: LevelIndex) {
  return level + 2;
}

function PhrasePicture({ image, alt }: { image: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const src = `/tests/test-27-main/media/images/${image}`;
  if (failed) {
    return (
      <div className="mb-3 flex aspect-[4/3] items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 px-3 text-center text-sm leading-snug text-slate-600">
        {alt}
      </div>
    );
  }
  return (
    <div className="mb-3 aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain"
        draggable={false}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function buildTokens(taskNumber: number, phrases: PhraseDef[]): WordToken[] {
  const tokens: WordToken[] = [];
  phrases.forEach((p, pi) => {
    const base = `task${taskNumber}-p${pi}`;
    tokens.push({ id: `${base}-who`, text: p.words[0].word, cat: 0 });
    tokens.push({ id: `${base}-does`, text: p.words[1].word, cat: 1 });
    tokens.push({ id: `${base}-obj`, text: p.words[2].word, cat: 2 });
  });
  return tokens;
}

export default function Test27Main({ config, onComplete }: TestComponentProps) {
  const [screen, setScreen] = useState<"menu" | "play">("menu");
  const [levelIdx, setLevelIdx] = useState<LevelIndex>(0);
  const [taskIdx, setTaskIdx] = useState(0); // 0..16

  const [slots, setSlots] = useState<SlotState[]>([]);
  const [results, setResults] = useState<ResultState[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const startedAtRef = useRef<string>(new Date().toISOString());
  const completedRef = useRef(false);
  const tokenByIdRef = useRef<Map<string, WordToken>>(new Map());
  const validatedKeyRef = useRef<Set<string>>(new Set());

  const task = TASKS[taskIdx];
  const phrases = useMemo(() => {
    if (!task) return [] as PhraseDef[];
    return task.slice(0, phraseCountForLevel(levelIdx));
  }, [task, levelIdx]);

  const taskNumber = taskIdx + 1;

  const objColumnLabel = useMemo(() => {
    const hints = new Set(phrases.map((p) => p.words[2].question));
    if (hints.size === 1) return phrases[0]?.words[2].question ?? "Что?";
    return "Кого?/Что?";
  }, [phrases]);

  const initRound = useCallback(() => {
    if (!task) return;
    const list = task.slice(0, phraseCountForLevel(levelIdx));
    const tokens = buildTokens(taskNumber, list);
    const m = new Map<string, WordToken>();
    tokens.forEach((t) => m.set(t.id, t));
    tokenByIdRef.current = m;
    validatedKeyRef.current.clear();
    setSlots(list.map(() => [null, null, null]));
    setResults(list.map(() => "idle"));
    setSelectedId(null);
  }, [task, levelIdx, taskNumber]);

  useEffect(() => {
    if (screen !== "play") return;
    initRound();
  }, [screen, taskIdx, levelIdx, initRound]);

  useEffect(() => {
    if (screen !== "play") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [screen]);

  function clearValidatedForPhrase(pi: number) {
    const s = validatedKeyRef.current;
    for (const k of [...s]) {
      if (k.startsWith(`${pi}:`)) s.delete(k);
    }
  }

  function finishTest() {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete({
      testId: config.id,
      answers: [],
      totalTime: seconds * 1000,
      correctCount,
      incorrectCount,
      startedAt: startedAtRef.current,
      completedAt: new Date().toISOString(),
    });
  }

  const allTokens = useMemo(() => buildTokens(taskNumber, phrases), [taskNumber, phrases]);

  const bankByCat = useMemo(() => {
    if (!task || screen !== "play") return [[], [], []] as [WordToken[], WordToken[], WordToken[]];
    const placed = new Set<string>();
    slots.forEach((row) => row.forEach((id) => id && placed.add(id)));
    const free = allTokens.filter((t) => !placed.has(t.id));
    return [
      free.filter((x) => x.cat === 0),
      free.filter((x) => x.cat === 1),
      free.filter((x) => x.cat === 2),
    ] as [WordToken[], WordToken[], WordToken[]];
  }, [task, allTokens, slots, screen]);

  function placeToken(phraseIdx: number, slotIdx: 0 | 1 | 2, tokenId: string) {
    if (results[phraseIdx] === "ok") return;
    clearValidatedForPhrase(phraseIdx);
    setResults((prev) => {
      const next = [...prev];
      if (next[phraseIdx] === "bad") next[phraseIdx] = "idle";
      return next;
    });
    setSlots((prev) => {
      const next = prev.map((row) => [...row]) as SlotState[];
      for (let i = 0; i < next.length; i += 1) {
        for (let j = 0; j < 3; j += 1) {
          if (next[i][j] === tokenId) next[i][j] = null;
        }
      }
      next[phraseIdx][slotIdx] = tokenId;
      return next;
    });
    setSelectedId(null);
  }

  function clearSlot(phraseIdx: number, slotIdx: 0 | 1 | 2) {
    if (results[phraseIdx] === "ok") return;
    clearValidatedForPhrase(phraseIdx);
    setSlots((prev) => {
      const next = prev.map((row) => [...row]) as SlotState[];
      next[phraseIdx][slotIdx] = null;
      return next;
    });
    setResults((prev) => {
      const next = [...prev];
      if (next[phraseIdx] === "bad") next[phraseIdx] = "idle";
      return next;
    });
  }

  function onSlotClick(phraseIdx: number, slotIdx: 0 | 1 | 2) {
    if (results[phraseIdx] === "ok") return;
    const cur = slots[phraseIdx]?.[slotIdx];
    if (selectedId) {
      placeToken(phraseIdx, slotIdx, selectedId);
      return;
    }
    if (cur) clearSlot(phraseIdx, slotIdx);
  }

  function onBankClick(tok: WordToken) {
    setSelectedId((s) => (s === tok.id ? null : tok.id));
  }

  // авто-проверка при заполнении 3 секторов
  useEffect(() => {
    if (screen !== "play") return;
    phrases.forEach((p, pi) => {
      if (results[pi] !== "idle") return;
      const tri = slots[pi];
      if (!tri || !tri.every(Boolean)) return;
      const vKey = `${pi}:${tri.join("|")}`;
      if (validatedKeyRef.current.has(vKey)) return;
      validatedKeyRef.current.add(vKey);
      const texts = tri.map((id) => (id ? tokenByIdRef.current.get(id)?.text ?? "" : "")) as [
        string,
        string,
        string,
      ];
      const ok =
        texts[0] === p.words[0].word && texts[1] === p.words[1].word && texts[2] === p.words[2].word;
      setResults((prev) => {
        if (prev[pi] !== "idle") return prev;
        const next = [...prev];
        next[pi] = ok ? "ok" : "bad";
        return next;
      });
      if (ok) setCorrectCount((c) => c + 1);
      else setIncorrectCount((c) => c + 1);
    });
  }, [slots, results, phrases, screen]);

  const allOk = results.length > 0 && results.every((r) => r === "ok");

  // авто-переход по заданиям, а после конца уровня — меню
  useEffect(() => {
    if (screen !== "play" || !allOk) return;
    const t = window.setTimeout(() => {
      if (taskIdx < TASKS.length - 1) {
        setTaskIdx((i) => i + 1);
      } else {
        setScreen("menu");
      }
    }, 900);
    return () => window.clearTimeout(t);
  }, [allOk, screen, taskIdx]);

  function startLevel(level: LevelIndex) {
    completedRef.current = false;
    startedAtRef.current = new Date().toISOString();
    setSeconds(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setLevelIdx(level);
    setTaskIdx(0);
    setScreen("play");
  }

  function backToMenu() {
    setScreen("menu");
  }

  if (screen === "menu") {
    return (
      <div className="min-h-screen bg-sky-50 p-4 md:p-8">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-6 shadow md:p-10">
          <h1 className="mb-2 text-center text-3xl font-extrabold text-sky-900 md:text-4xl">
            {config.name}
          </h1>
          <p className="mb-8 text-center text-base text-slate-600 md:text-lg">
            Выберите уровень сложности
          </p>

          <div className="grid gap-4">
            <button
              type="button"
              onClick={() => startLevel(0)}
              className="rounded-3xl bg-emerald-500 px-6 py-6 text-2xl font-extrabold text-white shadow hover:bg-emerald-600"
            >
              1 уровень
              <div className="mt-1 text-base font-semibold opacity-90">2 фразы</div>
            </button>
            <button
              type="button"
              onClick={() => startLevel(1)}
              className="rounded-3xl bg-indigo-500 px-6 py-6 text-2xl font-extrabold text-white shadow hover:bg-indigo-600"
            >
              2 уровень
              <div className="mt-1 text-base font-semibold opacity-90">3 фразы</div>
            </button>
            <button
              type="button"
              onClick={() => startLevel(2)}
              className="rounded-3xl bg-orange-500 px-6 py-6 text-2xl font-extrabold text-white shadow hover:bg-orange-600"
            >
              3 уровень
              <div className="mt-1 text-base font-semibold opacity-90">4 фразы</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={backToMenu}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              ← Вернуться назад
            </button>
            <select
              value={taskIdx}
              onChange={(e) => setTaskIdx(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              aria-label="Выбор задания"
            >
              {TASKS.map((_, idx) => (
                <option key={idx} value={idx}>
                  Задание {idx + 1}
                </option>
              ))}
            </select>
            <div className="text-lg font-semibold">
              Задание {taskIdx + 1} из {TASKS.length}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-green-600">✓ {correctCount}</span>
            <span className="font-semibold text-red-600">✗ {incorrectCount}</span>
            <span className="font-mono">{formatTime(seconds)}</span>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">
              Уровень {LEVEL_LABELS[levelIdx]}
            </div>
            <button
              type="button"
              onClick={initRound}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Начать заново
            </button>
            <button
              type="button"
              onClick={finishTest}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              Завершить тест
            </button>
          </div>
        </div>

        <h2 className="mb-6 text-center text-xl font-bold text-gray-800 md:text-2xl">
          Составь фразу
        </h2>

        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:flex-wrap lg:justify-center">
          {phrases.map((p, pi) => {
            const res = results[pi];
            const frame =
              res === "ok"
                ? "border-green-500 bg-green-50 ring-2 ring-green-400"
                : res === "bad"
                ? "border-red-500 bg-red-50 ring-2 ring-red-400"
                : "border-gray-200 bg-white";
            return (
              <div
                key={`${taskIdx}-${p.image}-${pi}`}
                className={`flex min-w-0 flex-1 flex-col rounded-2xl border-2 p-4 shadow-sm lg:max-w-[280px] ${frame}`}
              >
                <PhrasePicture image={p.image} alt={p.phrase} />
                <div className="grid grid-cols-1 gap-2">
                  {([0, 1, 2] as const).map((si) => {
                    const id = slots[pi]?.[si];
                    const tok = id ? tokenByIdRef.current.get(id) : null;
                    const label = p.words[si].question;
                    const filled = Boolean(tok);
                    return (
                      <button
                        key={`${pi}-${si}`}
                        type="button"
                        onClick={() => onSlotClick(pi, si)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const tid = e.dataTransfer.getData("tokenId");
                          if (tid) placeToken(pi, si, tid);
                        }}
                        className={[
                          "min-h-[62px] rounded-xl px-3 py-2 text-left transition-colors",
                          filled ? "border-2 border-solid" : "border-2 border-dashed",
                          res === "ok"
                            ? "border-green-400 bg-green-50"
                            : res === "bad"
                            ? "border-red-400 bg-red-50"
                            : filled
                            ? "border-gray-300 bg-white hover:border-indigo-400"
                            : "border-gray-300 bg-gray-50 hover:border-indigo-400",
                        ].join(" ")}
                      >
                        <div className="text-xs font-semibold text-gray-400">{label}</div>
                        <div className="text-base font-bold text-gray-900">{tok?.text ?? "—"}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow md:p-6">
          <div className="mb-4 text-center text-sm font-semibold text-gray-500">
            Нажмите слово в банке, затем сектор под картинкой. Нажмите на заполненный сектор, чтобы
            вернуть слово обратно.
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {(
              [
                { title: "Кто?", cat: 0 as const, color: "emerald" as const },
                { title: "Что делает?", cat: 1 as const, color: "indigo" as const },
                { title: objColumnLabel, cat: 2 as const, color: "orange" as const },
              ] as const
            ).map(({ title, cat, color }) => (
              <div key={`${title}-${cat}`}>
                <h3 className="mb-3 text-center text-sm font-bold tracking-wide text-gray-700">
                  {title}
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {bankByCat[cat].map((tok) => (
                    <button
                      key={tok.id}
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("tokenId", tok.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={() => onBankClick(tok)}
                      className={[
                        "rounded-full border-2 px-3 py-2 text-base font-semibold shadow-sm transition-colors",
                        selectedId === tok.id
                          ? color === "emerald"
                            ? "border-emerald-500 bg-emerald-100 text-emerald-900"
                            : color === "indigo"
                            ? "border-indigo-500 bg-indigo-100 text-indigo-900"
                            : "border-orange-500 bg-orange-100 text-orange-900"
                          : color === "emerald"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-400"
                          : color === "indigo"
                          ? "border-indigo-200 bg-indigo-50 text-indigo-900 hover:border-indigo-400"
                          : "border-orange-200 bg-orange-50 text-orange-900 hover:border-orange-400",
                      ].join(" ")}
                    >
                      {tok.text}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

