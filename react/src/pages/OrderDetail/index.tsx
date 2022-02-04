import type { FC } from 'react'
import React, { useCallback, useEffect, useState } from 'react'
import { Box, Button, Divider } from 'vtex.styleguide'

import type { OrderDetailsData } from '../../typings/normalizedOrder'
import type { IOrder } from '../../typings/order'
import RequestAwbModal from '../../components/AwbModal'
import { OrderTable } from '../../components/OrderDetail'
import type {
  IOrderAwb,
  IOrderDetailProps,
  ITrackingObj,
} from '../../types/common'
import AwbStatus from '../../components/AwbStatus'

const OrderDetail: FC<IOrderDetailProps> = ({ orderData, rawOrderData }) => {
  const [data, setData] = useState<OrderDetailsData>()
  const [isClosed, setIsClosed] = useState(false)
  const [trackingNum, setTrackingNum] = useState<ITrackingObj>({})
  const [orderAwb, setOrderAwb] = useState<IOrderAwb[]>([])

  const getLabelOrder = useCallback(
    (rowData: IOrder) => {
      const order = orderAwb.find(
        (labelOrder) => labelOrder?.orderId === rowData?.orderId
      )

      return order
        ? `${order.courier ? order.courier : ' '} ${order.orderValue}`
        : null
    },
    [orderAwb]
  )

  useEffect(() => {
    setData(orderData)
    const lastOrder =
      (rawOrderData && rawOrderData.packageAttachment.packages.length - 1) ?? 1

    rawOrderData &&
      setOrderAwb(() => {
        return [
          {
            orderId: rawOrderData.orderId.toString(),
            // potentially has to be first element of the array
            orderValue:
              rawOrderData.packageAttachment?.packages[lastOrder]
                ?.trackingNumber ?? 'Genereaza AWB & Factura',
            courier:
              rawOrderData.packageAttachment?.packages[lastOrder]?.courier ??
              null,
            payMethod: rawOrderData.openTextField?.value,
          },
        ]
      })
  }, [trackingNum, orderData, rawOrderData])

  return (
    <>
      <Box>
        <div className="flex mb4">
          <div className="w-50">
            <h3 className="t-heading-3">Date comanda</h3>
            <div className="flex flex-column">
              <div className="mt2">Data comanda: {data?.orderDate}</div>
              <div className="mt2">
                Elefant order ID: {data?.marketPlaceOrderId}
              </div>
              <div className="mt2">Metoda de plata: {data?.paymentMethod}</div>
              <div className="mt2">Metoda de livrare: Curier standard</div>
              <div className="mt2">
                Estimat livrare: {data?.shippingEstimatedDate}
              </div>

              <div className="mt6">Observatii/Note: Bla bla bla</div>
            </div>
          </div>
          <div className="w-50">
            <h3 className="t-heading-3">Client</h3>
            <div className="flex flex-column">
              <div className="mt2">
                Nume: {data?.clientData.firstName} {data?.clientData.lastName}
              </div>
              <div className="mt2">Telefon: {data?.clientData.phone}</div>
              <div className="mt2">Email: {data?.clientData.email}</div>
            </div>
          </div>
          <div className="w-50">
            <h3 className="t-heading-3">Cost total comanda</h3>
            <div className="mt2">
              Articole: {(data?.orderTotals.items ?? 0) / 100} Lei
            </div>
            <div className="mt2">
              Expediere: {(data?.orderTotals.shipping ?? 0) / 100} Lei
            </div>
            <div className="w-50 mv4">
              <Divider />
            </div>
            <div className="mt2">
              Total:{' '}
              {(data?.orderTotals.items ?? 0) / 100 +
                (data?.orderTotals.shipping ?? 0) / 100}{' '}
              lei
            </div>
          </div>
        </div>
      </Box>
      <div className="flex mv6">
        <div className="w-50 mr6">
          <Box>
            <div className="flex flex-column">
              <h3 className="t-heading-3">Adresa livrare</h3>
              <div className="mt2">
                Nume: {data?.shippingAddress.receiverName}
              </div>
              <div className="mt2">
                Telefon: {data?.shippingAddress.phone ?? data?.clientData.phone}
              </div>
              <div className="mt2">Adresa: {data?.shippingAddress.street}</div>
              <div className="mt2">
                Oras: {data?.shippingAddress.city}, Judet{' '}
                {data?.shippingAddress.state}
              </div>
              <div className="mt2">
                Code Postal: {data?.shippingAddress.postalCode}
              </div>
              <div className="mv6">
                <Divider />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="t-heading-3">AWB Livrare</h3>
                {data?.packageData?.courier && data?.marketPlaceOrderId && (
                  <AwbStatus
                    courier={data?.packageData?.courier}
                    orderId={data?.orderId}
                    size="large"
                  />
                )}
              </div>
              <div className="mt2">
                Curier: {data?.packageData?.courier ?? 'Lipsa date'}
              </div>
              <div className="mt2">
                AWB: {data?.packageData?.trackingNumber}
              </div>
              <div className="mt2">
                {' '}
                Tracking URL: {data?.packageData?.trackingUrl}
              </div>
              <div className="flex w-50 mt5">
                {rawOrderData && (
                  <Button
                    variation="secondary"
                    disabled={rawOrderData.status === 'canceled'}
                    onClick={() => {
                      setIsClosed(!isClosed)
                    }}
                  >
                    {getLabelOrder(rawOrderData)}
                  </Button>
                )}
                <RequestAwbModal
                  rowData={rawOrderData}
                  isClosed={isClosed}
                  setIsClosed={setIsClosed}
                  setTrackingNum={setTrackingNum}
                  setOrderAwb={setOrderAwb}
                />
              </div>
            </div>
          </Box>
        </div>
        <div className="w-50">
          <Box fit="fill-vertical">
            <div className="flex flex-column">
              <h3 className="t-heading-3">Date facturare</h3>
              <div className="mt2">
                Tip persoana: {data?.invoiceData.invoicedEntityType}
              </div>
              <div className="mt2">
                Nume:{' '}
                {data?.clientData.isCorporate
                  ? 'Nume SRL'
                  : `${data?.clientData.firstName} ${data?.clientData.lastName}`}
              </div>
              <div className="mt2">CUI: RO2339394</div>
              <div className="mt2">Adresa: {data?.invoiceData.street}</div>
              <div className="mt2">
                Oras: {data?.invoiceData.city}, Judet {data?.invoiceData.state}
              </div>
              <div className="mv6">
                <Divider />
              </div>
              <h3 className="t-heading-3">Factura</h3>
              <div className="mt2">
                ID factura: {data?.packageData?.invoiceNumber}
              </div>
              <div className="mt2">
                Valoare:{' '}
                {(data?.packageData?.invoiceValue ?? 0) / 100 || 'Lipsa date'}{' '}
                Lei
              </div>
              <div className="mt2">
                Data factura: {data?.packageData?.issuanceDate}
              </div>
              <div className="mt2">
                URL factura: {data?.packageData?.invoiceUrl}
              </div>
            </div>
          </Box>
        </div>
      </div>
      <OrderTable orderData={orderData} />
    </>
  )
}

export default OrderDetail
