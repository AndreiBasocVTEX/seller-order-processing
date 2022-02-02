import React, { useState } from 'react'
import {
  Modal,
  Button,
  Input,
  Dropdown,
  NumericStepper,
  DatePicker,
  ActionMenu,
  Spinner,
} from 'vtex.styleguide'
import axios from 'axios'
import type { FC } from 'react'

import fancourier from '../../logos/fancourier.png'
import cargus from '../../logos/cargus.png'
import innoship from '../../logos/innoship.png'
import sameday from '../../logos/sameday.png'
import facturis from '../../logos/facturis.png'
import smartbill from '../../logos/smartbill.png'
import download from '../../logos/download.png'
import type { IOrderAwbProps } from './types'

const RequestAwbModal: FC<IOrderAwbProps> = ({
  rowData,
  isClosed,
  setIsClosed,
  setTrackingNum,
  setOrderAwb,
}) => {
  const [service, setService] = useState('')
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

  const [invoiceNum, setInvoiceNum] = useState('') // Math.floor((Math.random() * 1000000000))

  const handlePopUpToggle = () => {
    setIsClosed(!isClosed)
  }

  const getOrderData = async (orderId: string): Promise<unknown> => {
    try {
      const { data } = await axios.post(
        `/_${service.toLowerCase()}/sendInvoiceInfo`,
        {
          invoiceValue: rowData?.totalValue,
          type: 'Output',
          issuanceDate: invoiceDate.toString(), // '2019-01-20', // date
          invoiceNumber: invoiceNum.toString(),
          weight,
          numberOfParcels: packageAmount,
        },
        {
          params: { orderId },
        }
      )

      setTrackingNum({
        [data.updatedItems.orderId]: data.updatedItems.trackingNumber,
      })
      // changing specific order to an updated one onClick generate in modal.
      setOrderAwb((prevState) =>
        prevState.map((el) => {
          if (el.orderId === data.updatedItems.orderId) {
            el.orderValue = data.updatedItems.trackingNumber
            el.courier = data.updatedItems.courier
            el.invoiceNumber = invoiceNum
          }

          return el
        })
      )

      return data
    } catch (error) {
      console.log(error)

      return error
    }
  }

  const formHandler = (e: React.SyntheticEvent<EventTarget>) => {
    e.preventDefault()
    setIsClosed(!isClosed)
    setInvoiceNum('')
    rowData ? getOrderData(rowData?.orderId) : null
  }

  return (
    <>
      <Modal
        isOpen={isClosed}
        // title={`Request AWB and Invoice for ${service}`}
        responsiveFullScreen
        showCloseIcon
        onClose={() => {
          handlePopUpToggle()
          setCourier('')
          setService('')
          // setButIsEnabled(false)
        }}
        closeOnOverlayClick
        closeOnEsc
        centered
        zIndex={2}
      >
        <div className="mb4">
          <h2>AWB Generation</h2>

          <form onSubmit={formHandler}>
            <div className="flex items-center">
              <ActionMenu
                label={service || 'Alege Modalitatea'}
                zIndex={999999}
                options={[
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
                ]}
              />
            </div>
            {((): JSX.Element | void => {
              if (service) {
                return (
                  <div className="pt5">
                    <img
                      alt="logo"
                      style={{
                        width: '50px',
                        height: '50px',
                        paddingRight: '50px',
                        paddingLeft: '25px',
                      }}
                      src={
                        service === 'cargus'
                          ? cargus
                          : service === 'innoship'
                          ? innoship
                          : service === 'sameday'
                          ? sameday
                          : service === 'fancourier'
                          ? fancourier
                          : download
                      }
                    />
                  </div>
                )
              }

              return (
                <div
                  style={{ padding: '100px', textAlign: 'center' }}
                  className="dib c-muted-1 pa7"
                >
                  <Spinner color="currentColor" size={50} />
                </div>
              )
            })()}

            {((): JSX.Element | void => {
              if (service !== 'manual') {
                return (
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
                )
              }

              if (service === 'manual') {
                return (
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
                      value=""
                      // onChange={(_: any, v: React.SetStateAction<string>) =>
                      //   setPackageType(v)
                      // }
                    />
                    <p>AWB :</p>
                    <Input
                      placeholder="AWB"
                      // onChange={(e: React.SetStateAction<any>) =>
                      //   setInvoiceNum(e.target.value)
                      // }
                      // value={invoiceNum}
                      // required
                    />
                    <p>Track URL :</p>
                    <Input placeholder="Track URL" />
                  </>
                )
              }
            })()}

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

            {((): JSX.Element | void => {
              if (courier === 'smartbill') {
                return (
                  <div className="pa7">
                    <img
                      alt="logo"
                      style={{ width: '100px', marginTop: '40px' }}
                      src={smartbill}
                    />
                  </div>
                )
              }

              if (courier === 'manual') {
                return (
                  <>
                    <span>
                      <p>Issuance Date</p>{' '}
                      <DatePicker
                        value={new Date()}
                        onChange={(e: any) => {
                          console.log(e.toISOString().split('T')[0])

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
                )
              }

              return (
                <div
                  style={{ padding: '100px', textAlign: 'center' }}
                  className="dib c-muted-1 pa7"
                >
                  <Spinner color="currentColor" size={50} />
                </div>
              )
            })()}

            <br />
            <br />
            <Button type="submit">Generate AWB</Button>
          </form>
        </div>
      </Modal>
    </>
  )
}

export default RequestAwbModal
