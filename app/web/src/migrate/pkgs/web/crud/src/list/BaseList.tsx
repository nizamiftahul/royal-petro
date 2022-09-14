import { css } from '@emotion/react'
import formatISO9075 from 'date-fns/formatISO9075'
import get from 'lodash.get'
import { createContext, useContext, useEffect, useRef } from 'react'
import {
  initializeState,
  saveState,
} from 'src/migrate/pkgs/web/crud/src/context-state'
import { generateStateID } from 'src/migrate/pkgs/web/crud/src/CRUD'
import {
  deepUpdate,
  weakUpdate,
} from 'src/migrate/pkgs/web/crud/src/form/BaseForm'
import { detectType } from 'src/migrate/pkgs/web/crud/src/utils/detect-type'
import { Loading } from 'src/migrate/pkgs/web/crud/src/view/loading'
import { ITableDefinitions } from 'src/migrate/pkgs/web/ext/types/qlist'
import { ICRUDContext } from 'src/migrate/pkgs/web/ext/types/__crud'
import { IBaseFormContext } from 'src/migrate/pkgs/web/ext/types/__form'
import {
  IBaseListContext,
  IBaseListProps,
} from 'src/migrate/pkgs/web/ext/types/__list'
import { niceCase } from 'src/migrate/pkgs/web/utils/src/niceCase'
import { removeCircular } from 'src/migrate/pkgs/web/utils/src/removeCircular'
import { useRender } from 'src/migrate/pkgs/web/utils/src/useRender'
import { BaseWindow } from 'types/window'
import { useGlobal, waitUntil } from 'web-utils'
import { CRUDGlobal } from '../CRUDGlobal'
import { fastEqual } from '../utils/fast-equal'
import { initializeSingleFilter } from './filter/FilterSingle'
import { BaseFilterWeb } from './web/BaseFilterWeb'
import { BaseListWeb } from './web/BaseListWeb'

declare const window: BaseWindow
export const BaseList = (props: IBaseListProps) => {
  const {
    id,
    parentCtx,
    table,
    list,
    columns,
    editable,
    query,
    filter,
    wrapRow,
    grid,
    action,
    params,
    platform: platformProp,
    onLoad,
    lateQuery,
    beforeQuery,
    wrapList,
    onInit,
    children,
    mobile,
    title,
    onRowClick,
    header,
    checkbox,
  } = props
  const render = useRender()

  const _ = useRef({
    init: false,
    queryOnInit: false,
    rawList: props.list || ([] as any[]),
    ctx: createContext({} as IBaseListContext),
    component: {
      Table: null as any,
      Filter: null as any,
    },
    state: {} as IBaseListContext,
  })

  const glb = useGlobal(CRUDGlobal)
  const meta = _.current
  const parent = parentCtx ? useContext(parentCtx) : null
  let platform: 'web' | 'mobile' = platformProp as any

  useEffect(() => {
    ;(async () => {
      await initializeComponent(meta.component)
      const crud = parent as ICRUDContext

      if (crud && crud.tree.children.list) {
        meta.init = true
        const list = crud.tree.children.list as IBaseListContext
        const result = createListContext(
          { ...props, platform },
          meta,
          render,
          glb
        )
        meta.state = result
        weakUpdate(meta.state, list)
        meta.state.db.list = list.db.list
      } else {
        const result = createListContext(props, meta, render, glb)
        deepUpdate(meta.state, result)
        initializeState(meta.state, parent)
      }
      meta.init = true
      meta.queryOnInit = typeof onInit === 'undefined'

      if (typeof onInit === 'function') {
        await onInit(meta.state)
        meta.init = true

        if (meta.state.db.list.length > 0) {
          await initializeList(meta.state)
          meta.queryOnInit = true

          if (!meta.state.db.tableName && !meta.state.db.sql) {
            meta.state.db.loading = false
          }

          render()
          return
        } else {
          meta.queryOnInit = true
        }
      } else if (
        Array.isArray(meta.state.db.list) &&
        meta.state.db.list.length > 0
      ) {
        meta.init = true
        await initializeList(meta.state)
        meta.queryOnInit = true

        if (!meta.state.db.tableName && !meta.state.db.sql) {
          meta.state.db.loading = false
        }

        render()
        return
      }

      if (crud && crud.crud && meta.init) {
        if (crud.tree.children.form) {
          const form = crud.tree.children.form as IBaseFormContext

          if (['success', 'ready'].indexOf(form.db.saveStatus) < 0) {
            meta.queryOnInit = false
            meta.state.db.loading = false
            render()
          }
        }
      }

      meta.init = true

      if (meta.queryOnInit) {
        await meta.state.db.query('on init ' + meta.state.db.tableName)
      }
    })()

    return () => {
      saveState(meta.state, parent)
    }
  }, [])

  useEffect(() => {
    if (meta.init) {
      meta.state.db.definition = null
    }
  }, [table, query])

  useEffect(() => {
    if (meta.init) {
      if (!fastEqual(params, meta.state.db.params)) {
        meta.state.db.params = params
        meta.state.db.query()
      }
    }
  }, [params])

  useEffect(() => {
    if (Array.isArray(list)) {
      waitUntil(() => meta.init).then(() => {
        if (!meta.state.db.tableName) {
          meta.state.db.list = list || []
          render()
        }
      })
    }
  }, [list])
  if (!meta.init) return <Loading />

  if (!meta.component.Table || !meta.component.Filter) {
    initializeComponent(meta.component).then(render)
    return <Loading />
  }

  const Table = meta.component.Table
  const Filter = meta.component.Filter
  if (!meta.queryOnInit && !!meta.state.db.loading) return <Loading />
  let showFilter = meta.state.filter.enable && !!meta.state.table.columns
  const content = (
    <meta.ctx.Provider value={meta.state}>
      {showFilter ? (
        <>
          {
            {
              topbar: (
                <div className="flex flex-col flex-1 self-stretch">
                  {showFilter && (
                    <div
                      className="flex items-stretch justify-between"
                      css={css`
                        background: #f3f4f6;
                        border-bottom: 1px solid #ececeb;
                        flex-grow: 0;
                        flex-basis: 40px;

                        .filter-item > .ms-Button {
                          background: white;
                        }
                      `}
                    >
                      <Filter ctx={meta.ctx} />
                    </div>
                  )}
                  <div className="flex flex-1 item-center relative">
                    <Table ctx={meta.ctx} />
                  </div>
                </div>
              ),
              sideleft: (
                <div
                  className="flex flex-row flex-1 self-stretch"
                  css={css`
                    /* .divider {
                      display: none;
                    } */
                    .filter-container {
                      .pure-tab {
                        margin-right: -1px;
                      }
                    }
                  `}
                >
                  {showFilter && (
                    <div className="filter-container flex items-stretch justify-between">
                      <Filter ctx={meta.ctx} />
                    </div>
                  )}
                  <div className="flex flex-1 item-center relative">
                    <Table ctx={meta.ctx} />
                  </div>
                </div>
              ),
            }[get(meta, 'state.filter.web.mode')]
          }
        </>
      ) : (
        <div className="flex flex-col flex-1 self-stretch relative">
          <Table ctx={meta.ctx} />
        </div>
      )}
    </meta.ctx.Provider>
  )

  if (typeof wrapList === 'function') {
    return wrapList({
      children: content,
      list: meta.state.db.list,
      state: meta.state,
    })
  }

  return content
}

const prepareFilter = async (state: IBaseListContext) => {
  const params = state.db.params
  const filter = state.filter

  const final = JSON.parse(JSON.stringify(params || {}, removeCircular())) || {}

  if (!filter.instances) {
    filter.instances = {}
  }

  for (let [k, f] of Object.entries(filter.instances)) {
    if (f.value) {
      if (!final.where) {
        final.where = {}
      }

      let column = {}

      for (let i of filter.columns) {
        if (Array.isArray(i) && i[1]) {
          column = i[1]
          break
        }
      }

      f.modifyQuery({
        params: final,
        instance: f,
        column,
        name: k,
        state,
      })
    }
  }

  return final
}

const initializeList = async (state: IBaseListContext) => {
  const mdb = state.db
  const mtbl = state.table
  const mflt = state.filter

  if (!mdb.definition) {
    if (mdb.tableName) {
      mdb.definition = await db[mdb.tableName].definition()
    } else {
      const columns: ITableDefinitions['columns'] = {}

      for (let [k, v] of Object.entries(mdb.list[0] || {})) {
        columns[k] = {
          name: k,
          nullable: true,
          pk: false,
          type: detectType(v),
        }
      }

      mdb.definition = {
        columns,
        rels: {},
        pk: '',
        db: {
          name: '',
        },
      }
    }
  }

  if (mdb.definition) {
    const defaultCols = await generateDefaultCols(mdb)

    if (!mtbl.columns) {
      mtbl.columns = defaultCols
    }

    if (!mflt.columns) {
      if (mtbl.columns && Array.isArray(mtbl.columns)) {
        mflt.columns = []

        for (let i of mtbl.columns) {
          const col = Array.isArray(i) ? i[0] : i + ''

          if (!mdb.definition.columns[col] && !mdb.definition.rels[col]) {
            if (col.indexOf('.') < 0) {
              continue
            }
          }

          if (typeof i === 'string') {
            mflt.columns.push([
              col,
              {
                title: niceCase(i),
              },
            ])
          } else {
            mflt.columns.push([
              col,
              {
                title: get(i, '1.title') || niceCase(i[0]),
              },
            ])
          }
        }
      } else {
        mflt.columns = defaultCols
      }

      if (mflt.alter) {
        for (let [key, _] of Object.entries(mflt.alter)) {
          if (!mflt.columns[key]) {
            mflt.columns.unshift([
              key,
              {
                title: niceCase(key),
              },
            ])
          }
        }
      }

      if (!mflt.instances) {
        mflt.instances = {}
      }

      for (let i of mflt.columns) {
        const col = Array.isArray(i) ? i[0] : i + ''
        initializeSingleFilter(
          state,
          col,
          () => {} // filter render is still not available yet
        )
      }
    }

    if (!mflt.instances) {
      mflt.instances = {}
    }
  }
}

const initializeComponent = async (component) => {
  if (!component.Table) component.Table = BaseListWeb
  if (!component.Filter) component.Filter = BaseFilterWeb
}

export const populateList = (
  list: any[],
  old: any[],
  state: IBaseListContext
) => {
  const pk = get(state, 'db.definition.pk')

  if (!state.table.rowsMeta) {
    state.table.rowsMeta = new WeakMap()
  }

  const rm = state.table.rowsMeta
  const meta = {}
  old.forEach((row) => {
    for (let i of Object.keys(row)) {
      if (i.indexOf('__') === 0) {
        if (!meta[row[pk]]) {
          meta[row[pk]] = {}
        }

        meta[row[pk]][i] = row[i]
      }
    }
  })

  for (let [k, row] of Object.entries(list)) {
    const idx = Number(k)
    const columns: Record<
      string,
      {
        render: () => void
      }
    > = {}

    if (Array.isArray(state.table.columns)) {
      for (let i of state.table.columns) {
        const col = Array.isArray(i) ? i[0] : i
        columns[col] = {
          render: () => {},
        }
      }
    }

    const getRaw = () => {
      const raw = {}

      for (let [k, v] of Object.entries(row)) {
        if (!k.startsWith('__')) {
          raw[k] = v
        }
      }

      return JSON.parse(JSON.stringify(raw))
    }

    rm.set(row, {
      columns: { ...columns },
      idx,
      isNew: !row[pk],
      pk: row[pk],
      meta: meta[row[pk]] || {},
      pos: idx > list.length / 2 ? 'start' : 'end',
      render: () => {},

      get data() {
        return getRaw()
      },

      get raw() {
        return getRaw()
      },
    })

    if (typeof row === 'object') {
      row.__defineGetter__('__listMeta', function () {
        return rm.get(row)
      })
    }
  }

  return list
}
export const baseListFormatOrder = (e: any) => {
  if (!Array.isArray(e) && typeof e === 'object' && !!e) {
    return [e]
  }

  return e || []
}

const generateDefaultCols = async (mdb: IBaseListContext['db']) => {
  if (!mdb.definition) {
    return []
  }

  const result =
    Object.keys(mdb.definition.columns).filter((e) => {
      e = e.toLowerCase()

      if (e.startsWith('id') || e.endsWith('id')) {
        return false
      }

      return true
    }) || []

  const promises = [] as Promise<any>[]
  for (let [_, v] of Object.entries(mdb.definition.rels)) {
    if (v.relation === 'Model.BelongsToOneRelation') {
      const rel = db[v.modelClass].definition()
      let col = ''

      promises.push(rel)
      rel.then((rel) => {
        if (rel) {
          if (rel.columns.name) col = 'name'
          if (rel.columns.nama) col = 'nama'
          if (!col && rel.columns.value) col = 'value'

          if (!col) {
            for (let e of Object.keys(rel.columns)) {
              const elower = e.toLowerCase()

              if (elower.startsWith('id') || elower.endsWith('id')) {
                continue
              }

              col = e
              break
            }
          }

          if (col) {
            result.push(`${v.modelClass}.${col}`)
          }
        }
      })
    }
  }
  await Promise.all(promises)

  return result
}

const createListContext = (
  props: IBaseListProps,
  meta: {
    state: IBaseListContext
    rawList: any[]
  },
  render: () => void,
  glb: typeof CRUDGlobal
) => {
  const {
    id,
    parentCtx,
    table,
    list,
    columns,
    editable,
    query,
    filter,
    wrapRow,
    sticky,
    grid,
    action,
    params,
    onLoad,
    scroll,
    onScroll,
    beforeQuery,
    lateQuery,
    wrapList,
    onInit,
    web,
    children,
    mobile,
    title,
    onRowClick,
    platform,
    header,
    checkbox,
  } = props
  const customRenderRow =
    typeof children === 'function'
      ? children
      : typeof columns === 'function'
      ? columns
      : undefined
  let enableFilter = !!filter

  if (filter === undefined) {
    enableFilter = !customRenderRow
  }

  const getState = () => {
    let state = meta.state

    if (state.tree.parent) {
      if (state.tree.parent.tree.children.list) {
        state = state.tree.parent.tree.children.list as IBaseListContext
      }
    }

    return state
  }

  let mfilter: any = filter

  if (get(mobile, 'searchTitle')) {
    if (!mfilter) {
      mfilter = {}
    }

    mfilter.quickSearchTitle = get(mobile, 'searchTitle')
  }

  const result: IBaseListContext = {
    component: {
      id: id || generateStateID(glb),
      type: 'list',
      render,
    },
    filter: {
      ...{
        enable: enableFilter,
        render: () => {},
      },
      ...mfilter,
      web: {
        selector: true,
        mode: 'topbar',
        ...get(filter, 'web', {}),
      },
    } as any,
    header: {
      ...{
        title: title || niceCase(table || ''),
        action: action || {},
      },
      ...(header ? header : {}),
    },
    grid,
    table: {
      mobile: {
        ...{
          mode: 'list',
          swipeout: false,
        },
        ...mobile,
      },
      web: {
        showHeader: !!customRenderRow ? false : true,
        checkbox,
        ...web,
      },
      editable,
      columns,
      lastScroll: scroll,
      onScroll: onScroll,
      onRowClick,
      wrapRow,
      sticky,
      customRenderRow,
      render: () => {},
    } as any,
    db: {
      definition: null,
      sql: query,
      beforeQuery,
      lateQuery,
      queryTimeout: null as unknown as ReturnType<typeof setTimeout>,
      paging: {
        take: 100,
        skip: 0,
        fetching: false,
        allRowFetched: false,
        reset: () => {
          const state = getState()
          const mdb = state.db
          mdb.paging.skip = 0
          mdb.paging.fetching = false
          mdb.paging.allRowFetched = false
          mdb.paging.fetching = false
        },
        loadNext: async () => {
          const state = getState()
          const mdb = state.db

          if (!mdb.paging.allRowFetched) {
            mdb.paging.skip += mdb.paging.take
            mdb.paging.fetching = true
            mdb.query()
          }
        },
      },
      query: async (reason?: string) => {
        const state = getState()
        const mdb = state.db

        if (mdb.definition && (mdb.partialLoading || mdb.loading)) {
          mdb.deferredQuery = true
          return
        }

        if (state.db.beforeQuery) {
          state.db.beforeQuery(state)
        }

        const mtbl = state.table

        if (mtbl.customRenderRow) {
          mtbl.web.showHeader = false
        }

        const finalParams = await prepareFilter(state)

        if (!!mdb.tableName) {
          // preparation
          mdb.loading = true

          if (!mdb.definition) {
            await initializeList(state)
          }

          // render() // load db result, partially

          const include = finalParams.include
          const hasInclude = !!include && Object.keys(include).length > 0
          delete finalParams.include
          finalParams.skip = mdb.paging.skip
          finalParams.take = mdb.paging.take

          let result = await db[mdb.tableName].findMany(finalParams)

          if (mdb.paging.fetching) {
            if (result.length === 0) {
              mdb.paging.allRowFetched = true
            }

            result = [...mdb.list, ...result]
            mdb.paging.fetching = false
          }

          const rowMap = {}

          if (hasInclude && mdb.definition) {
            for (let row of result) {
              rowMap[row[mdb.definition.pk]] = row

              for (let [k, v] of Object.entries(include)) {
                const rel = mdb.definition.rels[k]

                if (!row[k] && rel) {
                  if (rel.relation === 'Model.BelongsToOneRelation') {
                    row[k] = {}

                    const deepFill = (row, v) => {
                      if (typeof v === 'object' && !!v) {
                        for (let sk of Object.keys(v)) {
                          if (sk === 'where' || sk === 'orderBy') continue

                          if (sk === 'include' || sk === 'select') {
                            deepFill(row, v[sk])
                          } else {
                            row[sk] = {}
                            deepFill(row[sk], v[sk])
                          }
                        }
                      }
                    }

                    deepFill(row[k], v)
                  } else if (rel.relation === 'Model.HasManyRelation')
                    row[k] = []
                }
              }
            }

            mdb.partialLoading = true
          }

          mdb.list = result
          mdb.loading = false
          // render()

          if (hasInclude && mdb.definition) {
            const pk = mdb.definition.pk
            const relParams = { ...finalParams }
            relParams.select = {
              [pk]: true,
              ...include,
            }
            relParams.where = {
              [pk]: {
                in: mdb.list.map((e) => e[pk]),
              },
            }
            const relRows = await db[mdb.tableName].findMany(relParams)

            for (const row of relRows) {
              const id = row[mdb.definition.pk]

              for (let [k, v] of Object.entries(row)) {
                rowMap[id][k] = v
              }
            }

            mdb.partialLoading = false
            render()
          }
        } else if (mdb.sql) {
          // preparation
          mdb.loading = true
          render() // load db result

          const sql = mdb.sql({
            sql: (strings: string[], ...tokens: any[]) => {
              let result = [] as string[]
              const rkeys = [...tokens]
              for (let i of strings) {
                result.push(i)

                if (tokens.length > 0) {
                  const obj = rkeys.shift()
                  let res = [] as any
                  if (obj) {
                    if (typeof obj === 'object') {
                      for (let [k, v] of Object.entries(obj) as any) {
                        if (typeof v !== 'object') {
                          if (v.toString) res.push(` ${k} = ${v.toString()}`)
                        } else {
                          for (let [vk, stringVal] of Object.entries(
                            v
                          ) as any) {
                            if (vk === 'mode') continue

                            let value = '' as any
                            let operator =
                              v.mode === 'insensitive' ? 'ILIKE' : 'LIKE'

                            if (vk === 'contains') value = `'%${stringVal}%'`
                            if (vk === 'endsWith') value = `'%${stringVal}'`
                            if (vk === 'startsWith') value = `'${stringVal}%'`

                            if (vk === 'gte') {
                              operator = '>='
                              value = stringVal
                            }

                            if (vk === 'lt') {
                              operator = '<'
                              value = stringVal
                            }

                            if (value instanceof Date) {
                              value = formatISO9075(value).toUpperCase()
                            }

                            res.push(`${k} ${operator} '${value}'`)
                          }
                        }
                      }
                      result.push(res.join(' AND '))
                    } else if (typeof obj === 'string') {
                      result.push(obj)
                    }
                  }
                }
              }
              return result.join('')
            },
            params: finalParams,
          })
          const result = await db.query(
            typeof sql === 'string' ? sql : await sql
          )
          mdb.list = result
          if (!mdb.definition) await initializeList(state)
        } else if (mdb.list !== undefined) {
        }

        if (onLoad) {
          onLoad(mdb.list, state)
        } // done

        mdb.loading = false

        if (mdb.deferredQuery) {
          mdb.deferredQuery = false
          mdb.query()
        }

        render()
      },
      queryCount: async () => {
        const state = getState()
        const mdb = state.db
        let result = 0
        if (mdb.tableName) {
          const finalParams = await prepareFilter(state)
          delete finalParams.include

          // prisma does not currently support distinct when counting
          if (finalParams.distinct) {
            if (mdb.list.length === 0) {
              await mdb.query('count')
            }

            return mdb.list.length
          }

          result = await db[mdb.tableName].count(finalParams)
        } else {
          if (mdb.list.length === 0) {
            await mdb.query('count')
          }

          result = mdb.list.length
        }
        return result
      },
      setSort: (column) => {
        const state = getState()
        const mdb = state.db
        const defaultOrderBy = baseListFormatOrder(
          get(mdb, 'defaultParams.orderBy')
        )
        const orderBy = baseListFormatOrder(get(mdb, 'params.orderBy'))

        if (Array.isArray(state.table.columns)) {
          const found = state.table.columns.find((e) => e[0] === column)
          if (found) {
            if (typeof found[1] === 'object' && found[1].orderBy) {
              column = found[1].orderBy
            }
          }
        }

        if (column.indexOf('.') > 0) {
          // this works if the related field is not aggregation
          const col = column.split('.')

          const ordLenArray = ['0']

          const valueDeep = {}

          for (let i of mdb.params.orderBy || []) {
            if (i[col[0]]) {
              valueDeep[col[0]] = i[col[0]]
            }
          }

          let relDeep = valueDeep
          let idx = 0

          for (let i of col) {
            ordLenArray.push(i)
            if (idx < col.length - 1) {
              relDeep[i] = {}
              relDeep = relDeep[i]
            } else {
              const ordLen = ordLenArray.join('.')
              const ordering = get(orderBy, ordLen)
              relDeep[i] = ordering === 'asc' ? 'desc' : 'asc'
            }
            idx++
          }

          mdb.params.orderBy = [valueDeep, ...defaultOrderBy]
        } else {
          if (!mdb.definition?.columns[column]) return false
          let sort = 'asc'
          const currentSort = Object.keys(orderBy[0] || {}).shift()

          if (currentSort === column) {
            if (get(orderBy, `0.${currentSort}`) === 'desc') {
              mdb.params.orderBy = defaultOrderBy
              return true
            } else {
              sort = 'desc'
            }
          }

          mdb.params.orderBy = [
            {
              [column]: sort,
            },
            ...defaultOrderBy,
          ]
        }

        return true
      },
      tableName: table || '',
      params,
      defaultParams: { ...params },

      get list() {
        return meta.rawList
      },

      set list(value: any[]) {
        const state = getState()
        meta.rawList = populateList(value, meta.rawList, state)
      },

      partialLoading: false,
      loading: true,
    },
    tree: {
      root: null as any,
      parent: null,
      children: {},
    } as any,
  }
  return result
}
