import { useState } from 'react'
import { db, newId } from '../db'
import type { Entry } from '../types'
import { fromLocalInput, toLocalInput } from '../time'
import ProjectTaskSelect from './ProjectTaskSelect'

/** Создание/редактирование записи. entry === null — новая ручная запись. */
export default function EntryEditor({ entry, onClose }: { entry: Entry | null; onClose: () => void }) {
  const now = Date.now()
  const [projectId, setProjectId] = useState(entry?.projectId ?? '')
  const [taskId, setTaskId] = useState<string | null>(entry?.taskId ?? null)
  const [start, setStart] = useState(toLocalInput(entry?.start ?? now - 3600000))
  const [end, setEnd] = useState(entry?.end === null ? '' : toLocalInput(entry?.end ?? now))
  const [note, setNote] = useState(entry?.note ?? '')
  const [error, setError] = useState('')
  const running = entry?.end === null

  async function save() {
    const s = fromLocalInput(start)
    const e = running && !end ? null : fromLocalInput(end)
    if (!projectId) return setError('Выберите проект')
    if (Number.isNaN(s) || (e !== null && Number.isNaN(e))) return setError('Укажите время начала и конца')
    if (e !== null && e <= s) return setError('Конец должен быть позже начала')
    const rec: Entry = { id: entry?.id ?? newId(), projectId, taskId, start: s, end: e, note: note.trim() }
    await db.entries.put(rec)
    onClose()
  }

  async function remove() {
    if (entry && confirm('Удалить запись?')) {
      await db.entries.delete(entry.id)
      onClose()
    }
  }

  return (
    <div className="modal" onClick={onClose}>
      <div className="card" onClick={(e) => e.stopPropagation()}>
        <h3>{entry ? 'Редактирование записи' : 'Новая запись'}</h3>
        <ProjectTaskSelect projectId={projectId} taskId={taskId} onChange={(p, t) => (setProjectId(p), setTaskId(t))} />
        <label>
          Начало
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label>
          Конец {running && '(таймер идёт)'}
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
        <label>
          Заметка
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button className="primary" onClick={save}>Сохранить</button>
          <button onClick={onClose}>Отмена</button>
          {entry && <button className="danger" onClick={remove}>Удалить</button>}
        </div>
      </div>
    </div>
  )
}
