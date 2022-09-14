import { FC, ReactElement } from 'types/react'
import { IDrillEntry } from '../../crud/src/CRUDGlobal'
import { IQLFilter, IQLTable, IQueryList } from './qlist'
import { ICRUDContext } from './__crud'
import { IBaseFormProps } from './__form'
import {
  IBaseFilterDef,
  IBaseListContext,
  IBaseListProps,
  IBaseListSQL,
} from './__list'
type DBTables = any
/** TYPE SEPARATOR - DO NOT DELETE THIS COMMENT **/

export type IDrill = {
  url?: string
  defaultParams?: any
  label: string | FC<{ drill: IDrillEntry; params: any }>
  component: FC<{ parent: ICRUDContext }>
}

export type IAdminSingle = {
  title?: string
  table?: string
  label?: string | any
  resetForm?: boolean
  hash?: boolean
  import?: {
    onLoad?: (state: ICRUDContext) => Promise<
      {
        name: string
        type: string
        sample?: any
        list: { value: string; label: string }[]
      }[]
    >
    fields?: Record<
      string,
      {
        list: (
          state: ICRUDContext
        ) => Promise<{ value: string; label: string }[]>
      }
    >
  }
  filters?: (Partial<IBaseFilterDef> & { name: string })[]
  query?: IBaseListSQL
  mode?: 'form' | 'list'
  onInit?: ({ state: ICRUDContext }) => void
  drill?: {
    url?: string
    id?: string
    isRoot?: true
    showBack?: boolean
    child: IDrill[]
    tabIndex?: number
  }
  list?: {
    action?: IBaseListProps['action']
    query?: IBaseListProps['query']
    header?: IBaseListProps['header']
    title?: IBaseListProps['title']
    params?: IBaseListProps['params']
    onLoad?: IBaseListProps['onLoad']
    onInit?: IBaseListProps['onInit']
    filter?: IBaseListProps['filter']
    table?: Partial<IBaseListContext['table']>
  }
  form?: IBaseFormProps
}
interface IAdminCMSList {
  wrapper?: ({ children, list }) => React.ReactElement
  params?: IQueryList['params']
  onLoad?: IBaseListProps['onLoad']
  onInit?: IBaseListProps['onInit']
  table?: IQLTable
  filter?: IQLFilter
  props?: IQueryList
}
interface IAdminCMS {
  active?: string
  setActive?: (v: string) => void
  nav?: string[]
  platform?: 'web' | 'mobile'
  mobile?: {
    zIndex?: number
  }
  content?: Record<string, IAdminSingle | (() => any)>
}
export type admin = IAdminCMS
