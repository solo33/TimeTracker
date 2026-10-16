import Dexie, { type EntityTable } from 'dexie'
import type { Entry, Project, Task } from './types'

class TrackerDB extends Dexie {
  projects!: EntityTable<Project, 'id'>
  tasks!: EntityTable<Task, 'id'>
  entries!: EntityTable<Entry, 'id'>

  constructor(name = 'timetracker') {
    super(name)
    this.version(1).stores({
      projects: 'id',
      tasks: 'id, projectId',
      entries: 'id, start, projectId',
    })
  }
}

export const db = new TrackerDB()
export const newId = () => crypto.randomUUID()

const PALETTE = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#65a30d']

export async function addProject(name: string): Promise<Project> {
  const count = await db.projects.count()
  const p: Project = { id: newId(), name: name.trim(), color: PALETTE[count % PALETTE.length], archived: false }
  await db.projects.add(p)
  return p
}

export async function addTask(projectId: string, name: string): Promise<Task> {
  const t: Task = { id: newId(), projectId, name: name.trim(), archived: false }
  await db.tasks.add(t)
  return t
}

export async function getRunning(): Promise<Entry | undefined> {
  return (await db.entries.toArray()).find((e) => e.end === null)
}

/** Останавливает идущий таймер (если есть) и запускает новый — активен всегда один. */
export async function startTimer(projectId: string, taskId: string | null, note = '', now = Date.now()) {
  await db.transaction('rw', db.entries, async () => {
    const running = await getRunning()
    if (running) await db.entries.update(running.id, { end: now })
    await db.entries.add({ id: newId(), projectId, taskId, start: now, end: null, note })
  })
}

export async function stopTimer(now = Date.now()) {
  const running = await getRunning()
  if (running) await db.entries.update(running.id, { end: now })
}

export async function deleteProject(id: string) {
  await db.transaction('rw', db.projects, db.tasks, db.entries, async () => {
    await db.entries.where('projectId').equals(id).delete()
    await db.tasks.where('projectId').equals(id).delete()
    await db.projects.delete(id)
  })
}
