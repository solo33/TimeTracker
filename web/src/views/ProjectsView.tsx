import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addProject, addTask, db, deleteProject } from '../db'

export default function ProjectsView() {
  const projects = useLiveQuery(() => db.projects.toArray(), [], [])
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], [])
  const [name, setName] = useState('')
  const [taskNames, setTaskNames] = useState<Record<string, string>>({})
  const [showArchived, setShowArchived] = useState(false)

  const list = projects.filter((p) => showArchived || !p.archived)

  return (
    <section>
      <h2>Проекты</h2>
      <form className="row" onSubmit={async (e) => { e.preventDefault(); if (name.trim()) (await addProject(name), setName('')) }}>
        <input className="grow" placeholder="Новый проект" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="primary">Добавить</button>
      </form>
      <label className="check"><input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Показывать архивные</label>
      {list.map((p) => (
        <div key={p.id} className={`card project ${p.archived ? 'archived' : ''}`}>
          <div className="row between">
            <span className="row">
              <input type="color" value={p.color} onChange={(e) => db.projects.update(p.id, { color: e.target.value })} aria-label="Цвет" />
              <input className="plain" value={p.name} onChange={(e) => db.projects.update(p.id, { name: e.target.value })} aria-label="Название" />
            </span>
            <span className="row">
              <button onClick={() => db.projects.update(p.id, { archived: !p.archived })}>{p.archived ? 'Вернуть' : 'В архив'}</button>
              <button className="danger" onClick={() => confirm(`Удалить проект «${p.name}» вместе с задачами и записями времени?`) && deleteProject(p.id)}>Удалить</button>
            </span>
          </div>
          <ul className="list">
            {tasks.filter((t) => t.projectId === p.id).map((t) => (
              <li key={t.id} className={`row between ${t.archived ? 'archived' : ''}`}>
                <input className="plain grow" value={t.name} onChange={(e) => db.tasks.update(t.id, { name: e.target.value })} aria-label="Задача" />
                <button onClick={() => db.tasks.update(t.id, { archived: !t.archived })}>{t.archived ? 'Вернуть' : 'Архив'}</button>
                <button className="danger" onClick={() => confirm(`Удалить задачу «${t.name}»? Записи останутся без задачи.`) && db.transaction('rw', db.tasks, db.entries, async () => { await db.entries.where('projectId').equals(p.id).filter((e) => e.taskId === t.id).modify({ taskId: null }); await db.tasks.delete(t.id) })}>✕</button>
              </li>
            ))}
          </ul>
          <form className="row" onSubmit={async (e) => { e.preventDefault(); const v = (taskNames[p.id] ?? '').trim(); if (v) (await addTask(p.id, v), setTaskNames({ ...taskNames, [p.id]: '' })) }}>
            <input className="grow" placeholder="Новая задача" value={taskNames[p.id] ?? ''} onChange={(e) => setTaskNames({ ...taskNames, [p.id]: e.target.value })} />
            <button>＋</button>
          </form>
        </div>
      ))}
    </section>
  )
}
