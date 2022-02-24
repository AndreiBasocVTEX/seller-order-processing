import type { FC } from 'react'
import React from 'react'
import { Totalizer } from 'vtex.styleguide'
import { useIntl } from 'react-intl'

import type { TableTotalizerData } from '../../types/common'

const TableTotalizer: FC<{ totalizerData: TableTotalizerData }> = ({
  totalizerData,
}) => {
  const intl = useIntl()

  return (
    <Totalizer
      horizontalLayout
      items={[
        {
          label: intl.formatMessage({
            id: 'seller-dashboard.filter-bar.orders',
          }),
          value: totalizerData.ordersAmount,
          inverted: true,
        },
        {
          label: intl.formatMessage({
            id: 'seller-dashboard.filter-bar.order-average-price',
          }),
          value: `${totalizerData.ordersAverageValue} Lei`,
          inverted: true,
        },
        {
          label: intl.formatMessage({
            id: 'seller-dashboard.filter-bar.gross-price',
          }),
          value: `${totalizerData.ordersTotalValue} Lei`,
          inverted: true,
        },
      ]}
    />
  )
}

export default TableTotalizer
