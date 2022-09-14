import { css } from '@emotion/react'
import { Toggle } from '@fluentui/react'
import set from 'lodash.set'
import { useContext } from 'react'
import { BaseWindow } from 'types/window'
import { IBaseFieldProps } from 'src/migrate/pkgs/web/ext/types/__form'
declare const window: BaseWindow
export const WBoolean = ({ name, internalChange, ctx }: IBaseFieldProps) => {
  const form = useContext(ctx)
  const field = form.config.fields[name]
  if (!field) return null
  const state = field.state

  return (
    <Toggle
      css={css`
        margin: 0px;
        padding: 0px 0px;
        height: 34px;

        align-items: center;
        display: flex;
        border-radius: 2px;
      `}
      checked={!!state.value}
      onText="Yes"
      offText="No"
      onChange={(_, value) => {
        set(form.db.data, name, value)
        console.log('sds', value, {
          state: form,
          row: form.db.data,
          col: name,
        })

        if (typeof state.onChange === 'function')
          state.onChange(value, {
            state: form,
            row: form.db.data,
            col: name,
          })
        form.config.fields[name].state.value = value
        // form.component.render()
        internalChange(value)
        state.render()
      }}
    />
  )
}
