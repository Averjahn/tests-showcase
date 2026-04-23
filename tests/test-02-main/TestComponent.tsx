/**
 * Тест 02 (02-main): "Добавить часть слова (начало/конец)".
 *
 * Адаптация под платформу:
 * - НЕ делает fetch внутри компонента
 * - НЕ отправляет каждый ответ на backend (счётчики correct/incorrect считаются локально)
 * - завершает через onComplete (для /api/tests/finish в TestWrapper)
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { TestComponentProps, TestResult } from '../shared/TestInterface';
import { useTestDebugShortcuts } from '../shared/useTestDebugShortcuts';
import { useTestAutoRun } from '../shared/useTestAutoRun';
import { exercises, type Exercise } from './exercises-data';

type Column = 'left' | 'right';
type SlotStatus = 'correct' | 'incorrect';

type PlacedPart = {
  part: string;
  position: number; // 0..4
  column: Column; // left = ___COMMON, right = COMMON___
  status: SlotStatus;
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function splitCommonPart(commonPart: string): { left: string; right: string } {
  // Иногда в данных встречается вариант "УЛ / УЛ" — оставляем совместимость
  const [a, b] = commonPart.split(' / ').map((s) => s.trim());
  return { left: a ?? commonPart, right: b ?? a ?? commonPart };
}

export default function Test02Main({ config, onComplete }: TestComponentProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [placedParts, setPlacedParts] = useState<PlacedPart[]>([]);
  const [availableParts, setAvailableParts] = useState<string[]>(() => shuffleArray([...exercises[0]!.parts]));
  const [readyToFinish, setReadyToFinish] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | null>(null);

  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const startedAtIsoRef = useRef<string>('');
  const elapsedMsRef = useRef<number>(0);
  const completedRef = useRef(false);
  // ответы больше не отправляем поштучно; храним только агрегированные счётчики
  // Важно: один слот = один результат (если первый раз ошибка — больше не считаем верный ответ позже)
  const slotFirstOutcomeRef = useRef<Record<string, 'correct' | 'incorrect'>>({});

  const currentExercise: Exercise = exercises[currentExerciseIndex]!;
  const common = useMemo(() => splitCommonPart(currentExercise.commonPart), [currentExercise.commonPart]);

  // общий таймер теста
  useEffect(() => {
    startedAtIsoRef.current = new Date().toISOString();
    elapsedMsRef.current = 0;

    const t = window.setInterval(() => {
      elapsedMsRef.current += 100;
      setElapsedMs(elapsedMsRef.current);
    }, 100);
    return () => window.clearInterval(t);
  }, []);

  const correctPlaced = useMemo(
    () => placedParts.filter((p) => p.status === 'correct').length,
    [placedParts],
  );
  const isExerciseComplete = correctPlaced === 10;
  const prevIsCompleteRef = useRef(false);

  useEffect(() => {
    const prev = prevIsCompleteRef.current;
    prevIsCompleteRef.current = isExerciseComplete;
    if (!prev && isExerciseComplete) {
      setFeedback('correct');
      window.setTimeout(() => setFeedback(null), 900);
    }
  }, [isExerciseComplete]);

  const slotKey = (exerciseId: string | number, column: Column, position: number) =>
    `${exerciseId}:${column}:${position}`;

  const registerFirstOutcome = (key: string, isCorrect: boolean) => {
    if (slotFirstOutcomeRef.current[key]) return;
    slotFirstOutcomeRef.current[key] = isCorrect ? 'correct' : 'incorrect';
    if (isCorrect) setCorrectCount((prev) => prev + 1);
    else setIncorrectCount((prev) => prev + 1);
  };

  const placePartInSlot = (part: string, position: number, column: Column) => {
    // слот уже занят
    const existingPart = placedParts.find((p) => p.position === position && p.column === column);
    if (existingPart) return;

    // проверка корректности: логика как в исходном 02-main
    const isCorrect = column === 'left' ? currentExercise.endsWith.includes(part) : currentExercise.startsWith.includes(part);
    registerFirstOutcome(slotKey(currentExercise.id, column, position), isCorrect);

    const newPlacedPart: PlacedPart = {
      part,
      position,
      column,
      status: isCorrect ? 'correct' : 'incorrect',
    };

    setPlacedParts((prev) => [...prev, newPlacedPart]);

    if (isCorrect) {
      setAvailableParts((prev) => prev.filter((p) => p !== part));
    } else {
      // неверную часть убираем через паузу (как в исходнике)
      const placedPartKey = { part, position, column };
      window.setTimeout(() => {
        setPlacedParts((prev) =>
          prev.filter(
            (p) => !(p.part === placedPartKey.part && p.position === placedPartKey.position && p.column === placedPartKey.column),
          ),
        );
      }, 1000);
    }
  };

  const handleSlotClick = (position: number, column: Column) => {
    if (!selectedPart) return;
    placePartInSlot(selectedPart, position, column);
    setSelectedPart(null);
  };

  const fillCorrect = () => {
    // убираем неверные части, чтобы не блокировали слоты
    setPlacedParts((prev) => prev.filter((p) => p.status === 'correct'));
    setSelectedPart(null);

    // строим список свободных слотов исходя из текущего рендера (корректные уже заняты)
    const occupiedCorrect = new Set(
      placedParts
        .filter((p) => p.status === 'correct')
        .map((p) => `${p.column}:${p.position}`),
    );

    const remaining = new Set(availableParts);
    const used = new Set<string>();
    const placements: Array<{ part: string; column: Column; position: number }> = [];

    const tryFill = (column: Column, position: number, candidates: string[]) => {
      if (occupiedCorrect.has(`${column}:${position}`)) return;
      const pick = candidates.find((c) => remaining.has(c));
      if (!pick) return;
      remaining.delete(pick);
      used.add(pick);
      placements.push({ part: pick, column, position });
    };

    for (const position of [0, 1, 2, 3, 4]) {
      tryFill('left', position, currentExercise.endsWith);
    }
    for (const position of [0, 1, 2, 3, 4]) {
      tryFill('right', position, currentExercise.startsWith);
    }

    if (placements.length === 0) return;

    // одним батчем обновляем UI
    let newlyCounted = 0;
    for (const pl of placements) {
      const key = slotKey(currentExercise.id, pl.column, pl.position);
      if (!slotFirstOutcomeRef.current[key]) {
        slotFirstOutcomeRef.current[key] = 'correct';
        newlyCounted += 1;
      }
    }
    setPlacedParts((prev) => {
      const keep = prev.filter((p) => p.status === 'correct');
      const slotsTaken = new Set(keep.map((p) => `${p.column}:${p.position}`));
      const next: PlacedPart[] = [...keep];

      for (const pl of placements) {
        const key = `${pl.column}:${pl.position}`;
        if (slotsTaken.has(key)) continue;
        slotsTaken.add(key);
        next.push({ part: pl.part, column: pl.column, position: pl.position, status: 'correct' });
      }
      return next;
    });
    setAvailableParts((prev) => prev.filter((p) => !used.has(p)));
    if (newlyCounted > 0) setCorrectCount((prev) => prev + newlyCounted);
  };

  const fillRandom = () => {
    // убираем неверные части, чтобы не блокировали слоты
    setPlacedParts((prev) => prev.filter((p) => p.status === 'correct'));
    setSelectedPart(null);

    const occupiedCorrect = new Set(
      placedParts
        .filter((p) => p.status === 'correct')
        .map((p) => `${p.column}:${p.position}`),
    );

    const remaining = new Set(availableParts);
    const usedCorrect = new Set<string>();
    const placements: Array<{ part: string; column: Column; position: number; isCorrect: boolean }> = [];

    const randFromRemaining = () => {
      const arr = Array.from(remaining);
      if (arr.length === 0) return null;
      return arr[Math.floor(Math.random() * arr.length)] ?? null;
    };

    const tryFill = (column: Column, position: number) => {
      if (occupiedCorrect.has(`${column}:${position}`)) return;
      const pick = randFromRemaining();
      if (!pick) return;
      const isCorrect = column === 'left' ? currentExercise.endsWith.includes(pick) : currentExercise.startsWith.includes(pick);
      if (isCorrect) {
        remaining.delete(pick);
        usedCorrect.add(pick);
      }
      placements.push({ part: pick, column, position, isCorrect });
    };

    for (const position of [0, 1, 2, 3, 4]) {
      tryFill('left', position);
    }
    for (const position of [0, 1, 2, 3, 4]) {
      tryFill('right', position);
    }

    if (placements.length === 0) return;

    let newlyCorrect = 0;
    let newlyIncorrect = 0;
    for (const pl of placements) {
      const key = slotKey(currentExercise.id, pl.column, pl.position);
      if (slotFirstOutcomeRef.current[key]) continue;
      slotFirstOutcomeRef.current[key] = pl.isCorrect ? 'correct' : 'incorrect';
      if (pl.isCorrect) newlyCorrect += 1;
      else newlyIncorrect += 1;
    }

    setPlacedParts((prev) => {
      const keep = prev.filter((p) => p.status === 'correct');
      const slotsTaken = new Set(keep.map((p) => `${p.column}:${p.position}`));
      const next: PlacedPart[] = [...keep];

      for (const pl of placements) {
        const key = `${pl.column}:${pl.position}`;
        if (slotsTaken.has(key)) continue;
        slotsTaken.add(key);
        next.push({ part: pl.part, column: pl.column, position: pl.position, status: pl.isCorrect ? 'correct' : 'incorrect' });
        if (!pl.isCorrect) {
          const placedPartKey = { part: pl.part, position: pl.position, column: pl.column };
          window.setTimeout(() => {
            setPlacedParts((prev2) =>
              prev2.filter(
                (p) =>
                  !(
                    p.part === placedPartKey.part &&
                    p.position === placedPartKey.position &&
                    p.column === placedPartKey.column &&
                    p.status === 'incorrect'
                  ),
              ),
            );
          }, 1000);
        }
      }
      return next;
    });

    if (usedCorrect.size > 0) {
      setAvailableParts((prev) => prev.filter((p) => !usedCorrect.has(p)));
    }
    if (newlyCorrect > 0) setCorrectCount((prev) => prev + newlyCorrect);
    if (newlyIncorrect > 0) setIncorrectCount((prev) => prev + newlyIncorrect);
  };

  // Dev shortcuts: q = random, w = correct
  useTestDebugShortcuts({
    onFillRandom: fillRandom,
    onFillCorrect: fillCorrect,
    allowWhenTyping: true,
  });

  const handleRestart = () => {
    completedRef.current = false;
    startedAtIsoRef.current = new Date().toISOString();
    elapsedMsRef.current = 0;
    slotFirstOutcomeRef.current = {};

    setElapsedMs(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setReadyToFinish(false);

    setCurrentExerciseIndex(0);
    setSelectedPart(null);
    setPlacedParts([]);
    setAvailableParts(shuffleArray([...exercises[0]!.parts]));
  };

  const handleExerciseSelect = (index: number) => {
    setCurrentExerciseIndex(index);
    setSelectedPart(null);
    setPlacedParts([]);
    setAvailableParts(shuffleArray([...exercises[index]!.parts]));
    setReadyToFinish(false);
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex >= exercises.length - 1) return;
    const nextIndex = currentExerciseIndex + 1;
    setCurrentExerciseIndex(nextIndex);
    setSelectedPart(null);
    setPlacedParts([]);
    setAvailableParts(shuffleArray([...exercises[nextIndex]!.parts]));
    setReadyToFinish(false);
  };

  useTestAutoRun({
    totalSteps: exercises.length,
    fillRandom,
    fillCorrect,
    submitCurrent: handleNextExercise,
  });

  // Готовность к завершению: когда заполнены 10 корректных слотов на последнем задании
  useEffect(() => {
    if (!isExerciseComplete) return;
    if (currentExerciseIndex !== exercises.length - 1) return;
    setReadyToFinish(true);
  }, [config.id, currentExerciseIndex, isExerciseComplete, onComplete]);

  const finishTest = () => {
    if (completedRef.current) return;
    completedRef.current = true;

    const completedAt = new Date().toISOString();
    const startedAt = startedAtIsoRef.current || new Date().toISOString();

    const result: TestResult = {
      testId: config.id,
      totalTime: elapsedMsRef.current,
      answers: [],
      correctCount,
      incorrectCount,
      startedAt,
      completedAt,
    };

    onComplete(result);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header (UI aligned with test-21-main, logic preserved) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow">
        <div className="w-full text-xl font-bold text-slate-900">
          {typeof config.seqNum === 'number' ? `${config.seqNum}. ` : ''}
          {config.name}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={currentExerciseIndex}
            onChange={(e) => handleExerciseSelect(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            aria-label="Выбор задания"
          >
            {exercises.map((ex, idx) => (
              <option key={ex.id} value={idx}>
                {ex.id} ({ex.commonPart})
              </option>
            ))}
          </select>
          <div className="text-lg font-semibold">
            Задание {currentExercise.id} из {exercises.length}
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

      {feedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="rounded-full bg-green-500 p-8 text-6xl text-white">✓</div>
        </div>
      )}

      {/* Instruction (as in design screenshot) */}
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 28, fontWeight: 500, color: '#0f172a', lineHeight: 1.1 }}>Добавьте части слова</div>
        <div style={{ marginTop: 6, fontSize: 16, fontWeight: 600, color: '#334155' }}>
          Выберите слог и подставьте его в начало или конец слова
        </div>
      </div>

      {/* Bank (flat pills row) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
        {availableParts.map((part, idx) => {
          const active = selectedPart === part;
          return (
            <button
              key={`${part}-${idx}`}
              type="button"
              onClick={() => setSelectedPart(part)}
              style={{
                borderRadius: 8,
                border: '2px solid transparent',
                borderColor: active ? '#60a5fa' : 'transparent',
                background: active ? '#ffffff' : '#f1f5f9',
                color: '#0f172a',
                padding: '8px 14px',
                fontSize: 20,
                fontWeight: 500,
                boxShadow: active ? '0 0 0 3px rgba(96,165,250,0.35)' : 'none',
                transition: 'box-shadow 120ms ease, background-color 120ms ease, border-color 120ms ease',
              }}
            >
              {part}
            </button>
          );
        })}
      </div>

      {/* Columns (as in design screenshot) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, justifyItems: 'stretch' }}>
        {/* Left: ____ + COMMON */}
        <div style={{ width: '100%', maxWidth: 180, marginLeft: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1, 2, 3, 4].map((position) => {
              const placed = placedParts.find((p) => p.position === position && p.column === 'left');
              const isCorrect = placed?.status === 'correct';
              const isIncorrect = placed?.status === 'incorrect';
              const borderColor = isCorrect ? '#10b981' : isIncorrect ? '#ef4444' : '#7dd3fc';
              const bg = isCorrect ? '#ecfdf5' : isIncorrect ? '#fee2e2' : '#e0f2fe';
              const borderStyle = isCorrect || isIncorrect ? 'solid' : 'dashed';
              const borderWidth = isCorrect || isIncorrect ? 2 : 1;
              return (
                <button
                  key={position}
                  type="button"
                  onClick={() => handleSlotClick(position, 'left')}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    position: 'relative',
                    height: 46,
                    width: '100%',
                    borderRadius: 8,
                    border: `${borderWidth}px ${borderStyle} ${borderColor}`,
                    background: bg,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 16px',
                    gap: 12,
                    outline: 'none',
                    boxShadow: selectedPart && !placed ? '0 0 0 2px rgba(59,130,246,0.35)' : 'none',
                  }}
                >
                  {isCorrect ? (
                    <span
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        fontWeight: 500,
                        fontSize: 22,
                        color: '#0f172a',
                        letterSpacing: 0.2,
                      }}
                    >
                      {placed ? `${placed.part}${common.left}` : ''}
                    </span>
                  ) : isIncorrect ? (
                    <span
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        fontWeight: 500,
                        fontSize: 22,
                        color: '#0f172a',
                        letterSpacing: 0.2,
                      }}
                    >
                      {placed ? `${placed.part} ${common.left}` : ''}
                    </span>
                  ) : (
                    <>
                      <span style={{ flex: 1, position: 'relative', height: 22, display: 'flex', alignItems: 'flex-end' }}>
                        <span
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 2,
                            borderBottom: `2px solid ${isIncorrect ? '#ef4444' : '#0f172a'}`,
                          }}
                        />
                        <span style={{ width: '100%', textAlign: 'center', fontWeight: 500, fontSize: 20, color: '#0f172a' }}>
                          {placed ? placed.part : ''}
                        </span>
                      </span>
                      <span style={{ fontWeight: 500, fontSize: 22, color: '#0f172a' }}>{common.left}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: COMMON + ____ */}
        <div style={{ width: '100%', maxWidth: 180, marginRight: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1, 2, 3, 4].map((position) => {
              const placed = placedParts.find((p) => p.position === position && p.column === 'right');
              const isCorrect = placed?.status === 'correct';
              const isIncorrect = placed?.status === 'incorrect';
              const borderColor = isCorrect ? '#10b981' : isIncorrect ? '#ef4444' : '#7dd3fc';
              const bg = isCorrect ? '#ecfdf5' : isIncorrect ? '#fee2e2' : '#e0f2fe';
              const borderStyle = isCorrect || isIncorrect ? 'solid' : 'dashed';
              const borderWidth = isCorrect || isIncorrect ? 2 : 1;
              return (
                <button
                  key={position}
                  type="button"
                  onClick={() => handleSlotClick(position, 'right')}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    position: 'relative',
                    height: 46,
                    width: '100%',
                    borderRadius: 8,
                    border: `${borderWidth}px ${borderStyle} ${borderColor}`,
                    background: bg,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 16px',
                    gap: 12,
                    outline: 'none',
                    boxShadow: selectedPart && !placed ? '0 0 0 2px rgba(59,130,246,0.35)' : 'none',
                  }}
                >
                  {isCorrect ? (
                    <span
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        fontWeight: 500,
                        fontSize: 22,
                        color: '#0f172a',
                        letterSpacing: 0.2,
                      }}
                    >
                      {placed ? `${common.right}${placed.part}` : ''}
                    </span>
                  ) : isIncorrect ? (
                    <span
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        fontWeight: 500,
                        fontSize: 22,
                        color: '#0f172a',
                        letterSpacing: 0.2,
                      }}
                    >
                      {placed ? `${common.right} ${placed.part}` : ''}
                    </span>
                  ) : (
                    <>
                      <span style={{ fontWeight: 500, fontSize: 22, color: '#0f172a' }}>{common.right}</span>
                      <span style={{ flex: 1, position: 'relative', height: 22, display: 'flex', alignItems: 'flex-end' }}>
                        <span
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 2,
                            borderBottom: `2px solid ${isIncorrect ? '#ef4444' : '#0f172a'}`,
                          }}
                        />
                        <span style={{ width: '100%', textAlign: 'center', fontWeight: 500, fontSize: 20, color: '#0f172a' }}>
                          {placed ? placed.part : ''}
                        </span>
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isExerciseComplete && currentExerciseIndex < exercises.length - 1 && (
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={handleNextExercise}
            style={{
              height: 50,
              minWidth: 240,
              padding: '0 28px',
              borderRadius: 999,
              background: '#7dd3fc',
              color: '#ffffff',
              fontWeight: 400,
              fontSize: 24,
              lineHeight: 1,
              border: '0',
            }}
          >
            Дальше &gt;
          </button>
        </div>
      )}

      {readyToFinish && currentExerciseIndex === exercises.length - 1 && (
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={finishTest}
            style={{
              height: 50,
              minWidth: 240,
              padding: '0 28px',
              borderRadius: 999,
              background: '#7dd3fc',
              color: '#ffffff',
              fontWeight: 400,
              fontSize: 24,
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

