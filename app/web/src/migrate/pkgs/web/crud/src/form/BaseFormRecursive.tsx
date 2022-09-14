import { DefaultButton, Modal } from '@fluentui/react'
import { createContext, FC } from 'react'
import { CRUDGlobal } from 'src/migrate/pkgs/web/crud/src/CRUDGlobal'
import { RecursiveLayout } from 'src/migrate/pkgs/web/crud/src/form/BaseFormLayout'
import { useGlobal, useLocal } from 'web-utils'
import WebField from 'src/migrate/pkgs/web/crud/src/form/web/fields'
import { BaseWindow } from 'types/window'
import contentStyles from 'src/libs/contentStyles'
import Button from '../../../../button'

declare const window: BaseWindow & Window
const noop = () => {}
export const BaseFormRecursive: FC<{
  layout: string[]
  state: any
  ctx: any
  direction: 'col' | 'row'
}> = ({ layout, state, ctx, direction }) => {
  return (
    <>
      <RecursiveLayout
        layout={layout}
        state={state as any}
        ctx={ctx as any}
        direction={direction}
      />
    </>
  )
}
