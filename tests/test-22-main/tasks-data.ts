export type PhraseItem = {
  id: string;
  /** Текст до пропуска */
  before: string;
  /** Правильный предлог */
  correctPreposition: string;
  /** Текст после пропуска */
  after: string;
};

export type Task = {
  id: number;
  phrases: PhraseItem[];
};

export type Category = {
  id: string;
  title: string;
  tasks: Task[];
};

export const categories: Category[] = [
  {
    id: "category-1",
    title: "Категория1",
    tasks: [
      {
        id: 1,
        phrases: [
          {
            id: "1-1",
            before: "Птица сидит",
            correctPreposition: "в",
            after: "клетке.",
          },
          {
            id: "1-2",
            before: "Белка сидит",
            correctPreposition: "на",
            after: "ветке.",
          },
          {
            id: "1-3",
            before: "Кошка сидит",
            correctPreposition: "под",
            after: "лавкой.",
          },
        ],
      },
      {
        id: 2,
        phrases: [
          {
            id: "2-1",
            before: "Огурцы растут",
            correctPreposition: "в",
            after: "парнике.",
          },
          {
            id: "2-2",
            before: "Шишки растут",
            correctPreposition: "на",
            after: "ёлке.",
          },
          {
            id: "2-3",
            before: "Огурцы растут",
            correctPreposition: "под",
            after: "плёнкой.",
          },
        ],
      },
      {
        id: 3,
        phrases: [
          {
            id: "3-1",
            before: "Календарь висит",
            correctPreposition: "под",
            after: "полкой.",
          },
          {
            id: "3-2",
            before: "Шуба висит",
            correctPreposition: "в",
            after: "шкафу.",
          },
          {
            id: "3-3",
            before: "Бельё висит",
            correctPreposition: "на",
            after: "верёвке.",
          },
        ],
      },
      {
        id: 4,
        phrases: [
          {
            id: "4-1",
            before: "Туфли надевают",
            correctPreposition: "под",
            after: "платье.",
          },
          {
            id: "4-2",
            before: "Костюм надевают",
            correctPreposition: "на",
            after: "праздник.",
          },
          {
            id: "4-3",
            before: "Кеды надевают",
            correctPreposition: "в",
            after: "спортивный зал.",
          },
        ],
      },
      {
        id: 5,
        phrases: [
          {
            id: "5-1",
            before: "Собака сидит",
            correctPreposition: "в",
            after: "конуре.",
          },
          {
            id: "5-2",
            before: "Заяц сидит",
            correctPreposition: "под",
            after: "кустом.",
          },
          {
            id: "5-3",
            before: "Ученик сидит",
            correctPreposition: "на",
            after: "стуле.",
          },
        ],
      },
      {
        id: 6,
        phrases: [
          {
            id: "6-1",
            before: "Картошка лежит",
            correctPreposition: "в",
            after: "мешке.",
          },
          {
            id: "6-2",
            before: "Монета лежит",
            correctPreposition: "на",
            after: "столе.",
          },
          {
            id: "6-3",
            before: "Собака лежит",
            correctPreposition: "под",
            after: "деревом.",
          },
        ],
      },
      {
        id: 7,
        phrases: [
          {
            id: "7-1",
            before: "Господин идёт",
            correctPreposition: "по",
            after: "аллее.",
          },
          {
            id: "7-2",
            before: "Дедушка идёт",
            correctPreposition: "в",
            after: "поликлинику.",
          },
          {
            id: "7-3",
            before: "Девушка идёт",
            correctPreposition: "с",
            after: "чемоданом.",
          },
        ],
      },
      {
        id: 8,
        phrases: [
          {
            id: "8-1",
            before: "Птица летит",
            correctPreposition: "по",
            after: "небу.",
          },
          {
            id: "8-2",
            before: "Пассажир летит",
            correctPreposition: "на",
            after: "самолёте.",
          },
          {
            id: "8-3",
            before: "Женщина летит",
            correctPreposition: "с",
            after: "ребёнком.",
          },
        ],
      },
      {
        id: 9,
        phrases: [
          {
            id: "9-1",
            before: "Бабушка готовит",
            correctPreposition: "в",
            after: "духовке.",
          },
          {
            id: "9-2",
            before: "Повар готовит",
            correctPreposition: "по",
            after: "рецепту.",
          },
          {
            id: "9-3",
            before: "Мама готовит",
            correctPreposition: "с",
            after: "любовью.",
          },
        ],
      },
      {
        id: 10,
        phrases: [
          {
            id: "10-1",
            before: "Малыш рисует",
            correctPreposition: "в",
            after: "альбоме.",
          },
          {
            id: "10-2",
            before: "Художник рисует",
            correctPreposition: "с",
            after: "натуры.",
          },
          {
            id: "10-3",
            before: "Хулиган рисует",
            correctPreposition: "на",
            after: "стене.",
          },
        ],
      },
      {
        id: 11,
        phrases: [
          {
            id: "11-1",
            before: "Вещи складывают",
            correctPreposition: "на",
            after: "полку.",
          },
          {
            id: "11-2",
            before: "Самолетик складывают",
            correctPreposition: "из",
            after: "бумаги.",
          },
          {
            id: "11-3",
            before: "Числа складывают",
            correctPreposition: "в",
            after: "уме.",
          },
        ],
      },
      {
        id: 12,
        phrases: [
          {
            id: "12-1",
            before: "Торшер стоит",
            correctPreposition: "у",
            after: "кресла.",
          },
          {
            id: "12-2",
            before: "Ваза стоит",
            correctPreposition: "на",
            after: "столе.",
          },
          {
            id: "12-3",
            before: "Пиво стоит",
            correctPreposition: "в",
            after: "холодильнике.",
          },
        ],
      },
      {
        id: 13,
        phrases: [
          {
            id: "13-1",
            before: "Студент занимается",
            correctPreposition: "с",
            after: "репетитором.",
          },
          {
            id: "13-2",
            before: "Спортсмен занимается",
            correctPreposition: "в",
            after: "зале.",
          },
          {
            id: "13-3",
            before: "Школьник занимается",
            correctPreposition: "по",
            after: "расписанию.",
          },
        ],
      },
      {
        id: 14,
        phrases: [
          {
            id: "14-1",
            before: "Няня смотрит",
            correctPreposition: "за",
            after: "ребенком.",
          },
          {
            id: "14-2",
            before: "Моряк смотрит",
            correctPreposition: "в",
            after: "бинокль.",
          },
          {
            id: "14-3",
            before: "Тренер смотрит",
            correctPreposition: "на",
            after: "секундомер.",
          },
        ],
      },
      {
        id: 15,
        phrases: [
          {
            id: "15-1",
            before: "Овощи покупают",
            correctPreposition: "на",
            after: "рынке.",
          },
          {
            id: "15-2",
            before: "Диван покупают",
            correctPreposition: "в",
            after: "магазине.",
          },
          {
            id: "15-3",
            before: "Торт покупают",
            correctPreposition: "к",
            after: "празднику.",
          },
        ],
      },
    ],
  },
];

