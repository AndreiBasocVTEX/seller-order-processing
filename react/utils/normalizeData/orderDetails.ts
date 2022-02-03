import type { IOrder } from '../../typings/order'
import type { OrderDetailsData } from '../../typings/normalizedOrder'

const getPaymentMethod = (paymentData: string): string => {
  if (!paymentData) return 'Lipsa Date'

  return paymentData.match(/\b(\w+)$/g)?.toString() || 'Lipsa Date'
}
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

  return state ? states[state] : 'Lipsa date'
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
  if (!date || Object.keys(config).length < 2) return 'Lipsa Date'

  //@ts-expect-error Date constructor return
  // type doesn't include exception 'Invalid Date'
  if (new Date(date) === 'Invalid Date') return 'Lipsa date'

  return new Intl.DateTimeFormat('en-GB', config).format(new Date(date))
}

export const normalizeOrderData = (orderData: IOrder): OrderDetailsData => {
  const orderDate = formatDate(orderData?.creationDate, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZone: "Europe/Bucharest"
  })
  const estimatedShipDate = formatDate(
    orderData?.shippingData?.logisticsInfo[0]?.shippingEstimateDate,
    {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      timeZone: "Europe/Bucharest"
    }
  );
  const packageData = orderData?.packageAttachment.packages[orderData?.packageAttachment.packages.length - 1];
  const invoiceIssuanceDate = formatDate(packageData?.issuanceDate, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "Europe/Bucharest"
  });

  return {
    clientData: {
      firstName: orderData.clientProfileData.firstName || "Lipsa Date",
      lastName: orderData.clientProfileData.lastName || 'Lipsa Date',
      phone: orderData.clientProfileData.phone || 'Lipsa Date',
      email: orderData.clientProfileData.email || 'Lipsa Date',
      isCorporate: orderData.clientProfileData.isCorporate,
    },
    invoiceData: {
      city: orderData.invoiceData.address.city || 'Lipsa Date',
      invoicedEntityType: getInvoicedEntityType(
        orderData.clientProfileData.isCorporate
      ),
      postalCode: orderData.invoiceData.address.postalCode || "Lipsa Date",
      phone: orderData.invoiceData.address.number || "Lipsa Date",

      state: formatOrderState(orderData),
      street: orderData.invoiceData.address.street || "Lipsa Date"
    },
    items: orderData.items,
    orderDate,
    orderId: orderData.orderId,
    orderTotals: getOrderTotals(orderData),
    marketPlaceOrderId: orderData.marketplaceOrderId || "Lipsa Date",
    packageData: {
      courier: packageData?.courier || "Lipsa Date",
      invoiceNumber: packageData?.invoiceNumber || "Lipsa Date",
      invoiceUrl: packageData?.invoiceUrl || "Lipsa Date",
      invoiceValue: packageData?.invoiceValue || 0,
      issuanceDate: invoiceIssuanceDate || "Lipsa Date",
      trackingNumber: packageData?.trackingNumber || "Lipsa Date",
      trackingUrl: packageData?.trackingUrl || "Lipsa Date"
    },
    paymentMethod: getPaymentMethod(orderData?.openTextField?.value),
    shippingAddress: {
      city: orderData.shippingData.address.city,
      postalCode: orderData.shippingData.address.postalCode,
      phone: orderData.shippingData.address.number,
      receiverName: orderData.shippingData.address.receiverName,
      state: formatOrderState(orderData),
      street: orderData.shippingData.address.street,
    },
    shippingData: {
      address: {
        city: orderData?.shippingData?.address?.city || 'Lipsa Date',
        postalCode:
          orderData?.shippingData?.address?.postalCode || 'Lipsa Date',
        phone: orderData?.shippingData?.address?.number || 'Lipsa Date',
        receiverName:
          orderData?.shippingData?.address?.receiverName || 'Lipsa Date',
        state: orderData?.shippingData?.address?.state || 'Lipsa Date',
        street: orderData?.shippingData?.address?.street || 'Lipsa Date',
      },
      logisticsInfo: orderData.shippingData.logisticsInfo,
    },
    shippingEstimatedDate: estimatedShipDate,
    status: orderData.status,
    totals: orderData.totals,
  }
}
