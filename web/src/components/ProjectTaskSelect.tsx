import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

interface Props {
  projectId: string
  taskId: string | null
  onChange: (projectId: string, taskId: string | null) => void
  includeArchived?: boolean
}

export default function ProjectTaskSelect({ projectId, taskId, onChange, includeArchived }: Props) {
  const projects = useLiveQuery(() => db.projects.toArray(), [], [])
  const tasks = useLiveQuery(() => db.tasks.where('projectId').equals(projectId).toArray(), [projectId], [])
  const visibleProjects = projects.filter((p) => includeArchived || !p.archived || p.id === projectId)
  const visibleTasks = tasks.filter((t) => !t.archived || t.id === taskId)
  return (
    <div className="row">
      <select value={projectId} onChange={(e) => onChange(e.target.value, null)} aria-label="Проект">
        <option value="">— проект —</option>
        {visibleProjects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select
        value={taskId ?? ''}
        onChange={(e) => onChange(projectId, e.target.value || null)}
        disabled={!projectId}
        aria-label="Задача"
      >
        <option value="">без задачи</option>
        {visibleTasks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  )
}
