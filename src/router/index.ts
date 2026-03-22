import { createRouter, createWebHashHistory } from 'vue-router'

import NotebookIndexView from '@views/NotebookIndex.vue'
import NotebookView from '@views/Notebook.vue'
import SettingsView from '@views/Settings.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: NotebookIndexView
  },
  {
    path: '/notebook',
    name: 'notebook',
    component: NotebookView
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView
  }
]

const router = createRouter({
  // @ts-ignore
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

export default router
