import React, { useEffect, useReducer, useCallback } from 'react'
import axios from 'axios'
import type { FC } from 'react'
import { Layout, PageBlock, PageHeader, Button } from 'vtex.styleguide'

import { fancourierReducer, initialState } from './sellerDashboardReducer'
import OrdersList from './OrdersList'

const SellerDashboard: FC = () => {
  const [state, dispatch] = useReducer(fancourierReducer, initialState)

  const getServices = async (): Promise<void> => {
    const { data } = await axios.get('/fancourier/get-services')
    const fancourierServices = data.split('"').join('').split('\n')

    dispatch({
      type: 'getServices',
      payload: fancourierServices,
    })
  }

  const getOrderData = async (orderId: string): Promise<any> => {
    const { data }: { data: any } = await axios.get(
      `/api/oms/pvt/orders/${orderId}`
    )

    dispatch({
      type: 'getVtexOrderData',
      payload: data,
    })
    dispatch({ type: 'fancourierPayload' })
  }

  const requestAwbFromFancourier = useCallback(async (): Promise<unknown> => {
    const { data } = await axios.post(
      `/fancourier/request-awb`,
      state.fancourierPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    )

    return data
  }, [state.fancourierPayload])

  useEffect((orderId = 'GCB-1178850063289-01') => {
    getServices()
    getOrderData(orderId)
  }, [])

  return (
    <Layout fullWidth pageHeader={<PageHeader title="Orders" />}>
      <PageBlock>
        <OrdersList />
        <Button onClick={requestAwbFromFancourier}>Generate AWB</Button>
      </PageBlock>
    </Layout>
  )
}

export default SellerDashboard
