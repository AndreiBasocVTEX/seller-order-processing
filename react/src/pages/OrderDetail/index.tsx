import type { FC } from 'react'
import React, { useEffect, useState } from 'react'
import { Box, Divider } from 'vtex.styleguide'
import '../../public/style.css'

import type { OrderDetailsData } from '../../typings/normalizedOrder'
import RequestAwbModal from '../../components/AwbModal'
import { OrderTable } from '../../components/OrderDetail'
import type { IOrderDetailProps, ITrackingObj } from '../../types/common'
import AwbStatus from '../../components/AwbStatus'

const OrderDetail: FC<IOrderDetailProps> = ({ orderData }) => {
  const [data, setData] = useState<OrderDetailsData>()
  const [trackingNum, setTrackingNum] = useState<ITrackingObj>({})
  const [awbUpdated, setAwbUpdated] = useState(false)
  const [awbData, updateAwbData] = useState<{
    courier: string
    invoiceNumber: string
    invoiceValue: number
    issuanceDate: string
    trackingNumber: string
  }>()

  useEffect(() => {
    setData(orderData)
  }, [trackingNum, orderData])

  return (
    <>
      <Box>
        <div className="flex mb4">
          <div className="w-50">
            <h3 className="t-heading-3">Date comanda</h3>
            <div className="flex flex-column">
              <div className="mt2">Data comanda: {data?.creationDate}</div>
              <div className="mt2">
                Elefant order ID: {data?.marketPlaceOrderId}
              </div>
              <div className="mt2">
                Metoda de plata: {data?.openTextField.value}
              </div>
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
                Nume: {data?.clientProfileData.firstName}{' '}
                {data?.clientProfileData.lastName}
              </div>
              <div className="mt2">
                Telefon: {data?.clientProfileData.phone}
              </div>
              <div className="mt2">Email: {data?.clientProfileData.email}</div>
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
                Nume: {data?.shippingData.address.receiverName}
              </div>
              <div className="mt2">
                Telefon:{' '}
                {data?.shippingData.address.phone ??
                  data?.clientProfileData.phone}
              </div>
              <div className="mt2">
                Adresa: {data?.shippingData.address.street}
              </div>
              <div className="mt2">
                Oras: {data?.shippingData.address.city}, Judet{' '}
                {data?.shippingData.address.state}
              </div>
              <div className="mt2">
                Code Postal: {data?.shippingData.address.postalCode}
              </div>
              <div className="mv6">
                <Divider />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="t-heading-3">AWB Livrare</h3>
                {data?.packageAttachment.packages &&
                  data?.marketPlaceOrderId && (
                    <AwbStatus orderId={data?.orderId} size="large" />
                  )}
                {awbUpdated &&
                  data?.orderId &&
                  !data?.packageAttachment.packages && (
                    <AwbStatus orderId={data?.orderId} size="large" />
                  )}
              </div>
              {data?.packageAttachment?.packages && (
                <>
                  <div className="mt2">
                    Curier:{' '}
                    {data?.packageAttachment.packages?.courier ?? 'Lipsa date'}
                  </div>
                  <div className="mt2">
                    AWB: {data?.packageAttachment.packages?.trackingNumber}
                  </div>
                  <div className="mt2">
                    {' '}
                    Tracking URL:{' '}
                    {data?.packageAttachment.packages?.trackingUrl}
                  </div>
                </>
              )}
              {awbUpdated && (
                <>
                  <div className="mt2">
                    Curier: {awbData?.courier ?? 'Lipsa date'}
                  </div>
                  <div className="mt2">AWB: {awbData?.trackingNumber}</div>
                </>
              )}
              <div className="flex w-50 mt5">
                {data?.orderId && (
                  <RequestAwbModal
                    updateAwbData={updateAwbData}
                    setTrackingNum={setTrackingNum}
                    neededOrderId={data?.orderId}
                    onAwbUpdate={setAwbUpdated}
                  />
                )}
              </div>
            </div>
          </Box>
        </div>
        <div className="w-50">
          <Box fit="fill-vertical">
            <div className="flex flex-column">
              <h3 className="t-heading-3">Date facturare</h3>
              <div className="mt2">
                Tip persoana: {data?.invoiceData.address.invoicedEntityType}
              </div>
              <div className="mt2">
                Nume:{' '}
                {data?.clientProfileData.corporateName ??
                  `${data?.clientProfileData.firstName} ${data?.clientProfileData.lastName}`}
              </div>
              <div className="mt2">CUI: RO2339394</div>
              <div className="mt2">
                Adresa: {data?.invoiceData.address.street}
              </div>
              <div className="mt2">
                Oras: {data?.invoiceData.address.city}, Judet{' '}
                {data?.invoiceData.address.state}
              </div>
              <div className="mv6">
                <Divider />
              </div>
              <h3 className="t-heading-3">Factura</h3>
              {data?.packageAttachment?.packages && (
                <>
                  <div className="mt2">
                    ID factura:{' '}
                    {data?.packageAttachment.packages?.invoiceNumber}
                  </div>
                  <div className="mt2">
                    Valoare:{' '}
                    {(data?.packageAttachment.packages?.invoiceValue ?? 0) /
                      100 || 'Lipsa date'}{' '}
                    Lei
                  </div>
                  <div className="mt2">
                    Data factura:{' '}
                    {data?.packageAttachment.packages?.issuanceDate}
                  </div>
                  <div className="mt2">
                    URL factura: {data?.packageAttachment.packages?.invoiceUrl}
                  </div>
                </>
              )}
              {awbUpdated && (
                <>
                  <div className="mt2">
                    Valoare:{' '}
                    {(awbData?.invoiceValue ?? 0) / 100 || 'Lipsa date'} Lei
                  </div>
                  <div className="mt2">
                    Data factura: {awbData?.issuanceDate}
                  </div>
                </>
              )}
            </div>
          </Box>
        </div>
      </div>
      <OrderTable orderData={orderData} />
    </>
  )
}

export default OrderDetail
