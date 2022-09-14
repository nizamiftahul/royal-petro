import { css } from '@emotion/react'
import { Icon, IconButton, Label } from '@fluentui/react'
import get from 'lodash.get'
import React, {
  Context,
  FC,
  Suspense,
  useContext,
  useEffect,
  useRef,
} from 'react'
import CRUD from 'src/migrate/pkgs/web/crud/src/CRUD'
import { weakUpdate } from 'src/migrate/pkgs/web/crud/src/form/BaseForm'
import { Loading } from 'src/migrate/pkgs/web/crud/src/view/loading'
import { IAdminSingle } from 'src/migrate/pkgs/web/ext/types/admin'
import { ITableRelation } from 'src/migrate/pkgs/web/ext/types/qlist'
import { ICRUDContext } from 'src/migrate/pkgs/web/ext/types/__crud'
import { IBaseFormContext } from 'src/migrate/pkgs/web/ext/types/__form'
import { niceCase } from 'src/migrate/pkgs/web/utils/src/niceCase'
import { useRender } from 'src/migrate/pkgs/web/utils/src/useRender'

const TabNotAvailable = () => {
  return (
    <div className="flex flex-1 items-center flex-col justify-center opacity-75">
      <Icon
        iconName="PageLink"
        css={css`
          font-size: 32px;
        `}
      />
      <Label className="text-center">Tab Not Available</Label>
    </div>
  )
}

export const WFormTab = ({
  ctx,
  onSize,
  size,
  onLoad,
}: {
  ctx: Context<IBaseFormContext>
  size?: 'max' | 'min' | 'original' | 'hide'
  onSize?: (size: 'max' | 'min' | 'original' | 'hide') => void
  onLoad?: (tabs: any) => void
}) => {
  const state = useContext(ctx)

  const _ = useRef({
    init: false,
    tabs: [] as string[],
    contents: [] as (FC | null)[],
  })

  const meta = _.current
  const render = useRender()
  
  useEffect(() => {
    const parent = state.tree.parent as ICRUDContext
    let hideTab = false

    if (parent?.crud.content.hash !== false && location.hash === '#new')
      hideTab = true

    if (!hideTab) {
      meta.init = true
      let tabs = state.config.tab.list

      if (typeof state.config.tab.modifier === 'function') {
        tabs = state.config.tab.modifier({
          tabs,
        })
      }

      meta.tabs = []
      meta.contents = []
      tabs.map((e) => {
        if (typeof e === 'string' && state.db.definition) {
          const rel: ITableRelation = { ...state.db.definition.rels[e] }

          if (rel) {
            let title = niceCase(rel.modelClass)
            const alter: any = state.config.alter[e]

            if (typeof alter === 'object') {
              title = alter.title
            }

            meta.tabs.push(title)
            meta.contents.push(() => {
              let pk = ''

              for (let v of Object.values(state.db.definition?.columns || {})) {
                if (v.pk) {
                  pk = v.name
                }
              }

              if (pk) {
                const toTable = rel.join.to.split('.').shift() || ''
                const to = rel.join.to.split('.').pop() || ''
                const from = rel.join.from.split('.').pop() || ''
                const fromId = state.db.data[from]

                const tableParams =
                  get(alter, 'fieldProps.list.table.params') || {}

                const crudProp: IAdminSingle = {
                  table: rel.modelClass,
                  form: {
                    onLoad: async (row, opt) => {
                      if (typeof row[toTable] !== 'object') row[toTable] = {}
                      row[toTable] = {
                        connect: {
                          [from]: fromId,
                        },
                      }
                    },
                  },
                  list: {
                    params: {
                      where: {
                        ...tableParams['where'],
                        [to]: fromId,
                      },
                      include: tableParams['include'],
                    },
                  },
                }
                if (alter === undefined) weakUpdate(crudProp, {})
                else weakUpdate(crudProp, alter.fieldProps || {})

                if (fromId) {
                  return (
                    <div
                      className="flex self-stretch flex-1"
                      css={css`
                        .form-back-btn {
                          border-top-left-radius: 0px;
                          border-bottom-left-radius: 0px;
                          border: 1px solid #ccc;
                          border-left: 0px;
                        }
                        .filter-picker-btn {
                          border-left: 0px;
                        }
                      `}
                    >
                      <CRUD
                        isChildren={true}
                        content={{
                          [title]: crudProp,
                        }}
                        parentCtx={ctx}
                      />
                    </div>
                  )
                }

                return <TabNotAvailable />
              }

              return null
            })
          }
        } else if (typeof e === 'object') {
          meta.tabs.push(e.title)
          meta.contents.push(() => {
            let final = <TabNotAvailable />

            try {
              const TabComponent = e.component
              final = (
                <ErrorBoundary>
                  <Suspense fallback={<Loading />}>
                    <TabComponent state={state} />
                  </Suspense>
                </ErrorBoundary>
              )
            } catch (e) {
              console.error(e)
            }

            return final
          })
        }

        return null
      })

      if (onLoad) {
        onLoad(meta.tabs)
      }
    }
    render()
  }, [state.config.tab.list, state.config.tab.list.length, location.hash])
  if (!meta.init) return null

  if (meta.tabs.length === 1) {
    const Content = meta.contents[0] as any
    if (Content) return <Content />
    return null
  }

  return (
    <PureTab
      onSize={onSize}
      size={size}
      tabs={meta.tabs
        .map((e, idx) => {
          if (meta.contents[idx])
            return {
              title: e,
              component: meta.contents[idx],
            }
          return {
            title: '',
            component: () => {
              return <></>
            },
          }
        })
        .filter((e) => !!e.title)}
      position={state.config.tab.position}
    />
  )
}
export const PureTab = ({
  active,
  tabs,
  onChange,
  size,
  onSize,
  position,
}: {
  active?: string
  onSize?: (size: 'max' | 'min' | 'original' | 'hide') => void
  onChange?: (tab: string) => void
  size?: 'max' | 'min' | 'original' | 'hide'
  tabs: {
    title: string
    component: FC | null
  }[]
  position: IBaseFormContext['config']['tab']['position']
}) => {
  const w = window as any
  const _ = useRef({
    init: false,
    current: {
      tab: '',
      index: -1,
    },
    size: -1,
    el: null as HTMLDivElement | null,
    tabs: tabs.map((e) => {
      return typeof e === 'string' ? e : e.title
    }),
  })
  const meta = _.current

  const render = useRender()

  const reloadTab = () => {
    setTimeout(() => {
      if (meta.el) {
        const el = meta.el
        const c = meta.el.children[0] as HTMLDivElement

        if (
          el.parentElement &&
          el.parentElement.parentElement &&
          (el.offsetWidth < c.offsetWidth + 5 || el.offsetWidth < 120)
        ) {
          el.parentElement.parentElement.style.minWidth =
            Math.max(120, c.offsetWidth) + 5 + 'px'
        }

        c.style.position = 'absolute;'
      }
    }, 100)
  }
  useEffect(() => {
    meta.tabs = tabs.map((e) => {
      return typeof e === 'string' ? e : e.title
    })
    render()

    if (!meta.init && (position === 'left' || position === 'right')) {
      reloadTab()
    }
  }, [tabs])
  useEffect(() => {
    let c = 0

    const currentTabIdx =
      localStorage.getItem(`w-form-tab:${w.router.current[0]}`) || '0'

    if (typeof active !== 'undefined' || currentTabIdx) {
      for (let [idx, tab] of Object.entries(meta.tabs) as any) {
        if (tab === active || idx === currentTabIdx) {
          c = parseInt(idx)
          break
        }
      }
    } else {
      c = 0
    }

    if (c >= 0) {
      meta.current.tab = meta.tabs[c]
      meta.current.index = c
    }

    meta.init = true
    render()

    setTimeout(() => {
      const el = meta.el
      if (el) {
        const q = el.querySelector(`.ms-Label:nth-of-type(${c})`)
        q?.scrollIntoView()
      }
    })
  }, [active])

  if (!meta.init) return null
  const pos = position || 'top'
  const Content = tabs[meta.current.index]
    ? tabs[meta.current.index].component
    : null
  const children = Content !== null ? <Content /> : <></>

  const isMin = size === 'min'

  const tabEl = (
    <div
      ref={(e) => {
        if (e) {
          meta.el = e
        }
      }}
      className={
        `pure-tab ${pos} flex-1 flex relative ` +
        {
          left: 'flex-col items-end',
          right: 'flex-col items-start',
          top: 'flex-row items-end',
          bottom: 'flex-row items-start',
        }[pos]
      }
      css={tabElCss}
    >
      <div
        className={
          'flex tab-inner inset-0 ' + (isMin ? 'overflow-hidden size-min' : '')
        }
      >
        {onSize && <div className="sub-head relative spacer"></div>}

        {meta.tabs.map((e, idx) => {
          return (
            <Label
              key={idx}
              onClick={() => {
                meta.current.tab = e
                meta.current.index = idx
                localStorage.setItem(
                  `w-form-tab:${w.router.current[0]}`,
                  idx.toString()
                )
                render()

                if (onChange) {
                  onChange(e)
                }
              }}
              className={`${meta.current.tab === e ? 'active' : ''} ${
                isMin ? 'invisible' : ''
              } tab-item whitespace-nowrap border border-gray-300 hover:bg-blue-100`}
            >
              {e}
            </Label>
          )
        })}
      </div>
      {onSize && (
        <div
          css={css`
            top: 0px;
            left: 0px;
            right: 0px;
            height: 40px;
          `}
          className="absolute  "
        >
          <div
            className="flex items-center justify-between "
            css={css`
              height: 40px;
              background: #f3f4f6;
              border-bottom: 1px solid #ddd;
              i {
                color: #999;
              }
            `}
          >
            <IconButton
              iconProps={{
                iconName: 'Pin',
              }}
              onClick={() => {
                onSize('hide')
                reloadTab()
              }}
            />
            <div className="flex">
              <IconButton
                iconProps={{
                  iconName: 'Download',
                }}
                onClick={() => {
                  onSize('min')
                }}
              />
              <IconButton
                iconProps={{
                  iconName: 'GripperBarHorizontal',
                }}
                onClick={() => {
                  onSize('original')
                }}
              />
              <IconButton
                iconProps={{
                  iconName: 'Upload',
                }}
                onClick={() => {
                  onSize('max')
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const tabContent = [
    size === 'hide' ? (
      <div
        className="hidden-tab-btn flex select-none items-center justify-center cursor-pointer"
        css={css`
          width: 30px;
          border-left: 1px solid white;
          border-right: 1px solid #ddd;
          background: #f3f4f6;
          &:hover {
            background: #d7e4fd;
          }
        `}
        onClick={() => {
          if (onSize) {
            onSize('original')
            render()
            reloadTab()
          }
        }}
      >
        <Icon iconName="ReleaseGate" />
      </div>
    ) : (
      tabEl
    ),
    !isMin ? (
      children
    ) : (
      <div className="flex items-center overflow-auto flex-nowrap">
        {meta.tabs.map((e, idx) => {
          return (
            <Label
              key={idx}
              onClick={() => {
                meta.current.tab = e
                meta.current.index = idx
                render()

                if (onSize) onSize('original')
                if (onChange) {
                  onChange(e)
                }
              }}
              css={css`
                white-space: nowrap;
                cursor: pointer;
                border: 1px solid #bebebe;
                margin: 0px 0px 0px 5px;
                padding-left: 10px;
                padding-right: 10px;
                color: #52667c;
                background: #f3f7fa;

                &:hover {
                  background: linear-gradient(
                    180deg,
                    rgba(255, 255, 255, 1) 30%,
                    #e4edf5 100%
                  );
                }
              `}
            >
              {e}
            </Label>
          )
        })}
      </div>
    ),
  ]

  return (
    <div
      className={`flex self-stretch items-stretch ${
        {
          left: 'flex-row',
          top: 'flex-col',
          right: 'flex-row-reverse',
          bottom: 'flex-col-reverse',
        }[pos]
      }`}
      css={css`
        .split-divider {
          background: transparent;
        }

        .split-master {
          ${{
            left: css`
              overflow-x: hidden;
              overflow-y: auto;
            `,
            right: css`
              overflow-x: hidden;
              overflow-y: auto;
            `,
            bottom: css`
              overflow-y: hidden;
              overflow-x: auto;
            `,
            top: css`
              overflow-y: hidden;
              overflow-x: auto;
            `,
          }[pos]}
        }
      `}
    >
      {Content === null || !tabs[meta.current.index] ? (
        tabEl
      ) : (
        <>
          <div className="flex flex-1 flex-row self-stretch items-stretch">
            {size !== 'min' && (
              <div
                className="flex"
                css={css`
                  min-width: 125px;
                `}
              >
                {tabContent[0]}
              </div>
            )}
            <div
              className="flex-1 flex"
              css={css`
                > * {
                  flex: 1;
                }
              `}
            >
              {tabContent[1]}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

class ErrorBoundary extends React.Component<any, any> {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
    }
  }

  componentDidCatch(error, info) {
    this.setState({
      hasError: true,
    })
  }

  render() {
    if (this.state.hasError) {
      return null
    }

    return this.props.children
  }
}

const tabElCss = css`
  .tab-item {
    cursor: pointer;
    user-select: none;
    position: relative;
  }

  &.top {
    border-bottom: 1px solid #bebebe;
    .tab-item {
      border-bottom: 0px;
      margin: 0px 0px 0px 5px;
      padding: 3px 8px;
      color: #777;

      &.active {
        border-color: #bebebe;
        background: rgb(255, 255, 255);
        background: linear-gradient(
          0deg,
          rgba(255, 255, 255, 1) 30%,
          #e4edf5 100%
        );
        color: #0d4e98;
      }
      &.active::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0px;
        right: 0px;
        height: 2px;
        background: white;
      }
    }
  }

  &.right {
    border-left: 1px solid #bebebe;

    .tab-inner {
      align-self: stretch;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .tab-item {
      width: 97%;
      height: 35px;
      line-height: 28px;
      color: #777;
      border-left: 0px;
      padding: 3px 10px;
      margin-top: 3px;
      align-items: center;
      text-align: left;

      &.active {
        border-color: #bebebe;
        background: rgb(255, 255, 255);
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 1) 30%,
          #e4edf5 100%
        );
        color: #0d4e98;
      }
      &.active::after {
        content: '';
        position: absolute;
        left: -2px;
        top: 0px;
        bottom: 0px;
        width: 2px;
        background: white;
      }
    }
  }
  &.left {
    border-right: 1px solid #bebebe;
    .tab-inner {
      display: flex;
      align-self: stretch;
      flex-direction: column;
      align-items: flex-end;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .tab-item {
      width: 100%;
      border: 0px;
      height: 40px;
      line-height: 40px;
      border-bottom: 1px solid #bebebe;
      padding: 0px 10px;

      color: #787878;
      &.active {
        border-color: #bebebe;
        background: rgb(255, 255, 255);
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 1) 30%,
          #e4edf5 100%
        );
        color: #0d4e98;

        &:before {
          transition: all 0.2s;
          height: 100%;
          top: 0px;
          position: absolute;
          content: '';
          display: block;
          left: 0px;
          bottom: 0px;
          width: 2px;
          background: #6099da;
        }
      }
      &.active:hover {
        &:before {
          height: 70%;
          top: 15%;
        }
      }
      &.active::after {
        content: '';
        position: absolute;
        right: -2px;
        top: 0px;
        bottom: 0px;
        width: 2px;
        background: white;
      }
    }
  }

  &.bottom {
    border-top: 1px solid #bebebe;
    .tab-item {
      border-top: 0px;
      margin: 0px 0px 0px 5px;
      padding: 3px 8px;

      &.active {
        border-color: #bebebe;
        background: rgb(255, 255, 255);
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 1) 30%,
          #e4edf5 100%
        );
      }
      &.active::after {
        content: '';
        position: absolute;
        top: -2px;
        left: 0px;
        right: 0px;
        height: 2px;
        background: white;
      }
    }
  }
  &.right .tab-item {
    width: 90%;
    margin: 2px 0px 0px 0px;
    padding: 3px 3px;
    text-align: left;
    border-left: 0px;
  }

  .sub-head {
    min-height: 40px;
    width: 100%;
    background: #f3f4f6;
  }
`
