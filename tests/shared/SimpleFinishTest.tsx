"use client";

import { useEffect, useRef, useState } from "react";
import type { TestComponentProps } from "./TestInterface";

export function SimpleFinishTest({ config, onComplete }: TestComponentProps) {
  const [seconds, setSeconds] = useState(0);
  const startedAtRef = useRef(new Date().toISOString());
  const completedRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete({
      testId: config.id,
      answers: [],
      totalTime: seconds * 1000,
      correctCount: 0,
      incorrectCount: 0,
      startedAt: startedAtRef.current,
      completedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-lg px-6 py-8 text-center">
        <h1 className="text-2xl font-semibold mb-3 text-gray-900">{config.name}</h1>
        <p className="text-gray-600 mb-8">{config.description}</p>
        <button
          type="button"
          onClick={handleFinish}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Завершить тест
        </button>
        <p className="mt-4 text-xs text-gray-400">
          Время в тесте: {seconds} сек.
        </p>
      </div>
    </div>
  );
}

