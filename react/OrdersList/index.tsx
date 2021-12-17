import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { FC } from 'react'
import axios from 'axios'
import { Table } from 'vtex.styleguide'

type Order = {
  orderId: string
  creationDate: string
  totalValue: string
  ShippingEstimatedDateMax: string
  clientName: string
  status: string
  awbStatus: string
}

const OrdersList: FC = () => {
  const [ordersList, setOrdersList] = useState<Order[]>([])

  const getOrdersList = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/oms/pvt/orders?f_creationdate`, {
        headers: { Accept: 'application/json' },
      })

      setOrdersList(data.list)
    } catch (e) {
      console.log(e)
    }
  }, [])

  const tableOrdersSchema = useMemo(
    () => ({
      properties: {
        orderId: {
          title: 'Order #',
          width: 200,
        },
        creationDate: {
          title: 'Order Date',
        },
        totalValue: {
          title: 'Shipping Total',
        },
        ShippingEstimatedDateMax: {
          title: 'Shipping Estimate',
        },
        clientName: {
          title: 'Receiver',
          width: 250,
        },
        status: {
          title: 'Status',
          width: 200,
        },
        awbStatus: {
          title: 'AWB Status',
          width: 200,
        },
      },
    }),
    []
  )

  useEffect(() => {
    getOrdersList()
  }, [getOrdersList])

  console.log(ordersList)

  return <Table items={ordersList} schema={tableOrdersSchema} />
}

export default OrdersList
