import React from 'react'
import { DatePicker } from 'vtex.styleguide'
import { useIntl } from 'react-intl'

import type { IDatePickerProp } from '../../types/common'

const DateFilter = ({ value, onChange }: IDatePickerProp) => {
  const intl = useIntl()

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
