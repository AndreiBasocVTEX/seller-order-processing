import React from 'react'
import type { FC } from 'react'
import { Layout, PageBlock, PageHeader } from 'vtex.styleguide'

import OrdersList from './src/pages/OrdersList/index'

const OrderProcessing: FC = () => {
  return (
    <>
      <Layout fullWidth pageHeader={<PageHeader title="Order Processing" />}>
        <PageBlock>
          <OrdersList />
        </PageBlock>
      </Layout>
    </>
  )
}

export default OrderProcessing
