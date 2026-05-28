<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import { settingsStore } from "@store/settingsStore";
import { NOTEBOOK_LABELS, LOCALE_METADATA } from "@/i18n";
import NotebookCard from "@components/NotebookCard.vue";
import FolderCard from "@components/FolderCard.vue";

import { listNotebooks, deleteNotebook as deleteNotebookFromStorage, renameNotebook as renameNotebookInStorage, importNotebookFromFile, importNotebookFromUrl, type NotebookInfo } from "@storage/notebookStorage";
import UrlInputDialog from "@components/UrlInputDialog.vue";

const route = useRoute();
const router = useRouter();

const notebookLabels = computed(() => NOTEBOOK_LABELS[settingsStore.locale]);
const isRTL = computed(() => LOCALE_METADATA[settingsStore.locale].direction === 'rtl');

const allNotebooks = ref<NotebookInfo[]>([]);
const showUrlDialog = ref(false);
const errorDialog = ref({
  show: false,
  title: '',
  message: ''
});

const currentFolder = computed(() => (route.query.folder as string) || '');

interface FolderItem {
  name: string;
  path: string;
}

const currentItems = computed(() => {
  const path = currentFolder.value;
  const isRoot = !path;

  const folderMap = new Map<string, string>(); // path -> name
  const notebooks: NotebookInfo[] = [];

  for (const nb of allNotebooks.value) {
    const raw = nb.folder || '';
    const nbFolder = raw && !raw.startsWith('/') ? `/${raw}` : raw;

    if (isRoot) {
      if (!nbFolder) {
        notebooks.push(nb);
      } else {
        const segments = nbFolder.split('/').filter(Boolean);
        if (segments.length > 0) {
          const childName = segments[0];
          const childPath = `/${childName}`;
          folderMap.set(childPath, childName);
        }
      }
    } else {
      if (nbFolder === path) {
        notebooks.push(nb);
      } else if (nbFolder.startsWith(path + '/')) {
        const remainder = nbFolder.slice(path.length + 1);
        const childName = remainder.split('/')[0];
        const childPath = `${path}/${childName}`;
        folderMap.set(childPath, childName);
      }
    }
  }

  const folders: FolderItem[] = [...folderMap.entries()]
    .map(([p, name]) => ({ path: p, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { folders, notebooks };
});

const breadcrumbs = computed(() => {
  const path = currentFolder.value;
  const crumbs = [{ label: notebookLabels.value.title, path: '' }];

  if (!path) return crumbs;

  const segments = path.split('/').filter(Boolean);
  let accumulated = '';
  for (const segment of segments) {
    accumulated += `/${segment}`;
    crumbs.push({ label: segment, path: accumulated });
  }

  return crumbs;
});

const navigateToFolder = (path: string) => {
  router.push({ name: 'notebooks', query: path ? { folder: path } : {} });
};

const loadNotebooks = async () => {
  try {
    allNotebooks.value = await listNotebooks();
  } catch (error) {
    console.error('Failed to load notebooks:', error);
  }
};

onMounted(loadNotebooks);

const renameNotebook = async (notebookId: string, newTitle: string) => {
  try {
    await renameNotebookInStorage(notebookId, newTitle);
    const nb = allNotebooks.value.find(n => n.id === notebookId);
    if (nb) {
      nb.title = newTitle;
    }
  } catch (error) {
    console.error('Failed to rename notebook:', error);
  }
};

const deleteNotebook = async (notebookId: string) => {
  try {
    await deleteNotebookFromStorage(notebookId);
    const index = allNotebooks.value.findIndex(nb => nb.id === notebookId);
    if (index > -1) {
      allNotebooks.value.splice(index, 1);
    }
  } catch (error) {
    console.error('Failed to delete notebook:', error);
  }
};

const importFromFile = async () => {
  try {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ipynb';
    input.style.display = 'none';

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const id = await importNotebookFromFile(file, currentFolder.value || undefined);
        console.log('Notebook imported successfully:', id);
        await loadNotebooks();
      } catch (importError) {
        console.error('Failed to import notebook:', importError);
        alert(`Failed to import notebook: ${importError instanceof Error ? importError.message : 'Unknown error'}`);
      }
    };

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  } catch (error) {
    console.error('Failed to import notebook:', error);
    alert('Failed to import notebook. Please try again.');
  }
};

const importFromUrl = () => {
  showUrlDialog.value = true;
};

const handleUrlSubmit = async (url: string) => {
  showUrlDialog.value = false;

  try {
    const id = await importNotebookFromUrl(url, currentFolder.value || undefined);
    console.log('Notebook imported successfully:', id);
    await loadNotebooks();
  } catch (importError) {
    console.error('Failed to import notebook from URL:', importError);

    setTimeout(() => {
      errorDialog.value = {
        show: true,
        title: notebookLabels.value.urlDialogError,
        message: importError instanceof Error ? importError.message : notebookLabels.value.urlDialogErrorMessage
      };
    }, 150);
  }
};

const handleUrlCancel = () => {
  showUrlDialog.value = false;
};

const closeErrorDialog = () => {
  errorDialog.value.show = false;
};
</script>

<template>
  <div class="notebook-index">
    <v-container fluid class="pa-4">
      <!-- Header with title and add button -->
      <div class="d-flex align-center mb-4 header-container">
        <h1 class="text-h4 notebook-title flex-grow-1">{{ notebookLabels.title }}</h1>

        <!-- Add Notebook Menu -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              color="primary"
              v-bind="props"
              :prepend-icon="isRTL ? undefined : 'mdi-plus'"
              :append-icon="isRTL ? 'mdi-plus' : undefined"
            >
              {{ notebookLabels.addNotebook }}
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="importFromFile">
              <v-list-item-title>{{ notebookLabels.fromFile }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="importFromUrl">
              <v-list-item-title>{{ notebookLabels.fromUrl }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <!-- Breadcrumbs -->
      <v-breadcrumbs
        v-if="breadcrumbs.length > 1"
        :items="breadcrumbs"
        class="pa-0 mb-4"
      >
        <template v-slot:item="{ item }">
          <v-breadcrumbs-item
            :disabled="item.path === currentFolder"
            @click="item.path !== currentFolder && navigateToFolder(item.path)"
            style="cursor: pointer"
          >
            {{ item.label }}
          </v-breadcrumbs-item>
        </template>
      </v-breadcrumbs>

      <!-- Folders and Notebooks Grid -->
      <v-row>
        <!-- Folder cards -->
        <v-col
          v-for="folder in currentItems.folders"
          :key="folder.path"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <FolderCard
            :name="folder.name"
            :path="folder.path"
            @navigate="navigateToFolder"
          />
        </v-col>

        <!-- Notebook cards -->
        <v-col
          v-for="notebook in currentItems.notebooks"
          :key="notebook.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <NotebookCard
            :notebook="notebook"
            @delete="deleteNotebook"
            @rename="renameNotebook"
          />
        </v-col>
      </v-row>

      <!-- Empty state -->
      <div v-if="currentItems.folders.length === 0 && currentItems.notebooks.length === 0" class="text-center mt-8">
        <v-icon icon="mdi-notebook-outline" size="64" color="grey"></v-icon>
        <p class="text-h6 mt-4 text-medium-emphasis">No notebooks yet</p>
        <p class="text-body-2 text-medium-emphasis">Create your first notebook to get started</p>
      </div>
    </v-container>

    <!-- URL Input Dialog -->
    <UrlInputDialog
      :show="showUrlDialog"
      @submit="handleUrlSubmit"
      @cancel="handleUrlCancel"
    />

    <!-- Error Dialog -->
    <v-dialog v-model="errorDialog.show" max-width="400px">
      <v-card>
        <v-card-title>{{ errorDialog.title }}</v-card-title>
        <v-card-text>
          <p>{{ errorDialog.message }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="closeErrorDialog">
            {{ notebookLabels.urlDialogCancel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.notebook-index {
  height: 100%;
  width: 100%;
  padding: 16px;
}

.header-container {
  flex-direction: row;
}

html[dir="rtl"] .header-container {
  flex-direction: row-reverse;
}

html[dir="rtl"] .notebook-title {
  text-align: right;
}

html[dir="ltr"] .notebook-title {
  text-align: left;
}
</style>
