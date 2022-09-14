import { css } from '@emotion/react'
import { ReactElement, useContext, useEffect, useRef } from 'react'
import { BaseWindow } from 'types/window'
import { fastDeepEqual } from 'src/migrate/pkgs/web/utils/src/fastDeepEqual'
import { useRender } from 'src/migrate/pkgs/web/utils/src/useRender'
import {
  IBaseFieldMainProps,
  IBaseFormContext,
  IFormField,
} from 'src/migrate/pkgs/web/ext/types/__form'
import { WFieldWrapper } from './web/WFieldWrapper'
import { lang } from '../lang/lang'
declare const window: BaseWindow
export const BaseField = (props: IBaseFieldMainProps) => {
  const render = useRender()

  const _ = useRef({
    init: false,
    required: {
      promise: null as null | Promise<boolean>,
      result: false,
    },
  })

  const meta = _.current
  const parent = useContext(props.ctx)
  // console.log('===>')
  // console.log(parent)
  // console.log(props)
  const state = parent.config.fields[props.name].state
  // console.log({ state, parent })
  state.parent = parent
  state.render = render
  useEffect(() => {
    ;(async () => {
      for (let [k, v] of Object.entries(props)) {
        if (['name', 'ctx', 'wrapper', 'children'].indexOf(k) < 0) {
          state[k] = v
        }
      }

      meta.init = true
      render()
    })()
  }, [])
  if (!meta.init || state.type === 'has-many') return null
  if (parent.config.tab.list.indexOf(state.name) >= 0) return null
  let FieldWrapper = WFieldWrapper as any

  if (props.wrapper) {
    FieldWrapper = props.wrapper
  }

  let Field = parent.fieldTypes[state.type]
  let isSection = false

  if (state.name.indexOf('::') === 0) {
    isSection = true
    Field = parent.fieldTypes['section']
  }

  if (!Field) {
    Field = parent.fieldTypes['unknown']
  }

  const internalChange = (value: any) => {
    parent.db.saveStatus = 'changed'
    if (parent.config.header && parent.config.header.render)
      parent.config.header.render()

    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      state.required
    ) {
      if (state.error.indexOf('cannot be blank') >= 0) {
        state.error = ''
      }
    }

    state.isChanged = false

    if (
      typeof state.undoValue === 'object' ||
      typeof state.value === 'object'
    ) {
      if (!fastDeepEqual(state.undoValue, state.value)) {
        state.isChanged = true
      }
    } else {
      if (state.undoValue !== state.value) {
        state.isChanged = true
      }
    }

    render()

    if (parent.config.watches[state.name]) {
      parent.config.watches[state.name].forEach((renderField) => {
        renderField()
      })
    }
  }

  const renderField: any = (
    <PrefixSuffix
      state={parent}
      prefix={state.prefix}
      suffix={state.suffix}
      name={props.name}
    >
      {props.children ? (
        props.children
      ) : (
        <Field
          name={state.name}
          internalChange={internalChange}
          ctx={props.ctx}
        />
      )}
    </PrefixSuffix>
  )

  if (typeof state.required === 'function') {
    if (meta.required.promise) {
      meta.required.promise = null
    } else {
      const res = state.required({
        state: parent,
        row: parent.db.data,
        col: props.name,
      })

      if (res instanceof Promise) {
        meta.required.promise = res
        res.then((e) => {
          meta.required.result = e
          render()
        })
        return null
      } else {
        meta.required.result = res
      }
    }
  } else {
    meta.required.result = state.required
  }

  let renderedTitle =
    typeof state.title === 'function'
      ? state.title({
          row: parent.db.data,
          state,
        })
      : state.title
  return isSection ? (
    renderField
  ) : (
    <FieldWrapper
      state={state}
      internalChange={internalChange}
      title={renderedTitle}
      required={meta.required.result}
      error={state.error}
      type={state.type}
      readonly={state.readonly}
    >
      {renderField}
    </FieldWrapper>
  )
}

const PrefixSuffix = ({
  children,
  suffix,
  prefix,
  state,
  name,
}: {
  state: IBaseFormContext
  children: ReactElement
  name: string
  prefix?: IFormField['state']['prefix']
  suffix?: IFormField['state']['suffix']
}) => {
  if (suffix || prefix) {
    return (
      <div
        className="flex flex-1 relative items-stretch"
        css={css`
          height: 32px;

          .presufix {
            border: 1px solid #333;
          }
          ${state.config.fields[name].state.readonly &&
          css`
            .presufix {
              color: #888;
              background: white !important;
              border-color: #ccc !important;
              border-left: 1px solid #ccc !important;
            }
          `}

          ${prefix &&
          css`
            .ms-TextField-fieldGroup {
              border-top-left-radius: 0px;
              border-bottom-left-radius: 0px;
            }
          `}

          ${suffix &&
          css`
            .ms-TextField-fieldGroup {
              border-top-right-radius: 0px;
              border-bottom-right-radius: 0px;
            }
          `}
        `}
      >
        {prefix && (
          <FieldFix mode="prefix" state={state} name={name}>
            {prefix}
          </FieldFix>
        )}
        <div
          className="flex items-stretch flex-1"
          css={css`
            > * {
              flex: 1;
            }
          `}
        >
          {children}
        </div>
        {suffix && (
          <FieldFix mode="suffix" state={state} name={name}>
            {suffix}
          </FieldFix>
        )}
      </div>
    )
  }

  return children
}

const FieldFix = ({
  children,
  state,
  mode,
  name,
}: {
  mode: 'suffix' | 'prefix'
  state: IBaseFormContext
  name: string
  children: IFormField['state']['suffix']
}) => {
  let el: ReactElement | null = null

  if (typeof children === 'function') {
    el = children({
      state,
      row: state.db.data,
      value: state.db.data[name],
    })
  } else {
    el = <>{children}</>
  }

  if (el) {
    return (
      <div
        className="presufix flex items-center border px-2 border-gray-700 bg-gray-100 rounded-sm"
        css={
          mode === 'prefix'
            ? css`
                border-top-right-radius: 0px;
                border-bottom-right-radius: 0px;
                border-right: 0px;
                margin-right: -2px;
              `
            : css`
                border-top-left-radius: 0px;
                border-bottom-left-radius: 0px;
                border-left: 0px;
                margin-left: -2px;
              `
        }
      >
        {el}
      </div>
    )
  }

  return null
}
