import get from 'lodash.get'
import { Context, useContext, useEffect, useRef } from 'react'
import { BaseWindow } from 'types/window'
import { niceCase } from 'src/migrate/pkgs/web/utils/src/niceCase'
import { useRender } from 'src/migrate/pkgs/web/utils/src/useRender'
import {
  IFilterItem,
  IFilterProp,
} from 'src/migrate/pkgs/web/ext/types/__filter'
import {
  IBaseFilterDef,
  IBaseListContext,
} from 'src/migrate/pkgs/web/ext/types/__list'
import { FilterBlank, queryFilterBlank } from './FilterBlank'
import { FilterDate, FilterDateModifier, queryFilterDate } from './FilterDate'
import { FilterNumber, queryFilterNumber } from './FilterNumber'
import { FilterSelect, queryFilterSelect } from './FilterSelect'
import { FilterTab, queryFilterTab } from './FilterTab'
import { FilterText, queryFilterText } from './FilterText'
declare const window: BaseWindow
type Unarray<T> = T extends Array<infer U> ? U : T
export const FilterSingle = ({
  filter,
  ctx,
  children,
  onSubmit,
}: {
  filter: Unarray<IBaseListContext['filter']['columns']>
  ctx: Context<IBaseListContext>
  children: IFilterProp<IFilterItem>['children']
  onSubmit: () => void
}) => {
  const _ = useRef({
    init: false,
  })

  const meta = _.current
  const render = useRender()
  const state = useContext(ctx)
  const col = Array.isArray(filter) ? filter[0] : filter
  const internal = state.filter.instances[col] as IFilterItem
  useEffect(() => {
    meta.init = true
    initializeSingleFilter(state, col, render)
    render()
  }, [])
  if (!meta.init) return null
  const FilterComponent = internal.component
  return (
    <FilterComponent ctx={ctx} name={col} onSubmit={onSubmit}>
      {children}
    </FilterComponent>
  )
}
export const initializeSingleFilter = (
  state: IBaseListContext,
  col: string,
  render: () => void,
  definition?: any
) => {
  const components = state.filter.instances
  let filter: Partial<IBaseFilterDef> = {}

  for (let i of state.filter.columns) {
    if (Array.isArray(i) && i[1] && i[0] === col) {
      filter = i[1]
    }
  }

  if (!state.db.definition) {
    return
  }

  const alt = state.filter.alter
  let altcol = {} as any

  if (alt && alt[col]) {
    altcol = alt[col]
  }

  let type = get(altcol, 'type', getFilterType(col, state) as any)
  if (definition && definition.type) {
    type = definition.type
  }
  const def = getFilterDef(col, state) // add new filter here:

  const filterDefinitions = {
    text: {
      defaultOperator: 'contains',
      component: FilterText,
      query: queryFilterText,
    },
    number: {
      defaultOperator: 'equals',
      component: FilterNumber,
      query: queryFilterNumber,
    },
    date: {
      defaultOperator: 'daily',
      component: FilterDate,
      query: queryFilterDate,
    },
    tab: {
      defaultOperator: '',
      component: FilterTab,
      query: queryFilterTab,
    },
    select: {
      defaultOperator: 'equals',
      component: FilterSelect,
      query: queryFilterSelect,
    },
  }

  const current = filterDefinitions[type] || {
    defaultOperator: '',
    query: queryFilterBlank,
    component: FilterBlank,
  }

  if (definition) {
    if (definition.operator) current.defaultOperator = definition.operator
    if (definition.items) altcol.items = definition.items
  }

  let title = niceCase(col)

  if (definition && definition.title) {
    title = definition.title
  } else {
    if (Array.isArray(state.table.columns)) {
      for (let i of state.table.columns) {
        if (Array.isArray(i)) {
          if (i[0] === col && typeof i[1] === 'object' && i[1].title) {
            title = i[1].title
          }
        }
      }
    }
  }

  if (!components[col]) {
    let visible = false
    components[col] = {
      value: get(components, `${col}.value`) || get(def, 'default.value'),
      title,
      visible,
      operator:
        get(components, `${col}.operator`) ||
        get(def, 'default.operator') ||
        current.defaultOperator,
      component: current.component,
      type: (get(components, `${col}.type`) || type) as any,
      render,
      modifyQuery: filter.modifyQuery ? filter.modifyQuery : current.query,
      ...altcol,
    }
  }
  if (get(def, `min`)) {
    components[col]['min'] = get(def, `min`)
  }
  if (get(def, `max`)) {
    components[col]['max'] = get(def, `max`)
  }
  if (filter.modifyQuery) {
    components[col]['modifyQuery'] = filter.modifyQuery
  }
}

const getFilterType = (
  col: string,
  state: IBaseListContext
): IFilterItem['type'] => {
  if (state.db.definition) {
    const def = state.db.definition.columns[col]

    if (def) {
      switch (def.type) {
        case 'string':
          return 'text'
      }

      return def.type as any
    }
  }

  return 'text'
}

export const getFilterDef = (
  name: string,
  state: IBaseListContext
): IBaseFilterDef => {
  let column = {
    type: '',
    visible: 'auto' as const,
    default: {
      value: undefined as any,
      operator: undefined as any,
    },
    title: niceCase(name),
    modifyQuery: undefined as any,
    min: null as any,
    max: null as any,
  }

  for (let i of state.filter.columns) {
    if (Array.isArray(i) && i.length > 1) {
      if (i[0] === name) {
        column = i[1] as any
        break
      }
    }
  }

  return column
}
