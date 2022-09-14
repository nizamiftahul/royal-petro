import { CommandBarButton, DefaultButton } from '@fluentui/react/lib/Button'
import { FC, useEffect } from 'react'
import { IBaseListContext } from 'src/migrate/pkgs/web/ext/types/__list'
import { createPortal } from 'react-dom'
import { useLocal } from 'web-utils'
import { ICRUDContext } from 'src/migrate/pkgs/web/ext/types/__crud'

export const FileColumn: FC<{
  colName: string
  row: any
  state: IBaseListContext
}> = ({ colName, row, state }) => {
  const local = useLocal({
    ref: null as null | HTMLInputElement,
    ready: false,
    def: null as any,
  })
  let def = state.db.definition
  let tableName = state.db.tableName
  let table = db[tableName]
  let parent = state.tree.parent as ICRUDContext
  if (parent) {
    let parentTable = parent.crud.content.form?.table
    if (parentTable) {
      tableName = parentTable
      def = (window as any).tableDefinitions[`db.${parentTable}`]
      table = db[parentTable]
    }
  }

  useEffect(() => {
    if (!def) {
      db[tableName].definition().then((res) => {
        local.def = res
        local.render()
      })
    }
  }, [])

  if (!def) return null

  return (
    <>
      <a
        href={row[colName]}
        download
        css={css`
          background: white;
          border-radius: 3px;
          text-decoration: none;
        `}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <DefaultButton
          css={css`
            padding: 0px;
            padding-left: 3px;
            min-width: 30px;

            ${!row[colName] &&
            css`
              padding-left: 3px;
              min-width: 125px;

              .ms-Button-textContainer {
                margin-left: 1px;
              }
            `}
            .ms-Button-label {
              padding: 0px;
              font-size: 13px;
              margin-left: -2px;
              margin-right: 8px;
            }
          `}
          text={row[colName] ? 'Download' : 'Upload'}
          iconProps={
            row[colName] ? { iconName: 'Download' } : { iconName: 'Upload' }
          }
          split={row[colName] ? true : undefined}
          menuProps={
            !row[colName] || !def || !db || !row[def.pk]
              ? undefined
              : {
                  items: [
                    {
                      key: 'replace',
                      onRenderContent: () => {
                        return (
                          <CommandBarButton
                            className="relative w-full h-full text-black"
                            iconProps={{
                              iconName: 'Upload',
                              className: 'text-slate-800 hover:text-slate-800',
                            }}
                            text="Replace File"
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              if (local.ref) {
                                local.ref.click()
                              }
                            }}
                          />
                        )
                      },
                    },
                  ],
                }
          }
          onClick={(e) => {
            if (row[colName]) {
            } else {
              e.stopPropagation()
              e.preventDefault()
              if (local.ref) {
                local.ref.click()
              }
            }
          }}
        />
      </a>
      <input
        type="file"
        css={css`
          display: none;
        `}
        onClick={(e) => {
          e.stopPropagation()
        }}
        onChange={async (e) => {
          if (e.target.files && e.target.files.length && def) {
            const files = e.target.files
            const ext = files[0].name.split('.').pop()
            const file = new File(
              [files[0].slice(0, files[0].size, files[0].type)],
              `${getUuid()}.${ext}`,
              {
                type: files[0].type,
              }
            )

            let directory = 'public'
            if (tableName) {
              directory = `${tableName}/${colName}`
            }
            const url = `/upload/${directory}/${file.name}`
            const formData = new FormData()
            formData.append(directory, file)
            await request(
              '/__upload',
              {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Access-Control-Allow-Origin': '*',
                },
                body: formData,
              },
              (event) => {}
            )

            const pktype = def.columns[def.pk].type

            let pk = row[def.pk]
            if (pktype === 'number') {
              pk = Number(pk)
            }

            await table.update({
              data: {
                [colName]: url,
              },
              where: {
                [def.pk]: pk,
              },
            })
            row[colName] = url
            state.component.render()
          }
        }}
        ref={(ref) => {
          local.ref = ref
        }}
      />
    </>
  )
}

function request(
  url: string,
  opts: {
    method?: 'POST' | 'GET'
    headers?: any
    body?: Parameters<XMLHttpRequest['send']>[0]
  } = {},
  onProgress: XMLHttpRequest['upload']['onprogress']
) {
  return new Promise((res, rej) => {
    const xhr = new XMLHttpRequest()
    xhr.open(opts.method || 'get', url, true)
    Object.keys(opts.headers || {}).forEach((headerKey) => {
      xhr.setRequestHeader(headerKey, opts.headers[headerKey])
    })

    xhr.onload = (e: any) => res(e.target.responseText)

    xhr.onerror = rej

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = onProgress // event.loaded / event.total * 100 ; //event.lengthComputable
    }

    xhr.send(opts.body)
  })
}

const getUuid = (a: string = ''): string =>
  a
    ? /* eslint-disable no-bitwise */
      ((Number(a) ^ (Math.random() * 16)) >> (Number(a) / 4)).toString(16)
    : `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, getUuid)
