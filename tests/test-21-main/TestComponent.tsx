"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TestComponentProps } from "../shared/TestInterface";
import { tasks, VOWEL_LETTERS } from "./tasks-data";

type BlankToken = { kind: "blank"; id: string; correctLetter: string };
type TextToken = { kind: "text"; value: string };
type Token = BlankToken | TextToken;

type BlankState = {
  filledLetter: string | null;
  locked: boolean;
  flash: "correct" | "incorrect" | null;
};

function formatTime(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function createVowelSet(letters: readonly string[]) {
  const normalized = letters.map((l) => l.toLowerCase());
  return new Set<string>(normalized);
}

function isCyrillicWordChar(ch: string) {
  return /[А-Яа-яЁё]/.test(ch);
}

function countVowelsInWord(word: string, vowelSet: Set<string>) {
  let count = 0;
  for (const raw of word) {
    const ch = raw.toLowerCase();
    if (vowelSet.has(ch)) count += 1;
  }
  return count;
}

function tokenizeTextWithVowelBlanks(text: string, vowelSet: Set<string>) {
  const tokens: Token[] = [];
  const blankMeta: Record<string, { correctLetter: string }> = {};

  let blankSeq = 0;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (!isCyrillicWordChar(ch)) {
      tokens.push({ kind: "text", value: ch });
      i += 1;
      continue;
    }

    let j = i;
    while (j < text.length && isCyrillicWordChar(text[j])) j += 1;
    const word = text.slice(i, j);

    const vowelCount = countVowelsInWord(word, vowelSet);
    if (vowelCount <= 1) {
      tokens.push({ kind: "text", value: word });
      i = j;
      continue;
    }

    const chars = Array.from(word);
    const vowelPositions: number[] = [];
    for (let k = 0; k < chars.length; k += 1) {
      const letter = chars[k].toLowerCase();
      if (vowelSet.has(letter)) vowelPositions.push(k);
    }

    const randomVowelPos =
      vowelPositions[Math.floor(Math.random() * vowelPositions.length)];

    for (let k = 0; k < chars.length; k += 1) {
      const rawLetter = chars[k];
      const letter = rawLetter.toLowerCase();
      if (k === randomVowelPos) {
        blankSeq += 1;
        const id = `b${blankSeq}`;
        blankMeta[id] = { correctLetter: letter };
        tokens.push({ kind: "blank", id, correctLetter: letter });
      } else {
        tokens.push({ kind: "text", value: rawLetter });
      }
    }

    i = j;
  }

  return { tokens, blankMeta };
}

function buildInitialBlankState(blankMeta: Record<string, { correctLetter: string }>) {
  const state: Record<string, BlankState> = {};
  for (const id of Object.keys(blankMeta)) {
    state[id] = { filledLetter: null, locked: false, flash: null };
  }
  return state;
}

function TaskBody({
  task,
  taskModel,
  onCorrect,
  onIncorrect,
}: {
  task: { id: number; letters: string[]; heading?: string };
  taskModel: ReturnType<typeof tokenizeTextWithVowelBlanks>;
  onCorrect: () => void;
  onIncorrect: () => void;
}) {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [blanks, setBlanks] = useState<Record<string, BlankState>>(() =>
    buildInitialBlankState(taskModel.blankMeta),
  );

  function scheduleFlashClear(blankId: string) {
    window.setTimeout(() => {
      setBlanks((prev) => {
        const current = prev[blankId];
        if (!current) return prev;
        return { ...prev, [blankId]: { ...current, flash: null } };
      });
    }, 1000);
  }

  function handleBlankClick(blankId: string) {
    if (!selectedLetter) return;
    if (blanks[blankId]?.locked) return;

    const blankMeta = taskModel.blankMeta[blankId];
    if (!blankMeta) return;

    const isCorrect = blankMeta.correctLetter === selectedLetter;
    if (isCorrect) onCorrect();
    else onIncorrect();

    setBlanks((prev) => ({
      ...prev,
      [blankId]: {
        filledLetter: isCorrect ? selectedLetter : null,
        locked: isCorrect,
        flash: isCorrect ? "correct" : "incorrect",
      },
    }));

    scheduleFlashClear(blankId);
    setSelectedLetter(null);
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow md:p-8">
      <h2 className="mb-6 text-center text-2xl font-semibold">
        Вставьте пропущенные буквы
      </h2>

      <div className="mb-8 flex flex-wrap justify-center gap-3">
        {task.letters.map((letter) => {
          const isSelected = selectedLetter === letter;
          return (
            <button
              key={letter}
              type="button"
              onClick={() => setSelectedLetter(letter)}
              className={[
                "min-w-[64px] rounded-xl border-2 px-4 py-3 text-xl font-bold transition-colors duration-200",
                isSelected
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 hover:border-indigo-400",
              ].join(" ")}
            >
              {letter}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-lg leading-relaxed">
        {task.heading ? (
          <h3 className="mb-4 text-center text-xl font-bold tracking-wide text-slate-800">
            {task.heading}
          </h3>
        ) : null}
        {taskModel.tokens.map((token, idx) => {
          if (token.kind === "text") {
            return <span key={`t${idx}`}>{token.value}</span>;
          }

          const state = blanks[token.id];
          const isLocked = Boolean(state?.locked);
          const flash = state?.flash;
          const hasFilledLetter = Boolean(state?.filledLetter);

          const className = [
            "inline-flex items-center justify-center rounded-lg border-2 p-0 font-bold transition-colors duration-200",
            hasFilledLetter ? "" : "min-w-[30px]",
            isLocked ? "cursor-default" : "cursor-pointer",
            flash === "correct" ? "border-green-500 bg-green-100" : "",
            flash === "incorrect" ? "border-red-500 bg-red-50" : "",
            !flash ? "border-gray-300 bg-white hover:border-indigo-400" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={token.id}
              type="button"
              onClick={() => {
                if (isLocked) return;
                handleBlankClick(token.id);
              }}
              disabled={isLocked}
              className={className}
              aria-label="Пропуск"
            >
              {state?.filledLetter ?? "..."}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Test21Main({ config, onComplete }: TestComponentProps) {
  const vowelSet = useMemo(() => createVowelSet(VOWEL_LETTERS), []);

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const startedAtRef = useRef<string>(new Date().toISOString());
  const completedRef = useRef(false);

  const currentTask = tasks[currentTaskIndex];

  const taskModel = useMemo(() => {
    if (!currentTask) return null;
    return tokenizeTextWithVowelBlanks(currentTask.text, vowelSet);
  }, [currentTask, vowelSet]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

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

  if (!currentTask || !taskModel) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
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

        <TaskBody
          key={currentTaskIndex}
          task={currentTask}
          taskModel={taskModel}
          onCorrect={() => setCorrectCount((c) => c + 1)}
          onIncorrect={() => setIncorrectCount((c) => c + 1)}
        />
      </div>
    </div>
  );
}

