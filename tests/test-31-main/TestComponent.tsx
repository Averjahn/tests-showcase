"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TestComponentProps } from "../shared/TestInterface";
import tasksRaw from "./tasks.json";

type WordDef = { text: string; audio: string };
type ActionDef = { text: string; audio: string; is_correct: boolean };
type TaskDef = { id: number; image: string; word: WordDef; actions: ActionDef[] };

const TASKS = tasksRaw as unknown as TaskDef[];

type View = "menu" | "level1" | "level2";
type Level2Stage = "yesno" | "pickAction";

function clampIndex(idx: number) {
  if (Number.isNaN(idx) || !Number.isFinite(idx)) return 0;
  return Math.max(0, Math.min(TASKS.length - 1, Math.trunc(idx)));
}

function pickRandom<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function speakOnce(text: string) {
  return new Promise<void>((resolve) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) {
        resolve();
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ru-RU";
      u.rate = 1;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      synth.cancel();
      synth.speak(u);
    } catch {
      resolve();
    }
  });
}

async function playHtmlAudioOrSpeak(
  audioEl: HTMLAudioElement,
  src: string,
  fallbackText: string,
) {
  audioEl.pause();
  audioEl.currentTime = 0;
  audioEl.src = src;

  try {
    await new Promise<void>((resolve) => {
      const onDone = () => resolve();
      const onError = () => resolve();
      audioEl.addEventListener("ended", onDone, { once: true });
      audioEl.addEventListener("error", onError, { once: true });
      void audioEl.play().catch(() => resolve());
    });
    // If it ended immediately due to an error, we'll still have no sound.
    // Prefer speaking in that case.
    if (audioEl.error) {
      await speakOnce(fallbackText);
    }
  } catch {
    await speakOnce(fallbackText);
  }
}

function CardImage({ testId, image, alt }: { testId: string; image: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const src = `/tests/${testId}/media/images/${image}`;
  if (failed) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 px-4 text-center text-sm font-semibold text-slate-700">
        {alt}
      </div>
    );
  }
  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100">
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

type GaplessPlayer = {
  ctx: AudioContext;
  gain: GainNode;
  stop: () => void;
};

async function playAudioSequenceGapless(
  gapless: GaplessPlayer,
  audioElFallback: HTMLAudioElement,
  items: { src: string; fallbackText: string }[],
) {
  // Try WebAudio gapless scheduling first (best effort).
  try {
    const res = await Promise.all(
      items.map(async ({ src }) => {
        const r = await fetch(src);
        const buf = await r.arrayBuffer();
        return await gapless.ctx.decodeAudioData(buf);
      }),
    );

    // Stop previous playback (if any) and start new.
    gapless.stop();

    let t = gapless.ctx.currentTime + 0.02;
    const sourcesNodes: AudioBufferSourceNode[] = [];
    for (const b of res) {
      const node = gapless.ctx.createBufferSource();
      node.buffer = b;
      node.connect(gapless.gain);
      node.start(t);
      sourcesNodes.push(node);
      t += b.duration;
    }

    let stopped = false;
    gapless.stop = () => {
      if (stopped) return;
      stopped = true;
      for (const n of sourcesNodes) {
        try {
          n.stop();
        } catch {
          // ignore
        }
        try {
          n.disconnect();
        } catch {
          // ignore
        }
      }
    };

    await new Promise<void>((resolve) => {
      const last = sourcesNodes[sourcesNodes.length - 1];
      if (!last) resolve();
      else last.addEventListener("ended", () => resolve(), { once: true });
    });
    return;
  } catch {
    // If decoding fails (e.g. placeholder mp3), fallback to HTMLAudio sequential.
  }

  for (const it of items) {
    // eslint-disable-next-line no-await-in-loop
    await playHtmlAudioOrSpeak(audioElFallback, it.src, it.fallbackText);
  }
}

export default function Test31Main({ config, onComplete }: TestComponentProps) {
  const testId = config.id;
  const [view, setView] = useState<View>("menu");

  const [taskIdx, setTaskIdx] = useState(0);
  const task = TASKS[taskIdx] || null;

  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  const [message, setMessage] = useState<null | { text: string; kind: "ok" | "bad" }>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const gaplessRef = useRef<GaplessPlayer | null>(null);
  const advancingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [hasListenedLevel1, setHasListenedLevel1] = useState(false);
  const [level2Stage, setLevel2Stage] = useState<Level2Stage>("yesno");
  const [pickedActionAudio, setPickedActionAudio] = useState<string | null>(null);

  const allowedActions = useMemo(() => {
    if (!task) return [];
    if (view === "level1") return task.actions.slice(0, 2);
    if (view === "level2") return task.actions.slice(0, 3);
    return [];
  }, [task, view]);

  const pickedAction = useMemo(() => {
    if (!task) return null;
    if (view !== "level1" && view !== "level2") return null;
    if (!allowedActions.length) return null;

    const audio = pickedActionAudio;
    if (!audio) return null;
    return allowedActions.find((a) => a.audio === audio) || null;
  }, [task, view, allowedActions, pickedActionAudio]);

  const correctAction = useMemo(() => {
    if (!task) return null;
    return task.actions.find((a) => a.is_correct) || null;
  }, [task]);

  function getAllowedActionsForTask(t: TaskDef, v: View) {
    if (v === "level1") return t.actions.slice(0, 2);
    if (v === "level2") return t.actions.slice(0, 3);
    return [];
  }

  function resetRunState() {
    setCorrectCount(0);
    setIncorrectCount(0);
    setTaskIdx(0);
    setMessage(null);
    setHasListenedLevel1(false);
    setLevel2Stage("yesno");
    setPickedActionAudio(null);
  }

  function initTaskState() {
    setMessage(null);
    setHasListenedLevel1(false);
    setLevel2Stage("yesno");
    setIsPlaying(false);
    if (!task) {
      setPickedActionAudio(null);
      return;
    }
    if (view === "level1" || view === "level2") {
      const allowed = getAllowedActionsForTask(task, view);
      const random = allowed.length ? pickRandom(allowed) : null;
      setPickedActionAudio(random?.audio ?? null);
    } else {
      setPickedActionAudio(null);
    }
  }

  useEffect(() => {
    initTaskState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, taskIdx]);

  useEffect(() => {
    return () => {
      const el = audioRef.current;
      if (el) {
        el.pause();
        el.src = "";
      }

      const gapless = gaplessRef.current;
      if (gapless) {
        gapless.stop();
        gapless.gain.disconnect();
        void gapless.ctx.close().catch(() => {});
        gaplessRef.current = null;
      }
    };
  }, []);

  function showVerdict(isCorrect: boolean) {
    setMessage(isCorrect ? { text: "Верно", kind: "ok" } : { text: "Не верно", kind: "bad" });
  }

  async function goNextOrMenu() {
    if (advancingRef.current) return;
    advancingRef.current = true;
    await wait(650);

    const isLast = taskIdx >= TASKS.length - 1;
    if (isLast) {
      setView("menu");
      resetRunState();
      advancingRef.current = false;
      return;
    }
    setTaskIdx((i) => i + 1);
    advancingRef.current = false;
  }

  async function onListenClick() {
    if (!task) return;
    const el = audioRef.current;
    if (!el) return;

    if (view === "menu") return;
    if (isPlaying) return;

    if (!gaplessRef.current) {
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.gain.value = 1;
      gain.connect(ctx.destination);
      gaplessRef.current = { ctx, gain, stop: () => {} };
    }
    const gapless = gaplessRef.current;
    if (!gapless) return;
    if (gapless.ctx.state === "suspended") {
      await gapless.ctx.resume().catch(() => {});
    }

    setIsPlaying(true);
    try {
      if (view === "level2" && level2Stage === "pickAction") {
        await playAudioSequenceGapless(gapless, el, [
          {
            src: `/tests/${testId}/media/audio/${task.word.audio}`,
            fallbackText: task.word.text,
          },
        ]);
        return;
      }

      let actionToPlay = pickedAction;
      if (!actionToPlay) {
        // Safety net: on very fast clicks after entering the level,
        // the state may not be initialized yet.
        const allowed = getAllowedActionsForTask(task, view);
        const random = allowed.length ? pickRandom(allowed) : null;
        if (!random) return;
        actionToPlay = random;
        setPickedActionAudio(random.audio);
      }

      await playAudioSequenceGapless(gapless, el, [
        {
          src: `/tests/${testId}/media/audio/${task.word.audio}`,
          fallbackText: task.word.text,
        },
        {
          src: `/tests/${testId}/media/audio/${actionToPlay.audio}`,
          fallbackText: actionToPlay.text,
        },
      ]);
      if (view === "level1") setHasListenedLevel1(true);
    } finally {
      setIsPlaying(false);
    }
  }

  async function onYesNo(answer: "yes" | "no") {
    if (!task || !pickedAction || !correctAction) return;
    if (view === "level1" && !hasListenedLevel1) return;
    if (view !== "level1" && view !== "level2") return;
    if (view === "level2" && level2Stage !== "yesno") return;
    if (view === "level2" && isPlaying) return;

    const actionIsCorrect = pickedAction.is_correct;
    const isYes = answer === "yes";
    const isCorrect = actionIsCorrect ? isYes : !isYes;

    if (isCorrect) setCorrectCount((c) => c + 1);
    else setIncorrectCount((c) => c + 1);

    showVerdict(isCorrect);

    if (view === "level1") {
      await goNextOrMenu();
      return;
    }

    // level2:
    if (answer === "yes") {
      await goNextOrMenu();
      return;
    }

    // answer === "no"
    if (actionIsCorrect) {
      // said "no" to correct action => incorrect, and next task
      await goNextOrMenu();
      return;
    }

    // said "no" to incorrect action => correct; go to stage 2
    setMessage(null);
    setLevel2Stage("pickAction");
  }

  async function onPickAction(actionAudio: string) {
    if (view !== "level2") return;
    if (level2Stage !== "pickAction") return;
    if (!task || !correctAction) return;

    const picked = task.actions.find((a) => a.audio === actionAudio) || null;
    if (!picked) return;

    const isCorrect = picked.is_correct;
    if (isCorrect) setCorrectCount((c) => c + 1);
    else setIncorrectCount((c) => c + 1);

    showVerdict(isCorrect);
    await goNextOrMenu();
  }

  function onBackToMenu() {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.src = "";
    }
    const gapless = gaplessRef.current;
    if (gapless) gapless.stop();
    window.speechSynthesis?.cancel?.();
    setView("menu");
    resetRunState();
  }

  function finishTest() {
    onComplete({
      testId: config.id,
      answers: [],
      totalTime: 0,
      correctCount,
      incorrectCount,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
  }

  if (view === "menu") {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 rounded-2xl bg-white p-6 shadow md:p-10">
            <h1 className="text-center text-3xl font-extrabold text-slate-900">
              Выберите уровень сложности
            </h1>
            <p className="mt-2 text-center text-slate-600">
              1 уровень — ответ «да/нет». 2 уровень — при необходимости выберите действие.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                resetRunState();
                // Initialize first task action synchronously to avoid "no sound" on fast clicks.
                const first = TASKS[0];
                if (first) {
                  const allowed = getAllowedActionsForTask(first, "level1");
                  const random = allowed.length ? pickRandom(allowed) : null;
                  setPickedActionAudio(random?.audio ?? null);
                }
                setView("level1");
              }}
              className="rounded-3xl bg-indigo-600 px-8 py-10 text-2xl font-extrabold text-white shadow hover:bg-indigo-700"
            >
              1 уровень
            </button>
            <button
              type="button"
              onClick={() => {
                resetRunState();
                // Initialize first task action synchronously to avoid "no sound" on fast clicks.
                const first = TASKS[0];
                if (first) {
                  const allowed = getAllowedActionsForTask(first, "level2");
                  const random = allowed.length ? pickRandom(allowed) : null;
                  setPickedActionAudio(random?.audio ?? null);
                }
                setView("level2");
              }}
              className="rounded-3xl bg-emerald-600 px-8 py-10 text-2xl font-extrabold text-white shadow hover:bg-emerald-700"
            >
              2 уровень
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!task || !correctAction) return null;

  const yesNoDisabled =
    view === "level1" ? !hasListenedLevel1 : view === "level2" ? isPlaying : false;
  const verdictClass =
    message?.kind === "ok"
      ? "border-green-300 bg-green-50 text-green-800"
      : message?.kind === "bad"
        ? "border-red-300 bg-red-50 text-red-800"
        : "";

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-8">
      <audio ref={audioRef} />
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow">
          <div className="w-full text-xl font-bold text-slate-900">{config.name}</div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onBackToMenu}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              ← Вернуться назад
            </button>
            <select
              value={taskIdx}
              onChange={(e) => setTaskIdx(clampIndex(Number(e.target.value)))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              aria-label="Выбор задания"
            >
              {TASKS.map((t, idx) => (
                <option key={t.id} value={idx}>
                  Задание {t.id}
                </option>
              ))}
            </select>
            <div className="text-lg font-semibold">
              Задание {task.id} из {TASKS.length}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-green-600">✓ {correctCount}</span>
            <span className="font-semibold text-red-600">✗ {incorrectCount}</span>
            <button
              type="button"
              onClick={finishTest}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              Завершить тест
            </button>
          </div>
        </div>

        <div className="mx-auto grid max-w-3xl gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow md:p-6">
            <CardImage testId={testId} image={task.image} alt={task.word.text} />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow md:p-6">
            <button
              type="button"
              onClick={onListenClick}
              disabled={isPlaying}
              className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-4 text-lg font-extrabold text-white hover:bg-indigo-700"
            >
              <span aria-hidden>🔊</span>
              {view === "level2" && level2Stage === "pickAction"
                ? "Слушать слово"
                : "Слушать слово + действие"}
            </button>

            {message ? (
              <div className={["mx-auto mt-4 max-w-sm rounded-xl border px-4 py-3 text-center text-lg font-bold", verdictClass].join(" ")}>
                {message.text}
              </div>
            ) : null}

            {view === "level2" && level2Stage === "pickAction" ? (
              <div className="mt-6">
                <div className="mb-3 text-center text-xl font-extrabold text-slate-900">
                  {task.word.text}...
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {task.actions.slice(0, 3).map((a) => (
                    <button
                      key={a.audio}
                      type="button"
                      onClick={() => onPickAction(a.audio)}
                      className="rounded-full border-2 border-gray-200 bg-white px-6 py-3 text-base font-bold text-gray-900 shadow-sm transition-colors hover:border-indigo-400"
                    >
                      {a.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <div className="mb-3 text-center text-sm font-semibold text-slate-600">
                  {view === "level1"
                    ? "Ответьте «да» если действие подходит, иначе «нет»"
                    : "Сначала ответьте «да/нет»"}
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    disabled={yesNoDisabled}
                    onClick={() => onYesNo("yes")}
                    className={[
                      "w-40 rounded-2xl px-6 py-4 text-xl font-extrabold shadow",
                      yesNoDisabled
                        ? "cursor-not-allowed bg-gray-200 text-gray-500"
                        : "bg-emerald-600 text-white hover:bg-emerald-700",
                    ].join(" ")}
                  >
                    Да
                  </button>
                  <button
                    type="button"
                    disabled={yesNoDisabled}
                    onClick={() => onYesNo("no")}
                    className={[
                      "w-40 rounded-2xl px-6 py-4 text-xl font-extrabold shadow",
                      yesNoDisabled
                        ? "cursor-not-allowed bg-gray-200 text-gray-500"
                        : "bg-rose-600 text-white hover:bg-rose-700",
                    ].join(" ")}
                  >
                    Нет
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

