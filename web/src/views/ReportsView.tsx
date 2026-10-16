import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { db } from '../db'
import { useNow } from '../hooks'
import { addDays, fmtHM, startOfDay, startOfMonth, startOfWeek, toLocalInput } from '../time'
import { byDay, byProject, byTask } from '../reports'

type Preset = 'day' | 'week' | 'month' | 'custom'
const MAX_DAYS = 366

export default function ReportsView() {
  const entries = useLiveQuery(() => db.entries.toArray(), [], [])
  const projects = useLiveQuery(() => db.projects.toArray(), [], [])
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], [])
  const now = useNow(entries.some((e) => e.end === null))
  const [preset, setPreset] = useState<Preset>('week')
  const [offset, setOffset] = useState(0)
  const [customFrom, setCustomFrom] = useState(toLocalInput(addDays(startOfDay(Date.now()), -6)).slice(0, 10))
  const [customTo, setCustomTo] = useState(toLocalInput(Date.now()).slice(0, 10))

  let from: number, to: number
  const today = startOfDay(now)
  if (preset === 'day') (from = addDays(today, offset), to = addDays(from, 1))
  else if (preset === 'week') (from = addDays(startOfWeek(today), offset * 7), to = addDays(from, 7))
  else if (preset === 'month') {
    const d = new Date(startOfMonth(today))
    from = new Date(d.getFullYear(), d.getMonth() + offset, 1).getTime()
    to = new Date(d.getFullYear(), d.getMonth() + offset + 1, 1).getTime()
  } else {
    from = startOfDay(new Date(customFrom).getTime())
    to = addDays(startOfDay(new Date(customTo).getTime()), 1)
  }
  const valid = Number.isFinite(from) && Number.isFinite(to) && to > from && (to - from) / 86400000 <= MAX_DAYS

  const slices = valid ? byProject(entries, projects, from, to, now) : []
  const taskRows = valid ? byTask(entries, projects, tasks, from, to, now) : []
  const days = valid ? byDay(entries, from, to, now) : []
  const total = slices.reduce((s, x) => s + x.ms, 0)
  const fmt = (ts: number) => new Date(ts).toLocaleDateString('ru-RU')
  const title = !valid ? 'Некорректный период (не более года)' : preset === 'day' ? fmt(from) : `${fmt(from)} – ${fmt(to - 1)}`

  return (
    <section>
      <h2>Отчёты</h2>
      <div className="segmented">
        {([['day', 'День'], ['week', 'Неделя'], ['month', 'Месяц'], ['custom', 'Период']] as const).map(([id, l]) => (
          <button key={id} className={preset === id ? 'active' : ''} onClick={() => (setPreset(id), setOffset(0))}>{l}</button>
        ))}
      </div>
      {preset === 'custom' ? (
        <div className="row">
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
        </div>
      ) : (
        <div className="row between">
          <button onClick={() => setOffset(offset - 1)} aria-label="Назад">←</button>
          <strong>{title}</strong>
          <button onClick={() => setOffset(offset + 1)} disabled={offset >= 0} aria-label="Вперёд">→</button>
        </div>
      )}
      {preset === 'custom' && <p className="center"><strong>{title}</strong></p>}
      <p className="center">Всего: <strong>{fmtHM(total)}</strong></p>

      {total === 0 ? (
        <p className="hint center">За этот период данных нет.</p>
      ) : (
        <>
          <h3>По дням</h3>
          <div className="chart">
            <ResponsiveContainer>
              <BarChart data={days}>
                <XAxis dataKey="day" interval="preserveStartEnd" />
                <YAxis width={30} />
                <Tooltip formatter={(v) => [`${v} ч`, 'Время']} />
                <Bar dataKey="hours" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <h3>По проектам</h3>
          <div className="chart">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={slices} dataKey="ms" nameKey="label" outerRadius="80%">
                  {slices.map((s) => <Cell key={s.key} fill={s.color} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtHM(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <h3>По задачам</h3>
          <ul className="list">
            {taskRows.map((r) => (
              <li key={r.key} className="row between">
                <span><span className="dot" style={{ background: r.color }} /> {r.label}</span>
                <span>{fmtHM(r.ms)} · {Math.round((r.ms / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
