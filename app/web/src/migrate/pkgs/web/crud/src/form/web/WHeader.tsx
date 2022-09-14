import { css } from '@emotion/react'
import { Callout, Icon, Label, PrimaryButton } from '@fluentui/react'
import { ReactElement, useEffect } from 'react'
import { defaultActions } from 'src/migrate/pkgs/web/crud/src/form/BaseForm'
import { lang } from 'src/migrate/pkgs/web/crud/src/lang/lang'
import {
  IBaseFormContext,
  IBaseFormProps,
} from 'src/migrate/pkgs/web/ext/types/__form'
import { useRender } from 'src/migrate/pkgs/web/utils/src/useRender'
import { BaseWindow } from 'types/window'
import { useLocal, waitUntil } from 'web-utils'
import { Actions } from './WActions'
declare const window: BaseWindow

export const WHeader = ({
  state,
  title,
  meta,
  ext,
  parentRender,
}: {
  state: IBaseFormContext
  title: IBaseFormProps['title']
  ext?: ({ local, render, meta }) => ReactElement
  meta: any
  parentRender: () => void
}) => {
  const local = useLocal({
    actionMode: '',
    actionShow: true,
  })
  useEffect(() => {
    if (state.db.saveStatus.indexOf('error') > 0) {
      waitUntil(() => meta.error.el).then(() => {
        meta.error.show = true
        render()
        return
      })
    }
  }, [state.db.saveStatus])
  const render = useRender()
  state.config.header.render = render
  const action =
    typeof state.config.header.action === 'function'
      ? { ...defaultActions, ...state.config.header.action(state) }
      : state.config.header.action

  const im = state.config.import
  // f3f4f6
  return (
    <div
      className="flex items-stretch justify-between relative"
      css={css`
        flex-grow: 0;
        background: #f3f4f6;
        border-bottom: 1px solid #ececeb;
        flex-basis: 40px;
        min-height: 40px;
        ${state.db.saveStatus.indexOf('error') > 0 &&
        css`
          border-bottom: 2px solid red;
          background-image: linear-gradient(
            45deg,
            #ffdbdb 4.55%,
            #ffffff 4.55%,
            #ffffff 50%,
            #ffdbdb 50%,
            #ffdbdb 54.55%,
            #ffffff 54.55%,
            #ffffff 100%
          );
          background-size: 15.56px 15.56px;
        `}

        ${state.db.saveStatus === 'changed' &&
        css`
          border-bottom: 2px solid #f4dbff;
          background-image: linear-gradient(
            45deg,
            #f4dbff 4.55%,
            #ffffff 4.55%,
            #ffffff 50%,
            #f4dbff 50%,
            #f4dbff 54.55%,
            #ffffff 54.55%,
            #ffffff 100%
          );
          background-size: 15.56px 15.56px;
        `}
          ${state.db.saveStatus === 'saving' &&
        css`
          border-bottom: 2px solid #dbe9ff;
          background-image: linear-gradient(
            45deg,
            #dbe9ff 4.55%,
            #ffffff 4.55%,
            #ffffff 50%,
            #dbe9ff 50%,
            #dbe9ff 54.55%,
            #ffffff 54.55%,
            #ffffff 100%
          );
          background-size: 15.56px 15.56px;
        `}
      `}
    >
      <div
        className="flex-row flex items-center cursor-pointer  transition-opacity form-back-btn select-none"
        css={css`
          border-radius: 4px;
          background: white;
          margin: 5px 5px 5px 0px;
          padding: 0px 10px;
          &:hover {
            opacity: 0.5;
          }
        `}
      >
        {state.config.header.back && (
          <Icon iconName="ChevronLeft" className={`pr-2`} />
        )}
        {title && (
          <Label
            className="cursor-pointer whitespace-nowrap"
            onClick={() => {
              if (state.config.header?.back) {
                state.config.header.back({
                  state,
                  row: state.db.data,
                })
              }
            }}
          >
            {typeof title === 'function'
              ? title({
                  state,
                  row: state.db.data,
                })
              : title}
          </Label>
        )}
      </div>
      {ext && ext({ local, render, meta })}

      <div
        className="flex-row justify-end flex-1 flex"
        ref={(e) => {
          if (e) {
            if (meta.action.container === null) {
              meta.action.container = e
              parentRender()
            }
          }
        }}
      >
        <div className="flex flex-row flex-1 items-center justify-center">
          {state.db.saveStatus.indexOf('error') > 0 && (
            <>
              <div
                className="flex items-center px-6 my-1 ml-4 text-xs font-semibold text-red-500 bg-white border-2 cursor-pointer hover:bg-red-100 border-red-500 rounded-md"
                onClick={() => {
                  meta.error.show = !meta.error.show
                  render()
                }}
                ref={(e) => {
                  if (e) meta.error.el = e
                }}
              >
                <Icon iconName="WarningSolid" className="mr-1" css={css``} />
                {lang('Save Failed', 'en')}
              </div>
              {meta.error.show && meta.error.el && (
                <Callout
                  target={meta.error.el}
                  onDismiss={() => {
                    meta.error.show = false
                    render()
                  }}
                  isBeakVisible={false}
                >
                  {state.db.saveErrorMsg ? (
                    <pre
                      className="p-2 whitespace-pre-wrap text-red-700 border-2 border-red-300"
                      css={css`
                        max-width: 700px;
                        max-height: 500px;
                        overflow: auto;
                        font-weight: 500;
                        font-size: 10px;
                      `}
                    >
                      {state.db.saveErrorMsg}
                    </pre>
                  ) : (
                    <div className="p-2 whitespace-pre-wrap text-red-700 border-2 border-red-300">
                      <b>{lang(`Please correct these data:`, 'en')}</b>
                      <br />
                      {state.db.errors.map((e) => `  • ${e}`).join('\n')}
                    </div>
                  )}
                </Callout>
              )}
            </>
          )}
          {state.db.saveStatus === 'changed' && (
            <div className="flex items-center px-6 my-1 ml-4 text-xs font-semibold text-purple-500 bg-white border-2 border-purple-500 rounded-md">
              {lang('UNSAVED', 'en')}
            </div>
          )}

          {state.db.saveStatus === 'saving' && (
            <div className="flex items-center px-6 my-1 ml-4 text-xs font-semibold text-blue-500 bg-white border-2 border-blue-300 rounded-md">
              {lang('SAVING', 'en')}
            </div>
          )}

          {im && (
            <div className="flex items-center px-6 my-1 ml-4 text-xs font-semibold text-white bg-green-600 border-green-700 border-2 rounded-md">
              {lang('IMPORTING', 'en')} {im.list.length} DATA
            </div>
          )}
        </div>
        {meta.action.container &&
          local.actionShow &&
          state.db.saveStatus !== 'saving' && (
            <Actions
              icon={'PageEdit'}
              iconCSS={css`
                margin-top: 3px;
                color: #999;
              `}
              onModeChanged={(mode) => {
                local.actionMode = mode
                local.render()
              }}
              state={state}
              width={meta.action.container.offsetWidth - 200}
              action={action}
            >
              {local.actionMode === 'dropdown' && !!action['save'] && (
                <PrimaryButton
                  css={css`
                    margin-right: 6px;
                    height: 30px;
                  `}
                  className="save"
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
                  {typeof action['save'] === 'string' ? action['save'] : 'Save'}
                </PrimaryButton>
              )}
            </Actions>
          )}
      </div>
    </div>
  )
}
