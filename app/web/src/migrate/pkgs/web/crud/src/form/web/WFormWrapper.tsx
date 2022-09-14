import { css } from '@emotion/react'
import { Spinner, SpinnerSize } from '@fluentui/react'
import { Context, useContext, useEffect, useRef } from 'react'
import { Loading } from 'src/migrate/pkgs/web/crud/src/view/loading'
import { ICRUDContext } from 'src/migrate/pkgs/web/ext/types/__crud'
import { IBaseFormContext } from 'src/migrate/pkgs/web/ext/types/__form'
import { useRender } from 'src/migrate/pkgs/web/utils/src/useRender'
import { BaseWindow } from 'types/window'
import { WFormSplitter } from './WFormSplitter'
import { WFormTab } from './WFormTab'
import { WHeader } from './WHeader'

declare const window: BaseWindow
export const WFormWrapper = ({
  children,
  ctx,
}: {
  children: any
  ctx: Context<IBaseFormContext>
}) => {
  const _ = useRef({
    split: {
      size: 0,
      original: 0,
      unit: 'percent',
    },
    action: {
      container: null as null | HTMLDivElement,
    },
    error: {
      el: null,
      show: false,
    },
    init: false,
    timer: 0 as any,
    singleTab: {
      mode: 'form' as 'form' | 'tab',
      title: <Spinner size={SpinnerSize.small} />,
    },
  })

  const meta = _.current
  const state = useContext(ctx)
  const render = useRender()

  const def = state.db.definition

  let pk = undefined
  if (def && state.db.data && def.pk) {
    pk = state.db.data[def.pk]
  }

  useEffect(() => {
    const ss = state.config.split.size
    const formTabSize = localStorage.getItem('ft-size-' + state.db.tableName)

    switch (formTabSize) {
      case 'max':
        meta.split.original = 50
        meta.split.size = 0
        break

      case 'min':
        meta.split.original = 50
        meta.split.size = 94
        break

      default:
        meta.split.size = parseInt(ss.replace(/\D/g, ''))
    }

    meta.split.unit = ss.replace(/\d+/g, '') === '%' ? 'percent' : 'pixel'
    meta.init = true
    render()
  }, [pk])

  const parent = state.tree.parent as ICRUDContext
  let hideTab = false

  if (parent?.crud.content.hash !== false && location.hash === '#new')
    hideTab = true

  if (!meta.init || !state.db.definition) return null
  const title = state.config.header.title
  const mainContent = (
    <div
      className="flex flex-1 items-stretch px-2 pt-1"
      css={css`
        > div {
          flex: 1;
        }
      `}
    >
      {children}
    </div>
  )

  if (
    state.config.tab.list.length === 1 &&
    (Object.values(state.config.fields).filter(
      (e) => e.state.type === 'has-many'
    ).length === 0 ||
      (state.tree.parent && state.tree.parent.tree.parent))
  ) {
    return (
      <>
        <Loading show={state.db.loading} />
        <div className="flex flex-1 items-stretch self-stretch flex-col">
          {state.config.header.enable && (
            <span>
              <WHeader
                state={state}
                title={title}
                meta={meta}
                ext={({ local }) => (
                  <>
                    <div
                      className="absolute left-0 right-0 bottom-0 "
                      css={css`
                        height: 2px;
                        margin-bottom: -3px;
                        border-top: 1px solid #dddddd;
                        z-index: 10;
                        background: rgb(243, 244, 247);
                      `}
                    ></div>
                    <div
                      className="flex-row select-none flex items-stretch cursor-pointer transition-opacity"
                      css={css`
                        margin: 8px 5px 0px 7px;
                        border-top: 1px solid #ddd;
                        border-left: 1px solid #ddd;
                        border-right: 1px solid #ddd;
                        .item {
                          display: flex;

                          &:first-of-type {
                            border-right: 1px solid #ddd;
                          }

                          align-items: center;
                          padding: 5px 15px;
                          background: white;
                          border-top: 2px solid white;

                          font-size: 14px;

                          &.current {
                            position: relative;
                            background: #f3f4f7;
                            color: #0078d4;
                            border-top: 2px solid #0078d4;
                            &::after {
                              position: absolute;
                              left: 0;
                              right: 0;
                              bottom: 0;
                              height: 2px;
                              margin-bottom: -1px;
                              z-index: 11;
                              content: ' ';
                              background: #f3f4f7;
                            }
                          }
                        }
                      `}
                    >
                      <div
                        className={`transition-all item ${
                          meta.singleTab.mode === 'form' ? 'current' : ''
                        }`}
                        onClick={() => {
                          local.actionShow = true
                          meta.singleTab.mode = 'form'

                          render()
                        }}
                      >
                        Detail
                      </div>
                      <div
                        className={`transition-all item ${
                          meta.singleTab.mode === 'tab' ? 'current' : ''
                        }`}
                        onClick={() => {
                          local.actionShow = false
                          meta.singleTab.mode = 'tab'
                          render()
                        }}
                      >
                        {meta.singleTab.title}
                      </div>
                    </div>
                  </>
                )}
                parentRender={render}
              />
            </span>
          )}

          {meta.singleTab.mode === 'form' && (
            <div className="flex flex-1 relative overflow-auto">
              <div className="absolute flex flex-col inset-0 ">
                {mainContent}
                <div
                  css={css`
                    padding: 30px 0px;
                  `}
                >
                  {' '}
                </div>
              </div>
            </div>
          )}

          <div
            className={
              (meta.singleTab.mode !== 'tab' ? 'hidden' : '') +
              ' flex-1 flex-col flex  bg-white'
            }
          >
            <WFormTab
              ctx={ctx}
              size="max"
              onLoad={(e) => {
                meta.singleTab.title = e[0]
                render()
              }}
            />
          </div>
        </div>
      </>
    )
  }

  let tabMode = state.config.split.position as any
  if (state.config.tab.list.length === 0 || hideTab) {
    tabMode = 'none'
  } else if (!pk) {
    state.config.tab.list = state.config.tab.list.filter((e: any) => {
      if (def && typeof e === 'string' && def.rels[e]) {
        return false
      }
      return true
    })
  }

  return (
    <>
      <Loading show={state.db.loading} />
      <div className="flex flex-1 items-stretch self-stretch flex-col">
        {state.config.header.enable && (
          <WHeader
            state={state}
            title={title}
            meta={meta}
            parentRender={render}
          />
        )}
        <WFormSplitter
          mode={tabMode}
          size={meta.split.size}
          unit={meta.split.unit as any}
          setSize={(v) => {
            meta.split.size = v

            clearTimeout(meta.timer)
            meta.timer = setTimeout(() => {
              if (
                localStorage.getItem('ft-size-' + state.db.tableName) !==
                'original'
              ) {
                localStorage.setItem(
                  'ft-size-' + state.db.tableName,
                  'original'
                )
                state.component.render()
              }
            }, 100)

            state.component.render()
          }}
        >
          {mainContent}
          <WFormTab
            ctx={ctx}
            size={
              (localStorage.getItem('ft-size-' + state.db.tableName) ||
                'original') as any
            }
            onSize={(mode) => {
              switch (mode) {
                case 'hide':
                  localStorage.setItem('ft-size-' + state.db.tableName, 'hide')
                  render()
                  break
                case 'max':
                  localStorage.setItem('ft-size-' + state.db.tableName, 'max')
                  meta.split.original = meta.split.size
                  meta.split.size = 0
                  render()
                  break

                case 'original':
                  localStorage.setItem('ft-size-' + state.db.tableName, '')

                  if (meta.split.original) {
                    meta.split.size = Math.min(50, meta.split.original)
                  }
                  render()

                  break

                case 'min':
                  localStorage.setItem('ft-size-' + state.db.tableName, 'min')
                  meta.split.original = meta.split.size
                  meta.split.size = 94
                  render()
                  break
              }
            }}
          />
        </WFormSplitter>
      </div>
    </>
  )
}
