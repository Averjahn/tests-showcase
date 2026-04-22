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

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function displayWord(word: string) {
  return word.toLowerCase();
}

function sentenceCase(text: string) {
  const s = text.trim();
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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
  const [elapsedMs, setElapsedMs] = useState(0);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedFromZone, setSelectedFromZone] = useState<Zone | null>(null);

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
  const startedAtIsoRef = useRef<string>('');
  const elapsedMsRef = useRef<number>(0);
  const completedRef = useRef(false);
  // Prevent auto-check from firing during phrase switches (race between effects).
  const skipAutoCheckRef = useRef(false);
  // One zone = one final outcome based on FIRST check (like test-02-main).
  const slotFirstOutcomeRef = useRef<Record<string, 'correct' | 'incorrect'>>({});

  useEffect(() => {
    startedAtIsoRef.current = new Date().toISOString();
    elapsedMsRef.current = 0;
    const t = window.setInterval(() => {
      elapsedMsRef.current += 100;
      setElapsedMs(elapsedMsRef.current);
    }, 100);
    return () => window.clearInterval(t);
  }, []);

  const phrase = task.phrases[currentPhraseIndex];
  const total = task.phrases.length;

  const wordsForPhrase = useMemo(() => [phrase.subject, phrase.verb, phrase.object], [phrase]);
  const isPhraseComplete = useMemo(
    () => validation.subject === true && validation.verb === true && validation.object === true,
    [validation],
  );

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
    if (isPhraseComplete) return;
    handleCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropped, isChecking, isPhraseComplete]);

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
      // Correct: keep the phrase on screen (manual Next/Finish)
      setTimeout(() => {
        setIsChecking(false);
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
    setSelectedFromZone(null);
  };

  const handleZoneClick = (zone: Zone) => {
    if (isChecking) return;
    // If nothing is selected: allow picking a word from a filled zone to move/swap it.
    if (!selectedWord) {
      const current = dropped[zone];
      if (!current) return;
      setSelectedWord(current);
      setSelectedFromZone(zone);
      return;
    }

    // Moving/swapping between zones (no bank changes)
    if (selectedFromZone) {
      // Clicking the same zone cancels selection.
      if (selectedFromZone === zone) {
        setSelectedWord(null);
        setSelectedFromZone(null);
        return;
      }

      setDropped((prev) => {
        const next = { ...prev };
        const moving = prev[selectedFromZone];
        const target = prev[zone];
        // swap (or move into empty)
        next[zone] = moving;
        next[selectedFromZone] = target ?? null;
        return next;
      });
      setSelectedWord(null);
      setSelectedFromZone(null);
      setValidation((prev) => ({ ...prev, [zone]: null, [selectedFromZone]: null }));
      return;
    }

    setDropped((prev) => {
      const next = { ...prev };
      // если в зоне уже есть слово — возвращаем его обратно
      const existing = next[zone];
      if (existing) {
        setAvailableWords((w) => (w.includes(existing) ? w : [...w, existing]));
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
    if (selectedFromZone === zone) return { ...base, border: '2px solid #00CED1', background: '#e6fffe', boxShadow: '0 0 0 2px rgba(0,206,209,0.25)' };
    if (dropped[zone]) return { ...base, border: '2px solid #00CED1', background: '#e6fffe' };
    return base;
  };

  const reset = () => {
    startedAtIsoRef.current = new Date().toISOString();
    elapsedMsRef.current = 0;
    setElapsedMs(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    correctCountRef.current = 0;
    incorrectCountRef.current = 0;
    slotFirstOutcomeRef.current = {};
    setCurrentPhraseIndex(0);
    setAttemptCount(0);
    setSelectedWord(null);
    setSelectedFromZone(null);
    setValidation({ subject: null, verb: null, object: null });
    setDropped({ subject: null, verb: null, object: null });
    setAvailableWords([...wordsForPhrase].sort(() => Math.random() - 0.5));
    setIsChecking(false);
    completedRef.current = false;
  };

  const finishTest = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    const completedAt = new Date().toISOString();
    const startedAt = startedAtIsoRef.current || new Date().toISOString();
    const result: TestResult = {
      testId: config.id,
      answers: [],
      totalTime: elapsedMsRef.current,
      correctCount: correctCountRef.current,
      incorrectCount: incorrectCountRef.current,
      startedAt,
      completedAt,
    };
    onComplete(result);
  };

  const handleNextPhrase = () => {
    if (isChecking) return;
    if (!isPhraseComplete) return;
    if (currentPhraseIndex >= total - 1) return;
    setCurrentPhraseIndex((i) => i + 1);
  };

  return (
    <div
      style={{
        height: '100%',
        padding: 16,
        maxWidth: 1100,
        margin: '0 auto',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header (UI aligned with test-02-main, logic preserved) */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow">
        <div className="w-full text-xl font-bold text-slate-900">
          {typeof config.seqNum === 'number' ? `${config.seqNum}. ` : ''}
          {config.name}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={currentPhraseIndex}
            onChange={(e) => setCurrentPhraseIndex(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            aria-label="Выбор задания"
          >
            {task.phrases.map((_, idx) => (
              <option key={idx} value={idx}>
                Задание {idx + 1}
              </option>
            ))}
          </select>
          <div className="text-lg font-semibold">
            Задание {currentPhraseIndex + 1} из {total}
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

      {/* Instruction (as in design screenshot) */}
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 28, fontWeight: 500, color: '#0f172a', lineHeight: 1.1 }}>Составьте фразу из слов</div>
      </div>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          flex: '1 1 auto',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 'clamp(180px, 34vh, 340px)',
            marginTop: 10,
            background: '#ffffff',
            flex: '0 0 auto',
          }}
        >
          <MediaViewer src={phrase.mediaPath} alt="Иллюстрация" />
        </div>

        <div style={{ padding: 14, overflow: 'hidden', flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 10 }}>
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
                      padding: '8px 12px',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: isChecking ? 'default' : 'pointer',
                    }}
                  >
                    {displayWord(word)}
                  </button>
                );
              })}
            </div>
          </div>

          {isPhraseComplete ? (
            <div
              style={{
                minHeight: 56,
                borderRadius: 10,
                border: '2px solid #10b981',
                background: '#ecfdf5',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 18,
                color: '#0f172a',
                textAlign: 'center',
              }}
            >
              {sentenceCase(`${displayWord(phrase.subject)} ${displayWord(phrase.verb)} ${displayWord(phrase.object)}`)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  КТО?
                </div>
                <div style={zoneStyle('subject')} onClick={() => handleZoneClick('subject')}>
                  {dropped.subject ? displayWord(dropped.subject) : <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14 }}>Нажмите сюда</span>}
                </div>
              </div>

              <div>
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  ЧТО ДЕЛАЕТ?
                </div>
                <div style={zoneStyle('verb')} onClick={() => handleZoneClick('verb')}>
                  {dropped.verb ? displayWord(dropped.verb) : <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14 }}>Нажмите сюда</span>}
                </div>
              </div>

              <div>
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  ЧТО?
                </div>
                <div style={zoneStyle('object')} onClick={() => handleZoneClick('object')}>
                  {dropped.object ? displayWord(dropped.object) : <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14 }}>Нажмите сюда</span>}
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: 10, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
            Попытка: <strong style={{ color: '#0f172a' }}>{attemptCount + 1}</strong>
          </div>
        </div>
      </div>

    {isPhraseComplete && currentPhraseIndex < total - 1 && (
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={handleNextPhrase}
          style={{
            height: 46,
            minWidth: 220,
            padding: '0 28px',
            borderRadius: 16,
            background: '#7dd3fc',
            color: '#ffffff',
            fontWeight: 500,
            fontSize: 32,
            lineHeight: 1,
            border: '0',
          }}
        >
          Дальше &gt;
        </button>
      </div>
    )}

    {isPhraseComplete && currentPhraseIndex === total - 1 && (
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={finishTest}
          style={{
            height: 46,
            minWidth: 220,
            padding: '0 28px',
            borderRadius: 16,
            background: '#7dd3fc',
            color: '#ffffff',
            fontWeight: 500,
            fontSize: 32,
            lineHeight: 1,
            border: '0',
          }}
        >
          Завершить
        </button>
      </div>
    )}
    </div>
  );
}

