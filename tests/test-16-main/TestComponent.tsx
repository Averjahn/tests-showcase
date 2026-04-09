"use client";

import { useState, useEffect, useRef } from "react";
import type { TestComponentProps, TestResult } from "../shared/TestInterface";
import { tasks } from "./tasks-data";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function Test16Main({ config, onComplete }: TestComponentProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isCorrectStatement, setIsCorrectStatement] = useState(true);
  const [showFeedback, setShowFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [showVerbChoices, setShowVerbChoices] = useState(false);
  const [difficulty, setDifficulty] = useState("1");
  const startedAtRef = useRef<string>(new Date().toISOString());
  const completedRef = useRef(false);

  const currentTask = tasks[currentTaskIndex];

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const moveToNextTask = () => {
    setTimeout(() => {
      setShowFeedback(null);
      if (currentTaskIndex < tasks.length - 1) {
        setCurrentTaskIndex((prev) => prev + 1);
        setIsCorrectStatement(Math.random() > 0.5);
      } else {
        setCurrentTaskIndex(0);
        setIsCorrectStatement(Math.random() > 0.5);
      }
    }, 1000);
  };

  const handleAnswer = (userSaysYes: boolean) => {
    const isCorrectAnswer =
      (userSaysYes && isCorrectStatement) || (!userSaysYes && !isCorrectStatement);
    if (difficulty === "2" && isCorrectAnswer && !userSaysYes) {
      setShowVerbChoices(true);
      return;
    }
    if (isCorrectAnswer) setCorrectCount((c) => c + 1);
    else setIncorrectCount((c) => c + 1);
    setShowFeedback(isCorrectAnswer ? "correct" : "incorrect");
    moveToNextTask();
  };

  const handleVerbChoice = (selectedVerb: string) => {
    const isCorrect = selectedVerb === currentTask.correctAction;
    if (isCorrect) setCorrectCount((c) => c + 1);
    else setIncorrectCount((c) => c + 1);
    setShowFeedback(isCorrect ? "correct" : "incorrect");
    setShowVerbChoices(false);
    moveToNextTask();
  };

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    const result: TestResult = {
      testId: config.id,
      answers: [],
      totalTime: seconds * 1000,
      correctCount,
      incorrectCount,
      startedAt: startedAtRef.current,
      completedAt: new Date().toISOString(),
    };
    onComplete(result);
  };

  const playAudio = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const text = showVerbChoices
      ? currentTask.subject
      : isCorrectStatement
        ? `${currentTask.subject} ${currentTask.correctAction}`
        : `${currentTask.subject} ${currentTask.incorrectAction}`;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ru-RU";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  if (!currentTask) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-lg">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          >
            <option value="1">Сложность 1</option>
            <option value="2">Сложность 2</option>
          </select>
          <div className="text-lg font-semibold">Задание: {currentTaskIndex + 1} / {tasks.length}</div>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-green-600">✓ {correctCount}</span>
            <span className="font-semibold text-red-600">✗ {incorrectCount}</span>
            <span className="min-w-[70px] font-mono text-lg font-semibold">{formatTime(seconds)}</span>
            <button
              type="button"
              onClick={handleFinish}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              Завершить тест
            </button>
          </div>
        </div>

        <div className="relative rounded-xl bg-white p-8 shadow-lg">
          <div className="mb-8 flex justify-center">
            <img
              src={currentTask.image || "/placeholder.svg"}
              alt={currentTask.subject}
              className="h-80 w-80 rounded-2xl object-cover bg-gray-100"
            />
          </div>
          <div className="mb-8 flex justify-center">
            <button
              type="button"
              onClick={playAudio}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600"
              aria-label="Произнести"
            >
              <span className="text-3xl">🔊</span>
            </button>
          </div>

          {!showVerbChoices ? (
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => handleAnswer(true)}
                disabled={showFeedback !== null}
                className="rounded-xl border-2 border-gray-300 px-8 py-4 text-xl font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Да
              </button>
              <button
                type="button"
                onClick={() => handleAnswer(false)}
                disabled={showFeedback !== null}
                className="rounded-xl border-2 border-gray-300 px-8 py-4 text-xl font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Нет
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="mb-2 text-2xl font-semibold">{currentTask.subject}...</div>
              <div className="flex flex-wrap justify-center gap-4">
                {currentTask.verbChoices?.map((verb) => (
                  <button
                    key={verb}
                    type="button"
                    onClick={() => handleVerbChoice(verb)}
                    disabled={showFeedback !== null}
                    className="rounded-xl border-2 border-gray-300 px-6 py-3 text-xl font-semibold hover:bg-gray-50 disabled:opacity-50"
                  >
                    {verb}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showFeedback && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm">
              <div
                className={`flex h-40 w-40 items-center justify-center rounded-full ${showFeedback === "correct" ? "bg-green-500" : "bg-red-500"}`}
              >
                <span className="text-8xl text-white">{showFeedback === "correct" ? "✓" : "✗"}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
