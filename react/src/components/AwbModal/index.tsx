import React, { useEffect, useState } from 'react'
import {
  Modal,
  Button,
  Input,
  IconDownload,
  Dropdown,
  NumericStepper,
  DatePicker,
  ActionMenu,
  Tooltip,
} from 'vtex.styleguide'
import type { AxiosError } from 'axios'
import axios from 'axios'
import type { FC, SetStateAction } from 'react'

import fancourier from '../../public/logos/fancourier.png'
import cargus from '../../public/logos/cargus.png'
import innoship from '../../public/logos/innoship.png'
import sameday from '../../public/logos/sameday.png'
import facturis from '../../public/logos/facturis.png'
import smartbill from '../../public/logos/smartbill.png'
import download from '../../public/logos/download.png'
import type { IOrderAwbProps } from '../../types/awbModal'
import ErrorPopUpMessage from '../ErrorPopUpMessage'
import { getOrderDataById } from '../../utils/api'
import { normalizeOrderData } from '../../utils/normalizeData/orderDetails'
import type { OrderDetailsData } from '../../typings/normalizedOrder'

const RequestAwbModal: FC<IOrderAwbProps> = ({
  setTrackingNum,
  setOrderAwb,
  updateAwbData,
  neededOrderId,
  onAwbUpdate,
}) => {
  const [service, setService] = useState('')
  const [axiosError, setAxiosError] = useState({
    isError: false,
    errorMessage: '',
    errorDetails: '',
    errorStatus: 0,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [orderData, setOrderData] = useState<OrderDetailsData>()
  const [courierSetManually, setCourierManually] = useState([
    { value: 'FanCourier', label: 'FanCourier' },
    { value: 'Cargus', label: 'Cargus' },
    { value: 'SameDay', label: 'SameDay' },
    { value: 'TNT', label: 'TNT' },
    { value: 'DHL', label: 'DHL' },
    { value: 'GLS', label: 'GLS' },
    { value: 'DPD', label: 'DPD' },
  ])

  const removeAxiosError = () => {
    setAxiosError({
      ...axiosError,
      isError: false,
    })
  }

  const [newAwbGenerated, setNewAwbGenerated] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const dropDownOptions = [
    {
      label: (
        <>
          <img
            alt="logo"
            style={{ width: '20px', paddingRight: '6px' }}
            src={cargus}
          />{' '}
          Cargus
        </>
      ),
      onClick: () => {
        setService('cargus')
      },
    },
    {
      label: (
        <>
          <img
            alt="logo"
            style={{ width: '20px', paddingRight: '6px' }}
            src={sameday}
          />{' '}
          SameDay
        </>
      ),
      disabled: false,
      onClick: () => {
        setService('sameday')
      },
    },
    {
      label: (
        <>
          <img
            alt="logo"
            style={{ width: '20px', paddingRight: '6px' }}
            src={innoship}
          />{' '}
          Innoship
        </>
      ),
      disabled: false,
      onClick: () => {
        setService('innoship')
      },
    },
    {
      label: (
        <>
          <img
            alt="logo"
            style={{ width: '20px', paddingRight: '6px' }}
            src={fancourier}
          />{' '}
          Fan Courier
        </>
      ),
      disabled: false,
      onClick: () => {
        setService('fancourier')
      },
    },
    {
      label: (
        <>
          <img
            alt="logo"
            style={{ width: '20px', paddingRight: '6px' }}
            src={download}
          />{' '}
          Incarca AWB Manual
        </>
      ),
      disabled: false,
      onClick: () => {
        setService('manual')
      },
    },
  ]

  const [courier, setCourier] = useState('')
  const [packageAmount, setPackageAmount] = useState(1)
  const [invoiceUrl, setInvoiceUrl] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const [weight, setWeight] = useState(1)
  const [packageType, setPackageType] = useState('')
  const packageTypeOptions = [
    { value: 'Colet', disabled: false, label: 'Colet' },
    { value: 'Plic', disabled: false, label: 'Plic' },
  ]

  const [invoiceNum, setInvoiceNum] = useState('')
  const courierIcons: { [key: string]: string } = {
    fancourier,
    cargus,
    innoship,
    sameday,
    facturis,
    smartbill,
  }

  const handlePopUpToggle = () => {
    setModalOpen(!modalOpen)
  }

  const getOrderData = async (orderId: string): Promise<unknown> => {
    try {
      const data = await axios
        .post(
          `/opa/orders/${orderId}/track-and-invoice`,

          {
            tracking: {
              generate: true,
              provider: service.toLowerCase(),
              params: {
                weight,
                numberOfParcels: packageAmount,
              },
            },
            invoice: {
              provider: courier,
              ...(courier === 'manual' && {
                params: {
                  invoiceValue: orderData?.value,
                  type: 'Output',
                  issuanceDate: invoiceDate.toString(),
                  invoiceNumber: invoiceNum.toString(),
                },
              }),
            },
          }
        )
        .then((r) => {
          return r.data
        })
        .catch((e: AxiosError<{ message: string; stack: string }>) => {
          if (e?.response) {
            throw {
              message: e.response.data.message,
              status: e.response.status,
              details: e.response.data.stack,
            }
          }
        })

      setTrackingNum({
        [orderId]: data.trackingNumber,
      })
      updateAwbData && updateAwbData(data)
      setNewAwbGenerated(true)
      onAwbUpdate(true)
      // changing specific order to an updated one onClick generate in modal.
      setOrderAwb &&
        setOrderAwb((prevState) =>
          prevState.map((el) => {
            if (el.orderId === orderId) {
              el.orderValue = data.invoiceValue
              el.courier = data.courier
              el.invoiceNumber = data.invoiceNumber
            }

            return el
          })
        )

      return data
    } catch (error) {
      setAxiosError({
        ...axiosError,
        isError: true,
        errorMessage: error.message,
        errorStatus: error.status,
        errorDetails: error.details,
      })

      return error
    }
  }

  const formHandler = (e: React.SyntheticEvent<EventTarget>) => {
    e.preventDefault()
    setModalOpen(!modalOpen)
    setInvoiceNum('')
    orderData?.orderId && getOrderData(orderData?.orderId)
  }

  const printAwb = async (_orderData: OrderDetailsData): Promise<any> => {
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
          if (!error.response) {
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
            status: response.status,
          }

          setAxiosError({
            ...axiosError,
            isError: true,
            errorDetails: errorData.details,
            errorMessage: String(errorData.message),
            errorStatus: errorData.status,
          })
        })

      if (data) {
        const blob = new Blob([data], { type: 'application/pdf' })

        const blobURL = URL.createObjectURL(blob)

        window.open(blobURL)
      }
    } catch (e) {
      console.log(e)
    } finally {
      setIsLoading(false)
    }
  }

  const getOrderDetails = async () => {
    const rawData = await getOrderDataById(neededOrderId)
    const normalizedData = normalizeOrderData(rawData)

    setOrderData(normalizedData)
    setIsLoading(false)
  }

  useEffect(() => {
    getOrderDetails()
  }, [newAwbGenerated, neededOrderId])

  return (
    <>
      {orderData?.packageAttachment.packages && (
        <Tooltip
          label={`${orderData?.packageAttachment.packages.courier} ${orderData?.packageAttachment.packages.trackingNumber}`}
        >
          <Button
            block
            variation="secondary"
            disabled={isLoading || orderData?.status === 'canceled'}
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
        </Tooltip>
      )}
      {!orderData?.packageAttachment.packages && (
        <Button
          block
          variation="primary"
          disabled={isLoading || orderData?.status === 'canceled'}
          isLoading={isLoading}
          onClick={() => {
            setModalOpen(!modalOpen)
          }}
        >
          <span className="f6"> Generează AWB & Factura</span>
        </Button>
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
        <div className="mb4">
          <h2>AWB Generation</h2>

          <form onSubmit={formHandler}>
            <div className="flex">
              <div className="flex flex-column">
                <div className="mt2">
                  <ActionMenu
                    label={service || 'Alege Modalitatea'}
                    zIndex={9999999}
                    options={dropDownOptions}
                  />
                </div>
              </div>
            </div>

            {!service && <div className="dib c-muted-1 pa1 tc vh-25" />}

            {service && service !== 'manual' && (
              <>
                <p>Tip pachet:</p>
                <Dropdown
                  options={packageTypeOptions}
                  value={packageType || 'Colet'}
                  onChange={(_: any, v: React.SetStateAction<string>) =>
                    setPackageType(v)
                  }
                />
                <p>Numar colete :</p>
                <NumericStepper
                  label="Minimum 1, maximum 5"
                  minValue={1}
                  maxValue={5}
                  value={packageAmount}
                  onChange={(event: React.SetStateAction<any>) =>
                    setPackageAmount(event.value)
                  }
                />
                <p>Greutate :</p>
                <NumericStepper
                  label="Maximum 30 kg"
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
                <p>Curier:</p>
                <Dropdown
                  options={[
                    { value: 'FanCourier', label: 'FanCourier' },
                    { value: 'Cargus', label: 'Cargus' },
                    { value: 'SameDay', label: 'SameDay' },
                    { value: 'TNT', label: 'TNT' },
                    { value: 'DHL', label: 'DHL' },
                    { value: 'GLS', label: 'GLS' },
                    { value: 'DPD', label: 'DPD' },
                  ]}
                  value={courierSetManually}
                  onChange={(
                    _: unknown,
                    v: SetStateAction<Array<{ value: string; label: string }>>
                  ) => setCourierManually(v)}
                />
                <p>AWB :</p>
                <Input placeholder="AWB" />
                <p>Track URL :</p>
                <Input placeholder="Track URL" />
              </>
            )}

            <br />
            <hr />
            <h2>Factura</h2>
            <div className="flex items-center">
              <ActionMenu
                label={courier || 'Alege Modalitatea'}
                zIndex={999999}
                options={[
                  {
                    disabled: true,
                    label: (
                      <>
                        <img
                          alt="logo"
                          style={{ width: '20px', paddingRight: '6px' }}
                          src={facturis}
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
                          src={smartbill}
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
                          src={download}
                        />
                        Incarca Factura Manual
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

            {(!courier || courier === 'smartbill') && (
              <div className="dib c-muted-1 pa1 tc vh-25" />
            )}
            {courier === 'manual' && (
              <>
                <span>
                  <p>Issuance Date</p>{' '}
                  <DatePicker
                    value={new Date()}
                    onChange={(e: any) => {
                      return setInvoiceDate(e.toISOString().split('T')[0])
                    }}
                    locale="en-GB"
                    required
                  />
                </span>
                <p>Invoice Number</p>
                <Input
                  placeholder="any value"
                  onChange={(e: React.SetStateAction<any>) =>
                    setInvoiceNum(e.target.value)
                  }
                  value={invoiceNum}
                  required
                />

                <p>Invoice URL (Optional) </p>
                <Input
                  placeholder="any value"
                  onChange={(e: React.SetStateAction<any>) =>
                    setInvoiceUrl(e.target.value)
                  }
                  value={invoiceUrl}
                  required={false}
                />
              </>
            )}

            <br />
            <br />
            <Button type="submit">Generate AWB</Button>
          </form>
        </div>
      </Modal>
      {axiosError.isError && (
        <ErrorPopUpMessage
          errorMessage={axiosError.errorMessage}
          errorStatus={axiosError.errorStatus}
          errorDetails={axiosError.errorDetails}
          resetError={removeAxiosError}
        />
      )}
    </>
  )
}

export default RequestAwbModal
