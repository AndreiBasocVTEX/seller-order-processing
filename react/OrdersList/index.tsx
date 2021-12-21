/* eslint-disable no-console */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { FC } from 'react'
import axios from 'axios'
import { Button, Table, Tag } from 'vtex.styleguide'
import { FormattedCurrency } from 'vtex.format-currency'

import type { IOrder } from '../typings/order'

const OrdersList: FC = () => {
  const [ordersList, setOrdersList] = useState<IOrder[]>([])

  const getOrdersList = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/oms/pvt/orders?f_creationdate`, {
        headers: { Accept: 'application/json' },
      })

      data.list.forEach((el: IOrder): void => {
        el.totalValue /= 100
        // placeholders
        el.orderId = `GCB-${(
          Math.floor(Math.random() * 9000000000000) + 1000000000000
        ).toString()}-01`
        el.awbShipping = 'CHR32534syfavc324'
        el.invoice = 'CHR32534syfavc324' // placeholders
        el.orderIdElefant = (
          Math.floor(Math.random() * 90000000) + 10000000
        ).toString()
        el.awbStatus = 'livrat'
      })
      setOrdersList(data.list)
    } catch (e) {
      console.log(e)
    }
  }, [])

  type SchemeDataType = {
    rowData: IOrder
    cellData: IOrder
  }
  const displayStatus = (cellData: string) => {
    if (cellData === 'ready-for-handling') {
      return (
        <Tag bgColor="#FFF6E0" color="#0C389F">
          Ready
        </Tag>
      )
    }

    if (cellData === 'livrat') {
      return <Tag type="success">Shipped</Tag>
    }

    return <span>yes</span>
  }

  const tableOrdersSchema = useMemo(
    () => ({
      properties: {
        status: {
          title: 'Status',
          width: 80,
          cellRenderer: ({ cellData }: { cellData: string }): JSX.Element => {
            return displayStatus(cellData)
          },
        },
        orderIdElefant: {
          title: 'Or.# Elefant',
          width: 90,
        },
        orderId: {
          title: 'Or.# VTEX',
          // width: 200,
        },
        creationDate: {
          title: 'Creation Date',
          width: 140,
          cellRenderer: ({ cellData }: { cellData: string }): string => {
            return new Intl.DateTimeFormat('en-GB', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              hour12: false,
              timeZone: 'Europe/Bucharest',
            }).format(new Date(cellData))
          },
        },
        ShippingEstimatedDateMax: {
          title: 'Shipping ETA',
          width: 100,
          cellRenderer: ({ cellData }: { cellData: string }): string => {
            return new Intl.DateTimeFormat('en-GB', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              timeZone: 'Europe/Bucharest',
            }).format(new Date(cellData))
          },
        },
        clientName: {
          title: 'Receiver',
          width: 150,
        },
        totalItems: {
          title: 'Items',
          width: 50,
          cellRenderer: ({ cellData }: SchemeDataType) => {
            return <Tag size="small">{cellData}</Tag>
          },
        },
        totalValue: {
          title: 'Total Value',
          width: 100,
          cellRenderer: ({ cellData }: SchemeDataType) => {
            return <FormattedCurrency key={cellData} value={cellData} />
          },
        },
        paymentNames: {
          // Payment method ?
          title: 'Pay. Method',
          width: 100,
        },
        awbShipping: {
          title: 'AWB Shipping',
          // width: 200,
          cellRenderer: ({ cellData }: SchemeDataType) => {
            return (
              <Button
                style={{ width: '100%', justifyContent: 'end' }}
                variation="primary"
                className="self-end pl7"
                size="small"
                onClick={{ cellData }}
              >
                Generate
              </Button>
            )
          },
        },
        awbStatus: {
          title: 'AWB Status',
          width: 100,
          cellRenderer: ({ cellData }: { cellData: string }): JSX.Element => {
            // селлрендерер ожидает селлДату как параметр функции, мы пишем деструктуризацию и он берет из объекта
            return displayStatus(cellData)
          },
        },
        invoice: {
          title: 'Invoice',
          // width: 200,
          cellRenderer: ({ cellData }: SchemeDataType) => {
            return (
              <Button
                style={{ width: '100%', justifyContent: 'end' }}
                variation="primary"
                className="self-end pl7"
                size="small"
                onClick={{ cellData }}
              >
                Generate
              </Button>
            )
          },
        },
      },
    }),
    []
  )

  useEffect(() => {
    getOrdersList()
  }, [getOrdersList])

  console.log('ORDERLIST', ordersList)
  ordersList.forEach((el) => {
    console.log('4ECH', el.totalValue / 100)
    setOrdersList
  })

  return (
    <Table
      density="medium"
      fullWidth
      items={ordersList}
      schema={tableOrdersSchema}
    />
  )
}

export default OrdersList
