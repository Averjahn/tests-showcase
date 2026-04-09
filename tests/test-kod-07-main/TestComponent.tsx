/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { TestComponentProps, TestResult } from "../shared/TestInterface";
import { useTestDebugShortcuts } from "../shared/useTestDebugShortcuts";
import { useTestAutoRun } from "../shared/useTestAutoRun";
import { exercises, type Exercise } from "./exercises-data";

type SlotIndex = 0 | 1;
type Outcome = "correct" | "incorrect";

type Placed = {
  word: string;
  verbIndex: number;
  slotIndex: SlotIndex;
  status: Outcome | "pending";
};

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export default function TestKod07Main({ config, onComplete }: TestComponentProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const correctCountRef = useRef(0);
  const incorrectCountRef = useRef(0);

  const startedAtIsoRef = useRef<string>("");
  const elapsedMsRef = useRef(0);
  const completedRef = useRef(false);

  // One slot = one final outcome based on the FIRST evaluation.
  const firstOutcomeRef = useRef<Record<string, Outcome>>({});

  const exercise: Exercise = exercises[currentExerciseIndex]!;
  const words = useMemo(() => shuffle(exercise.allWords), [exercise.id]);

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
    // reset exercise UI
    setPlaced([]);
    setSelectedWord(null);
    setAttempt(0);
    setIsChecking(false);
  }, [currentExerciseIndex]);

  const slotKey = (exerciseId: number, verbIndex: number, slotIndex: SlotIndex) =>
    `${exerciseId}:${verbIndex}:${slotIndex}`;

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

  const isSlotFilled = (verbIndex: number, slotIndex: SlotIndex) =>
    placed.some((p) => p.verbIndex === verbIndex && p.slotIndex === slotIndex);

  const allSlotsFilled = useMemo(() => {
    return exercise.verbs.every((_, vi) => [0, 1].every((si) => isSlotFilled(vi, si as SlotIndex)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed, exercise.id]);

  const availableWords = useMemo(() => {
    const used = new Set(placed.map((p) => p.word));
    return words.filter((w) => !used.has(w));
  }, [words, placed]);

  const placeIntoSlot = (verbIndex: number, slotIndex: SlotIndex) => {
    if (!selectedWord || isChecking) return;
    if (isSlotFilled(verbIndex, slotIndex)) return;

    setPlaced((prev) => [...prev, { word: selectedWord, verbIndex, slotIndex, status: "pending" }]);
    setSelectedWord(null);
  };

  const removePlaced = (verbIndex: number, slotIndex: SlotIndex) => {
    if (isChecking) return;
    setPlaced((prev) => prev.filter((p) => !(p.verbIndex === verbIndex && p.slotIndex === slotIndex)));
  };

  const check = () => {
    if (isChecking) return;
    if (!allSlotsFilled) return;
    setIsChecking(true);

    const normalize = (s: string) => String(s ?? "").trim().toLowerCase();
    const checked = placed.map((p) => {
      const correctPair = exercise.verbs[p.verbIndex]!.correctWords;
      const wordNorm = normalize(p.word);
      const isCorrect = correctPair.some((c) => normalize(c) === wordNorm);
      registerFirst(slotKey(exercise.id, p.verbIndex, p.slotIndex), isCorrect);
      return { ...p, status: isCorrect ? ("correct" as const) : ("incorrect" as const) };
    });
    setPlaced(checked);

    const allCorrect =
      checked.length === exercise.verbs.length * 2 &&
      checked.every((p) => p.status === "correct");

    if (allCorrect) {
      window.setTimeout(() => {
        setIsChecking(false);
        if (currentExerciseIndex < exercises.length - 1) {
          setCurrentExerciseIndex((i) => i + 1);
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

    // retry flow: keep correct, clear incorrect; no new stats on retries
    window.setTimeout(() => {
      if (nextAttempt >= 3) {
        // help mode: keep only correct and leave user with only missing correct words
        const kept = checked.filter((p) => p.status === "correct");
        setPlaced(kept.map((p) => ({ ...p, status: "pending" })));
        setIsChecking(false);
        setSelectedWord(null);
        return;
      }

      setPlaced((prev) =>
        prev.filter((p) => p.status === "correct").map((p) => ({ ...p, status: "pending" })),
      );
      setIsChecking(false);
      setSelectedWord(null);
    }, 1000);
  };

  // dev shortcuts
  const fillCorrect = () => {
    if (isChecking) return;
    const next: Placed[] = [];
    for (let vi = 0; vi < exercise.verbs.length; vi++) {
      const [a, b] = exercise.verbs[vi]!.correctWords;
      next.push({ word: a, verbIndex: vi, slotIndex: 0, status: "pending" });
      next.push({ word: b, verbIndex: vi, slotIndex: 1, status: "pending" });
    }
    setPlaced(next);
    setSelectedWord(null);
  };

  const fillRandom = () => {
    if (isChecking) return;
    const pool = shuffle(exercise.allWords);
    const next: Placed[] = [];
    let idx = 0;
    for (let vi = 0; vi < exercise.verbs.length; vi++) {
      next.push({ word: pool[idx++] ?? "", verbIndex: vi, slotIndex: 0, status: "pending" });
      next.push({ word: pool[idx++] ?? "", verbIndex: vi, slotIndex: 1, status: "pending" });
    }
    setPlaced(next.filter((p) => p.word));
    setSelectedWord(null);
  };

  useTestDebugShortcuts({
    disabled: isChecking,
    onFillRandom: fillRandom,
    onFillCorrect: fillCorrect,
    allowWhenTyping: true,
  });
  useTestAutoRun({
    totalSteps: exercises.length,
    fillRandom,
    fillCorrect,
    submitCurrent: check,
    disabled: isChecking,
  });

  const headerBox: CSSProperties = {
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
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={headerBox}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Словосочетания (действия)</div>
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
            Задание {exercise.id} / {exercises.length}
          </div>
          <button
            type="button"
            onClick={() => {
              // soft reset exercise
              setPlaced([]);
              setSelectedWord(null);
              setAttempt(0);
              setIsChecking(false);
            }}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Сброс
          </button>
        </div>
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
        {availableWords.map((w) => {
          const active = selectedWord === w;
          return (
            <button
              key={w}
              type="button"
              onClick={() => setSelectedWord((prev) => (prev === w ? null : w))}
              disabled={isChecking}
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                border: active ? "2px solid #00CED1" : "2px solid #e5e7eb",
                background: active ? "#e6fffe" : "#f8fafc",
                fontWeight: 900,
                fontSize: 16,
                cursor: isChecking ? "default" : "pointer",
                transform: active ? "translateY(-1px)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {w}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {exercise.verbs.map((v, vi) => {
          const slot0 = placed.find((p) => p.verbIndex === vi && p.slotIndex === 0) ?? null;
          const slot1 = placed.find((p) => p.verbIndex === vi && p.slotIndex === 1) ?? null;
          const slotStyle = (slot: Placed | null): CSSProperties => {
            const base: CSSProperties = {
              minHeight: 52,
              borderRadius: 12,
              border: "2px dashed #cbd5e1",
              background: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 10px",
              cursor: isChecking ? "default" : "pointer",
              fontWeight: 900,
              color: "#0f172a",
              userSelect: "none",
              transition: "all 0.15s ease",
            };
            if (slot?.status === "correct") return { ...base, border: "2px solid #10b981", background: "#ecfdf5" };
            if (slot?.status === "incorrect") return { ...base, border: "2px solid #ef4444", background: "#fef2f2" };
            if (slot?.word) return { ...base, border: "2px solid #00CED1", background: "#e6fffe" };
            return base;
          };

          return (
            <div
              key={vi}
              style={{
                borderRadius: 16,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                padding: 14,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                display: "grid",
                gridTemplateColumns: "180px 1fr 1fr",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 900, color: "#111827" }}>{v.verb}</div>
              <div
                onClick={() => (slot0 ? removePlaced(vi, 0) : placeIntoSlot(vi, 0))}
                style={slotStyle(slot0)}
              >
                {slot0?.word ?? "—"}
              </div>
              <div
                onClick={() => (slot1 ? removePlaced(vi, 1) : placeIntoSlot(vi, 1))}
                style={slotStyle(slot1)}
              >
                {slot1?.word ?? "—"}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
        <button
          type="button"
          onClick={check}
          disabled={!allSlotsFilled || isChecking}
          style={{
            padding: "12px 18px",
            borderRadius: 12,
            border: "1px solid rgba(0, 206, 209, 0.55)",
            background:
              !allSlotsFilled || isChecking
                ? "linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)"
                : "linear-gradient(180deg, #22e3e5 0%, #00ced1 55%, #00b6bc 100%)",
            color: !allSlotsFilled || isChecking ? "#475569" : "#ffffff",
            fontWeight: 900,
            cursor: !allSlotsFilled || isChecking ? "not-allowed" : "pointer",
            boxShadow: !allSlotsFilled || isChecking ? "none" : "0 10px 22px rgba(0, 206, 209, 0.20)",
          }}
        >
          Проверить
        </button>
      </div>
    </div>
  );
}

