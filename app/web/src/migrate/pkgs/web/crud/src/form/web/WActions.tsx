import { css } from '@emotion/react'
import {
  Callout,
  DefaultButton,
  Icon,
  Label,
  PrimaryButton,
  SpinnerSize,
  Spinner,
} from '@fluentui/react'
import differenceInSeconds from 'date-fns/differenceInSeconds'
import timeago from 'date-fns/formatDistance'
import get from 'lodash.get'
import {
  Fragment,
  isValidElement,
  ReactElement,
  useLayoutEffect,
  useRef,
} from 'react'
import { ICRUDContext } from 'src/migrate/pkgs/web/ext/types/__crud'
import {
  IAction,
  IBaseFormContext,
} from 'src/migrate/pkgs/web/ext/types/__form'
import { IBaseListContext } from 'src/migrate/pkgs/web/ext/types/__list'
import { api } from 'src/migrate/pkgs/web/utils/src/api'
import { useRender } from 'src/migrate/pkgs/web/utils/src/useRender'
import { waitUntil } from 'web-utils'
import { lang } from '../../lang/lang'
import { WActionOptions } from './WActionOptions'

export const Actions = ({
  width,
  action,
  state,
  icon,
  onModeChanged,
  iconCSS,
  children,
}: {
  width: number
  children?: any
  icon?: string
  iconCSS?: any
  onModeChanged?: (mode: 'dropdown' | 'menu' | '') => void
  action: IAction
  state: IBaseFormContext | IBaseListContext
}) => {
  const _ = useRef({
    callout: false,
    options: {
      ref: null as any,
      popup: false,
    },
    mode: '' as 'dropdown' | 'menu' | '',
    el: {
      menu: null as null | HTMLDivElement,
      target: null as null | HTMLDivElement,
    },
    mv: {
      server: {
        now: 0,
        ts: 0,
        init: false,
      },
      timer: 0 as any,
      startTimer: 0,
    },
    actionCount: 0,
    children: null as null | ReactElement,
    init: false,
  })

  const meta = _.current
  const render = useRender()
  useLayoutEffect(() => {
    if (!!meta.children && !meta.init) {
      waitUntil(
        () => meta.el && meta.el.menu && meta.el.menu.offsetWidth > 0
      ).then(async () => {
        if (
          meta.el &&
          meta.el.menu &&
          meta.el.menu.offsetWidth > width &&
          meta.actionCount > 2
        ) {
          meta.mode = 'dropdown'
        } else {
          meta.mode = 'menu'
        }

        if (onModeChanged) onModeChanged(meta.mode)

        meta.init = true
        render()
      })
    }
  }, [meta.children])
  let actionCount = 0

  if (state.component.type === 'list') {
    const s = state as IBaseListContext
    if (s.header) {
      s.header.render = render
    }
  }

  if (typeof action === 'object') {
    const actions = Object.entries(action)

    if (action.custom) {
      for (let k of Object.keys(actions) as any) {
        if (actions[k] && actions[k][0] === 'custom') {
          actions.splice(k, 1)
          break
        }
      }

      actions.unshift(['custom', action.custom])
    }

    meta.children = (
      <>
        {actions
          .map(([name, result]) => {
            if (result === false) return null

            if (typeof result === 'function') {
              result = result({
                state,
                save: (state as IBaseFormContext).db.save,
                data: (state as IBaseFormContext).db.data,
              })
            }

            if (name === 'other') {
              return null
            }

            if (result === true || typeof result === 'string') {
              actionCount++

              switch (name) {
                case 'create':
                  const s = state as IBaseListContext
                  if (s.table.web.massDelete) {
                    const sel = s.table.web.selection
                    return (
                      <Fragment key={name}>
                        {sel && sel.getSelectedCount() > 0 && (
                          <PrimaryButton
                            className="delete"
                            iconProps={{
                              iconName: 'Trash',
                            }}
                            onClick={async () => {
                              const def = state.db.definition
                              if (def) {
                                if (
                                  confirm(lang('Apakah Anda Yakin ?', 'id'))
                                ) {
                                  await db[state.db.tableName || ''].deleteMany(
                                    {
                                      where: {
                                        [def.pk]: {
                                          in: sel
                                            .getSelection()
                                            .map((e) => e[def.pk]),
                                        },
                                      },
                                    }
                                  )

                                  s.table.web.massDelete = false
                                  s.table.web.checkbox = false
                                  s.component.render()

                                  await state.db.query()
                                }
                              }
                            }}
                          >
                            {meta.mode === 'dropdown' ? 'Delete' : undefined}{' '}
                            Delete {sel?.getSelectedCount()} Data
                          </PrimaryButton>
                        )}

                        <PrimaryButton
                          onClick={() => {
                            s.table.web.massDelete = false
                            s.table.web.checkbox = false
                            s.component.render()
                          }}
                        >
                          Cancel
                        </PrimaryButton>
                      </Fragment>
                    )

                    return null
                  }
                  return (
                    <PrimaryButton
                      className="create"
                      key={name}
                      iconProps={{
                        iconName: 'Add',
                      }}
                      onClick={() => {
                        const parent = state.tree.parent as ICRUDContext

                        if (
                          !get(parent, 'tree.parent') &&
                          parent.crud.content.hash !== false
                        ) {
                          location.hash = '#new'
                        }

                        parent.crud.setMode('form', {})
                        parent.component.render()
                      }}
                    >
                      {typeof result === 'string' ? result : 'Create'}
                    </PrimaryButton>
                  )

                case 'save':
                  return (
                    <PrimaryButton
                      className="save"
                      key={name}
                      iconProps={{
                        iconName: 'Save',
                      }}
                      onClick={() => {
                        const form: IBaseFormContext = state as any

                        if (form.db.save) {
                          form.db.save()
                        }
                      }}
                    >
                      {typeof result === 'string' ? result : 'Save'}
                    </PrimaryButton>
                  )

                case 'delete': {
                  const form: IBaseFormContext = state as any

                  if (form.db.definition && form.db.definition.pk) {
                    if (!form.db.data[form.db.definition.pk]) {
                      return null
                    }
                  }

                  return (
                    <DefaultButton
                      className="delete"
                      key={name}
                      iconProps={{
                        iconName: 'Trash',
                      }}
                      onClick={async () => {
                        await form.db.delete()
                      }}
                    >
                      {meta.mode === 'dropdown' ? 'Delete' : undefined}
                    </DefaultButton>
                  )
                }
              }
            }

            if (Array.isArray(result)) {
              return (
                <Fragment key={name}>
                  {result.map((e, idx) => {
                    if (typeof e === 'function') {
                      const customAction = e({
                        state: state,
                        save: state.db['save'],
                        data: state.db['data'],
                      })

                      if (isValidElement(customAction)) {
                        actionCount++
                      }

                      return <Fragment key={idx}>{customAction}</Fragment>
                    }

                    actionCount++
                    return <Fragment key={idx}>{e}</Fragment>
                  })}
                </Fragment>
              )
            }

            if (isValidElement(result)) {
              return <Fragment key={name}>{result}</Fragment>
            }

            actionCount++
            return <Fragment key={name}>{result}</Fragment>
          })
          .filter((e) => !!e)}
      </>
    )
  }

  meta.actionCount = actionCount

  const actionsOther = [] as string[]

  let showActionOther = true
  if (state.component.type === 'list') {
    const s = state as IBaseListContext
    const action = s.header?.action

    if (s.db.loading) {
      showActionOther = false
      if (s.db.paging.fetching) {
        showActionOther = true
      }
    }

    if (action) {
      if (action.export !== false) {
        actionsOther.push('export')
      }

      if (action.create !== false) {
        actionsOther.push('mass-delete')
      }

      if (action.mv === true) {
        actionsOther.push('mv')
        if (!meta.mv.server.init) {
          meta.mv.server.init = true
          api(`/__mv/read/${state.db.tableName}`).then((e) => {
            meta.mv.server.now = e.now
            meta.mv.server.ts = e.ts
            render()
          })
        }
      }

      if (action.extra === false) {
        actionsOther.splice(0, actionsOther.length)
      }
    }
  } else if (state.component.type === 'form') {
    const s = state as IBaseFormContext
    if (s.db.loading) {
      showActionOther = false
    }
    let action = get(s, 'config.header.action', {}) as IAction
    if (typeof action === 'function') {
      action = (action as any)(state)
    }

    if (action.copy !== false) {
      actionsOther.push('copy')
    }
    if (action.paste !== false) {
      actionsOther.push('paste')
    }

    if (action.import !== false) {
      actionsOther.push('import')
    }

    if (action.extra === false) {
      actionsOther.splice(0, actionsOther.length)
    }
  }

  return (
    <div
      className="flex self-stretch relative"
      css={css`
        .ms-Button {
          padding: 0px 5px;

          .ms-Label {
            white-space: nowrap;
          }
          .ms-Button-flexContainer {
            &::before {
              content: '';
              height: 25px;
              width: 0px;
              display: flex;
            }
          }
        }
      `}
    >
      <div
        className={`overflow-x-auto overflow-y-hidden text-right ${
          meta.mode === 'menu'
            ? 'opacity-1'
            : `opacity-0 pointer-events-none ${meta.init ? 'hidden' : ''}`
        }`}
      >
        <div
          ref={(e) => {
            if (e) {
              meta.el.menu = e
            }
          }}
          className="inline-flex self-stretch flex-row justify-end items-center flex-nowrap "
          css={css`
            height: 39px;
            padding-right: 8px;

            .ms-Button {
              padding: 0px 3px;
              max-height: 28px;
              align-items: center;
              border: 0px;

              min-width: 20px;
              height: 33px;

              .ms-Button-flexContainer {
                display: flex;
                align-items: center;

                .ms-Icon {
                  align-self: center;
                  margin-top: 1px;
                }
                .ms-Icon,
                .ms-Button-textContainer {
                  display: flex;
                  flex-direction: row;
                  align-items: center;
                  font-size: 13px;
                }
                .ms-Label {
                  font-size: 13px;
                  text-decoration: none;
                }
              }
              &:not(.ms-Button--primary) {
                &:not(.other) {
                  &:not(.delete) {
                    cursor: pointer;
                    padding-right: 5px;
                    &::after {
                      content: '';
                      position: absolute;
                      border-radius: 2px;
                      top: 0;
                      left: 0;
                      bottom: 0;
                      right: 0;
                      border: 1px solid #a3bee6;
                    }

                    &:hover {
                      background: #eef2ff;
                    }
                    .ms-Icon,
                    .ms-Label {
                      cursor: pointer;
                      color: #0078d4;
                    }
                  }
                }
              }

              &.delete {
                background: white;
                border: 1px solid #d35a5a;
                color: #a53333;

                .ms-Icon {
                  color: red;
                }
                opacity: 0.8;
                &:hover {
                  background: #fff0f0;
                  opacity: 1;
                }
              }
            }
            > * {
              margin-left: 4px;
              margin-right: 0px;
            }
          `}
        >
          {actionsOther.includes('mv') && (
            <>
              {meta.mv.timer ? (
                <div className="flex items-center space-x-2 text-xs text-blue-500">
                  <Spinner size={SpinnerSize.small} />
                  <div>Querying Data...</div>
                </div>
              ) : (
                <div
                  className="flex flex-row items-center text-xs text-blue-500 pr-2 cursor-pointer rounded-sm select-none border-blue-300 mr-2 border bg-blue-50"
                  onClick={async () => {
                    const s = state as IBaseListContext
                    meta.mv.startTimer = new Date() as any
                    const updateTimer = () => {
                      s.table.web.popup = {
                        loading: true,
                        text: (
                          <div className="flex flex-col items-center">
                            <div>Querying Data</div>
                            <div className="text-2xl">
                              {differenceInSeconds(
                                new Date(),
                                meta.mv.startTimer
                              )}
                            </div>
                            <div>Do not Refresh</div>
                          </div>
                        ) as any,
                      }
                      s.component.render()
                    }
                    updateTimer()
                    meta.mv.timer = setInterval(updateTimer, 500)
                    s.component.render()
                    await db.query(
                      `REFRESH MATERIALIZED VIEW ${s.db.tableName}`
                    )
                    await s.db.query()
                    clearInterval(meta.mv.timer)
                    meta.mv.timer = 0
                    s.table.web.popup = { loading: false, text: '' }
                    await api(`/__mv/write/${s.db.tableName}`)
                    const e = await api(`/__mv/read/${state.db.tableName}`)
                    meta.mv.server.now = e.now
                    meta.mv.server.ts = e.ts
                    render()
                  }}
                >
                  <Icon iconName="Refresh" className="text-sm px-2 font-bold" />
                  <div
                    className="flex flex-col"
                    css={css`
                      line-height: 0.8rem;
                      padding: 3px 0px;
                    `}
                  >
                    <div className="flex">Last Refresh:</div>
                    <div className="flex items-center space-x-1 ">
                      <span className="font-medium">
                        {!meta.mv.server.ts
                          ? 'Never - Very Old Data'
                          : `${timeago(
                              meta.mv.server.now,
                              meta.mv.server.ts
                            )} ago`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {children}
          {meta.children}
          {actionsOther.length > 0 && (
            <PrimaryButton
              onClick={(el) => {
                let target = el.target as HTMLElement

                while (!target.classList.contains('ms-Button')) {
                  if (target.parentElement) target = target.parentElement
                  else break
                }
                meta.options.ref = target
                meta.options.popup = true
                render()
              }}
              iconProps={{ iconName: 'ChevronDown' }}
            />
          )}
        </div>
      </div>

      {meta.options.popup && (
        <Callout
          target={meta.options.ref}
          backgroundColor="#0078d4"
          beakWidth={8}
          onDismiss={() => {
            meta.options.popup = false
            render()
          }}
        >
          <WActionOptions
            actions={actionsOther}
            state={state}
            meta={meta}
            render={render}
          />
        </Callout>
      )}
      {meta.mode === 'dropdown' && (
        <div className="flex flex-1 items-center justify-end ">
          {children}
          <div
            ref={(e) => {
              if (e) meta.el.target = e
            }}
          >
            <Label
              onClick={(e) => {
                meta.callout = !meta.callout
                render()
              }}
              className={`flex whitespace-nowrap items-center px-2 cursor-pointer border bg-white border-gray-300 relative select-none ${
                meta.callout ? 'active' : ''
              }`}
              css={css`
                border: 1px solid #ccc;
                border-right: 0px;
                &:hover,
                &.active {
                  border-color: #bebebe;
                  background: rgb(255, 255, 255);
                  background: linear-gradient(
                    0deg,
                    rgba(255, 255, 255, 1) 30%,
                    #e4edf5 100%
                  );
                }
              `}
            >
              {icon && (
                <Icon
                  iconName={icon}
                  css={css`
                    margin-right: 8px;
                    font-size: 14px;
                    ${iconCSS ? iconCSS : ''}
                  `}
                />
              )}
              {meta.actionCount} Actions{' '}
              <Icon
                iconName="ChevronDown"
                css={css`
                  margin-left: 8px;
                  font-size: 12px;
                `}
              />
            </Label>
          </div>
          {meta.callout && (
            <Callout
              onDismiss={() => {
                meta.callout = false
                render()
              }}
              isBeakVisible={false}
              target={meta.el.target}
            >
              <div
                className="flex flex-col"
                css={css`
                  padding-bottom: 5px;
                  cursor: pointer;
                  .ms-Button {
                    border: 0px;
                    margin: 0px;
                    padding: 0px 8px 0px 0px;
                    background: none;
                    border: 0px;
                    border-bottom: 1px solid #ccc;
                    border-radius: 0px;
                    align-items: stretch;

                    &:last-child {
                      border-bottom: 0px;
                      margin-bottom: -5px;
                    }

                    &:hover {
                      background: #ececeb;
                    }

                    .ms-Button-flexContainer {
                      flex: 1;
                      justify-content: flex-start;
                    }
                    i {
                      width: 32px;
                      height: 32px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: rgb(0, 120, 212);
                    }
                    i,
                    .ms-Button-label,
                    label {
                      padding: 0px;
                      margin: 0px;
                      cursor: pointer;
                      text-align: left;
                      text-decoration: none;
                      color: rgb(0, 120, 212);
                    }
                  }
                `}
                onClick={() => {
                  meta.callout = false
                }}
              >
                {meta.children}
              </div>
            </Callout>
          )}
        </div>
      )}
    </div>
  )
}
