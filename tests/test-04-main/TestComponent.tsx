/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
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
        if (blockIndex < exerciseBlocks.length - 1) {
          setBlockIndex((b) => b + 1);
          return;
        }
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
        setStatuses([null, null, null]);
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
      setStatuses([null, null, null]);
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
    if (!canCheck) return;
    if (isChecking) return;
    check(placed);
  }, [canCheck, isChecking, placed]);

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
  useTestAutoRun({
    totalSteps: exerciseBlocks.length,
    fillRandom,
    fillCorrect,
    submitCurrent: () => {},
    disabled: isChecking,
  });

  const endingBtnStyle = (ending: string): CSSProperties => {
    const active = selectedEnding === ending;
    const placedSomewhere = placed.includes(ending);
    return {
      padding: "10px 14px",
      borderRadius: 14,
      border: active ? "2px solid #00CED1" : "2px solid #e5e7eb",
      background: placedSomewhere ? "#e2e8f0" : active ? "#e6fffe" : "#f8fafc",
      fontWeight: 900,
      fontSize: 18,
      cursor: isChecking || placedSomewhere ? "not-allowed" : "pointer",
      opacity: placedSomewhere ? 0.6 : 1,
      transition: "all 0.15s ease",
      userSelect: "none",
    };
  };

  const fanSlotStyle = (fanIndex: number): CSSProperties => {
    const st = statuses[fanIndex];
    const base: CSSProperties = {
      minHeight: 58,
      borderRadius: 14,
      border: "2px dashed #cbd5e1",
      background: "#f8fafc",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px 12px",
      cursor: isChecking ? "default" : "pointer",
      fontWeight: 900,
      fontSize: 18,
      color: "#0f172a",
      userSelect: "none",
      transition: "all 0.15s ease",
    };
    if (st === "correct") return { ...base, border: "2px solid #10b981", background: "#ecfdf5" };
    if (st === "incorrect") return { ...base, border: "2px solid #ef4444", background: "#fef2f2" };
    if (placed[fanIndex]) return { ...base, border: "2px solid #00CED1", background: "#e6fffe" };
    return base;
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          padding: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>С 3.3 — Найти окончание слов</div>
          <div style={{ width: 1, height: 22, background: "#e5e7eb" }} />
          <div style={{ fontFamily: "monospace", fontWeight: 900, color: "#0f172a" }}>
            ⏱ {Math.floor(elapsedMs / 1000)}с
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900, color: "#10b981" }}>Верно: {correctCount}</div>
          <div style={{ fontWeight: 900, color: "#ef4444" }}>Ошибок: {incorrectCount}</div>
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              fontWeight: 900,
            }}
          >
            Блок {blockIndex + 1} / {exerciseBlocks.length}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 18, fontWeight: 900, color: "#334155", marginBottom: 12 }}>
        Выберите окончание и поставьте его на нужный «веер»
      </div>

      <div
        style={{
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          padding: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "center",
        }}
      >
        {bank.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => pickEnding(e)}
            disabled={isChecking || placed.includes(e)}
            style={endingBtnStyle(e)}
          >
            {e}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {block.fans.map((fan, idx) => (
          <div
            key={idx}
            style={{
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              padding: 16,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 10 }}>
              {fan.beginnings.map((b) => (
                <span
                  key={b}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid #e5e7eb",
                    background: "#f8fafc",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {b}
                </span>
              ))}
            </div>

            <div onClick={() => onFanClick(idx)} style={fanSlotStyle(idx)}>
              {placed[idx] ?? "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

