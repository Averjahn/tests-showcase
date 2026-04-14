/**
 * Тест 01 (Mame): составление фразы по картинке.
 * Адаптирован под нашу архитектуру тестов:
 * - НЕ отправляет каждый ответ на backend (счётчики correct/incorrect считаются локально)
 * - завершает через onComplete (для finishSession в обёртке)
 */

'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import type { TestComponentProps, TestResult } from '../shared/TestInterface';
import { useTestDebugShortcuts } from '../shared/useTestDebugShortcuts';
import { useTestAutoRun } from '../shared/useTestAutoRun';
import { tasks } from './tasks-data';

type Zone = 'subject' | 'verb' | 'object';

function isVideo(path: string) {
  const p = path.toLowerCase();
  return p.endsWith('.mp4') || p.endsWith('.webm') || p.endsWith('.mov') || p.endsWith('.m4v');
}

function MediaViewer({ src, alt }: { src: string; alt: string }) {
  if (isVideo(src)) {
    return (
      <video
        src={src}
        controls
        style={{
          width: '100%',
          height: '100%',
          // Не кропаем по высоте — вписываем целиком
          objectFit: 'contain',
          display: 'block',
          // Без тёмного фона под видео
          background: '#ffffff',
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
      // Не кропаем по высоте — вписываем целиком
      style={{ objectFit: 'contain' }}
    />
  );
}

export default function Test01Mame({ config, onComplete }: TestComponentProps) {
  const task = tasks[0];

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
  const phraseStartMsRef = useRef<number>(0);
  // Prevent auto-check from firing during phrase switches (race between effects).
  const skipAutoCheckRef = useRef(false);
  // One zone = one final outcome based on FIRST check (like test-02-main).
  const slotFirstOutcomeRef = useRef<Record<string, 'correct' | 'incorrect'>>({});

  useEffect(() => {
    startMsRef.current = Date.now();
    phraseStartMsRef.current = Date.now();
    const t = window.setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  const phrase = task.phrases[currentPhraseIndex];
  const total = task.phrases.length;

  const wordsForPhrase = useMemo(() => [phrase.subject, phrase.verb, phrase.object], [phrase]);

  const fillCorrect = () => {
    if (isChecking) return;
    const correct = {
      subject: phrase.subject,
      verb: phrase.verb,
      object: phrase.object,
    };
    setAttemptCount(0);
    setSelectedWord(null);
    setValidation({ subject: null, verb: null, object: null });
    setIsChecking(false);
    setAvailableWords([]);
    setDropped(correct);
  };

  const fillRandom = () => {
    if (isChecking) return;
    const shuffled = [...wordsForPhrase].sort(() => Math.random() - 0.5);
    const random = {
      subject: shuffled[0] ?? null,
      verb: shuffled[1] ?? null,
      object: shuffled[2] ?? null,
    };
    setAttemptCount(0);
    setSelectedWord(null);
    setValidation({ subject: null, verb: null, object: null });
    setIsChecking(false);
    setAvailableWords([]);
    setDropped(random);
  };

  // Dev shortcuts: q = random, w = correct. Shift+A = автопрохождение поочерёдно случайно/правильно
  useTestDebugShortcuts({
    disabled: isChecking,
    onFillRandom: fillRandom,
    onFillCorrect: fillCorrect,
  });
  useTestAutoRun({
    totalSteps: total,
    fillRandom,
    fillCorrect,
    submitCurrent: () => {}, // авто-проверка по эффекту при заполнении
    disabled: isChecking,
  });

  // Инициализация фразы: перемешать слова, сбросить зоны
  useEffect(() => {
    skipAutoCheckRef.current = true;
    phraseStartMsRef.current = Date.now();
    setAvailableWords([...wordsForPhrase].sort(() => Math.random() - 0.5));
    setDropped({ subject: null, verb: null, object: null });
    setValidation({ subject: null, verb: null, object: null });
    setAttemptCount(0);
    setSelectedWord(null);
    setIsChecking(false);
  }, [currentPhraseIndex, wordsForPhrase]);

  // Автопроверка, когда все зоны заполнены
  useEffect(() => {
    if (skipAutoCheckRef.current) {
      // wait until reset is actually applied (all zones cleared)
      if (!dropped.subject && !dropped.verb && !dropped.object) {
        skipAutoCheckRef.current = false;
      }
      return;
    }
    if (!dropped.subject || !dropped.verb || !dropped.object) return;
    if (isChecking) return;
    handleCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropped]);

  const handleCheck = () => {
    if (isChecking) return;
    if (!dropped.subject || !dropped.verb || !dropped.object) return;

    setIsChecking(true);

    const isSubjectCorrect = dropped.subject === phrase.subject;
    const isVerbCorrect = dropped.verb === phrase.verb;
    const isObjectCorrect = dropped.object === phrase.object;
    const allCorrect = isSubjectCorrect && isVerbCorrect && isObjectCorrect;

    const slotKey = (phraseIndex: number, zone: Zone) => `${phraseIndex}:${zone}`;
    const registerFirstOutcome = (key: string, isCorrect: boolean) => {
      if (slotFirstOutcomeRef.current[key]) return;
      slotFirstOutcomeRef.current[key] = isCorrect ? 'correct' : 'incorrect';
      if (isCorrect) {
        correctCountRef.current += 1;
        setCorrectCount(correctCountRef.current);
      } else {
        incorrectCountRef.current += 1;
        setIncorrectCount(incorrectCountRef.current);
      }
    };

    // stats: register FIRST outcome per zone (only once)
    registerFirstOutcome(slotKey(currentPhraseIndex, 'subject'), isSubjectCorrect);
    registerFirstOutcome(slotKey(currentPhraseIndex, 'verb'), isVerbCorrect);
    registerFirstOutcome(slotKey(currentPhraseIndex, 'object'), isObjectCorrect);

    setValidation({
      subject: isSubjectCorrect,
      verb: isVerbCorrect,
      object: isObjectCorrect,
    });

    if (allCorrect) {
      // Переход к следующей фразе (или завершение)
      setTimeout(() => {
        if (currentPhraseIndex < total - 1) {
          setIsChecking(false);
          setCurrentPhraseIndex((i) => i + 1);
        } else {
          const completedAt = new Date().toISOString();
          const startedAt = new Date(startMsRef.current).toISOString();
          const result: TestResult = {
            testId: config.id,
            answers: [],
            totalTime: Date.now() - startMsRef.current,
            // Один "поле-ответ" = один итог: если была первая ошибка, верный ответ позже не считаем
            correctCount: correctCountRef.current,
            incorrectCount: incorrectCountRef.current,
            startedAt,
            completedAt,
          };
          setIsChecking(false);
          onComplete(result);
        }
      }, 1000);
      return;
    }

    // Неверно: логика попыток
    if (attemptCount === 0) {
      // первая ошибка — сбрасываем всё через паузу (как в v0)
      setAttemptCount(1);
      setTimeout(() => {
        setAvailableWords([...wordsForPhrase].sort(() => Math.random() - 0.5));
        setDropped({ subject: null, verb: null, object: null });
        setValidation({ subject: null, verb: null, object: null });
        setIsChecking(false);
      }, 1000);
      return;
    }

    // вторая и последующие: освобождаем неверные слова
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
  };

  const handleWordSelect = (word: string) => {
    if (isChecking) return;
    setSelectedWord(word);
  };

  const handleZoneClick = (zone: Zone) => {
    if (isChecking) return;
    if (!selectedWord) return;

    setDropped((prev) => {
      const next = { ...prev };
      // если в зоне уже есть слово — возвращаем его обратно
      const existing = next[zone];
      if (existing) {
        setAvailableWords((w) => [...w, existing]);
      }
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
      border: '2px dashed #cbd5e1',
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: isChecking ? 'default' : 'pointer',
      userSelect: 'none',
      transition: 'all 0.15s',
      background: '#f8fafc',
      color: '#0f172a',
      fontWeight: 600,
      fontSize: 18,
      textAlign: 'center',
    };

    if (validation[zone] === true) return { ...base, border: '2px solid #10b981', background: '#ecfdf5' };
    if (validation[zone] === false) return { ...base, border: '2px solid #ef4444', background: '#fef2f2' };
    if (dropped[zone]) return { ...base, border: '2px solid #00CED1', background: '#e6fffe' };
    return base;
  };

  const reset = () => {
    startMsRef.current = Date.now();
    phraseStartMsRef.current = Date.now();
    setElapsedSec(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    correctCountRef.current = 0;
    incorrectCountRef.current = 0;
    slotFirstOutcomeRef.current = {};
    setCurrentPhraseIndex(0);
    setAttemptCount(0);
    setSelectedWord(null);
    setValidation({ subject: null, verb: null, object: null });
    setDropped({ subject: null, verb: null, object: null });
    setAvailableWords([...wordsForPhrase].sort(() => Math.random() - 0.5));
    setIsChecking(false);
  };

  const handleNext = () => {
    if (currentPhraseIndex < total - 1) {
      setCurrentPhraseIndex((i) => i + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPhraseIndex > 0) {
      setCurrentPhraseIndex((i) => i - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      {/* Верхнее меню как в оригинальном RAND */}
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

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: "monospace",
              fontSize: 18,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            <span style={{ color: "#64748b", fontWeight: 600 }}>⏱</span>
            {formatTime(elapsedSec)}
          </div>
          <div style={{ width: 1, height: 24, background: "#e5e7eb" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Верно:</span>
              <span style={{ fontWeight: 700, color: "#10b981" }}>
                {correctCount}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Ошибок:</span>
              <span style={{ fontWeight: 700, color: "#ef4444" }}>
                {incorrectCount}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Сброс
          </button>
          <div style={{ width: 1, height: 24, background: "#e5e7eb" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentPhraseIndex === 0}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                cursor: currentPhraseIndex === 0 ? "not-allowed" : "pointer",
                opacity: currentPhraseIndex === 0 ? 0.5 : 1,
                fontWeight: 900,
              }}
              aria-label="Предыдущая"
            >
              ‹
            </button>
            <div style={{ minWidth: 80, textAlign: "center", fontWeight: 700 }}>
              {currentPhraseIndex + 1} / {total}
            </div>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentPhraseIndex === total - 1}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                cursor:
                  currentPhraseIndex === total - 1 ? "not-allowed" : "pointer",
                opacity: currentPhraseIndex === total - 1 ? 0.5 : 1,
                fontWeight: 900,
              }}
              aria-label="Следующая"
            >
              ›
            </button>
          </div>
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
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#ffffff' }}>
          <MediaViewer src={phrase.mediaPath} alt="Иллюстрация" />
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 10 }}>
              Выберите слово:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
              {availableWords.map((word, idx) => {
                const active = selectedWord === word;
                return (
                  <button
                    key={`${word}-${idx}`}
                    type="button"
                    onClick={() => handleWordSelect(word)}
                    disabled={isChecking}
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${active ? '#00CED1' : '#e5e7eb'}`,
                      background: active ? '#00CED1' : '#ffffff',
                      color: active ? '#ffffff' : '#0f172a',
                      padding: '10px 14px',
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: isChecking ? 'default' : 'pointer',
                    }}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                КТО?
              </div>
              <div style={zoneStyle('subject')} onClick={() => handleZoneClick('subject')}>
                {dropped.subject ?? <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14 }}>Нажмите сюда</span>}
              </div>
            </div>

            <div>
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                ЧТО ДЕЛАЕТ?
              </div>
              <div style={zoneStyle('verb')} onClick={() => handleZoneClick('verb')}>
                {dropped.verb ?? <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14 }}>Нажмите сюда</span>}
              </div>
            </div>

            <div>
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                ЧТО?
              </div>
              <div style={zoneStyle('object')} onClick={() => handleZoneClick('object')}>
                {dropped.object ?? <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14 }}>Нажмите сюда</span>}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
            Попытка: <strong style={{ color: '#0f172a' }}>{attemptCount + 1}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

