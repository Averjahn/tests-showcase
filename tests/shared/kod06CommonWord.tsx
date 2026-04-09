/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { TestComponentProps, TestResult } from "./TestInterface";
import { useTestDebugShortcuts } from "./useTestDebugShortcuts";
import { useTestAutoRun } from "./useTestAutoRun";

export type Kod06Exercise = {
  id: number;
  availableWords: string[];
  columns: Array<{
    answer: string;
    words: string[];
  }>;
};

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Нормализация для сравнения ответа: trim, нижний регистр, NFKC (одинаковые символы). */
function normalizeAnswer(s: string): string {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKC");
}

type Outcome = "correct" | "incorrect";

export function createKod06CommonWordTestComponent(opts: {
  title: string;
  subtitle?: string;
  exercises: Kod06Exercise[];
}) {
  const { title, subtitle, exercises } = opts;

  return function Kod06CommonWordTest({ config, onComplete }: TestComponentProps) {
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [availableWords, setAvailableWords] = useState<string[]>(() =>
      shuffle(exercises[0]?.availableWords ?? []),
    );

    const [placed, setPlaced] = useState<Array<string | null>>([null, null, null]);
    const [statuses, setStatuses] = useState<Array<Outcome | null>>([
      null,
      null,
      null,
    ]);
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

    // One slot = one outcome (first evaluation only), like test-01 / test-02.
    const firstOutcomeByFieldRef = useRef<Record<string, Outcome>>({});
    // Avoid running check during reset; clear only when placed is actually empty (like test-01).
    const skipAutoCheckRef = useRef(false);

    const exercise = exercises[currentExerciseIndex]!;

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
      skipAutoCheckRef.current = true;
      setSelectedWord(null);
      setAttempt(0);
      setIsChecking(false);
      setPlaced([null, null, null]);
      setStatuses([null, null, null]);
      setAvailableWords(shuffle(exercise.availableWords ?? []));
    }, [currentExerciseIndex]);

    const fieldKey = (exerciseId: number, columnIndex: number) =>
      `${exerciseId}:${columnIndex}`;

    const registerFirstOutcome = (key: string, isCorrect: boolean) => {
      if (firstOutcomeByFieldRef.current[key]) return;
      firstOutcomeByFieldRef.current[key] = isCorrect ? "correct" : "incorrect";
      if (isCorrect) {
        correctCountRef.current += 1;
        setCorrectCount(correctCountRef.current);
      } else {
        incorrectCountRef.current += 1;
        setIncorrectCount(incorrectCountRef.current);
      }
    };

    const canCheck = useMemo(
      () => placed.every((v) => typeof v === "string" && v.length > 0),
      [placed],
    );

    // Check first, then (in timeouts) clear — same order as test-01 handleCheck.
    const handleCheck = () => {
      if (isChecking) return;
      if (!placed[0] || !placed[1] || !placed[2]) return;

      setIsChecking(true);

      // 1) Compute correctness from current placed; register FIRST outcome per column only.
      const nextStatuses: Array<Outcome> = exercise.columns.map((col, idx) => {
        const w = String(placed[idx] ?? "").trim();
        const expected = String(col.answer ?? "").trim();
        const isCorrect = normalizeAnswer(w) === normalizeAnswer(expected);
        registerFirstOutcome(fieldKey(exercise.id, idx), isCorrect);
        return isCorrect ? "correct" : "incorrect";
      });

      // 2) Show result; only after that we clear in timeouts below.
      setStatuses(nextStatuses);

      const allCorrect = nextStatuses.every((s) => s === "correct");

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

      if (nextAttempt === 1) {
        window.setTimeout(() => {
          setPlaced([null, null, null]);
          setStatuses([null, null, null]);
          setSelectedWord(null);
          setAvailableWords(shuffle(exercise.availableWords ?? []));
          setIsChecking(false);
        }, 1000);
        return;
      }

      if (nextAttempt === 2) {
        window.setTimeout(() => {
          const keep: Array<string | null> = [null, null, null];
          const returned: string[] = [];
          for (let i = 0; i < 3; i++) {
            const st = nextStatuses[i];
            const w = placed[i];
            if (st === "correct") keep[i] = w;
            else if (w) returned.push(w);
          }
          setPlaced(keep);
          setStatuses([null, null, null]);
          setSelectedWord(null);
          setAvailableWords((prev) => shuffle([...prev, ...returned]));
          setIsChecking(false);
        }, 1000);
        return;
      }

      window.setTimeout(() => {
        const keep: Array<string | null> = [null, null, null];
        const needed: string[] = [];
        for (let i = 0; i < 3; i++) {
          const st = nextStatuses[i];
          const w = placed[i];
          if (st === "correct") keep[i] = w;
          else {
            const ans = exercise.columns[i]?.answer ?? "";
            needed.push(ans);
          }
        }
        setPlaced(keep);
        setStatuses([null, null, null]);
        setSelectedWord(null);
        setAvailableWords(shuffle(needed));
        setIsChecking(false);
      }, 1000);
    };

    // Auto-check when all columns filled (same pattern as test-01: skip until reset applied).
    useEffect(() => {
      if (skipAutoCheckRef.current) {
        if (placed[0] === null && placed[1] === null && placed[2] === null) {
          skipAutoCheckRef.current = false;
        }
        return;
      }
      if (!canCheck) return;
      if (isChecking) return;
      handleCheck();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [placed]);

    const onPickWord = (w: string) => {
      if (isChecking) return;
      setSelectedWord(w);
    };

    const onColumnClick = (idx: number) => {
      if (isChecking) return;
      const current = placed[idx];

      // remove existing
      if (current) {
        setPlaced((prev) => {
          const next = [...prev];
          next[idx] = null;
          return next;
        });
        setAvailableWords((prev) => shuffle([...prev, current]));
        setStatuses((prev) => {
          const next = [...prev];
          next[idx] = null;
          return next;
        });
        return;
      }

      if (!selectedWord) return;

      setPlaced((prev) => {
        const next = [...prev];
        next[idx] = selectedWord;
        return next;
      });
      setAvailableWords((prev) => prev.filter((x) => x !== selectedWord));
      setSelectedWord(null);
      setStatuses((prev) => {
        const next = [...prev];
        next[idx] = null;
        return next;
      });
    };

    const fillCorrect = () => {
      if (isChecking) return;
      const answers = exercise.columns.map((c) => c.answer);
      setPlaced([answers[0] ?? null, answers[1] ?? null, answers[2] ?? null]);
      setAvailableWords([]);
      setSelectedWord(null);
      setStatuses([null, null, null]);
    };

    const fillRandom = () => {
      if (isChecking) return;
      const pool = shuffle(exercise.availableWords ?? []);
      setPlaced([pool[0] ?? null, pool[1] ?? null, pool[2] ?? null]);
      setAvailableWords(pool.slice(3));
      setSelectedWord(null);
      setStatuses([null, null, null]);
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
      submitCurrent: handleCheck,
      disabled: isChecking,
    });

    if (!exercise) return <div>Нет заданий</div>;

    const cellStyle = (idx: number): CSSProperties => {
      const st = statuses[idx];
      const base: CSSProperties = {
        minHeight: 64,
        borderRadius: 14,
        border: "2px dashed #cbd5e1",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 12px",
        cursor: isChecking ? "default" : "pointer",
        fontSize: 22,
        fontWeight: 800,
        color: "#0f172a",
        userSelect: "none",
        transition: "all 0.15s ease",
      };
      if (st === "correct") return { ...base, border: "2px solid #10b981", background: "#ecfdf5" };
      if (st === "incorrect") return { ...base, border: "2px solid #ef4444", background: "#fef2f2" };
      if (placed[idx]) return { ...base, border: "2px solid #00CED1", background: "#e6fffe" };
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
          <div style={{ width: "100%", fontSize: 20, fontWeight: 900, color: "#0f172a" }}>
            {config.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900, color: "#0f172a" }}>{title}</div>
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
              Задание {currentExerciseIndex + 1} / {exercises.length}
            </div>
          </div>
        </div>

        {subtitle && (
          <div style={{ textAlign: "center", fontSize: 18, fontWeight: 900, color: "#334155", marginBottom: 12 }}>
            {subtitle}
          </div>
        )}

        {/* Word bank */}
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
                onClick={() => onPickWord(w)}
                disabled={isChecking}
                style={{
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: active ? "2px solid #00CED1" : "2px solid #e5e7eb",
                  background: active ? "#e6fffe" : "#f8fafc",
                  fontWeight: 900,
                  fontSize: 18,
                  cursor: isChecking ? "default" : "pointer",
                  transform: active ? "translateY(-1px)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {w}
              </button>
            );
          })}
          {availableWords.length === 0 && (
            <div style={{ color: "#64748b", fontWeight: 700 }}>Слова закончились</div>
          )}
        </div>

        {/* Columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 18,
          }}
        >
          {exercise.columns.map((col, idx) => (
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
              <div style={{ textAlign: "center", fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>
                {col.words.join(" • ")}
              </div>

              <div onClick={() => onColumnClick(idx)} style={cellStyle(idx)}>
                {placed[idx] ?? "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
}

