import { IDropdownOption } from '@fluentui/react'
import { FC, ReactElement } from 'react'
import { IBaseFilterDef, IBaseListContext } from './__list' // db.a_asset.findMany({
//   where: {
//     a_asset_status: {
//       mode: 'insensitive'
//     }
//   }
// })

/** TYPE SEPARATOR - DO NOT DELETE THIS COMMENT **/

export type IFilterItem =
  | IFilterItemText
  | IFilterItemTab
  | IFilterItemNumber
  | IFilterDate
  | IFilterItemInvisible

interface IFilterProp<K> {
  ctx: React.Context<IBaseListContext>
  name: string
  onSubmit: () => void
  children: (props: {
    FilterInput: React.FC<K>
    ValueLabel: React.FC
    submit: () => void
    filter: IFilterItem
    modifier?: FC<{
      state: IBaseListContext
      filter: IFilterItem
      render: () => void
    }>
    def: IBaseFilterDef
    name: string
    operators: {
      label: string
      value: string
    }[]
  }) => React.ReactElement
}
interface IFilterBase {
  render: () => void
  title: string
  visible: boolean
  operator?: string
  modifyQuery: IBaseFilterDef['modifyQuery']
  component: React.FC<IFilterProp<IFilterItem>>
}
export interface IFilterItemText extends IFilterBase {
  value: string
  type: 'text'
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith'
}
export interface IFilterItemTab extends IFilterBase {
  value: string
  type: 'tab'
  items: (
    | string
    | {
        label: string
        value: string
      }
  )[]
  position: 'top' | 'left'
}
export interface IFilterItemInvisible extends IFilterBase {
  value: any
  type: 'invisible'
  operator: any
}
export interface IFilterItemNumber extends IFilterBase {
  value: number | string
  type: 'number' | 'money'
  operator: 'equals' | 'gt' | 'gte' | 'lt' | 'lte'
}
export interface IFilterDate extends IFilterBase {
  value: Date | string
  type: 'date'
  operator: 'daily' | 'monthly'
  min?: Date | string
  max?: Date | string
}

export interface IFilterSelect extends IFilterBase {
  value: string
  type: 'select'
  operator: 'equals'
  items: any[] | ((ctx: IBaseListContext) => Promise<any[]> | any[])
}
