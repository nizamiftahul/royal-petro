import { ReactElement } from 'react'
import { IAdminSingle } from './admin'
import { IFieldType } from './qform'
import { ITableDefinitions } from './qlist'
import { IBaseContext } from './__context'
/** TYPE SEPARATOR - DO NOT DELETE THIS COMMENT **/

export type IBaseFieldMainProps = Partial<IBaseFieldContext> & {
  name: string
  ctx: React.Context<IBaseFormContext>
  wrapper?: React.FC
  children?: React.ReactElement
}
export interface IBaseFieldContext {
  name: string
  label?:
    | ((row?: any, state?: IBaseFormContext) => Promise<string> | string)
    | React.ReactElement
    | string
  params?: (row?: any) => object
  title:
    | string
    | React.ReactElement
    | (({ row: any, state: IBaseFormContext }) => string | React.ReactElement)
  value: any
  undoValue?: any
  isChanged: boolean
  placeholder?: string
  info?: string
  type: IFieldType
  error: string
  required:
    | boolean
    | ((props: {
        state: IBaseFormContext
        row: any
        col: string
      }) => boolean | Promise<boolean>)
  readonly: boolean
  prefix:
    | React.ReactElement
    | string
    | (({ state, row, value }) => React.ReactElement)
  suffix:
    | React.ReactElement
    | string
    | (({ state, row, value }) => React.ReactElement)
  render: () => void
  onChange: (
    value: any,
    opt: {
      state: IBaseFormContext
      row: any
      rowIdx?: number
      col: string
      detail?: any
    }
  ) => void
  parent: IBaseFormContext | null
  popup?: {
    title: string
    value: (prop: { state: IBaseFieldContext }) => string
    children: (prop: {
      state: IBaseFieldContext
      onChange: (value: string) => void
    }) => React.ReactElement
  }
  items?:
    | {
        table: string
        label?: string
        onSelect?: (row: any) => void
      }
    | string[]
    | {
        value: any
        label: string
      }[]
  customRender?: (props: {
    row: any
    state: IBaseFormContext
    Component?: React.FC<IBaseFieldMainProps>
    props?: IBaseFieldMainProps
  }) => React.ReactElement
  fieldProps?:
    | {
        readOnly?: boolean
        acceptFile?: any
        rows?: number
      }
    | IAdminSingle
}
type IFormTabs = (
  | string
  | {
      title: string
      component: (props: { state: IBaseFormContext }) => React.ReactElement
    }
)[]
type IActionSingle =
  | boolean
  | string
  | React.ReactElement
  | (
      | React.ReactElement
      | (({ state, save, data }) => React.ReactElement | boolean)
    )[]
  | (({ state, save, data }) => React.ReactElement | boolean)
  | undefined
export type IAction = Record<string, IActionSingle> & {
  create?: IActionSingle
  save?: IActionSingle
  copy?: IActionSingle
  mv?: IActionSingle
  extra?: IActionSingle
  paste?: IActionSingle
  export?: IActionSingle
  custom?: Record<string, IActionSingle> | IActionSingle
}
type IFormAlterField =
  | Partial<IBaseFieldContext>
  | ((props: {
      name: string
      row: any
      state: IBaseFormContext
      Component?: React.FC<IBaseFieldMainProps>
      props?: IBaseFieldMainProps
    }) => Partial<IBaseFieldContext> | React.ReactElement)
export interface IBaseFormContext extends IBaseContext {
  config: {
    header: {
      enable: boolean
      back?: (props: { state: IBaseFormContext; row: any }) => void
      title?:
        | string
        | ((props: { state: IBaseFormContext; row: any }) => string)
      action?: IAction | ((state) => IAction)
      render?: () => void
    }
    importCustom?: IFormCustomImport
    import?: {
      current: Record<string, any>
      list: Record<string, any>[]
      execute: () => Promise<void>
    }
    popup?: {
      show: boolean
      loading?: boolean
      text: string | ReactElement
    }
    layout: IFormLayout
    watches: Record<string, Set<() => void>>
    split: {
      position: 'top' | 'bottom' | 'left' | 'right' | 'none'
      size: string
    }
    tab: {
      list: IFormTabs
      position: 'top' | 'left' | 'right' | 'bottom'
      modifier?: (props: { tabs: IFormTabs }) => IFormTabs
    }
    alter: Record<string, IFormAlterField>
    fieldOrder: string[]
    fields: Record<string, IFormField>
    onSave?: (props: {
      data: any
      save: (options?: {
        data?: any
        back?: boolean | undefined
      }) => Promise<boolean>
      state: IBaseFormContext
      saving: (status: boolean) => void
    }) => Promise<any> | any
    onInit?: (state: IBaseFormContext) => Promise<void> | void
    onLoad?: (data, state: IBaseFormContext) => Promise<void> | void
    validate: (data: any, state: IBaseFormContext) => Promise<void> | void
  }
  fieldTypes: any
  db: {
    tableName?: string
    data: Record<string, any>
    loading: boolean
    params: any
    errors: string[]
    definition: ITableDefinitions | null
    query: (params?: object | ((params: any) => object)) => Promise<object>
    delete: () => Promise<void>
    validate: () => Promise<Record<string, string[]>>
    saveStatus:
      | 'ready'
      | 'changed'
      | 'validation-error'
      | 'save-error'
      | 'saving'
      | 'success'
      | 'failed'
    saveErrorMsg?: string
    previousErrors?: Record<string, string[]>
    save: (options?: { data?: any; back?: boolean }) => Promise<boolean>
  }
}
export interface IBaseFormRowMeta {
  pk: any
  isNew: boolean
  state?: IBaseFormContext
  raw: any
}
export interface IBaseFieldProps {
  name: string
  ctx: React.Context<IBaseFormContext>
  internalChange: (name: any) => void
}
export interface IFormField {
  state: IBaseFieldContext
}
export type IFormLayout =
  | (
      | string
      | ((props: {
          row: any
          watch: (fields: string[]) => void
          update: (row: any) => void
          layout: (layout: any) => React.ReactElement
          state: IBaseFormContext
        }) => React.ReactElement)
      | IFormLayout
    )[]
  | ((props: {
      row: any
      watch: (fields: string[]) => void
      update: (row: any) => void
      layout: (layout: any) => React.ReactElement
      state: IBaseFormContext
    }) => React.ReactElement)

export interface IBaseFormProps {
  id?: string
  label?: string
  parentCtx?: React.Context<IBaseFormContext>
  table?: IBaseFormContext['db']['tableName']
  alter?: IBaseFormContext['config']['alter']
  action?: IBaseFormContext['config']['header']['action']
  import?: IFormCustomImport
  split?: {
    position?: IBaseFormContext['config']['split']
    size?: IBaseFormContext['config']['split']['size']
    tab?: IBaseFormContext['config']['tab']['position']
  }
  onSave?: IBaseFormContext['config']['onSave']
  onInit?: IBaseFormContext['config']['onInit']
  onLoad?: IBaseFormContext['config']['onLoad']
  header?: IBaseFormContext['config']['header']
  title?: IBaseFormContext['config']['header']['title']
  layout?: IBaseFormContext['config']['layout']
  tabs?: IBaseFormContext['config']['tab']['modifier']
  params?: any
  data?: any
}

export type IFormCustomImport = {
  sample: Record<
    string,
    | string
    | number
    | Date
    | boolean
    | { relation: string; columns?: string[]; where?: any }
  >
  importRow: (row: Record<string, any>) => Promise<boolean>
}
