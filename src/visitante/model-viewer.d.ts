// Tipos del elemento <model-viewer> en JSX: la biblioteca solo declara el elemento del DOM.

import type { DetailedHTMLProps, HTMLAttributes } from 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src: string
        alt: string
        'camera-controls'?: boolean
        'disable-pan'?: boolean
        'interaction-prompt'?: 'auto' | 'none'
        'touch-action'?: 'pan-y' | 'pan-x' | 'none'
      }
    }
  }
}
