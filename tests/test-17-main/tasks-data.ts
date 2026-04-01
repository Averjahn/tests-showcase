export type Task = {
  id: number;
  category: string;
  syllables: string[];
  words: { text: string; correctSyllable: string }[];
};

export const tasks: Task[] = [
  {
    id: 1,
    category: "Категория 1",
    syllables: ["за", "ла", "да", "сы", "ша"],
    words: [
      { text: "бу__", correctSyllable: "сы" },
      { text: "ва__", correctSyllable: "за" },
      { text: "во__", correctSyllable: "да" },
      { text: "си__", correctSyllable: "ла" },
      { text: "ду__", correctSyllable: "ша" },
    ],
  },
  {
    id: 2,
    category: "Категория 1",
    syllables: ["ща", "ло", "ля", "ма", "ка"],
    words: [
      { text: "во__", correctSyllable: "ля" },
      { text: "гу__", correctSyllable: "ща" },
      { text: "щу__", correctSyllable: "ка" },
      { text: "ра__", correctSyllable: "ма" },
      { text: "се__", correctSyllable: "ло" },
    ],
  },
  {
    id: 3,
    category: "Категория 1",
    syllables: ["ша", "ло", "но", "ля", "ша"],
    words: [
      { text: "де__", correctSyllable: "ло" },
      { text: "до__", correctSyllable: "ля" },
      { text: "ки__", correctSyllable: "но" },
      { text: "ка__", correctSyllable: "ша" },
      { text: "ко__", correctSyllable: "ша" },
    ],
  },
  {
    id: 4,
    category: "Категория 1",
    syllables: ["ди", "фе", "па", "то", "да"],
    words: [
      { text: "ко__", correctSyllable: "фе" },
      { text: "ла__", correctSyllable: "па" },
      { text: "ле__", correctSyllable: "то" },
      { text: "мо__", correctSyllable: "да" },
      { text: "лю__", correctSyllable: "ди" },
    ],
  },
  {
    id: 5,
    category: "Категория 1",
    syllables: ["ло", "ня", "та", "па", "ща"],
    words: [
      { text: "лу__", correctSyllable: "ня" },
      { text: "ро__", correctSyllable: "та" },
      { text: "пи__", correctSyllable: "ща" },
      { text: "ды__", correctSyllable: "ня" },
      { text: "жа__", correctSyllable: "ло" },
    ],
  },
  {
    id: 6,
    category: "Категория 1",
    syllables: ["ты", "ре", "бо", "ло", "со"],
    words: [
      { text: "мо__", correctSyllable: "ре" },
      { text: "мы__", correctSyllable: "ло" },
      { text: "мя__", correctSyllable: "со" },
      { text: "не__", correctSyllable: "бо" },
      { text: "но__", correctSyllable: "ты" },
    ],
  },
];

