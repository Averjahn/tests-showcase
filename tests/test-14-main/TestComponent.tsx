"use client";

import { useState, useEffect, useRef } from "react";
import type { TestComponentProps, TestResult } from "../shared/TestInterface";
import { TASKS } from "./tasks-data";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Test14Main({ config, onComplete }: TestComponentProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [phrases, setPhrases] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const startedAtRef = useRef(new Date().toISOString());
  const completedRef = useRef(false);

  const task = TASKS[currentTaskIndex];
  const count = 2;
  const imageCardSrcByLabel: Record<string, string> = {
    "Рабочий несёт ящик":
      "/tests/test-14-main/images/1%20worker%20carries%20box.jpeg",
    "Девочка поливает цветы":
      "/tests/test-14-main/images/2%20girl%20waters%20flowers.jpeg",
    "Повар режет салат":
      "/tests/test-14-main/images/3%20cook%20cuts%20salad.jpeg",
    "Бабушка пишет письмо":
      "/tests/test-14-main/images/4%20grandma%20writing%20letter.jpeg",
    "Садовник стрижёт кусты":
      "/tests/test-14-main/images/6%20gardener%20cuts%20the%20bushes.jpeg",
    "Шахтёр добывает уголь":
      "/tests/test-14-main/images/5%20miner%20extracts%20coal.jpeg",
    "Папа покупает билеты":
      "/tests/test-14-main/images/7%20dad%20buys%20tickets.jpeg",
    "Мальчик вытирает руки":
      "/tests/test-14-main/images/8%20boy%20wipes%20hands.jpeg",
    "Девушка красит ногти":
      "/tests/test-14-main/images/9%20girl%20paints%20nails.jpeg",
    "Папа моет руки":
      "/tests/test-14-main/images/10%20dad%20washes%20hands.jpeg",
  };
  const shouldRenderImageCard = (img: string) => !!imageCardSrcByLabel[img];

  useEffect(() => {
    if (!task) return;
    const cleaned = task.phrases.map((p) => p.replace(/\s*\(.*?\)\s*/g, "").trim());
    const selected = cleaned.slice(0, count);
    setPhrases([...selected].sort(() => Math.random() - 0.5));
    setImages(selected);
    setMatches({});
    setSelectedPhrase(null);
    setSelectedImage(null);
  }, [currentTaskIndex, task]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const checkMatch = (phrase: string, image: string) => {
    const isCorrect = phrase === image;
    setFeedback(isCorrect ? "correct" : "incorrect");
    if (isCorrect) {
      setMatches((m) => ({ ...m, [phrase]: image }));
      setCorrectCount((c) => c + 1);
      setSelectedPhrase(null);
      setSelectedImage(null);
      const newMatches = { ...matches, [phrase]: image };
      if (Object.keys(newMatches).length === phrases.length) {
        const finalCorrect = correctCount + 1;
        setTimeout(() => {
          if (currentTaskIndex >= TASKS.length - 1) {
            if (completedRef.current) return;
            completedRef.current = true;
            onComplete({
              testId: config.id,
              answers: [],
              totalTime: seconds * 1000,
              correctCount: finalCorrect,
              incorrectCount,
              startedAt: startedAtRef.current,
              completedAt: new Date().toISOString(),
            });
          } else setCurrentTaskIndex((i) => i + 1);
        }, 1000);
      }
    } else {
      setIncorrectCount((c) => c + 1);
      setSelectedPhrase(null);
      setSelectedImage(null);
    }
    setTimeout(() => setFeedback(null), 1000);
  };

  const onPhraseClick = (phrase: string) => {
    if (matches[phrase]) return;
    if (selectedImage) {
      checkMatch(phrase, selectedImage);
    } else setSelectedPhrase(selectedPhrase === phrase ? null : phrase);
  };

  const onImageClick = (image: string) => {
    if (Object.values(matches).includes(image)) return;
    if (selectedPhrase) {
      checkMatch(selectedPhrase, image);
    } else setSelectedImage(selectedImage === image ? null : image);
  };

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete({
      testId: config.id,
      answers: [],
      totalTime: seconds * 1000,
      correctCount,
      incorrectCount,
      startedAt: startedAtRef.current,
      completedAt: new Date().toISOString(),
    });
  };

  if (!task || phrases.length === 0) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow">
          <div className="w-full text-xl font-bold text-slate-900">{config.name}</div>
          <div className="font-semibold">Задание {currentTaskIndex + 1} из {TASKS.length}</div>
          <div className="flex items-center gap-4">
            <span className="text-green-600 font-semibold">✓ {correctCount}</span>
            <span className="text-red-600 font-semibold">✗ {incorrectCount}</span>
            <span className="font-mono">{formatTime(seconds)}</span>
            <button type="button" onClick={handleFinish} className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
              Завершить тест
            </button>
          </div>
        </div>

        <p className="mb-4 text-center text-gray-600">Подберите подпись к картинке</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">Фразы</h3>
            {phrases.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPhraseClick(p)}
                disabled={!!matches[p]}
                className={`w-full rounded-xl border-2 p-4 text-left ${selectedPhrase === p ? "border-blue-500 bg-blue-50" : "border-gray-200"} ${matches[p] ? "opacity-60 cursor-default" : "hover:border-indigo-300"}`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">Картинки (выберите подпись)</h3>
            {images.map((img) => (
              <button
                key={img}
                type="button"
                onClick={() => onImageClick(img)}
                disabled={Object.values(matches).includes(img)}
                className={`w-full rounded-xl border-2 p-4 text-left ${selectedImage === img ? "border-blue-500 bg-blue-50" : "border-gray-200"} ${Object.values(matches).includes(img) ? "opacity-60 cursor-default" : "hover:border-indigo-300"}`}
              >
                {shouldRenderImageCard(img) ? (
                  <div className="relative rounded-lg cursor-pointer transition-all">
                    <img
                      alt={img}
                      loading="lazy"
                      width={200}
                      height={200}
                      decoding="async"
                      className="w-full aspect-square object-contain rounded"
                      src={imageCardSrcByLabel[img]}
                    />
                  </div>
                ) : (
                  <span className="text-gray-800">{img}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {feedback && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
            <div className={`rounded-full p-8 text-6xl ${feedback === "correct" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
              {feedback === "correct" ? "✓" : "✗"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
