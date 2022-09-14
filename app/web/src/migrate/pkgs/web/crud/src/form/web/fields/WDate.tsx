import { DatePicker } from '@fluentui/react'
import { parseISO } from 'date-fns/esm'
import set from 'lodash.set'
import { useContext } from 'react'
import { BaseWindow } from 'types/window'
import { shortFormatDate } from 'src/migrate/pkgs/web/utils/src/formatDate'
import { IBaseFieldProps } from 'src/migrate/pkgs/web/ext/types/__form'
declare const window: BaseWindow
export const WDate = ({ name, internalChange, ctx }: IBaseFieldProps) => {
  const form = useContext(ctx)
  const field = form.config.fields[name]
  if (!field) return null
  const state = field.state
  let type = 'text'
  if (['number'].indexOf(state.type) >= 0) type = state.type
  let date = state.value

  // console.log(state.name)
  if (!(date instanceof Date)) {
    date = parseISO(date)
  }

  if (isNaN(date as any)) {
    date = new Date()
    set(form.db.data, name, date)
  }

  return (
    <DatePicker
      value={date}
      formatDate={(date: any) => {
        if (date instanceof Date && !isNaN(date as any)) {
          return shortFormatDate(date)
        }
        return ''
      }}
      onSelectDate={(value) => {
        set(form.db.data, name, value)
        if (typeof state.onChange === 'function')
          state.onChange(value, {
            state: form,
            row: form.db.data,
            col: name,
          })
        internalChange(value)
        state.render()
      }}
    />
  )
}
