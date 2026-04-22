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
  const [readyToProceed, setReadyToProceed] = useState(false);
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
    setReadyToProceed(false);
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
        window.setTimeout(() => {
          setFeedback(null);
          setReadyToProceed(true);
        }, 900);
        return;
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

  const handleNextTask = () => {
    if (currentTaskIndex >= TASKS.length - 1) return;
    setCurrentTaskIndex((i) => i + 1);
  };

  if (!task || phrases.length === 0) return null;
  const isLastTask = currentTaskIndex === TASKS.length - 1;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow">
          <div className="w-full text-xl font-bold text-slate-900">
            {typeof config.seqNum === "number" ? `${config.seqNum}. ` : ""}
            {config.name}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={currentTaskIndex}
              onChange={(e) => setCurrentTaskIndex(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              aria-label="Выбор задания"
            >
              {TASKS.map((_, idx) => (
                <option key={idx} value={idx}>
                  Задание {idx + 1}
                </option>
              ))}
            </select>
            <div className="text-lg font-semibold">
              Задание {currentTaskIndex + 1} из {TASKS.length}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-semibold text-green-600">✓ {correctCount}</span>
            <span className="font-semibold text-red-600">✗ {incorrectCount}</span>
            <span className="font-mono">{formatTime(seconds)}</span>
            <button type="button" onClick={handleFinish} className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
              Завершить тест
            </button>
          </div>
        </div>

        <p className="mb-6 text-center text-2xl font-semibold text-slate-900">Подберите подпись к картинке</p>

        {/* Phrase bank (hide matched phrases) */}
        <div className="mb-10 flex flex-wrap justify-center gap-6">
          {phrases
            .filter((p) => !matches[p])
            .map((p) => {
              const phraseSelected = selectedPhrase === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPhraseClick(p)}
                  className={[
                    "w-full max-w-md rounded-lg px-6 py-3 text-center text-xl font-medium",
                    phraseSelected ? "bg-slate-200 ring-2 ring-blue-400" : "bg-slate-100 hover:bg-slate-200",
                  ].join(" ")}
                >
                  {p}
                </button>
              );
            })}
        </div>

        {/* Images grid (matched phrase shown below) */}
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-10 md:grid-cols-2">
          {images.map((img) => {
            const imageSelected = selectedImage === img;
            const matchedPhrase = Object.entries(matches).find(([, v]) => v === img)?.[0] ?? null;
            const imageMatched = Boolean(matchedPhrase);

            return (
              <div key={img} className="flex flex-col items-center gap-6">
                <button
                  type="button"
                  onClick={() => onImageClick(img)}
                  disabled={imageMatched}
                  className={[
                    "w-full max-w-md rounded-md border bg-white p-6",
                    imageMatched ? "border-green-500" : "border-slate-900/40",
                    imageSelected ? "ring-2 ring-blue-400" : "",
                    imageMatched ? "cursor-default" : "hover:ring-2 hover:ring-blue-200",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {shouldRenderImageCard(img) ? (
                    <img
                      alt={img}
                      loading="lazy"
                      width={360}
                      height={360}
                      decoding="async"
                      className="mx-auto aspect-square w-full max-w-[360px] object-contain"
                      src={imageCardSrcByLabel[img]}
                    />
                  ) : (
                    <div className="text-center text-gray-800">{img}</div>
                  )}
                </button>

                {matchedPhrase ? <div className="text-center text-2xl font-medium text-slate-900">{matchedPhrase}</div> : null}
              </div>
            );
          })}
        </div>

        {feedback && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
            <div className={`rounded-full p-8 text-6xl ${feedback === "correct" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
              {feedback === "correct" ? "✓" : "✗"}
            </div>
          </div>
        )}

        {readyToProceed && (
          <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              onClick={isLastTask ? handleFinish : handleNextTask}
              style={{
                height: 46,
                minWidth: 220,
                padding: "0 28px",
                borderRadius: 16,
                background: "#7dd3fc",
                color: "#ffffff",
                fontWeight: 500,
                fontSize: 32,
                lineHeight: 1,
                border: "0",
              }}
            >
              {isLastTask ? "Завершить" : "Дальше >"}
            </button>
          </div>
        )}
    </div>
  );
}
