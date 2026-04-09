"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TestComponentProps } from "../shared/TestInterface";
import { tasks } from "./tasks-data";

type RowModel = {
  word: string;
  letters: string[];
  targetIndexes: Set<number>;
};

type RowUiState = {
  selectedIndexes: Set<number>;
  status: "idle" | "done" | "error";
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

function randomRussianLetter() {
  const alphabet = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
  return alphabet[Math.floor(Math.random() * alphabet.length)];
}

function buildRowModel(word: string, maxLen = 20): RowModel {
  const normalizedWord = word.toLowerCase();
  const wordLetters = Array.from(normalizedWord);
  const maxExtras = Math.max(0, maxLen - wordLetters.length);

  // Добавляем случайное количество букв (но не превышаем maxLen)
  const extrasCount = Math.max(0, Math.min(maxExtras, Math.floor(maxExtras * 0.7)));
  const extras = new Array(extrasCount).fill(null).map(() => randomRussianLetter());

  const shuffledExtras = shuffle(extras);
  const insertPos = Math.floor(Math.random() * (shuffledExtras.length + 1));
  const letters = [
    ...shuffledExtras.slice(0, insertPos),
    ...wordLetters,
    ...shuffledExtras.slice(insertPos),
  ];

  const targetIndexes = new Set<number>();
  for (let i = 0; i < wordLetters.length; i += 1) targetIndexes.add(insertPos + i);

  return {
    word: normalizedWord,
    letters,
    targetIndexes,
  };
}

function isSelectionCorrect(selected: Set<number>, target: Set<number>) {
  if (selected.size !== target.size) return false;
  for (const idx of target) if (!selected.has(idx)) return false;
  return true;
}

function createInitialRowUiState(rows: RowModel[]): Record<number, RowUiState> {
  const state: Record<number, RowUiState> = {};
  for (let i = 0; i < rows.length; i += 1) {
    state[i] = { selectedIndexes: new Set<number>(), status: "idle" };
  }
  return state;
}

function TaskBody({
  rows,
  onRowCorrect,
  onRowIncorrect,
  onAllRowsCompleted,
}: {
  rows: RowModel[];
  onRowCorrect: () => void;
  onRowIncorrect: () => void;
  onAllRowsCompleted: () => void;
}) {
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [rowStateByIndex, setRowStateByIndex] = useState<Record<number, RowUiState>>(() =>
    createInitialRowUiState(rows),
  );

  const onRowCorrectRef = useRef(onRowCorrect);
  const onRowIncorrectRef = useRef(onRowIncorrect);
  const onAllRowsCompletedRef = useRef(onAllRowsCompleted);
  onRowCorrectRef.current = onRowCorrect;
  onRowIncorrectRef.current = onRowIncorrect;
  onAllRowsCompletedRef.current = onAllRowsCompleted;

  function clearSelection(rowIndex: number) {
    setRowStateByIndex((prev) => ({
      ...prev,
      [rowIndex]: { ...prev[rowIndex], selectedIndexes: new Set<number>() },
    }));
  }

  function flashRowError(rowIndex: number) {
    setRowStateByIndex((prev) => ({
      ...prev,
      [rowIndex]: { ...prev[rowIndex], status: "error" },
    }));
    window.setTimeout(() => {
      setRowStateByIndex((prev) => ({
        ...prev,
        [rowIndex]: { ...prev[rowIndex], status: "idle" },
      }));
    }, 500);
  }

  function toggleLetter(rowIndex: number, letterIndex: number) {
    if (rowIndex !== activeRowIndex) return;
    const current = rowStateByIndex[rowIndex];
    if (!current || current.status === "done") return;

    setRowStateByIndex((prev) => {
      const row = prev[rowIndex];
      const nextSelected = new Set(row.selectedIndexes);
      if (nextSelected.has(letterIndex)) nextSelected.delete(letterIndex);
      else nextSelected.add(letterIndex);
      return { ...prev, [rowIndex]: { ...row, selectedIndexes: nextSelected } };
    });
  }

  function handleDone(rowIndex: number) {
    if (rowIndex !== activeRowIndex) return;
    const model = rows[rowIndex];
    const state = rowStateByIndex[rowIndex];
    if (!model || !state) return;

    const correct = isSelectionCorrect(state.selectedIndexes, model.targetIndexes);
    if (!correct) {
      onRowIncorrectRef.current();
      clearSelection(rowIndex);
      flashRowError(rowIndex);
      return;
    }

    onRowCorrectRef.current();
    setRowStateByIndex((prev) => ({
      ...prev,
      [rowIndex]: { ...prev[rowIndex], status: "done" },
    }));

    if (rowIndex < rows.length - 1) {
      setActiveRowIndex(rowIndex + 1);
    } else {
      window.setTimeout(() => {
        onAllRowsCompletedRef.current();
      }, 350);
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow md:p-8">
      <h2 className="mb-6 text-center text-2xl font-semibold">
        Найдите слова на букву М среди букв
      </h2>

      <div className="space-y-3">
        {rows.map((row, rowIndex) => {
          const ui = rowStateByIndex[rowIndex];
          const isActive = rowIndex === activeRowIndex;
          const isDone = ui?.status === "done";
          const isError = ui?.status === "error";
          const isBlocked = !isActive || isDone;

          const rowClassName = [
            "flex items-center justify-between gap-3 rounded-xl border-2 px-3 py-2 transition-colors duration-200",
            isDone ? "border-green-500 bg-green-50" : "",
            isError ? "border-red-500 bg-red-50" : "",
            !isDone && !isError ? "border-gray-200 bg-white" : "",
            !isActive && !isDone ? "opacity-40" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={`${row.word}-${rowIndex}`} className={rowClassName}>
              <div className="flex flex-wrap items-center gap-2">
                {row.letters.map((letter, letterIndex) => {
                  const selected = ui?.selectedIndexes?.has(letterIndex) ?? false;
                  const letterBtnClass = [
                    "h-9 w-9 rounded-lg border-2 text-sm font-bold transition-colors duration-200",
                    isBlocked ? "cursor-not-allowed" : "cursor-pointer",
                    selected ? "border-blue-500 bg-blue-500 text-white" : "",
                    !selected ? "border-gray-300 bg-white hover:border-indigo-400" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <button
                      key={`${rowIndex}-${letterIndex}`}
                      type="button"
                      onClick={() => toggleLetter(rowIndex, letterIndex)}
                      disabled={isBlocked}
                      className={letterBtnClass}
                      aria-label={`Буква ${letter}`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => handleDone(rowIndex)}
                disabled={!isActive || isDone}
                className={[
                  "rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200",
                  isActive && !isDone
                    ? "bg-gray-800 text-white hover:bg-gray-900"
                    : "cursor-not-allowed bg-gray-200 text-gray-500",
                ].join(" ")}
              >
                ✓ Готово
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Test23Main({ config, onComplete }: TestComponentProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const startedAtRef = useRef<string>(new Date().toISOString());
  const completedRef = useRef(false);

  const currentTask = tasks[currentTaskIndex];

  const rows = useMemo(() => {
    if (!currentTask) return [];
    return currentTask.words.map((w) => buildRowModel(w, 20));
  }, [currentTask]);

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

  function handleAllRowsCompleted() {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex((i) => i + 1);
      return;
    }
    finishTest();
  }

  if (!currentTask) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow">
          <div className="text-lg font-semibold">
            Задание {currentTask.id} из {tasks.length}
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
          rows={rows}
          onRowCorrect={() => setCorrectCount((c) => c + 1)}
          onRowIncorrect={() => setIncorrectCount((c) => c + 1)}
          onAllRowsCompleted={handleAllRowsCompleted}
        />
      </div>
    </div>
  );
}

