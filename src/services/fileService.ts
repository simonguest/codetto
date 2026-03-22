import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { v4 as uuidv4 } from 'uuid'

import type { Notebook, Cell } from '@schemas/notebook'

const parseAndNormalize = (content: string, filename: string): Notebook => {
  const notebook: Notebook = JSON.parse(content)

  if (!notebook.cells || !Array.isArray(notebook.cells)) {
    throw new Error('Invalid notebook format: missing or invalid cells array')
  }

  if (!notebook.metadata) notebook.metadata = {}
  if (!notebook.nbformat) notebook.nbformat = 4
  if (!notebook.nbformat_minor) notebook.nbformat_minor = 2

  notebook.cells.forEach((cell: Cell) => {
    if (!cell.id) cell.id = uuidv4()
    if (!cell.metadata) cell.metadata = {}
    if (!cell.source) cell.source = []
  })

  if (!notebook.metadata.title) {
    notebook.metadata.title = filename.replace(/\.ipynb$/, '') || 'Untitled Notebook'
  }

  return notebook
}

export const openNotebookFile = async (): Promise<{ path: string; notebook: Notebook } | null> => {
  const path = await open({
    filters: [{ name: 'Jupyter Notebook', extensions: ['ipynb'] }],
    multiple: false,
  })

  if (!path) return null

  const content = await readTextFile(path)
  const filename = path.split('/').pop() || path.split('\\').pop() || 'Untitled'
  const notebook = parseAndNormalize(content, filename)

  return { path, notebook }
}

export const saveNotebookFile = async (path: string, notebook: Notebook): Promise<void> => {
  const content = JSON.stringify(notebook, null, 2)
  await writeTextFile(path, content)
}
