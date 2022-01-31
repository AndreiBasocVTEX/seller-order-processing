import React, { useState } from 'react'
import {
  Modal,
  Button,
  Input,
  Dropdown,
  NumericStepper,
  DatePicker,
} from 'vtex.styleguide'
import axios from 'axios'
import type { FC } from 'react'

import type { IOrder } from './typings/order'
import fancourier from './logos/fancourier.png'
import cargus from './logos/cargus.png'
import innoship from './logos/innoship.png'
import sameday from './logos/sameday.png'

interface IOrderAwb {
  orderId: string
  orderValue: string
  courier: string
}

type Props = {
  rowData: IOrder | undefined
  isClosed: boolean
  setIsClosed: (v: boolean) => void
  setTrackingNum: (v: { [k: string]: string }) => void
  setOrderAwb: (v: (a: IOrderAwb[]) => IOrderAwb[]) => void
  service: string
}

// import React, { useCallback, useEffect, useState } from 'react'
const RequestAwbModal: FC<Props> = ({
  rowData,
  isClosed,
  setIsClosed,
  service,
  setTrackingNum,
  setOrderAwb,
}) => {
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
  // const [awbResponse, setAwbResponse] = useState<Promise<any> | string>('empty')
  // const date = new Date().toISOString().slice(0, 10)

  const handlePopUpToggle = () => {
    setIsClosed(!isClosed)
  }

  const getOrderData = async (orderId: string): Promise<unknown> => {
    try {
      const { data } = await axios.post(
        `/_${service.toLowerCase()}/sendInvoiceInfo`,
        // `/_cargus/sendInvoiceInfo`,
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

      // console.log('GETORDERdata', data.updatedItems.trackingNumber)
      // console.log('GETORDERdata', data.updatedItems)
      setTrackingNum({
        [data.updatedItems.orderId]: data.updatedItems.trackingNumber,
      })
      // changing specific order to an updated one onClick generate in modal.
      setOrderAwb((prevState) =>
        prevState.map((el) => {
          // console.log(
          //   'LLLLLLLLLLLLLLLL',
          //   el.orderValue,
          //   data.updatedItems.trackingNumber
          // )
          if (el.orderId === data.updatedItems.orderId) {
            el.orderValue = data.updatedItems.trackingNumber
            el.courier = data.updatedItems.courier
            console.log('MATCH SET', data.updatedItems)
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
    console.log('clicked')
    setIsClosed(!isClosed)

    rowData ? getOrderData(rowData?.orderId) : null
    console.log('submitted')
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
          // setButIsEnabled(false)
        }}
        closeOnOverlayClick
        closeOnEsc
        centered
      >
        <div className="mb4">
          <h2>Invoice Information</h2>
          <form onSubmit={formHandler}>
            <span>
              <p>Issuance Date</p>{' '}
              {/* <Input
                  value={invoiceDate}
                  onChange={(e: React.SetStateAction<any>) => setInvoiceDate(e.target.value)}
                  required={true}
                /> */}
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
            {/* <p>Order ID: {data?.orderId}</p> */}
            <br />
            <hr />
            <div className="flex items-center">
              {((): JSX.Element | void => {
                if (service === 'innoship') {
                  return (
                    <img
                      alt="logo"
                      style={{
                        width: '50px',
                        height: '50px',
                        paddingRight: '50px',
                      }}
                      src={innoship}
                    />
                  )
                }

                if (service === 'cargus') {
                  return (
                    <img
                      alt="logo"
                      style={{
                        width: '50px',
                        height: '50px',
                        paddingRight: '50px',
                      }}
                      src={cargus}
                    />
                  )
                }

                if (service === 'sameday') {
                  return (
                    <img
                      alt="logo"
                      style={{
                        width: '50px',
                        height: '50px',
                        paddingRight: '50px',
                      }}
                      src={sameday}
                    />
                  )
                }

                if (service === 'fancourier') {
                  return (
                    <img
                      alt="logo"
                      style={{
                        width: '50px',
                        height: '50px',
                        paddingRight: '50px',
                      }}
                      src={fancourier}
                    />
                  )
                }
              })()}
              <h1>{service}</h1>
            </div>
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
