export const pad = (n: number) => String(n).padStart(2, '0')

/** 3661000 -> "1:01:01" */
export function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

/** 3661000 -> "1 ч 01 мин" */
export function fmtHM(ms: number): string {
  const m = Math.round(Math.max(0, ms) / 60000)
  return `${Math.floor(m / 60)} ч ${pad(m % 60)} мин`
}

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function addDays(ts: number, n: number): number {
  const d = new Date(ts)
  d.setDate(d.getDate() + n)
  return d.getTime()
}

/** Понедельник — первый день недели. */
export function startOfWeek(ts: number): number {
  const d = new Date(startOfDay(ts))
  return addDays(d.getTime(), -((d.getDay() + 6) % 7))
}

export function startOfMonth(ts: number): number {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}

/** Значение для <input type="datetime-local"> */
export function toLocalInput(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const fromLocalInput = (v: string) => new Date(v).getTime()

export const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

export const fmtDayTitle = (ts: number) =>
  new Date(ts).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

export const dateKey = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
