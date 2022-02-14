import type { IOrder } from '../../typings/order'
import type {
  OrderDetailsData,
  AttachmentPackages,
  FormattedOrderStatus,
} from '../../typings/normalizedOrder'
import { deliveryStatus } from '../constants'

const getElelfantOrderId = (orderNote: string): string | null =>
  orderNote.match(/(?<!ID:)\s?\d+/g)?.toString() || null

const getPaymentMethod = (paymentData: string): string | null => {
  if (!paymentData) return null

  return paymentData.match(/\b(\w+)$/g)?.toString() ?? null
}

const getOrderTotals = (orderData: IOrder) => {
  const orderTotals = {}

  orderData.totals.map((element) => {
    return Object.assign(orderTotals, {
      [element.id.toLocaleLowerCase()]: element.value,
    })
  })

  return orderTotals
}

const getInvoicedEntityType = (isCorporate: boolean) =>
  isCorporate ? 'Persoana juridica' : 'Persoana fizica'

export const getOrderStatus = (
  status: string | undefined
): FormattedOrderStatus | undefined => {
  switch (status) {
    case deliveryStatus.READY_FOR_HANDLING:
      return {
        color: '#FFF',
        bgColor: '#44c767',
        longText: 'Ready for handling',
        shortText: 'RFH',
      }

    case deliveryStatus.WAITING_FOR_SELLERS_CONFIRMATION:
      return {
        color: '#FFF',
        bgColor: '#44c767',
        longText: 'Waiting for sellers confirmation',
        shortText: 'WFSC',
      }

    case deliveryStatus.PAYMENT_APPROVED:
      return {
        color: '#FFF',
        bgColor: '#8bc34a',
        longText: 'Paid',
      }

    case deliveryStatus.CANCELED:
      return {
        color: '#FFF',
        bgColor: '#FF4136',
        longText: 'Canceled',
      }

    case deliveryStatus.INVOICED:
      return {
        color: '#FFF',
        bgColor: '#00449E',
        longText: 'Invoiced',
      }

    case deliveryStatus.HANDLING:
      return {
        color: '#FFF',
        bgColor: '#357EDD',
        longText: 'Handling',
      }

    case deliveryStatus.PAYMENT_PENDING:
      return {
        color: '#FFF',
        bgColor: '#98b13d',
        longText: 'Pending',
      }

    case deliveryStatus.CANCELLATION_REQUESTED:
      return {
        color: '#FFF',
        bgColor: '#FF725C',
        longText: 'Cancellation requested',
        shortText: 'CR',
      }

    default:
      return undefined
  }
}

const formatOrderState = (state: string | undefined) => {
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

  return state ? states[state] : null
}

export const formatDate = (
  date: string | undefined,
  config: {
    year: 'numeric' | '2-digit' | undefined
    month: 'numeric' | '2-digit' | undefined
    day: 'numeric' | '2-digit' | undefined
    hour?: 'numeric' | '2-digit' | undefined
    minute?: 'numeric' | '2-digit' | undefined
    second?: 'numeric' | '2-digit' | undefined
    timeZone?: string
  }
): string => {
  // @ts-expect-error Date constructor return
  // type doesn't include exception 'Invalid Date'
  if (!date || new Date(date) === 'Invalid Date') return null

  return new Intl.DateTimeFormat('en-GB', config).format(new Date(date))
}

const getPackageAttachment = (orderData: IOrder): AttachmentPackages | null => {
  const { packages } = orderData.packageAttachment
  const lastPackage = packages.pop()

  if (!lastPackage) return null

  const deliverStatus = lastPackage?.courierStatus

  if (deliverStatus) {
    return {
      courier: lastPackage.courier,
      courierStatus: {
        data: deliverStatus.data[0],
        deliveredDate: deliverStatus.deliveredDate,
        finished: deliverStatus.finished,
        status: deliverStatus.status,
      },
      invoiceKey: lastPackage.invoiceKey,
      invoiceNumber: lastPackage.invoiceNumber,
      invoiceUrl: lastPackage.invoiceUrl,
      invoiceValue: lastPackage.invoiceValue,
      issuanceDate: formatDate(lastPackage.issuanceDate, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        timeZone: 'Europe/Bucharest',
      }),
      trackingNumber: lastPackage.trackingNumber,
      trackingUrl: lastPackage.trackingUrl,
    }
  }

  return {
    courier: lastPackage.courier,
    invoiceKey: lastPackage.invoiceKey,
    invoiceNumber: lastPackage.invoiceNumber,
    invoiceUrl: lastPackage.invoiceUrl,
    invoiceValue: lastPackage.invoiceValue,
    issuanceDate: formatDate(lastPackage.issuanceDate, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'Europe/Bucharest',
    }),
    trackingNumber: lastPackage.trackingNumber,
    trackingUrl: lastPackage.trackingUrl,
  }
}

export const normalizeOrderData = (orderData: IOrder): OrderDetailsData => {
  const estimatedShipDate = formatDate(
    orderData?.shippingData?.logisticsInfo[0]?.shippingEstimateDate,
    {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'Europe/Bucharest',
    }
  )

  return {
    clientProfileData: {
      corporateName: orderData?.clientProfileData?.corporateName,
      firstName: orderData?.clientProfileData?.firstName,
      lastName: orderData?.clientProfileData?.lastName,
      phone: orderData?.clientProfileData?.phone,
      email: orderData?.clientProfileData?.email,
      isCorporate: orderData?.clientProfileData?.isCorporate,
    },
    creationDate: formatDate(orderData?.creationDate, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZone: 'Europe/Bucharest',
    }),
    elelfantOrderId: getElelfantOrderId(orderData.openTextField.value),
    formattedOrderStatus: getOrderStatus(orderData.status),
    invoiceData: {
      address: {
        city: orderData?.invoiceData?.address?.city,
        country: orderData?.invoiceData?.address?.country,
        invoicedEntityType: getInvoicedEntityType(
          orderData?.clientProfileData?.isCorporate
        ),
        number: orderData?.invoiceData?.address?.number,
        postalCode: orderData?.invoiceData?.address?.postalCode,
        state: formatOrderState(orderData?.invoiceData?.address?.state),
        street: orderData?.invoiceData?.address?.street,
      },
    },
    items: orderData.items,
    orderId: orderData?.orderId,
    openTextField: {
      value: getPaymentMethod(orderData?.openTextField?.value),
    },
    orderTotals: getOrderTotals(orderData),
    marketPlaceOrderId: orderData?.marketplaceOrderId,
    packageAttachment: {
      packages: getPackageAttachment(orderData),
    },
    shippingData: {
      address: {
        city: orderData?.shippingData?.address?.city,
        postalCode: orderData?.shippingData?.address?.postalCode,
        phone: orderData?.shippingData?.address?.number,
        receiverName: orderData?.shippingData?.address?.receiverName,
        state: formatOrderState(orderData?.shippingData?.address?.state),
        street: orderData?.shippingData?.address?.street,
      },
      logisticsInfo: orderData.shippingData.logisticsInfo,
    },
    shippingEstimatedDate: estimatedShipDate,
    status: orderData.status,
    totals: orderData.totals,
    value: orderData.value,
  }
}
