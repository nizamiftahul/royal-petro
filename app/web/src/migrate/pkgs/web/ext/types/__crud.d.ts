import { IAdminSingle } from './admin'
import { ITableDefinitions } from './qlist'
import { IBaseContext } from './__context'
import { IBaseFormContext } from './__form'
import { IBaseListProps } from './__list'
/** TYPE SEPARATOR - DO NOT DELETE THIS COMMENT **/

interface ICRUD {
  id?: string
  nav?: string[]
  hash?: boolean
  defaultMode?: 'form' | 'list'
  content: Record<string, IAdminSingle>
  parentCtx?: React.Context<IBaseFormContext>
  isChildren?: boolean
  class?: string
  className?: string
}
export interface ICRUDContext extends IBaseContext {
  crud: {
    content: IAdminSingle
    path?: string
    onInit?: (props: { state: ICRUDContext }) => void
    title: string
    isChildren: boolean
    listScroll: {
      x: number
      y: number
    }
    drill?: IAdminSingle['drill']
    mode: 'list' | 'form'
    formData: any
    setMode: (mode: ICRUDContext['crud']['mode'], data?: any) => Promise<void>
    definition: ITableDefinitions
  }
}

