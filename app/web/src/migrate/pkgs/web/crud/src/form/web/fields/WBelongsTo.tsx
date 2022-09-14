import 'web-utils'
import find from 'lodash.find'
import get from 'lodash.get'
import set from 'lodash.set'
import { useContext, useEffect, useRef } from 'react'
import { fastDeepEqual } from 'src/migrate/pkgs/web/utils/src/fastDeepEqual'
import { useRender } from 'src/migrate/pkgs/web/utils/src/useRender'
import { IBaseFieldProps } from 'src/migrate/pkgs/web/ext/types/__form'
import PureSelect from './PureSelect'
import { ICRUDContext } from 'src/migrate/pkgs/web/ext/types/__crud'
export const WBelongsTo = (props: IBaseFieldProps) => {
  const render = useRender()

  const _ = useRef({
    silentLoading: false,
    loading: false,
    rawItems: [] as any,
    items: [] as any,
    params: null as any,
    value: 0 as any,
    labelLoaded: false,

    async queryLabel() {
      if (!meta.labelLoaded) {
        meta.value = get(form.db.data, from)
        const found = find(meta.items, {
          value: meta.value,
        })

        if (!found && !meta.loading && !!meta.value && rel) {
          const cache = get(
            form,
            `__belongsToLabelCache.${relName}.${to}.${meta.value}`
          )

          if (cache) {
            meta.items = [
              ...meta.items,
              {
                value: meta.value,
                label: cache,
              },
            ]
            return
          }

          if (!meta.loading) {
            meta.loading = true
            render()
            const alter = form.config.alter[props.name] as any
            const res = (
              await db[rel.modelClass].findMany({
                where: {
                  [to]: meta.value,
                },
              })
            ).map((e) => {
              return labelText({
                e,
                alter,
                to,
              })
            })

            meta.items = [...meta.items, res[0]]
            set(
              form,
              `__belongsToLabelCache.${relName}.${to}.${meta.value}`,
              res[0].label
            )
            meta.loading = false
            render()
            setTimeout(() => {
              meta.labelLoaded = true
            }, 500)
          }
        }
      }
    },

    getParams() {
      let params = {} as any
      const alter = form.config.alter[props.name] as any

      if (alter) {
        if (typeof alter.params === 'function') {
          params = alter.params(form.db.data)
        } else if (typeof alter.params === 'object') {
          params = { ...alter.params }
        }
      }

      let finalParams = {} as any
      const parent = form.tree.parent as ICRUDContext

      if (parent && parent.crud) {
        const crudListParams = get(parent, 'crud.content.list.params')

        if (crudListParams) {
          finalParams = JSON.parse(JSON.stringify(crudListParams))
        }
      }
      if (finalParams) {
        if (finalParams.include && finalParams.include[props.name]) {
          const inc = finalParams.include[props.name]
          if (typeof inc === 'object') {
            params = { ...inc, ...params }
          }
        }
      }

      return params
    },

    async query() {
      if (rel) {
        meta.value = form.db.data[from]
        const alter = form.config.alter[props.name] as any
        meta.loading = true
        render()
        meta.rawItems = await db[rel.modelClass].findMany(this.params)
        meta.items = meta.rawItems.map((e) => {
          const res = labelText({
            e,
            alter,
            to,
          })

          if (e[to] === meta.value) {
            set(
              form,
              `__belongsToLabelCache.${relName}.${to}.${meta.value}`,
              res.label
            )
          }

          return res
        })
        meta.loading = false
        render()
      }
    },
  })

  const meta = _.current
  const form = useContext(props.ctx)
  // console.log({ form })
  const relName =
    (props.name.indexOf('.') > 0
      ? props.name.split('.').shift()
      : props.name) || props.name
  const rel = form.db.definition?.rels[relName]
  const to = rel?.join.to.split('.').pop() || ''
  const from = rel?.join.from.split('.').pop() || ''
  const state = (form.config.fields[props.name] || {}).state
  useEffect(() => {
    setTimeout(async () => {
      meta.silentLoading = true
      const params = meta.getParams()

      if (!fastDeepEqual(params, JSON.stringify(meta.params))) {
        meta.params = params
        await meta.query()
      }

      await meta.queryLabel()
      state.items = meta.items
    })
  }, [state.value])

  if (
    form.db.data[from] &&
    (!form.db.data[relName] ||
      (form.db.data[relName] && !form.db.data[relName][to]))
  ) {
    meta.value = form.db.data[from]

    form.db.data[relName] = {
      [to]: form.db.data[from],
    }
  }

  if (
    form.db.data[relName] &&
    form.db.data[relName][to] !== form.db.data[from]
  ) {
    form.db.data[from] = form.db.data[relName][to]
  }

  if (!form.db.data[relName]) {
    form.db.data[from] = form.db.data[relName]
  }

  if (form.db.data[from] !== meta.value) {
    meta.value = form.db.data[from]
  }

  return (
    <>
      <PureSelect
        onChange={(value) => {
          if (!state.value) {
            state.value = {}
          }

          if (typeof state.onChange === 'function')
            state.onChange(value, {
              state: form,
              row: form.db.data,
              col: props.name,
            })

          if (typeof form.db.data[relName] === 'object') {
            for (let row of meta.rawItems) {
              let val =
                typeof row[to] === 'number' && typeof value === 'string'
                  ? parseInt(value)
                  : value
              if (row[to] === val) {
                form.db.data[relName] = row
              }
            }
          }

          form.db.data[from] = value
          meta.value = value
          props.internalChange(value)
        }}
        loading={!meta.silentLoading && !!(meta.loading || !state)}
        onDropDown={() => {
          meta.silentLoading = false
          const params = meta.getParams()

          if (JSON.stringify(params) !== JSON.stringify(meta.params)) {
            meta.params = params
            meta.query()
          }
        }}
        value={meta.value}
        items={meta.items}
      />
    </>
  )
}
export const labelText = ({ e, alter, to }) => {
  let label = e.name || e.nama || e.value || e.text || ''

  if (!label) {
    for (let [k, v] of Object.entries(e)) {
      if (k.indexOf('_id') < 0 && k.indexOf('id_') < 0 && k !== 'id') {
        if (typeof v === 'string') {
          label = v
        }

        break
      }
    }
  }

  if (alter && alter.label) {
    label = alter.label(e)
  }

  return {
    value: e[to],
    label,
  }
}
