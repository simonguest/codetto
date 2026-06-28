import { watch, ref } from 'vue'

import { notebookStore } from '@store/notebookStore'
import { saveNotebook } from '@storage/notebookStorage'
import { Notebook } from '@schemas/notebook'

// Configuration constants
const AUTO_SAVE_DEBOUNCE_MS = 2000 // Save 2 seconds after last change
const SAVE_STATUS_DISPLAY_MS = 2000 // How long to show "saved" status

export function useNotebookAutoSave(notebookId: string) {
  const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const lastSaved = ref<Date | null>(null)

  // Debounced save function
  let saveTimeout: NodeJS.Timeout | null = null

  const debouncedSave = async (content: Notebook) => {
    if (saveTimeout) clearTimeout(saveTimeout)

    saveTimeout = setTimeout(async () => {
      try {
        console.log(`Auto-Save: Saving Notebook ${notebookId}`);
        saveStatus.value = 'saving'

        // Convert reactive object to plain object for IndexedDB
        const plainNotebook = JSON.parse(JSON.stringify(content));

        // Strip canvas handle outputs before persisting. The "application/x-via-canvas"
        // MIME type is an integer handle pointing to a live DOM element — it has no
        // meaning across page reloads and should never be written to IndexedDB.
        // Leaving it in causes the saved cell to appear to have a result on next load
        // (showing the output tab) while the handle resolves to nothing, and the
        // coincidental handle-number reuse prevents CanvasResult from re-mounting.
        plainNotebook.cells?.forEach((cell: any) => {
          if (!cell.outputs) return;
          cell.outputs = cell.outputs
            .map((output: any) => {
              if (!output.data?.['application/x-via-canvas']) return output;
              const { 'application/x-via-canvas': _, ...rest } = output.data;
              return Object.keys(rest).length > 0 ? { ...output, data: rest } : null;
            })
            .filter(Boolean);
        });

        // Calculate CFU progress before saving
        const cfuCells = plainNotebook.cells.filter(
          (cell: { cell_type: string; metadata?: { tags?: string[] } }) =>
            cell.cell_type === 'raw' && cell.metadata?.tags?.includes('cfu')
        );
        if (cfuCells.length > 0) {
          const answered = cfuCells.filter((cell: { source: string | string[] }) => {
            try {
              const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
              return JSON.parse(source).submitted_answer !== '';
            } catch {
              return false;
            }
          }).length;
          plainNotebook.metadata = plainNotebook.metadata || {};
          plainNotebook.metadata.progress = Math.round((answered / cfuCells.length) * 100);
        } else if (plainNotebook.metadata) {
          delete plainNotebook.metadata.progress;
        }

        await saveNotebook(notebookId, plainNotebook)
        saveStatus.value = 'saved'
        lastSaved.value = new Date()
        console.log(`Auto-Save: Saved Notebook ${notebookId}`);

        // Reset to idle after showing "saved" for a moment
        setTimeout(() => {
          if (saveStatus.value === 'saved') {
            saveStatus.value = 'idle'
          }
        }, SAVE_STATUS_DISPLAY_MS)
      } catch (error) {
        console.error('Auto-Save: Failed:', error)
        saveStatus.value = 'error'
      }
    }, AUTO_SAVE_DEBOUNCE_MS)
  }

  // Watch for changes to the notebook content
  const stopWatcher = watch(
    () => notebookStore.updated,
    () => {
      if (notebookStore.updated != null) {
        // Only save if we actually have content
        if (notebookStore.content && notebookStore.content.cells?.length > 0) {
          debouncedSave(notebookStore.content)
        }
      }
    }
  )

  return {
    saveStatus,
    lastSaved,
    stopWatcher
  }
}
