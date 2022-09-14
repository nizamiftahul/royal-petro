import { IBaseListContext } from 'src/migrate/pkgs/web/ext/types/__list'
import FileSaver from 'file-saver'

export const ExportExcel = async ({
  data,
  filename,
  sheets,
}: {
  data: Record<string, any>[]
  filename: string
  sheets?: Record<string, Record<string, any>[]>
}) => {
  const fileType =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
  const fileExtension = '.xlsx'
  let xlsx = await import('xlsx')
  const ws = xlsx.utils.json_to_sheet(data)
  const wb = {
    Sheets: {
      Data: ws,
    },
    SheetNames: ['Data'],
  }

  if (sheets && Object.keys(sheets).length > 0) {
    for (let [k, v] of Object.entries(sheets)) {
      if (v && v.length > 0) {
        if (k === 'Data') {
          k = 'DataRef'
        }
        wb.Sheets[k] = xlsx.utils.json_to_sheet(v)
        wb.SheetNames.push(k)
      } 
    }
  }

  const excelBuffer = xlsx.write(wb, {
    bookType: 'xlsx',
    type: 'array',
  })
  const render_data = new Blob([excelBuffer], {
    type: fileType,
  })
  FileSaver.saveAs(render_data, filename + fileExtension)
}

export const exportExcelFromList = async (
  state: IBaseListContext,
  callback: {
    start: () => void
    progress: (percent: number) => void
    finish: () => void
  }
) => {
  callback.start()
  const el = state.table.web.ref._root.current as HTMLDivElement
  const rowsRef = state.table.web.ref._activeRows
  const vport = el.parentElement?.parentElement
  if (vport) {
    vport.scrollTop = 0
    const list = {} as Record<string, any>
    const columns = (state.table.columns as any).map((e) => {
      return e[1].title
    })

    await new Promise<void>((resolve) => {
      let lastScroll = -1
      const parseLine = () => {
        Object.values(rowsRef).map((row: any) => {
          const rel = row._root.current as HTMLDivElement
          const line = {} as any
          rel.querySelectorAll('.ms-DetailsRow-cell').forEach((e, idx) => {
            line[columns[idx]] = e.textContent || ''
          })
          const rowNum = rel.id.split('-').pop() || ''
          list[rowNum] = line

          callback.progress(
            Math.round((Object.keys(list).length / state.db.list.length) * 100)
          )
        })
        if (
          Object.keys(list).length < state.db.list.length &&
          vport.scrollTop < vport.scrollHeight &&
          vport.scrollTop !== lastScroll
        ) {
          lastScroll = vport.scrollTop
          vport.scrollTop += 100
          setTimeout(parseLine, 100)
        } else {
          resolve()
        }
      }
      parseLine()
    })
    ExportExcel({
      data: Object.values(list),
      filename: `Export ${state.db.tableName.toLowerCase()} ${new Date().toLocaleDateString()}`,
    })

    callback.finish()
  }
}
