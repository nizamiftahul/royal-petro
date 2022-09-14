import { waitUntil } from 'web-utils'
import { IBaseContext } from 'src/migrate/pkgs/web/ext/types/__context'
import { weakUpdate } from './form/BaseForm'
export const initializeState = (
  state: IBaseContext,
  parent: IBaseContext | null
) => {
  if (!!parent) {
    const lastState = parent.tree.children[state.component.id]

    if (!lastState) {
      parent.tree.children[state.component.id] = state
    } else {
      weakUpdate(state, lastState)
    }

    if (!state.tree.root) {
      state.tree.root = parent.tree.root
    }
  } else {
    state.tree.root = state
  }

  state.tree.parent = parent

  state.tree.getPath = () => {
    let cur: any = state
    let path = ``

    while (cur.tree.parent) {
      path = `${cur.component.id}${path ? '.' + path : ''}`
      cur = cur.tree.parent
    }

    return `${cur.component.id}${path ? '.' + path : ''}`
  }
}
export const saveState = (state: IBaseContext, parent: IBaseContext | null) => {
  if (!!parent) {
    waitUntil(() => state.component).then(() => {
      parent.tree.children[state.component.id] = state
    })
  }
}
