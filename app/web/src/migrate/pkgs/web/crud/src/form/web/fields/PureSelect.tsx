import { css } from '@emotion/react'
import { Callout, Icon, Label, Spinner, TextField } from '@fluentui/react'
import React, { FC, ReactElement, useEffect, useRef, useState } from 'react'
import { useMediaQuery } from 'react-responsive'
import { BaseList } from 'src/migrate/pkgs/web/crud/src/list/BaseList'
import { useLocal, waitUntil } from 'web-utils'
import { WBox } from './Winfo'

const getEl = (row: any) => {
  return typeof row === 'object' ? row.el : null
}

const getLabel = (row: any, resolvedLabel) => {
  if (typeof row === 'object' && row.label instanceof Promise) {
    return resolvedLabel[row.value] || 'Loading...'
  }
  return (typeof row === 'object' ? row.label || (row as any).text : row) + ''
}

const getValue = (row: any) => {
  const type = typeof row

  if (type === 'object') {
    return row.value || (row as any).key
  }
  return row.value
}

export default (props: {
  value: string | number
  onChange: (value: string | number, label: string) => void
  onDropDown?: (value: string | number) => void
  loading?: boolean
  className?: any
  items: (
    | string
    | {
        value: string
        label: string
        el?: ReactElement
      }
  )[]
}) => {
  const { items, value, loading, onDropDown, onChange } = props

  const isMobile = useMediaQuery({
    maxWidth: 1224,
  })

  const meta = useLocal({
    init: false,
    label: '',
    el: null,
    open: false,
    picked: false,
    items: [] as (
      | string
      | {
          value: string
          label: string
          el?: ReactElement
        }
    )[],
    blurTimeout: 0,
    selectedIndex: -1,
    ref: null as null | HTMLDivElement,
    popout: null as null | HTMLDivElement,
    resolvedLabel: {} as any,
  })

  useEffect(() => {
    meta.items = items.sort((a, b) => {
      if (typeof a === 'object' && typeof b === 'object') {
        if (a.label !== undefined && b.label !== undefined) {
          return a.label > b.label ? 1 : -1
        } else {
          return a.label !== undefined ? 1 : -1
        }
      }
      return a > b ? 1 : -1
    })
    let found = false

    const pickValue = (row: any, idx: any) => {
      meta.selectedIndex = parseInt(idx)
      meta.label = getLabel(row, meta.resolvedLabel)
      meta.el = getEl(row)
      found = true
    }

    for (let [idx, row] of Object.entries(meta.items)) {
      const rowValue = getValue(row)

      if (typeof rowValue === 'boolean') {
        if (!!value && !!rowValue) {
          pickValue(row, idx)
          break
        } else if (!value && !rowValue) {
          pickValue(row, idx)
          break
        }
      } else {
        if (rowValue === value) {
          pickValue(row, idx)
          break
        }
      }
    }

    if (!found) {
      meta.selectedIndex = -1
      meta.el = null
      meta.label = ''
    }

    meta.render()
    meta.init = true

    if (meta.open && meta.ref) {
      const input = meta.ref.querySelector('input')

      if (input) {
        input.focus()
        input.setSelectionRange(0, input.value.length)
      }
    }
  }, [items, value])

  const focusSelected = () => {
    waitUntil(() => meta.popout).then(() => {
      if (meta.popout) {
        const first = meta.popout.querySelector(`[data-list-index="0"]`)
        const container = meta.popout.querySelector(
          '.ms-ScrollablePane--contentContainer'
        )
        if (container && first) {
          container.scrollTop = first?.clientHeight * meta.selectedIndex
        }
      }
    })
  }

  if (!meta.init) return null

  if (loading)
    return (
      <WBox className="pure-select">
        <div className="flex items-center">
          <Spinner />
          <Label className="text-xs text-blue-300 ml-2">Loading...</Label>
        </div>
      </WBox>
    )

  const list = meta.items.map((e) => {
    if (typeof e === 'object') {
      return {
        el: e.el || null,
        value: e.value || (e as any).key,
        label: e.label || (e as any).text,
      }
    }

    return {
      el: null,
      value: e,
      label: e,
    }
  })

  return (
    <div
      ref={(e) => {
        if (e) {
          meta.ref = e
        }
      }}
      className={`${
        props.className || ''
      } pure-select flex flex-1  relative items-stretch`}
      css={css`
        > div {
          flex: 1;
        }
        input {
          cursor: pointer;
          background: transparent;
          color: #333;
        }
      `}
    >
      <>
        <Icon
          iconName="ChevronDown"
          className="absolute bg-white bottom-0 top-0 flex items-center justify-center right-0 m-1 pointer-events-none z-10"
          css={css`
            padding: 1px 8px;
          `}
        />
        {meta.el && (
          <div
            className="absolute inset-0 z-10 pointer-events-none flex bg-white"
            css={css`
              right: 40px;
              margin: 2px;
              label {
                font-size: 14px;
              }
            `}
          >
            <Label className="flex-1 flex self-stretch items-center px-2">
              {meta.el}
            </Label>
          </div>
        )}

        <TextField
          value={meta.label || ''}
          spellCheck={false}
          onFocus={(e) => {
            if (isMobile) return
            e.target.setSelectionRange(0, e.target.value.length)
            meta.el = null
            meta.render()
          }}
          autoComplete={'off'}
          onKeyDown={async (e) => {
            if (e.key === 'ArrowUp') {
              if (!meta.open) {
                meta.open = true
                if (onDropDown) onDropDown(value)
              }

              e.preventDefault()
              e.stopPropagation()
              meta.selectedIndex =
                meta.selectedIndex <= 0
                  ? meta.items.length - 1
                  : meta.selectedIndex - 1
              meta.render()
              focusSelected()
            } else if (e.key === 'ArrowDown') {
              if (!meta.open) {
                meta.open = true
              }

              e.preventDefault()
              e.stopPropagation()
              meta.selectedIndex =
                meta.selectedIndex < meta.items.length - 1
                  ? meta.selectedIndex + 1
                  : 0
              meta.render()
              focusSelected()
            } else if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()

              if (!meta.open) {
                meta.open = true
                if (onDropDown) onDropDown(value)
              } else {
                meta.open = false
                let sel = meta.items[meta.selectedIndex]

                if (!sel) {
                  sel = meta.items[0]
                }

                if (sel) {
                  meta.label = getLabel(sel, meta.resolvedLabel)
                  if (onChange) {
                    onChange(getValue(sel), meta.label)
                  }
                }
              }

              meta.render()
            }
          }}
          onChange={(_, text) => {
            if (typeof text === 'string') {
              meta.open = true
              if (onDropDown) onDropDown(value)
              meta.label = text
              meta.el = null
              meta.items =
                text.length > 0
                  ? items.filter((row) => {
                      return fuzzyMatch(
                        meta.label,
                        getLabel(row, meta.resolvedLabel)
                      )
                    })
                  : items
              meta.render()
            }
          }}
          onClick={() => {
            meta.open = true
            if (onDropDown) onDropDown(value)
            meta.render()
            if (!isMobile) {
              setTimeout(() => {
                focusSelected()
              }, 300)
            }
          }}
        />
      </>
      {meta.open && meta.ref && (
        <Callout
          isBeakVisible={false}
          target={meta.ref}
          minPagePadding={2}
          onDismiss={() => {
            meta.open = false
            meta.render()
          }}
        >
          <div
            ref={(e) => {
              if (e) meta.popout = e
            }}
            className="flex items-stretch flex-1"
            css={css`
              width: ${meta.ref.offsetWidth}px;
              min-width: 170px;
              max-height: 300px;
              ${meta.items.length === 0
                ? css`
                    min-height: 80px;
                  `
                : css`
                    height: ${meta.items.length * 32}px;
                  `}
            `}
          >
            <BaseList
              filter={false}
              columns={({ row, index }) => {
                const label = useRef(row.label)
                return (
                  <Label
                    onClick={() => {
                      meta.open = false
                      meta.picked = true
                      const value = row.value

                      if (onChange) {
                        onChange(value, label.current)
                      }

                      meta.render()
                    }}
                    className={`flex flex-1 self-stretch px-2 cursor-pointer ${
                      meta.selectedIndex === index ? 'active' : ''
                    }`}
                    css={css`
                      &.active {
                        background-color: #f0faf3;
                        &::after {
                          content: '✓';
                          background: white;
                          border-radius: 5px;
                          border-top-right-radius: 0px;
                          border-bottom-right-radius: 0px;
                          color: green;
                          padding: 0px 10px;
                          position: absolute;
                          right: 0px;
                        }
                      }
                      &:hover {
                        background-color: #e7f3fd;
                      }
                    `}
                  >
                    <PromisedLabel
                      label={row.el || row.label}
                      onResolve={(resolvedLabel) => {
                        label.current = resolvedLabel
                        const item = meta.items[index] as any
                        meta.resolvedLabel[row.value] = resolvedLabel
                        if (item && item.label) {
                          item.label = resolvedLabel
                        }
                      }}
                    />
                  </Label>
                )
              }}
              list={list}
            />
          </div>
        </Callout>
      )}
    </div>
  )
}

const PromisedLabel: FC<{
  label: string | ReactElement | Promise<string | ReactElement>

  onResolve: (val: any) => void
}> = ({ label, onResolve }) => {
  const [L, setL] = useState('Loading...')

  if (label instanceof Promise) {
    if (L === 'Loading...') {
      label.then((e) => {
        if (onResolve) {
          onResolve(e)
        }
        setL(e as any)
      })
    }
    return <>{L}</>
  }
  return <>{label}</>
}

export const fuzzyMatch = function (needle, haystack) {
  if (needle === '' || haystack === '') return true
  needle = needle.toLowerCase().replace(/ /g, '')
  haystack = haystack.toLowerCase() // All characters in needle must be present in haystack
  var j = 0 // haystack position

  for (var i = 0; i < needle.length; i++) {
    // Go down the haystack until we find the current needle character
    while (needle[i] !== haystack[j]) {
      j++ // If we reached the end of the haystack, then this is not a match

      if (j === haystack.length) {
        return false
      }
    } // Here, needle character is same as haystack character
    //console.log(needle + ":" + i + " === " + haystack + ":" + j);
  } // At this point, we have matched every single letter in the needle without returning false

  return true
}
