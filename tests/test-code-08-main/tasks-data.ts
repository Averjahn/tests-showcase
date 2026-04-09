export type PrefixTask = {
  id: number;
  prefixes: string[];
  sentences: { text: string; correctPrefix: string }[];
};

// Source: next-project/code-08-main/app/page.tsx (ported)
export const prefixTasks: PrefixTask[] = [
  {
    id: 1,
    prefixes: ["С-", "ВЫ-", "ЗА-", "ПОД-", "ПРИ-"],
    sentences: [
      { text: "ПУГОВИЦУ К РУБАШКЕ ___ШИТЬ.", correctPrefix: "ПРИ-" },
      { text: "ДЛИННЫЕ БРЮКИ ___ШИТЬ", correctPrefix: "ПОД-" },
      { text: "УЗОР НА ПЯЛЬЦАХ ___ШИТЬ", correctPrefix: "ВЫ-" },
      { text: "ДЫРКУ В КАРМАНЕ ___ШИТЬ", correctPrefix: "ЗА-" },
      { text: "КОСТЮМ В АТЕЛЬЕ ___ШИТЬ", correctPrefix: "С-" },
    ],
  },
  {
    id: 2,
    prefixes: ["ВЫ-", "ПРИ-", "ОБ-", "ПЕРЕ-", "У-"],
    sentences: [
      { text: "ПРЕПЯТСТВИЕ ___ХОДИТЬ", correctPrefix: "ОБ-" },
      { text: "ЧЕРЕЗ ДОРОГУ ___ХОДИТЬ", correctPrefix: "ПЕРЕ-" },
      { text: "В ГОСТИ ___ХОДИТЬ", correctPrefix: "ПРИ-" },
      { text: "С РАБОТЫ ПОЗДНО ___ХОДИТЬ", correctPrefix: "У-" },
      { text: "ИЗ ПОДЪЕЗДА ___ХОДИТЬ", correctPrefix: "ВЫ-" },
    ],
  },
  {
    id: 3,
    prefixes: ["ПРИ-", "ВЫ-", "У-", "ПО-", "С-"],
    sentences: [
      { text: "ИЗ ГНЕЗДА ___ЛЕТЕТЬ", correctPrefix: "ВЫ-" },
      { text: "К МОРЮ ___ЛЕТЕТЬ", correctPrefix: "ПРИ-" },
      { text: "С ДЕРЕВА ___ЛЕТЕТЬ", correctPrefix: "С-" },
      { text: "ВЕСНОЙ ___ЛЕТЕТЬ", correctPrefix: "ПРИ-" },
      { text: "ОСЕНЬЮ ___ЛЕТЕТЬ", correctPrefix: "У-" },
    ],
  },
  {
    id: 4,
    prefixes: ["ПЕРЕ-", "ЗА-", "ВЫ-", "С-", "ПОД-"],
    sentences: [
      { text: "ЧЕРЕЗ РУЧЕЙ ___ПРЫГНУТЬ", correctPrefix: "ПЕРЕ-" },
      { text: "С ПОДНОЖКИ ТРАМВАЯ ___ПРЫГНУТЬ", correctPrefix: "С-" },
      { text: "ИЗ-ПОД КРЫЛЬЦА ___ПРЫГНУТЬ", correctPrefix: "ВЫ-" },
      { text: "В ПОСЛЕДНИЙ ВАГОН ___ПРЫГНУТЬ", correctPrefix: "ЗА-" },
      { text: "ВЫСОКО ___ПРЫГНУТЬ", correctPrefix: "ПОД-" },
    ],
  },
  {
    id: 5,
    prefixes: ["С-", "ЗА-", "НА-", "ВЫ-", "ПОД-"],
    sentences: [
      { text: "ДОКУМЕНТ ___ПИСАТЬ", correctPrefix: "ПОД-" },
      { text: "ДОМАШНЕЕ ЗАДАНИЕ ___ПИСАТЬ", correctPrefix: "НА-" },
      { text: "НА ДИКТОФОН ___ПИСАТЬ", correctPrefix: "ЗА-" },
      { text: "СООБЩЕНИЕ В ТЕЛЕФОНЕ ___ПИСАТЬ", correctPrefix: "НА-" },
      { text: "РЕЦЕПТ ___ПИСАТЬ", correctPrefix: "ВЫ-" },
    ],
  },
  {
    id: 6,
    prefixes: ["ПОД-", "ДО-", "ВЫ-", "С-", "ПРО-"],
    sentences: [
      { text: "СОРЕВНОВАНИЯ ___ИГРАТЬ", correctPrefix: "ВЫ-" },
      { text: "МАТЧ С ПОЗОРОМ ___ИГРАТЬ", correctPrefix: "ПРО-" },
      { text: "ВНИЧЬЮ ___ИГРАТЬ", correctPrefix: "С-" },
      { text: "ПЕВЦУ НА ГИТАРЕ ___ИГРАТЬ", correctPrefix: "ПОД-" },
      { text: "ДО КОНЦА ПЬЕСУ ___ИГРАТЬ", correctPrefix: "ДО-" },
    ],
  },
  {
    id: 7,
    prefixes: ["У-", "ПЕРЕ-", "ВЫ-", "ДО-", "ПРИ-"],
    sentences: [
      { text: "ПЕРВЫМ К ФИНИШУ ___БЕЖАТЬ", correctPrefix: "ПРИ-" },
      { text: "ИЗ ДОМА ___БЕЖАТЬ", correctPrefix: "ВЫ-" },
      { text: "ДО ОСТАНОВКИ ___БЕЖАТЬ", correctPrefix: "ДО-" },
      { text: "ЧЕРЕЗ ДОРОГУ ___БЕЖАТЬ", correctPrefix: "ПЕРЕ-" },
      { text: "ОТ ПОГОНИ ___БЕЖАТЬ", correctPrefix: "У-" },
    ],
  },
  {
    id: 8,
    prefixes: ["НА-", "ПРИ-", "ПЕРЕ-", "ЗА-", "ОТ-"],
    sentences: [
      { text: "ТЯЖЕЛО БОЛЕЗНЬ ___НОСИТЬ", correctPrefix: "ПЕРЕ-" },
      { text: "ВЕЩИ В НОМЕР ___НОСИТЬ", correctPrefix: "ЗА-" },
      { text: "НА ПОЧТУ ПОСЫЛКУ ___НОСИТЬ", correctPrefix: "ОТ-" },
      { text: "ГРИМ НА ЛИЦО ___НОСИТЬ", correctPrefix: "НА-" },
      { text: "ЗАКАЗ НА ДОМ ___НОСИТЬ", correctPrefix: "ПРИ-" },
    ],
  },
  {
    id: 9,
    prefixes: ["С-", "НА-", "ЗА-", "ДО-", "НА-"],
    sentences: [
      { text: "ПОДПИСЬ В ДОКУМЕНТЕ ___ДЕЛАТЬ", correctPrefix: "С-" },
      { text: "ДЫРУ В СТЕНЕ ___ДЕЛАТЬ", correctPrefix: "С-" },
      { text: "ЗАКУСОК К ПРАЗДНИКУ ___ДЕЛАТЬ", correctPrefix: "НА-" },
      { text: "РАБОТУ ВОВРЕМЯ ___ДЕЛАТЬ", correctPrefix: "ДО-" },
      { text: "ПОДАРОК СВОИМИ РУКАМИ ___ДЕЛАТЬ", correctPrefix: "С-" },
    ],
  },
  {
    id: 10,
    prefixes: ["С-", "ПОД-", "ВЫ-", "ПЕРЕ-", "У-"],
    sentences: [
      { text: "СНЕЖИНКУ ИЗ БУМАГИ ___РЕЗАТЬ", correctPrefix: "ВЫ-" },
      { text: "РОЗЫ С КЛУМБЫ ___РЕЗАТЬ", correctPrefix: "С-" },
      { text: "ЛЕНТОЧКУ ___РЕЗАТЬ", correctPrefix: "ПЕРЕ-" },
      { text: "МАШИНУ НА ДОРОГЕ ___РЕЗАТЬ", correctPrefix: "ПОД-" },
      { text: "ВЫПЛАТЫ ___РЕЗАТЬ", correctPrefix: "У-" },
    ],
  },
  {
    id: 11,
    prefixes: ["ВЫ-", "ПО-", "ПЕРЕ-", "ПРИ-", "С-"],
    sentences: [
      { text: "ГАЛСТУК ___ВЯЗАТЬ", correctPrefix: "ПО-" },
      { text: "СОБАКУ ___ВЯЗАТЬ", correctPrefix: "ПРИ-" },
      { text: "ОРНАМЕНТ ___ВЯЗАТЬ", correctPrefix: "ВЫ-" },
      { text: "ДВА КОНЦА ___ВЯЗАТЬ", correctPrefix: "С-" },
      { text: "РАНУ ___ВЯЗАТЬ", correctPrefix: "ПЕРЕ-" },
    ],
  },
  {
    id: 12,
    prefixes: ["ОТ-", "ПРИ-", "ВС-", "ЗА-", "ПЕРЕ-"],
    sentences: [
      { text: "ОТ УСТАЛОСТИ ГЛАЗА ___КРЫТЬ", correctPrefix: "ЗА-" },
      { text: "НОВУЮ ШКОЛУ ___КРЫТЬ", correctPrefix: "ОТ-" },
      { text: "ДВЕРЬ НА ЗАМОК ___КРЫТЬ", correctPrefix: "ЗА-" },
      { text: "ДВИЖЕНИЕ НА ДОРОГЕ ___КРЫТЬ", correctPrefix: "ПЕРЕ-" },
      { text: "СЕЙФ ___КРЫТЬ", correctPrefix: "ВС-" },
    ],
  },
  {
    id: 13,
    prefixes: ["ПЕРЕ-", "ВЫ-", "ЗА-", "ОБ-", "ВС-"],
    sentences: [
      { text: "ЯМУ ___КОПАТЬ", correctPrefix: "ВЫ-" },
      { text: "КЛАД НА ОСТРОВЕ ___КОПАТЬ", correctPrefix: "ЗА-" },
      { text: "ПОЛЕ ___КОПАТЬ", correctPrefix: "ПЕРЕ-" },
      { text: "ЯБЛОНЮ ВОКРУГ ___КОПАТЬ", correctPrefix: "ОБ-" },
      { text: "ГРЯДКИ ОСЕНЬЮ ___КОПАТЬ", correctPrefix: "ВС-" },
    ],
  },
  {
    id: 14,
    prefixes: ["ПЕРЕ-", "ВЫ-", "ПОД-", "В-", "ЗА-"],
    sentences: [
      { text: "ИНТЕРЕСНЫЙ ФИЛЬМ ___КЛЮЧИТЬ", correctPrefix: "В-" },
      { text: "ГРОМКУЮ МУЗЫКУ ___КЛЮЧИТЬ", correctPrefix: "ВЫ-" },
      { text: "ВЫГОДНУЮ СДЕЛКУ ___КЛЮЧИТЬ", correctPrefix: "ЗА-" },
      { text: "ИНТЕРНЕТ ___КЛЮЧИТЬ", correctPrefix: "ПОД-" },
      { text: "ТЕЛЕВИЗОР НА ДРУГОЙ КАНАЛ ___КЛЮЧИТЬ", correctPrefix: "ПЕРЕ-" },
    ],
  },
  {
    id: 15,
    prefixes: ["ИС-", "ПО-", "НА-", "ЗА-", "С-"],
    sentences: [
      { text: "СВАДЬБУ ___ПРАВИТЬ", correctPrefix: "С-" },
      { text: "ЗДОРОВЬЕ ___ПРАВИТЬ", correctPrefix: "ПО-" },
      { text: "НА ОБСЛЕДОВАНИЕ ___ПРАВИТЬ", correctPrefix: "НА-" },
      { text: "ОШИБКУ ___ПРАВИТЬ", correctPrefix: "ИС-" },
      { text: "МАШИНУ БЕНЗИНОМ ___ПРАВИТЬ", correctPrefix: "ЗА-" },
    ],
  },
];

