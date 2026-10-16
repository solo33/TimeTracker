import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useNow } from '../hooks'
import { dateKey, fmtDayTitle, fmtHM, fmtTime, startOfDay } from '../time'
import type { Entry } from '../types'
import EntryEditor from '../components/EntryEditor'

export default function JournalView() {
  const entries = useLiveQuery(() => db.entries.orderBy('start').reverse().toArray(), [], [])
  const projects = useLiveQuery(() => db.projects.toArray(), [], [])
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], [])
  const now = useNow(entries.some((e) => e.end === null))
  const [editing, setEditing] = useState<Entry | null | undefined>(undefined)

  const days = new Map<string, Entry[]>()
  for (const e of entries) {
    const k = dateKey(e.start)
    days.set(k, [...(days.get(k) ?? []), e])
  }

  return (
    <section>
      <div className="row between">
        <h2>Журнал</h2>
        <button className="primary" onClick={() => setEditing(null)}>+ Запись</button>
      </div>
      {entries.length === 0 && <p className="hint">Записей пока нет.</p>}
      {[...days.values()].map((list) => {
        const total = list.reduce((s, e) => s + ((e.end ?? now) - e.start), 0)
        return (
          <div key={dateKey(list[0].start)} className="day">
            <div className="row between day-title">
              <strong>{fmtDayTitle(startOfDay(list[0].start))}</strong>
              <span>{fmtHM(total)}</span>
            </div>
            {list.map((e) => {
              const p = projects.find((x) => x.id === e.projectId)
              const t = tasks.find((x) => x.id === e.taskId)
              return (
                <button key={e.id} className="entry" onClick={() => setEditing(e)}>
                  <span className="dot" style={{ background: p?.color ?? '#9ca3af' }} />
                  <span className="grow">
                    <b>{p?.name ?? '—'}</b>{t && ` / ${t.name}`}
                    {e.note && <small>{e.note}</small>}
                  </span>
                  <span className="nowrap">
                    {fmtTime(e.start)}–{e.end === null ? '…' : fmtTime(e.end)}
                    <small>{fmtHM((e.end ?? now) - e.start)}</small>
                  </span>
                </button>
              )
            })}
          </div>
        )
      })}
      {editing !== undefined && <EntryEditor entry={editing} onClose={() => setEditing(undefined)} />}
    </section>
  )
}
