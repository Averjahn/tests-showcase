"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { TestComponentProps } from "./TestInterface";
import { useTestDebugShortcuts } from "./useTestDebugShortcuts";
import { useTestAutoRun } from "./useTestAutoRun";

export type PhraseToImageItem = {
  id: number;
  phrase: string;
  mediaPath: string;
  audioPath?: string;
};

export function createPhraseToImageTestComponent(items: PhraseToImageItem[]) {
  return function PhraseToImageTest({ config, onComplete }: TestComponentProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [showFeedback, setShowFeedback] = useState<"correct" | "incorrect" | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const startedAtRef = useRef(new Date().toISOString());
    const completedRef = useRef(false);

    const currentItem = items[currentIndex];
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const options = useMemo(() => {
      if (!currentItem) return [];
      const wrong = items
        .filter((i) => i.id !== currentItem.id)
        .map((i) => i.mediaPath)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      return [...wrong, currentItem.mediaPath].sort(() => Math.random() - 0.5);
    }, [currentIndex, currentItem, items]);

    useEffect(() => {
      const t = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => clearInterval(t);
    }, []);

    const handleImageClickRef = useRef<(path: string) => void>(() => {});
    const handleImageClick = useCallback((path: string) => {
      if (showFeedback !== null) return;
      setSelectedImage(path);
      const isCorrect = path === currentItem.mediaPath;
      if (isCorrect) setCorrectCount((c) => c + 1);
      else setIncorrectCount((c) => c + 1);
      setShowFeedback(isCorrect ? "correct" : "incorrect");

      setTimeout(() => {
        setShowFeedback(null);
        setSelectedImage(null);
        if (currentIndex >= items.length - 1) {
          if (completedRef.current) return;
          completedRef.current = true;
          onComplete({
            testId: config.id,
            answers: [],
            totalTime: seconds * 1000,
            correctCount: isCorrect ? correctCount + 1 : correctCount,
            incorrectCount: isCorrect ? incorrectCount : incorrectCount + 1,
            startedAt: startedAtRef.current,
            completedAt: new Date().toISOString(),
          });
        } else {
          setCurrentIndex((i) => i + 1);
        }
      }, 1200);
    }, [showFeedback, currentItem, currentIndex, correctCount, incorrectCount, seconds, items.length, onComplete, config]);
    handleImageClickRef.current = handleImageClick;

    const fillCorrect = useCallback(() => {
      if (showFeedback !== null || !currentItem) return;
      handleImageClickRef.current(currentItem.mediaPath);
    }, [showFeedback, currentItem]);
    const fillRandom = useCallback(() => {
      if (showFeedback !== null || options.length === 0) return;
      const path = options[Math.floor(Math.random() * options.length)];
      handleImageClickRef.current(path);
    }, [showFeedback, options]);
    const submitCurrent = useCallback(() => {}, []);

    useTestDebugShortcuts({
      disabled: showFeedback !== null,
      onFillCorrect: fillCorrect,
      onFillRandom: fillRandom,
    });
    useTestAutoRun({
      totalSteps: items.length,
      fillCorrect,
      fillRandom,
      submitCurrent,
      disabled: showFeedback !== null,
    });

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

    if (!currentItem) return null;

    const formatTime = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow">
            <div className="w-full text-xl font-bold text-slate-900">{config.name}</div>
            <div className="font-semibold">
              Задание {currentIndex + 1} из {items.length}
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold text-green-600">✓ {correctCount}</span>
              <span className="font-semibold text-red-600">✗ {incorrectCount}</span>
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

          <p className="mb-6 text-center text-lg text-gray-700">Выберите картинку, которая соответствует фразе</p>

          <div className="mb-8 flex flex-col items-center gap-4 rounded-xl bg-white p-6 shadow">
            <p className="text-2xl font-semibold text-gray-800">{currentItem.phrase}</p>
            <button
              type="button"
              onClick={() => {
                if (typeof window === "undefined") return;

                if (currentItem.audioPath) {
                  try {
                    if (!audioRef.current) audioRef.current = new Audio();
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    audioRef.current.src = currentItem.audioPath;
                    void audioRef.current.play();
                    return;
                  } catch {
                    // fall back to speech synthesis below
                  }
                }

                if (!window.speechSynthesis) return;
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(currentItem.phrase);
                u.lang = "ru-RU";
                window.speechSynthesis.speak(u);
              }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600"
              aria-label="Произнести фразу"
            >
              <span className="text-2xl">🔊</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
            {options.map((path) => (
              <button
                key={path}
                type="button"
                onClick={() => handleImageClick(path)}
                disabled={showFeedback !== null}
                className={`relative aspect-square overflow-hidden rounded-xl border-2 transition ${
                  selectedImage === path && showFeedback === "correct"
                    ? "border-green-500 bg-green-50"
                    : selectedImage === path && showFeedback === "incorrect"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-indigo-300"
                }`}
              >
                <Image
                  src={path}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 300px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          {showFeedback && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div
                className={`flex h-32 w-32 items-center justify-center rounded-full text-6xl text-white ${
                  showFeedback === "correct" ? "bg-green-500" : "bg-red-500"
                }`}
              >
                {showFeedback === "correct" ? "✓" : "✗"}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
}
