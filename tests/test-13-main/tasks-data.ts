import RAW from "./tasks.json";

export type TaskItem = {
  id: number;
  words: string[]; // correct words, UPPERCASE
  incorrect: string[]; // incorrect words, UPPERCASE
  corrections: Record<string, string>; // incorrectChar -> correctChar (UPPERCASE)
  images: string[]; // public paths
};

type RawWord = { id: number; word: string; correctWord: string; image: string };
type RawTask = { id: number; words: RawWord[] };

function toUpperRu(s: string) {
  return String(s ?? "").toUpperCase();
}

function buildCorrections(pairs: Array<{ incorrect: string; correct: string }>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const p of pairs) {
    const a = toUpperRu(p.incorrect);
    const b = toUpperRu(p.correct);
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      const ai = a[i]!;
      const bi = b[i]!;
      if (ai !== bi) map[ai] = bi;
    }
  }
  return map;
}

const rawTasks = (RAW as unknown as RawTask[]) ?? [];

export const TASKS: TaskItem[] = rawTasks.map((t) => {
  const words = t.words.map((w) => toUpperRu(w.correctWord));
  const incorrect = t.words.map((w) => toUpperRu(w.word));
  const images = t.words.map((w) => `/tests/test-13-main/images/${w.image}`);
  const corrections = buildCorrections(t.words.map((w) => ({ incorrect: w.word, correct: w.correctWord })));
  return { id: t.id, words, incorrect, images, corrections };
});

export const VOWELS = ["А", "О", "У", "Э", "Ы", "Я", "Ё", "Ю", "Е", "И"];
