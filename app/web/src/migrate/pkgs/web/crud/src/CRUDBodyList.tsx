import get from 'lodash.get'
import { Context, useContext } from 'react'
import { IAdminSingle } from 'src/migrate/pkgs/web/ext/types/admin'
import { ICRUDContext } from 'src/migrate/pkgs/web/ext/types/__crud'
import { BaseWindow } from 'types/window'
import { useGlobal, waitUntil } from 'web-utils'
import { CRUDGlobal } from './CRUDGlobal'
import { weakUpdate } from './form/BaseForm'
import { BaseList } from './list/BaseList'
import { generateDrill } from './utils/drill'
declare const window: BaseWindow
export const CRUDBodyList = ({
  content,
  ctx,
}: {
  content: IAdminSingle
  ctx: Context<ICRUDContext>
}) => {
  const glb = useGlobal(CRUDGlobal)
  const action = weakUpdate(
    {
      create: true,
      other: {
        import: true,
        export: true,
      },
    },
    get(content, 'list.action', {})
  )

  if (get(content, 'list.table.create') !== undefined) {
    action.create = get(content, 'list.table.create')
  }

  const state = useContext(ctx)
  let mobile = {
    ...{
      mode: 'list' as any,
      swipeout: true,
    },
    ...(get(content, 'list.table') || {}),
  }
  const onRowClick = get(content, 'list.table.onRowClick')

  return (
    <BaseList
      id={`list`}
      table={content.table}
      mobile={mobile}
      parentCtx={ctx as any}
      query={get(content, 'list.query')}
      header={get(content, 'list.header')}
      title={get(content, 'list.title')}
      params={get(content, 'list.params', {})}
      onScroll={(e) => {
        state.crud.listScroll = {
          x: e.scrollLeft,
          y: e.scrollTop,
        }
      }}
      scroll={state.crud.listScroll}
      onLoad={get(content, 'list.onLoad') || get(content, 'list.table.onLoad')}
      onInit={get(content, 'list.onInit')}
      filter={get(content, 'list.filter')}
      lateQuery={get(content, 'list.lateQuery')}
      columns={get(content, 'list.table.columns')}
      editable={get(content, 'list.editable')}
      checkbox={get(content, 'list.checkbox')}
      wrapList={get(content, 'list.wrapper')}
      sticky={get(content, 'list.table.sticky')}
      wrapRow={get(content, 'list.table.wrapRow')}
      action={action}
      onRowClick={
        onRowClick === false
          ? false
          : async (row, idx, ev, state, isNotShouldDrill?: boolean) => {
              if (state.table.web.checkbox) {
                return true
              }

              const parent = state.tree.parent as ICRUDContext
              const { drill, drillTabs, drillTo } = generateDrill(glb, parent)

              if (state.db.partialLoading) {
                state.db.loading = true
                state.table.render()
                waitUntil(() => !state.db.partialLoading)
                return
              }

              if (onRowClick) {
                if (!(await onRowClick(row, idx, ev, state))) {
                  state.table.isRowClickable = false
                  state.component.render()
                  return
                }
              }

              // const isDrillRoot = drill ? drill.detail?.isRoot : false
              // let shouldDrill = !shouldRenderDrill && !isDrillRoot

              if (!drill || isNotShouldDrill) {
                ;(window as any).preventPopRender = true
                const onEdit = get(content, 'form.edit.onClick')

                if (onEdit) {
                  await onEdit(row)
                }

                if (state.db.definition && !parent.crud.isChildren) {
                  location.hash = row[state.db.definition.pk]
                }

                parent.crud.setMode('form', row)
              } else {
                parent.crud.formData = row

                let lastTabIdx = 0

                if (drill.detail && drill.detail.url) {
                  lastTabIdx = drillTabs[drill.detail.url] || 0
                }

                const child = drill.detail?.child[lastTabIdx]

                if (child) {
                  let url = child.url
                  if (url) {
                    const urlparts = url.split('/')
                    const prms = { ...child.defaultParams, ...row }
                    for (let [idx, part] of Object.entries(urlparts) as any) {
                      for (let [k, v] of Object.entries(prms) as any) {
                        if (part === `:${k}`) {
                          urlparts[idx] = v
                        }
                      }
                    }
                    navigate(`${urlparts.join('/')}`)
                  } else {
                    drillTo(child, row)
                  }
                }
              }
            }
      }
    />
  )
}
