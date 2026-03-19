export interface ExerciseBlock {
  correctEndings: string[];
  incorrectEndings: string[];
  allEndings: string[];
  fans: {
    beginnings: string[];
    correctEnding: string;
  }[];
}

// Source: next-project/04-main/lib/exercise-data.ts (ported)
export const exerciseBlocks: ExerciseBlock[] = [
  {
    correctEndings: ["ТОК", "ОСА", "ОНЬ"],
    incorrectEndings: ["ЕСТ", "ТОЛ", "ВЕР"],
    allEndings: ["ТОК", "ОСА", "ОНЬ", "ЕСТ", "ТОЛ", "ВЕР"],
    fans: [
      { beginnings: ["РОС", "ПРИ", "С", "ЦВЕ"], correctEnding: "ТОК" },
      { beginnings: ["ПАПИР", "К", "ПОЛ", "Р"], correctEnding: "ОСА" },
      { beginnings: ["К", "В", "ОГ", "ЛАД"], correctEnding: "ОНЬ" },
    ],
  },
  {
    correctEndings: ["ЕЛЬ", "ИНА", "ОЛЬ"],
    incorrectEndings: ["УРА", "ОСА", "АСТ"],
    allEndings: ["ЕЛЬ", "ИНА", "ОЛЬ", "УРА", "ОСА", "АСТ"],
    fans: [
      { beginnings: ["Ц", "Щ", "ПОСТ", "М"], correctEnding: "ЕЛЬ" },
      { beginnings: ["Т", "МАШ", "ТУРБ", "РЯБ"], correctEnding: "ИНА" },
      { beginnings: ["М", "С", "КОР", "ЦОК"], correctEnding: "ОЛЬ" },
    ],
  },
  {
    correctEndings: ["ОЧКА", "ОСТЬ", "АЙКА"],
    incorrectEndings: ["ОРОТ", "ОМКА", "ИСТЬ"],
    allEndings: ["ОЧКА", "ОСТЬ", "АЙКА", "ОРОТ", "ОМКА", "ИСТЬ"],
    fans: [
      { beginnings: ["Б", "УД", "Т", "СОР"], correctEnding: "ОЧКА" },
      { beginnings: ["К", "ТР", "ПОЛ", "Г"], correctEnding: "ОСТЬ" },
      { beginnings: ["Г", "М", "Ч", "Ш"], correctEnding: "АЙКА" },
    ],
  },
  {
    correctEndings: ["БОР", "ЕНЬ", "УКА"],
    incorrectEndings: ["КОН", "ИЦА", "ПЛА"],
    allEndings: ["БОР", "ЕНЬ", "УКА", "КОН", "ИЦА", "ПЛА"],
    fans: [
      { beginnings: ["У", "ПРИ", "ЗА", "НА"], correctEnding: "БОР" },
      { beginnings: ["П", "Т", "ПЛЕТ", "СТУП"], correctEnding: "ЕНЬ" },
      { beginnings: ["АЗБ", "М", "Р", "СК"], correctEnding: "УКА" },
    ],
  },
  {
    correctEndings: ["ЕСТЬ", "ОСТЬ", "ОЧКА"],
    incorrectEndings: ["ЕШКА", "ОЧКА", "ИЛКА"],
    allEndings: ["ЕСТЬ", "ОСТЬ", "ОЧКА", "ЕШКА", "ИЛКА"],
    fans: [
      { beginnings: ["Ч", "М", "Л", "ПРЕЛ"], correctEnding: "ЕСТЬ" },
      { beginnings: ["К", "ТР", "ЖАЛ", "ЖИМОЛ"], correctEnding: "ОСТЬ" },
      { beginnings: ["Д", "К", "М", "ЧЁРТ"], correctEnding: "ОЧКА" },
    ],
  },
  {
    correctEndings: ["ЛОН", "ОРТ", "ИЦА"],
    incorrectEndings: ["ОСТ", "ЕНЬ", "КАВ"],
    allEndings: ["ЛОН", "ОРТ", "ИЦА", "ОСТ", "ЕНЬ", "КАВ"],
    fans: [
      { beginnings: ["КУ", "С", "ПОК", "РУ"], correctEnding: "ЛОН" },
      { beginnings: ["Т", "П", "СП", "КУР"], correctEnding: "ОРТ" },
      { beginnings: ["УЛ", "ДЕВ", "СП", "КУН"], correctEnding: "ИЦА" },
    ],
  },
  {
    correctEndings: ["АЗ", "ОТ", "НО"],
    incorrectEndings: ["ОР", "УГ", "ИР"],
    allEndings: ["АЗ", "ОТ", "НО", "ОР", "УГ", "ИР"],
    fans: [
      { beginnings: ["Г", "ГЛ", "АЛМ", "П"], correctEnding: "АЗ" },
      { beginnings: ["Р", "КР", "СК", "ПИЛ"], correctEnding: "ОТ" },
      { beginnings: ["ОК", "ВИ", "СУК", "Д"], correctEnding: "НО" },
    ],
  },
  {
    correctEndings: ["АРЬ", "ИНА", "ЕНЬ"],
    incorrectEndings: ["ОЛЯ", "ЕСТ", "ДРО"],
    allEndings: ["АРЬ", "ИНА", "ЕНЬ", "ОЛЯ", "ЕСТ", "ДРО"],
    fans: [
      { beginnings: ["Ц", "БУКВ", "ТОК", "РЫЦ"], correctEnding: "АРЬ" },
      { beginnings: ["М", "Ш", "ДЛ", "ЩЕТ"], correctEnding: "ИНА" },
      { beginnings: ["МИШ", "КОР", "ГОЛ", "ОЛ"], correctEnding: "ЕНЬ" },
    ],
  },
  {
    correctEndings: ["ЕСТЬ", "ЕТКА", "ОЙКА"],
    incorrectEndings: ["АЙКА", "ЕТОК", "ИШКА"],
    allEndings: ["ЕСТЬ", "ЕТКА", "ОЙКА", "АЙКА", "ЕТОК", "ИШКА"],
    fans: [
      { beginnings: ["В", "Л", "СОВ", "ИЗВ"], correctEnding: "ЕСТЬ" },
      { beginnings: ["М", "В", "ПИП", "КЛ"], correctEnding: "ЕТКА" },
      { beginnings: ["СТР", "М", "С", "ТР"], correctEnding: "ОЙКА" },
    ],
  },
  {
    correctEndings: ["АНЬ", "ИКА", "ОЛЬ"],
    incorrectEndings: ["БОР", "ИНА", "ОРТ"],
    allEndings: ["АНЬ", "ИКА", "ОЛЬ", "БОР", "ИНА", "ОРТ"],
    fans: [
      { beginnings: ["Л", "Д", "ТК", "ГЕР"], correctEnding: "АНЬ" },
      { beginnings: ["П", "ЛОГ", "МИМ", "УЛ"], correctEnding: "ИКА" },
      { beginnings: ["Р", "МОЗ", "УГ", "Б"], correctEnding: "ОЛЬ" },
    ],
  },
  {
    correctEndings: ["ОР", "УК", "ЕС"],
    incorrectEndings: ["АТ", "ИК", "ОЛ"],
    allEndings: ["ОР", "УК", "ЕС", "АТ", "ИК", "ОЛ"],
    fans: [
      { beginnings: ["В", "ВЗ", "СБ", "ЗАБ"], correctEnding: "ОР" },
      { beginnings: ["Л", "СТ", "ВН", "КАБЛ"], correctEnding: "УК" },
      { beginnings: ["Л", "В", "АДР", "НАВ"], correctEnding: "ЕС" },
    ],
  },
  {
    correctEndings: ["УЛ", "АЧ", "АН"],
    incorrectEndings: ["ЫН", "НА", "ОП"],
    allEndings: ["УЛ", "АЧ", "АН", "ЫН", "НА", "ОП"],
    fans: [
      { beginnings: ["Г", "М", "СТ", "МУСК"], correctEnding: "УЛ" },
      { beginnings: ["ВР", "ГР", "КАЛ", "СИЛ"], correctEnding: "АЧ" },
      { beginnings: ["ОКЕ", "ЭКР", "ЖБ", "РОМ"], correctEnding: "АН" },
    ],
  },
  {
    correctEndings: ["УЧ", "АН", "ЕХ"],
    incorrectEndings: ["ИК", "ОЙ", "ОМ"],
    allEndings: ["УЧ", "АН", "ЕХ", "ИК", "ОЙ", "ОМ"],
    fans: [
      { beginnings: ["Л", "СУРГ", "ОБР", "КИЖ"], correctEnding: "УЧ" },
      { beginnings: ["Х", "КР", "КАБ", "КАРМ"], correctEnding: "АН" },
      { beginnings: ["М", "ГР", "ОР", "СМ"], correctEnding: "ЕХ" },
    ],
  },
  {
    correctEndings: ["ЛЕТ", "УЗА", "ЕЛЬ"],
    incorrectEndings: ["ЛУК", "ЕНА", "АРЬ"],
    allEndings: ["ЛЕТ", "УЗА", "ЕЛЬ", "ЛУК", "ЕНА", "АРЬ"],
    fans: [
      { beginnings: ["АТ", "ОМ", "БА", "БИ"], correctEnding: "ЛЕТ" },
      { beginnings: ["М", "БЛ", "ПА", "МЕД"], correctEnding: "УЗА" },
      { beginnings: ["С", "ДР", "МЕТ", "КУП"], correctEnding: "ЕЛЬ" },
    ],
  },
  {
    correctEndings: ["ОТ", "ОЙ", "ИН"],
    incorrectEndings: ["ИЛ", "ЕТ", "ОВ"],
    allEndings: ["ОТ", "ОЙ", "ИН", "ИЛ", "ЕТ", "ОВ"],
    fans: [
      { beginnings: ["П", "РОК", "ЕН", "ВОР"], correctEnding: "ОТ" },
      { beginnings: ["Б", "ЗН", "ПОК", "ГЕР"], correctEnding: "ОЙ" },
      { beginnings: ["КАМ", "БЕНЗ", "БЛ", "РУБ"], correctEnding: "ИН" },
    ],
  },
];

