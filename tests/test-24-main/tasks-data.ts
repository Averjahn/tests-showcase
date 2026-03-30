export type HintLabel = "Кто?" | "Что делает?" | "Что?" | "Чем?" | "Где?" | "Кому?";

export type PhraseCorrect = {
  who?: string;
  verb?: string;
  object?: string;
  tool?: string;
  place?: string;
  whom?: string;
};

export type Task = {
  id: number;
  hints: HintLabel[];
  phrases: { id: number; correct: PhraseCorrect }[];
};

/**
 * Источник данных: `c:\\Users\\ааа\\Downloads\\24test.json`
 */
export const tasks: Task[] = [
  {
    id: 1,
    hints: ["Кто?", "Что делает?", "Что?", "Чем?"],
    phrases: [
      { id: 1, correct: { who: "девушка", verb: "красит", object: "губы", tool: "помадой" } },
      { id: 2, correct: { who: "художник", verb: "рисует", object: "картину", tool: "карандашом" } },
      { id: 3, correct: { who: "повар", verb: "режет", object: "овощи", tool: "ножом" } },
      { id: 4, correct: { who: "маляр", verb: "красит", object: "забор", tool: "кистью" } },
      { id: 5, correct: { who: "ребёнок", verb: "ест", object: "суп", tool: "ложкой" } },
      { id: 6, correct: { who: "парикмахер", verb: "сушит", object: "волосы", tool: "феном" } },
    ],
  },
  {
    id: 2,
    hints: ["Кто?", "Что делает?", "Что?", "Чем?"],
    phrases: [
      { id: 1, correct: { who: "бобёр", verb: "грызёт", object: "дерево", tool: "зубами" } },
      { id: 2, correct: { who: "дятел", verb: "долбит", object: "кору", tool: "клювом" } },
      { id: 3, correct: { who: "кошка", verb: "ловит", object: "мышку", tool: "лапами" } },
      { id: 4, correct: { who: "орёл", verb: "хватает", object: "добычу", tool: "когтями" } },
      { id: 5, correct: { who: "слон", verb: "пьёт", object: "воду", tool: "хоботом" } },
      { id: 6, correct: { who: "паук", verb: "ловит", object: "муху", tool: "паутиной" } },
    ],
  },
  {
    id: 3,
    hints: ["Кто?", "Что делает?", "Что?", "Чем?"],
    phrases: [
      { id: 1, correct: { who: "учитель", verb: "пишет", object: "слово", tool: "мелом" } },
      { id: 2, correct: { who: "ученик", verb: "рисует", object: "схему", tool: "линейкой" } },
      { id: 3, correct: { who: "девочка", verb: "клеит", object: "картинку", tool: "ножницами" } },
      { id: 4, correct: { who: "мальчик", verb: "стирает", object: "ошибку", tool: "резинкой" } },
      { id: 5, correct: { who: "учитель", verb: "измеряет", object: "доску", tool: "рулеткой" } },
      { id: 6, correct: { who: "ученица", verb: "чертит", object: "круг", tool: "циркулем" } },
    ],
  },
  {
    id: 4,
    hints: ["Кто?", "Что делает?", "Что?", "Чем?"],
    phrases: [
      { id: 1, correct: { who: "мама", verb: "режет", object: "хлеб", tool: "ножом" } },
      { id: 2, correct: { who: "повар", verb: "мешает", object: "кашу", tool: "ложкой" } },
      { id: 3, correct: { who: "бабушка", verb: "трёт", object: "морковь", tool: "тёркой" } },
      { id: 4, correct: { who: "папа", verb: "жарит", object: "котлеты", tool: "сковородой" } },
      { id: 5, correct: { who: "девочка", verb: "пьёт", object: "чай", tool: "кружкой" } },
      { id: 6, correct: { who: "повар", verb: "взбивает", object: "яйца", tool: "венчиком" } },
    ],
  },
  {
    id: 5,
    hints: ["Кто?", "Что делает?", "Что?", "Чем?"],
    phrases: [
      { id: 1, correct: { who: "доктор", verb: "режет", object: "бинт", tool: "ножницами" } },
      { id: 2, correct: { who: "садовник", verb: "поливает", object: "цветы", tool: "лейкой" } },
      { id: 3, correct: { who: "столяр", verb: "забивает", object: "гвоздь", tool: "молотком" } },
      { id: 4, correct: { who: "портной", verb: "шьёт", object: "платье", tool: "иголкой" } },
      { id: 5, correct: { who: "пианист", verb: "играет", object: "мелодию", tool: "пальцами" } },
      { id: 6, correct: { who: "фотограф", verb: "снимает", object: "закат", tool: "камерой" } },
    ],
  },
  {
    id: 6,
    hints: ["Кто?", "Что делает?", "Что?", "Чем?"],
    phrases: [
      { id: 1, correct: { who: "рыбак", verb: "ловит", object: "рыбу", tool: "удочкой" } },
      { id: 2, correct: { who: "охотник", verb: "рубит", object: "дрова", tool: "топором" } },
      { id: 3, correct: { who: "пекарь", verb: "режет", object: "торт", tool: "ножом" } },
      { id: 4, correct: { who: "медсестра", verb: "меряет", object: "давление", tool: "тонометром" } },
      { id: 5, correct: { who: "учёный", verb: "смотрит", object: "клетки", tool: "микроскопом" } },
      { id: 6, correct: { who: "штукатур", verb: "мажет", object: "стену", tool: "шпателем" } },
    ],
  },
  {
    id: 7,
    hints: ["Кто?", "Что делает?", "Что?", "Чем?"],
    phrases: [
      { id: 1, correct: { who: "мальчик", verb: "копает", object: "яму", tool: "лопатой" } },
      { id: 2, correct: { who: "девочка", verb: "расчёсывает", object: "волосы", tool: "расчёской" } },
      { id: 3, correct: { who: "дворник", verb: "метёт", object: "двор", tool: "метлой" } },
      { id: 4, correct: { who: "папа", verb: "пилит", object: "доску", tool: "пилой" } },
      { id: 5, correct: { who: "мама", verb: "гладит", object: "рубашку", tool: "утюгом" } },
      { id: 6, correct: { who: "ребёнок", verb: "чистит", object: "зубы", tool: "щёткой" } },
    ],
  },
  {
    id: 8,
    hints: ["Кто?", "Что делает?", "Что?", "Чем?"],
    phrases: [
      { id: 1, correct: { who: "кузнец", verb: "кует", object: "подкову", tool: "молотом" } },
      { id: 2, correct: { who: "скрипач", verb: "играет", object: "сонату", tool: "смычком" } },
      { id: 3, correct: { who: "хирург", verb: "делает", object: "надрез", tool: "скальпелем" } },
      { id: 4, correct: { who: "лесник", verb: "валит", object: "сосну", tool: "бензопилой" } },
      { id: 5, correct: { who: "гончар", verb: "лепит", object: "вазу", tool: "руками" } },
      { id: 6, correct: { who: "сапожник", verb: "чинит", object: "ботинок", tool: "шилом" } },
    ],
  },
  {
    id: 9,
    hints: ["Кто?", "Что делает?", "Где?"],
    phrases: [
      { id: 1, correct: { who: "рыбак", verb: "рыбачит", place: "на реке" } },
      { id: 2, correct: { who: "дети", verb: "играют", place: "во дворе" } },
      { id: 3, correct: { who: "бабушка", verb: "сидит", place: "на скамейке" } },
      { id: 4, correct: { who: "кот", verb: "спит", place: "на диване" } },
      { id: 5, correct: { who: "птица", verb: "поёт", place: "на ветке" } },
      { id: 6, correct: { who: "ученик", verb: "читает", place: "в библиотеке" } },
    ],
  },
  {
    id: 10,
    hints: ["Кто?", "Что делает?", "Где?"],
    phrases: [
      { id: 1, correct: { who: "медведь", verb: "спит", place: "в берлоге" } },
      { id: 2, correct: { who: "белка", verb: "прыгает", place: "по деревьям" } },
      { id: 3, correct: { who: "лягушка", verb: "сидит", place: "на кувшинке" } },
      { id: 4, correct: { who: "орёл", verb: "парит", place: "в небе" } },
      { id: 5, correct: { who: "крот", verb: "роет", place: "под землёй" } },
      { id: 6, correct: { who: "рыба", verb: "плывёт", place: "в реке" } },
    ],
  },
  {
    id: 11,
    hints: ["Кто?", "Что делает?", "Где?"],
    phrases: [
      { id: 1, correct: { who: "повар", verb: "готовит", place: "на кухне" } },
      { id: 2, correct: { who: "врач", verb: "принимает", place: "в больнице" } },
      { id: 3, correct: { who: "учитель", verb: "объясняет", place: "в классе" } },
      { id: 4, correct: { who: "пилот", verb: "летит", place: "в самолёте" } },
      { id: 5, correct: { who: "шахтёр", verb: "работает", place: "в шахте" } },
      { id: 6, correct: { who: "пастух", verb: "пасёт", place: "на лугу" } },
    ],
  },
  {
    id: 12,
    hints: ["Кто?", "Что делает?", "Где?"],
    phrases: [
      { id: 1, correct: { who: "дети", verb: "купаются", place: "в озере" } },
      { id: 2, correct: { who: "турист", verb: "ночует", place: "в палатке" } },
      { id: 3, correct: { who: "спортсмен", verb: "тренируется", place: "на стадионе" } },
      { id: 4, correct: { who: "актёр", verb: "выступает", place: "на сцене" } },
      { id: 5, correct: { who: "садовник", verb: "копает", place: "в огороде" } },
      { id: 6, correct: { who: "мама", verb: "отдыхает", place: "на веранде" } },
    ],
  },
  {
    id: 13,
    hints: ["Кто?", "Что делает?", "Где?"],
    phrases: [
      { id: 1, correct: { who: "дельфин", verb: "плавает", place: "в море" } },
      { id: 2, correct: { who: "обезьяна", verb: "висит", place: "на лиане" } },
      { id: 3, correct: { who: "черепаха", verb: "ползёт", place: "по берегу" } },
      { id: 4, correct: { who: "волк", verb: "воет", place: "в лесу" } },
      { id: 5, correct: { who: "пингвин", verb: "стоит", place: "на льдине" } },
      { id: 6, correct: { who: "верблюд", verb: "идёт", place: "по пустыне" } },
    ],
  },
  {
    id: 14,
    hints: ["Кто?", "Что делает?", "Где?"],
    phrases: [
      { id: 1, correct: { who: "ребёнок", verb: "рисует", place: "за столом" } },
      { id: 2, correct: { who: "бабушка", verb: "вяжет", place: "в кресле" } },
      { id: 3, correct: { who: "папа", verb: "читает", place: "на диване" } },
      { id: 4, correct: { who: "кот", verb: "греется", place: "у батареи" } },
      { id: 5, correct: { who: "мама", verb: "готовит", place: "у плиты" } },
      { id: 6, correct: { who: "девочка", verb: "играет", place: "в своей комнате" } },
    ],
  },
  {
    id: 15,
    hints: ["Кто?", "Что делает?", "Кому?", "Что?"],
    phrases: [
      { id: 1, correct: { who: "мама", verb: "дарит", whom: "дочке", object: "куклу" } },
      { id: 2, correct: { who: "учитель", verb: "даёт", whom: "ученику", object: "книгу" } },
      { id: 3, correct: { who: "дедушка", verb: "несёт", whom: "внуку", object: "мяч" } },
      { id: 4, correct: { who: "мальчик", verb: "дарит", whom: "другу", object: "машинку" } },
      { id: 5, correct: { who: "врач", verb: "даёт", whom: "пациенту", object: "таблетки" } },
      { id: 6, correct: { who: "папа", verb: "покупает", whom: "сыну", object: "велосипед" } },
    ],
  },
  {
    id: 16,
    hints: ["Кто?", "Что делает?", "Кому?", "Что?"],
    phrases: [
      { id: 1, correct: { who: "бабушка", verb: "печёт", whom: "внучке", object: "пирог" } },
      { id: 2, correct: { who: "девочка", verb: "несёт", whom: "маме", object: "цветы" } },
      { id: 3, correct: { who: "тренер", verb: "бросает", whom: "игроку", object: "мяч" } },
      { id: 4, correct: { who: "продавец", verb: "даёт", whom: "покупателю", object: "сдачу" } },
      { id: 5, correct: { who: "почтальон", verb: "несёт", whom: "бабушке", object: "письмо" } },
      { id: 6, correct: { who: "повар", verb: "подаёт", whom: "гостю", object: "суп" } },
    ],
  },
  {
    id: 17,
    hints: ["Кто?", "Что делает?", "Кому?", "Что?"],
    phrases: [
      { id: 1, correct: { who: "ученик", verb: "показывает", whom: "учителю", object: "тетрадь" } },
      { id: 2, correct: { who: "мальчик", verb: "читает", whom: "сестре", object: "сказку" } },
      { id: 3, correct: { who: "папа", verb: "несёт", whom: "маме", object: "торт" } },
      { id: 4, correct: { who: "волшебник", verb: "дарит", whom: "принцессе", object: "корону" } },
      { id: 5, correct: { who: "ветеринар", verb: "даёт", whom: "собаке", object: "лекарство" } },
      { id: 6, correct: { who: "дедушка", verb: "рассказывает", whom: "внуку", object: "историю" } },
    ],
  },
  {
    id: 18,
    hints: ["Кто?", "Что делает?", "Кому?", "Что?"],
    phrases: [
      { id: 1, correct: { who: "кролик", verb: "несёт", whom: "зайчонку", object: "морковку" } },
      { id: 2, correct: { who: "птица", verb: "несёт", whom: "птенцу", object: "червяка" } },
      { id: 3, correct: { who: "пчела", verb: "приносит", whom: "пчеловоду", object: "мёд" } },
      { id: 4, correct: { who: "кошка", verb: "тащит", whom: "котёнку", object: "мышку" } },
      { id: 5, correct: { who: "собака", verb: "несёт", whom: "хозяину", object: "газету" } },
      { id: 6, correct: { who: "белка", verb: "тащит", whom: "бельчонку", object: "орех" } },
    ],
  },
  {
    id: 19,
    hints: ["Кто?", "Что делает?", "Кому?", "Что?"],
    phrases: [
      { id: 1, correct: { who: "повар", verb: "готовит", whom: "туристам", object: "шашлык" } },
      { id: 2, correct: { who: "официант", verb: "подаёт", whom: "гостям", object: "меню" } },
      { id: 3, correct: { who: "мама", verb: "наливает", whom: "детям", object: "компот" } },
      { id: 4, correct: { who: "бабушка", verb: "режет", whom: "внукам", object: "арбуз" } },
      { id: 5, correct: { who: "папа", verb: "жарит", whom: "семье", object: "блины" } },
      { id: 6, correct: { who: "кондитер", verb: "делает", whom: "имениннику", object: "торт" } },
    ],
  },
  {
    id: 20,
    hints: ["Кто?", "Что делает?", "Кому?", "Что?"],
    phrases: [
      { id: 1, correct: { who: "художник", verb: "рисует", whom: "заказчику", object: "портрет" } },
      { id: 2, correct: { who: "скрипач", verb: "играет", whom: "публике", object: "вальс" } },
      { id: 3, correct: { who: "актриса", verb: "дарит", whom: "зрителям", object: "улыбку" } },
      { id: 4, correct: { who: "писатель", verb: "читает", whom: "детям", object: "стихи" } },
      { id: 5, correct: { who: "ученик", verb: "дарит", whom: "учителю", object: "открытку" } },
      { id: 6, correct: { who: "фотограф", verb: "показывает", whom: "маме", object: "снимок" } },
    ],
  },
  {
    id: 21,
    hints: ["Кто?", "Что делает?", "Что?", "Чем?"],
    phrases: [
      { id: 1, correct: { who: "строитель", verb: "кладёт", object: "кирпич", tool: "мастерком" } },
      { id: 2, correct: { who: "электрик", verb: "крутит", object: "болт", tool: "отвёрткой" } },
      { id: 3, correct: { who: "водитель", verb: "крутит", object: "руль", tool: "руками" } },
      { id: 4, correct: { who: "программист", verb: "пишет", object: "код", tool: "клавиатурой" } },
      { id: 5, correct: { who: "балерина", verb: "рисует", object: "круг", tool: "ногой" } },
      { id: 6, correct: { who: "хирург", verb: "зашивает", object: "рану", tool: "иглой" } },
    ],
  },
  {
    id: 22,
    hints: ["Кто?", "Что делает?", "Что?", "Чем?"],
    phrases: [
      { id: 1, correct: { who: "ёж", verb: "несёт", object: "яблоко", tool: "иголками" } },
      { id: 2, correct: { who: "бобёр", verb: "строит", object: "плотину", tool: "зубами" } },
      { id: 3, correct: { who: "дятел", verb: "ищет", object: "жуков", tool: "клювом" } },
      { id: 4, correct: { who: "медведь", verb: "ловит", object: "лосося", tool: "лапой" } },
      { id: 5, correct: { who: "выдра", verb: "разбивает", object: "ракушку", tool: "камнем" } },
      { id: 6, correct: { who: "ворона", verb: "тащит", object: "кусок", tool: "клювом" } },
    ],
  },
  {
    id: 23,
    hints: ["Кто?", "Что делает?", "Что?", "Чем?"],
    phrases: [
      { id: 1, correct: { who: "мальчик", verb: "рисует", object: "дракона", tool: "фломастером" } },
      { id: 2, correct: { who: "девочка", verb: "лепит", object: "снеговика", tool: "руками" } },
      { id: 3, correct: { who: "ребёнок", verb: "режет", object: "бумагу", tool: "ножницами" } },
      { id: 4, correct: { who: "школьник", verb: "клеит", object: "модель", tool: "клеем" } },
      { id: 5, correct: { who: "малыш", verb: "рисует", object: "солнце", tool: "мелком" } },
      { id: 6, correct: { who: "ученик", verb: "раскрашивает", object: "карту", tool: "красками" } },
    ],
  },
  {
    id: 24,
    hints: ["Кто?", "Что делает?", "Где?"],
    phrases: [
      { id: 1, correct: { who: "лыжник", verb: "катится", place: "с горы" } },
      { id: 2, correct: { who: "пловец", verb: "тренируется", place: "в бассейне" } },
      { id: 3, correct: { who: "боксёр", verb: "тренируется", place: "в зале" } },
      { id: 4, correct: { who: "гимнастка", verb: "выступает", place: "на ковре" } },
      { id: 5, correct: { who: "теннисист", verb: "играет", place: "на корте" } },
      { id: 6, correct: { who: "хоккеист", verb: "катается", place: "на льду" } },
    ],
  },
  {
    id: 25,
    hints: ["Кто?", "Что делает?", "Где?"],
    phrases: [
      { id: 1, correct: { who: "капитан", verb: "стоит", place: "на мостике" } },
      { id: 2, correct: { who: "водолаз", verb: "плывёт", place: "под водой" } },
      { id: 3, correct: { who: "альпинист", verb: "лезет", place: "по скале" } },
      { id: 4, correct: { who: "парашютист", verb: "летит", place: "в воздухе" } },
      { id: 5, correct: { who: "спелеолог", verb: "ползёт", place: "в пещере" } },
      { id: 6, correct: { who: "космонавт", verb: "работает", place: "на орбите" } },
    ],
  },
  {
    id: 26,
    hints: ["Кто?", "Что делает?", "Где?"],
    phrases: [
      { id: 1, correct: { who: "продавец", verb: "работает", place: "в магазине" } },
      { id: 2, correct: { who: "библиотекарь", verb: "сидит", place: "за стойкой" } },
      { id: 3, correct: { who: "кассир", verb: "стоит", place: "у кассы" } },
      { id: 4, correct: { who: "охранник", verb: "стоит", place: "у входа" } },
      { id: 5, correct: { who: "официант", verb: "бегает", place: "по залу" } },
      { id: 6, correct: { who: "парикмахер", verb: "работает", place: "в салоне" } },
    ],
  },
  {
    id: 27,
    hints: ["Кто?", "Что делает?", "Кому?", "Что?"],
    phrases: [
      { id: 1, correct: { who: "волшебник", verb: "дарит", whom: "мальчику", object: "меч" } },
      { id: 2, correct: { who: "фея", verb: "даёт", whom: "Золушке", object: "туфельки" } },
      { id: 3, correct: { who: "дракон", verb: "несёт", whom: "принцессе", object: "цветок" } },
      { id: 4, correct: { who: "гном", verb: "показывает", whom: "герою", object: "карту" } },
      { id: 5, correct: { who: "русалка", verb: "дарит", whom: "моряку", object: "жемчуг" } },
      { id: 6, correct: { who: "леший", verb: "несёт", whom: "путнику", object: "гриб" } },
    ],
  },
  {
    id: 28,
    hints: ["Кто?", "Что делает?", "Что?", "Чем?"],
    phrases: [
      { id: 1, correct: { who: "геолог", verb: "колет", object: "породу", tool: "молотком" } },
      { id: 2, correct: { who: "агроном", verb: "рыхлит", object: "почву", tool: "граблями" } },
      { id: 3, correct: { who: "пожарный", verb: "тушит", object: "огонь", tool: "шлангом" } },
      { id: 4, correct: { who: "ювелир", verb: "полирует", object: "кольцо", tool: "тряпочкой" } },
      { id: 5, correct: { who: "токарь", verb: "точит", object: "деталь", tool: "резцом" } },
      { id: 6, correct: { who: "стеклодув", verb: "выдувает", object: "вазу", tool: "трубкой" } },
    ],
  },
  {
    id: 29,
    hints: ["Кто?", "Что делает?", "Кому?", "Что?"],
    phrases: [
      { id: 1, correct: { who: "тренер", verb: "объясняет", whom: "спортсмену", object: "приём" } },
      { id: 2, correct: { who: "инструктор", verb: "показывает", whom: "новичку", object: "позу" } },
      { id: 3, correct: { who: "судья", verb: "даёт", whom: "игроку", object: "карточку" } },
      { id: 4, correct: { who: "болельщик", verb: "дарит", whom: "чемпиону", object: "цветы" } },
      { id: 5, correct: { who: "капитан", verb: "передаёт", whom: "команде", object: "кубок" } },
      { id: 6, correct: { who: "врач", verb: "показывает", whom: "атлету", object: "результат" } },
    ],
  },
  {
    id: 30,
    hints: ["Кто?", "Что делает?", "Что?", "Чем?"],
    phrases: [
      { id: 1, correct: { who: "мама", verb: "вытирает", object: "пыль", tool: "тряпкой" } },
      { id: 2, correct: { who: "папа", verb: "красит", object: "дверь", tool: "валиком" } },
      { id: 3, correct: { who: "дедушка", verb: "косит", object: "траву", tool: "косой" } },
      { id: 4, correct: { who: "бабушка", verb: "поливает", object: "грядки", tool: "лейкой" } },
      { id: 5, correct: { who: "мальчик", verb: "моет", object: "машину", tool: "губкой" } },
      { id: 6, correct: { who: "девочка", verb: "подметает", object: "пол", tool: "веником" } },
    ],
  },
];

