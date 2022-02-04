import React from 'react'
import type { FC } from 'react'
import { Layout, PageBlock, PageHeader } from 'vtex.styleguide'

import OrdersList from './src/pages/OrdersList/index'

const SellerDashboard: FC = () => {
  return (
    <>
      <Layout fullWidth pageHeader={<PageHeader title="Orders" />}>
        <PageBlock>
          <OrdersList />
        </PageBlock>
      </Layout>
    </>
  )
}

export default SellerDashboard
