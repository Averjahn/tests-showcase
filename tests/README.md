# Папка с тестами

Тесты находятся внутри frontend и подхватываются Next.js.

## Структура

Каждый тест — отдельная папка с именем `test-*`:

```
frontend/tests/
  test-1/
    TestComponent.tsx    # React компонент теста
    test-config.json     # Конфигурация теста
    index.ts             # Экспорт для регистрации
  test-2/
    ...
  shared/                # Общие утилиты
    TestInterface.ts     # Типы и интерфейсы
    useTestSubmission.ts # Хук для отправки в API
    TestWrapper.tsx      # Обёртка с таймером
  registry.ts            # Реестр всех тестов
```

## Как создать новый тест

1. Создай папку `test-N/` (где N - номер)
2. Создай `test-config.json`:
```json
{
  "id": "test-N",
  "name": "Название теста",
  "description": "Описание",
  "category": "категория",
  "estimatedTime": 120,
  "difficulty": "easy"
}
```

3. Создай `TestComponent.tsx` - React компонент теста
4. Создай `index.ts` и экспортируй тест:
```ts
import TestComponent from './TestComponent';
import testConfig from './test-config.json';
import { RegisteredTest } from '../registry';

export const testN: RegisteredTest = {
  id: 'test-N',
  config: testConfig,
  component: TestComponent,
};
```

5. Добавь импорт в `src/lib/test-loader.ts`:
```ts
import { testN } from '../../../tests/test-N';
const allTests: RegisteredTest[] = [test1, testN];
```

## API для тестов

Тесты отправляют результаты через `TestWrapper` + `useTestSubmission` (same-origin `/api/tests/*`):
- **Мы НЕ отправляем каждый ответ** на backend.
- На backend уходит **только итог** при завершении теста: `correctCount`, `incorrectCount`, `durationSec`.
- `assignmentId=preview` — режим просмотра (сессия не пишется, `sessionId` отсутствует).

## Пример использования

Тест доступен по URL: `/tests/test-1`

Компонент получает пропсы:
- `config` - конфигурация теста
- `onComplete(result)` - вызывается при завершении теста **ровно один раз**

### Горячие клавиши (для всех сценариев)

- **Shift+A** — автопрохождение: тест сам заполняет ответы поочерёдно случайно и правильно и переходит к следующему вопросу.
- **Q** — заполнить текущий вопрос случайным ответом.
- **W** — заполнить текущий вопрос правильным ответом.

### Важно для новых тестов

- Компонент теста **никогда не делает `fetch`** — только локальная логика.
- Не нужно вызывать `onAnswer` (поштучная отправка отключена). Счётчики считаются локально.
- В `onComplete` обязательно передай:
  - `correctCount`, `incorrectCount`
  - `totalTime` (мс) — будет преобразован в `durationSec` на отправке
  - `startedAt`, `completedAt`
  - `answers` можно передавать пустым массивом `[]`
