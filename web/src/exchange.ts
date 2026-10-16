import { db } from './db'
import type { Entry, ExportFile, Project, Task } from './types'

export async function buildExport(): Promise<ExportFile> {
  return {
    format: 'timetracker',
    version: 1,
    exportedAt: Date.now(),
    projects: await db.projects.toArray(),
    tasks: await db.tasks.toArray(),
    entries: await db.entries.toArray(),
  }
}

const isStr = (v: unknown): v is string => typeof v === 'string'
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** Проверяет структуру и ссылки между сущностями; бросает Error с русским текстом. */
export function parseExport(text: string): ExportFile {
  let raw: any
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('Файл не является корректным JSON')
  }
  if (raw?.format !== 'timetracker') throw new Error('Это не файл экспорта TimeTracker')
  if (raw.version !== 1) throw new Error(`Неподдерживаемая версия формата: ${raw.version}`)
  if (!Array.isArray(raw.projects) || !Array.isArray(raw.tasks) || !Array.isArray(raw.entries))
    throw new Error('Повреждена структура файла')

  const projects: Project[] = raw.projects.map((p: any) => {
    if (!isStr(p?.id) || !isStr(p.name) || !isStr(p.color)) throw new Error('Некорректный проект в файле')
    return { id: p.id, name: p.name, color: p.color, archived: !!p.archived }
  })
  const pIds = new Set(projects.map((p) => p.id))
  const tasks: Task[] = raw.tasks.map((t: any) => {
    if (!isStr(t?.id) || !isStr(t.projectId) || !isStr(t.name) || !pIds.has(t.projectId))
      throw new Error('Некорректная задача в файле')
    return { id: t.id, projectId: t.projectId, name: t.name, archived: !!t.archived }
  })
  const tIds = new Set(tasks.map((t) => t.id))
  const entries: Entry[] = raw.entries.map((e: any) => {
    const endOk = e?.end === null || isNum(e?.end)
    const taskOk = e?.taskId === null || (isStr(e?.taskId) && tIds.has(e.taskId))
    if (!isStr(e?.id) || !pIds.has(e.projectId) || !taskOk || !isNum(e.start) || !endOk)
      throw new Error('Некорректная запись времени в файле')
    return { id: e.id, projectId: e.projectId, taskId: e.taskId, start: e.start, end: e.end, note: isStr(e.note) ? e.note : '' }
  })
  if (entries.filter((e) => e.end === null).length > 1) throw new Error('В файле больше одного активного таймера')
  return { format: 'timetracker', version: 1, exportedAt: isNum(raw.exportedAt) ? raw.exportedAt : Date.now(), projects, tasks, entries }
}

/** Слияние по id: существующие записи перезаписываются, остальные сохраняются. Или полная замена. */
export async function importData(file: ExportFile, mode: 'merge' | 'replace') {
  await db.transaction('rw', db.projects, db.tasks, db.entries, async () => {
    if (mode === 'replace') await Promise.all([db.projects.clear(), db.tasks.clear(), db.entries.clear()])
    await db.projects.bulkPut(file.projects)
    await db.tasks.bulkPut(file.tasks)
    await db.entries.bulkPut(file.entries)
    // при слиянии не должно остаться двух активных таймеров
    const running = (await db.entries.toArray()).filter((e) => e.end === null).sort((a, b) => b.start - a.start)
    for (const e of running.slice(1)) await db.entries.update(e.id, { end: e.start })
  })
}

const csvCell = (v: string) => (/[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)

export async function buildCsv(): Promise<string> {
  const [projects, tasks, entries] = await Promise.all([db.projects.toArray(), db.tasks.toArray(), db.entries.toArray()])
  const rows = ['Проект,Задача,Начало,Конец,Минут,Заметка']
  for (const e of entries.sort((a, b) => a.start - b.start)) {
    const end = e.end ?? Date.now()
    rows.push(
      [
        projects.find((p) => p.id === e.projectId)?.name ?? '',
        tasks.find((t) => t.id === e.taskId)?.name ?? '',
        new Date(e.start).toISOString(),
        e.end === null ? '' : new Date(e.end).toISOString(),
        String(Math.round((end - e.start) / 60000)),
        e.note,
      ]
        .map(csvCell)
        .join(','),
    )
  }
  return '﻿' + rows.join('\n')
}

export function download(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
