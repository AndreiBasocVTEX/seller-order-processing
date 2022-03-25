import type { FC } from 'react'
import React, { useEffect, useState } from 'react'
import { Table, Link } from 'vtex.styleguide'
import { useIntl } from 'react-intl'

import type { IOrderTableItem } from '../../types/order'
import type { OrderDetailsData } from '../../typings/normalizedOrder'

const OrderTable: FC<{ orderData?: OrderDetailsData }> = ({ orderData }) => {
  const [tableData, setTableData] = useState<IOrderTableItem[]>([])
  const intl = useIntl()
  const customSchema = {
    properties: {
      productSku: {
        title: intl.formatMessage({
          id: 'order-detail.table.sku',
        }),
        width: 200,
      },
      productName: {
        title: intl.formatMessage({
          id: 'order-detail.table.product-name',
        }),
        width: 600,
        cellRenderer: ({
          cellData,
        }: {
          cellData: IOrderTableItem['productName']
        }) => {
          if (cellData?.id) {
            return (
              <Link href={`/admin/products/${cellData.id}`} target="_blank">
                {cellData.name}
              </Link>
            )
          }

          return cellData.name
        },
      },
      productQuantity: {
        title: intl.formatMessage({
          id: 'order-detail.table.product-quantity',
        }),
      },
      productPriceTva: {
        title: intl.formatMessage({
          id: 'order-detail.table.price-with-vat',
        }),
        width: 100,
      },
    },
  }

  const normalizeTableData = (data: OrderDetailsData) => {
    const { items } = data
    const orderTotals: { [key: string]: number } = {}
    const result: IOrderTableItem[] = []

    items.forEach((element) => {
      result.push({
        productSku: element.sellerSku,
        productName: { name: element.name, id: element.id },
        productQuantity: element.quantity,
        productPriceTva: `${
          (element.priceDefinition.total + element.tax) / 100
        } Lei`,
      })
    })
    data.totals.forEach((element) => {
      Object.assign(orderTotals, {
        [element.id.toLocaleLowerCase()]: element.value,
      })
    })
    result.push(
      {
        productSku: '',
        productName: {
          name: intl.formatMessage({
            id: 'order-detail.table.shipping-cost',
          }),
        },
        productQuantity: null,
        productPriceTva: `${(orderData?.orderTotals.shipping ?? 0) / 100} Lei`,
      },
      {
        productSku: '',
        productName: { name: 'Total' },
        productQuantity: null,
        productPriceTva: `${
          (orderTotals.items + orderTotals.shipping + orderTotals.tax) / 100
        } Lei`,
      }
    )
    setTableData(result)
  }

  useEffect(() => {
    orderData && normalizeTableData(orderData)
  }, [])

  return (
    <div className="flex flex-column mb7">
      <h3 className="t-heading-3">
        {intl.formatMessage({
          id: 'order-detail.table.title',
        })}
      </h3>
      <div className="mb5">
        <Table fullWidth schema={customSchema} items={tableData} />
      </div>
    </div>
  )
}

export default OrderTable
