import React, { useState, useEffect } from 'react'
import type { FC } from 'react'
import { Layout, Spinner } from 'vtex.styleguide'

import { getOrderDataById } from './src/utils/api'
import { normalizeOrderData } from './src/utils/normalizeData/orderDetails'
import OrderDetail from './src/pages/OrderDetail/index'
import { OrderHeader } from './src/components/OrderDetail'
import type { OrderDetailsData } from './src/typings/normalizedOrder'

const OrderDetails: FC = () => {
  const [order, setOrder] = useState<OrderDetailsData>()
  const [isLoading, setIsLoading] = useState(true)

  const getOrderData = async (): Promise<void> => {
    const orderId = window.location.pathname
      .match(/GCB-[0-9]+-[0-9]+/g)
      ?.toString()

    const data = orderId && (await getOrderDataById(orderId))

    if (data) {
      const normalizedData = normalizeOrderData(data)

      setOrder(normalizedData)
    }
  }

  useEffect(() => {
    getOrderData().finally(() => setIsLoading(false))
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
            orderId={order?.orderId ?? 'Lipsa ID'}
            orderStatus={order?.formattedOrderStatus}
          />
        }
      >
        {order && (
          <OrderDetail orderData={order} refreshOrderData={getOrderData} />
        )}
      </Layout>
    </>
  )
}

export default OrderDetails
