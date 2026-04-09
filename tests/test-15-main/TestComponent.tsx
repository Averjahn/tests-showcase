"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { TestComponentProps, TestResult } from "../shared/TestInterface";
import { LEVEL_DATA } from "./tasks-data";

const level = 1;
const tasks = LEVEL_DATA[level] ?? [];

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getChoiceImageSrc(testId: string, taskIndex: number, choiceIndex: number) {
  const globalChoiceIndex = taskIndex * 2 + choiceIndex + 1;
  return `/tests/${testId}/media/images/${globalChoiceIndex}.png`;
}

export default function Test15Main({ config, onComplete }: TestComponentProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [currentPhrase, setCurrentPhrase] = useState("");
  const [currentAudioId, setCurrentAudioId] = useState<number>(1);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [showResult, setShowResult] = useState<"correct" | "incorrect" | "">("");
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedSound, setHasPlayedSound] = useState(false);
  const startedAtRef = useRef(new Date().toISOString());
  const completedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTask = tasks[currentTaskIndex];

  const initTask = useCallback(() => {
    if (!currentTask) return;
    const randomIndex = Math.floor(Math.random() * 2);
    setCurrentPhrase(currentTask[randomIndex] ?? "");
    setCurrentAudioId(currentTaskIndex * 2 + randomIndex + 1);
    setCorrectAnswer(randomIndex);
    setShowResult("");
    setSelectedImage(null);
    setHasPlayedSound(false);
  }, [currentTask, currentTaskIndex]);

  useEffect(() => {
    initTask();
  }, [initTask]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const speak = async () => {
    if (isPlaying) return;
    setHasPlayedSound(true);
    const audio = audioRef.current;
    const src = `/tests/${config.id}/media/audio/${currentAudioId}.mp3`;
    if (audio) {
      try {
        setIsPlaying(true);
        audio.pause();
        audio.currentTime = 0;
        audio.src = src;
        const clear = () => setIsPlaying(false);
        audio.addEventListener("ended", clear, { once: true });
        audio.addEventListener("error", clear, { once: true });
        await audio.play();
        return;
      } catch {
        setIsPlaying(false);
        // fallback ниже
      }
    }
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    setIsPlaying(true);
    const u = new SpeechSynthesisUtterance(currentPhrase);
    u.lang = "ru-RU";
    u.rate = 0.8;
    u.onend = () => setIsPlaying(false);
    u.onerror = () => setIsPlaying(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const handleImageClick = (imageIndex: number) => {
    setSelectedImage(imageIndex);
    if (imageIndex === correctAnswer) {
      const finalCorrect = correctCount + 1;
      setCorrectCount(finalCorrect);
      setShowResult("correct");
      setTimeout(() => {
        if (currentTaskIndex < tasks.length - 1) {
          setCurrentTaskIndex((i) => i + 1);
        } else {
          if (completedRef.current) return;
          completedRef.current = true;
          onComplete({
            testId: config.id,
            answers: [],
            totalTime: seconds * 1000,
            correctCount: finalCorrect,
            incorrectCount,
            startedAt: startedAtRef.current,
            completedAt: new Date().toISOString(),
          });
        }
      }, 1200);
    } else {
      setIncorrectCount((c) => c + 1);
      setShowResult("incorrect");
      setTimeout(() => {
        setShowResult("");
        setSelectedImage(null);
      }, 1000);
    }
  };

  const handleFinish = () => {
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
  };

  if (!currentTask) return null;

  const choicesDisabled = selectedImage !== null || isPlaying || !hasPlayedSound;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <audio ref={audioRef} />
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow">
          <div className="w-full text-xl font-bold text-slate-900">{config.name}</div>
          <div className="font-semibold">Задание {currentTaskIndex + 1} из {tasks.length}</div>
          <div className="flex items-center gap-4">
            <span className="text-green-600 font-semibold">✓ {correctCount}</span>
            <span className="text-red-600 font-semibold">✗ {incorrectCount}</span>
            <span className="font-mono">{formatTime(seconds)}</span>
            <button type="button" onClick={handleFinish} className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
              Завершить тест
            </button>
          </div>
        </div>

        <p className="text-center text-gray-600 mb-4">Прослушайте и выберите подходящую картинку</p>

        <div className="flex justify-center mb-8">
          <button
            type="button"
            onClick={speak}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600"
            aria-label="Произнести"
          >
            <span className="text-3xl">🔊</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {currentTask.map((phrase, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleImageClick(idx)}
              disabled={choicesDisabled}
              className={`rounded-2xl border-2 p-6 text-center text-lg font-medium transition ${selectedImage === idx && showResult === "correct" ? "border-green-500 bg-green-50" : ""} ${selectedImage === idx && showResult === "incorrect" ? "border-red-500 bg-red-50" : ""} ${selectedImage === null ? "border-gray-200 hover:border-indigo-300 bg-white" : "opacity-80"}`}
            >
              {phrase}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {currentTask.map((phrase, idx) => (
              <button
                key={`card-${idx}`}
                type="button"
                onClick={() => handleImageClick(idx)}
                disabled={choicesDisabled}
                className={[
                  "overflow-hidden rounded-2xl border-2 bg-white text-left shadow-sm transition",
                  selectedImage === idx && showResult === "correct" ? "border-green-500 bg-green-50" : "",
                  selectedImage === idx && showResult === "incorrect" ? "border-red-500 bg-red-50" : "",
                  selectedImage === null ? "border-gray-200 hover:border-indigo-300" : "opacity-80",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="aspect-square w-full bg-white">
                  <img
                    src={getChoiceImageSrc(config.id, currentTaskIndex, idx)}
                    alt={phrase}
                    className="h-full w-full object-contain"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {showResult === "correct" && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <span className="text-8xl text-green-500">✓</span>
          </div>
        )}
      </div>
    </div>
  );
}
