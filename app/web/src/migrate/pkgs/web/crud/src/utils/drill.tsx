import { FC } from 'react'
import { IDrill } from '../../../ext/types/admin'
import { ICRUDContext } from '../../../ext/types/__crud'
import { CRUDGlobal, IBread, IDrillEntry } from '../CRUDGlobal'
const w = window as any
export const generateDrill = (
  glb: typeof CRUDGlobal & { render: () => void },
  parentState: ICRUDContext
) => {
  const cid = parentState.crud.content.drill
    ? parentState.crud.content.drill.id || parentState.crud.content.drill.url
    : ''

  let skipInit = true

  const initFromBlankBread = async () => {
    const parent = glb.drill[cid]
    if (parent && parent.detail && parent.detail.isRoot) {
      for (let i of parent.detail.child) {
        if (i.url) {
          const parsed = parseUrl(i.url, location.pathname)

          let match = parsed.match

          if (match && i.label) {
            if (parent.breads.length === 0) {
              parent.breads.push({
                label: parentState.crud.title,
                url: parentState.crud.content.drill
                  ? parentState.crud.content.drill.url
                  : location.pathname + '',
                ctx: parentState,
                params: {},
              })
            }

            w.params = parsed.parts

            parent.breads.push({
              label: i.label,
              url: i.url,
              drill: i,
              siblings: parent.detail.child,
              params: {},
            })
          }
        }
      }
    }
  }

  if (cid && !glb.drill[cid]) {
    skipInit = false

    glb.drill[cid] = {
      detail: parentState.crud.content.drill,
      breads: [],
      ctx: parentState,
    }

    initFromBlankBread()
  }

  const drill = glb.drill[cid]
  let parent = drill as IDrillEntry | null

  if (drill && drill.detail && !drill.detail.isRoot) {
    parent = null
    for (let _parent of Object.values(glb.drill)) {
      if (_parent.detail && _parent.detail.isRoot) {
        const lastBread = _parent.breads[_parent.breads.length - 1]
        // console.log(lastBread)
        if (lastBread)
          if (lastBread.url === drill.detail.url) {
            parent = _parent
            for (let i of drill.detail.child) {
              if (i.url) {
                const parsed = parseUrl(i.url, location.pathname)
                let match = parsed.match
                if (match && parent.breads.length > 0) {
                  if (
                    i.url.split('/').length !==
                    location.pathname.split('/').length
                  ) {
                    match = false
                  }
                }
                if (match) {
                  _parent.breads.push({
                    label: i.label,
                    url: i.url,
                    drill: i,
                    params: {},
                    siblings: drill.detail.child,
                  })
                  setTimeout(() => {
                    glb.render()
                  })
                }
              }
            }
          }
      }
    }
  }

  let root = glb.drill[cid]
  if (parent && parent.detail?.isRoot) {
    glb.drill[cid].root = parent
    root = parent
  } else if (drill && !drill.detail?.isRoot && parent && parent.root) {
    root = parent.root
    glb.drill[cid].root = parent.root
  }

  if (!parent) {
    if (!drill) {
      for (let [k, i] of Object.entries(glb.drill)) {
        if (i.detail && i.detail.url) {
          const parsed = parseUrl(i.detail.url, location.pathname)
          if (!parsed.match) {
            delete glb.drill[k]
          }
        }
      }
    }
  } else if (skipInit) {
    if (root.breads.length > 0) {
      for (let [k, i] of Object.entries(root.breads).reverse()) {
        if (i.drill && i.drill.url) {
          const parsed = parseUrl(i.drill.url, location.pathname)
          if (!parsed.match) {
            root.breads.pop()
          } else {
            w.params = parsed.parts
            break
          }
        }
      }
    } else {
      initFromBlankBread()
    }
  }

  let shouldRenderDrill = drill && drill.breads.length > 1
  const ctn = parentState.crud.content

  return {
    drill,
    root,
    drillTabs: glb.drillTabs,
    parent,
    shouldRenderDrill,
    get DrillChild() {
      let lastBread = null as null | IBread

      if (parent && parent.breads.length > 1) {
        lastBread = parent.breads[parent.breads.length - 1]
      }

      if (lastBread && lastBread.drill) {
        if (parent === drill) {
          return lastBread.drill.component
        } else {
          drill.breads.splice(0, drill.breads.length)
        }
      }

      return (() => <></>) as FC<any>
    },
    drillTo: (to: IDrill, params: any) => {
      if (to) {
        let navto = to.url + ''
        if (to.url) {
          for (let k of Object.keys(parseUrl(to.url).parts)) {
            if (params && params[k] && typeof params[k] !== 'object') {
              navto = navto.replace(`:${k}`, params[k])
            }
          }
        }

        if (root) {
          if (root.breads.length === 0) {
            root.breads.push({
              label: parentState.crud.title,
              url: parentState.crud.content.drill
                ? parentState.crud.content.drill.url
                : location.pathname + '',
              ctx: parentState,
              params: {},
            })
          }

          root.breads.push({
            label: to.label,
            url: to.url,
            drill: to,
            params: {},
          })

          if (to.url) {
            const parsed = parseUrl(to.url, navto)
            w.params = parsed.parts
            window.history.pushState({}, '', navto)
          }

          glb.render()
        }

        return true
      }
      return false
    },
  }
}

export const parseUrl = (pattern: string, url?: string) => {
  const urlarr = pattern.split(':')
  const parts = {}
  for (let i of urlarr) {
    const key = i.split('/')[0]
    if (key) parts[key] = ''
  }

  let match = true
  if (url) {
    const token = [] as {
      type: 'string' | 'var'
      var?: string
      string?: string
      start: number
      end: number
    }[]

    for (let part of Object.keys(parts)) {
      const pos = pattern.indexOf(`:${part}`)
      if (token.length === 0) {
        if (pos === 0) {
          token.push({
            type: 'var',
            var: part,
            start: 0,
            end: pos,
          })
          continue
        }
      }

      const lastok = token.length === 0 ? 0 : token[token.length - 1].end
      token.push({
        type: 'string',
        string: pattern.substring(lastok, pos),
        start: lastok,
        end: pos,
      })

      token.push({
        type: 'var',
        var: part,
        start: pos,
        end: pos + part.length + 1,
      })
    }

    const lastok = token[token.length - 1]
    if (lastok && pattern.length - lastok.end > 0) {
      token.push({
        type: 'string',
        string: pattern.substring(lastok.end),
        start: lastok.end + 1,
        end: pattern.length - lastok.end,
      })
    }

    if (Object.keys(token).length === 0) {
      match = url === pattern
    } else {
      let cur = ''
      let ct = 0
      for (let i = 0; i < url.length; i++) {
        cur += url[i]
        const tok = token[ct]
        if (tok) {
          if (tok.type === 'string' && tok.string) {
            if (cur === tok.string) {
              ct++
              cur = ''
            } else if (i === url.length - 1) {
              if (tok.string.length > cur.length || tok.string !== cur) {
                match = false
              }
            }
          } else {
            const next = token[ct + 1]
            if (
              tok.var &&
              (i === url.length - 1 ||
                (next &&
                  next.type === 'string' &&
                  next.string &&
                  next.string[0] === url[i + 1]))
            ) {
              ct++
              parts[tok.var] = cur
              cur = ''
            }
          }
        }
      }
    }
  }

  return { parts, match }
}

export const parseBreadParams = (
  bread: IBread & { params: any },
  state: ICRUDContext
) => {
  if (bread.url) {
    const parsed = parseUrl(bread.url, location.pathname)
    bread.params = {
      _: true,
      ...parsed.parts,
    }
  }
}
