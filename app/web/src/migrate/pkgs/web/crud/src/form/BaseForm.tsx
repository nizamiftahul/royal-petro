import { ProgressIndicator } from '@fluentui/react'
import { default as cloneDeep, default as deepClone } from 'lodash.clonedeep'
import get from 'lodash.get'
import set from 'lodash.set'
import {
  Context,
  createContext,
  isValidElement,
  useContext,
  useEffect,
} from 'react'
import { initializeState } from 'src/migrate/pkgs/web/crud/src/context-state'
import { generateStateID } from 'src/migrate/pkgs/web/crud/src/CRUD'
import { lang } from 'src/migrate/pkgs/web/crud/src/lang/lang'
import { detectType } from 'src/migrate/pkgs/web/crud/src/utils/detect-type'
import { Loading } from 'src/migrate/pkgs/web/crud/src/view/loading'
import {
  ITableColumn,
  ITableDefinitions,
  ITableRelation,
} from 'src/migrate/pkgs/web/ext/types/qlist'
import { ICRUDContext } from 'src/migrate/pkgs/web/ext/types/__crud'
import {
  IBaseFieldContext,
  IBaseFormContext,
  IBaseFormProps,
  IFormAlterField,
  IFormLayout,
} from 'src/migrate/pkgs/web/ext/types/__form'
import { niceCase } from 'src/migrate/pkgs/web/utils/src/niceCase'
import { BaseWindow } from 'types/window'
import 'web-utils'
import { useGlobal, useLocal } from 'web-utils'
import { IBaseListContext } from '../../../ext/types/__list'
import { CRUDGlobal } from '../CRUDGlobal'
import { picomatch } from '../utils/picomatch'
import { BaseField } from './BaseField'
import { extractColFromLayout, RecursiveLayout } from './BaseFormLayout'
import WebField from './web/fields'
import { WFormWrapper } from './web/WFormWrapper'

declare const window: BaseWindow
export const BaseForm = (props: IBaseFormProps) => {
  const {
    id,
    parentCtx,
    table,
    data,
    split,
    alter,
    onLoad,
    header,
    tabs,
    layout,
    params,
  } = props

  const glb = useGlobal(CRUDGlobal)
  const parent = (
    parentCtx ? useContext(parentCtx) : null
  ) as ICRUDContext | null
  const meta = useLocal({
    init: false,
    ctx: createContext({} as IBaseFormContext),
    state: {} as IBaseFormContext,
    initTimeout: 0 as ReturnType<typeof window.setTimeout>,
  })

  useEffect(() => {
    if (meta.init) {
      meta.state.db.data = data
    }
  }, [data])
  useEffect(() => {
    if (meta.init && header) {
      meta.state.config.header = header
      meta.render()
    }
  }, [header])

  useEffect(() => {
    if (parent?.crud.content.hash !== false) {
      if (location.hash === '#new') {
        if (meta.state.db) {
          meta.state.db.data = {}
          meta.render()
        }
      }
    }
  }, [location.hash])

  const crudMode = parent ? parent.crud.mode : ''
  const def = meta.state && meta.state.db && meta.state.db.definition

  let pk = undefined
  if (def && meta.state.db.data && def.pk) {
    pk = meta.state.db.data[def.pk]
  }

  useEffect(() => {
    clearTimeout(meta.initTimeout)
    meta.initTimeout = window.setTimeout(async () => {
      if (parent) {
        if (parent.crud.mode !== 'form') {
          return
        }
      }

      createFormContext(props, meta, meta.render, glb)
      initializeState(meta.state, parent)

      if (meta.state.config.onInit) {
        await meta.state.config.onInit(meta.state)
      }

      initializeForm(meta.state, meta.ctx, meta.render, glb).then(() => {
        meta.init = true
        meta.render()
      })
    }, 100)
  }, [table, alter, crudMode, pk])

  const state = meta.state
  if (!state.config && !meta.init) return <Loading />
  return (
    <meta.ctx.Provider value={state}>
      {state.config.popup?.show && (
        <Loading pointerEvents={true}>
          <>
            {state.config.popup?.loading && (
              <ProgressIndicator
                css={css`
                  width: 100%;
                `}
              />
            )}
            {state.config.popup?.text}
          </>
        </Loading>
      )}
      <WFormWrapper ctx={meta.ctx}>
        <RecursiveLayout
          layout={get(state, 'config.layout')}
          state={state}
          ctx={meta.ctx}
          direction="col"
        />
      </WFormWrapper>
    </meta.ctx.Provider>
  )
}
export const initializeForm = async (
  state: IBaseFormContext,
  ctx: Context<IBaseFormContext>,
  render: () => void,
  glb: typeof CRUDGlobal
) => {
  const mdb = state.db
  const mf = state.config

  if (!state.fieldTypes) {
    if (glb.baseFormFieldTypes) {
      state.fieldTypes = glb.baseFormFieldTypes
    } else {
      state.fieldTypes = WebField
      glb.baseFormFieldTypes = state.fieldTypes
    }
  }

  if (!mdb.definition) {
    if (mdb.tableName) {
      mdb.definition = await db[mdb.tableName].definition()
    } else {
      const columns = {} as ITableDefinitions['columns']
      const layoutCols = await extractColFromLayout({
        layout: mf.layout,
        state,
        ctx,
      })

      for (let i of layoutCols) {
        const type = detectType(mdb.data[i]) || 'string'
        columns[i] = {
          type,
          name: i,
          pk: false,
          nullable: true,
        }
      }

      mdb.definition = {
        columns,
        db: {
          name: '',
        },
        pk: '',
        rels: {},
      }
    }
  }

  if (mdb.definition) {
    if (typeof mdb.data === 'object') {
      if (mdb.data.__crudLoad === 'new') {
        mdb.data = {}
      }

      if (mdb.data.__crudLoad) {
        mdb.loading = true
        render()
        const type = mdb.definition.columns[mdb.definition.pk].type
        const row = await mdb.query((params) => {
          if (!params) {
            params = {}
          }

          if (params && !params.where) {
            params.where = {}
          }

          if (params && params.where && mdb.definition) {
            params.where[mdb.definition.pk] =
              type === 'number'
                ? parseInt(mdb.data.__crudLoad)
                : mdb.data.__crudLoad
          }

          return params
        })

        if (row) {
          delete mdb.data.__crudLoad

          for (let [k, v] of Object.entries(row)) {
            if (k.indexOf('__') < 0) {
              mdb.data[k] = v
            }
          }
        }

        mdb.loading = false
        render()
        if (state.config.header.render) {
          state.config.header.render()
        }
      }

      for (let [k, v] of Object.entries(mdb.definition.rels)) {
        if (!mdb.data[k]) {
          mdb.data[k] = v.relation === 'Model.BelongsToOneRelation' ? {} : []
        }
      }
    } else if (mdb.data === undefined) {
      await mdb.query()
    }

    if (mf.layout.length === 0) {
      await generateDefaultLayout(state)
    }

    await generateFieldsForLayout(state.config.layout, state, ctx)
  }

  if (mf.onLoad) {
    mf.onLoad(mdb.data, state)
  }

  if (state.config.header.render) {
    state.config.header.render()
  }
}
export const deepUpdate = (
  obj: any,
  replacer: any,
  objectCache?: WeakSet<any>
) => {
  if (!objectCache) {
    objectCache = new WeakSet()
  }

  for (const key of Object.keys(replacer)) {
    if (key.startsWith('_')) continue
    const val = replacer[key]
    const dec = Object.getOwnPropertyDescriptor(obj, key)

    if (dec && !dec.writable) {
      continue
    }

    if (typeof val === 'object' && val !== null) {
      if (val instanceof Date) {
        obj[key] = val
      } else {
        if (!obj[key]) {
          obj[key] = val
        } else {
          if (!objectCache.has(val)) {
            objectCache.add(val)
            deepUpdate(obj[key], val, objectCache)
          }
        }
      }
    } else {
      obj[key] = val
    }
  }

  return obj
}
export const weakUpdate = (
  obj: any,
  replacer: any,
  objectCache?: WeakSet<any>
) => {
  if (!objectCache) {
    objectCache = new WeakSet()
  }

  for (const key of Object.keys(replacer)) {
    if (key.startsWith('_')) continue
    const val = replacer[key]
    const dec = Object.getOwnPropertyDescriptor(obj, key)

    if (dec && !dec.writable) {
      continue
    }

    if (typeof val === 'object' && val !== null) {
      if (val instanceof Date) {
        obj[key] = val
      } else {
        if (!obj[key]) {
          obj[key] = val
        } else {
          if (!objectCache.has(val)) {
            objectCache.add(val)
            weakUpdate(obj[key], val, objectCache)
          }
        }
      }
    } else if (typeof val === 'function') {
      if (typeof obj[key] !== 'function') {
        obj[key] = val
      } // skip function
    } else {
      obj[key] = val
    }
  }

  return obj
}

const generateDefaultLayout = async (state: IBaseFormContext) => {
  const result: string[] = []

  if (state.db.definition) {
    for (let [k, _] of Object.entries(state.db.definition.columns)) {
      if (k.indexOf('_id') >= 0 || k.indexOf('id_') >= 0 || k === 'id') {
        continue
      }

      result.push(k)
    }

    for (let [_, v] of Object.entries(state.db.definition.rels)) {
      if (v.relation === 'Model.BelongsToOneRelation') {
        result.push(v.join.from)
      }
    }

    const layout = Array.isArray(state.config.layout)
      ? state.config.layout
      : [state.config.layout]
    layout.splice(0, layout.length)
    let cur: string[] = []

    for (let i of result) {
      if (cur.length < 2) {
        cur.push(i)
      } else {
        layout.push(cur)
        cur = []
      }
    }
    state.config.layout = layout
  }
}

export const generateFieldsForLayout = async (
  _layout: IFormLayout,
  state: IBaseFormContext,
  ctx: Context<IBaseFormContext>
) => {
  const fields = state.config.fields
  const layout = Array.isArray(_layout) ? _layout : [_layout]
  if (state.db.definition) {
    for (let s of layout) {
      if (typeof s === 'string') {
        let required = false
        let type = 'string'
        let colName = s

        if (!s.startsWith('::') && s.indexOf(':') > 0) {
          colName = s.split(':').shift() || ''
        }

        const col = state.db.definition.columns[colName]

        if (col) {
          type = col.type
          required = !col.nullable
        } else {
          const rel = state.db.definition.rels[colName]

          if (rel) {
            const type =
              rel.relation === 'Model.BelongsToOneRelation'
                ? 'belongs-to'
                : 'has-many'

            if (type === 'belongs-to') {
              const from = rel.join.from.split('.').pop()
              const colFrom = state.db.definition.columns[from || '']

              if (colFrom) {
                required = !colFrom.nullable
              }
            }
          }
        }

        let colTitle = niceCase(colName)

        if (colName.indexOf('.') > 0 || state.db.definition.rels[colName]) {
          const frel = colName.split('.')
          colTitle = niceCase(frel[frel.length - 1])
          let lastRel = null as unknown as ITableRelation
          let lastDef = state.db.definition
          let relCol = null as unknown as ITableColumn

          for (let relName of frel) {
            if (lastDef) {
              const result = await getRelation(relName, lastDef)

              if (result) {
                lastRel = result.rel
                lastDef = result.def
              } else if (lastDef && lastDef.columns[relName]) {
                relCol = lastDef.columns[relName]
                break
              }
            }
          }

          if (relCol) {
            type = relCol.type
          } else {
            if (lastRel) {
              if (lastRel.relation === 'Model.HasManyRelation') {
                type = 'has-many'

                const pk = state.db.definition.pk

                if (!!state.db.data[pk]) {
                  if (state.config.tab.list.indexOf(colName) < 0) {
                    state.config.tab.list.push(colName)
                  }
                }
              } else if (lastRel.relation === 'Model.BelongsToOneRelation') {
                type = 'belongs-to'
              }
            }
          }
        }

        let undoValue = undefined

        if (colName.indexOf('.') > 0) {
          const undoName = colName.split('.').shift() || ''
          undoValue = cloneDeep(get(state.db.data, undoName))
        } else {
          undoValue = cloneDeep(get(state.db.data, colName))
        }

        const fieldState: IBaseFieldContext = {
          title: colTitle,
          name: colName,
          ctx,
          error: '',
          required,
          type,
          undoValue,

          get value() {
            if (typeof colName === 'string') {
              return get(state.db.data, colName)
            }

            return undefined
          },

          set value(newval) {
            if (typeof colName === 'string') {
              set(state.db.data, colName, newval)
            }
          },

          render: () => {},
        } as any

        const applyAlter = (name: string, alter: IFormAlterField) => {
          if (typeof alter === 'object') {
            deepUpdate(fieldState, alter)
          } else if (
            typeof alter === 'function' &&
            typeof colName === 'string'
          ) {
            const props = {
              name,
              ctx,
            }
            const alterResult = alter({
              name: colName,
              row: state.db.data,
              state,
              Component: BaseField,
              props,
            })

            if (typeof alterResult === 'object') {
              if (!isValidElement(alterResult)) {
                for (let i of Object.keys(props)) {
                  if (i !== 'name' && i !== 'ctx') {
                    alterResult[i] = props[i]
                  }
                }

                deepUpdate(fieldState, alterResult)
              } else {
                const newProps = {}

                for (let i of Object.keys(props)) {
                  if (i !== 'name' && i !== 'ctx') {
                    newProps[i] = props[i]
                  }
                }

                deepUpdate(fieldState, newProps)
                fieldState.customRender = alter as any
              }
            }
          }
        }

        if (state.config.alter) {
          if (state.config.alter['*']) {
            applyAlter('*', state.config.alter['*'])
          }

          for (let [k, v] of Object.entries(state.config.alter)) {
            if (k === '*') continue
            if (picomatch.isMatch(colName, k)) {
              applyAlter(k, v)
            }
          }
        }

        if (fieldState.type === 'info') {
          fieldState.readonly = true
        }

        fields[colName] = {
          state: fieldState,
        }
      } else if (Array.isArray(s)) {
        generateFieldsForLayout(s, state, ctx)
      } else if (typeof s === 'function') {
        s({
          row: generateDummyData(state, state.db.tableName || ''),
          update: () => {},
          state,
          watch: () => {},
          layout: (l) => {
            generateFieldsForLayout(l, state, ctx)
            return <></>
          },
        })
      }
    }
  }
}

const generateDummyData = (state: IBaseFormContext, tableName: string) => {
  const def = state.db.definition
  const result = state.db.data
    ? state.db.data
    : new Proxy(
        {},
        {
          get(target, name) {
            const key = name.toString()

            if (def) {
              if (def.columns[key]) {
                return undefined
              } else if (def.rels[key]) {
                const rel = def.rels[key]

                if (rel.relation === 'Model.BelongsToOneRelation') {
                  return generateDummyData(state, rel.modelClass)
                }
              }
            }

            return []
          },
        }
      )
  return result
}

const getRelation = async (col: string, def: ITableDefinitions) => {
  if (def && def.rels[col]) {
    const rel = def.rels[col]
    return {
      def: (await db[rel.modelClass].definition()) as ITableDefinitions,
      rel,
    }
  }
}

export const defaultActions: any = {
  delete: true,
  save: true,
}
export const createFormContext = (
  props: IBaseFormProps,
  meta: {
    state: IBaseFormContext
  },
  render: () => void,
  glb: typeof CRUDGlobal
) => {
  const {
    id,
    parentCtx,
    table,
    data,
    split,
    alter,
    onSave,
    onLoad,
    onInit,
    header,
    tabs,
    layout,
  } = props
  let params: any = parseParams(props)
  let action: any = table
    ? {
        delete: true,
        save: true,
      }
    : {}

  if (props.action) {
    if (typeof props.action === 'function') {
      action = props.action
    } else if (typeof props.action === 'object') {
      action = { ...action, ...(props.action as any) }
    }
  }

  const headerAction = get(props, 'header.action')

  if (headerAction) {
    if (typeof headerAction === 'function') {
      action = headerAction
    } else if (typeof props.action === 'object') {
      action = { ...action, ...(headerAction as any) }
    }
  }

  const finalHeader = weakUpdate(
    {
      enable: get(header, 'enable', !!table),
      title: get(header, 'title') || niceCase('table') || '',
      back: (props as any).onBack || get(header, 'back'),
    },
    header || {}
  )
  finalHeader.action = action

  const state = meta.state
  const result: IBaseFormContext = {
    fieldTypes: meta.state.fieldTypes,
    config: {
      header: finalHeader,
      watches: {},
      split: {
        position: get(split, 'position', 'top') as any,
        size: get(split, 'size', '50%'),
      },
      tab: {
        position: get(split, 'tab', 'left'),
        list: [],
        modifier: tabs,
      },
      alter: alter || {},
      layout: layout || [],
      validate: async () => {},
      onSave,
      onLoad,
      onInit,
      importCustom: props.import,
      fieldOrder: [],
      fields: {},
    },
    component: {
      id: id || generateStateID(glb),
      type: 'form' as any,
      render,
    },
    tree: {
      root: null as any,
      parent: null,
      children: {},
      getPath: () => {
        return ''
      },
    },
    db: {
      tableName: table,
      data: data,
      definition: null,
      loading: false,
      params,

      get errors() {
        if (state.db.saveErrorMsg) {
          return [state.db.saveErrorMsg]
        }

        let msg: any[] = []
        const errors = state.db.previousErrors || {}

        for (let [k, v] of Object.entries(errors)) {
          for (let e of v) {
            msg.push(e)
          }
        }

        return msg
      },

      query: async (params?: any) => {
        let finalParams = {}
        const parent = state.tree.parent as ICRUDContext

        if (parent && parent.crud) {
          const crudListParams = get(parent, 'crud.content.list.params')

          if (crudListParams) {
            finalParams = JSON.parse(JSON.stringify(crudListParams))
          }
        }

        if (params) {
          if (typeof params === 'function') {
            finalParams = params(finalParams, state)
          } else {
            finalParams = params
          }
        } else if (state.db.params) {
          finalParams = state.db.params
        }

        if (Object.keys(finalParams).length > 0 && state.db.tableName) {
          const res = await db[state.db.tableName].findFirst(finalParams)
          if (!state.db.data) {
            state.db.data = {} as any
          }

          if (res) {
            for (let [k, v] of Object.entries(res)) {
              state.db.data[k] = v
            }
          }

          return res
        }

        return {}
      },
      delete: async () => {
        if (state.db.definition) {
          if (confirm(lang('Apakah Anda Yakin ?', 'id'))) {
            state.db.loading = true
            render()
            await db[state.db.tableName || ''].delete({
              where: {
                [state.db.definition.pk]: state.db.data[state.db.definition.pk],
              },
            })
            state.db.loading = false
            if (state.tree.parent && (state.tree.parent as any).crud) {
              const parent = state.tree.parent as ICRUDContext

              const list = parent.tree.children.list as IBaseListContext
              if (list) {
                list.db.query('back after save')
              }
              await parent.crud.setMode('list')
            }
          }
        }
      },
      validate: async () => {
        const errors = {}

        for (let [name, field] of Object.entries(state.config.fields)) {
          if (field.state.required) {
            const required = await resolveValueAsync({
              definer: field.state.required,
              args: [
                {
                  state: state,
                  row: state.db.data,
                  col: name,
                },
              ],
              default: false,
            })
            const value = get(state.db.data, name)

            if (
              (required &&
                (value === undefined ||
                  value === null ||
                  value === '' ||
                  (typeof value !== 'boolean' && !value))) ||
              (typeof value === 'object' &&
                Object.keys(value).length === 0 &&
                Object.prototype.toString.call(value) !== '[object Date]')
            ) {
              if (!errors[name]) {
                errors[name] = []
              }

              errors[name].push(
                lang(
                  '[field] cannot be blank',
                  {
                    field:
                      typeof field.state.title === 'string'
                        ? field.state.title
                        : niceCase(name),
                  },
                  'en'
                )
              )
            }
          }

          if (field.state.error && !errors[name]) {
            errors[name] = [field.state.error]
          }
        }

        state.db.previousErrors = errors
        return errors
      },
      save: async () => {
        const pk = state.db.definition?.pk || ''

        const exposedSave: IBaseFormContext['db']['save'] = async (options) => {
          state.db.saveErrorMsg = ''
          state.db.saveStatus = 'saving'

          if (state.config.header && state.config.header.render) {
            state.config.header.render()
          }

          render()
          const errors = await state.db.validate()

          if (Object.keys(errors).length > 0) {
            state.db.saveStatus = 'validation-error'

            for (let [k, v] of Object.entries(errors)) {
              if (state.config.fields[k]) {
                state.config.fields[k].state.error = v[0]
              }
            }

            render()
            return false
          }

          let data = get(options, 'data')

          if (!data) {
            data = deepClone(state.db.data)
          } else {
            data = deepClone(data)
          }

          if (state.db.definition) {
            for (let [k, value] of Object.entries(data)) {
              if (
                !state.db.definition.rels[k] &&
                !state.db.definition.columns[k]
              ) {
                delete data[k]
              }

              if (value === null) {
                if (
                  state.config.fields[k] &&
                  state.config.fields[k].state &&
                  !state.config.fields[k].state.isChanged
                ) {
                  delete data[k]
                }

                // prevent bug that: saving null value to nullable json object
                const def = state.db.definition.columns[k]
                if (def) {
                  if (def.type === 'object') {
                    data[k] = 'DbNull'
                  }
                }
              }
            }

            const parent = get(
              state,
              'tree.parent.tree.parent'
            ) as IBaseFormContext

            for (let [relName, v] of Object.entries(state.db.definition.rels)) {
              if (v.relation === 'Model.BelongsToOneRelation') {
                const tto = v.join.to.split('.').shift() || ''
                const from = v.join.from.split('.').pop() || ''
                const to = v.join.to.split('.').pop() || ''

                if (parent && parent.db.tableName === tto) {
                  const def = parent.db.definition
                  if (def) {
                    let ppk = parent.db.data[def.pk]

                    if (typeof ppk !== 'object') {
                      data[relName] = {
                        connect: {
                          [def.pk]: ppk,
                        },
                      }

                      delete data[from]
                    } else {
                      console.log(ppk, 'ppk')
                    }
                    continue
                  }
                }

                if (data[from]) {
                  if (
                    !data[relName] ||
                    Object.keys(data[relName]).length === 0
                  ) {
                    data[relName] = { connect: { [to]: data[from] } }
                  }
                }
                delete data[from]

                const m = data[relName]

                if (m) {
                  if (
                    m.disconnect ||
                    m.create ||
                    m.connect ||
                    m.connectOrCreate
                  ) {
                    if (m.disconnect && !data[from]) {
                      delete data[relName]
                    }

                    if (m.connect) {
                      if (!m.connect[to]) {
                        delete data[relName]
                      } else {
                        if (typeof m.connect[to] === 'object') {
                          delete data[relName]
                        }
                      }
                    }

                    if (m.connectOrCreate && !m.connectOrCreate[to]) {
                      delete data[relName]
                    }
                  } else {
                    const rel = (await db[
                      v.modelClass
                    ].definition()) as ITableDefinitions

                    if (data[relName] && data[relName][rel.pk]) {
                      data[relName] = {
                        connect: {
                          [to]: data[relName][rel.pk],
                        },
                      }
                    }
                  }
                }
              } else {
                delete data[relName]
              }
            }
          }

          const pkVal = data[pk]
          delete data[pk]
          let savedData = null as any

          if (state.db.definition) {
            try {
              if (!state.db.data[state.db.definition.pk]) {
                savedData = await db[state.db.tableName || ''].create({
                  data: data,
                })
              } else {
                savedData = await db[state.db.tableName || ''].update({
                  data,
                  where: {
                    [pk]: pkVal,
                  },
                })
              }
            } catch (e: any) {
              savedData = {
                status: 'failed',
                reason: e.message,
              }
              console.error(e)
            }
          }

          if (savedData && savedData.status === 'failed') {
            state.db.saveStatus = 'save-error'
            state.db.saveErrorMsg = savedData.reason
            render()
            return false
          } else {
            alert('Form Saved!')
            state.db.data[pk] = savedData[pk]
            state.db.saveStatus = 'success'
            render()
            const im = state.config.import
            if (im) {
              im.execute()
              return true
            }

            if (location.hash === '#new' && savedData[pk]) {
              const parent = state.tree.parent as ICRUDContext
              if (
                parent.crud.content.hash !== false &&
                get(options, 'back', true) === false
              ) {
                location.hash = savedData[pk]

                if (state.tree.parent && (state.tree.parent as any).crud) {
                  const list = parent.tree.children.list as IBaseListContext
                  if (list) {
                    list.db.query('without back after save')
                  }
                }
                return true
              }
            }

            if (state.tree.parent && (state.tree.parent as any).crud) {
              const parent = state.tree.parent as ICRUDContext

              const list = parent.tree.children.list as IBaseListContext
              if (list) {
                list.db.query('back after save')
              }
              if (get(options, 'back', true) !== false) {
                await parent.crud.setMode('list')
              }
            }

            return true
          }
        }

        if (state.config.onSave) {
          const res: any = await state.config.onSave({
            state,
            data: state.db.data,
            save: exposedSave,
            saving: (saving?: boolean) => {
              state.db.saveStatus =
                saving === undefined || !!saving ? 'saving' : 'ready'
              state.component.render()
            },
          })
          return !!res
        } else {
          return await exposedSave()
        }
      },
      saveStatus: 'ready',
    },
  }
  deepUpdate(meta.state, result)
}

const parseParams = (props: any) => {
  let params: any = {}

  if (props.params) {
    params = props.params
  }

  if ((props as any).where) {
    params.where = props.where
  }

  if ((props as any).include) {
    params.include = props.include
  }

  return params
}

export default BaseForm
export const resolveValueAsync = async (opt: {
  definer: any | (() => Promise<any> | any)
  args: any[]
  default?: any
}) => {
  const definer = opt.definer

  if (typeof definer === 'function') {
    const res = definer(...opt.args)

    if (res instanceof Promise) {
      return await res
    } else {
      return res
    }
  }

  return definer || opt.default
}
