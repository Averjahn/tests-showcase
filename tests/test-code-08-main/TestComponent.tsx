/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { TestComponentProps, TestResult } from "../shared/TestInterface";
import { useTestDebugShortcuts } from "../shared/useTestDebugShortcuts";
import { useTestAutoRun } from "../shared/useTestAutoRun";
import { prefixTasks, type PrefixTask } from "./tasks-data";

type Outcome = "correct" | "incorrect";

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export default function TestCode08Main({ config, onComplete }: TestComponentProps) {
  const [taskIndex, setTaskIndex] = useState(0);
  const task: PrefixTask = prefixTasks[taskIndex]!;

  const [selectedPrefix, setSelectedPrefix] = useState<string | null>(null);
  const [selectedBlankIndex, setSelectedBlankIndex] = useState<number | null>(null);
  const [filled, setFilled] = useState<Array<string | null>>([]);
  const [lockedCorrect, setLockedCorrect] = useState<boolean[]>([]);
  const [validation, setValidation] = useState<Array<boolean | null>>([]);
  const [attempt, setAttempt] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  // Prevent auto-validate from firing during task switches (race between effects).
  const skipAutoValidateRef = useRef(false);

  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const correctCountRef = useRef(0);
  const incorrectCountRef = useRef(0);

  const startedAtIsoRef = useRef<string>("");
  const elapsedMsRef = useRef(0);
  const completedRef = useRef(false);

  // One blank = one final outcome based on the FIRST validation.
  const firstOutcomeRef = useRef<Record<string, Outcome>>({});

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
    const n = task.sentences.length;
    skipAutoValidateRef.current = true;
    setFilled(new Array(n).fill(null));
    setLockedCorrect(new Array(n).fill(false));
    setValidation(new Array(n).fill(null));
    setSelectedPrefix(null);
    setSelectedBlankIndex(null);
    setAttempt(0);
    setIsValidating(false);
  }, [taskIndex]);

  const blankKey = (taskId: number, idx: number) => `${taskId}:${idx}`;

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

  const allFilled = useMemo(() => filled.length > 0 && filled.every((v) => v !== null), [filled]);

  const validate = () => {
    if (!allFilled || isValidating) return;
    setIsValidating(true);

    const norm = (s: string | null) => String(s ?? "").trim().toLowerCase();
    const results: boolean[] = filled.map((val, idx) => {
      if (lockedCorrect[idx]) return true;
      const correct = task.sentences[idx]!.correctPrefix;
      return norm(val) === norm(correct);
    });

    // stats: register first outcome per blank (only once)
    for (let i = 0; i < results.length; i++) {
      if (lockedCorrect[i]) continue;
      registerFirst(blankKey(task.id, i), results[i]!);
    }

    setValidation(results);
    const allCorrect = results.every(Boolean);

    if (allCorrect) {
      window.setTimeout(() => {
        setIsValidating(false);
        if (taskIndex < prefixTasks.length - 1) {
          setTaskIndex((i) => i + 1);
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

    if (nextAttempt >= 3) {
      // lock correct ones; clear incorrect
      const newLocked = results.map((r) => r);
      const newFilled = filled.map((v, idx) => (results[idx] ? v : null));
      setLockedCorrect(newLocked);
      window.setTimeout(() => {
        setFilled(newFilled);
        setValidation(new Array(task.sentences.length).fill(null));
        setSelectedPrefix(null);
        setSelectedBlankIndex(null);
        setIsValidating(false);
      }, 1000);
      return;
    }

    // reset everything on retry
    window.setTimeout(() => {
      setFilled(new Array(task.sentences.length).fill(null));
      setValidation(new Array(task.sentences.length).fill(null));
      setSelectedPrefix(null);
      setSelectedBlankIndex(null);
      setIsValidating(false);
    }, 1000);
  };

  useEffect(() => {
    if (skipAutoValidateRef.current) {
      // wait until reset is actually applied (all blanks cleared)
      if (filled.length === task.sentences.length && filled.every((v) => v === null)) {
        skipAutoValidateRef.current = false;
      }
      return;
    }
    if (!allFilled) return;
    if (isValidating) return;
    validate();
  }, [allFilled, isValidating, filled, taskIndex, task.sentences.length]);

  const onPrefixClick = (p: string) => {
    if (isValidating) return;
    if (selectedBlankIndex !== null) {
      if (lockedCorrect[selectedBlankIndex]) return;
      setFilled((prev) => {
        const next = [...prev];
        next[selectedBlankIndex] = p;
        return next;
      });
      setSelectedPrefix(null);
      setSelectedBlankIndex(null);
      return;
    }
    setSelectedPrefix((prev) => (prev === p ? null : p));
  };

  const onBlankClick = (idx: number) => {
    if (isValidating) return;
    if (lockedCorrect[idx]) return;

    if (selectedPrefix) {
      setFilled((prev) => {
        const next = [...prev];
        next[idx] = selectedPrefix;
        return next;
      });
      setSelectedPrefix(null);
      setSelectedBlankIndex(null);
      return;
    }

    setSelectedBlankIndex((prev) => (prev === idx ? null : idx));
  };

  const clearBlank = (idx: number) => {
    if (isValidating) return;
    if (lockedCorrect[idx]) return;
    setFilled((prev) => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });
  };

  const fillCorrect = () => {
    if (isValidating) return;
    setFilled(task.sentences.map((s) => s.correctPrefix));
    setSelectedPrefix(null);
    setSelectedBlankIndex(null);
    setValidation(new Array(task.sentences.length).fill(null));
  };

  const fillRandom = () => {
    if (isValidating) return;
    const pool = shuffle(task.prefixes);
    setFilled(task.sentences.map((_, idx) => pool[idx % pool.length] ?? null));
    setSelectedPrefix(null);
    setSelectedBlankIndex(null);
    setValidation(new Array(task.sentences.length).fill(null));
  };

  useTestDebugShortcuts({
    disabled: isValidating,
    onFillRandom: fillRandom,
    onFillCorrect: fillCorrect,
    allowWhenTyping: true,
  });
  useTestAutoRun({
    totalSteps: prefixTasks.length,
    fillRandom,
    fillCorrect,
    submitCurrent: () => {},
    disabled: isValidating,
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
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Глагол с приставками</div>
          <div style={{ width: 1, height: 22, background: "#e5e7eb" }} />
          <div style={{ fontFamily: "monospace", fontWeight: 900, color: "#0f172a" }}>
            ⏱ {Math.floor(elapsedMs / 1000)}с
          </div>
          <div style={{ width: 1, height: 22, background: "#e5e7eb" }} />
          <div style={{ fontWeight: 900, color: "#0f172a" }}>
            Задание {task.id} / {prefixTasks.length}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900, color: "#10b981" }}>Верно: {correctCount}</div>
          <div style={{ fontWeight: 900, color: "#ef4444" }}>Ошибок: {incorrectCount}</div>
          <div style={{ fontWeight: 900, color: "#64748b" }}>Попытка: {Math.min(attempt + 1, 3)} / 3</div>
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 18, fontWeight: 900, color: "#334155", marginBottom: 12 }}>
        Добавьте приставку к глаголу
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
        {task.prefixes.map((p, pIdx) => {
          const used = filled.includes(p);
          const active = selectedPrefix === p;
          const highlight = selectedBlankIndex !== null && !used;
          return (
            <button
              key={`${p}-${pIdx}`}
              type="button"
              onClick={() => (!used ? onPrefixClick(p) : undefined)}
              disabled={used || isValidating}
              style={{
                minWidth: 92,
                padding: "12px 14px",
                borderRadius: 14,
                border: active || highlight ? "2px solid #00CED1" : "2px solid #e5e7eb",
                background: used ? "#e2e8f0" : active ? "#e6fffe" : "#f8fafc",
                fontWeight: 900,
                fontSize: 18,
                cursor: used || isValidating ? "not-allowed" : "pointer",
                opacity: used ? 0.55 : 1,
                transition: "all 0.15s ease",
              }}
            >
              {p}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {task.sentences.map((s, idx) => {
          const parts = s.text.split("___");
          const val = filled[idx];
          const isLocked = lockedCorrect[idx];
          const v = validation[idx];
          const isCorrect = v === true || isLocked;
          const isIncorrect = v === false;
          const blankActive = selectedBlankIndex === idx;
          const canPlaceHere = selectedPrefix !== null && val === null;

          const cardBorder =
            isCorrect ? "#10b981" : isIncorrect ? "#ef4444" : blankActive || canPlaceHere ? "#00CED1" : "#e5e7eb";
          const cardBg = isCorrect ? "#ecfdf5" : isIncorrect ? "#fef2f2" : "#ffffff";

          return (
            <div
              key={idx}
              style={{
                borderRadius: 16,
                border: `1px solid ${cardBorder}`,
                background: cardBg,
                padding: 14,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: 800, color: "#0f172a" }}>{parts[0]}</span>
              <button
                type="button"
                onClick={() => (val ? clearBlank(idx) : onBlankClick(idx))}
                disabled={isValidating || isLocked}
                style={{
                  minWidth: 88,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: isCorrect ? "2px solid #10b981" : isIncorrect ? "2px solid #ef4444" : "2px solid #cbd5e1",
                  background: val ? "#e6fffe" : "#f1f5f9",
                  fontWeight: 900,
                  fontSize: 18,
                  cursor: isValidating || isLocked ? "not-allowed" : "pointer",
                  opacity: isLocked ? 0.75 : 1,
                }}
              >
                {val ?? "___"}
              </button>
              <span style={{ fontWeight: 800, color: "#0f172a" }}>{parts[1] ?? ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

