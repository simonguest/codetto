import { createRouter, createWebHashHistory } from 'vue-router'

import NotebookIndexView from '@views/NotebookIndex.vue'
import NotebookView from '@views/Notebook.vue'
import NotebookJSONView from '@views/NotebookJSON.vue'
import SettingsView from '@views/Settings.vue'
import TestNotebookView from '@views/TestNotebook.vue'

const routes = [
  {
    path: '/',
    redirect: 'notebooks'
  },
  {
    path: '/notebooks',
    name: 'notebooks',
    component: NotebookIndexView
  },
  {
    path: '/notebooks/:id/json',
    name: 'notebook-json',
    component: NotebookJSONView
  },
  {
    path: '/notebooks/:id',
    name: 'notebook',
    component: NotebookView
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView
  },
  {
    path: '/test/:filename',
    name: 'test-notebook',
    component: TestNotebookView
  }
]

const router = createRouter({
  // @ts-ignore
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

export default router
