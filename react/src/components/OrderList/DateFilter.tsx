import React, { useEffect } from 'react'
import { DatePicker } from 'vtex.styleguide'
import { useIntl } from 'react-intl'

import type { IDatePickerProp } from '../../types/common'
import { endOfDay, startOfDay } from '../../utils/date.util'

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
