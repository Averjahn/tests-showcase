"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TestComponentProps } from "../shared/TestInterface";
import { STIMULI, distractorForLevel, type StimulusRow } from "./tasks-data";

const MEDIA_BASE = "/tests/test-26-main/media";

type Difficulty = 1 | 2 | 3;

type Side = "left" | "right";

type CardModel = { side: Side; text: string; imageUrl: string | null };

function formatTime(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function speakPhrase(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ru-RU";
  u.rate = 0.92;
  window.speechSynthesis.speak(u);
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function buildPair(row: StimulusRow, level: Difficulty): { left: CardModel; right: CardModel } {
  const target = row.phrase;
  const distractor = distractorForLevel(row, level);
  const targetImg = `${MEDIA_BASE}/images/${row.image}`;
  const distractorImg =
    level === 1
      ? `${MEDIA_BASE}/images/${row.col2Image}`
      : level === 2
        ? `${MEDIA_BASE}/images/${row.col3Image}`
        : `${MEDIA_BASE}/images/${row.col4Image}`;
  const targetFirst = Math.random() < 0.5;
  if (targetFirst) {
    return {
      left: { side: "left", text: target, imageUrl: targetImg },
      right: { side: "right", text: distractor, imageUrl: distractorImg },
    };
  }
  return {
    left: { side: "left", text: distractor, imageUrl: distractorImg },
    right: { side: "right", text: target, imageUrl: targetImg },
  };
}

function pickRandomPhrase(leftText: string, rightText: string): string {
  return Math.random() < 0.5 ? leftText : rightText;
}

export default function Test26Main({ config, onComplete }: TestComponentProps) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [pair, setPair] = useState<{ left: CardModel; right: CardModel } | null>(null);

  /** Фраза, озвученная при нажатии микрофона (случайная из двух при первом нажатии). */
  const [activePhrase, setActivePhrase] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ side: Side; ok: boolean } | null>(null);

  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const completedRef = useRef(false);
  const advanceTimerRef = useRef<number | null>(null);

  const total = STIMULI.length;
  const inGame = difficulty !== null;
  const done = inGame && index >= total;

  const currentRow = useMemo(() => {
    if (!inGame || index >= order.length) return null;
    const id = order[index];
    return STIMULI.find((r) => r.id === id) ?? null;
  }, [inGame, index, order]);

  useEffect(() => {
    if (!inGame || done) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [inGame, done]);

  const rebuildPair = useCallback(
    (row: StimulusRow, lev: Difficulty) => {
      setPair(buildPair(row, lev));
      setActivePhrase(null);
      setFeedback(null);
    },
    [],
  );

  useEffect(() => {
    if (!currentRow || difficulty === null) {
      setPair(null);
      return;
    }
    rebuildPair(currentRow, difficulty);
  }, [currentRow, difficulty, rebuildPair]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      audioRef.current?.pause();
      if (advanceTimerRef.current != null) {
        window.clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  const finishTest = useCallback(() => {
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
  }, [config.id, correctCount, incorrectCount, onComplete, seconds]);

  useEffect(() => {
    if (done) {
      const t = window.setTimeout(() => finishTest(), 600);
      return () => window.clearTimeout(t);
    }
  }, [done, finishTest]);

  function playAudioFile(url: string, phrase: string) {
    const el = audioRef.current;
    if (!el) {
      speakPhrase(phrase);
      return;
    }
    el.pause();
    el.currentTime = 0;
    el.src = url;

    const fallbackTts = () => {
      el.removeEventListener("error", onAudioError);
      speakPhrase(phrase);
    };
    const onAudioError = () => {
      fallbackTts();
    };

    el.addEventListener("error", onAudioError, { once: true });
    void el.play().catch(() => {
      el.removeEventListener("error", onAudioError);
      fallbackTts();
    });
  }

  function playUtterance(phrase: string, row: StimulusRow, level: Difficulty) {
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();

    if (phrase === row.phrase) {
      playAudioFile(`${MEDIA_BASE}/audio/${row.audio}`, phrase);
      return;
    }

    if (level === 1 && phrase === row.distractor1) {
      playAudioFile(`${MEDIA_BASE}/audio/${row.col2Audio}`, phrase);
      return;
    }

    if (level === 2 && phrase === row.distractor2) {
      playAudioFile(`${MEDIA_BASE}/audio/${row.col3Audio}`, phrase);
      return;
    }

    if (level === 3 && phrase === row.distractor3) {
      playAudioFile(`${MEDIA_BASE}/audio/${row.col4Audio}`, phrase);
      return;
    }

    speakPhrase(phrase);
  }

  function startLevel(lev: Difficulty) {
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    completedRef.current = false;
    startedAtRef.current = new Date().toISOString();
    setDifficulty(lev);
    setOrder(shuffle(STIMULI.map((r) => r.id)));
    setIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setSeconds(0);
    setActivePhrase(null);
    setFeedback(null);
  }

  function handleMic() {
    if (!pair || feedback || !currentRow || difficulty === null) return;
    if (activePhrase === null) {
      const phrase = pickRandomPhrase(pair.left.text, pair.right.text);
      setActivePhrase(phrase);
      playUtterance(phrase, currentRow, difficulty);
    } else {
      playUtterance(activePhrase, currentRow, difficulty);
    }
  }

  function handleCardClick(side: Side, text: string) {
    if (!pair || feedback || !activePhrase) return;
    const isCorrect = text === activePhrase;
    setFeedback({ side, ok: isCorrect });
    if (isCorrect) setCorrectCount((c) => c + 1);
    else setIncorrectCount((c) => c + 1);

    if (advanceTimerRef.current != null) window.clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = window.setTimeout(() => {
      advanceTimerRef.current = null;
      setIndex((i) => i + 1);
    }, 1100);
  }

  function handleFinishClick() {
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    finishTest();
  }

  if (difficulty === null) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            {config.name}
          </h1>
          <p className="mb-10 text-center text-lg text-gray-600 md:text-xl">Выберите уровень сложности</p>
          <div className="flex flex-col gap-4 md:flex-row md:gap-6">
            <button
              type="button"
              onClick={() => startLevel(1)}
              className="flex-1 rounded-2xl border-2 border-emerald-400 bg-emerald-50 py-10 text-2xl font-bold text-emerald-900 shadow-md transition-colors hover:bg-emerald-100 md:py-14 md:text-3xl"
            >
              Уровень 1
            </button>
            <button
              type="button"
              onClick={() => startLevel(2)}
              className="flex-1 rounded-2xl border-2 border-amber-400 bg-amber-50 py-10 text-2xl font-bold text-amber-900 shadow-md transition-colors hover:bg-amber-100 md:py-14 md:text-3xl"
            >
              Уровень 2
            </button>
            <button
              type="button"
              onClick={() => startLevel(3)}
              className="flex-1 rounded-2xl border-2 border-rose-400 bg-rose-50 py-10 text-2xl font-bold text-rose-900 shadow-md transition-colors hover:bg-rose-100 md:py-14 md:text-3xl"
            >
              Уровень 3
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-10 text-center shadow-lg">
          <p className="text-2xl font-bold text-gray-900">Готово</p>
          <p className="mt-4 text-xl text-gray-600">
            Верно: {correctCount} · Ошибок: {incorrectCount}
          </p>
          <p className="mt-2 font-mono text-gray-500">{formatTime(seconds)}</p>
        </div>
      </div>
    );
  }

  if (!pair || !currentRow) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-600">
        Загрузка…
      </div>
    );
  }

  const diffLabel = `Сложность ${difficulty}`;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-8 landscape:p-4">
      <audio ref={audioRef} preload="metadata" className="hidden" />
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow">
          <div className="w-full text-xl font-bold text-slate-900">{config.name}</div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-indigo-100 px-3 py-1.5 text-sm font-semibold text-indigo-900">
              {diffLabel}
            </span>
            <div className="text-lg font-semibold text-gray-900 md:text-xl">
              Пара {index + 1} из {total}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="text-lg font-semibold text-green-600 md:text-xl">✓ {correctCount}</span>
            <span className="text-lg font-semibold text-red-600 md:text-xl">✗ {incorrectCount}</span>
            <span className="font-mono text-lg text-gray-800">{formatTime(seconds)}</span>
            <button
              type="button"
              onClick={handleFinishClick}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 md:px-5 md:text-base"
            >
              Завершить тест
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-lg sm:p-6 md:p-10">
          <p className="mb-6 text-center text-3xl font-bold tracking-wide text-gray-900 sm:text-4xl md:text-5xl">
            ПОКАЖИТЕ…
          </p>

          <div className="mb-8 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleMic}
              disabled={Boolean(feedback)}
              className={[
                "inline-flex items-center justify-center gap-3 rounded-full border-4 px-8 py-5 text-lg font-semibold transition-colors",
                feedback
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-indigo-500 bg-indigo-50 text-indigo-900 hover:bg-indigo-100",
              ].join(" ")}
              aria-label="Прослушать фразу"
            >
              <MicIcon />
              {activePhrase ? "Повторить фразу" : "Нажмите, чтобы услышать фразу"}
            </button>
            {!activePhrase ? (
              <p className="max-w-md text-center text-base text-gray-500">
                Сначала нажмите микрофон — прозвучит одна из двух сцен
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:gap-8">
            {(
              [
                { card: pair.left, key: "left" },
                { card: pair.right, key: "right" },
              ] as const
            ).map(({ card, key }) => {
              const fb = feedback?.side === card.side ? feedback.ok : null;
              const ring =
                fb === true
                  ? "border-green-500 bg-green-50 ring-4 ring-green-400"
                  : fb === false
                    ? "border-red-500 bg-red-50 ring-4 ring-red-400"
                    : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/40";
              const canClick = Boolean(activePhrase && !feedback);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!canClick}
                  onClick={() => handleCardClick(card.side, card.text)}
                  className={[
                    "relative flex min-h-[140px] flex-col items-center justify-center gap-4 rounded-2xl border-4 p-5 text-left shadow-md transition-all sm:min-h-[180px] md:min-h-[220px] md:p-8",
                    ring,
                    canClick ? "cursor-pointer" : "cursor-default opacity-80",
                  ].join(" ")}
                >
                  {card.imageUrl ? (
                    <div className="relative w-full flex-1 overflow-hidden rounded-xl bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card.imageUrl}
                        alt=""
                        className="mx-auto max-h-[min(52vw,280px)] w-full object-contain sm:max-h-[min(40vw,320px)] md:max-h-[360px]"
                        draggable={false}
                      />
                    </div>
                  ) : (
                    <span className="text-4xl sm:text-5xl" aria-hidden>
                      🖼️
                    </span>
                  )}
                  <span className="text-center text-xl font-semibold leading-snug text-gray-900 sm:text-2xl md:text-3xl">
                    {card.text}
                  </span>
                  {fb === true ? (
                    <span
                      className="absolute right-4 top-4 text-4xl text-green-600 md:text-5xl"
                      aria-hidden
                    >
                      ✅
                    </span>
                  ) : null}
                  {fb === false ? (
                    <span
                      className="absolute right-4 top-4 text-4xl text-red-600 md:text-5xl"
                      aria-hidden
                    >
                      ❌
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
