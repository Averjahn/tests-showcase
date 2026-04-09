"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { TestComponentProps } from "../shared/TestInterface";
import task1Raw from "./task1.json";

const MEDIA_BASE = "/tests/test-25-main/media1";
const STRIKES_TO_SKIP = 3;

type WordItem = {
  id: string;
  text: string;
  image: string;
  audio: string;
};

type QueueState = { main: string[]; skipped: string[] };

type QueueAction =
  | { type: "correct" }
  | { type: "skip" }
  | { type: "restart"; ids: string[] };

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function refillMain(main: string[], skipped: string[]): QueueState {
  if (main.length > 0) return { main, skipped };
  if (skipped.length > 0) return { main: shuffle(skipped), skipped: [] };
  return { main: [], skipped: [] };
}

function queueReducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case "restart":
      return { main: shuffle(action.ids), skipped: [] };
    case "correct": {
      if (state.main.length === 0) return state;
      const [, ...rest] = state.main;
      return refillMain(rest, state.skipped);
    }
    case "skip": {
      if (state.main.length === 0) return state;
      const [head, ...rest] = state.main;
      const newSkipped = [...state.skipped, head];
      return refillMain(rest, newSkipped);
    }
    default:
      return state;
  }
}

function formatTime(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function buildGridForTarget(target: WordItem, pool: WordItem[], gridSize: number): WordItem[] {
  const others = pool.filter((w) => w.id !== target.id);
  const need = gridSize - 1;
  const distractors = shuffle(others).slice(0, need);
  return shuffle([target, ...distractors]);
}

function speakRu(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ru-RU";
  window.speechSynthesis.speak(u);
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
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

function stopAudioSession(
  audioEl: HTMLAudioElement | null,
  ttsTimerRef: { current: number | null },
) {
  window.speechSynthesis?.cancel();
  audioEl?.pause();
  if (ttsTimerRef.current != null) {
    window.clearTimeout(ttsTimerRef.current);
    ttsTimerRef.current = null;
  }
}

export default function Test25Main({ config, onComplete }: TestComponentProps) {
  const words = task1Raw as WordItem[];
  const allIds = useMemo(() => words.map((w) => w.id), [words]);

  const [level, setLevel] = useState<null | 1 | 2>(null);
  const gridSize = level === 2 ? 6 : 4;

  const [queue, dispatchQueue] = useReducer(queueReducer, { main: [], skipped: [] });

  const byId = useMemo(() => {
    const m = new Map<string, WordItem>();
    for (const w of words) m.set(w.id, w);
    return m;
  }, [words]);

  const currentId = queue.main[0] ?? null;
  const currentWord = currentId ? byId.get(currentId) ?? null : null;

  const [completedCount, setCompletedCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const [grid, setGrid] = useState<WordItem[]>([]);
  const [audioLocked, setAudioLocked] = useState(true);
  const [feedback, setFeedback] = useState<{ id: string; kind: "ok" | "bad" } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const completedRef = useRef(false);
  const ttsEndTimerRef = useRef<number | null>(null);

  const totalWords = words.length;
  const inGame = level !== null;
  const done =
    inGame && queue.main.length === 0 && queue.skipped.length === 0 && completedCount >= totalWords;

  useEffect(() => {
    if (!inGame) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [inGame]);

  const syncGridForCurrent = useCallback(
    (id: string | null, size: number) => {
      if (!id) {
        setGrid([]);
        return;
      }
      const target = byId.get(id);
      if (!target) {
        setGrid([]);
        return;
      }
      setGrid(buildGridForTarget(target, words, size));
    },
    [byId, words],
  );

  useEffect(() => {
    if (!inGame) {
      setGrid([]);
      return;
    }
    syncGridForCurrent(currentId, gridSize);
  }, [currentId, syncGridForCurrent, gridSize, inGame]);

  const playCurrentWord = useCallback(
    (mode: "auto" | "replay") => {
      const w = currentId ? byId.get(currentId) : null;
      if (!w) return;

      if (ttsEndTimerRef.current != null) {
        window.clearTimeout(ttsEndTimerRef.current);
        ttsEndTimerRef.current = null;
      }
      window.speechSynthesis?.cancel();

      setAudioLocked(true);
      const url = `${MEDIA_BASE}/${w.audio}`;
      const el = audioRef.current;
      if (!el) {
        speakRu(w.text);
        const approxMs = Math.min(4000, 800 + w.text.length * 120);
        ttsEndTimerRef.current = window.setTimeout(() => {
          setAudioLocked(false);
          ttsEndTimerRef.current = null;
        }, approxMs);
        return;
      }

      el.pause();
      el.currentTime = 0;
      el.src = url;

      const onEnd = () => {
        el.removeEventListener("ended", onEnd);
        el.removeEventListener("error", onErr);
        setAudioLocked(false);
      };
      const onErr = () => {
        el.removeEventListener("ended", onEnd);
        el.removeEventListener("error", onErr);
        speakRu(w.text);
        const approxMs = Math.min(4000, 800 + w.text.length * 120);
        ttsEndTimerRef.current = window.setTimeout(() => {
          setAudioLocked(false);
          ttsEndTimerRef.current = null;
        }, approxMs);
      };

      el.addEventListener("ended", onEnd, { once: true });
      el.addEventListener("error", onErr, { once: true });

      void el.play().catch(() => {
        el.removeEventListener("ended", onEnd);
        el.removeEventListener("error", onErr);
        onErr();
      });

      if (mode === "replay") {
        setFeedback(null);
      }
    },
    [byId, currentId],
  );

  useEffect(() => {
    if (!inGame || !currentWord) return;
    playCurrentWord("auto");
    return () => {
      stopAudioSession(audioRef.current, ttsEndTimerRef);
    };
  }, [currentWord?.id, playCurrentWord, inGame]);

  const secondsRef = useRef(seconds);
  const completedCountRef = useRef(completedCount);
  const incorrectCountRef = useRef(incorrectCount);
  secondsRef.current = seconds;
  completedCountRef.current = completedCount;
  incorrectCountRef.current = incorrectCount;

  const finishTest = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete({
      testId: config.id,
      answers: [],
      totalTime: secondsRef.current * 1000,
      correctCount: completedCountRef.current,
      incorrectCount: incorrectCountRef.current,
      startedAt: startedAtRef.current,
      completedAt: new Date().toISOString(),
    });
  }, [config.id, onComplete]);

  useEffect(() => {
    if (done) {
      const t = window.setTimeout(() => finishTest(), 400);
      return () => window.clearTimeout(t);
    }
  }, [done, finishTest]);

  function beginLevel(selected: 1 | 2) {
    stopAudioSession(audioRef.current, ttsEndTimerRef);
    completedRef.current = false;
    startedAtRef.current = new Date().toISOString();
    dispatchQueue({ type: "restart", ids: allIds });
    setCompletedCount(0);
    setIncorrectCount(0);
    setConsecutiveWrong(0);
    setSeconds(0);
    setFeedback(null);
    setAudioLocked(true);
    setLevel(selected);
  }

  function backToLevelMenu() {
    stopAudioSession(audioRef.current, ttsEndTimerRef);
    completedRef.current = false;
    dispatchQueue({ type: "restart", ids: [] });
    setCompletedCount(0);
    setIncorrectCount(0);
    setConsecutiveWrong(0);
    setSeconds(0);
    setFeedback(null);
    setGrid([]);
    setLevel(null);
  }

  function handleImageClick(clicked: WordItem) {
    if (!currentWord || audioLocked || feedback) return;

    if (clicked.id === currentWord.id) {
      setFeedback({ id: clicked.id, kind: "ok" });
      setConsecutiveWrong(0);

      window.setTimeout(() => {
        setFeedback(null);
        setCompletedCount((c) => c + 1);
        dispatchQueue({ type: "correct" });
      }, 650);
      return;
    }

    setIncorrectCount((c) => c + 1);
    setFeedback({ id: clicked.id, kind: "bad" });
    const nextStreak = consecutiveWrong + 1;
    setConsecutiveWrong(nextStreak);

    window.setTimeout(() => {
      setFeedback(null);
      if (nextStreak >= STRIKES_TO_SKIP) {
        dispatchQueue({ type: "skip" });
        setConsecutiveWrong(0);
      }
    }, 700);
  }

  function handleRestart() {
    stopAudioSession(audioRef.current, ttsEndTimerRef);
    completedRef.current = false;
    startedAtRef.current = new Date().toISOString();
    dispatchQueue({ type: "restart", ids: allIds });
    setCompletedCount(0);
    setIncorrectCount(0);
    setConsecutiveWrong(0);
    setSeconds(0);
    setFeedback(null);
  }

  function handleReplay() {
    playCurrentWord("replay");
  }

  const progressRatio = totalWords > 0 ? completedCount / totalWords : 0;
  const remaining = queue.main.length + queue.skipped.length;

  if (level === null) {
    return (
      <div className="mx-auto max-w-2xl px-4">
        <audio ref={audioRef} preload="auto" className="hidden" />
        <h1 className="mb-8 text-center text-2xl font-semibold text-slate-900 md:text-3xl">
          {config.name}
        </h1>
        <p className="mb-8 text-center text-slate-600">Выберите уровень</p>
        <div className="flex flex-col gap-4 md:gap-6">
          <button
            type="button"
            onClick={() => beginLevel(1)}
            className="w-full rounded-2xl border-2 border-indigo-400 bg-indigo-50 py-8 text-2xl font-bold text-indigo-900 shadow-md transition-colors hover:bg-indigo-100 md:py-12 md:text-3xl"
          >
            Уровень 1
          </button>
          <button
            type="button"
            onClick={() => beginLevel(2)}
            className="w-full rounded-2xl border-2 border-violet-400 bg-violet-50 py-8 text-2xl font-bold text-violet-900 shadow-md transition-colors hover:bg-violet-100 md:py-12 md:text-3xl"
          >
            Уровень 2
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 text-center shadow">
        <p className="text-xl font-semibold text-slate-800">Готово</p>
        <p className="mt-2 text-slate-600">
          Ошибок: {incorrectCount} · Время: {formatTime(seconds)}
        </p>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 text-center shadow">
        <p className="text-slate-600">Загрузка…</p>
      </div>
    );
  }

  const gridClass =
    gridSize === 6
      ? "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:gap-5"
      : "grid grid-cols-2 gap-4 md:gap-6";

  return (
    <div className={gridSize === 6 ? "mx-auto max-w-5xl" : "mx-auto max-w-4xl"}>
      <audio ref={audioRef} preload="auto" className="hidden" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span className="font-medium text-slate-800">{config.name}</span>
          <span>{gridSize === 6 ? "6 картинок" : "4 картинки"}</span>
          <span>
            {formatTime(seconds)} · Ошибок: {incorrectCount}
          </span>
        </div>
        <button
          type="button"
          onClick={handleRestart}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Заново
        </button>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${Math.round(progressRatio * 100)}%` }}
        />
      </div>
      <p className="mb-1 text-center text-xs text-slate-500">
        Угадано: {completedCount} / {totalWords} · В очереди: {remaining}
        {queue.skipped.length > 0 ? ` · Отложено: ${queue.skipped.length}` : ""}
      </p>

      <div className="rounded-2xl bg-white p-6 shadow-lg md:p-10">
        <p className="mb-6 text-center text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          Покажите, где…
        </p>

        <div className="mb-8 flex justify-center">
          <button
            type="button"
            disabled={Boolean(feedback)}
            onClick={handleReplay}
            className={[
              "inline-flex items-center gap-2 rounded-full border-2 px-5 py-3 text-sm font-medium transition-colors",
              feedback
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                : "border-indigo-400 bg-indigo-50 text-indigo-800 hover:bg-indigo-100",
            ].join(" ")}
            aria-label="Повторить слово"
          >
            <MicIcon />
            Повторить
          </button>
        </div>

        <div className={gridClass}>
          {grid.map((item) => {
            const src = `${MEDIA_BASE}/${item.image}`;
            const fb = feedback?.id === item.id ? feedback.kind : null;
            const ring =
              fb === "ok"
                ? "ring-4 ring-emerald-500 ring-offset-2"
                : fb === "bad"
                  ? "ring-4 ring-red-500 ring-offset-2"
                  : "";
            return (
              <button
                key={`${currentId}-${item.id}`}
                type="button"
                disabled={Boolean(audioLocked || feedback)}
                onClick={() => handleImageClick(item)}
                className={[
                  "relative aspect-square overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 shadow-md transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-60",
                  ring,
                ].join(" ")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-contain p-2"
                  draggable={false}
                />
                {audioLocked && !feedback ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/40 text-sm font-medium text-slate-600">
                    Слушайте…
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={backToLevelMenu}
            className="rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Назад к выбору уровня
          </button>
        </div>
      </div>
    </div>
  );
}
