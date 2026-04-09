"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TestComponentProps } from "../shared/TestInterface";
import tasksRaw from "./tasks.json";

type CardDef = {
  id: number;
  name: string;
  image: string;
  audio: string;
  trueCharacteristic: string;
  characteristics: string[];
};

type PairTask = { pairId: number; cards: [CardDef, CardDef] };

const TASKS = tasksRaw as unknown as PairTask[];

function formatTime(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}


function CardImage({ image, alt }: { image: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const src = `/tests/test-30-main/media/images/${image}`;
  if (failed) {
    return (
      <div className="mb-2 flex aspect-[4/3] items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 px-2 text-center text-xs text-slate-600">
        {alt}
      </div>
    );
  }
  return (
    <div className="mb-2 aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain"
        draggable={false}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

type Stage = "listen" | "pickCard" | "aEtot";

type CardUiState = "idle" | "ok" | "bad" | "disabled" | "otherFocus";

export default function Test30Main({ config, onComplete }: TestComponentProps) {
  const [taskIdx, setTaskIdx] = useState(0);

  const [stage, setStage] = useState<Stage>("listen");
  const [cardsState, setCardsState] = useState<[CardUiState, CardUiState]>(["idle", "idle"]);
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [questionCharacteristic, setQuestionCharacteristic] = useState<string>("");
  const [targetIdx, setTargetIdx] = useState<0 | 1>(0);

  const [attrFlash, setAttrFlash] = useState<{ idx: number; kind: "ok" | "bad" } | null>(null);

  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const startedAtRef = useRef<string>(new Date().toISOString());
  const completedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const task = TASKS[taskIdx];

  const targetCard = task ? task.cards[targetIdx] : null;
  const otherIdx: 0 | 1 = targetIdx === 0 ? 1 : 0;
  const otherCard = task ? task.cards[otherIdx] : null;

  const canPickCards = stage === "pickCard";

  const initTask = useCallback(() => {
    if (!task) return;
    const tIdx: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
    setTargetIdx(tIdx);
    setQuestionCharacteristic(task.cards[tIdx].trueCharacteristic);
    setStage("listen");
    setCardsState(["idle", "idle"]);
    setPickedIdx(null);
    setAttrFlash(null);
  }, [task]);

  useEffect(() => {
    initTask();
  }, [taskIdx, initTask]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
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

  function flashCard(i: 0 | 1, kind: "ok" | "bad") {
    setCardsState((prev) => {
      const next: [CardUiState, CardUiState] = [...prev] as any;
      next[i] = kind === "ok" ? "ok" : "bad";
      return next;
    });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCardsState((prev) => {
        const next: [CardUiState, CardUiState] = [...prev] as any;
        next[i] = "idle";
        return next;
      });
      timerRef.current = null;
    }, 600);
  }

  async function playAudio(src: string) {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    el.src = src;
    try {
      await el.play();
    } catch {
      // даже если заглушка не проигрывается — считаем, что вопрос прослушан
    }
  }

  async function onListenClick() {
    if (!task || !targetCard) return;
    if (stage === "aEtot") {
      await playAudio(`/tests/test-30-main/media/audio/aetot.mp3`);
      return;
    }
    await playAudio(`/tests/test-30-main/media/audio/${targetCard.audio}`);
    setStage("pickCard");
  }

  function onCardClick(i: 0 | 1) {
    if (!task || !targetCard || !otherCard) return;
    if (!canPickCards) return;
    if (cardsState[i] === "disabled" || cardsState[i] === "otherFocus") return;

    const picked = task.cards[i];
    setPickedIdx(i);
    const ok = picked.trueCharacteristic === questionCharacteristic;
    if (!ok) {
      setIncorrectCount((c) => c + 1);
      flashCard(i, "bad");
      return;
    }

    setCorrectCount((c) => c + 1);
    // зелёная вспышка, потом: выбранная — серой/прозрачной, другая — синяя рамка
    setCardsState((_) => (i === 0 ? ["ok", "idle"] : ["idle", "ok"]));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCardsState(i === 0 ? ["disabled", "otherFocus"] : ["otherFocus", "disabled"]);
      setStage("aEtot");
      timerRef.current = null;
    }, 650);
  }

  function onAttrPick(text: string) {
    if (!otherCard) return;
    const ok = text === otherCard.trueCharacteristic;
    if (!ok) {
      setIncorrectCount((c) => c + 1);
      setAttrFlash({ idx: otherCard.characteristics.indexOf(text), kind: "bad" });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setAttrFlash(null);
        timerRef.current = null;
      }, 550);
      return;
    }

    setCorrectCount((c) => c + 1);
    setAttrFlash({ idx: otherCard.characteristics.indexOf(text), kind: "ok" });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setAttrFlash(null);
      const isLast = taskIdx >= TASKS.length - 1;
      if (isLast) {
        finishTest();
        // остаёмся на последнем экране, но блокируем взаимодействия
        setStage("listen");
        setCardsState(["disabled", "disabled"]);
      } else {
        setTaskIdx((i) => i + 1);
      }
      timerRef.current = null;
    }, 650);
  }

  if (!task || !targetCard || !otherCard) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-8">
      <audio ref={audioRef} />
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={taskIdx}
              onChange={(e) => setTaskIdx(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              aria-label="Выбор задания"
            >
              {TASKS.map((t, idx) => (
                <option key={t.pairId} value={idx}>
                  Задание {idx + 1}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-green-600">✓ {correctCount}</span>
            <span className="font-semibold text-red-600">✗ {incorrectCount}</span>
            <span className="font-mono">{formatTime(seconds)}</span>
            <button
              type="button"
              onClick={initTask}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Начать заново
            </button>
            <button
              type="button"
              onClick={finishTest}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              Завершить тест
            </button>
          </div>
        </div>

        <div className="mx-auto mb-5 grid max-w-3xl grid-cols-2 gap-4">
          {task.cards.map((c, iRaw) => {
            const i = iRaw as 0 | 1;
            const st = cardsState[i];
            const frame =
              st === "ok"
                ? "border-green-500 bg-green-50 ring-2 ring-green-400"
                : st === "bad"
                  ? "border-red-500 bg-red-50 ring-2 ring-red-400"
                  : st === "otherFocus"
                    ? "border-blue-500 bg-white ring-2 ring-blue-400"
                    : st === "disabled"
                      ? "border-gray-200 bg-gray-100 opacity-60"
                      : "border-gray-200 bg-white";
            const disabled = !canPickCards || st === "disabled" || st === "otherFocus";
            return (
              <button
                key={c.id}
                type="button"
                disabled={disabled}
                onClick={() => onCardClick(i)}
                className={[
                  "flex flex-col rounded-2xl border-2 p-3 text-left shadow-sm transition-colors",
                  frame,
                  disabled ? "cursor-default" : "cursor-pointer hover:border-indigo-300",
                ].join(" ")}
              >
                <CardImage image={c.image} alt={c.name} />
                <div className="text-center text-base font-bold text-gray-900">{c.name}</div>
              </button>
            );
          })}
        </div>

        <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-gray-200 bg-white p-4 shadow md:p-6">
          <button
            type="button"
            onClick={onListenClick}
            className="mx-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-lg font-bold text-white hover:bg-indigo-700"
          >
            <span aria-hidden>🔊</span>
            Слушать вопрос
          </button>
          <div className="mt-3 text-center text-sm text-gray-500">
            {stage === "listen" || stage === "pickCard" ? `Это — «${questionCharacteristic}»?` : "А этот?"}
          </div>
        </div>

        {stage === "aEtot" && otherCard && (
          <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-4 shadow md:p-6">
            <div className="mb-3 text-center text-lg font-extrabold text-gray-900">А этот?</div>
            <div className="flex flex-wrap justify-center gap-2">
              {otherCard.characteristics.map((ch, idx) => {
                const flash =
                  attrFlash && attrFlash.idx === idx ? (attrFlash.kind === "ok" ? "ok" : "bad") : null;
                const cls =
                  flash === "ok"
                    ? "border-green-500 bg-green-100 text-green-900"
                    : flash === "bad"
                      ? "border-red-500 bg-red-100 text-red-900"
                      : "border-gray-200 bg-white text-gray-900 hover:border-indigo-400";
                return (
                  <button
                    key={`${idx}-${ch}`}
                    type="button"
                    onClick={() => onAttrPick(ch)}
                    className={[
                      "rounded-full border-2 px-4 py-2 text-base font-semibold shadow-sm transition-colors",
                      cls,
                    ].join(" ")}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

