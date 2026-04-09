"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TestComponentProps } from "../shared/TestInterface";
import { categories } from "./tasks-data";

type PhraseUiState = {
  filledPreposition: string | null;
  locked: boolean;
  status: "idle" | "correct" | "error";
};

type PrepositionOption = {
  id: string;
  label: string;
  phraseId: string;
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

function buildInitialPhraseState(phraseIds: string[]) {
  const state: Record<string, PhraseUiState> = {};
  for (const id of phraseIds) {
    state[id] = { filledPreposition: null, locked: false, status: "idle" };
  }
  return state;
}

function buildPrepositionOptionsForTask(task: { phrases: { id: string; correctPreposition: string }[] }) {
  const options: PrepositionOption[] = task.phrases.map((p) => ({
    id: `opt-${p.id}`,
    label: p.correctPreposition,
    phraseId: p.id,
  }));
  return shuffle(options);
}

function TaskBody({
  categoryId,
  task,
  onTaskCompleted,
  onCorrectTask,
  onIncorrectTask,
}: {
  categoryId: string;
  task: { id: number; phrases: { id: string; before: string; after: string; correctPreposition: string }[] };
  onTaskCompleted: () => void;
  onCorrectTask: () => void;
  onIncorrectTask: () => void;
}) {
  const [phraseState, setPhraseState] = useState<Record<string, PhraseUiState>>(() =>
    buildInitialPhraseState(task.phrases.map((p) => p.id)),
  );
  const [prepositionOptions, setPrepositionOptions] = useState<PrepositionOption[]>(() =>
    buildPrepositionOptionsForTask(task),
  );
  const [selectedPrepositionOptionId, setSelectedPrepositionOptionId] = useState<string | null>(null);
  const [selectedBlankPhraseId, setSelectedBlankPhraseId] = useState<string | null>(null);
  const [taskHadError, setTaskHadError] = useState(false);
  const taskHadErrorRef = useRef(false);
  taskHadErrorRef.current = taskHadError;

  const onCorrectTaskRef = useRef(onCorrectTask);
  const onIncorrectTaskRef = useRef(onIncorrectTask);
  const onTaskCompletedRef = useRef(onTaskCompleted);
  onCorrectTaskRef.current = onCorrectTask;
  onIncorrectTaskRef.current = onIncorrectTask;
  onTaskCompletedRef.current = onTaskCompleted;

  const selectedPrepositionOption = useMemo(() => {
    if (!selectedPrepositionOptionId) return null;
    return prepositionOptions.find((o) => o.id === selectedPrepositionOptionId) || null;
  }, [prepositionOptions, selectedPrepositionOptionId]);

  const isAwaitingBlankClick = selectedPrepositionOption !== null;
  const isAwaitingPrepositionClick = selectedBlankPhraseId !== null;

  function resetSelections() {
    setSelectedPrepositionOptionId(null);
    setSelectedBlankPhraseId(null);
  }

  function flashError(phraseId: string) {
    setPhraseState((prev) => ({
      ...prev,
      [phraseId]: { ...prev[phraseId], status: "error" },
    }));

    window.setTimeout(() => {
      setPhraseState((prev) => ({
        ...prev,
        [phraseId]: { ...prev[phraseId], status: "idle" },
      }));
      resetSelections();
    }, 500);
  }

  function commitCorrectMatch(phraseId: string, option: PrepositionOption) {
    setSelectedPrepositionOptionId(null);
    setSelectedBlankPhraseId(null);
    setPhraseState((prev) => ({
      ...prev,
      [phraseId]: {
        filledPreposition: option.label,
        locked: true,
        status: "correct",
      },
    }));
  }

  /** Завершение задания — только по актуальному phraseState (без побочных эффектов внутри setState-updater). */
  const taskStableKey = `${categoryId}-${task.id}`;
  // task в замыкании; taskStableKey меняется при смене задания. Колбэки через ref — иначе deps с onTaskCompleted сбрасывали бы таймер каждый рендер родителя (тик секунд).
  useEffect(() => {
    const allFilled = task.phrases.every((p) => phraseState[p.id]?.locked);
    if (!allFilled) return;

    const timer = window.setTimeout(() => {
      if (taskHadErrorRef.current) onIncorrectTaskRef.current();
      else onCorrectTaskRef.current();
      onTaskCompletedRef.current();
    }, 400);

    return () => clearTimeout(timer);
  }, [phraseState, taskStableKey]);

  function handlePrepositionClick(optionId: string) {
    const option = prepositionOptions.find((o) => o.id === optionId);
    if (!option || phraseState[option.phraseId]?.locked) return;

    if (selectedBlankPhraseId) {
      const phraseId = selectedBlankPhraseId;
      const phrase = task.phrases.find((p) => p.id === phraseId);
      if (!phrase) return;

      const isCorrect = phrase.id === option.phraseId;
      if (!isCorrect) {
        setTaskHadError(true);
        flashError(phraseId);
        return;
      }

      commitCorrectMatch(phraseId, option);
      return;
    }

    setSelectedPrepositionOptionId(option.id);
    setSelectedBlankPhraseId(null);
  }

  function handleBlankClick(phraseId: string) {
    if (phraseState[phraseId]?.locked) return;

    if (selectedPrepositionOption) {
      const option = selectedPrepositionOption;
      const phrase = task.phrases.find((p) => p.id === phraseId);
      if (!phrase) return;

      const isCorrect = phrase.id === option.phraseId;
      if (!isCorrect) {
        setTaskHadError(true);
        flashError(phraseId);
        return;
      }

      commitCorrectMatch(phraseId, option);
      return;
    }

    setSelectedBlankPhraseId(phraseId);
    setSelectedPrepositionOptionId(null);
  }

  const highlightedBlanks = isAwaitingBlankClick;
  const highlightedPrepositions = isAwaitingPrepositionClick;

  return (
    <div className="rounded-xl bg-white p-6 shadow md:p-8">
      <h2 className="mb-6 text-center text-2xl font-semibold">Вставьте предлоги</h2>

      <div className="mb-8 flex flex-wrap justify-center gap-3">
        {prepositionOptions.map((opt) => {
          const isSelected = selectedPrepositionOptionId === opt.id;
          const isUsed = Boolean(phraseState[opt.phraseId]?.locked);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handlePrepositionClick(opt.id)}
              disabled={isUsed}
              className={[
                "min-w-[64px] rounded-xl border-2 px-4 py-3 text-xl font-bold transition-colors duration-200",
                isUsed ? "cursor-not-allowed opacity-30" : "",
                isSelected ? "border-green-500 bg-green-50" : "",
                highlightedPrepositions && !isUsed && !isSelected
                  ? "border-green-500 bg-green-50"
                  : "",
                !isUsed && !isSelected && !highlightedPrepositions
                  ? "border-gray-300 hover:border-indigo-400"
                  : "",
              ].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {task.phrases.map((phrase) => {
          const state = phraseState[phrase.id];
          const isLocked = Boolean(state?.locked);
          const isError = state?.status === "error";
          const isCorrect = state?.status === "correct" && isLocked;
          const isBlankSelected = selectedBlankPhraseId === phrase.id;

          const phraseClassName = [
            "rounded-xl border-2 p-4 transition-colors duration-200",
            isCorrect ? "border-green-500 bg-green-50" : "",
            isError ? "border-red-500 bg-red-50" : "",
            !isCorrect && !isError ? "border-gray-200 bg-white" : "",
          ]
            .filter(Boolean)
            .join(" ");

          const blankClassName = [
            "inline-flex items-center justify-center rounded-lg border-2 p-0 font-bold transition-colors duration-200",
            isLocked ? "cursor-default" : "cursor-pointer",
            isBlankSelected ? "border-green-500 bg-green-50" : "",
            highlightedBlanks && !isLocked && !isBlankSelected ? "border-green-500 bg-green-50" : "",
            !highlightedBlanks && !isBlankSelected && !isLocked
              ? "border-gray-300 bg-white hover:border-indigo-400"
              : "",
            "min-w-[30px]",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={phrase.id} className={phraseClassName}>
              <div className="flex flex-wrap items-center gap-2 text-lg">
                <span>{phrase.before}</span>
                <button
                  type="button"
                  onClick={() => handleBlankClick(phrase.id)}
                  disabled={isLocked}
                  className={blankClassName}
                  aria-label="Пропуск предлога"
                >
                  {state?.filledPreposition ?? "___"}
                </button>
                <span>{phrase.after}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* intentionally empty footer */}
    </div>
  );
}

export default function Test22Main({ config, onComplete }: TestComponentProps) {
  const [currentCategoryId, setCurrentCategoryId] = useState(categories[0]?.id ?? "");
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const startedAtRef = useRef<string>(new Date().toISOString());
  const completedRef = useRef(false);

  const currentCategory = useMemo(() => {
    return categories.find((c) => c.id === currentCategoryId) || categories[0] || null;
  }, [currentCategoryId]);

  const currentTask = currentCategory?.tasks[currentTaskIndex] || null;

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

  function handleCategoryChange(newCategoryId: string) {
    setCurrentCategoryId(newCategoryId);
    setCurrentTaskIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
  }

  function handleTaskCompleted() {
    if (!currentCategory) return;
    if (currentTaskIndex < currentCategory.tasks.length - 1) {
      setCurrentTaskIndex((i) => i + 1);
      return;
    }
    finishTest();
  }

  if (!currentCategory || !currentTask) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={currentCategoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              aria-label="Выбор категории"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <div className="text-lg font-semibold">
              Задание {currentTask.id} из {currentCategory.tasks.length}
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
          key={`${currentCategoryId}-${currentTaskIndex}`}
          categoryId={currentCategory.id}
          task={currentTask}
          onCorrectTask={() => setCorrectCount((c) => c + 1)}
          onIncorrectTask={() => setIncorrectCount((c) => c + 1)}
          onTaskCompleted={handleTaskCompleted}
        />
      </div>
    </div>
  );
}

