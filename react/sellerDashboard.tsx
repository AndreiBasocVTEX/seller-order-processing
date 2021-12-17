import React, { useState, useCallback } from 'react'
import type { FC } from 'react'
import axios from 'axios'

const SellerDashboard: FC = () => {
  const [orderList, setOrderList] = useState([])

  const getOrderList = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/oms/pvt/orders?f_creationdate`, {
        headers: { Accept: 'application/json' },
      })

      setOrderList(data)
    } catch (e) {
      console.log(e)
    }
  }, [])

  console.log(orderList)

  return <button onClick={getOrderList}>Click Me</button>
}

export default SellerDashboard
