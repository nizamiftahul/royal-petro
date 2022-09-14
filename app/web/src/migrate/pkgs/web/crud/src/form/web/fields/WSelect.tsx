import set from 'lodash.set'
import { useContext } from 'react'
import { IBaseFieldProps } from 'src/migrate/pkgs/web/ext/types/__form'
import { BaseWindow } from 'types/window'
import { useLocal } from 'web-utils'
import PureSelect from './PureSelect'

declare const window: BaseWindow
export const WSelect = ({ name, internalChange, ctx }: IBaseFieldProps) => {
  const form = useContext(ctx)
  const field = form.config.fields[name]
  if (!field) return null
  const state: any = field.state
  const meta = useLocal({
    value: state.value,
  })
  return (
    <>
      <PureSelect
        items={state.items || []}
        value={meta.value}
        onChange={(value) => {
          meta.value = value
          set(form.db.data, name, value)
          if (typeof state.onChange === 'function')
            state.onChange(value, {
              state: form,
              row: form.db.data,
              col: name,
            })
          internalChange(value)
          meta.render()
        }}
      />
    </>
  )
}
