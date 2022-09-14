import get from 'lodash.get'
import set from 'lodash.set'
import { createContext, useContext, useEffect } from 'react'
import { ICRUD, ICRUDContext } from 'src/migrate/pkgs/web/ext/types/__crud'
import { niceCase } from 'src/migrate/pkgs/web/utils/src/niceCase'
import { useGlobal, useLocal, waitUntil } from 'web-utils'
import { initializeState } from './context-state'
import { CRUDBody } from './CRUDBody'
import { CRUDGlobal } from './CRUDGlobal'
import { deepUpdate } from './form/BaseForm'
import { Loading } from './view/loading'
const w = window as any
export const CRUD = (props: ICRUD) => {
  const parent = props.parentCtx ? useContext(props.parentCtx) : null
  const glb = useGlobal(CRUDGlobal)
  const meta = useLocal({
    current: {
      content: null as any,
    },
    init: false,
    content: props.content,
    ctx: createContext({} as ICRUDContext),
    selectedId: '',
    state: {
      component: {
        id: generateStateID(glb),
        type: 'crud',
        render: () => {},
      },
      crud: {
        content: {},
        isChildren: !!props.isChildren,
        listScroll: {
          y: 0,
          x: 0,
        },
        setMode: async (mode, data) => {
          meta.state.crud.mode = mode

          if (!data && mode === 'form') {
            console.warn('[WARN] You set crud.setMode with empty data')
          }

          if (mode === 'form') {
            if (data) {
              for (let i of Object.keys(meta.state.crud.formData)) {
                delete meta.state.crud.formData[i]
              }

              meta.state.crud.content.resetForm = true
              deepUpdate(meta.state.crud.formData, data)
            }
          } else {
            const parent = meta.state.tree.parent as ICRUDContext
            if (!parent && !meta.state.crud.isChildren) location.hash = ''
          }

          meta.state.component.render()
          await waitUntil(() => {
            return meta.state.tree.children[mode]
          })
          return
        },
        mode: 'list',
        title: '',
        formData: {},
      },
      tree: {
        root: null as any,
        children: {},
        parent: null,
      },
    } as ICRUDContext,
  })

  const current = meta.current
  if (props.hash !== undefined && current.content) {
    current.content.hash = props.hash
  }

  useEffect(() => {
    ;(async () => {
      if (meta.init) return true
      meta.init = true
      const title = Object.keys(props.content)[0]

      current.content = props.content[title]
      meta.content = props.content
      meta.state.component.render = meta.render

      initializeState(meta.state, parent as any)
      initializeContent(props.content)

      meta.state.crud.content = current.content

      if (current.content.onInit) {
        await current.content.onInit({
          state: meta.state,
        })
      }

      if (parent) {
        meta.state.crud.mode = 'list'
      }

      meta.state.crud.title =
        props.content[title].label || props.content[title].title || title

      meta.render()
    })()
  }, [props.content])

  if (!meta.init) return <Loading />
  return (
    <>
      <meta.ctx.Provider value={meta.state}>
        <div className="flex flex-1 self-stretch items-stretch relative">
          <CRUDBody content={current.content} ctx={meta.ctx} />
        </div>
      </meta.ctx.Provider>
    </>
  )
}

const initializeContent = (contents: ICRUD['content']) => {
  for (let [k, ctn] of Object.entries(contents) as any) {
    if (!ctn.title) {
      ctn.title = niceCase(k)
    } // form.create

    const create = get(ctn, 'form.create', {
      title: 'Create',
      visible: true,
    })

    if (typeof ctn.query === 'function') {
      if (!get(ctn, 'list.onRowClick')) set(ctn, 'list.onRowClick', false)
      set(ctn, 'list.query', ctn.query)
    }

    if (Array.isArray(ctn.filters)) {
      ctn.filters = ctn.filters.reverse()
    }

    if (create.visible === undefined) {
      create.visible = true
    }

    set(ctn, 'form.create', create)
  }
}

export const generateStateID = (glb: typeof CRUDGlobal) => {
  if (!glb.crudStateID) {
    glb.crudStateID = 0
  }

  if (glb.crudStateID > 99999999999) {
    glb.crudStateID = 0
  }

  return leftPad(glb.crudStateID++ || 1, 13)
}

function leftPad(number: number, length: number) {
  return (Array(length).join('0') + number).slice(-length)
}

export default CRUD
