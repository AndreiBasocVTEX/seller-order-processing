import React, { useState, useEffect } from 'react'
import type { FC } from 'react'
import axios from 'axios'
import { Layout, Spinner } from 'vtex.styleguide'

import OrderDetail from './OrderDetail/index'
import OrderHeader from './OrderDetail/components/OrderHeader'
import type { IOrder } from './typings/order'

const orderDetails: FC = () => {
  const [order, setOrder] = useState<IOrder>()
  const [isLoading, setIsLoading] = useState(true)
  const getOrdeData = async () => {
    const orderId = window.location.pathname.match(/GCB-[0-9]+-[0-9]+/g)
    try {
      const { data } = await axios.get(
        `/api/oms/pvt/orders/${orderId?.toString()}`
      )
      setOrder(data)
    } catch (error) {
      console.log(error)
    }
    setIsLoading(false)
  }
  useEffect(() => {
    getOrdeData()
  }, [])

  return isLoading ? (
    <div className="vh-100 w-100 flex items-center justify-center">
      <Spinner size={60} />
    </div>
  ) : (
    <>
      <Layout
        fullWidth
        pageHeader={
          <OrderHeader
            orderId={order?.marketplaceOrderId ?? 'Lipsa ID'}
            orderStatus={order?.status || 'Necunoscut'}
          />
        }
      >
        <OrderDetail orderData={order} />
      </Layout>
    </>
  )
}

export default orderDetails
