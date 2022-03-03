import React, { useEffect } from 'react'
import { DatePicker } from 'vtex.styleguide'
import { useIntl } from 'react-intl'

import type { IDatePickerProp } from '../../types/common'

function startOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  )
}

function endOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  )
}

const DateFilter = ({ value, onChange }: IDatePickerProp) => {
  const intl = useIntl()

  useEffect(() => {
    onChange({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    })
  }, [])

  return (
    <div className="flex flex-column w-100">
      <br />
      <DatePicker
        label={intl.formatMessage({
          id: 'seller-dashboard.filter-bar.from',
        })}
        value={value?.from || new Date()}
        onChange={(date: Date) => {
          onChange({ ...(value || {}), from: date })
        }}
        locale="en-GB"
      />
      <br />
      <DatePicker
        label={intl.formatMessage({
          id: 'seller-dashboard.filter-bar.to',
        })}
        value={value?.to || new Date()}
        onChange={(date: Date) => {
          onChange({ ...(value || {}), to: date })
        }}
        locale="en-GB"
      />
    </div>
  )
}

export default DateFilter
