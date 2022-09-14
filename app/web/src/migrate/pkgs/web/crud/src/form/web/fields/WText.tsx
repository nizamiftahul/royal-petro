import { css } from '@emotion/react'
import { TextField } from '@fluentui/react'
import get from 'lodash.get'
import set from 'lodash.set'
import { useContext, useEffect, useRef } from 'react'
import formatSeparatorDec from 'src/libs/format/formatSeparatorDec'
import type { IBaseFieldProps } from 'src/migrate/pkgs/web/ext/types/__form'
import { useRender } from 'src/migrate/pkgs/web/utils/src/useRender'
import type { BaseWindow } from 'types/window'
declare const window: BaseWindow
export const WText = ({ name, internalChange, ctx }: IBaseFieldProps) => {
  const _ = useRef({
    init: false,
    value: '',
  })

  const meta = _.current
  const form = useContext(ctx)
  const field = form.config.fields[name]
  const render = useRender()

  if (!field) {
    return null
  }

  const state = field.state
  useEffect(() => {
    meta.value = state.value || ''

    meta.init = true
    render()
  }, [state.value])

  let type = 'text'
  let rows = 1

  if (!!state.fieldProps && !!state.fieldProps.rows)
    rows = state.fieldProps.rows

  let autoAdjustHeight = true
  if (state.type === 'password') type = 'password'
  if (state.type === 'number') {
    type = 'number'
  }

  if (!meta.init) return <>not init</>

  let label = meta.value
  if (state.type === 'money') {
    label = money(meta.value)
  }

  const onChange = (_, text) => {
    set(form.db.data, name, text)
    let value = get(form.db.data, name)
    if (typeof state.onChange === 'function')
      state.onChange(value, {
        state: form,
        row: form.db.data,
        col: name,
      })
    if (value && ['number', 'money'].indexOf(state.type) >= 0) {
      let result = parseFloat(
        value
          .replace(/\./g, '')
          .replace(',', '.')
          .replace(/[^\d\.]/g, '')
          .replace(/\./, 'x')
          .replace(/x/, '.')
      )
      set(form.db.data, name, result)
    }

    if (value && ['decimal'].indexOf(state.type) >= 0) {
      let cols = Number(
        value
          .replace(',', '.')
          .replace(/[^\d\.]/g, '')
          .replace(/\./, 'x')
          .replace(/\./g, '')
          .replace(/x/, '.')
      )
      set(form.db.data, name, cols)
    }

    meta.value = value || ''
    internalChange(value)
    render()
  }

  return (
    <>
      <TextField
        name={name}
        css={css`
          .ms-TextField-fieldGroup,
          textarea {
            min-height: 30px !important;
          }
        `}
        {...(state.fieldProps as any)}
        value={label}
        type={type}
        onKeyDown={(e) => {
          if (['money'].indexOf(state.type) >= 0) {
            if (e.key === '.') {
              e.stopPropagation()
              e.preventDefault()
            }
          }
          if (e.key === 'Enter' && state.type !== 'multiline') {
            e.stopPropagation()
            e.preventDefault()
            state.parent?.db.save()
          }
        }}
        multiline={state.type === 'multiline'}
        autoAdjustHeight={autoAdjustHeight}
        rows={rows}
        canRevealPassword={true}
        onChange={onChange}
      />
    </>
  )
}

export const money = (angka: string | number) => {
  let rupiah = ''
  if (!parseFloat(angka.toString().replace(/\D/g, ''))) return '-'
  if (!angka) {
    return '-'
  } else {
    let price = 0
    let left_side = ''
    let right_side = ''
    price = detectionNumberFormat(angka)
    let input_val = ''
    if (
      angka.toString().indexOf('.') >= 0 ||
      angka.toString().indexOf(',') >= 0
    ) {
      var decimal_pos = angka.toString().indexOf(',')
      left_side = angka.toString().substring(0, decimal_pos)
      left_side = left_side
        ? left_side
        : angka.toString().substring(0, angka.toString().indexOf('.'))
      left_side.toString().replace('.', '')
      left_side = formatNumber(left_side.toString().replace('.', ''))

      const splitDot = angka.toString().split('.')[1]
      const splitCom = angka.toString().split(',')[1]
      const validateDot = (angka.toString().match(new RegExp('str', 'g')) || [])
        .length
      const validateCom = angka.toString().indexOf(',')
      let right_side_t = ''
      if (validateCom > 0) {
        right_side_t = splitCom.substring(0, 3)
      } else {
        if (splitDot) right_side_t = splitDot.substring(0, 3)
        else if (splitCom) right_side_t = splitCom.substring(0, 3)
      }
      input_val = left_side + ',' + right_side_t
    } else {
      input_val = formatNumber(angka)
    }
    return input_val
  }
}
export const detectionNumberFormat = (angka) => {
  let price = null as any
  let left_side = ''
  let right_side = ''
  switch (true) {
    case (angka.toString().match(/\,/g) || []).length == 1:
      // Case angka dari hasil generate, mengubah , menjadi .
      // Split string to array with key character ','
      left_side = angka.toString().split(',')[0]
      right_side = angka.toString().split(',')[1]
      left_side = left_side.replace(/\D/g, '')
      right_side = right_side.replace(/\D/g, '')
      price = parseFloat(left_side + '.' + right_side)
      break
    case (angka.toString().match(/\,/g) || []).length > 1:
      // Case angka dari hasil generate, mengubah , menjadi .
      // Split string to array with key character ','
      left_side = angka.toString().split(',')[0]
      right_side = (
        angka
          .toString()
          .split(',')
          .filter((v, index) => index !== 0) || []
      ).join('')
      left_side = left_side.replace(/\D/g, '')
      right_side = right_side.replace(/\D/g, '')
      price = parseFloat(left_side + '.' + right_side)
      break
    default:
      price = parseFloat(angka.toString())
  }
  return price
}
function formatNumber(n) {
  return n
    .toString()
    .replace(/\D/g, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
