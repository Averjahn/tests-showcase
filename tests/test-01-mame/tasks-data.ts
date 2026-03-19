export interface Phrase {
  id: number;
  subject: string;
  verb: string;
  object: string;
  mediaPath: string; // картинка или видео
}

export interface Task {
  id: number;
  title: string;
  phrases: Phrase[];
}

// Медиа файлы лежат в: frontend/public/tests/test-01-mame/images/*
export const tasks: Task[] = [
  {
    id: 1,
    title: "Задание 1",
    phrases: [
      {
        id: 1,
        subject: "Школьник",
        verb: "завязывает",
        object: "шнурки",
        mediaPath: "/tests/test-01-mame/images/01-schoolboy-shoelaces1.jpg",
      },
      {
        id: 2,
        subject: "Лошадь",
        verb: "жуёт",
        object: "сено",
        mediaPath: "/tests/test-01-mame/images/02-horse-hay1.jpg",
      },
      {
        id: 3,
        subject: "Женщина",
        verb: "примеряет",
        object: "платье",
        mediaPath: "/tests/test-01-mame/images/03-woman-dress1.jpg",
      },
      {
        id: 4,
        subject: "Машинист",
        verb: "ведёт",
        object: "поезд",
        mediaPath: "/tests/test-01-mame/images/04-engineer-train1.jpg",
      },
      {
        id: 5,
        subject: "Воспитатель",
        verb: "читает",
        object: "сказку",
        mediaPath: "/tests/test-01-mame/images/05-teacher-book1.jpg",
      },
      {
        id: 6,
        subject: "Студент",
        verb: "тянет",
        object: "билет",
        mediaPath: "/tests/test-01-mame/images/06-student-ticket1.jpg",
      },
      {
        id: 7,
        subject: "Грибник",
        verb: "несёт",
        object: "корзину",
        mediaPath: "/tests/test-01-mame/images/07-mushroom-picker-basket1.jpg",
      },
      {
        id: 8,
        subject: "Солдат",
        verb: "копает",
        object: "окоп",
        mediaPath: "/tests/test-01-mame/images/08-soldier-trench1.jpg",
      },
      {
        id: 9,
        subject: "Пекарь",
        verb: "раскатывает",
        object: "тесто",
        mediaPath: "/tests/test-01-mame/images/09-baker-dough1.jpg",
      },
      {
        id: 10,
        subject: "Бегун",
        verb: "пьёт",
        object: "воду",
        mediaPath: "/tests/test-01-mame/images/10-runner-water1.jpg",
      },
      {
        id: 11,
        subject: "Часовщик",
        verb: "чинит",
        object: "часы",
        mediaPath: "/tests/test-01-mame/images/11-watchmaker-watch1.jpg",
      },
      {
        id: 12,
        subject: "Хозяйка",
        verb: "вытирает",
        object: "пыль",
        mediaPath: "/tests/test-01-mame/images/12-housewife-dust1.jpg",
      },
      {
        id: 13,
        subject: "Кассир",
        verb: "выдаёт",
        object: "чек",
        mediaPath: "/tests/test-01-mame/images/13-cashier-receipt1.jpg",
      },
      {
        id: 14,
        subject: "Курьер",
        verb: "везёт",
        object: "заказ",
        mediaPath: "/tests/test-01-mame/images/14-courier-box1.jpg",
      },
      {
        id: 15,
        subject: "Каменщик",
        verb: "кладёт",
        object: "кирпич",
        mediaPath: "/tests/test-01-mame/images/15-mason-brick1.jpg",
      },
      {
        id: 16,
        subject: "Именинник",
        verb: "задувает",
        object: "свечи",
        mediaPath: "/tests/test-01-mame/images/16-birthday-candles1.jpg",
      },
    ],
  },
];

