import { beforeEach, describe, expect, it } from 'vitest'
import { addProject, addTask, db, getRunning, startTimer, stopTimer } from './db'
import { buildExport, importData, parseExport } from './exchange'
import { byDay, byProject, clippedDuration } from './reports'
import { startOfWeek } from './time'

beforeEach(async () => {
  await Promise.all([db.projects.clear(), db.tasks.clear(), db.entries.clear()])
})

describe('таймер', () => {
  it('одновременно активен только один', async () => {
    const p = await addProject('A')
    await startTimer(p.id, null, '', 1000)
    await startTimer(p.id, null, '', 5000)
    const all = await db.entries.toArray()
    expect(all.filter((e) => e.end === null)).toHaveLength(1)
    expect(all.find((e) => e.start === 1000)?.end).toBe(5000)
    await stopTimer(9000)
    expect(await getRunning()).toBeUndefined()
  })
})

describe('отчёты', () => {
  it('обрезает запись по границам периода (через полночь)', () => {
    const e = { id: '1', projectId: 'p', taskId: null, start: 20 * 3600e3, end: 28 * 3600e3, note: '' }
    expect(clippedDuration(e, 0, 24 * 3600e3, 0)).toBe(4 * 3600e3)
    expect(clippedDuration(e, 24 * 3600e3, 48 * 3600e3, 0)).toBe(4 * 3600e3)
  })
  it('группирует по проектам и по дням', () => {
    const d0 = new Date(2026, 0, 5).getTime()
    const h = 3600e3
    const entries = [
      { id: '1', projectId: 'a', taskId: null, start: d0, end: d0 + h, note: '' },
      { id: '2', projectId: 'b', taskId: null, start: d0 + 2 * h, end: d0 + 5 * h, note: '' },
    ]
    const projects = [
      { id: 'a', name: 'A', color: '#000', archived: false },
      { id: 'b', name: 'B', color: '#111', archived: false },
    ]
    const to = d0 + 3 * 86400e3
    expect(byProject(entries, projects, d0, to, 0).map((s) => s.label)).toEqual(['B', 'A'])
    expect(byDay(entries, d0, to, 0).map((x) => x.hours)).toEqual([4, 0, 0])
  })
  it('неделя начинается с понедельника', () => {
    expect(new Date(startOfWeek(new Date(2026, 9, 18).getTime())).getDay()).toBe(1) // вс 18.10.2026
  })
})

describe('экспорт/импорт', () => {
  it('круговой обмен сохраняет данные', async () => {
    const p = await addProject('A')
    const t = await addTask(p.id, 'T')
    await startTimer(p.id, t.id, 'заметка', 1000)
    await stopTimer(2000)
    const json = JSON.stringify(await buildExport())
    await Promise.all([db.projects.clear(), db.tasks.clear(), db.entries.clear()])
    await importData(parseExport(json), 'replace')
    expect(await db.projects.count()).toBe(1)
    expect((await db.entries.toArray())[0]).toMatchObject({ taskId: t.id, note: 'заметка', start: 1000, end: 2000 })
  })
  it('отклоняет мусор и битые ссылки', () => {
    expect(() => parseExport('не json')).toThrow()
    expect(() => parseExport('{"format":"x"}')).toThrow()
    const bad = { format: 'timetracker', version: 1, projects: [], tasks: [], entries: [{ id: 'e', projectId: 'нет', taskId: null, start: 1, end: 2 }] }
    expect(() => parseExport(JSON.stringify(bad))).toThrow('Некорректная запись')
  })
})
