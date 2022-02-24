import React from 'react'
import { Checkbox } from 'vtex.styleguide'

const StatusFilter = ({
  value,
  onChange,
}: {
  value: Record<string, boolean>
  onChange: (value: { [key: string]: boolean }) => void
}) => {
  const initialValue: { [key: string]: boolean } = {
    'Ready for handling': true,
    Invoiced: true,
    Canceled: true,
    ...(value || {}),
  }

  const toggleValueByKey = (key: string) => {
    return {
      ...(value || initialValue),
      [key]: value ? !value[key] : false,
    }
  }

  return (
    <div>
      {Object.keys(initialValue).map((opt, index) => {
        return (
          <div className="mb3" key={`class-statment-object-${opt}-${index}`}>
            <Checkbox
              checked={value ? value[opt] : initialValue[opt]}
              id={`status-${opt}`}
              label={opt}
              name="status-checkbox-group"
              onChange={() => {
                const newValue = toggleValueByKey(`${opt}`)

                onChange(newValue)
              }}
              value={opt}
            />
          </div>
        )
      })}
    </div>
  )
}

export default StatusFilter
