import { IColumn } from '@fluentui/react'
import format from 'date-fns/format'
import get from 'lodash.get'
import { Context, useContext } from 'react'
import NiceValue from 'src/migrate/pkgs/web/crud/src/legacy/NiceValue'
import {
  IBaseListContext,
  IBaseListRowMeta,
} from 'src/migrate/pkgs/web/ext/types/__list'
import { useRender } from 'src/migrate/pkgs/web/utils/src/useRender'
import { ErrorBoundary } from 'web-init/src/error'
import { FileColumn } from './columns/WFileColumn'
export const BaseListWebCol = ({
  ctx,
  row,
  idx,
  colDef,
}: {
  ctx: Context<IBaseListContext>
  colDef: IColumn
  row: Record<string, any> & {
    __listMeta: IBaseListRowMeta
  }
  idx: number
}) => {
  const state = useContext(ctx)
  const render = useRender()
  const col = colDef.fieldName
  const colIdx = (colDef as any).idx
  if (col) row.__listMeta.columns[col].render = render

  return (
    <ErrorBoundary>
      <>
        {renderValue({
          state,
          row,
          idx,
          colIdx,
          rowState: row.__listMeta,
        })}
      </>
    </ErrorBoundary>
  )
}

const renderValue = ({
  state,
  colIdx,
  row,
  idx,
  rowState,
}: {
  state: IBaseListContext
  row: any
  idx: number
  colIdx: number
  rowState: any
}) => {
  const mdb = state.db
  let colDef = state.table.columns[colIdx]

  if (colDef) {
    if (typeof colDef === 'function') {
      const result = colDef(row)
      return (
        <div key={idx} className="ui-querylist-custom">
          {result.value}
        </div>
      )
    }
  }

  let colName = ''

  if (Array.isArray(colDef)) {
    colName = colDef[0]

    if (colDef[1] && typeof colDef[1].value === 'function') {
      return (
        <>
          {colDef[1].value(row, idx, {
            list: state,
            row: rowState,
          })}
        </>
      )
    }

    if (typeof colDef[1] === 'object') {
      const type = colDef[1].type

      if (type === 'file') {
        return <FileColumn colName={colName} row={row} state={state} />
      }
    }
  }

  if (typeof colDef === 'string') {
    colName = colDef
  }

  const def = get(mdb, `definition.columns.${colName}`)
  let value = get(row, colName)

  if (value) {
    if (def) {
      switch (def.type.toLowerCase()) {
        case 'date':
          if (typeof value === 'string') {
            return format(new Date(value), 'dd MMM yyyy - HH:mm')
          }
          break
      }
    }

    if (typeof value === 'object')
      return <NiceValue value={value} compact={true} />
    return <>{value}</>
  }

  return '-'
}
