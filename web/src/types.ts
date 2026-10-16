export interface Project {
  id: string
  name: string
  color: string
  archived: boolean
}

export interface Task {
  id: string
  projectId: string
  name: string
  archived: boolean
}

/** Время — unix-миллисекунды. end === null — таймер идёт. */
export interface Entry {
  id: string
  projectId: string
  taskId: string | null
  start: number
  end: number | null
  note: string
}

/** Общий формат переноса web <-> Android. См. docs/export-format.md */
export interface ExportFile {
  format: 'timetracker'
  version: 1
  exportedAt: number
  projects: Project[]
  tasks: Task[]
  entries: Entry[]
}
