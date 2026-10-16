import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, startTimer, stopTimer } from '../db'
import { useNow } from '../hooks'
import { fmtDuration, fmtHM, startOfDay } from '../time'
import { clippedDuration } from '../reports'
import ProjectTaskSelect from '../components/ProjectTaskSelect'

export default function TimerView() {
  const entries = useLiveQuery(() => db.entries.toArray(), [], [])
  const projects = useLiveQuery(() => db.projects.toArray(), [], [])
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], [])
  const running = entries.find((e) => e.end === null)
  const now = useNow(!!running)
  const [projectId, setProjectId] = useState('')
  const [taskId, setTaskId] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const last = [...entries].filter((e) => e.end !== null).sort((a, b) => b.start - a.start)[0]
  useEffect(() => {
    if (!projectId && last) (setProjectId(last.projectId), setTaskId(last.taskId))
  }, [last?.id])

  const dayStart = startOfDay(now)
  const today = entries.reduce((s, e) => s + clippedDuration(e, dayStart, dayStart + 86400000, now), 0)
  const label = (e: { projectId: string; taskId: string | null }) => {
    const p = projects.find((x) => x.id === e.projectId)
    const t = tasks.find((x) => x.id === e.taskId)
    return p ? `${p.name}${t ? ' / ' + t.name : ''}` : '—'
  }

  return (
    <section>
      <h2>Таймер</h2>
      <div className="clock">{running ? fmtDuration(now - running.start) : '0:00:00'}</div>
      {running ? (
        <>
          <p className="center">{label(running)}{running.note && ` — ${running.note}`}</p>
          <button className="primary big" onClick={() => stopTimer()}>Стоп</button>
        </>
      ) : (
        <>
          <ProjectTaskSelect projectId={projectId} taskId={taskId} onChange={(p, t) => (setProjectId(p), setTaskId(t))} />
          <input placeholder="Над чем работаете? (необязательно)" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="primary big" disabled={!projectId} onClick={async () => (await startTimer(projectId, taskId, note.trim()), setNote(''))}>
            Старт
          </button>
          {projects.length === 0 && <p className="hint">Сначала создайте проект на вкладке «Проекты».</p>}
        </>
      )}
      {running && (
        <button className="big" onClick={() => startTimer(running.projectId, running.taskId, '')}>
          Начать новую запись (текущая сохранится)
        </button>
      )}
      <p className="hint center">Сегодня: {fmtHM(today)}</p>
    </section>
  )
}
