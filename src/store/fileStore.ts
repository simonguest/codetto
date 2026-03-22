import { reactive } from 'vue'

interface FileStore {
  filePath: string | null
}

export const fileStore = reactive<FileStore>({
  filePath: null,
})
