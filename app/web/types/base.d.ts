import * as emotion from '@emotion/react'
export {}

export type _IF<T, E> = (arg: { then: T; else: E }) => E

declare global {
  const css: typeof emotion.css
  const navigate: (src: string) => void
  const params: any
  
}
