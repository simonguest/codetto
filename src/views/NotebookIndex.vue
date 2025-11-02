<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

import { settingsStore } from "@store/settingsStore";
import { NOTEBOOK_LABELS, LOCALE_METADATA } from "@/i18n";
import NotebookCard from "@components/NotebookCard.vue";

import { listNotebooks, deleteNotebook as deleteNotebookFromStorage, importNotebookFromFile, importNotebookFromUrl, type NotebookInfo } from "@storage/notebookStorage";
import UrlInputDialog from "@components/UrlInputDialog.vue";

const notebookLabels = computed(() => NOTEBOOK_LABELS[settingsStore.locale]);
const isRTL = computed(() => LOCALE_METADATA[settingsStore.locale].direction === 'rtl');

const notebooks = ref<NotebookInfo[]>([]);
const showUrlDialog = ref(false);
const errorDialog = ref({
  show: false,
  title: '',
  message: ''
});

onMounted(async () => {
  try {
    const notebookList = await listNotebooks();
    notebooks.value = notebookList;
  } catch (error) {
    console.error('Failed to load notebooks:', error);
  }
});

const deleteNotebook = async (notebookId: string) => {
  try {
    await deleteNotebookFromStorage(notebookId);
    
    // Only remove from UI if storage deletion succeeded
    const index = notebooks.value.findIndex(nb => nb.id === notebookId);
    if (index > -1) {
      notebooks.value.splice(index, 1);
    }
    
    console.log('Notebook deleted successfully:', notebookId);
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
    
    // Handle file selection
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        console.log('No file selected');
        return;
      }
      
      try {
        const id = await importNotebookFromFile(file);        
        console.log('Notebook imported successfully:', id);
        
        const notebookList = await listNotebooks();
        notebooks.value = notebookList;
        
      } catch (importError) {
        console.error('Failed to import notebook:', importError);
        alert(`Failed to import notebook: ${importError instanceof Error ? importError.message : 'Unknown error'}`);
      }
    };
    
    // Trigger file selection
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
    console.log('Importing notebook from URL:', url);
    const id = await importNotebookFromUrl(url);
    console.log('Notebook imported successfully:', id);
    
    const notebookList = await listNotebooks();
    notebooks.value = notebookList;
    
  } catch (importError) {
    console.error('Failed to import notebook from URL:', importError);
    
    // Wait a bit to ensure URL dialog is fully closed before showing error
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
      <div class="d-flex align-center mb-6 header-container">
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

      <!-- Notebook Cards Grid -->
      <v-row>
        <v-col
          v-for="notebook in notebooks"
          :key="notebook.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <NotebookCard
            :notebook="notebook"
            @delete="deleteNotebook"
          />
        </v-col>
      </v-row>

      <!-- Empty state if no notebooks -->
      <div v-if="notebooks.length === 0" class="text-center mt-8">
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

/* RTL-aware header layout */
.header-container {
  flex-direction: row;
}

html[dir="rtl"] .header-container {
  flex-direction: row-reverse;
}

/* RTL-aware title alignment */
html[dir="rtl"] .notebook-title {
  text-align: right;
}

html[dir="ltr"] .notebook-title {
  text-align: left;
}
</style>
