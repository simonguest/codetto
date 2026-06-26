<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import BaseLayout from "./BaseLayout.vue";
import { parseNotebookFromUrl, saveImportedNotebook, findDuplicateNotebook, type NotebookInfo } from "@storage/notebookStorage";
import type { Notebook } from "@schemas/notebook";
import { settingsStore } from "@store/settingsStore";
import { NOTEBOOK_LABELS } from "@/i18n";
import DuplicateNotebookDialog from "@components/DuplicateNotebookDialog.vue";

const router = useRouter();
const notebookLabels = computed(() => NOTEBOOK_LABELS[settingsStore.locale]);
const errorDialog = ref({ show: false, title: '', message: '' });

const duplicateMatch = ref<NotebookInfo | null>(null);
const pendingImport = ref<{ notebook: Notebook; sourceUrl: string } | null>(null);

const openExisting = () => {
  const id = duplicateMatch.value?.id;
  pendingImport.value = null;
  duplicateMatch.value = null;
  if (id) router.push({ name: 'notebook', params: { id } });
};

const finishImport = async () => {
  if (!pendingImport.value) return;
  const { notebook, sourceUrl } = pendingImport.value;
  pendingImport.value = null;
  duplicateMatch.value = null;

  const id = await saveImportedNotebook(notebook, { sourceUrl });
  router.push({ name: 'notebook', params: { id } });
};

const cancelDuplicate = () => {
  pendingImport.value = null;
  duplicateMatch.value = null;
};

onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  const githubParam = params.get('github');
  if (!githubParam) return;

  // Strip the query param before processing so a refresh doesn't retry
  window.history.replaceState({}, '', window.location.pathname + window.location.hash);

  const url = `https://github.com/${githubParam}`;

  try {
    const notebook = await parseNotebookFromUrl(url);
    const duplicate = await findDuplicateNotebook(
      url,
      notebook.metadata?.title as string,
      notebook.metadata?.course as string | undefined,
      notebook.metadata?.module as string | undefined,
    );

    if (duplicate) {
      pendingImport.value = { notebook, sourceUrl: url };
      duplicateMatch.value = duplicate;
    } else {
      const id = await saveImportedNotebook(notebook, { sourceUrl: url });
      router.push({ name: 'notebook', params: { id } });
    }
  } catch (error) {
    errorDialog.value = {
      show: true,
      title: notebookLabels.value.urlDialogError,
      message: error instanceof Error ? error.message : notebookLabels.value.urlDialogErrorMessage
    };
  }
});
</script>

<template>
  <BaseLayout />

  <DuplicateNotebookDialog
    :show="!!duplicateMatch"
    :existing="duplicateMatch"
    @open-existing="openExisting"
    @import-new="finishImport"
    @cancel="cancelDuplicate"
  />

  <v-dialog v-model="errorDialog.show" max-width="400px">
    <v-card>
      <v-card-title>{{ errorDialog.title }}</v-card-title>
      <v-card-text>
        <p>{{ errorDialog.message }}</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="errorDialog.show = false">OK</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style>

@import "./styles.css";
@import "./icons.min.css";

/* Global RTL support styles */
html[dir="rtl"] {
  direction: rtl;
}

html[dir="ltr"] {
  direction: ltr;
}

/* RTL-specific adjustments for Vuetify components */
html[dir="rtl"] .v-card {
  text-align: right;
}

html[dir="rtl"] .v-card-title {
  text-align: right;
}

html[dir="rtl"] .v-card-text {
  text-align: right;
}

html[dir="rtl"] .v-select {
  text-align: right;
}

html[dir="rtl"] .v-field__input {
  text-align: right;
}

html[dir="rtl"] .v-list-item-title {
  text-align: right;
}

/* Ensure proper spacing and alignment for RTL */
html[dir="rtl"] .v-container {
  padding-right: 16px;
  padding-left: 16px;
}

/* RTL adjustments for bottom navigation */
html[dir="rtl"] .v-bottom-navigation .v-btn {
  flex-direction: column;
}

html[dir="rtl"] .v-bottom-navigation .v-btn .v-icon {
  margin-bottom: 4px;
}

/* Ensure text inputs work properly in RTL */
html[dir="rtl"] input,
html[dir="rtl"] textarea {
  text-align: right;
}

html[dir="ltr"] input,
html[dir="ltr"] textarea {
  text-align: left;
}

/* Smooth transitions for direction changes */
* {
  transition: text-align 0.3s ease, direction 0.3s ease;
}

</style>