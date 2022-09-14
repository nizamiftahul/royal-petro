import { Icon } from '@fluentui/react'
import parse from 'date-fns/parse'
import { ICRUDContext } from 'src/migrate/pkgs/web/ext/types/__crud'
import {
  IBaseFormContext,
  IFormField,
} from 'src/migrate/pkgs/web/ext/types/__form'
import { IBaseListContext } from 'src/migrate/pkgs/web/ext/types/__list'
import { waitUntil } from 'src/migrate/pkgs/web/utils/src/waitUntil'
import { ExportExcel } from './export-excel'

export const showImportExcelPopup = (s: IBaseFormContext) => {
  const custom = s.config.importCustom
  s.config.popup = {
    show: true,
    loading: false,
    text: (
      <div
        className="border flex flex-col border-blue-400 rounded-md p-2 shadow-md select-none"
        css={css`
          margin: -20px;
          width: 350px;
          height: 200px;
        `}
      >
        <div className="flex justify-between">
          <div className="flex flex-row items-center space-x-2">
            <Icon iconName="ExcelDocument" />
            <div> Import Excel</div>
          </div>
          <Icon
            iconName="ChromeClose"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (s.config.popup) s.config.popup.show = false
              s.component.render()
            }}
            className="cursor-pointer m-1"
          />
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-2">
          <div
            className="border-2 border-blue-400  bg-blue-50  p-2  rounded-md cursor-pointer items-center flex flex-row  space-x-2"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              generateExcelTemplate(s)
            }}
          >
            <span>1.</span>
            <Icon iconName="ExcelLogo" />
            <span>
              Download <span className="underline">Template Excel Import</span>
            </span>
          </div>

          <div className="flex flex-col border-2 border-blue-400  bg-blue-50  p-2 rounded-md space-y-1 relative ">
            <div>2. Upload Edited Excel Template</div>
            <div className="flex flex-row items-center">
              <input
                type="file"
                onChange={async (e) => {
                  let xlsx = await import('xlsx')
                  const files = e.target.files
                  if (files) {
                    const reader = new FileReader()
                    reader.onload = (e) => {
                      const data = e.target?.result
                      const wb = xlsx.read(data, { type: 'binary' })
                      const list = xlsx.utils.sheet_to_json(
                        wb.Sheets[wb.SheetNames[0]]
                      )

                      if (s.config.importCustom) {
                        const importRow = s.config.importCustom.importRow

                        console.log(list)

                        return
                      }

                      const fieldMap = {} as Record<string, IFormField['state']>
                      s.config.import = {
                        current: null as any,
                        list: list as any,
                        execute: async () => {
                          const im = s.config.import
                          if (im) {
                            const cur = im.list.shift()
                            s.component.render()
                            if (cur) {
                              im.current = cur

                              for (let i of Object.keys(s.db.data)) {
                                delete s.db.data[i]
                              }
                              const rels = s.db.definition?.rels

                              const getField = (name: string) => {
                                for (let v of Object.values(s.config.fields)) {
                                  const field = v.state
                                  let name = ''
                                  if (typeof field.title === 'string') {
                                    name = field.title
                                  } else {
                                    name = field.name
                                  }
                                  name = name.replace(/\W/g, ' ')
                                  fieldMap[name] = field
                                }
                                return fieldMap[name]
                              }

                              let unfilledBecauseNotFound = [] as string[]
                              const fill = () => {
                                for (let [k, value] of Object.entries(cur)) {
                                  const field = getField(k)
                                  if (field) {
                                    if (
                                      !field.name.startsWith('::') &&
                                      field.type !== 'has-many'
                                    ) {
                                      if (rels && rels[field.name]) {
                                        const to = rels[field.name].join.to
                                          .split('.')
                                          .pop()
                                        if (to)
                                          field.value = {
                                            [to]: value,
                                          }
                                      } else {
                                        field.value = value
                                      }

                                      if (field.type === 'datetime') {
                                        try {
                                          const date = new Date(value)

                                          if (date.getFullYear() === 1970) {
                                            field.value =
                                              ExcelDateToJSDate(value)
                                          } else {
                                            field.value = date.toISOString()
                                          }
                                        } catch (e) {
                                          console.log(
                                            `failed to parse date (${field.name})`,
                                            value
                                          )
                                        }
                                      }

                                      s.db.data[field.name] = field.value
                                      if (field.onChange) {
                                        field.onChange(field.value, {
                                          state: s,
                                          row: s.db.data,
                                          col: field.name,
                                        })
                                      }
                                      field.render()
                                    }
                                  } else {
                                    unfilledBecauseNotFound.push(k)
                                  }
                                }
                              }

                              fill()
                              if (s.config.onLoad)
                                await s.config.onLoad(s.db.data, s)
                              s.component.render()
                              let tries = 0
                              while (
                                unfilledBecauseNotFound.length > 0 &&
                                tries < 10
                              ) {
                                await waitUntil(100)
                                fill()
                                tries++
                              }

                              await s.db.save()
                            }

                            if (im && im.list.length === 0) {
                              s.config.import = undefined
                              const parent = s.tree.parent as ICRUDContext
                              if (parent) {
                                const list = parent.tree.children
                                  .list as IBaseListContext
                                if (list) {
                                  list.db.query('back after import')
                                }
                                parent.crud.setMode('list')
                              }
                            }

                            s.component.render()
                          }
                        },
                      }
                      const popup = s.config.popup
                      if (popup) {
                        popup.show = false
                      }

                      s.config.import.execute()
                    }
                    reader.readAsArrayBuffer(files[0])
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    ),
  }
  s.component.render()
}

const generateExcelTemplate = async (s: IBaseFormContext) => {
  const custom = s.config.importCustom
  const first = {} as any
  const data = [] as any[]
  const sheets = {} as Record<string, Record<string, any>[]>

  const parent = s.tree.parent as ICRUDContext
  const imconf = parent.crud.content.import

  if (custom && typeof custom.sample === 'object') {
    const promises = {} as Record<string, Promise<any>>
    const isheets = {} as Record<string, Record<string, any>[]>

    for (let [k, v] of Object.entries(custom.sample)) {
      if (typeof v === 'object' && !(v instanceof Date) && v.relation) {
        promises[k] = new Promise(async (e) => {
          const table = db[(v as any).relation]
          if (table) {
            const def = await table.definition()
            if (def) {
              let name = ''
              for (let col of Object.values(def.columns) as any) {
                if (!col.name.includes('id') && col.type === 'string') {
                  if (!name) {
                    name = col.name
                  }
                }

                if (col.name.includes('name') || col.name.includes('nama')) {
                  name = col.name
                  break
                }
              }
              if (!name) name = Object.keys(def.columns)[0]

              isheets[k] = await table.findMany({
                select: {
                  [name]: true,
                  [def.pk]: true,
                },
                where: (v as any).where,
              })

              if (isheets[k].length > 0) {
                e(isheets[k][0][def.pk])
              } else {
                e('')
              }
            }
          }
        })
      } else {
        promises[k] = new Promise((e) => e(v))
      }
    }
    await Promise.all(Object.values(promises))

    for (let [k, v] of Object.entries(promises)) {
      first[k] = await v

      if (isheets[k]) {
        sheets[k] = isheets[k]
      }
    }
  } else {
    // if (imconf && imconf.onLoad) {
    //   console.log(imconf.onLoad)
    //   return
    // }
    for (let i of s.config.fieldOrder) {
      const field = s.config.fields[i].state
      const def = s.db.definition?.rels
      if (!field.name.startsWith('::') && field.type !== 'has-many') {
        let name = ''
        if (typeof field.title === 'string') {
          name = field.title
        } else {
          name = field.name
        }
        name = name.replace(/\W/g, ' ')

        first[name] = s.db.data[field.name]
        if (typeof first[name] === 'object' && first[name] instanceof Date) {
          first[name] = first[name].toISOString()
        }
        if (field.type === 'belongs-to') {
          if (typeof first[name] === 'object' && def) {
            const id = def[field.name].join.to.split('.').pop() || ''
            if (first[name][id]) first[name] = first[name][id]
          }
          sheets[name] = field.items as any
        }
      }
    }
  }

  data.push(first)

  ExportExcel({
    data: data,
    sheets,
    filename: `Import ${s.db.tableName?.toLowerCase()} ${new Date().toLocaleDateString()}`,
  })
}

export function ExcelDateToJSDate(serial) {
  var utc_days = Math.floor(serial - 25569)
  var utc_value = utc_days * 86400
  var date_info = new Date(utc_value * 1000)

  var fractional_day = serial - Math.floor(serial) + 0.0000001

  var total_seconds = Math.floor(86400 * fractional_day)

  var seconds = total_seconds % 60

  total_seconds -= seconds

  var hours = Math.floor(total_seconds / (60 * 60))
  var minutes = Math.floor(total_seconds / 60) % 60

  return new Date(
    date_info.getFullYear(),
    date_info.getMonth(),
    date_info.getDate(),
    hours,
    minutes,
    seconds
  )
}
