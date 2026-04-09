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
  const [availableParts, setAvailableParts] = useState<string[]>(() => [...exercises[0]!.parts]);

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
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex >= exercises.length - 1) return;
    const nextIndex = currentExerciseIndex + 1;
    setCurrentExerciseIndex(nextIndex);
    setSelectedPart(null);
    setPlacedParts([]);
    setAvailableParts(shuffleArray([...exercises[nextIndex]!.parts]));
  };

  useTestAutoRun({
    totalSteps: exercises.length,
    fillRandom,
    fillCorrect,
    submitCurrent: handleNextExercise,
  });

  // Завершение теста: когда выполнены все задания и заполнены 10 корректных слотов на последнем задании
  useEffect(() => {
    if (!isExerciseComplete) return;
    if (currentExerciseIndex !== exercises.length - 1) return;
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
  }, [config.id, currentExerciseIndex, isExerciseComplete, onComplete]);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          padding: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ width: '100%', fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{config.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontWeight: 800, color: '#0f172a' }}>Словообразование</div>
          <div style={{ width: 1, height: 22, background: '#e5e7eb' }} />
          <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a' }}>
            ⏱ {formatTime(Math.floor(elapsedMs / 1000))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontWeight: 700 }}>
            Задание:
            <select
              value={currentExerciseIndex}
              onChange={(e) => handleExerciseSelect(Number(e.target.value))}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: '8px 10px',
                background: '#ffffff',
                fontWeight: 700,
              }}
            >
              {exercises.map((ex, idx) => (
                <option key={ex.id} value={idx}>
                  {ex.id} ({ex.commonPart})
                </option>
              ))}
            </select>
          </label>

          <div style={{ width: 1, height: 22, background: '#e5e7eb' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontWeight: 800, color: '#10b981' }}>Верно: {correctCount}</div>
            <div style={{ fontWeight: 800, color: '#ef4444' }}>Ошибок: {incorrectCount}</div>
          </div>

          <button
            type="button"
            onClick={handleRestart}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              fontWeight: 800,
            }}
          >
            Сброс
          </button>
        </div>
      </div>

      {/* Instruction */}
      <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, color: '#334155', marginBottom: 12 }}>
        Добавьте части слова
      </div>

      {/* Bank */}
      <div
        style={{
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          background: '#ffffff',
          padding: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {availableParts.map((part, idx) => {
            const active = selectedPart === part;
            return (
              <button
                key={`${part}-${idx}`}
                type="button"
                onClick={() => setSelectedPart(part)}
                style={{
                  borderRadius: 12,
                  border: `2px solid ${active ? '#00CED1' : '#e5e7eb'}`,
                  background: active ? '#e6fffe' : '#f8fafc',
                  color: '#0f172a',
                  padding: '10px 14px',
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                {part}
              </button>
            );
          })}
        </div>
      </div>

      {/* Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left: ___COMMON */}
        <div
          style={{
            borderRadius: 16,
            border: '1px solid #e5e7eb',
            background: '#ffffff',
            padding: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ fontWeight: 800, color: '#334155', marginBottom: 10, textAlign: 'center' }}>
            ___{common.left}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2, 3, 4].map((position) => {
              const placed = placedParts.find((p) => p.position === position && p.column === 'left');
              const isCorrect = placed?.status === 'correct';
              const isIncorrect = placed?.status === 'incorrect';
              return (
                <div key={position} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleSlotClick(position, 'left')}
                    style={{
                      flex: 1,
                      height: 52,
                      borderRadius: 12,
                      border: `2px ${placed ? 'solid' : 'dashed'} ${
                        isCorrect ? '#10b981' : isIncorrect ? '#ef4444' : '#cbd5e1'
                      }`,
                      background: isCorrect
                        ? '#ecfdf5'
                        : isIncorrect
                          ? '#fef2f2'
                          : selectedPart
                            ? '#f0fdff'
                            : '#f8fafc',
                      fontWeight: 900,
                      fontSize: 18,
                      color: '#0f172a',
                    }}
                  >
                    {placed ? placed.part : '____'}
                  </button>
                  <div
                    style={{
                      width: 86,
                      height: 52,
                      borderRadius: 12,
                      background: '#e0f2fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      color: '#0369a1',
                    }}
                  >
                    {common.left}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: COMMON___ */}
        <div
          style={{
            borderRadius: 16,
            border: '1px solid #e5e7eb',
            background: '#ffffff',
            padding: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ fontWeight: 800, color: '#334155', marginBottom: 10, textAlign: 'center' }}>
            {common.right}___
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2, 3, 4].map((position) => {
              const placed = placedParts.find((p) => p.position === position && p.column === 'right');
              const isCorrect = placed?.status === 'correct';
              const isIncorrect = placed?.status === 'incorrect';
              return (
                <div key={position} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div
                    style={{
                      width: 86,
                      height: 52,
                      borderRadius: 12,
                      background: '#e0f2fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      color: '#0369a1',
                    }}
                  >
                    {common.right}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSlotClick(position, 'right')}
                    style={{
                      flex: 1,
                      height: 52,
                      borderRadius: 12,
                      border: `2px ${placed ? 'solid' : 'dashed'} ${
                        isCorrect ? '#10b981' : isIncorrect ? '#ef4444' : '#cbd5e1'
                      }`,
                      background: isCorrect
                        ? '#ecfdf5'
                        : isIncorrect
                          ? '#fef2f2'
                          : selectedPart
                            ? '#f0fdff'
                            : '#f8fafc',
                      fontWeight: 900,
                      fontSize: 18,
                      color: '#0f172a',
                    }}
                  >
                    {placed ? placed.part : '____'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginTop: 16, textAlign: 'center', color: '#64748b', fontWeight: 700 }}>
        Задание {currentExercise.id} из {exercises.length} • Правильно размещено: {correctPlaced} / 10
      </div>

      {isExerciseComplete && currentExerciseIndex < exercises.length - 1 && (
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={handleNextExercise}
            style={{
              padding: '12px 18px',
              borderRadius: 12,
              background: '#10b981',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: 16,
            }}
          >
            Следующее задание
          </button>
        </div>
      )}

      {isExerciseComplete && currentExerciseIndex === exercises.length - 1 && (
        <div
          style={{
            marginTop: 16,
            borderRadius: 16,
            padding: 16,
            background: '#ecfdf5',
            border: '1px solid #bbf7d0',
            textAlign: 'center',
            fontWeight: 900,
            color: '#047857',
          }}
        >
          Поздравляем! Вы завершили все задания.
        </div>
      )}
    </div>
  );
}

