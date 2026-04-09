import type { PhraseToImageItem } from "../shared/phraseToImageTest";

// Понимание речи: фраза → выбор правильной картинки (те же данные, можно расширить другим контентом)
export const tasks: PhraseToImageItem[] = [
  { id: 1, phrase: "Школьник завязывает шнурки", mediaPath: "/tests/test-01-mame/images/01-schoolboy-shoelaces1.jpg" },
  { id: 2, phrase: "Лошадь жуёт сено", mediaPath: "/tests/test-01-mame/images/02-horse-hay1.jpg" },
  { id: 3, phrase: "Женщина примеряет платье", mediaPath: "/tests/test-01-mame/images/03-woman-dress1.jpg" },
  { id: 4, phrase: "Машинист ведёт поезд", mediaPath: "/tests/test-01-mame/images/04-engineer-train1.jpg" },
  { id: 5, phrase: "Воспитатель читает сказку", mediaPath: "/tests/test-01-mame/images/05-teacher-book1.jpg" },
  { id: 6, phrase: "Студент тянет билет", mediaPath: "/tests/test-01-mame/images/06-student-ticket1.jpg" },
  { id: 7, phrase: "Грибник несёт корзину", mediaPath: "/tests/test-01-mame/images/07-mushroom-picker-basket1.jpg" },
  { id: 8, phrase: "Пекарь раскатывает тесто", mediaPath: "/tests/test-01-mame/images/09-baker-dough1.jpg" },
  { id: 9, phrase: "Бегун пьёт воду", mediaPath: "/tests/test-01-mame/images/10-runner-water1.jpg" },
  { id: 10, phrase: "Хозяйка вытирает пыль", mediaPath: "/tests/test-01-mame/images/12-housewife-dust1.jpg" },
];
