import React from 'react'
import type { FC } from 'react'
import { Layout, PageBlock, PageHeader } from 'vtex.styleguide'
import { FormattedMessage } from 'react-intl'

import OrdersList from './src/pages/OrdersList'

const OrderProcessing: FC = () => {
  return (
    <>
      <Layout
        fullWidth
        pageHeader={
          <PageHeader
            title={<FormattedMessage id="seller-dashboard.table-title" />}
          />
        }
      >
        <PageBlock>
          <OrdersList />
        </PageBlock>
      </Layout>
    </>
  )
}

export default OrderProcessing
