import type { FC } from 'react'
import React, { useState } from 'react'
import { FilterBar } from 'vtex.styleguide'
import { useIntl } from 'react-intl'

import type {
  IDatePickerProp,
  IFilterDate,
  IStatement,
  IFilterItemsStatus,
  TableFilterParams,
} from '../../types/common'
import StatusFilter from './StatusFilter'
import DateFilter from './DateFilter'

const TableFilters: FC<{
  filterParams: TableFilterParams
  setFilterParams: (o: TableFilterParams) => void
}> = ({
  filterParams,
  setFilterParams,
}: {
  filterParams: TableFilterParams
  setFilterParams: (o: TableFilterParams) => void
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

        if (subject === 'creationDate') {
          const dateObject = object as IFilterDate

          const from = (dateObject.from ?? new Date()).toISOString()

          const to = (dateObject.to ?? new Date()).toISOString()

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
      alwaysVisibleFilters={['status', 'creationDate']}
      statements={filterStatus}
      clearAllFiltersButtonLabel="Clear Filters"
      onChangeStatements={handleFiltersChange}
      options={{
        creationDate: {
          label: intl.formatMessage({
            id: 'seller-dashboard.filter-bar.creation-date',
          }),
          renderFilterLabel: (statement: IStatement) => {
            if (!statement || !statement.object) {
              return intl.formatMessage({
                id: 'seller-dashboard.common.all',
              })
            }

            const dateObject = statement.object as IFilterDate

            return `${
              statement.verb === 'between'
                ? `between ${dateObject.from} and ${dateObject.to}`
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

            const statementObject = statement.object as IFilterItemsStatus

            const keys = Object.keys(statementObject)

            const isAllTrue = !keys.some(
              (key: string) => !statementObject[key as keyof IFilterItemsStatus]
            )

            const isAllFalse = !keys.some(
              (key: string) => statementObject[key as keyof IFilterItemsStatus]
            )

            const trueKeys = keys.filter(
              (key: string) => statementObject[key as keyof IFilterItemsStatus]
            )

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
