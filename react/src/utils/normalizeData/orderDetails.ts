import type { IOrder } from '../../typings/order'
import type {
  OrderDetailsData,
  AttachmentPackages,
  FormattedOrderStatus,
} from '../../typings/normalizedOrder'
import { deliveryStatus } from '../constants'
import { formatOrderState } from '../../../../libs/localities-mapper/utils/county-list.util'
import { getPaymentMethodFromTextField } from '../../../../libs/common-utils/object.utils'

const getVendorOrderId = (orderNote: string): string | null =>
  orderNote.match(/(?<=ID:(\s.*?))(\d+)/g)?.toString() ?? null

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

const getOrderStatus = (
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

    case deliveryStatus.WINDOW_TO_CANCEL:
      return {
        color: '#FFF',
        bgColor: '#c7bd44',
        longText: 'Window to cancellation',
        shortText: 'WTC',
      }

    default:
      return undefined
  }
}

const formatDate = (
  date: string | undefined,
  config: {
    year: 'numeric' | 'short' | '2-digit' | undefined
    month: 'numeric' | 'short' | '2-digit' | undefined
    day: 'numeric' | 'short' | '2-digit' | undefined
    hour?: 'numeric' | 'short' | '2-digit' | undefined
    minute?: 'numeric' | 'short' | '2-digit' | undefined
    second?: 'numeric' | 'short' | '2-digit' | undefined
    hour12?: boolean
    timeZone?: string
  }
): string => {
  // @ts-expect-error Date constructor return
  // type doesn't include exception 'Invalid Date'
  if (!date || new Date(date) === 'Invalid Date') return null

  return new Intl.DateTimeFormat('ro-RO', config).format(new Date(date))
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
      month: 'short',
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
      stateInscription: orderData.clientProfileData?.stateInscription,
      isCorporate: orderData?.clientProfileData?.isCorporate,
    },
    creationDate: formatDate(orderData?.creationDate, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      timeZone: 'Europe/Bucharest',
    }),
    vendorOrderId: getVendorOrderId(orderData.openTextField.value),
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
      value: getPaymentMethodFromTextField(orderData?.openTextField?.value),
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
