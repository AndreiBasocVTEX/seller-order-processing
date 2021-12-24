import React from 'react'
import type { FC } from 'react'
import { Layout, PageBlock, PageHeader } from 'vtex.styleguide'

import OrdersList from './OrdersList'

const SellerDashboard: FC = () => {
  return (
    <Layout
      fullWidth
      pageHeader={<PageHeader title="Tabloul de bord al vânzătorului" />}
    >
      <PageBlock>
        <OrdersList />
      </PageBlock>
    </Layout>
  )
}

export default SellerDashboard
