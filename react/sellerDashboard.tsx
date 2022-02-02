import React from 'react'
// import axios from 'axios'
import type { FC } from 'react'
import { Layout, PageBlock, PageHeader } from 'vtex.styleguide'

import OrdersList from './pages/OrdersList/index'

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

// const getOrderData = async (
//   orderId: string,
//   service: string
// ): Promise<unknown> => {
//   try {
//     const { data } = await axios.post(`/_fancourier/generateAWB`, {
//       orderId,
//       service,
//     })

//     console.log(data)

//     return data
//   } catch (error) {
//     console.log(error)

//     return error
//   }
// }
