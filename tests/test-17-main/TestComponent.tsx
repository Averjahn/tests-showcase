"use client";

import { useState, useEffect, useRef } from "react";
import type { TestComponentProps } from "../shared/TestInterface";
import { tasks } from "./tasks-data";

function formatTime(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function Test17Main({ config, onComplete }: TestComponentProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [selectedSyllable, setSelectedSyllable] = useState<string | null>(null);
  const [selectedBlankIndex, setSelectedBlankIndex] = useState<number | null>(null);
  const [filledBlanks, setFilledBlanks] = useState<(string | null)[]>([]);
  const [correctWords, setCorrectWords] = useState<boolean[]>([]);
  const [errorFlash, setErrorFlash] = useState<{ syllable?: boolean; blank?: number } | null>(
    null,
  );
  const [correctCount, setCorrectCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [taskHadError, setTaskHadError] = useState(false);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const completedRef = useRef(false);

  const currentTask = tasks[currentTaskIndex];

  useEffect(() => {
    if (currentTask) {
      const wordCount = currentTask.words.length;
      setFilledBlanks(Array(wordCount).fill(null));
      setCorrectWords(Array(wordCount).fill(false));
      setSelectedSyllable(null);
      setSelectedBlankIndex(null);
      setTaskHadError(false);
    }
  }, [currentTask]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const checkMatch = (syllable: string, blankIndex: number) => {
    if (!currentTask) return;
    const isCorrect = currentTask.words[blankIndex].correctSyllable === syllable;
    if (isCorrect) {
      const newFilled = [...filledBlanks];
      newFilled[blankIndex] = syllable;
      setFilledBlanks(newFilled);
      const newCorrect = [...correctWords];
      newCorrect[blankIndex] = true;
      setCorrectWords(newCorrect);
      setSelectedSyllable(null);
      setSelectedBlankIndex(null);
      if (newFilled.every((b) => b !== null)) {
        setTimeout(() => {
          if (taskHadError) setErrorCount((c) => c + 1);
          else setCorrectCount((c) => c + 1);
          if (currentTaskIndex < tasks.length - 1) {
            setCurrentTaskIndex((i) => i + 1);
          } else {
            if (completedRef.current) return;
            completedRef.current = true;
            const finalCorrect = taskHadError ? correctCount : correctCount + 1;
            const finalIncorrect = taskHadError ? errorCount + 1 : errorCount;
            onComplete({
              testId: config.id,
              answers: [],
              totalTime: seconds * 1000,
              correctCount: finalCorrect,
              incorrectCount: finalIncorrect,
              startedAt: startedAtRef.current,
              completedAt: new Date().toISOString(),
            });
          }
        }, 1000);
      }
    } else {
      setTaskHadError(true);
      setErrorFlash({ syllable: true, blank: blankIndex });
      setTimeout(() => {
        setErrorFlash(null);
        setSelectedSyllable(null);
        setSelectedBlankIndex(null);
      }, 1000);
    }
  };

  const handleSyllableClick = (syllable: string) => {
    if (selectedBlankIndex !== null) checkMatch(syllable, selectedBlankIndex);
    else setSelectedSyllable(syllable);
  };

  const handleBlankClick = (index: number) => {
    if (filledBlanks[index]) return;
    if (selectedSyllable) checkMatch(selectedSyllable, index);
    else setSelectedBlankIndex(index);
  };

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete({
      testId: config.id,
      answers: [],
      totalTime: seconds * 1000,
      correctCount,
      incorrectCount: errorCount,
      startedAt: startedAtRef.current,
      completedAt: new Date().toISOString(),
    });
  };

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
            <span className="font-semibold text-red-600">✗ {errorCount}</span>
            <span className="font-mono">{formatTime(seconds)}</span>
            <button
              type="button"
              onClick={handleFinish}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              Завершить тест
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow md:p-8">
          <h2 className="mb-6 text-center text-2xl font-semibold">Вставьте слоги</h2>
          <div className="mb-8 flex flex-wrap justify-center gap-4">
            {currentTask.syllables.map((syl) => {
              const isUsed = filledBlanks.includes(syl);
              const isSelected = selectedSyllable === syl;
              const hasError = errorFlash?.syllable && selectedSyllable === syl;
              const highlight = selectedBlankIndex !== null && !isUsed;
              return (
                <button
                  key={syl}
                  type="button"
                  onClick={() => !isUsed && handleSyllableClick(syl)}
                  disabled={isUsed}
                  className={`min-w-[100px] rounded-xl border-2 px-6 py-4 text-xl font-bold ${
                    isUsed ? "cursor-not-allowed opacity-30" : ""
                  } ${(isSelected || highlight) ? "border-green-500 bg-green-50" : ""} ${
                    hasError ? "border-red-500 bg-red-50" : ""
                  } ${
                    !isUsed && !isSelected && !hasError && !highlight
                      ? "border-gray-300 hover:border-indigo-400"
                      : ""
                  }`}
                >
                  {syl}
                </button>
              );
            })}
          </div>
          <div className="space-y-4">
            {currentTask.words.map((word, idx) => {
              const isCorrect = correctWords[idx];
              const hasError = errorFlash?.blank === idx;
              const highlight = selectedSyllable !== null && filledBlanks[idx] === null;
              return (
                <div
                  key={idx}
                  className={`rounded-xl border-2 p-4 ${
                    isCorrect ? "border-green-500 bg-green-50" : ""
                  } ${hasError ? "border-red-500 bg-red-50" : ""} ${
                    !isCorrect && !hasError ? "border-gray-200" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-lg">
                    <span>{word.text.split("__")[0]}</span>
                    <button
                      type="button"
                      onClick={() => handleBlankClick(idx)}
                      disabled={filledBlanks[idx] !== null}
                      className={`min-w-[80px] rounded-xl border-2 px-4 py-2 font-bold ${
                        (selectedBlankIndex === idx || highlight)
                          ? "border-green-500 bg-green-50"
                          : ""
                      } ${filledBlanks[idx] !== null ? "border-green-500 bg-green-100" : ""} ${
                        hasError ? "border-red-500 bg-red-50" : ""
                      } ${
                        filledBlanks[idx] === null && !hasError && !highlight
                          ? "border-gray-300 hover:border-indigo-400"
                          : ""
                      }`}
                    >
                      {filledBlanks[idx] ?? "__"}
                    </button>
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

