import type { FC } from 'react'
import React from 'react'
import { Pagination } from 'vtex.styleguide'
import { useIntl } from 'react-intl'

import type { TablePaginationProps } from '../../types/common'

const TablePagination: FC<TablePaginationProps> = ({
  paginationParams,
  totalizerData,
  handleTableLoading,
  handlePaginationParams,
}) => {
  const intl = useIntl()

  const handleTableRowsChange = (_: Event, value: string) => {
    const itemsPerPage = parseInt(value, 10)

    handleTableLoading(true)
    handlePaginationParams({
      page: 1,
      perPage: itemsPerPage,
      itemsFrom: 1,
      itemsTo: itemsPerPage,
    })
  }

  const handleNextClick = () => {
    handleTableLoading(true)
    handlePaginationParams({
      ...paginationParams,
      page: (paginationParams.page += 1),
      itemsFrom: paginationParams.itemsTo,
      itemsTo: paginationParams.itemsTo + paginationParams.perPage,
    })
  }

  const handlePrevClick = () => {
    handleTableLoading(true)
    handlePaginationParams({
      ...paginationParams,
      page: (paginationParams.page -= 1),
      itemsFrom: paginationParams.itemsFrom - paginationParams.perPage,
      itemsTo: paginationParams.itemsFrom,
    })
  }

  return (
    <div className="flex justify-end">
      <div className="w-25">
        <Pagination
          rowsOptions={[15, 25, 50, 100]}
          currentItemFrom={paginationParams.itemsFrom}
          currentItemTo={paginationParams.itemsTo}
          textOf="of"
          textShowRows={intl.formatMessage({
            id: 'seller-dashboard.filter-bar.on-page',
          })}
          totalItems={totalizerData.ordersAmount}
          onRowsChange={handleTableRowsChange}
          onNextClick={handleNextClick}
          onPrevClick={handlePrevClick}
        />
      </div>
    </div>
  )
}

export default TablePagination
