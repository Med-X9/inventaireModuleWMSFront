declare module 'xlsx'
declare module 'file-saver'
import { Teleport } from 'vue'

declare module 'vue' {
  export interface GlobalComponents {
    Teleport: typeof Teleport
  }
}
