/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TestComponentProps, TestResult } from "../shared/TestInterface";
import { useTestDebugShortcuts } from "../shared/useTestDebugShortcuts";
import { useTestAutoRun } from "../shared/useTestAutoRun";
import { exerciseBlocks, type ExerciseBlock } from "./exercise-data";

type Outcome = "correct" | "incorrect";

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function Test04Main({ config, onComplete }: TestComponentProps) {
  const [blockIndex, setBlockIndex] = useState(0);
  const [selectedEnding, setSelectedEnding] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Array<string | null>>([null, null, null]);
  const [statuses, setStatuses] = useState<Array<Outcome | null>>([null, null, null]);
  const [attempt, setAttempt] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  // Prevent auto-check from firing during block switches (race between effects).
  const skipAutoCheckRef = useRef(false);

  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const correctCountRef = useRef(0);
  const incorrectCountRef = useRef(0);

  const startedAtIsoRef = useRef<string>("");
  const elapsedMsRef = useRef(0);
  const completedRef = useRef(false);

  // One fan/slot = one final outcome based on the FIRST evaluation.
  const firstOutcomeRef = useRef<Record<string, Outcome>>({});

  const block: ExerciseBlock = exerciseBlocks[blockIndex]!;
  const [bank, setBank] = useState<string[]>(() => shuffle(block.allEndings));

  useEffect(() => {
    startedAtIsoRef.current = new Date().toISOString();
    elapsedMsRef.current = 0;
    const t = window.setInterval(() => {
      elapsedMsRef.current += 100;
      setElapsedMs(elapsedMsRef.current);
    }, 100);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    // reset per block
    skipAutoCheckRef.current = true;
    setSelectedEnding(null);
    setPlaced([null, null, null]);
    setStatuses([null, null, null]);
    setAttempt(0);
    setIsChecking(false);
    setBank(shuffle(block.allEndings));
  }, [blockIndex]);

  const slotKey = (b: number, i: number) => `${b}:${i}`;

  const registerFirst = (key: string, isCorrect: boolean) => {
    if (firstOutcomeRef.current[key]) return;
    firstOutcomeRef.current[key] = isCorrect ? "correct" : "incorrect";
    if (isCorrect) {
      correctCountRef.current += 1;
      setCorrectCount(correctCountRef.current);
    } else {
      incorrectCountRef.current += 1;
      setIncorrectCount(incorrectCountRef.current);
    }
  };

  const canCheck = useMemo(() => placed.every((x) => !!x), [placed]);
  const isBlockComplete = useMemo(() => statuses.every((s) => s === "correct"), [statuses]);

  const check = (placedEndings: Array<string | null>) => {
    if (!canCheck || isChecking) return;
    setIsChecking(true);

    const norm = (s: string) => String(s ?? "").trim().toLowerCase();
    const nextStatuses: Outcome[] = block.fans.map((fan, idx) => {
      const chosen = String(placedEndings[idx] ?? "").trim();
      const isCorrect = norm(chosen) === norm(fan.correctEnding);
      registerFirst(slotKey(blockIndex, idx), isCorrect);
      return isCorrect ? "correct" : "incorrect";
    });

    setStatuses(nextStatuses);

    const allCorrect = nextStatuses.every((s) => s === "correct");
    if (allCorrect) {
      window.setTimeout(() => {
        setIsChecking(false);
      }, 1000);
      return;
    }

    const nextAttempt = attempt + 1;
    setAttempt(nextAttempt);

    if (nextAttempt === 1) {
      // reset everything
      window.setTimeout(() => {
        setPlaced([null, null, null]);
        setStatuses([null, null, null]);
        setSelectedEnding(null);
        setBank(shuffle(block.allEndings));
        setIsChecking(false);
      }, 1000);
      return;
    }

    if (nextAttempt === 2) {
      // keep correct, reset incorrect
      window.setTimeout(() => {
        const keep: Array<string | null> = [null, null, null];
        const returned: string[] = [];
        for (let i = 0; i < 3; i++) {
          const st = nextStatuses[i];
          const v = placedEndings[i];
          if (st === "correct") keep[i] = v;
          else if (v) returned.push(v);
        }
        setPlaced(keep);
        // Keep already solved fans highlighted green in subsequent attempts.
        setStatuses(nextStatuses.map((s) => (s === "correct" ? "correct" : null)));
        setSelectedEnding(null);
        setBank((prev) => shuffle([...prev.filter((x) => !returned.includes(x)), ...returned]));
        setIsChecking(false);
      }, 1000);
      return;
    }

    // attempt 3+: show only needed correct endings for remaining slots
    window.setTimeout(() => {
      const keep: Array<string | null> = [null, null, null];
      const needed: string[] = [];
      for (let i = 0; i < 3; i++) {
        const st = nextStatuses[i];
        const v = placedEndings[i];
        if (st === "correct") keep[i] = v;
        else needed.push(block.fans[i]!.correctEnding);
      }
      setPlaced(keep);
      // Keep already solved fans highlighted green in subsequent attempts.
      setStatuses(nextStatuses.map((s) => (s === "correct" ? "correct" : null)));
      setSelectedEnding(null);
      setBank(shuffle(needed));
      setIsChecking(false);
    }, 1000);
  };

  useEffect(() => {
    if (skipAutoCheckRef.current) {
      // wait until reset is actually applied (all fans cleared)
      if (placed.every((x) => x === null)) {
        skipAutoCheckRef.current = false;
      }
      return;
    }
    // Prevent re-check loop after the block is already solved.
    if (isBlockComplete) return;
    if (!canCheck) return;
    if (isChecking) return;
    check(placed);
  }, [canCheck, isChecking, placed, isBlockComplete]);

  const pickEnding = (e: string) => {
    if (isChecking) return;
    setSelectedEnding((prev) => (prev === e ? null : e));
  };

  const onFanClick = (fanIndex: number) => {
    if (isChecking) return;
    const current = placed[fanIndex];

    if (current) {
      setPlaced((prev) => {
        const next = [...prev];
        next[fanIndex] = null;
        return next;
      });
      setBank((prev) => shuffle([...prev, current]));
      setStatuses((prev) => {
        const next = [...prev];
        next[fanIndex] = null;
        return next;
      });
      return;
    }

    if (!selectedEnding) return;
    setPlaced((prev) => {
      const next = [...prev];
      next[fanIndex] = selectedEnding;
      return next;
    });
    setBank((prev) => prev.filter((x) => x !== selectedEnding));
    setSelectedEnding(null);
    setStatuses((prev) => {
      const next = [...prev];
      next[fanIndex] = null;
      return next;
    });
  };

  const fillCorrect = () => {
    if (isChecking) return;
    setPlaced(block.fans.map((f) => f.correctEnding));
    setBank([]);
    setSelectedEnding(null);
    setStatuses([null, null, null]);
  };

  const fillRandom = () => {
    if (isChecking) return;
    const pool = shuffle(block.allEndings);
    setPlaced([pool[0] ?? null, pool[1] ?? null, pool[2] ?? null]);
    setBank(pool.slice(3));
    setSelectedEnding(null);
    setStatuses([null, null, null]);
  };

  useTestDebugShortcuts({
    disabled: isChecking,
    onFillRandom: fillRandom,
    onFillCorrect: fillCorrect,
    allowWhenTyping: true,
  });

  const handleNextBlock = () => {
    if (isChecking) return;
    if (!isBlockComplete) return;
    if (blockIndex >= exerciseBlocks.length - 1) return;
    setBlockIndex((b) => b + 1);
  };

  const finishTest = () => {
    if (isChecking) return;
    if (completedRef.current) return;
    completedRef.current = true;
    const result: TestResult = {
      testId: config.id,
      answers: [],
      totalTime: elapsedMsRef.current,
      correctCount: correctCountRef.current,
      incorrectCount: incorrectCountRef.current,
      startedAt: startedAtIsoRef.current || new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    onComplete(result);
  };

  useTestAutoRun({
    totalSteps: exerciseBlocks.length,
    fillRandom,
    fillCorrect,
    submitCurrent: handleNextBlock,
    disabled: isChecking,
  });

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header (same pattern as test-02-main) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow">
        <div className="w-full text-xl font-bold text-slate-900">
          {typeof config.seqNum === "number" ? `${config.seqNum}. ` : ""}
          {config.name}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={blockIndex}
            onChange={(e) => setBlockIndex(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            aria-label="Выбор задания"
          >
            {exerciseBlocks.map((_, idx) => (
              <option key={idx} value={idx}>
                Задание {idx + 1}
              </option>
            ))}
          </select>
          <div className="text-lg font-semibold">
            Задание {blockIndex + 1} из {exerciseBlocks.length}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-semibold text-green-600">✓ {correctCount}</span>
          <span className="font-semibold text-red-600">✗ {incorrectCount}</span>
          <span className="font-mono">{formatTime(Math.floor(elapsedMs / 1000))}</span>
          <button
            type="button"
            onClick={finishTest}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Завершить тест
          </button>
        </div>
      </div>

      {/* Instruction (as in screenshot) */}
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 28, fontWeight: 500, color: "#0f172a", lineHeight: 1.1 }}>Найти окончания слов</div>
        <div style={{ marginTop: 6, fontSize: 16, fontWeight: 600, color: "#334155" }}>
          Выберите слог и подставьте его в конец слова
        </div>
      </div>

      {/* Bank */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 24 }}>
        {bank.map((ending, idx) => {
          const active = selectedEnding === ending;
          const disabled = isChecking || placed.includes(ending);
          return (
            <button
              key={`${ending}-${idx}`}
              type="button"
              onClick={() => pickEnding(ending)}
              disabled={disabled}
              style={{
                borderRadius: 8,
                border: "2px solid transparent",
                borderColor: active ? "#60a5fa" : "transparent",
                background: active ? "#ffffff" : "#f1f5f9",
                color: "#0f172a",
                padding: "8px 14px",
                fontSize: 20,
                fontWeight: 500,
                boxShadow: active ? "0 0 0 3px rgba(96,165,250,0.35)" : "none",
                transition: "box-shadow 120ms ease, background-color 120ms ease, border-color 120ms ease, opacity 120ms ease",
                opacity: disabled ? 0.45 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {ending}
            </button>
          );
        })}
      </div>

      {/* Fans (blue dotted boxes with rows) */}
      <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-8 md:grid-cols-3">
        {block.fans.map((fan, idx) => {
          const st = statuses[idx];
          const isCorrect = st === "correct";
          const isIncorrect = st === "incorrect";
          const borderColor = isCorrect ? "#10b981" : isIncorrect ? "#ef4444" : "#7dd3fc";
          const bg = isCorrect ? "#ecfdf5" : isIncorrect ? "#fee2e2" : "#e0f2fe";
          const borderStyle = isCorrect || isIncorrect ? "solid" : "dashed";
          const borderWidth = isCorrect || isIncorrect ? 2 : 1;
          const chosenEnding = placed[idx];
          const fanLocked = isChecking;

          return (
            <div
              key={idx}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onFanClick(idx)}
              style={{
                borderRadius: 12,
                border: `${borderWidth}px ${borderStyle} ${borderColor}`,
                background: bg,
                padding: 36,
                cursor: fanLocked ? "default" : "pointer",
                userSelect: "none",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {fan.beginnings.map((b) => {
                  const showSolvedWord = isCorrect && !!chosenEnding;
                  const showCombinedWord = !isCorrect && !!chosenEnding;
                  return (
                    <div key={b} style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 26 }}>
                      {showSolvedWord ? (
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 500,
                            color: "#0f172a",
                            whiteSpace: "nowrap",
                            lineHeight: "normal",
                          }}
                        >
                          {b}
                          {chosenEnding}
                        </div>
                      ) : (
                        <>
                          {showCombinedWord ? (
                            <div
                              style={{
                                fontSize: 22,
                                fontWeight: 500,
                                color: "#0f172a",
                                whiteSpace: "nowrap",
                                lineHeight: "normal",
                              }}
                            >
                              {b} {chosenEnding}
                            </div>
                          ) : (
                            <>
                              <div style={{ fontSize: 22, fontWeight: 500, color: "#0f172a", whiteSpace: "nowrap" }}>{b}</div>
                              <div
                                style={{
                                  flex: "0 0 48px",
                                  position: "relative",
                                  height: 22,
                                  display: "flex",
                                  alignItems: "flex-end",
                                  marginLeft: 8,
                                  marginRight: 8,
                                }}
                              >
                                <div
                                  style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    bottom: 2,
                                    borderBottom: "2px solid #0f172a",
                                    opacity: 0.9,
                                  }}
                                />
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {isBlockComplete && !isChecking && blockIndex < exerciseBlocks.length - 1 && (
        <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            onClick={handleNextBlock}
            disabled={isChecking}
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
              cursor: isChecking ? "default" : "pointer",
              opacity: isChecking ? 0.6 : 1,
            }}
          >
            Дальше &gt;
          </button>
        </div>
      )}

      {isBlockComplete && !isChecking && blockIndex === exerciseBlocks.length - 1 && (
        <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={finishTest}
            disabled={isChecking}
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
              cursor: isChecking ? "default" : "pointer",
              opacity: isChecking ? 0.6 : 1,
            }}
          >
            Завершить
          </button>
        </div>
      )}
    </div>
  );
}

