import { useState } from 'react'
import TimerView from './views/TimerView'
import JournalView from './views/JournalView'
import ReportsView from './views/ReportsView'
import ProjectsView from './views/ProjectsView'
import DataView from './views/DataView'

const TABS = [
  { id: 'timer', label: 'Таймер', view: TimerView },
  { id: 'journal', label: 'Журнал', view: JournalView },
  { id: 'reports', label: 'Отчёты', view: ReportsView },
  { id: 'projects', label: 'Проекты', view: ProjectsView },
  { id: 'data', label: 'Данные', view: DataView },
] as const

export default function App() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('timer')
  const View = TABS.find((t) => t.id === tab)!.view
  return (
    <div className="app">
      <main>
        <View />
      </main>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
