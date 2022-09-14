import { Label } from '@fluentui/react'
import set from 'lodash.set'
import { useContext, useEffect, useRef } from 'react'
import {
  IFilterItemText,
  IFilterProp,
  IFilterSelect,
} from 'src/migrate/pkgs/web/ext/types/__filter'
import { IBaseFilterDef } from 'src/migrate/pkgs/web/ext/types/__list'
import PureSelect from '../../form/web/fields/PureSelect'
import { getFilterDef } from './FilterSingle'
export const queryFilterSelect: IBaseFilterDef['modifyQuery'] = (props) => {
  const { params, instance, name } = props
  set(params.where, name, instance.value)
}
export const FilterSelect = ({
  ctx,
  name,
  children,
  onSubmit,
}: IFilterProp<IFilterItemText>) => {
  const state = useContext(ctx)
  const filter = state.filter.instances[name] as unknown as IFilterSelect
  const def = getFilterDef(name, state)

  const _ = useRef({
    originalValue: filter.value,
    label: filter.value,
    items: [] as any[],
  })

  const meta = _.current
  const render = state.filter.instances[name].render

  useEffect(() => {
    if (typeof filter.items === 'function') {
      const items = filter.items(state)
      if (items instanceof Promise) {
        items.then((e) => {
          meta.items = e
          render()
        })
      } else {
        meta.items = items
        render()
      }
    } else {
      meta.items = filter.items
      render()
    }
  }, [])

  const submit = () => {
    onSubmit()
    render()

    if (meta.originalValue !== filter.value) {
      state.db.query()
    }
  }

  return children({
    name,
    submit,
    FilterInput: (props) => {
      return (
        <PureSelect
          items={meta.items}
          value={filter.value}
          onChange={(value, label) => {
            filter.value = value as any
            meta.label = label
            submit()
          }}
        />
      )
    },
    def,
    filter: filter as any,
    operators: [
      {
        label: 'Select',
        value: 'equals',
      },
    ],
    ValueLabel: () => {
      return <Label className="filter-label">{meta.label} </Label>
    },
  })
}
