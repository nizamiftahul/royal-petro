import { css } from '@emotion/react'
import {
  Callout,
  DefaultButton,
  DirectionalHint,
  Icon,
  Label,
  PrimaryButton,
  Spinner,
} from '@fluentui/react'
import { waitUntil } from 'web-utils'
import get from 'lodash.get'
import { Context, useContext, useEffect, useRef } from 'react'
import { BaseWindow } from 'types/window'
import { useRender } from 'src/migrate/pkgs/web/utils/src/useRender'
import { IBaseListContext } from 'src/migrate/pkgs/web/ext/types/__list'
import {
  FilterSingle,
  initializeSingleFilter,
} from 'src/migrate/pkgs/web/crud/src/list/filter/FilterSingle'
import PureSelect from '../../../form/web/fields/PureSelect'
import { useMediaQuery } from 'react-responsive'
import { ICRUDContext } from 'src/migrate/pkgs/web/ext/types/__crud'
import { Actions } from '../../../form/web/WActions'
declare const window: BaseWindow
export const BaseFilterTopBar = ({
  ctx,
}: {
  ctx: Context<IBaseListContext>
}) => {
  const isMobile = useMediaQuery({
    maxWidth: 1224,
  })
  const _ = useRef({
    el: {
      calloutBoxDiv: null as any,
      filterBtn: null as any,
    },
    picker: false,
    show: '',
    splitSize: 50,
    container: null as HTMLDivElement | null,
    orderedColumns: [] as string[],

    get visibleFilters() {
      return meta.orderedColumns.filter(
        (e) =>
          state.filter.instances[e].visible ||
          get(state.filter, `alter.${e}.visible`) === true
      )
    },

    renderedFilters: [] as any[],
  })

  const meta = _.current
  const state = useContext(ctx)
  const render = useRender()
  useEffect(() => {
    meta.orderedColumns = [] as string[]

    for (let v of state.filter.columns) {
      const col = typeof v === 'string' ? v : v[0]
      if (col.indexOf('__') == 0) continue

      if (get(state.filter.instances[col], 'value')) {
        meta.orderedColumns.unshift(col)
      } else {
        meta.orderedColumns.push(col)
      }
    }

    renderFilters()
  }, [])

  const renderFilters = () => {
    const filters = [...meta.visibleFilters]

    const parent = state.tree.parent as ICRUDContext
    if (parent && parent.crud) {
      const fltrs = get(parent.crud, 'content.filters')
      if (fltrs) {
        for (let f of fltrs) {
          if (f['name']) {
            const filterAdded =
              state.filter.columns.filter((e) => e[0] === f['name']).length > 0

            if (!filterAdded) {
              initializeSingleFilter(state, f['name'], render, f)
              state.filter.columns.unshift([f['name'], f])
            }
            filters.unshift(f['name'])
          }
        }
      }
    }

    meta.renderedFilters = filters.map((e, idx) => {
      return (
        <FilterSingle
          key={idx}
          filter={e}
          ctx={ctx}
          onSubmit={() => {
            meta.show = ''
            renderFilters()
          }}
        >
          {({
            ValueLabel,
            FilterInput,
            filter,
            submit,
            modifier,
            operators,
            def,
            name,
          }) => {
            if (filter.type === 'tab') {
              return <FilterInput {...filter} />
            }

            const Modifier = modifier
            return (
              <div className="filter-item flex items-stretch">
                {meta.show === name && (
                  <Callout
                    target={meta.el[name]}
                    isBeakVisible={false}
                    onDismiss={() => {
                      meta.show = ''
                      renderFilters()
                    }}
                  >
                    <div className="p-2 flex flex-col items-stretch">
                      {operators.length > 1 && (
                        <div
                          css={css`
                            .pure-select {
                              margin: -5px 0px 2px 0px;
                              > i {
                                font-size: 12px;
                                font-weight: bold;
                                padding: 0px;
                                margin: 7px 4px;
                              }

                              .ms-TextField-fieldGroup {
                                border: 0px;
                                &::after {
                                  display: none;
                                }
                                input {
                                  font-size: 13px;
                                  font-weight: 600;
                                  padding: 0px;
                                }
                              }
                            }
                          `}
                        >
                          <PureSelect
                            value={filter.operator}
                            onChange={(e) => {
                              filter.operator = e
                              renderFilters()
                            }}
                            items={operators.map((e) => {
                              return {
                                label: e.label,
                                value: e.value,
                              }
                            })}
                          />
                        </div>
                      )}
                      <div
                        className="flex flex-row"
                        ref={(el) => {
                          if (el) {
                            meta.el.calloutBoxDiv = el
                          }
                        }}
                      >
                        <FilterInput {...filter} />
                        <PrimaryButton
                          css={css`
                            font-size: 12px;
                            margin-left: 5px;
                            min-width: 30px;
                          `}
                          onClick={() => {
                            submit()
                          }}
                        >
                          Go
                        </PrimaryButton>
                      </div>
                    </div>
                  </Callout>
                )}
                <div
                  ref={(e) => {
                    meta.el[name] = e
                  }}
                  onClick={() => {
                    meta.show = name
                    renderFilters()
                    waitUntil(() => meta.el.calloutBoxDiv).then(() => {
                      const input = meta.el.calloutBoxDiv.querySelector('input')

                      if (input) {
                        input.focus()
                      }
                    })
                  }}
                  className="flex flex-row ms-Button select-none"
                  css={css`
                    padding: 0px 10px;
                    min-width: 0px;
                    margin-left: 5px;
                    height: 30px;
                    align-items: center;
                    border: 1px solid #ddd;
                    overflow: hidden;
                    border-radius: 2px;
                    cursor: pointer !important;
                    outline: none !important;

                    &:hover {
                      border: 1px solid #0d4e98 !important;
                    }

                    ${!!filter.value &&
                    css`
                      border: 1px solid #0d4e98 !important;
                      background: rgb(255, 255, 255);
                      background: linear-gradient(
                        0deg,
                        rgba(255, 255, 255, 1) 30%,
                        #e4edf5 100%
                      );
                    `}
                    .ms-Button {
                      border: 0px;
                    }

                    > .ms-Dropdown-container > .ms-Dropdown-title {
                      background: transparent;
                    }

                    .ms-Label {
                      cursor: pointer !important;
                      white-space: nowrap;
                      font-weight: normal;
                      font-size: 14px;
                      color: ${!!filter.value ? '#0D4E98' : '#666'};
                    }
                    .filter-label {
                      margin-left: 5px;
                      font-weight: 600;
                    }
                  `}
                >
                  <Label>
                    {def.title}
                    {filter.value ? ':' : ''}
                  </Label>
                  {filter.value && <ValueLabel />}
                  {Modifier && (
                    <Modifier
                      state={state}
                      filter={filter}
                      render={renderFilters}
                    />
                  )}
                </div>

                {!!filter.value && (
                  <div
                    onClick={async () => {
                      filter.value = undefined
                      renderFilters()
                      await state.db.query('filter submit')
                      renderFilters()
                    }}
                    className="flex items-center rounded-sm border cursor-pointer"
                    css={css`
                      border: 1px solid #0d4e98;
                      margin-left: -2px;
                      border-top-left-radius: 0px;
                      border-bottom-left-radius: 0px;
                      padding: 0px 8px 0px 8px;
                      background: rgb(255, 255, 255);
                      background: linear-gradient(
                        0deg,
                        rgba(255, 255, 255, 1) 30%,
                        #e4edf5 100%
                      );

                      &:hover {
                        background: linear-gradient(
                          0deg,
                          rgba(255, 255, 255, 1) 30%,
                          #f5e4e4 100%
                        );
                        i {
                          color: #ff5101;
                        }
                      }
                    `}
                  >
                    <Icon
                      iconName="ChromeClose"
                      css={css`
                        color: #718cac;
                        font-weight: 600;
                        font-size: 9px;
                        padding-top: 2px;
                      `}
                    ></Icon>
                  </div>
                )}
              </div>
            )
          }}
        </FilterSingle>
      )
    })
    render()
  }

  return (
    <div className="flex flex-1 flex-row justify-between">
      <div
        className={
          'filter-header flex items-center relative ' +
          (isMobile ? 'flex-1' : '')
        }
      >
        {get(state, 'filter.web.selector') && (
          <div
            ref={(e) => {
              if (e) {
                meta.el.filterBtn = e as any
              }
            }}
          >
            <DefaultButton
              iconProps={{
                iconName: 'BacklogList',
              }}
              onClick={() => {
                meta.picker = true
                renderFilters()
              }}
              id={'filter'}
              className="filter-picker-btn"
              css={css`
                padding: 0px 8px 0px 5px;
                color: #555;
                border-color: #ccc;
                height: 30px;
                min-width: unset;
                border-top-left-radius: 0px;
                border-bottom-left-radius: 0px;
                .ms-Button-textContainer {
                  display: flex;
                  align-self: stretch;
                  align-items: center;
                }
                .ms-Button-label {
                  display: flex;
                  font-size: 13px;
                  align-items: center;
                  padding: 0px 0px 2px 0px;
                  margin: 0px;
                }
                @media only screen and (max-width: 600px) {
                  border-left: 0px;
                }
              `}
            >
              {meta.visibleFilters.length <= 0 && 'Filter'}
            </DefaultButton>
          </div>
        )}

        {meta.picker && (
          <Callout
            onDismiss={() => {
              meta.picker = !meta.picker
              renderFilters()
            }}
            directionalHint={DirectionalHint.bottomLeftEdge}
            isBeakVisible={false}
            target={meta.el.filterBtn}
          >
            <div
              css={css`
                min-width: 200px;
              `}
            >
              {meta.orderedColumns.map((col, idx) => {
                const alterVisible = get(state.filter, `alter.${col}.visible`)
                if (
                  typeof alterVisible !== 'undefined' &&
                  alterVisible !== 'auto'
                )
                  return null
                return (
                  <Label
                    key={idx}
                    className="px-2 py-1 select-none cursor-pointer border-0 border-gray-300 border-b flex items-center"
                    onClick={() => {
                      state.filter.instances[col].visible =
                        !state.filter.instances[col].visible
                      const visibleCachePath = `filter-visible-${
                        (window as any).cms_id
                      }.${state.tree.getPath()}.${col}`

                      if (state.filter.instances[col].visible) {
                        localStorage[visibleCachePath] = 'y'
                      } else {
                        localStorage.removeItem(visibleCachePath)
                      }

                      renderFilters()
                    }}
                  >
                    <Icon
                      iconName={
                        state.filter.instances[col].visible
                          ? 'CheckboxCompositeReversed'
                          : 'Checkbox'
                      }
                      className="mr-2"
                    />
                    <span>{state.filter.instances[col].title}</span>
                  </Label>
                )
              })}
            </div>
          </Callout>
        )}
        {isMobile ? (
          <div className="flex flex-1 self-stretch overflow-auto relative">
            <div className="absolute inset-0 flex flex-nowrap items-center">
              {meta.renderedFilters}
            </div>
          </div>
        ) : (
          meta.renderedFilters
        )}
      </div>
      <div
        className={'flex items-center justify-end'}
        css={
          isMobile
            ? css`
                min-width: 100px;
              `
            : css`
                flex: 1;
              `
        }
        ref={(e) => {
          if (e && meta.container !== e) {
            meta.container = e
            waitUntil(
              () => meta.container && meta.container.offsetWidth > 0
            ).then(renderFilters)
          }
        }}
      >
        {meta.container && meta.container.offsetWidth > 0 && (
          <Actions
            width={meta.container.offsetWidth}
            state={state}
            action={state.header?.action as any}
          />
        )}
      </div>
    </div>
  )
}
