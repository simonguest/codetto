declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.css'
declare module 'vuetify/styles'

declare module '*?raw' {
  const content: string
  export default content
}

declare module 'earcut' {
  function earcut(data: number[], holeIndices?: number[], dim?: number): number[];
  export default earcut;
}
