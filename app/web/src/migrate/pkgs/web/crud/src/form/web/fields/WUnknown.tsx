import { useContext } from 'react'
import { IBaseFieldProps } from 'src/migrate/pkgs/web/ext/types/__form'
import { WBox } from './Winfo'
import set from 'lodash.set'
import { useRender } from 'src/migrate/pkgs/web/utils/src/useRender'

export const WUnknown = ({ ctx, internalChange, name }: IBaseFieldProps) => {
  const form = useContext(ctx)
  const field = form.config.fields[name] as any
  if (!field) return null
  const state = field.state
  const render = useRender()
  return typeof state.children === 'function' ? (
    state.children({
      ctx: form,
      field: state,
      update: (value: any) => {
        set(form.db.data, name, value)

        if (typeof state.onChange === 'function')
          state.onChange(value, {
            state: form,
            row: form.db.data,
            col: name,
          })
        internalChange(value)
        render()
      },
    })
  ) : (
    <WBox>
      <span className="opacity-50">
        Field type <span className="text-red-700">[{state.type}]</span> dalam
        pengerjaan
      </span>
    </WBox>
  )
}
