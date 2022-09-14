import { FC } from 'react'
import { IAdminSingle, IDrill } from '../../ext/types/admin'
import { ICRUDContext } from '../../ext/types/__crud'

export type IBread = {
  label?: string | FC<{ drill: IDrillEntry; params: any }>
  url?: string
  defaultParams?: any
  ctx?: any
  siblings?: IDrill[]
  drill?: IDrill
}

export type IDrillEntry = {
  detail: IAdminSingle['drill']
  breads: (IBread & { params: any })[]
  ctx: ICRUDContext
  root?: IDrillEntry
}

export const CRUDGlobal = {
  crudStateID: 0,
  baseFormFieldTypes: null,

  drillTabs: {} as Record<string, number>,
  drill: {} as Record<string, IDrillEntry>,
}
