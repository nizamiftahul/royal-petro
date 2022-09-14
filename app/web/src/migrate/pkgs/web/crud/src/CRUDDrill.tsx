import { Icon } from '@fluentui/react'
import { FC, Fragment, useEffect } from 'react'
import { IDrill } from 'src/migrate/pkgs/web/ext/types/admin'
import { useGlobal, useLocal, waitUntil } from 'web-utils'
import { CRUDGlobal, IBread, IDrillEntry } from './CRUDGlobal'
import { parseUrl } from './utils/drill'

export const CRUDDrillBread: FC<{
  drill: IDrillEntry
  render: () => void
}> = ({ drill, render }) => {
  const drillTo = (e: IBread, idx: number) => {
    drill.breads = drill.breads.slice(0, idx + 1)
    if (drill.breads.length === 1) {
      drill.breads = []
    }

    if (e.url) {
      let url = e.url

      const parsed = parseUrl(e.url, location.pathname)
      if (parsed.match) {
        ;(window as any).params = parsed.parts
        for (let [k, v] of Object.entries(parsed.parts) as any) {
          url = url.replace(`:${k}`, v)
        }
      }
      window.history.pushState({}, '', url)
    }
    render()
  }

  return (
    <div
      className="flex flex-row items-stretch space-x-2 select-none"
      css={css`
        height: 40px;
        padding: 0px 12px;
        border-bottom: 1px solid #ececeb;
      `}
    >
      <div className="flex flex-row items-center space-x-2">
        {drill.breads.map((e, idx) => {
          let siblings = (e.siblings || []) as IDrill[]

          let Label: FC<{ drill: IDrillEntry; params: any }> = () => <></>
          if (typeof e.label === 'function') {
            Label = e.label
          }
          return (
            <Fragment key={idx}>
              {idx > 0 &&
                (siblings.length <= 1 ||
                  (siblings.length > 1 && drill.breads.length - 1 !== idx)) && (
                  <Icon
                    iconName="ChevronRight"
                    className="text-gray-900"
                    css={css`
                      margin-top: 3px;
                    `}
                  />
                )}
              <div
                className={
                  [
                    idx === drill.breads.length - 1
                      ? `text-gray-500`
                      : 'hover:opacity-50 cursor-pointer',
                  ]
                    .filter((e) => typeof e === 'string')
                    .join(' ') + ' flex items-center'
                }
                onClick={() => {
                  if (idx < drill.breads.length - 1) {
                    drillTo(e, idx)
                  }
                }}
              >
                {idx === 0 && drill.detail?.showBack !== false && (
                  <Icon
                    iconName="ChevronLeft"
                    className="text-gray-900"
                    css={css`
                      font-size: 11px;
                      padding-right: 8px;
                      margin-left: -5px;
                      margin-top: 3px;
                    `}
                  />
                )}
                {siblings.length > 1 ? (
                  <TabbedBread
                    drill={drill}
                    render={render}
                    childs={siblings}
                    mode={idx === drill.breads.length - 1 ? 'tab' : 'dropdown'}
                  />
                ) : (
                  <>
                    {typeof e.label === 'function' ? (
                      <Label drill={drill} params={drill.breads[idx].params} />
                    ) : (
                      e.label
                    )}
                  </>
                )}
              </div>
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

const TabbedBread: FC<{
  childs: IBread[]
  mode: 'dropdown' | 'tab'
  drill: IDrillEntry
  render: () => void
}> = ({ childs, mode, drill, render }) => {
  const glb = useGlobal(CRUDGlobal)
  let current = null as null | (ReturnType<typeof parseUrl> & { url: string })
  if (childs) {
    for (let e of childs) {
      if (e && e.url) {
        const parsed = parseUrl(e.url, location.pathname)
        if (parsed.match) {
          current = parsed as any
          if (current) current.url = e.url
        }
      }
    }
  }

  const onClick = (e: IBread, idx: number) => {
    const bread = drill.breads[1]
    const w = window as any

    if (bread.url && e.url && current) {
      let url = e.url
      for (let [k, v] of Object.entries({
        ...e.defaultParams,
        ...current.parts,
      }) as any) {
        url = url.replace(`:${k}`, v)
      }

      w.preventPopRender = true
      w.params = current.parts
      window.history.pushState({}, '', url)
    }
    bread.drill = e as any
    bread.label = e.label
    if (bread.ctx) {
      delete bread.ctx
    }
    if (drill.detail && drill.detail.url) glb.drillTabs[drill.detail.url] = idx
    render()
  }

  if (mode === 'dropdown') {
    let idx = 0
    for (let e of childs) {
      if (!e.url || !current) return null
      const active = current.url === e.url
      if (active) {
        let Label: FC<{ drill: IDrillEntry; params: any }> = () => <></>
        if (typeof e.label === 'function') {
          Label = e.label
        }
        return (
          <div onClick={() => onClick(e, idx)}>
            {typeof e.label === 'function' ? (
              <Label drill={drill} params={drill.breads[idx].params} />
            ) : (
              e.label
            )}
          </div>
        )
      }
      idx++
    }
    return <></>
  }

  return (
    <>
      {childs &&
        childs.map((e, idx) => {
          if (!e.url || !current) return null
          const active = current.url === e.url

          return (
            <div
              className="flex flex-row cursor-pointer"
              onClick={() => onClick(e, idx)}
              css={css`
                border: 1px solid #ececeb;
                border-bottom: 0px;
                margin-bottom: -3px;
                margin-top: 3px;
                padding: 5px 13px 9px 13px;
                font-size: 15px;

                ${idx > 0 &&
                css`
                  border-left: 0px;
                `}

                ${active &&
                css`
                  margin-bottom: -1px;
                  border-top: 2px solid #3376cd;
                  background: #f3f4f7;
                `}

            &:hover {
                  margin-bottom: -1px;
                  border-top: 2px solid #3376cd;
                }
              `}
              key={e.url}
            >
              {e.label}
            </div>
          )
        })}
    </>
  )
}
