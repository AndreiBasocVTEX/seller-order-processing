import React, { useEffect, useMemo, useState } from 'react'
import {
  ActionMenu,
  Button,
  DatePicker,
  Divider,
  Dropdown,
  IconDownload,
  Input,
  Modal,
  NumericStepper,
  Tooltip,
} from 'vtex.styleguide'
import type { FC, SetStateAction } from 'react'
import { useIntl } from 'react-intl'

import type { IOrderAwbProps } from '../../types/awbModal'
import ErrorPopUpMessage from '../ErrorPopUpMessage'
import { createAwbShipping, downloadAwb } from '../../utils/api'
import type { OrderDetailsData } from '../../typings/normalizedOrder'
import {
  courierIcons,
  couriersDropDownList,
  disabledCouriers,
} from '../../utils/constants'

const RequestAwbModal: FC<IOrderAwbProps> = ({
  modalOpenId,
  setOpenModalId,
  updateAwbData,
  order,
  onAwbUpdate,
  refreshOrderDetails,
  availableProviders,
}) => {
  const [service, setService] = useState('')
  const [courier, setCourier] = useState('')
  const [packageAmount, setPackageAmount] = useState(1)
  const [invoiceUrl, setInvoiceUrl] = useState('')
  const [weight, setWeight] = useState(1)
  const [packageType, setPackageType] = useState('parcel')
  const [invoiceNum, setInvoiceNum] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [manualAwb, setManualAwb] = useState('')
  const [manualUrl, setManualUrl] = useState('')
  const [orderData, setOrderData] = useState<OrderDetailsData>()
  const [courierSetManually, setCourierManually] = useState('')

  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const [axiosError, setAxiosError] = useState({
    isError: false,
    errorMessage: '',
    errorDetails: '',
  })

  const intl = useIntl()

  const packageTypeOptions = [
    {
      value: 'parcel',
      disabled: false,
      label: intl.formatMessage({
        id: 'awb-shipping-modal.modal-awb.form.package-parcel',
      }),
    },
    {
      value: 'envelope',
      disabled: false,
      label: intl.formatMessage({
        id: 'awb-shipping-modal.modal-awb.form.package-envelope',
      }),
    },
  ]

  const removeAxiosError = () => {
    setAxiosError({
      ...axiosError,
      isError: false,
    })
  }

  const dropDownOptions = availableProviders.awbServices.map((_courier) => {
    return {
      label: (
        <>
          <img
            alt="logo"
            style={{ width: '20px', paddingRight: '6px' }}
            src={courierIcons[_courier.src]}
          />
          {_courier.service === 'manual'
            ? intl.formatMessage({
                id: 'awb-shipping-modal.modal-awb.list.manual-option',
              })
            : _courier.label}
        </>
      ),
      onClick: () => {
        setService(_courier.service)
      },
    }
  })

  const getOrderData = async (orderId: string) => {
    setIsLoading(true)
    createAwbShipping({
      orderId,
      service,
      weight,
      courierSetManually,
      packageAmount,
      manualAwb,
      manualUrl,
      courier,
      packageType,
      invoiceValue: orderData?.value,
      issuanceDate: invoiceDate.toString(),
      invoiceNumber: invoiceNum.toString(),
      invoiceUrl,
    })
      .then((data) => {
        if (!data) {
          return
        }

        updateAwbData?.(data)
        refreshOrderDetails?.()
        onAwbUpdate(true)
      })
      .catch((error) => {
        if (error.status === 504) {
          onAwbUpdate(true)
          refreshOrderDetails?.()

          return
        }

        setAxiosError({
          ...axiosError,
          isError: true,
          errorMessage: error.message,
          errorDetails: error.details,
        })
      })
      .finally(() => setIsLoading(false))
  }

  const formHandler = (e: React.SyntheticEvent<EventTarget>) => {
    e.preventDefault()
    setOpenModalId('')
    setInvoiceNum('')
    orderData?.orderId && getOrderData(orderData?.orderId)
  }

  const printAwb = async (_orderData: OrderDetailsData) => {
    setIsLoading(true)

    return downloadAwb(_orderData?.orderId, _orderData?.value.toString()).catch(
      (e) => {
        setAxiosError({
          ...axiosError,
          isError: true,
          errorDetails: e.details,
          errorMessage: String(e.message),
        })
      }
    )
  }

  useEffect(() => {
    setOrderData(order)
    setIsLoading(false)
  }, [])

  const isProvidersListEmpty = useMemo(() => {
    const allProviders = [
      ...availableProviders.awbServices,
      ...availableProviders.invoiceServices,
    ].filter((provider) => provider.service !== 'manual')

    return allProviders.length === 0
  }, [availableProviders])

  const awbButton = () =>
    orderData?.packageAttachment.packages && (
      <Button
        block
        variation="secondary"
        disabled={
          isLoading ||
          orderData?.status === 'canceled' ||
          disabledCouriers.includes(
            orderData?.packageAttachment.packages.courier?.toUpperCase()
          )
        }
        isLoading={isLoading}
        onClick={() => printAwb(orderData).finally(() => setIsLoading(false))}
      >
        <div className="flex w-100">
          {!disabledCouriers.includes(
            orderData?.packageAttachment.packages.courier?.toUpperCase()
          ) && (
            <span>
              <IconDownload />
            </span>
          )}

          <div className="w-100 truncate">
            <span className="mh3">
              {orderData?.packageAttachment.packages.courier && (
                <img
                  width="20px"
                  src={
                    courierIcons[
                      orderData?.packageAttachment.packages.courier.toLowerCase()
                    ]
                  }
                  alt=""
                />
              )}
            </span>
            <span className="f6">
              {orderData?.packageAttachment.packages.trackingNumber}
            </span>
          </div>
        </div>
      </Button>
    )

  return (
    <>
      {orderData?.packageAttachment.packages &&
        (!disabledCouriers.includes(
          orderData?.packageAttachment.packages.courier?.toUpperCase()
        ) ? (
          <Tooltip
            label={`${intl.formatMessage({
              id: 'seller-dashboard.table-column.download-awb',
            })} ${orderData?.packageAttachment.packages.courier} ${
              orderData?.packageAttachment.packages.trackingNumber
            }`}
          >
            {awbButton()}
          </Tooltip>
        ) : (
          awbButton()
        ))}
      {!orderData?.packageAttachment.packages && (
        <Tooltip
          label={intl.formatMessage({
            id: 'awb-shipping-modal.button-tooltip',
          })}
        >
          <Button
            block
            variation="primary"
            disabled={
              isLoading ||
              isProvidersListEmpty ||
              orderData?.status === 'canceled'
            }
            isLoading={isLoading || isProvidersListEmpty}
            onClick={() => {
              orderData && setOpenModalId(orderData.orderId)
            }}
          >
            <span className="f6 mw-100 truncate">
              {intl.formatMessage({
                id: 'awb-shipping-modal.button-label',
              })}
            </span>
          </Button>
        </Tooltip>
      )}
      <Modal
        isOpen={modalOpenId === orderData?.orderId}
        responsiveFullScreen
        showCloseIcon
        onClose={() => {
          setCourier('')
          setService('')
          setOpenModalId('')
        }}
        closeOnOverlayClick
        closeOnEsc
        centered
        zIndex={9}
      >
        <form onSubmit={formHandler}>
          <div className="flex flex-row">
            <div className="flex flex-column w-100 mr5 pb5">
              <h2>
                {intl.formatMessage({
                  id: 'awb-shipping-modal.modal-awb.title',
                })}
              </h2>
              <div className="flex">
                <ActionMenu
                  label={
                    service ||
                    intl.formatMessage({
                      id: 'awb-shipping-modal.modal-awb.button.choose-service',
                    })
                  }
                  zIndex={9999999}
                  options={dropDownOptions}
                />
              </div>

              {service && service !== 'manual' && (
                <>
                  <p>
                    {intl.formatMessage({
                      id: 'awb-shipping-modal.modal-awb.form.package-type',
                    })}
                    :
                  </p>
                  <Dropdown
                    required
                    options={packageTypeOptions}
                    value={packageType}
                    onChange={(_: unknown, v: string) => setPackageType(v)}
                  />
                  <p>
                    {intl.formatMessage({
                      id: 'awb-shipping-modal.modal-awb.form.package-number',
                    })}
                    :
                  </p>
                  <NumericStepper
                    label={`${intl.formatMessage({
                      id: 'order-detail.common.minimum',
                    })} 1 - ${intl.formatMessage({
                      id: 'order-detail.common.maximum',
                    })} 5`}
                    minValue={1}
                    maxValue={5}
                    value={packageAmount}
                    onChange={(event: { value: number }) =>
                      setPackageAmount(event.value)
                    }
                  />
                  <p>
                    {intl.formatMessage({
                      id: 'awb-shipping-modal.modal-awb.form.package-weight',
                    })}
                    :
                  </p>
                  <NumericStepper
                    label={`${intl.formatMessage({
                      id: 'order-detail.common.maximum',
                    })} 30 kg`}
                    unitMultiplier={1}
                    suffix="kg"
                    minValue={0}
                    maxValue={30}
                    value={weight}
                    defaultValue={1}
                    onChange={(event: { value: number }) =>
                      setWeight(event.value)
                    }
                  />
                </>
              )}

              {service === 'manual' && (
                <>
                  <p>
                    {intl.formatMessage({
                      id: 'awb-shipping-modal.modal-awb.form.courier',
                    })}
                    :
                  </p>
                  <Dropdown
                    required
                    options={couriersDropDownList}
                    value={courierSetManually}
                    onChange={(_: unknown, v: SetStateAction<string>) =>
                      setCourierManually(v)
                    }
                  />
                  <p>AWB :</p>
                  <Input
                    required
                    maxLength={30}
                    placeholder="AWB"
                    onChange={(e: { target: { value: string } }) => {
                      setManualAwb(e.target.value)
                    }}
                  />
                  <p>
                    {intl.formatMessage({
                      id: 'awb-shipping-modal.modal-awb.form.track-url',
                    })}
                    :
                  </p>

                  <Input
                    placeholder="Track URL"
                    onChange={(e: { target: { value: string } }) => {
                      setManualUrl(e.target.value)
                    }}
                  />
                </>
              )}
            </div>

            <Divider orientation="vertical" />
            <div className="flex flex-column w-100 ml5">
              <h2>
                {intl.formatMessage({
                  id: 'order-detail.common.invoice',
                })}
              </h2>
              <div className="flex items-center">
                <ActionMenu
                  label={
                    courier ||
                    intl.formatMessage({
                      id:
                        'awb-shipping-modal.modal-invoice.button.choose-service',
                    })
                  }
                  zIndex={999999}
                  options={availableProviders.invoiceServices.map((invoice) => {
                    return {
                      label: (
                        <>
                          <img
                            alt="logo"
                            style={{ width: '20px', paddingRight: '6px' }}
                            src={courierIcons[invoice.src]}
                          />
                          {invoice.service === 'manual'
                            ? intl.formatMessage({
                                id:
                                  'awb-shipping-modal.modal-invoice.list.manual-option',
                              })
                            : invoice.label}
                        </>
                      ),
                      onClick: () => {
                        setCourier(invoice.service)
                      },
                    }
                  })}
                />
              </div>

              {courier === 'manual' && (
                <>
                  <span>
                    <p>
                      {intl.formatMessage({
                        id: 'awb-shipping-modal.modal-invoice.form.date',
                      })}
                      :
                    </p>{' '}
                    <DatePicker
                      value={new Date()}
                      onChange={(e: Date) => {
                        return setInvoiceDate(e.toISOString().split('T')[0])
                      }}
                      locale="en-GB"
                      required
                    />
                  </span>
                  <p>
                    {intl.formatMessage({
                      id:
                        'awb-shipping-modal.modal-invoice.form.invoice-number',
                    })}
                    :
                  </p>
                  <Input
                    placeholder="any value"
                    onChange={(e: { target: { value: string } }) =>
                      setInvoiceNum(e.target.value)
                    }
                    maxLength={20}
                    value={invoiceNum}
                    required
                  />

                  <p>
                    {intl.formatMessage({
                      id: 'awb-shipping-modal.modal-invoice.form.invoice-url',
                    })}
                    :
                  </p>
                  <Input
                    placeholder="any value"
                    onChange={(e: { target: { value: string } }) =>
                      setInvoiceUrl(e.target.value)
                    }
                    value={invoiceUrl}
                    required={false}
                  />
                </>
              )}
            </div>
          </div>
          <div className="flex justify-center w-100 mt7">
            <Button disabled={!service || !courier} type="submit">
              {intl.formatMessage({
                id: 'awb-shipping-modal.submit-button',
              })}
            </Button>
          </div>
        </form>
      </Modal>
      {axiosError.isError && (
        <ErrorPopUpMessage
          errorMessage={axiosError.errorMessage}
          errorDetails={axiosError.errorDetails}
          resetError={removeAxiosError}
        />
      )}
    </>
  )
}

export default RequestAwbModal
