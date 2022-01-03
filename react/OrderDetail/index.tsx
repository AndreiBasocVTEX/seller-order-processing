import { FC, useEffect, useState } from 'react'
import React from 'react'
import OrderTable from './components/OrderTable'
import { Box, Divider } from 'vtex.styleguide'

import type { IOrder } from '../typings/order'

interface OrderProps {
  orderData?: IOrder
}

interface AddressData {
  city: string
  postalCode: string
  phone: string
  receiverName: string
  state: string
  street: string
}
export interface PackageData {
  courier: string
  invoiceNumber: string
  invoiceUrl: string | null
  invoiceValue: number
  issuanceDate: string
  trackingNumber: string
  trackingUrl: string | null
}

interface OrderDetails {
  clientData: {
    firstName: string
    lastName: string
    phone: string
    email: string
  }
  invoiceData: {
    city: string
    postalCode: string
    invoicedEntityType: string
    phone: string
    state: string
    street: string
  }
  orderDate?: string
  orderTotals: {
    [key: string]: number
  }
  marketPlaceOrderId: string
  packageData?: PackageData
  paymentMethod: string
  shippingAddress: AddressData
  shippingEstimatedDate?: string
}

const OrderDetail: FC<OrderProps> = ({ orderData }) => {
  const [data, setData] = useState<OrderDetails>()

  const getPaymentMethod = (orderData: any) =>
    orderData.openTextField.value.match(/\b(\w+)$/g).toString()

  const getOrderTotals = (orderData: IOrder) => {
    const orderTotals = {}
    orderData.totals.map((element) => {
      Object.assign(orderTotals, {
        [element.id.toLocaleLowerCase()]: element.value,
      })
    })
    return orderTotals
  }

  const getInvoicedEntityType = (isCorporate: boolean) =>
    isCorporate ? 'Persoana juridica' : 'Persoana fizica'

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZone: 'Europe/Bucharest',
    }).format(new Date(date))

  const formatOrderState = (orderData: IOrder) => {
    const { state } = orderData.shippingData.address
    const states: { [key: string]: string } = {
      AB: 'Alba',
      AG: 'Argeș',
      AR: 'Arad',
      B: 'București',
      BC: 'Bacău',
      BH: 'Bihor',
      BN: 'Bistrița - Năsăud',
      BR: 'Brăila',
      BT: 'Botoșani',
      BV: 'Brașov',
      BZ: 'Buzău',
      CJ: 'Cluj',
      CL: 'Călărași',
      CS: 'Caraș - Severin',
      CT: 'Constanța',
      CV: 'Covasna',
      DB: 'Dâmbovița',
      DJ: 'Dolj',
      GJ: 'Gorj',
      GL: 'Galați',
      GR: 'Giurgiu',
      HD: 'Hunedoara',
      HR: 'Harghita',
      IF: 'Ilfov',
      IL: 'Ialomița',
      IS: 'Iași',
      MH: 'Mehedinți',
      MM: 'Maramureș',
      MS: 'Mureș',
      NT: 'Neamț',
      OT: 'Olt',
      PH: 'Prahova',
      SB: 'Sibiu',
      SJ: 'Sălaj',
      SM: 'Satu - Mare',
      SV: 'Suceava',
      TL: 'Tulcea',
      TM: 'Timiș',
      TR: 'Teleorman',
      VL: 'Vâlcea',
      VN: 'Vrancea',
      VS: 'Vaslui',
    }
    return states[state]
  }

  const normalizeOrderData = () => {
    const orderDate = orderData && formatDate(orderData?.creationDate)
    const estimatedShipDate =
      orderData &&
      new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        timeZone: 'Europe/Bucharest',
      }).format(
        new Date(orderData?.shippingData.logisticsInfo[0].shippingEstimateDate)
      )

    const packageData = orderData?.packageAttachment.packages.pop()
    const invoiceIssuanceDate = new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'Europe/Bucharest',
    }).format(new Date(packageData?.issuanceDate || ''))
    console.log(packageData)

    console.log(orderData)

    if (orderData) {
      setData({
        clientData: {
          firstName: orderData.clientProfileData.firstName,
          lastName: orderData.clientProfileData.lastName,
          phone: orderData.clientProfileData.phone,
          email: orderData.clientProfileData.email,
        },
        invoiceData: {
          city: orderData.invoiceData.address.city,
          invoicedEntityType: getInvoicedEntityType(
            orderData.clientProfileData.isCorporate
          ),
          postalCode: orderData.invoiceData.address.postalCode,
          phone: orderData.invoiceData.address.number,

          state: formatOrderState(orderData),
          street: orderData.invoiceData.address.street,
        },
        orderDate: orderDate,
        orderTotals: getOrderTotals(orderData),
        marketPlaceOrderId: orderData.marketplaceOrderId,
        packageData: {
          courier: packageData?.courier || 'Lipsa Date',
          invoiceNumber: packageData?.invoiceNumber || 'Lipsa Date',
          invoiceUrl: packageData?.invoiceUrl || 'Lipsa Date',
          invoiceValue: packageData?.invoiceValue || 0,
          issuanceDate: invoiceIssuanceDate || 'Lipsa Date',
          trackingNumber: packageData?.trackingNumber || 'Lipsa Date',
          trackingUrl: packageData?.trackingUrl || 'Lipsa Date',
        },
        paymentMethod: getPaymentMethod(orderData),
        shippingAddress: {
          city: orderData.shippingData.address.city,
          postalCode: orderData.shippingData.address.postalCode,
          phone: orderData.shippingData.address.number,
          receiverName: orderData.shippingData.address.receiverName,
          state: formatOrderState(orderData),
          street: orderData.shippingData.address.street,
        },
        shippingEstimatedDate: estimatedShipDate,
      })
    }
  }
  useEffect(() => normalizeOrderData(), [])

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
              Articole: {(data?.orderTotals.items ?? 0) / 100} RON
            </div>
            <div className="mt2">
              Expediere: {(data?.orderTotals.shipping ?? 0) / 100} RON
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
                Telefon: {data?.shippingAddress.phone || data?.clientData.phone}
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
              <h3 className="t-heading-3">AWB Livrare</h3>
              <div className="mt2">
                Curier: {data?.packageData?.courier || 'Lipsa date'}
              </div>
              <div className="mt2">
                AWB: {data?.packageData?.trackingNumber}
              </div>
              <div className="mt2 mb6">
                {' '}
                Tracking URL: {data?.packageData?.trackingUrl}
              </div>
            </div>
          </Box>
        </div>
        <div className="w-50">
          <Box>
            <div className="flex flex-column">
              <h3 className="t-heading-3">Date facturare</h3>
              <div className="mt2">
                Tip persoana: {data?.invoiceData.invoicedEntityType}
              </div>
              <div className="mt2">
                Nume:{' '}
                {orderData?.clientProfileData.isCorporate
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
                RON
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
