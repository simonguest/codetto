import { watch, ref } from 'vue'

import { notebookStore } from '@store/notebookStore'
import { fileStore } from '@store/fileStore'
import { saveNotebookFile } from '@/services/fileService'
import { Notebook } from '@schemas/notebook'

// Configuration constants
const AUTO_SAVE_DEBOUNCE_MS = 2000 // Save 2 seconds after last change
const SAVE_STATUS_DISPLAY_MS = 2000 // How long to show "saved" status

export function useNotebookAutoSave() {
  const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const lastSaved = ref<Date | null>(null)

  // Debounced save function
  let saveTimeout: NodeJS.Timeout | null = null

  const debouncedSave = async (content: Notebook) => {
    if (saveTimeout) clearTimeout(saveTimeout)

    saveTimeout = setTimeout(async () => {
      if (!fileStore.filePath) {
        console.warn('Auto-Save: No file path set, skipping save')
        return
      }

      try {
        console.log(`Auto-Save: Saving to ${fileStore.filePath}`)
        saveStatus.value = 'saving'

        // Convert reactive object to plain object before serializing
        const plainNotebook = JSON.parse(JSON.stringify(content))
        await saveNotebookFile(fileStore.filePath, plainNotebook)

        saveStatus.value = 'saved'
        lastSaved.value = new Date()
        console.log(`Auto-Save: Saved to ${fileStore.filePath}`)

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
