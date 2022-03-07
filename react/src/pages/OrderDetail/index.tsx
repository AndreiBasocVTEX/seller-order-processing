import type { FC } from 'react'
import React, { useState } from 'react'
import { Box, Divider, Link } from 'vtex.styleguide'
import '../../public/style.css'
import { useIntl } from 'react-intl'

import RequestAwbModal from '../../components/AwbModal'
import { OrderTable } from '../../components/OrderDetail'
import type { IOrderDetailProps } from '../../types/common'
import AwbStatus from '../../components/AwbStatus'
import InvoiceButton from '../../components/InvoiceButton'

const OrderDetail: FC<IOrderDetailProps> = ({
  orderData,
  refreshOrderData,
}) => {
  const [awbUpdated, setAwbUpdated] = useState(false)
  const [awbData, updateAwbData] = useState<{
    courier: string
    invoiceNumber: string
    invoiceValue: number
    issuanceDate: string
    trackingNumber: string
  }>()

  const intl = useIntl()

  return (
    <>
      <Box>
        <div className="flex mb4">
          <div className="w-50">
            <h3 className="t-heading-3">
              {intl.formatMessage({
                id: 'order-detail.order.title',
              })}
            </h3>
            <div className="flex flex-column">
              <div className="mt2">
                {intl.formatMessage({
                  id: 'order-detail.order.date',
                })}
                : {orderData.creationDate}
              </div>
              <div className="mt2">
                {intl.formatMessage({
                  id: 'order-detail.order.market-place',
                })}
                : {orderData.elefantOrderId}
              </div>
              <div className="mt2">
                {intl.formatMessage({
                  id: 'order-detail.order.payment-method',
                })}
                : {orderData.openTextField.value}
              </div>
              <div className="mt2">
                {intl.formatMessage({
                  id: 'order-detail.order.delivery-method',
                })}
                : Curier standard
              </div>
              <div className="mt2">
                {intl.formatMessage({
                  id: 'order-detail.order.delivery-estimate',
                })}
                : {orderData.shippingEstimatedDate}
              </div>
            </div>
          </div>

          <div className="w-50">
            <h3 className="t-heading-3">Client</h3>
            <div className="flex flex-column">
              <div className="mt2">
                {intl.formatMessage({
                  id: 'order-detail.common.name',
                })}
                :{' '}
                {orderData.clientProfileData.isCorporate
                  ? orderData.clientProfileData.corporateName
                  : orderData.shippingData.address.receiverName}
              </div>
              <div className="mt2">
                {intl.formatMessage({
                  id: 'order-detail.common.phone',
                })}
                : {orderData.clientProfileData.phone}
              </div>
            </div>
          </div>
          <div className="w-50">
            <h3 className="t-heading-3">
              {intl.formatMessage({
                id: 'order-detail.cost.title',
              })}
            </h3>
            <div className="mt2">
              {intl.formatMessage({
                id: 'order-detail.cost.ware',
              })}
              : {(orderData.orderTotals.items ?? 0) / 100} Lei
            </div>
            <div className="mt2">
              {intl.formatMessage({
                id: 'order-detail.cost.shipment',
              })}
              : {(orderData.orderTotals.shipping ?? 0) / 100} Lei
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
              <h3 className="t-heading-3">
                {intl.formatMessage({
                  id: 'order-detail.delivery-address.title',
                })}
              </h3>
              <div className="mt2">
                {intl.formatMessage({
                  id: 'order-detail.common.name',
                })}
                : {orderData.shippingData.address.receiverName}
              </div>
              <div className="mt2">
                {intl.formatMessage({
                  id: 'order-detail.common.phone',
                })}
                :{' '}
                {orderData.shippingData.address.phone ||
                  orderData.clientProfileData.phone}
              </div>
              <div className="mt2">
                {intl.formatMessage({
                  id: 'order-detail.common.address',
                })}
                : {orderData.shippingData.address.street}
              </div>
              <div className="mt2">
                {intl.formatMessage({
                  id: 'order-detail.common.town',
                })}
                : {orderData.shippingData.address.city},{' '}
                {intl.formatMessage({
                  id: 'order-detail.common.county',
                })}
                : {orderData.shippingData.address.state}
              </div>
              <div className="mv6">
                <Divider />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="t-heading-3">
                  {intl.formatMessage({
                    id: 'order-detail.awb-delivery.title',
                  })}
                </h3>
                {orderData.packageAttachment.packages &&
                  orderData.marketPlaceOrderId && (
                    <AwbStatus
                      orderId={orderData.orderId}
                      initialData={orderData.packageAttachment.packages}
                      size="large"
                    />
                  )}
                {awbUpdated &&
                  orderData.orderId &&
                  !orderData.packageAttachment.packages && (
                    <AwbStatus
                      orderId={orderData.orderId}
                      initialData={orderData.packageAttachment.packages}
                      size="large"
                    />
                  )}
              </div>
              {orderData.packageAttachment?.packages && (
                <>
                  <div className="mt2">
                    {intl.formatMessage({
                      id: 'order-detail.awb-delivery.courier',
                    })}
                    :{' '}
                    {orderData.packageAttachment.packages?.courier ??
                      intl.formatMessage({
                        id: 'order-detail.common.no-data',
                      })}
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
                    {intl.formatMessage({
                      id: 'order-detail.awb-delivery.courier',
                    })}
                    :{' '}
                    {awbData?.courier ??
                      intl.formatMessage({
                        id: 'order-detail.common.no-data',
                      })}
                  </div>
                  <div className="mt2">AWB: {awbData?.trackingNumber}</div>
                </>
              )}
              <div className="flex w-25 mt5">
                {orderData.orderId && (
                  <RequestAwbModal
                    updateAwbData={updateAwbData}
                    order={orderData}
                    onAwbUpdate={setAwbUpdated}
                    refreshOrderDetails={refreshOrderData}
                  />
                )}
              </div>
            </div>
          </Box>
        </div>
        <div className="w-50">
          <Box fit="fill-vertical">
            <div className="flex flex-column">
              <h3 className="t-heading-3">
                {intl.formatMessage({
                  id: 'order-detail.billing-data.title',
                })}
              </h3>
              <div className="mt2">
                {intl.formatMessage({
                  id: 'order-detail.billing-data.person-type',
                })}
                : {orderData.invoiceData.address.invoicedEntityType}
              </div>
              <div className="mt2">
                {intl.formatMessage({
                  id: 'order-detail.common.name',
                })}
                :{' '}
                {orderData.clientProfileData.corporateName ??
                  `${orderData.clientProfileData.firstName} ${orderData.clientProfileData.lastName}`}
              </div>
              {orderData.clientProfileData.isCorporate && (
                <div className="mt2">
                  CUI: {orderData.clientProfileData.stateInscription}
                </div>
              )}

              <div className="mt2">
                {intl.formatMessage({
                  id: 'order-detail.common.address',
                })}
                : {orderData.invoiceData.address.street}
              </div>
              <div className="mt2">
                {intl.formatMessage({
                  id: 'order-detail.common.town',
                })}
                : {orderData.invoiceData.address.city},{' '}
                {intl.formatMessage({
                  id: 'order-detail.common.county',
                })}{' '}
                {orderData.invoiceData.address.state}
              </div>
              <div className="mv6">
                <Divider />
              </div>
              <h3 className="t-heading-3">
                {intl.formatMessage({
                  id: 'order-detail.common.invoice',
                })}
              </h3>
              {orderData.packageAttachment?.packages && (
                <>
                  <div className="mt2">
                    {intl.formatMessage({
                      id: 'order-detail.invoice-id',
                    })}
                    : {orderData.packageAttachment.packages?.invoiceNumber}
                  </div>
                  <div className="mt2">
                    {intl.formatMessage({
                      id: 'order-detail.invoice-value',
                    })}
                    :{' '}
                    {(orderData.packageAttachment.packages?.invoiceValue ?? 0) /
                      100 || 'Lipsa date'}{' '}
                    Lei
                  </div>
                  <div className="mt2">
                    {intl.formatMessage({
                      id: 'order-detail.invoice-date',
                    })}
                    : {orderData.packageAttachment.packages?.issuanceDate}
                  </div>
                  {orderData.packageAttachment.packages?.invoiceUrl && (
                    <div className="mt2">
                      {intl.formatMessage({
                        id: 'order-detail.invoice-url',
                      })}
                      : {orderData.packageAttachment.packages?.invoiceUrl}
                    </div>
                  )}
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
                  invoiceKey={
                    orderData.packageAttachment.packages?.invoiceKey ?? null
                  }
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
