"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TestComponentProps } from "../shared/TestInterface";
import { tasks, type HintLabel, type PhraseCorrect } from "./tasks-data";

type PhraseState = {
  bank: string[];
  slots: (string | null)[];
  selectedWordIndex: number | null;
  status: "idle" | "correct" | "error";
  solved: boolean;
};

function formatTime(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function shuffle<T>(items: T[]) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function keyForHint(hint: HintLabel): keyof PhraseCorrect {
  switch (hint) {
    case "Кто?":
      return "who";
    case "Что делает?":
      return "verb";
    case "Что?":
      return "object";
    case "Чем?":
      return "tool";
    case "Где?":
      return "place";
    case "Кому?":
      return "whom";
  }
}

function expectedWords(correct: PhraseCorrect, hints: HintLabel[]) {
  return hints.map((h) => String(correct[keyForHint(h)] ?? ""));
}

function createPhraseState(correct: PhraseCorrect, hints: HintLabel[]): PhraseState {
  const expected = expectedWords(correct, hints);
  return {
    bank: shuffle(expected),
    slots: new Array(hints.length).fill(null),
    selectedWordIndex: null,
    status: "idle",
    solved: false,
  };
}

function isPhraseCorrect(slots: (string | null)[], expected: string[]) {
  return slots.every((word, idx) => word === expected[idx]);
}

export default function Test24Main({ config, onComplete }: TestComponentProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const startedAtRef = useRef<string>(new Date().toISOString());
  const completedRef = useRef(false);

  const currentTask = tasks[currentTaskIndex];

  const [phrasesState, setPhrasesState] = useState<PhraseState[]>(() =>
    currentTask
      ? currentTask.phrases.map((p) => createPhraseState(p.correct, currentTask.hints))
      : [],
  );

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!currentTask) return;
    setPhrasesState(
      currentTask.phrases.map((p) => createPhraseState(p.correct, currentTask.hints)),
    );
  }, [currentTask]);

  const allSolved = useMemo(
    () => phrasesState.length > 0 && phrasesState.every((p) => p.solved),
    [phrasesState],
  );

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

  useEffect(() => {
    if (!allSolved) return;
    const timer = window.setTimeout(() => {
      if (currentTaskIndex < tasks.length - 1) setCurrentTaskIndex((i) => i + 1);
      else finishTest();
    }, 350);
    return () => clearTimeout(timer);
  }, [allSolved, currentTaskIndex]);

  function handleBankWordClick(phraseIndex: number, wordIndex: number) {
    const phrase = phrasesState[phraseIndex];
    if (!phrase || phrase.solved) return;

    const next = [...phrasesState];
    const isSame = phrase.selectedWordIndex === wordIndex;
    next[phraseIndex] = {
      ...phrase,
      selectedWordIndex: isSame ? null : wordIndex,
      status: phrase.status === "error" ? "idle" : phrase.status,
    };
    setPhrasesState(next);
  }

  function handleSlotClick(phraseIndex: number, slotIndex: number) {
    const phrase = phrasesState[phraseIndex];
    if (!phrase || phrase.solved) return;

    const next = [...phrasesState];

    // Если в слоте есть слово — возвращаем обратно в банк.
    if (phrase.slots[slotIndex]) {
      const word = phrase.slots[slotIndex] as string;
      const nextSlots = [...phrase.slots];
      nextSlots[slotIndex] = null;
      next[phraseIndex] = {
        ...phrase,
        slots: nextSlots,
        bank: [...phrase.bank, word],
        selectedWordIndex: null,
        status: "idle",
      };
      setPhrasesState(next);
      return;
    }

    // Слот пустой: вставка возможна только если выбрано слово в банке.
    if (phrase.selectedWordIndex === null) return;
    const selectedIdx = phrase.selectedWordIndex;
    const selectedWord = phrase.bank[selectedIdx];
    if (!selectedWord) return;

    const nextBank = [...phrase.bank];
    nextBank.splice(selectedIdx, 1);
    const nextSlots = [...phrase.slots];
    nextSlots[slotIndex] = selectedWord;

    const filled = nextSlots.every((w) => w !== null);
    if (!filled) {
      next[phraseIndex] = {
        ...phrase,
        bank: nextBank,
        slots: nextSlots,
        selectedWordIndex: null,
        status: "idle",
      };
      setPhrasesState(next);
      return;
    }

    const expected = expectedWords(
      currentTask.phrases[phraseIndex].correct,
      currentTask.hints,
    );
    const correct = isPhraseCorrect(nextSlots, expected);

    if (correct) {
      next[phraseIndex] = {
        ...phrase,
        bank: nextBank,
        slots: nextSlots,
        selectedWordIndex: null,
        status: "correct",
        solved: true,
      };
      setPhrasesState(next);
      setCorrectCount((c) => c + 1);
      return;
    }

    next[phraseIndex] = {
      ...phrase,
      bank: nextBank,
      slots: nextSlots,
      selectedWordIndex: null,
      status: "error",
    };
    setPhrasesState(next);
    setIncorrectCount((c) => c + 1);

    window.setTimeout(() => {
      setPhrasesState((prev) => {
        const cur = prev[phraseIndex];
        if (!cur || cur.solved) return prev;
        const reset = [...prev];
        reset[phraseIndex] = createPhraseState(
          currentTask.phrases[phraseIndex].correct,
          currentTask.hints,
        );
        return reset;
      });
    }, 500);
  }

  if (!currentTask) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow">
          <div className="w-full text-xl font-bold text-slate-900">{config.name}</div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={currentTaskIndex}
              onChange={(e) => setCurrentTaskIndex(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              aria-label="Выбор задания"
            >
              {tasks.map((t, idx) => (
                <option key={t.id} value={idx}>
                  Задание {t.id}
                </option>
              ))}
            </select>
            <div className="text-lg font-semibold">
              Задание {currentTask.id} из {tasks.length}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-green-600">✓ {correctCount}</span>
            <span className="font-semibold text-red-600">✗ {incorrectCount}</span>
            <span className="font-mono">{formatTime(seconds)}</span>
            <button
              type="button"
              onClick={finishTest}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              Завершить тест
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow md:p-8">
          <h2 className="text-center text-3xl font-semibold text-slate-800">
            Составьте фразы
          </h2>
          <p className="mb-6 mt-1 text-center text-sm text-slate-500">
            Подсказки: {currentTask.hints.join(" ")}
          </p>

          <div className="space-y-4">
            {currentTask.phrases.map((_, phraseIndex) => {
              const phrase = phrasesState[phraseIndex];
              if (!phrase) return null;
              const expectedText = expectedWords(
                currentTask.phrases[phraseIndex].correct,
                currentTask.hints,
              ).join(" ");

              const blockClass = [
                "rounded-2xl border p-4 transition-colors duration-200",
                phrase.status === "correct" ? "border-green-500 bg-green-50" : "",
                phrase.status === "error" ? "border-red-500 bg-red-50" : "",
                phrase.status === "idle" ? "border-gray-200 bg-gray-50" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div key={`phrase-${phraseIndex}`} className={blockClass}>
                  <div className="mb-3 text-sm font-medium text-slate-600">
                    Фраза {phraseIndex + 1}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
                    <div className="flex flex-wrap items-center gap-2">
                      {phrase.bank.map((word, wordIndex) => {
                        const selected = phrase.selectedWordIndex === wordIndex;
                        return (
                          <button
                            key={`bank-${phraseIndex}-${wordIndex}-${word}`}
                            type="button"
                            onClick={() => handleBankWordClick(phraseIndex, wordIndex)}
                            disabled={phrase.solved}
                            className={[
                              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-200",
                              selected
                                ? "border-blue-500 bg-blue-500 text-white"
                                : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400",
                              phrase.solved ? "cursor-not-allowed opacity-60" : "",
                            ].join(" ")}
                          >
                            {word}
                          </button>
                        );
                      })}
                    </div>

                    {phrase.solved ? (
                      <div className="mx-2 text-base font-semibold text-emerald-900">
                        {expectedText}
                      </div>
                    ) : (
                      <>
                        <span className="mx-1 text-xl text-slate-500">→</span>

                        <div
                          className={[
                            "grid gap-2",
                            currentTask.hints.length === 3
                              ? "grid-cols-3"
                              : "grid-cols-2 md:grid-cols-4",
                          ].join(" ")}
                        >
                          {currentTask.hints.map((label, slotIndex) => (
                            <div
                              key={`slot-${phraseIndex}-${slotIndex}`}
                              className="min-w-[120px]"
                            >
                              <div className="mb-1 text-center text-xs text-slate-500">{label}</div>
                              <button
                                type="button"
                                onClick={() => handleSlotClick(phraseIndex, slotIndex)}
                                className={[
                                  "h-10 w-full rounded-xl border bg-white px-2 text-sm font-semibold text-slate-700 hover:border-indigo-400",
                                  phrase.slots[slotIndex] ? "border-slate-300" : "border-dashed border-slate-300",
                                ].join(" ")}
                              >
                                {phrase.slots[slotIndex] ?? "—"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

