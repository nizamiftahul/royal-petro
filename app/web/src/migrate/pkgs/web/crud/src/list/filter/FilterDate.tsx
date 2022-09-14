import { css } from '@emotion/react'
import { DatePicker, Icon, Label, TextField } from '@fluentui/react'
import sub from 'date-fns/esm/sub'
import add from 'date-fns/esm/add'
import setDate from 'date-fns/esm/set'
import formatDate from 'date-fns/esm/format'
import set from 'lodash.set'
import { FC, useContext, useRef } from 'react'
import { shortFormatDate } from 'src/migrate/pkgs/web/utils/src/formatDate'
import {
  IFilterDate,
  IFilterItem,
  IFilterItemText,
  IFilterProp,
} from 'src/migrate/pkgs/web/ext/types/__filter'
import {
  IBaseFilterDef,
  IBaseListContext,
} from 'src/migrate/pkgs/web/ext/types/__list'
import { getFilterDef } from './FilterSingle'
import PureSelect from '../../form/web/fields/PureSelect'
export const queryFilterDate: IBaseFilterDef['modifyQuery'] = (props) => {
  const { params, instance: i, name } = props
  const instance = i as IFilterDate

  if (instance.value instanceof Date) {
    if (instance.operator === 'daily') {
      const now = setDate(new Date(instance.value), {
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      })

      const next = add(now, {
        days: 2,
      })
      set(params.where, name, {
        gte: sub(next, { days: 1 }),
        lt: next,
      })
    } else if (instance.operator === 'monthly') {
      const now = setDate(new Date(instance.value), {
        date: 1,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      })
      const next = add(now, {
        months: 1,
      })
      set(params.where, name, {
        gte: now,
        lt: next,
      })
    }
  }
}
export const FilterDateModifier: FC<{
  state: IBaseListContext
  filter: IFilterItem
  render: () => void
}> = ({ filter, state, render }) => {
  return (
    <div
      className="flex border-0 h-full border-l border-gray-300 items-stretch"
      css={css`
        margin: -5px -10px -5px 10px;
        > div {
          margin-top: -2px;
        }
      `}
    >
      <div
        className=" flex flex-1 items-center justify-center pl-2 pr-1 hover:opacity-50"
        onClickCapture={(e) => {
          e.stopPropagation()
          e.preventDefault()
          let now = filter.value
          let range: any = filter
          let pass = true
          let operator = { daily: 'days', monthly: 'months' }[filter.operator]
          let value = sub(now, {
            [operator]: 1,
          })
          if (range.min)
            if (value <= new Date(range.min)) {
              pass = false
            }
          if (pass) {
            if (!filter.value) {
              filter.value = new Date()
            } else {
              filter.value = sub(filter.value, {
                [operator]: 1,
              })
            }
            state.db.query()
          }
          render()
        }}
      >
        <Icon iconName="ChevronLeft" />
      </div>
      <div
        className=" flex flex-1 items-center justify-center pl-1 pr-2 hover:opacity-50"
        onClickCapture={(e) => {
          e.stopPropagation()
          e.preventDefault()
          let now = filter.value
          let range: any = filter
          let pass = true
          let operator = { daily: 'days', monthly: 'months' }[filter.operator]
          let value = sub(now, {
            [operator]: 1,
          })
          // console.log(range.max)
          if (range.max) {
            if (value >= new Date(range.max)) {
              console.log('asdd')
              pass = false
            }
          }
          if (pass) {
            if (!filter.value) {
              filter.value = new Date()
            } else {
              filter.value = add(filter.value, {
                [operator]: 1,
              })
            }
            state.db.query()
          }
          render()
        }}
      >
        <Icon iconName="ChevronRight" />
      </div>
    </div>
  )
}
export const FilterDate = ({
  ctx,
  name,
  children,
  onSubmit,
}: IFilterProp<IFilterDate>) => {
  const state = useContext(ctx)
  const filter: any = state.filter.instances[name]
  const def = getFilterDef(name, state)

  const _ = useRef({
    originalValue: filter.value,
    month: '',
    year: '',
  })

  const meta = _.current
  const render = state.filter.instances[name].render

  const submit = () => {
    onSubmit()
    render()

    if (meta.originalValue !== filter.value) {
      state.db.query('filter date')
    }
  }
  // console.log({ filter })
  return children({
    name,
    submit,
    modifier: FilterDateModifier,
    FilterInput: (props) => {
      switch (props.operator) {
        case 'monthly':
          const months = [] as { value: string; label: string }[]
          const mdate = new Date()
          for (let i = 0; i < 12; i++) {
            mdate.setMonth(i)
            months.push({
              value: i.toString(),
              label: formatDate(mdate, 'MMMM'),
            })
          }
          months.push({ value: '', label: '' })

          let month = ''
          let year = mdate.getFullYear().toString()
          let date = new Date()

          if (filter.value) {
            date =
              filter.value instanceof Date
                ? filter.value
                : new Date(filter.value)
            month = date.getMonth().toString()
            year = date.getFullYear().toString()
            meta.month = month
          }

          if (meta.year === '') {
            meta.year = year
          }

          return (
            <div className="flex items-center">
              <PureSelect
                items={months}
                value={meta.month}
                css={css`
                  width: 120px;
                `}
                onChange={(val) => {
                  meta.month = val.toString()

                  if (val !== '') {
                    date.setMonth(parseInt(val as string))
                    filter.value = date
                  } else {
                    filter.value = null
                  }
                  submit()
                }}
              />
              <TextField
                type="number"
                defaultValue={meta.year}
                onChange={(e, val) => {
                  if (val) {
                    let year = parseInt(val)
                    if (year) {
                      date.setFullYear(year)
                      filter.value = date
                      meta.year = year.toString()
                      render()
                    }
                  }
                }}
                css={css`
                  width: 70px;
                  .ms-TextField-field {
                    text-align: center;
                    padding-right: 0px;
                    padding-left: 0px;
                  }
                `}
              />
            </div>
          )
      }
      return (
        <DatePicker
          css={css`
            min-width: 120px;
            .ms-TextField > span {
              display: none;
            }
          `}
          placeholder="Pick Date"
          defaultValue={filter.value}
          minDate={filter.min ? new Date(filter.min) : (null as any)}
          maxDate={filter.max ? new Date(filter.max) : (null as any)}
          formatDate={(date) => {
            return shortFormatDate(date || '')
          }}
          onSelectDate={(date) => {
            filter.value = date
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              submit()
            }
          }}
        />
      )
    },
    def,
    filter,
    operators: [
      {
        label: 'Daily',
        value: 'daily',
      },
      {
        label: 'Monthly',
        value: 'monthly',
      },
    ],
    ValueLabel: () => {
      return (
        <Label
          className="filter-label"
          css={
            filter.value &&
            css`
              width: 70px;
            `
          }
        >
          {filter.operator === 'daily'
            ? shortFormatDate(filter.value)
            : formatDate(filter.value, 'MMM YYY')}{' '}
        </Label>
      )
    },
  })
}
