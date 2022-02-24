import type { FC } from 'react'
import React, { useState } from 'react'
import { FilterBar } from 'vtex.styleguide'
import { useIntl } from 'react-intl'

import type {
  IDatePickerProp,
  IStatement,
  TableFiltersProps,
} from '../../types/common'
import StatusFilter from './StatusFilter'
import DateFilter from './DateFilter'

const TableFilters: FC<TableFiltersProps> = ({
  filterParams,
  setFilterParams,
}) => {
  const intl = useIntl()
  const [filterStatus, setFilterStatus] = useState<IStatement[]>([])

  const handleFiltersChange = (filterStatements: IStatement[]) => {
    if (!filterStatements?.length) {
      setFilterParams({
        status: '',
        search: '',
        date: '',
      })
      setFilterStatus([])

      return
    }

    const changes = filterStatements.reduce(
      (_changes, statement: IStatement) => {
        if (!statement?.object) {
          return _changes
        }

        const { subject, object } = statement

        if (subject === 'status') {
          return {
            ..._changes,
            status: Object.entries(object)
              .filter(([_, value]) => value)
              .map(([key]) => key.replace(/[ ]/g, '-').toLowerCase())
              .join(','),
          }
        }

        if (subject === 'creationdate') {
          const from = object.from?.toISOString?.() ?? new Date().toISOString()
          const to = object.to?.toISOString?.() ?? new Date().toISOString()

          return {
            ..._changes,
            date: `${from} TO ${to}`,
          }
        }

        return _changes
      },
      { status: '', date: '' }
    )

    setFilterStatus(filterStatements)
    setFilterParams({
      ...filterParams,
      ...changes,
    })
  }

  return (
    <FilterBar
      alwaysVisibleFilters={['status', 'creationdate']}
      statements={filterStatus}
      clearAllFiltersButtonLabel="Clear Filters"
      onChangeStatements={handleFiltersChange}
      options={{
        creationdate: {
          label: intl.formatMessage({
            id: 'seller-dashboard.filter-bar.creation-date',
          }),
          renderFilterLabel: (statement: IStatement) => {
            if (!statement || !statement.object) {
              return intl.formatMessage({
                id: 'seller-dashboard.common.all',
              })
            }

            return `${
              statement.verb === 'between'
                ? `between ${statement.object.from} and ${statement.object.to}`
                : `is ${statement.object}`
            }`
          },
          verbs: [
            {
              value: 'between',
              object: (props: IDatePickerProp) => <DateFilter {...props} />,
            },
          ],
        },
        status: {
          label: intl.formatMessage({
            id: 'seller-dashboard.table-column.status',
          }),
          renderFilterLabel: (statement: IStatement) => {
            if (!statement || !statement.object) {
              return intl.formatMessage({
                id: 'seller-dashboard.common.all',
              })
            }

            const keys = statement.object ? Object.keys(statement.object) : []
            const isAllTrue = !keys.some(
              (key: string) => !statement.object[key]
            )

            const isAllFalse = !keys.some(
              (key: string) => statement.object[key]
            )

            const trueKeys = keys.filter((key: string) => statement.object[key])

            let trueKeysLabel = ''

            trueKeys.forEach((key: string, index: number) => {
              trueKeysLabel += `${key}${
                index === trueKeys.length - 1 ? '' : ', '
              }`
            })

            return `${
              isAllTrue ? 'All' : isAllFalse ? 'None' : `${trueKeysLabel}`
            }`
          },
          verbs: [
            {
              label: intl.formatMessage({
                id: 'seller-dashboard.filter-bar.includes',
              }),
              value: 'includes',
              object: (props: {
                value: Record<string, boolean>
                onChange: (value: Record<string, boolean>) => void
              }) => {
                return <StatusFilter {...props} />
              },
            },
          ],
        },
      }}
    />
  )
}

export default TableFilters
