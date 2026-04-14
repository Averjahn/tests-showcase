/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { TestComponentProps, TestResult } from "../shared/TestInterface";
import { useTestDebugShortcuts } from "../shared/useTestDebugShortcuts";
import { useTestAutoRun } from "../shared/useTestAutoRun";
import { TASKS, type WordPair } from "./tasks-data";

type Outcome = "correct" | "incorrect";

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export default function TestKod09Main({ config, onComplete }: TestComponentProps) {
  const taskNumbers = useMemo(() => Object.keys(TASKS).map(Number).sort((a, b) => a - b), []);
  const totalWordCount = useMemo(
    () => taskNumbers.reduce((acc, t) => acc + (TASKS[t] ?? []).length, 0),
    [taskNumbers],
  );
  const [taskNo, setTaskNo] = useState<number>(taskNumbers[0] ?? 1);

  const words: WordPair[] = TASKS[taskNo] ?? [];
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(0);
  const selectedWord = selectedWordIndex !== null ? words[selectedWordIndex] : null;

  const [selectedLetterIndex, setSelectedLetterIndex] = useState<number | null>(null);
  const [cells1, setCells1] = useState<Array<string | null>>([]);
  const [cells2, setCells2] = useState<Array<string | null>>([]);
  const [completedWords, setCompletedWords] = useState<Set<number>>(() => new Set());
  const completedWordsRef = useRef<Set<number>>(new Set());
  const [verification, setVerification] = useState<Outcome | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const correctCountRef = useRef(0);
  const incorrectCountRef = useRef(0);

  const startedAtIsoRef = useRef<string>("");
  const elapsedMsRef = useRef(0);
  const completedRef = useRef(false);
  const [isTestCompleted, setIsTestCompleted] = useState(false);

  // One word puzzle = one final outcome based on FIRST verification.
  const firstOutcomeRef = useRef<Record<string, Outcome>>({});

  // Prevent auto-verification from firing during word switches.
  // Without this, we can verify a NEW word using OLD filled cells (race between effects),
  // which looks like: "Правильно!" -> "Неправильно" and breaks stats.
  const skipAutoVerifyRef = useRef(false);

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
    setSelectedWordIndex(0);
    setSelectedLetterIndex(null);
    setCompletedWords(new Set());
    completedWordsRef.current = new Set();
    setVerification(null);
    setIsVerifying(false);
    setCells1([]);
    setCells2([]);
    setCorrectCount(0);
    setIncorrectCount(0);
    correctCountRef.current = 0;
    incorrectCountRef.current = 0;
    firstOutcomeRef.current = {};
    completedRef.current = false;
    setIsTestCompleted(false);
    startedAtIsoRef.current = new Date().toISOString();
    elapsedMsRef.current = 0;
    setElapsedMs(0);
  }, [taskNo]);

  useEffect(() => {
    if (!selectedWord) return;
    // switching word: block auto-verify until cells are truly reset
    skipAutoVerifyRef.current = true;
    setCells1(new Array(selectedWord.original.length).fill(null));
    setCells2(new Array(selectedWord.original.length).fill(null));
    setSelectedLetterIndex(null);
    setVerification(null);
  }, [selectedWordIndex, taskNo]);

  useEffect(() => {
    if (!skipAutoVerifyRef.current) return;
    if (selectedWordIndex === null || !selectedWord) return;
    // once the reset is applied (all empty), allow auto-verify again
    const cleared1 = cells1.length === selectedWord.original.length && cells1.every((c) => c === null);
    const cleared2 =
      selectedWord.multiAnagram === true
        ? cells2.length === selectedWord.original.length && cells2.every((c) => c === null)
        : true;
    if (cleared1 && cleared2) skipAutoVerifyRef.current = false;
  }, [cells1, cells2, selectedWord, selectedWordIndex]);

  const wordKey = (task: number, idx: number) => `${task}:${idx}`;

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

  const canVerifySingle = useMemo(() => cells1.length > 0 && cells1.every((c) => c !== null), [cells1]);
  const canVerifyMulti = useMemo(() => {
    return (
      selectedWord?.multiAnagram === true &&
      cells1.length > 0 &&
      cells2.length > 0 &&
      cells1.every((c) => c !== null) &&
      cells2.every((c) => c !== null)
    );
  }, [cells1, cells2, selectedWord?.multiAnagram]);

  const norm = (s: string) => String(s ?? "").trim().toLowerCase();
  const verifyNow = (wordIdx: number, w: WordPair, c1: string[], c2?: string[]) => {
    const user1 = c1.join("").trim();
    const user2 = c2?.join("").trim();
    const corrects = Array.isArray(w.correct) ? w.correct : [w.correct];
    const match = (a: string, b: string) => norm(a) === norm(b);
    const matchesCorrect = (u: string) => corrects.some((c) => match(u, c));

    let ok = false;
    if (w.multiAnagram && user2) {
      ok = matchesCorrect(user1) && matchesCorrect(user2) && !match(user1, user2);
    } else {
      ok = matchesCorrect(user1);
    }

    const key = wordKey(taskNo, wordIdx);
    registerFirst(key, ok);

    setVerification(ok ? "correct" : "incorrect");
    setIsVerifying(true);

    window.setTimeout(() => {
      if (ok) {
        const nextCompleted = new Set(completedWordsRef.current);
        nextCompleted.add(wordIdx);
        completedWordsRef.current = nextCompleted;
        setCompletedWords(nextCompleted);

        const allDone = words.every((_, idx) => nextCompleted.has(idx));
        if (allDone) {
          if (!completedRef.current) {
            completedRef.current = true;
            setIsTestCompleted(true);
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
          }
          setSelectedWordIndex(null);
          setIsVerifying(false);
          setVerification(null);
          return;
        }

        // move to next incomplete
        const nextIdx = words.findIndex((_, idx) => idx !== wordIdx && !nextCompleted.has(idx));
        setSelectedWordIndex(nextIdx === -1 ? null : nextIdx);
      } else {
        // reset fields but keep selection
        setCells1(new Array(w.original.length).fill(null));
        setCells2(new Array(w.original.length).fill(null));
      }
      setSelectedLetterIndex(null);
      setIsVerifying(false);
      setVerification(null);
    }, 1000);
  };

  useEffect(() => {
    if (isVerifying) return;
    if (!selectedWord || selectedWordIndex === null) return;
    if (skipAutoVerifyRef.current) return;

    if (selectedWord.multiAnagram) {
      if (!canVerifyMulti) return;
      verifyNow(
        selectedWordIndex,
        selectedWord,
        cells1 as string[],
        cells2 as string[],
      );
      return;
    }

    if (!canVerifySingle) return;
    verifyNow(selectedWordIndex, selectedWord, cells1 as string[]);
  }, [canVerifySingle, canVerifyMulti, cells1, cells2, isVerifying, selectedWord, selectedWordIndex, taskNo]);

  const onCellClick = (field: 1 | 2, cellIndex: number) => {
    if (!selectedWord || isVerifying) return;

    const cells = field === 1 ? cells1 : cells2;
    const setCells = field === 1 ? setCells1 : setCells2;

    if (cells[cellIndex] !== null) {
      const next = [...cells];
      next[cellIndex] = null;
      setCells(next);
      setSelectedLetterIndex(null);
      return;
    }

    if (selectedLetterIndex === null) return;
    const next = [...cells];
    next[cellIndex] = selectedWord.original[selectedLetterIndex] ?? null;
    setCells(next);
    setSelectedLetterIndex(null);
  };

  const fillCorrect = () => {
    if (!selectedWord || selectedWordIndex === null || isVerifying) return;
    const corrects = Array.isArray(selectedWord.correct) ? selectedWord.correct : [selectedWord.correct];
    const a = corrects[0] ?? "";
    const b = corrects.find((x) => x !== a) ?? corrects[1] ?? a;
    setCells1(a.split("").map((ch) => ch));
    setCells2(selectedWord.multiAnagram ? b.split("").map((ch) => ch) : []);
    setSelectedLetterIndex(null);
  };

  const fillRandom = () => {
    if (!selectedWord || isVerifying) return;
    const letters = shuffle(selectedWord.original.split(""));
    setCells1(letters.map((ch) => ch));
    setCells2(selectedWord.multiAnagram ? shuffle(selectedWord.original.split("")).map((ch) => ch) : []);
    setSelectedLetterIndex(null);
  };

  useTestDebugShortcuts({
    disabled: isVerifying,
    onFillRandom: fillRandom,
    onFillCorrect: fillCorrect,
    allowWhenTyping: true,
  });
  useTestAutoRun({
    totalSteps: totalWordCount,
    fillRandom,
    fillCorrect,
    submitCurrent: () => {},
    disabled: isVerifying,
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

  const tile: CSSProperties = {
    width: 56,
    height: 56,
    borderRadius: 12,
    border: "2px solid #e5e7eb",
    background: "#f8fafc",
    fontWeight: 900,
    fontSize: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: isVerifying ? "default" : "pointer",
    userSelect: "none",
    transition: "all 0.15s ease",
  };

  const tileActive: CSSProperties = {
    ...tile,
    border: "2px solid #00CED1",
    background: "#e6fffe",
  };

  if (isTestCompleted) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: 20,
            border: "2px solid #10b981",
            padding: 40,
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(16, 185, 129, 0.2)",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 28, color: "#10b981", marginBottom: 24 }}>
            Тест завершён
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ fontWeight: 900, color: "#10b981" }}>Верно: {correctCount}</div>
            <div style={{ fontWeight: 900, color: "#ef4444" }}>Ошибок: {incorrectCount}</div>
            <div style={{ fontWeight: 900, color: "#64748b" }}>
              Время: {Math.floor(elapsedMs / 1000)} с
            </div>
          </div>
          <div style={{ color: "#64748b", fontWeight: 700 }}>
            Результаты отправлены. Можно закрыть страницу или вернуться назад.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={headerBox}>
        <div style={{ width: "100%", fontSize: 20, fontWeight: 900, color: "#0f172a" }}>
          {config.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Анаграммы</div>
          <div style={{ width: 1, height: 22, background: "#e5e7eb" }} />
          <div style={{ fontFamily: "monospace", fontWeight: 900, color: "#0f172a" }}>
            ⏱ {Math.floor(elapsedMs / 1000)}с
          </div>
          <div style={{ width: 1, height: 22, background: "#e5e7eb" }} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, color: "#0f172a" }}>
            Уровень:
            <select
              value={taskNo}
              onChange={(e) => setTaskNo(Number(e.target.value))}
              disabled={isVerifying}
              style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb", fontWeight: 900 }}
            >
              {taskNumbers.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900, color: "#10b981" }}>Верно: {correctCount}</div>
          <div style={{ fontWeight: 900, color: "#ef4444" }}>Ошибок: {incorrectCount}</div>
          <div style={{ fontWeight: 900, color: "#64748b" }}>
            Готово: {completedWords.size} / {words.length}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
        <div
          style={{
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            padding: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            height: "fit-content",
          }}
        >
          <div style={{ fontWeight: 900, color: "#0f172a", marginBottom: 10 }}>Слова</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {words.map((w, idx) => {
              const done = completedWords.has(idx);
              const active = selectedWordIndex === idx;
              return (
                <button
                  key={`${taskNo}-${idx}`}
                  type="button"
                  onClick={() => (!done ? setSelectedWordIndex(idx) : undefined)}
                  disabled={done || isVerifying}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: active ? "2px solid #00CED1" : "2px solid #e5e7eb",
                    background: done ? "#10b981" : active ? "#e6fffe" : "#f8fafc",
                    color: done ? "#ffffff" : "#0f172a",
                    fontWeight: 900,
                    fontSize: 18,
                    cursor: done || isVerifying ? "not-allowed" : "pointer",
                    opacity: done ? 0.9 : 1,
                  }}
                >
                  {w.original}
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            padding: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          {selectedWord ? (
            <>
              <div style={{ textAlign: "center", color: "#64748b", fontWeight: 800, marginBottom: 12 }}>
                Переставьте буквы так, чтобы получилось слово (или два слова)
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                {selectedWord.original.split("").map((ch, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedLetterIndex(idx)}
                    disabled={isVerifying}
                    style={selectedLetterIndex === idx ? tileActive : tile}
                  >
                    {ch}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                  {cells1.map((ch, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onCellClick(1, idx)}
                      disabled={isVerifying}
                      style={{
                        ...tile,
                        background: ch ? "#e6fffe" : "#f1f5f9",
                        border: ch ? "2px solid #00CED1" : "2px dashed #cbd5e1",
                      }}
                    >
                      {ch ?? ""}
                    </button>
                  ))}
                </div>

                {selectedWord.multiAnagram && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                    {cells2.map((ch, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onCellClick(2, idx)}
                        disabled={isVerifying}
                        style={{
                          ...tile,
                          background: ch ? "#e6fffe" : "#f1f5f9",
                          border: ch ? "2px solid #00CED1" : "2px dashed #cbd5e1",
                        }}
                      >
                        {ch ?? ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {verification && (
                <div style={{ marginTop: 16, textAlign: "center", fontWeight: 900, fontSize: 18 }}>
                  {verification === "correct" ? (
                    <span style={{ color: "#10b981" }}>Правильно!</span>
                  ) : (
                    <span style={{ color: "#ef4444" }}>Неправильно</span>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", color: "#64748b", fontWeight: 800, padding: 30 }}>
              Выберите слово слева
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

