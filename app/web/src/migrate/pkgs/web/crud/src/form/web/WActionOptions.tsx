import { Icon, Spinner, SpinnerSize } from '@fluentui/react'
import { FC } from 'react'
import { IBaseFormContext } from 'src/migrate/pkgs/web/ext/types/__form'
import { IBaseListContext } from 'src/migrate/pkgs/web/ext/types/__list'
import { useLocal } from 'web-utils'
import { exportExcelFromList } from './options/export-excel'
import { showImportExcelPopup } from './options/import-excel'

export const WActionOptions: FC<{
  state: IBaseFormContext | IBaseListContext
  meta: any
  render: () => void
  actions: string[]
}> = ({ state, meta, render, actions }) => {
  const sl = state as IBaseListContext
  const local = useLocal({ count: -1 }, async () => {
    if (actions.indexOf('export') >= 0) {
      local.count = await sl.db.queryCount()
      local.render()
    }
  })

  return (
    <div
      className="flex flex-col select-none"
      css={css`
        min-width: 150px;
      `}
    >
      {actions.indexOf('export') >= 0 && (
        <div className="bg-white bg-opacity-90 rounded-sm m-1 mb-0 px-2 py-1 flex justify-between">
          <div className="flex-1 border-0 flex text-xs border-r border-gray-400">
            {local.count < 0 ? (
              <Spinner size={SpinnerSize.xSmall} />
            ) : (
              <>
                {local.count} row{local.count > 1 ? 's' : ''}
              </>
            )}
          </div>
          <div className="flex-1 text-xs  whitespace-nowrap justify-end flex">
            {sl.table.columns.length} col
            {sl.table.columns.length > 1 ? 's' : ''}
          </div>
        </div>
      )}
      {actions
        .map((e) => {
          return {
            copy: {
              label: 'Copy Data',
              icon: 'Copy',
              onClick: async () => {
                let s = state as IBaseFormContext
                s.config.popup = {
                  show: true,
                  loading: false,
                  text: (
                    <>
                      <Icon
                        iconName="Copy"
                        css={css`
                          font-size: 20px;
                          margin-bottom: 10px;
                        `}
                      />
                      <div> Data Copied</div>
                    </>
                  ),
                }
                s.component.render()

                navigator.clipboard.writeText(JSON.stringify(s.db.data))

                setTimeout(() => {
                  if (s.config.popup) s.config.popup.show = false
                  s.component.render()
                }, 1000)
              },
            },
            paste: {
              label: 'Paste Data',
              icon: 'Paste',
              onClick: async () => {
                let s = state as IBaseFormContext
                s.config.popup = {
                  show: true,
                  loading: false,
                  text: (
                    <>
                      <Icon
                        iconName="Copy"
                        css={css`
                          font-size: 20px;
                          margin-bottom: 10px;
                        `}
                      />
                      <div> Pasting Data</div>
                    </>
                  ),
                }

                try {
                  const data = JSON.parse(await navigator.clipboard.readText())

                  for (let i of s.config.fieldOrder) {
                    const state = s.config.fields[i].state
                    if (state.type !== 'has-many') {
                      state.value = data[state.name]
                      s.db.data[state.name] = state.value
                      if (state.onChange) {
                        state.onChange(state.value, {
                          state: s,
                          row: s.db.data,
                          col: state.name,
                        })
                      }
                      state.render()
                    }
                  }
                } catch (e) {
                  if (s.config.popup) s.config.popup.text = 'Failed to Paste'
                }
                s.component.render()

                setTimeout(() => {
                  if (s.config.popup) s.config.popup.show = false
                  s.component.render()
                }, 1000)
              },
            },
            import: {
              label: 'Import Excel',
              icon: 'ExcelDocument',
              onClick: async () => {
                let s = state as IBaseFormContext
                showImportExcelPopup(s)
              },
            },
            'mass-delete': {
              label: 'Mass Delete',
              icon: 'Trash',
              onClick: async () => {
                let s = state as IBaseListContext
                s.table.web.checkbox = true
                s.table.web.massDelete = true
                s.component.render()
              },
            },
            export: {
              label: 'Export Excel',
              icon: 'ExcelDocument',
              onClick: async () => {
                let s = state as IBaseListContext
                await exportExcelFromList(state as any, {
                  start: () => {
                    if (!s.table.web.popup) {
                      s.table.web.popup = {
                        loading: true,
                        text: `Exporting Excel 0%`,
                      }
                    } else {
                      s.table.web.popup.loading = true
                      s.table.web.popup.text = `Exporting Excel 0%`
                    }
                    s.component.render()
                  },
                  progress: (percent) => {
                    if (s.table.web.popup)
                      s.table.web.popup.text = `Exporting Excel ${percent}%`
                    s.component.render()
                  },
                  finish: () => {
                    if (s.table.web.popup) s.table.web.popup.loading = false
                    s.component.render()
                  },
                })
              },
            },
          }[e]
        })
        .map((e, idx) => {
          if (!e) return null
          return (
            <div
              css={css`
                ${idx > 0 &&
                css`
                  border-top: 1px solid rgba(255, 255, 255, 0.2);
                `}
              `}
              key={e.label}
              onClick={() => {
                e.onClick()
                meta.options.popup = false
                render()
              }}
              className="p-2 cursor-pointer text-white flex space-x-1 items-center hover:bg-white hover:bg-opacity-30"
            >
              <Icon iconName={e.icon} className="mr-1" />
              <span>{e.label}</span>
            </div>
          )
        })}
    </div>
  )
}
