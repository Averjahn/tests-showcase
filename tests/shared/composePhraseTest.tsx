"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import type { TestComponentProps, TestResult } from "./TestInterface";
import { useTestDebugShortcuts } from "./useTestDebugShortcuts";
import { useTestAutoRun } from "./useTestAutoRun";

export type Phrase = {
  id: number;
  subject: string;
  verb: string;
  object: string;
  mediaPath: string;
};

export type ComposePhraseTask = {
  id: number;
  title: string;
  phrases: Phrase[];
};

type Zone = "subject" | "verb" | "object";

function isVideo(path: string) {
  const p = path.toLowerCase();
  return p.endsWith(".mp4") || p.endsWith(".webm") || p.endsWith(".mov") || p.endsWith(".m4v");
}

function MediaViewer({ src, alt }: { src: string; alt: string }) {
  if (isVideo(src)) {
    return (
      <video
        src={src}
        controls
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
          background: "#ffffff",
        }}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 1100px) 100vw, 1100px"
      style={{ objectFit: "contain" }}
    />
  );
}

export function createComposePhraseTestComponent(tasksData: ComposePhraseTask[]) {
  const task = tasksData[0];
  if (!task) throw new Error("createComposePhraseTestComponent: tasksData must not be empty");

  return function ComposePhraseTest({ config, onComplete }: TestComponentProps) {
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [attemptCount, setAttemptCount] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const correctCountRef = useRef(0);
    const incorrectCountRef = useRef(0);
    const [elapsedSec, setElapsedSec] = useState(0);
    const [availableWords, setAvailableWords] = useState<string[]>([]);
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [dropped, setDropped] = useState<Record<Zone, string | null>>({
      subject: null,
      verb: null,
      object: null,
    });
    const [validation, setValidation] = useState<Record<Zone, boolean | null>>({
      subject: null,
      verb: null,
      object: null,
    });
    const [isChecking, setIsChecking] = useState(false);
    const startMsRef = useRef<number>(0);
    const skipAutoCheckRef = useRef(false);
    const slotFirstOutcomeRef = useRef<Record<string, "correct" | "incorrect">>({});

    const phrase = task.phrases[currentPhraseIndex];
    const total = task.phrases.length;
    const wordsForPhrase = useMemo(
      () => (phrase ? [phrase.subject, phrase.verb, phrase.object] : []),
      [phrase]
    );

    const fillCorrect = () => {
      if (isChecking || !phrase) return;
      setAttemptCount(0);
      setSelectedWord(null);
      setValidation({ subject: null, verb: null, object: null });
      setIsChecking(false);
      setAvailableWords([]);
      setDropped({ subject: phrase.subject, verb: phrase.verb, object: phrase.object });
    };

    const fillRandom = () => {
      if (isChecking || !phrase) return;
      const shuffled = [...wordsForPhrase].sort(() => Math.random() - 0.5);
      setAttemptCount(0);
      setSelectedWord(null);
      setValidation({ subject: null, verb: null, object: null });
      setIsChecking(false);
      setAvailableWords([]);
      setDropped({
        subject: shuffled[0] ?? null,
        verb: shuffled[1] ?? null,
        object: shuffled[2] ?? null,
      });
    };

    useTestDebugShortcuts({
      disabled: isChecking,
      onFillRandom: fillRandom,
      onFillCorrect: fillCorrect,
    });
    useTestAutoRun({
      totalSteps: total,
      fillRandom,
      fillCorrect,
      submitCurrent: () => {},
      disabled: isChecking,
    });

    useEffect(() => {
      startMsRef.current = Date.now();
      const t = window.setInterval(() => setElapsedSec((s) => s + 1), 1000);
      return () => clearInterval(t);
    }, []);

    useEffect(() => {
      skipAutoCheckRef.current = true;
      if (phrase) {
        setAvailableWords([...wordsForPhrase].sort(() => Math.random() - 0.5));
      }
      setDropped({ subject: null, verb: null, object: null });
      setValidation({ subject: null, verb: null, object: null });
      setAttemptCount(0);
      setSelectedWord(null);
      setIsChecking(false);
    }, [currentPhraseIndex, wordsForPhrase]);

    useEffect(() => {
      if (skipAutoCheckRef.current) {
        if (!dropped.subject && !dropped.verb && !dropped.object) skipAutoCheckRef.current = false;
        return;
      }
      if (!dropped.subject || !dropped.verb || !dropped.object || !phrase) return;
      if (isChecking) return;

      setIsChecking(true);
      const isSubjectCorrect = dropped.subject === phrase.subject;
      const isVerbCorrect = dropped.verb === phrase.verb;
      const isObjectCorrect = dropped.object === phrase.object;
      const allCorrect = isSubjectCorrect && isVerbCorrect && isObjectCorrect;

      const registerFirstOutcome = (key: string, isCorrect: boolean) => {
        if (slotFirstOutcomeRef.current[key]) return;
        slotFirstOutcomeRef.current[key] = isCorrect ? "correct" : "incorrect";
        if (isCorrect) {
          correctCountRef.current += 1;
          setCorrectCount(correctCountRef.current);
        } else {
          incorrectCountRef.current += 1;
          setIncorrectCount(incorrectCountRef.current);
        }
      };

      registerFirstOutcome(`${currentPhraseIndex}:subject`, isSubjectCorrect);
      registerFirstOutcome(`${currentPhraseIndex}:verb`, isVerbCorrect);
      registerFirstOutcome(`${currentPhraseIndex}:object`, isObjectCorrect);

      setValidation({ subject: isSubjectCorrect, verb: isVerbCorrect, object: isObjectCorrect });

      if (allCorrect) {
        setTimeout(() => {
          if (currentPhraseIndex < total - 1) {
            setIsChecking(false);
            setCurrentPhraseIndex((i) => i + 1);
          } else {
            const result: TestResult = {
              testId: config.id,
              answers: [],
              totalTime: Date.now() - startMsRef.current,
              correctCount: correctCountRef.current,
              incorrectCount: incorrectCountRef.current,
              startedAt: new Date(startMsRef.current).toISOString(),
              completedAt: new Date().toISOString(),
            };
            onComplete(result);
          }
        }, 1000);
        return;
      }

      if (attemptCount === 0) {
        setAttemptCount(1);
        skipAutoCheckRef.current = true;
        setTimeout(() => {
          setAvailableWords([...wordsForPhrase].sort(() => Math.random() - 0.5));
          setDropped({ subject: null, verb: null, object: null });
          setValidation({ subject: null, verb: null, object: null });
          setIsChecking(false);
        }, 1000);
        return;
      }

      setTimeout(() => {
        const newDropped = { ...dropped };
        const returned: string[] = [];
        if (!isSubjectCorrect && dropped.subject) {
          returned.push(dropped.subject);
          newDropped.subject = null;
        }
        if (!isVerbCorrect && dropped.verb) {
          returned.push(dropped.verb);
          newDropped.verb = null;
        }
        if (!isObjectCorrect && dropped.object) {
          returned.push(dropped.object);
          newDropped.object = null;
        }
        setDropped(newDropped);
        setAvailableWords((prev) => [...prev, ...returned]);
        setIsChecking(false);
      }, 1000);
    }, [dropped]);

    const handleZoneClick = (zone: Zone) => {
      if (isChecking || !selectedWord) return;
      setDropped((prev) => {
        const next = { ...prev };
        const existing = next[zone];
        if (existing) setAvailableWords((w) => [...w, existing]);
        next[zone] = selectedWord;
        return next;
      });
      setAvailableWords((prev) => prev.filter((w) => w !== selectedWord));
      setSelectedWord(null);
      setValidation((prev) => ({ ...prev, [zone]: null }));
    };

    const zoneStyle = (zone: Zone): CSSProperties => {
      const base: CSSProperties = {
        minHeight: 56,
        borderRadius: 10,
        border: "2px dashed #cbd5e1",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isChecking ? "default" : "pointer",
        userSelect: "none",
        transition: "all 0.15s",
        background: "#f8fafc",
        color: "#0f172a",
        fontWeight: 600,
        fontSize: 18,
        textAlign: "center",
      };
      if (validation[zone] === true) return { ...base, border: "2px solid #10b981", background: "#ecfdf5" };
      if (validation[zone] === false) return { ...base, border: "2px solid #ef4444", background: "#fef2f2" };
      if (dropped[zone]) return { ...base, border: "2px solid #00CED1", background: "#e6fffe" };
      return base;
    };

    const formatTime = (s: number) =>
      `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    if (!phrase) return null;

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
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700 }}>⏱ {formatTime(elapsedSec)}</span>
            <span style={{ color: "#10b981", fontWeight: 700 }}>✓ {correctCount}</span>
            <span style={{ color: "#ef4444", fontWeight: 700 }}>✗ {incorrectCount}</span>
          </div>
          <div style={{ fontWeight: 700 }}>
            {currentPhraseIndex + 1} / {total}
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#ffffff" }}>
            <MediaViewer src={phrase.mediaPath} alt="Иллюстрация" />
          </div>

          <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ textAlign: "center", color: "#64748b", fontSize: 14, marginBottom: 10 }}>
                Выберите слово:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                {availableWords.map((word, idx) => (
                  <button
                    key={`${word}-${idx}`}
                    type="button"
                    onClick={() => setSelectedWord(selectedWord === word ? null : word)}
                    disabled={isChecking}
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${selectedWord === word ? "#00CED1" : "#e5e7eb"}`,
                      background: selectedWord === word ? "#00CED1" : "#ffffff",
                      color: selectedWord === word ? "#ffffff" : "#0f172a",
                      padding: "10px 14px",
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: isChecking ? "default" : "pointer",
                    }}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div>
                <div style={{ textAlign: "center", color: "#64748b", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  КТО?
                </div>
                <div style={zoneStyle("subject")} onClick={() => handleZoneClick("subject")}>
                  {dropped.subject ?? <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: 14 }}>Нажмите сюда</span>}
                </div>
              </div>
              <div>
                <div style={{ textAlign: "center", color: "#64748b", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  ЧТО ДЕЛАЕТ?
                </div>
                <div style={zoneStyle("verb")} onClick={() => handleZoneClick("verb")}>
                  {dropped.verb ?? <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: 14 }}>Нажмите сюда</span>}
                </div>
              </div>
              <div>
                <div style={{ textAlign: "center", color: "#64748b", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  ЧТО?
                </div>
                <div style={zoneStyle("object")} onClick={() => handleZoneClick("object")}>
                  {dropped.object ?? <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: 14 }}>Нажмите сюда</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
}
