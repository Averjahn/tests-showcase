"use client";

import { useState, useEffect, useRef } from "react";
import type { TestComponentProps, TestResult } from "../shared/TestInterface";
import { TASKS, VOWELS } from "./tasks-data";

const level = 1;
const tasks = TASKS[level] ?? [];
const wordsToShow = 2;

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function Test13Main({ config, onComplete }: TestComponentProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState<{ wordIndex: number; letterIndex: number } | null>(null);
  const [selectedVowel, setSelectedVowel] = useState<string | null>(null);
  const [correctedWords, setCorrectedWords] = useState<string[]>([]);
  const [wordStates, setWordStates] = useState<("normal" | "correct" | "incorrect")[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime] = useState(() => Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const startedAtRef = useRef(new Date().toISOString());
  const completedRef = useRef(false);

  const currentTask = tasks[currentTaskIndex];

  useEffect(() => {
    if (!currentTask) return;
    setCorrectedWords([...currentTask.incorrect]);
    setWordStates(new Array(wordsToShow).fill("normal"));
    setSelectedLetter(null);
    setSelectedVowel(null);
    setShowSuccess(false);
  }, [currentTaskIndex, currentTask]);

  useEffect(() => {
    const t = setInterval(() => setElapsedTime(Date.now() - startTime), 1000);
    return () => clearInterval(t);
  }, [startTime]);

  const applyAttempt = (wordIndex: number, letterIndex: number, chosenVowel: string) => {
    const currentWord = correctedWords[wordIndex];
    const incorrectLetter = currentWord[letterIndex];
    const correctLetter = currentTask.corrections[incorrectLetter];
    if (chosenVowel === correctLetter) {
      const newCorrected = [...correctedWords];
      newCorrected[wordIndex] = currentWord.split("").map((char, idx) => (idx === letterIndex ? chosenVowel : char)).join("");
      setCorrectedWords(newCorrected);
      setCorrectAnswers((c) => c + 1);
      const newStates = [...wordStates];
      newStates[wordIndex] = "correct";
      setWordStates(newStates);
      const allCorrect = newCorrected.every((w, i) => w === currentTask.words[i]);
      if (allCorrect) {
        setShowSuccess(true);
        setTimeout(() => {
          if (currentTaskIndex < tasks.length - 1) setCurrentTaskIndex((i) => i + 1);
          else setIsCompleted(true);
        }, 1500);
      }
    } else {
      setIncorrectAnswers((c) => c + 1);
      const newStates = [...wordStates];
      newStates[wordIndex] = "incorrect";
      setWordStates(newStates);
      setTimeout(() => {
        setWordStates((s) => s.map((v, i) => (i === wordIndex ? "normal" : v)));
      }, 1000);
    }
    setSelectedLetter(null);
    setSelectedVowel(null);
  };

  const handleLetterClick = (wordIndex: number, letterIndex: number) => {
    const letter = correctedWords[wordIndex]?.[letterIndex];
    const isIncorrect = !!currentTask?.corrections[letter];
    if (selectedVowel) {
      if (isIncorrect) applyAttempt(wordIndex, letterIndex, selectedVowel);
      else setSelectedVowel(null);
    } else {
      if (isIncorrect) setSelectedLetter({ wordIndex, letterIndex });
      else setSelectedLetter(null);
    }
  };

  const handleVowelClick = (vowel: string) => {
    if (selectedLetter) applyAttempt(selectedLetter.wordIndex, selectedLetter.letterIndex, vowel);
    else setSelectedVowel(vowel);
  };

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete({
      testId: config.id,
      answers: [],
      totalTime: elapsedTime,
      correctCount: correctAnswers,
      incorrectCount: incorrectAnswers,
      startedAt: startedAtRef.current,
      completedAt: new Date().toISOString(),
    });
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Упражнение завершено!</h2>
          <p className="text-gray-600 mb-4">Верных: {correctAnswers} · Неверных: {incorrectAnswers} · Время: {formatTime(elapsedTime)}</p>
          <button type="button" onClick={handleFinish} className="rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700">
            Завершить тест
          </button>
        </div>
      </div>
    );
  }

  if (!currentTask) return null;

  const isVowelPanelVisible = selectedLetter !== null || selectedVowel !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="w-full text-xl font-bold text-slate-900">{config.name}</div>
          <div className="text-lg font-medium">Задание {currentTaskIndex + 1} из {tasks.length}</div>
          <div className="flex gap-6 text-sm">
            <span className="text-green-600 font-semibold">✓ {correctAnswers}</span>
            <span className="text-red-600 font-semibold">✗ {incorrectAnswers}</span>
            <span className="font-mono">⏱ {formatTime(elapsedTime)}</span>
            <button type="button" onClick={handleFinish} className="rounded-lg bg-indigo-600 px-4 py-2 text-white text-sm hover:bg-indigo-700">
              Завершить тест
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <div className="flex gap-8 flex-wrap">
          <div className="flex-1 min-w-[280px]">
            <div className="flex justify-center gap-8 mb-8">
              {currentTask.words.slice(0, wordsToShow).map((word, wordIndex) => (
                <div key={wordIndex} className="text-center">
                  <img src={currentTask.images[wordIndex] || "/placeholder.svg"} alt="" className="w-32 h-32 object-cover rounded-lg shadow-md mb-4 mx-auto bg-gray-100" />
                  <div className="flex gap-1 justify-center flex-wrap">
                    {correctedWords[wordIndex]?.split("").map((letter, letterIndex) => {
                      const isIncorrect = !!currentTask.corrections[letter];
                      const isSelected = selectedLetter?.wordIndex === wordIndex && selectedLetter?.letterIndex === letterIndex;
                      return (
                        <button
                          key={letterIndex}
                          type="button"
                          onClick={() => handleLetterClick(wordIndex, letterIndex)}
                          className={`w-10 h-10 border-2 rounded flex items-center justify-center font-bold text-lg ${isSelected ? "border-blue-500 bg-blue-100" : "border-gray-300"} ${wordStates[wordIndex] === "correct" ? "bg-green-100 border-green-500" : ""} ${wordStates[wordIndex] === "incorrect" ? "bg-red-100 border-red-500" : ""}`}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-48">
            <div className={`p-4 rounded-xl border-2 ${isVowelPanelVisible ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200" : "border-gray-200 bg-white"}`}>
              <h3 className="font-medium mb-4 text-center">Гласные</h3>
              <div className="grid grid-cols-2 gap-2">
                {VOWELS.map((v) => (
                  <button key={v} type="button" onClick={() => handleVowelClick(v)} className={`h-10 rounded border font-bold ${selectedVowel === v ? "ring-2 ring-purple-500 bg-purple-100" : "border-gray-300 hover:bg-gray-50"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {showSuccess && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-full p-8">✓</div>
          </div>
        )}
      </div>
    </div>
  );
}
