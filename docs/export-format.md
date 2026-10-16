# Формат экспорта/импорта (v1)

Единый для web и Android. Единственный способ переноса данных между устройствами.
Реализация web: `web/src/exchange.ts` (`parseExport` — валидация).

```json
{
  "format": "timetracker",
  "version": 1,
  "exportedAt": 1760592000000,
  "projects": [{ "id": "uuid", "name": "Работа", "color": "#2563eb", "archived": false }],
  "tasks":    [{ "id": "uuid", "projectId": "uuid", "name": "Код-ревью", "archived": false }],
  "entries":  [{ "id": "uuid", "projectId": "uuid", "taskId": "uuid | null",
                 "start": 1760590000000, "end": 1760592000000, "note": "" }]
}
```

- Время — unix-миллисекунды (UTC). `end: null` — таймер идёт (не более одного на файл).
- `id` — строка (UUID v4); Android должен хранить id как строки, а не автоинкремент.
- `taskId` ссылается на задачу того же проекта или `null`.
- Импорт: «объединить» (по `id`, совпавшие перезаписываются) или «заменить всё».
- CSV (только экспорт): `Проект,Задача,Начало,Конец,Минут,Заметка`, время в ISO 8601.
