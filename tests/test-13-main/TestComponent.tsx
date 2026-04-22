"use client";

import { useState, useEffect, useRef } from "react";
import type { TestComponentProps, TestResult } from "../shared/TestInterface";
import { TASKS, VOWELS } from "./tasks-data";

const level = 1;
const tasks = TASKS[level] ?? [];
const wordsToShow = 2;

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function Test13Main({ config, onComplete }: TestComponentProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState<{ wordIndex: number; letterIndex: number } | null>(null);
  const [selectedVowel, setSelectedVowel] = useState<string | null>(null);
  const [correctedWords, setCorrectedWords] = useState<string[]>([]);
  const [wordStates, setWordStates] = useState<("normal" | "correct" | "incorrect")[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [readyToProceed, setReadyToProceed] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const startedAtIsoRef = useRef<string>("");
  const elapsedMsRef = useRef<number>(0);
  const completedRef = useRef(false);

  const currentTask = tasks[currentTaskIndex];

  useEffect(() => {
    if (!currentTask) return;
    setCorrectedWords([...currentTask.incorrect]);
    setWordStates(new Array(wordsToShow).fill("normal"));
    setSelectedLetter(null);
    setSelectedVowel(null);
    setShowSuccess(false);
    setReadyToProceed(false);
  }, [currentTaskIndex, currentTask]);

  useEffect(() => {
    startedAtIsoRef.current = new Date().toISOString();
    elapsedMsRef.current = 0;

    const t = window.setInterval(() => {
      elapsedMsRef.current += 100;
      setElapsedMs(elapsedMsRef.current);
    }, 100);
    return () => window.clearInterval(t);
  }, []);

  const applyAttempt = (wordIndex: number, letterIndex: number, chosenVowel: string) => {
    const currentWord = correctedWords[wordIndex];
    const incorrectLetter = currentWord[letterIndex];
    const correctLetter = currentTask.corrections[incorrectLetter];
    if (chosenVowel === correctLetter) {
      const newCorrected = [...correctedWords];
      newCorrected[wordIndex] = currentWord.split("").map((char, idx) => (idx === letterIndex ? chosenVowel : char)).join("");
      setCorrectedWords(newCorrected);
      setCorrectAnswers((c) => c + 1);
      const newStates = [...wordStates];
      newStates[wordIndex] = "correct";
      setWordStates(newStates);
      const allCorrect = newCorrected.every((w, i) => w === currentTask.words[i]);
      if (allCorrect) {
        setShowSuccess(true);
        window.setTimeout(() => {
          setShowSuccess(false);
          setReadyToProceed(true);
        }, 900);
      }
    } else {
      setIncorrectAnswers((c) => c + 1);
      const newStates = [...wordStates];
      newStates[wordIndex] = "incorrect";
      setWordStates(newStates);
      setTimeout(() => {
        setWordStates((s) => s.map((v, i) => (i === wordIndex ? "normal" : v)));
      }, 1000);
    }
    setSelectedLetter(null);
    setSelectedVowel(null);
  };

  const handleLetterClick = (wordIndex: number, letterIndex: number) => {
    const letter = correctedWords[wordIndex]?.[letterIndex];
    const isIncorrect = !!currentTask?.corrections[letter];
    if (selectedVowel) {
      if (isIncorrect) applyAttempt(wordIndex, letterIndex, selectedVowel);
      else setSelectedVowel(null);
    } else {
      if (isIncorrect) setSelectedLetter({ wordIndex, letterIndex });
      else setSelectedLetter(null);
    }
  };

  const handleVowelClick = (vowel: string) => {
    if (selectedLetter) applyAttempt(selectedLetter.wordIndex, selectedLetter.letterIndex, vowel);
    else setSelectedVowel(vowel);
  };

  const finishTest = () => {
    if (completedRef.current) return;
    completedRef.current = true;

    const completedAt = new Date().toISOString();
    const startedAt = startedAtIsoRef.current || new Date().toISOString();

    const result: TestResult = {
      testId: config.id,
      answers: [],
      totalTime: elapsedMsRef.current,
      correctCount: correctAnswers,
      incorrectCount: incorrectAnswers,
      startedAt,
      completedAt,
    };

    onComplete(result);
  };

  const handleNextTask = () => {
    if (currentTaskIndex >= tasks.length - 1) return;
    setCurrentTaskIndex((i) => i + 1);
  };

  if (isCompleted) {
    return (
      <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
        <div className="flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Упражнение завершено!</h2>
            <p className="text-gray-600 mb-4">
              Верных: {correctAnswers} · Неверных: {incorrectAnswers} · Время: {formatTime(elapsedMs)}
            </p>
            <button type="button" onClick={finishTest} className="rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700">
              Завершить тест
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentTask) return null;

  const isVowelPanelVisible = selectedLetter !== null || selectedVowel !== null;
  const isLastTask = currentTaskIndex === tasks.length - 1;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header (UI and behavior aligned with test-02-main) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow">
          <div className="w-full text-xl font-bold text-slate-900">
            {typeof config.seqNum === "number" ? `${config.seqNum}. ` : ""}
            {config.name}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={currentTaskIndex}
              onChange={(e) => setCurrentTaskIndex(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              aria-label="Выбор задания"
            >
              {tasks.map((_, idx) => (
                <option key={idx} value={idx}>
                  Задание {idx + 1}
                </option>
              ))}
            </select>
            <div className="text-lg font-semibold">
              Задание {currentTaskIndex + 1} из {tasks.length}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-semibold text-green-600">✓ {correctAnswers}</span>
            <span className="font-semibold text-red-600">✗ {incorrectAnswers}</span>
            <span className="font-mono">{formatTime(elapsedMs)}</span>
            <button type="button" onClick={finishTest} className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
              Завершить тест
            </button>
          </div>
        </div>

      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 28, fontWeight: 500, color: "#0f172a", lineHeight: 1.1 }}>ИСПРАВИТЬ ОШИБКУ</div>
        <div style={{ marginTop: 6, fontSize: 16, fontWeight: 600, color: "#334155" }}>Исправьте ошибку в слове</div>
      </div>
      

      <div>
        <div className="flex gap-8 flex-wrap">
          <div className="flex-1 min-w-[280px]">
            <div className="flex w-full gap-8 mb-8">
              {currentTask.words.slice(0, wordsToShow).map((word, wordIndex) => (
                <div key={wordIndex} className="flex-1 min-w-[220px] flex flex-col">
                  <div className="flex-1 rounded-lg shadow-md bg-gray-100 overflow-hidden">
                    <img
                      src={currentTask.images[wordIndex] || "/placeholder.svg"}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-4 flex justify-center">
                    {wordStates[wordIndex] === "correct" ? (
                      <div className="inline-flex h-16 w-full max-w-[420px] items-center justify-center rounded-2xl border-2 border-green-500 bg-green-50 px-6">
                        <span className="text-4xl font-medium tracking-[0.35em] text-slate-900">
                          {correctedWords[wordIndex]?.split("").join(" ") ?? ""}
                        </span>
                      </div>
                    ) : (
                      <div
                        className={[
                          "inline-flex h-16 w-full max-w-[420px] items-center justify-center overflow-hidden rounded-2xl border-2 px-6",
                          "gap-1 bg-transparent",
                          wordStates[wordIndex] === "incorrect" ? "border-red-500" : "",
                          wordStates[wordIndex] === "normal" ? "border-sky-400" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {correctedWords[wordIndex]?.split("").map((letter, letterIndex) => {
                          const isIncorrect = !!currentTask.corrections[letter];
                          const isSelected =
                            selectedLetter?.wordIndex === wordIndex && selectedLetter?.letterIndex === letterIndex;
                          return (
                            <button
                              key={letterIndex}
                              type="button"
                              onClick={() => handleLetterClick(wordIndex, letterIndex)}
                              className={[
                                "h-full w-12 select-none text-4xl font-medium text-slate-900",
                                "flex items-center justify-center",
                                isSelected ? "bg-sky-100" : "bg-rose-50",
                                isIncorrect ? "cursor-pointer" : "cursor-default",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              {letter}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-48">
            <div className={`p-4 rounded-xl border-2 ${isVowelPanelVisible ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200" : "border-gray-200 bg-white"}`}>
              <h3 className="font-medium mb-4 text-center">Гласные</h3>
              <div className="grid grid-cols-2 gap-2">
                {VOWELS.map((v) => (
                  <button key={v} type="button" onClick={() => handleVowelClick(v)} className={`h-10 rounded border font-bold ${selectedVowel === v ? "ring-2 ring-purple-500 bg-purple-100" : "border-gray-300 hover:bg-gray-50"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {showSuccess && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-full p-8">✓</div>
          </div>
        )}
      </div>

      {readyToProceed && (
        <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            onClick={isLastTask ? finishTest : handleNextTask}
            style={{
              height: 46,
              minWidth: 220,
              padding: "0 28px",
              borderRadius: 16,
              background: "#7dd3fc",
              color: "#ffffff",
              fontWeight: 500,
              fontSize: 32,
              lineHeight: 1,
              border: "0",
            }}
          >
            {isLastTask ? "Завершить" : "Дальше >"}
          </button>
        </div>
      )}
    </div>
  );
}
