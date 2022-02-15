import type { FC } from 'react'
import React, { useEffect, useState } from 'react'
import { Box, Divider, Link } from 'vtex.styleguide'
import '../../public/style.css'

import RequestAwbModal from '../../components/AwbModal'
import { OrderTable } from '../../components/OrderDetail'
import type { IOrderDetailProps, ITrackingObj } from '../../types/common'
import AwbStatus from '../../components/AwbStatus'
import InvoiceButton from '../../components/InvoiceButton'

const OrderDetail: FC<IOrderDetailProps> = ({ orderData }) => {
  const [trackingNum, setTrackingNum] = useState<ITrackingObj>({})
  const [awbUpdated, setAwbUpdated] = useState(false)
  const [awbData, updateAwbData] = useState<{
    courier: string
    invoiceNumber: string
    invoiceValue: number
    issuanceDate: string
    trackingNumber: string
  }>()

  useEffect(() => {}, [trackingNum])

  return (
    <>
      <Box>
        <div className="flex mb4">
          <div className="w-50">
            <h3 className="t-heading-3">Date comanda</h3>
            <div className="flex flex-column">
              <div className="mt2">Data comanda: {orderData.creationDate}</div>
              <div className="mt2">
                Elefant order ID: {orderData.elefantOrderId}
              </div>
              <div className="mt2">
                Metoda de plata: {orderData.openTextField.value}
              </div>
              <div className="mt2">Metoda de livrare: Curier standard</div>
              <div className="mt2">
                Estimat livrare: {orderData.shippingEstimatedDate}
              </div>
            </div>
          </div>
          <div className="w-50">
            <h3 className="t-heading-3">Client</h3>
            <div className="flex flex-column">
              <div className="mt2">
                Nume: {orderData.clientProfileData.firstName}{' '}
                {orderData.clientProfileData.lastName}
              </div>
              <div className="mt2">
                Telefon: {orderData.clientProfileData.phone}
              </div>
              <div className="mt2">
                Email: {orderData.clientProfileData.email}
              </div>
            </div>
          </div>
          <div className="w-50">
            <h3 className="t-heading-3">Cost total comanda</h3>
            <div className="mt2">
              Articole: {(orderData.orderTotals.items ?? 0) / 100} Lei
            </div>
            <div className="mt2">
              Expediere: {(orderData.orderTotals.shipping ?? 0) / 100} Lei
            </div>
            <div className="w-50 mv4">
              <Divider />
            </div>
            <div className="mt2">
              Total:{' '}
              {(orderData.orderTotals.items ?? 0) / 100 +
                (orderData.orderTotals.shipping ?? 0) / 100}{' '}
              lei
            </div>
          </div>
        </div>
      </Box>
      <div className="flex mv6">
        <div className="w-50 mr6">
          <Box fit="fill-vertical">
            <div className="flex flex-column">
              <h3 className="t-heading-3">Adresa livrare</h3>
              <div className="mt2">
                Nume: {orderData.shippingData.address.receiverName}
              </div>
              <div className="mt2">
                Telefon:{' '}
                {orderData.shippingData.address.phone ||
                  orderData.clientProfileData.phone}
              </div>
              <div className="mt2">
                Adresa: {orderData.shippingData.address.street}
              </div>
              <div className="mt2">
                Oras: {orderData.shippingData.address.city}, Judet{' '}
                {orderData.shippingData.address.state}
              </div>
              <div className="mt2">
                Code Postal: {orderData.shippingData.address.postalCode}
              </div>
              <div className="mv6">
                <Divider />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="t-heading-3">AWB Livrare</h3>
                {orderData.packageAttachment.packages &&
                  orderData.marketPlaceOrderId && (
                    <AwbStatus orderId={orderData.orderId} size="large" />
                  )}
                {awbUpdated &&
                  orderData.orderId &&
                  !orderData.packageAttachment.packages && (
                    <AwbStatus orderId={orderData.orderId} size="large" />
                  )}
              </div>
              {orderData.packageAttachment?.packages && (
                <>
                  <div className="mt2">
                    Curier:{' '}
                    {orderData.packageAttachment.packages?.courier ??
                      'Lipsa date'}
                  </div>
                  <div className="mt2">
                    AWB: {orderData.packageAttachment.packages?.trackingNumber}
                  </div>
                  {orderData.packageAttachment.packages?.trackingUrl && (
                    <div className="mt2">
                      Tracking URL:{' '}
                      <Link
                        href={orderData.packageAttachment.packages?.trackingUrl}
                        target="_blank"
                      >
                        {orderData.packageAttachment.packages?.trackingUrl}
                      </Link>
                    </div>
                  )}
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
              <div className="flex w-25 mt5">
                {orderData.orderId && (
                  <RequestAwbModal
                    updateAwbData={updateAwbData}
                    setTrackingNum={setTrackingNum}
                    neededOrderId={orderData.orderId}
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
                Tip persoana: {orderData.invoiceData.address.invoicedEntityType}
              </div>
              <div className="mt2">
                Nume:{' '}
                {orderData.clientProfileData.corporateName ??
                  `${orderData.clientProfileData.firstName} ${orderData.clientProfileData.lastName}`}
              </div>
              {orderData.clientProfileData.isCorporate && (
                <div className="mt2">
                  CUI: {orderData.clientProfileData.stateInscription}
                </div>
              )}

              <div className="mt2">
                Adresa: {orderData.invoiceData.address.street}
              </div>
              <div className="mt2">
                Oras: {orderData.invoiceData.address.city}, Judet{' '}
                {orderData.invoiceData.address.state}
              </div>
              <div className="mv6">
                <Divider />
              </div>
              <h3 className="t-heading-3">Factura</h3>
              {orderData.packageAttachment?.packages && (
                <>
                  <div className="mt2">
                    ID factura:{' '}
                    {orderData.packageAttachment.packages?.invoiceNumber}
                  </div>
                  <div className="mt2">
                    Valoare:{' '}
                    {(orderData.packageAttachment.packages?.invoiceValue ?? 0) /
                      100 || 'Lipsa date'}{' '}
                    Lei
                  </div>
                  <div className="mt2">
                    Data factura:{' '}
                    {orderData.packageAttachment.packages?.issuanceDate}
                  </div>
                  <div className="mt2">
                    URL factura:{' '}
                    {orderData.packageAttachment.packages?.invoiceUrl}
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
              <div className="flex w-25 mt5">
                <InvoiceButton
                  orderId={orderData.orderId}
                  invoiceKey={orderData.packageAttachment.packages?.invoiceKey}
                  invoiceNumber={
                    orderData.packageAttachment.packages?.invoiceNumber
                  }
                  invoiceUrl={orderData.packageAttachment.packages?.invoiceUrl}
                  orderStatus={orderData.status}
                />
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
