import { css } from '@emotion/react'
import { Icon, Label } from '@fluentui/react'
import set from 'lodash.set'
import { BaseWindow } from 'types/window'
import { IBaseFieldContext } from 'src/migrate/pkgs/web/ext/types/__form'
declare const window: BaseWindow
export const WFieldWrapper = ({
  title,
  required,
  error,
  internalChange,
  type,
  readonly,
  children,
  state,
}: {
  title: any
  required: boolean
  error: any
  internalChange: any
  type: any
  readonly: boolean
  children: any
  state: IBaseFieldContext
}) => {
  return (
    <div
      className="flex flex-col"
      css={css`
        .clear-btn {
          opacity: 0;
          color: #c51818;
          cursor: pointer;
          padding-left: 10px;
          font-size: 11px;
          user-select: none;
          font-weight: 500;
        }
        .undo-btn {
          color: #0078d4;
        }
        &:hover {
          .clear-btn {
            opacity: 0.3;

            &:hover {
              opacity: 1;
            }
          }
        }
        overflow: hidden;
        > .ms-Label {
          margin: 0px;
          padding: 5px 0px;
          height: 21px;
          box-sizing: content-box;
          font-size: 14px;
          ${error &&
          css`
            color: #c51818;
          `}
        }
      `}
    >
      <div className="flex justify-between flex-row self-stretch items-center">
        {title && (
          <Label
            className={`flex items-center whitespace-nowrap`}
            css={css`
              max-height: 30px;
              ${error &&
              css`
                color: #c51818;
              `}
            `}
          >
            {error && (
              <Icon
                iconName="WarningSolid"
                className="mr-1"
                css={css`
                  margin-top: 3px;
                `}
              />
            )}
            {title}{' '}
            {required && !readonly && (
              <span className="text-red-500 font-bold">*</span>
            )}
          </Label>
        )}

        <div className="flex flex-row">
          {!required && !readonly && (
            <Label
              onClick={() => {
                const form = state.parent
                let name = state.name
                const value = null

                if (type === 'belongs-to') {
                  name = name.split('.').shift() || ''
                }

                if (form) {
                  set(form.db.data, name, value)
                  if (typeof state.onChange === 'function')
                    state.onChange(value, {
                      state: form,
                      row: form.db.data,
                      col: name,
                    })
                  internalChange(value)
                  state.render()
                }
              }}
              className="flex items-center whitespace-nowrap clear-btn"
            >
              <Icon iconName="Delete" /> Clear
            </Label>
          )}

          {state.isChanged && (
            <Label
              onClick={() => {
                const form = state.parent
                let name = state.name
                const value = state.undoValue

                if (type === 'belongs-to') {
                  name = name.split('.').shift() || ''
                }

                if (form) {
                  set(form.db.data, name, value)
                  if (typeof state.onChange === 'function')
                    state.onChange(value, {
                      state: form,
                      row: form.db.data,
                      col: name,
                    })
                  internalChange(value)
                  state.render()
                }
              }}
              className="flex items-center whitespace-nowrap clear-btn undo-btn"
            >
              <Icon iconName="Undo" /> Undo
            </Label>
          )}
        </div>
      </div>
      <div
        className="flex items-stretch"
        css={css`
          min-height: 32px;
          overflow: hidden;
          > div:not(.hidden) {
            flex: 1;
          }

          ${error &&
          css`
            div {
              border-color: #c51818 !important;
            }
          `}

          ${readonly &&
          css`
            div {
              pointer-events: none;
              border-color: #d1d5db !important;
              background-color: #f9fafb !important;
            }
          `}
        `}
      >
        {children}
      </div>
      {error && (
        <Label
          css={css`
            color: red;
          `}
        >
          {error}
        </Label>
      )}
    </div>
  )
}
