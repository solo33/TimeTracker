import { useRef, useState } from 'react'
import { buildCsv, buildExport, download, importData, parseExport } from '../exchange'

export default function DataView() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'merge' | 'replace'>('merge')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const stamp = new Date().toISOString().slice(0, 10)

  async function onFile(file: File) {
    try {
      const data = parseExport(await file.text())
      if (mode === 'replace' && !confirm('Все текущие данные будут заменены. Продолжить?')) return
      await importData(data, mode)
      setMsg({ ok: true, text: `Импортировано: проектов ${data.projects.length}, задач ${data.tasks.length}, записей ${data.entries.length}` })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Ошибка импорта' })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <section>
      <h2>Данные</h2>
      <p className="hint">Данные хранятся только на этом устройстве. JSON — для переноса между web и Android и резервной копии.</p>
      <h3>Экспорт</h3>
      <div className="row">
        <button className="primary" onClick={async () => download(`timetracker-${stamp}.json`, JSON.stringify(await buildExport(), null, 2), 'application/json')}>JSON</button>
        <button onClick={async () => download(`timetracker-${stamp}.csv`, await buildCsv(), 'text/csv;charset=utf-8')}>CSV</button>
      </div>
      <h3>Импорт из JSON</h3>
      <label className="check"><input type="radio" checked={mode === 'merge'} onChange={() => setMode('merge')} /> Объединить с текущими данными</label>
      <label className="check"><input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} /> Заменить все данные</label>
      <input ref={fileRef} type="file" accept="application/json,.json" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      {msg && <p className={msg.ok ? 'ok' : 'error'}>{msg.text}</p>}
    </section>
  )
}
