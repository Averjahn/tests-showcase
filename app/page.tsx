const TESTS = [
  { id: "test-02-main", title: "Добавить часть слова (начало/конец)" },
  { id: "test-13-main", title: "Исправь букву в слове" },
  { id: "test-04-main", title: "Найти окончание слов" },
  { id: "test-01-mame", title: "Составление фразы по картинке" },
  { id: "test-14-main", title: "Фраза и картинка" },
  { id: "test-15-main", title: "Прилагательное и существительное" },
  { id: "test-16-main", title: "Глагол к картинке" },
  { id: "test-17-main", title: "Вставь слог в слово" },
  { id: "test-code-08-main", title: "Глагол с приставками" },
  { id: "test-code-dei", title: "Распределить слова (действия)" },
  { id: "test-code-priz", title: "Распределить слова (признаки)" },
  { id: "test-kod-07-main", title: "КОД 07 — словосочетания (действия)" },
  { id: "test-kod-09-main", title: "КОД 09 — анаграммы" },
  { id: "test-kod-06-dei", title: "КОД 06 — общее слово (действие)" },
  { id: "test-kod-06-predmet", title: "КОД 06 — общее слово (предмет)" },
  { id: "test-kod-06-priznak", title: "КОД 06 — общее слово (признак)" },
  { id: "test-ponimanie-rechi", title: "Понимание речи" },
  { id: "test-soberi-slovo", title: "Собери слово" },
  { id: "test-21-main", title: "Вставьте пропущенные буквы" },
  { id: "test-22-main", title: "Вставьте предлоги" },
  { id: "test-23-main", title: "Найдите слова на букву М" },
  { id: "test-24-main", title: "Составьте фразы" },
  { id: "test-25-main", title: "Покажите, где…" },
  { id: "test-26-main", title: "Покажите…" },
  { id: "test-27-main", title: "Составь фразу" },
  { id: "test-28-main", title: "Подбери слово к картинке" },
  { id: "test-29-main", title: "Подбери глагол" },
  { id: "test-30-main", title: "Выбери предмет по признаку" },
] as const;

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 720,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          padding: 24,
        }}
      >
        <h1
          style={{
            margin: 0,
            marginBottom: 18,
            fontSize: 28,
            lineHeight: 1.2,
          }}
        >
          Тренажеры
        </h1>

        <div style={{ display: "grid", gap: 10 }}>
          {TESTS.map((test) => {
            const href = `/tests/${test.id}`;
            return (
              <a
                key={test.id}
                href={href}
                style={{
                  display: "block",
                  border: "1px solid #d1d5db",
                  borderRadius: 12,
                  padding: "14px 16px",
                  background: "#f9fafb",
                  fontWeight: 600,
                }}
              >
                {test.title}
              </a>
            );
          })}
        </div>
      </section>
    </main>
  );
}
