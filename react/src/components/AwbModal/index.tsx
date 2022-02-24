import React, { useEffect, useState } from 'react'
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
import type { AxiosError } from 'axios'
import axios from 'axios'
import type { FC, SetStateAction } from 'react'
import { useIntl } from 'react-intl'

import type { IOrderAwbProps } from '../../types/awbModal'
import ErrorPopUpMessage from '../ErrorPopUpMessage'
import { createAwbShipping, getOrderDataById } from '../../utils/api'
import { normalizeOrderData } from '../../utils/normalizeData/orderDetails'
import type { OrderDetailsData } from '../../typings/normalizedOrder'
import {
  courierData,
  courierIcons,
  disabledCouriers,
} from '../../utils/constants'

const RequestAwbModal: FC<IOrderAwbProps> = ({
  setOrderAwb,
  updateAwbData,
  order,
  onAwbUpdate,
  resetOrdersData,
  refreshOrderDetails,
}) => {
  const [service, setService] = useState('')
  const [courier, setCourier] = useState('')
  const [packageAmount, setPackageAmount] = useState(1)
  const [invoiceUrl, setInvoiceUrl] = useState('')
  const [weight, setWeight] = useState(1)
  const [packageType, setPackageType] = useState('')
  const [newAwbGenerated, setNewAwbGenerated] = useState(false)
  const [invoiceNum, setInvoiceNum] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [manualAwb, setManualAwb] = useState('')
  const [manualUrl, setManualUrl] = useState('')
  const [orderData, setOrderData] = useState<OrderDetailsData>()
  const [modalOpen, setModalOpen] = useState(false)
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

  const dropDownOptions = courierData.map((_courier) => {
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

  const handlePopUpToggle = () => {
    setModalOpen(!modalOpen)
  }

  const getOrderDetails = async (reset?: boolean) => {
    const rawData = await getOrderDataById(order.orderId)
    const normalizedData = normalizeOrderData(rawData)

    if (reset) {
      refreshOrderDetails?.()

      if (normalizedData.packageAttachment?.packages && resetOrdersData) {
        const {
          invoiceKey,
          invoiceNumber,
          invoiceUrl: invUrl,
          courier: _courier,
        } = normalizedData?.packageAttachment?.packages

        if (invoiceKey && invoiceNumber) {
          resetOrdersData(
            normalizedData.orderId,
            invoiceKey,
            invoiceNumber,
            invUrl
          )
        }

        setOrderAwb?.((prevState) =>
          prevState.map((el) => {
            if (el.orderId === normalizedData.orderId) {
              el.orderValue = String(invUrl)
              el.courier = _courier
              el.invoiceNumber = invoiceNumber
            }

            return el
          })
        )
      }
    }

    setOrderData(normalizedData)
    setIsLoading(false)
  }

  const getOrderData = async (orderId: string) => {
    createAwbShipping(
      orderId,
      service,
      weight,
      courierSetManually,
      packageAmount,
      manualAwb,
      manualUrl,
      courier,
      packageType,
      orderData?.value,
      invoiceDate.toString(),
      invoiceNum.toString(),
      invoiceUrl
    )
      .then((data) => {
        if (!data) {
          return
        }

        updateAwbData?.(data)
        setNewAwbGenerated(true)

        getOrderDetails(true)
      })
      .catch((error) => {
        if (error.status === 504) {
          getOrderDetails(true)
          onAwbUpdate(true)

          return
        }

        setAxiosError({
          ...axiosError,
          isError: true,
          errorMessage: error.message,
          errorDetails: error.details,
        })
      })
  }

  const formHandler = (e: React.SyntheticEvent<EventTarget>) => {
    e.preventDefault()
    setModalOpen(!modalOpen)
    setInvoiceNum('')
    orderData?.orderId && getOrderData(orderData?.orderId)
  }

  const printAwb = async (_orderData: OrderDetailsData) => {
    setIsLoading(true)
    try {
      const data = await axios
        .get(`/opa/orders/${_orderData?.orderId}/tracking-label`, {
          params: {
            awbTrackingNumber: _orderData?.value.toString(),
            paperSize: 'A4',
          },
          responseType: 'blob',
        })
        .then((res) => {
          return res.data
        })
        .catch(async (error: AxiosError<Blob>) => {
          if (!error.response || error.response.status === 504) {
            return
          }

          const response = error.response

          const errorResponse = await new Promise<{
            message: string
            details: string
          }>((resolve) => {
            const fileReader = new FileReader()

            fileReader.readAsText(response.data)
            fileReader.onload = () => {
              const errorJSON = JSON.parse(fileReader.result as string) as {
                message: string
                stack: string
              }

              resolve({
                message: errorJSON.message,
                details: errorJSON.stack,
              })
            }
          })

          const errorData = {
            message: errorResponse.message,
            details: errorResponse.details,
          }

          setAxiosError({
            ...axiosError,
            isError: true,
            errorDetails: errorData.details,
            errorMessage: String(errorData.message),
          })
        })

      if (data) {
        const blob = new Blob([data], { type: 'application/pdf' })

        const blobURL = URL.createObjectURL(blob)

        window.open(blobURL)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setOrderData(order)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (newAwbGenerated) getOrderData(order.orderId)
  }, [newAwbGenerated])

  const awbButton = () =>
    orderData?.packageAttachment.packages && (
      <Button
        block
        variation="secondary"
        disabled={
          isLoading ||
          orderData?.status === 'canceled' ||
          disabledCouriers.includes(
            orderData?.packageAttachment.packages.courier
          )
        }
        isLoading={isLoading}
        onClick={() => {
          printAwb(orderData)
        }}
      >
        <div className="flex w-100">
          <span>
            <IconDownload />
          </span>
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
          orderData?.packageAttachment.packages.courier
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
            disabled={isLoading || orderData?.status === 'canceled'}
            isLoading={isLoading}
            onClick={() => {
              setModalOpen(!modalOpen)
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
        isOpen={modalOpen}
        responsiveFullScreen
        showCloseIcon
        onClose={() => {
          handlePopUpToggle()
          setCourier('')
          setService('')
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
                    onChange={(_: any, v: React.SetStateAction<string>) =>
                      setPackageType(v)
                    }
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
                    onChange={(event: React.SetStateAction<any>) =>
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
                    options={[
                      { value: 'fancourier', label: 'FanCourier' },
                      { value: 'cargus', label: 'Cargus' },
                      { value: 'sameDay', label: 'SameDay' },
                      { value: 'tnt', label: 'TNT' },
                      { value: 'dhl', label: 'DHL' },
                      { value: 'gls', label: 'GLS' },
                      { value: 'dpd', label: 'DPD' },
                    ]}
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
                  options={[
                    {
                      disabled: true,
                      label: (
                        <>
                          <img
                            alt="logo"
                            style={{ width: '20px', paddingRight: '6px' }}
                            src={courierIcons.facturis}
                          />{' '}
                          Facturis
                        </>
                      ),
                      onClick: () => {
                        setCourier('facturis')
                      },
                    },
                    {
                      label: (
                        <>
                          <img
                            alt="logo"
                            style={{ width: '20px', paddingRight: '6px' }}
                            src={courierIcons.smartbill}
                          />{' '}
                          Smartbill
                        </>
                      ),
                      disabled: false,
                      onClick: () => {
                        setCourier('smartbill')
                      },
                    },
                    {
                      label: (
                        <>
                          <img
                            alt="logo"
                            style={{ width: '20px', paddingRight: '6px' }}
                            src={courierIcons.download}
                          />
                          {intl.formatMessage({
                            id:
                              'awb-shipping-modal.modal-invoice.list.manual-option',
                          })}
                        </>
                      ),
                      disabled: false,
                      onClick: () => {
                        setCourier('manual')
                      },
                    },
                  ]}
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
