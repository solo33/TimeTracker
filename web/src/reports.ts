import type { Entry, Project, Task } from './types'

/** Длительность записи, обрезанная по периоду [from, to). Идущий таймер считается до now. */
export function clippedDuration(e: Entry, from: number, to: number, now: number): number {
  const s = Math.max(e.start, from)
  const f = Math.min(e.end ?? now, to)
  return Math.max(0, f - s)
}

export interface Slice {
  key: string
  label: string
  color: string
  ms: number
}

export function byProject(entries: Entry[], projects: Project[], from: number, to: number, now: number): Slice[] {
  const map = new Map<string, number>()
  for (const e of entries) {
    const d = clippedDuration(e, from, to, now)
    if (d > 0) map.set(e.projectId, (map.get(e.projectId) ?? 0) + d)
  }
  return [...map.entries()]
    .map(([id, ms]) => {
      const p = projects.find((x) => x.id === id)
      return { key: id, label: p?.name ?? 'Удалённый проект', color: p?.color ?? '#9ca3af', ms }
    })
    .sort((a, b) => b.ms - a.ms)
}

export function byTask(entries: Entry[], projects: Project[], tasks: Task[], from: number, to: number, now: number): Slice[] {
  const map = new Map<string, number>()
  for (const e of entries) {
    const d = clippedDuration(e, from, to, now)
    if (d > 0) {
      const k = `${e.projectId}|${e.taskId ?? ''}`
      map.set(k, (map.get(k) ?? 0) + d)
    }
  }
  return [...map.entries()]
    .map(([k, ms]) => {
      const [pid, tid] = k.split('|')
      const p = projects.find((x) => x.id === pid)
      const t = tasks.find((x) => x.id === tid)
      return { key: k, label: `${p?.name ?? '?'} / ${t?.name ?? 'без задачи'}`, color: p?.color ?? '#9ca3af', ms }
    })
    .sort((a, b) => b.ms - a.ms)
}

/** Часы по дням в периоде — для столбчатой диаграммы. */
export function byDay(entries: Entry[], from: number, to: number, now: number): { day: string; hours: number }[] {
  const out: { day: string; hours: number }[] = []
  for (let t = from; t < to; ) {
    const d = new Date(t)
    const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime()
    const ms = entries.reduce((s, e) => s + clippedDuration(e, t, next, now), 0)
    out.push({ day: `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`, hours: Math.round((ms / 3600000) * 100) / 100 })
    t = next
  }
  return out
}
