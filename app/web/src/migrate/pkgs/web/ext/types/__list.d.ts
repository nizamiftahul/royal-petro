import { Selection } from '@fluentui/react'
import { ITableDefinitions } from './qlist'
import { IBaseContext } from './__context'
import { IFilterItem } from './__filter'
import {
  IAction,
  IBaseFieldContext,
  IBaseFormContext,
  IBaseFormRowMeta,
} from './__form'
/** TYPE SEPARATOR - DO NOT DELETE THIS COMMENT **/

export interface IBaseFilterDef {
  title: string
  type: string
  visible: boolean | 'auto'
  operator?: string
  default: {
    value: any
    operator: any
  }
  max?: any
  min?: any
  modifyQuery: (props: {
    params: IBaseListContext['db']['params']
    instance: IFilterItem
    column: Partial<IBaseFilterDef>
    name: string
    state: IBaseListContext
  }) => Promise<void> | void
}
export interface IBaseListRowMeta extends IBaseFormRowMeta {
  idx: number
  data: any
  editable?: {
    state: IBaseFormContext
    ctx: React.Context<IBaseFormContext>
  }
  pos: 'start' | 'end'
  render: () => void
  meta: any
  columns: Record<
    string,
    {
      render: () => void
    }
  >
}

export type IBaseListSQL = (args: {
  sql: (strings: any, ...keys: any[]) => string
  params: { where?: any; orderBy?: any }
}) => string | Promise<string>
export type IColumnSingleDef =
  | string
  | [
      string,
      Partial<{
        title: string
        type?: 'string' | 'file'
        edit: Partial<IBaseFieldContext>
        width: number
        orderBy?: string
        value: (
          row: Record<string, any>,
          state: IBaseListContext,
          props: IBaseListContext
        ) => React.ReactElement | string | undefined | number
      }>
    ]
export interface IBaseListContext extends IBaseContext {
  filter: {
    enable: boolean
    web: {
      selector: boolean
      mode: 'topbar' | 'sideleft' | 'sideright' | 'popup'
    }
    quickSearchTitle?: string
    quickSearch?: string
    alter: Record<string, Partial<IBaseFilterDef>>
    instances: Record<string, IFilterItem>
    columns: (string | [string, Partial<IBaseFilterDef>])[]
    render: () => void
  }
  header?: {
    enable?: boolean
    title?: string
    action?: IAction
    render?: () => void
  }
  grid?: {
    colSize: number
  }
  table: {
    isNotShouldDrill?: boolean
    sticky?: number
    rowsMeta: WeakMap<any, IBaseListRowMeta>
    mobile: {
      mode: 'list' | 'slider'
      scroll: boolean
      searchTitle?: string
      checkbox?: boolean
      checked?: Record<any, any>
      onChecked?: (checked: any[]) => void
      onSwipeoutDeleted: (props: { row: any }) => void
      swipeout:
        | boolean
        | ((
            row: any,
            comps: {
              Swipe: any
              Edit: any
              Delete: any
            }
          ) => any)
    }
    web: {
      showHeader?: boolean
      checkbox?: boolean
      massDelete?: boolean
      selection?: Selection
      ref?: any
      popup?: {
        loading: boolean
        text: string
      }
    }
    editable: (props: {
      row: any
      col: string
      list: IBaseListContext['db']['list']
      idx: number
      state: IBaseListContext
    }) => boolean | object
    lastScroll?: {
      x: number
      y: number
    }
    onScroll?: (e: any) => void
    columns:
      | IColumnSingleDef[]
      | ((props: {
          row: any
          list: IBaseListContext['db']['list']
          index: number
          state: IBaseListContext
        }) => React.ReactElement)
    wrapList?: (props: {
      children: any
      list: any[]
      state: IBaseListContext
    }) => React.ReactElement
    wrapRow: (props: {
      children: any
      row: Record<string, any>
      state: IBaseListContext
    }) => React.ReactElement
    isRowClickable?: boolean
    onRowClick?:
      | false
      | ((
          row: Record<string, any>,
          idx: number,
          ev: any,
          state: IBaseListContext,
          isShouldDrill?: boolean
        ) => void | Promise<void | boolean> | boolean)
    render: (reason?: string) => void
    customRenderRow?: (props: {
      row: any
      list: IBaseListContext['db']['list']
      index: number
      state: IBaseListContext
      children: React.ReactElement
    }) => React.ReactElement
  }
  db: {
    tableName: string
    beforeQuery?: (state: IBaseListContext) => void
    paging: {
      skip: 0
      take: number
      fetching: boolean
      allRowFetched: boolean
      reset: () => void
      loadNext: () => Promise<void>
    }
    lateQuery?:
      | Record<
          string,
          [
            string,
            (props: { rows: any; state: IBaseListContext }) => Promise<any[]>
          ]
        >
      | ((props: { rows: any; state: IBaseListContext }) => Promise<void>)
    list: Record<string, any>[]
    params: any
    defaultParams: any
    loading: boolean
    partialLoading: boolean
    sql?: IBaseListSQL
    definition: ITableDefinitions | null
    setSort: (col: string) => boolean
    queryTimeout: ReturnType<typeof setTimeout>
    queryCount: () => Promise<number>
    query: (reason?: string) => Promise<void>
    deferredQuery?: boolean
  }
}
export interface IBaseListProps {
  id?: string
  parentCtx?: React.Context<IBaseContext>
  grid?: IBaseListContext['grid']
  action?: IAction
  title?: string
  header?: IBaseListContext['header']
  table?: IBaseListContext['db']['tableName']
  list?: IBaseListContext['db']['list']
  query?: IBaseListContext['db']['sql']
  scroll?: IBaseListContext['table']['lastScroll']
  onScroll?: IBaseListContext['table']['onScroll']
  params?: IBaseListContext['db']['params']
  filter?: IBaseListContext['filter'] | false
  mobile?: Partial<IBaseListContext['table']['mobile']>
  web?: IBaseListContext['table']['web']
  sticky?: IBaseListContext['table']['sticky']
  wrapList?: IBaseListContext['table']['wrapList']
  wrapRow?: IBaseListContext['table']['wrapRow']
  platform?: 'web' | 'mobile'
  editable?: IBaseListContext['table']['editable']
  lateQuery?: IBaseListContext['db']['lateQuery']
  beforeQuery?: IBaseListContext['db']['beforeQuery']
  columns?: IBaseListContext['table']['columns']
  onRowClick?: IBaseListContext['table']['onRowClick']
  onInit?: (state: IBaseListContext) => void | Promise<void>
  checkbox?: boolean
  onLoad?: (
    list: IBaseListContext['db']['list'],
    state: IBaseListContext
  ) => void | Promise<void>
  children?: IBaseListContext['table']['customRenderRow']
}
