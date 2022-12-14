import { css } from '@emotion/react'
import { Context, Fragment, ReactElement } from 'react'
import { BaseWindow } from 'types/window'
import { useRender } from 'src/migrate/pkgs/web/utils/src/useRender'
import {
  IBaseFormContext,
  IFormLayout,
} from 'src/migrate/pkgs/web/ext/types/__form'
import { BaseField } from './BaseField'
import { generateFieldsForLayout, weakUpdate } from './BaseForm'
declare const window: BaseWindow
export const RecursiveLayout = (props: {
  layout: IFormLayout
  state: IBaseFormContext
  ctx: Context<IBaseFormContext>
  direction: 'col' | 'row'
}) => {
  const { layout: _layout, state, ctx, direction } = props
  const childs: ReactElement[] = []
  const layout = Array.isArray(_layout) ? _layout : [_layout]

  for (let s of layout) {
    if (!s) continue

    if (typeof s === 'string') {
      let colName = s
      let overrideTitle = ''

      if (!s.startsWith('::') && s.indexOf(':') > 0) {
        colName = s.split(':').shift() || ''
        overrideTitle = s.split(':').pop() || ''
      }

      const field = state.config.fields[colName]

      if (!field) {
        // console.log('masuk sini kah?')
        generateFieldsForLayout(layout, state, ctx).then(() => {
          state.component.render()
        })
        return null
      }

      if (field) {
        if (overrideTitle) field.state.title = overrideTitle
        if (state.config.fieldOrder.indexOf(colName) < 0)
          state.config.fieldOrder.push(colName)

        if (field.state.customRender) {
          childs.push(
            field.state.customRender({
              row: state.db.data,
              state,
              Component: BaseField,
              props: {
                name: colName,
                ctx: ctx,
              },
            })
          )
        } else {
          childs.push(<BaseField name={colName} ctx={ctx} />)
        }
      }
    } else if (Array.isArray(s)) {
      childs.push(
        <RecursiveLayout
          layout={s}
          state={state}
          ctx={ctx}
          direction={direction === 'row' ? 'col' : 'row'}
        />
      )
    } else if (typeof s === 'function') {
      childs.push(<FuncLayout func={s} state={state} ctx={ctx} />)
    }
  }

  return (
    <div
      className={`flex items-stretch self-stretch ${
        direction === 'row' ? 'space-x-2' : 'space-y-1'
      } flex-${direction}`}
      css={css`
        ${direction === 'row'
          ? css`
              > div:not(.hidden) {
                display: flex;
                flex: 1;
                > ul {
                  &::after {
                    display: none;
                  }
                }
              }
            `
          : css`
              > div > ul {
                &::after {
                  display: none;
                }
              }

              > div:last-of-type {
                > ul {
                  &::after {
                    display: block;
                  }
                }
              }
            `}
      `}
    >
      {childs.map((el, idx) => {
        return <Fragment key={idx}>{el}</Fragment>
      })}
    </div>
  )
}

const FuncLayout = ({
  func,
  state,
  ctx,
}: {
  func: any
  ctx: Context<IBaseFormContext>
  state: IBaseFormContext
}) => {
  const render = useRender()
  return (
    <>
      {func({
        row: state.db.data,
        update: (data: any) => {
          weakUpdate(state.db.data, data)
          state.component.render()
        },
        watch: (fields: string[] = []) => {
          for (let i of fields) {
            if (!state.config.watches[i]) {
              state.config.watches[i] = new Set()
            }

            if (!state.config.watches[i].has(render)) {
              state.config.watches[i].add(render)
            }
          }
        },
        state,
        layout: (childLayout: IFormLayout) => {
          return (
            <RecursiveLayout
              layout={childLayout}
              ctx={ctx}
              state={state}
              direction={'col'}
            />
          )
        },
      })}
    </>
  )
}

export const extractColFromLayout = async (props: {
  layout: IFormLayout
  state: IBaseFormContext
  ctx: Context<IBaseFormContext>
}): Promise<string[]> => {
  const { layout: _layout, state, ctx } = props
  const cols: string[] = []

  const layout = Array.isArray(_layout) ? _layout : [_layout]
  for (let s of layout) {
    if (typeof s === 'string') {
      cols.push(s)
    } else if (Array.isArray(s)) {
      const result = await extractColFromLayout({
        layout: s,
        state,
        ctx,
      })

      for (let i of result) {
        cols.push(i)
      }
    } else if (typeof s === 'function') {
      const promise = new Promise<string[]>((resolve) => {
        if (typeof s === 'function') {
          s({
            row: state.db.data,
            layout: (lyt) => {
              const result = extractColFromLayout({
                layout: lyt,
                state,
                ctx,
              })
              resolve(result)
              return <></>
            },
            state,
            update: () => {},
            watch: () => {},
          })
          setTimeout(() => {
            resolve([])
          }, 100)
        }
      })
      const result = await promise

      for (let i of result) {
        cols.push(i)
      }
    }
  }

  return cols
}
