"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TestComponentProps } from "../shared/TestInterface";
import tasksData from "./tasks.json";

type CardDef = { word: string; image: string };
type TaskRow = { task_number: number; cards: CardDef[]; bank_words: string[] };
type LevelDef = { level: number; words_count: number; tasks: TaskRow[] };
type DataRoot = { levels: LevelDef[] };

const DATA = tasksData as DataRoot;
type LevelIndex = 0 | 1 | 2;
const LEVEL_LABELS = ["1", "2", "3"] as const;

function formatTime(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function CardImage({ image, alt }: { image: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const src = `/tests/test-28-main/media/images/${image}`;
  if (failed) {
    return (
      <div className="mb-2 flex aspect-square max-h-40 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 px-2 text-center text-sm text-slate-600">
        {alt}
      </div>
    );
  }
  return (
    <div className="mb-2 aspect-square max-h-40 w-full overflow-hidden rounded-xl bg-slate-100">
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

type CardPlayState = { solved: boolean };

export default function Test28Main({ config, onComplete }: TestComponentProps) {
  const [screen, setScreen] = useState<"menu" | "play">("menu");
  const [levelIdx, setLevelIdx] = useState<LevelIndex>(0);
  const [taskIdx, setTaskIdx] = useState(0);

  const [cardStates, setCardStates] = useState<CardPlayState[]>([]);
  const [bank, setBank] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [redFlashIndex, setRedFlashIndex] = useState<number | null>(null);
  const redFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const startedAtRef = useRef<string>(new Date().toISOString());
  const completedRef = useRef(false);

  const levelDef = DATA.levels[levelIdx];
  const currentTask = levelDef?.tasks[taskIdx];

  const initTask = useCallback(() => {
    if (!currentTask) return;
    setCardStates(currentTask.cards.map(() => ({ solved: false })));
    setBank(shuffle([...currentTask.bank_words]));
    setSelectedWord(null);
    setRedFlashIndex(null);
    if (redFlashTimerRef.current) {
      clearTimeout(redFlashTimerRef.current);
      redFlashTimerRef.current = null;
    }
  }, [currentTask]);

  useEffect(() => {
    if (screen !== "play") return;
    initTask();
  }, [screen, levelIdx, taskIdx, initTask]);

  useEffect(() => {
    if (screen !== "play") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [screen]);

  useEffect(() => {
    return () => {
      if (redFlashTimerRef.current) clearTimeout(redFlashTimerRef.current);
    };
  }, []);

  const allSolved = useMemo(
    () => cardStates.length > 0 && cardStates.every((c) => c.solved),
    [cardStates],
  );

  useEffect(() => {
    if (screen !== "play" || !levelDef || !currentTask || !allSolved) return;
    const isLast = taskIdx >= levelDef.tasks.length - 1;
    const t = window.setTimeout(() => {
      if (isLast) {
        setScreen("menu");
      } else {
        setTaskIdx((i) => i + 1);
      }
    }, 700);
    return () => window.clearTimeout(t);
  }, [allSolved, screen, levelDef, currentTask, taskIdx]);

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

  function triggerRedFlash(cardIndex: number) {
    setRedFlashIndex(cardIndex);
    if (redFlashTimerRef.current) clearTimeout(redFlashTimerRef.current);
    redFlashTimerRef.current = setTimeout(() => {
      setRedFlashIndex(null);
      redFlashTimerRef.current = null;
    }, 550);
  }

  function onCardClick(cardIndex: number) {
    if (!currentTask || !selectedWord) return;
    const card = currentTask.cards[cardIndex];
    const st = cardStates[cardIndex];
    if (!card || st?.solved) return;

    if (selectedWord === card.word) {
      setCorrectCount((c) => c + 1);
      setBank((b) => b.filter((w) => w !== selectedWord));
      setSelectedWord(null);
      setCardStates((prev) => {
        const next = [...prev];
        next[cardIndex] = { solved: true };
        return next;
      });
      return;
    }

    setIncorrectCount((c) => c + 1);
    triggerRedFlash(cardIndex);
    setSelectedWord(null);
  }

  const gridColsClass = levelIdx === 2 ? "grid-cols-3" : "grid-cols-2";

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
              <div className="mt-1 text-base font-semibold opacity-90">2 слова</div>
            </button>
            <button
              type="button"
              onClick={() => startLevel(1)}
              className="rounded-3xl bg-indigo-500 px-6 py-6 text-2xl font-extrabold text-white shadow hover:bg-indigo-600"
            >
              2 уровень
              <div className="mt-1 text-base font-semibold opacity-90">4 слова</div>
            </button>
            <button
              type="button"
              onClick={() => startLevel(2)}
              className="rounded-3xl bg-orange-500 px-6 py-6 text-2xl font-extrabold text-white shadow hover:bg-orange-600"
            >
              3 уровень
              <div className="mt-1 text-base font-semibold opacity-90">6 слов</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!levelDef || !currentTask) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-8">
      <div className="mx-auto max-w-5xl">
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
              {levelDef.tasks.map((t, idx) => (
                <option key={t.task_number} value={idx}>
                  Задание {t.task_number}
                </option>
              ))}
            </select>
            <div className="text-lg font-semibold">
              Задание {currentTask.task_number} из {levelDef.tasks.length}
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
              onClick={initTask}
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

        <div className={`mx-auto mb-8 grid max-w-4xl gap-4 ${gridColsClass}`}>
          {currentTask.cards.map((card, i) => {
            const solved = cardStates[i]?.solved ?? false;
            const isRed = redFlashIndex === i;
            const frame = solved
              ? "border-green-500 bg-green-50 ring-2 ring-green-400"
              : isRed
                ? "border-red-500 bg-red-50 ring-2 ring-red-400"
                : "border-gray-200 bg-white";

            return (
              <button
                key={`${card.image}-${i}`}
                type="button"
                disabled={solved}
                onClick={() => onCardClick(i)}
                className={`flex flex-col rounded-2xl border-2 p-3 text-left shadow-sm transition-colors ${frame} ${
                  solved ? "cursor-default" : "cursor-pointer hover:border-indigo-300"
                }`}
              >
                <CardImage image={card.image} alt={card.word} />
                <div
                  className={[
                    "min-h-[52px] rounded-xl px-2 py-2 text-center text-base font-bold",
                    solved ? "border-2 border-solid border-green-400 bg-white text-gray-900" : "",
                    !solved ? "border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400" : "",
                  ].join(" ")}
                >
                  {solved ? card.word : "—"}
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow md:p-6">
          <h3 className="mb-4 text-center text-lg font-bold text-gray-800">
            Выберите подходящее слово
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {bank.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setSelectedWord((s) => (s === w ? null : w))}
                className={[
                  "rounded-full border-2 px-4 py-2 text-base font-semibold shadow-sm transition-colors",
                  selectedWord === w
                    ? "border-indigo-500 bg-indigo-100 text-indigo-900"
                    : "border-gray-200 bg-white text-gray-900 hover:border-indigo-400",
                ].join(" ")}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
