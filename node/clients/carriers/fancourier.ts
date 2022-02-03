/* eslint-disable @typescript-eslint/restrict-plus-operands */
import type { InstanceOptions, IOContext } from '@vtex/api'
import FormData from 'form-data'
import ObjectsToCsv from 'objects-to-csv'

import {
  awbContent,
  awbSourceChannel,
  constants,
  defaultCountryCode,
  defaultEnvelopeCount,
  pickupServiceId,
  shipmentPaymentMethod,
} from '../../utils/fancourierConstants'
import type {
  IAuthDataFancourier,
  IFancourierAwbPayload,
} from '../../types/fancourier'
import type {
  Item,
  IVtexInvoiceData,
  IVtexOrder,
  VtexEvent,
} from '../../types/orderApi'
import type {
  GetAWBInfoParams,
  IBodyForRequestAwb,
  PrintAWBParams,
} from '../../types/carrier-client'
import { CarrierClient } from '../../types/carrier-client'

function getTotalWeight(order: IVtexOrder) {
  return order.items.reduce((weight: number, item: Item) => {
    return weight + item.additionalInfo.dimension.weight * item.quantity
  }, 0)
}

function getTotalDiscount(order: IVtexOrder) {
  if (!order.paymentData.giftCards.length) {
    return 0
  }

  return order.paymentData.transactions[0].payments.reduce(
    (result: number, item: Item) => {
      if (item.redemptionCode) {
        result -= item.value
      }

      return result
    },
    0
  )
}

/**
 * @TODO: Refactor in favor of requestAWB ( this method should not exist or return direct whats required for formdata )
 */
function createFancourierOrderPayload(
  order: IVtexOrder,
  warehouseId: string,
  invoiceData: IVtexInvoiceData
): IFancourierAwbPayload {
  const totalWeight = invoiceData.weight
    ? invoiceData.weight
    : getTotalWeight(order)

  const totalDiscount = getTotalDiscount(order)
  const { address } = order.shippingData
  const { courierId } = order?.shippingData?.logisticsInfo?.[0].deliveryIds?.[0]

  const { firstDigits } = order?.paymentData?.transactions?.[0].payments?.[0]
  const paymentPromissory =
    order?.paymentData?.transactions?.[0]?.payments?.[0]?.group ===
    constants.promissory

  let { value } = order

  // totalDiscount could be 0 or a negative number
  value += totalDiscount
  const payment =
    firstDigits || paymentPromissory ? 0 : value / constants.price_multiplier

  const numberOfParcels = invoiceData.numberOfParcels
    ? invoiceData.numberOfParcels
    : 1

  const parcels = []

  parcels.push({
    sequenceNo: 1,
    weight: totalWeight,
    type: 2,
    reference1: `Parcel 1`,
    size: { width: 1, height: 1, length: 1 },
  })

  const orderPayload: IFancourierAwbPayload = {
    service: 'Standard',
    shipmentDate: new Date().toISOString(),
    addressFrom: null,
    addressTo: {
      name: address.receiverName,
      contactPerson: address.receiverName,
      country: defaultCountryCode,
      countyName: address.state,
      localityName: address.city,
      street: address.street,
      number: address.number,
      neighborhood: address.neighborhood,
      complement: address.complement,
      reference: address.reference || '',
      postalCode: address.postalCode,
      phone: order.clientProfileData.phone,
      email: order.clientProfileData.email,
    },
    payment: shipmentPaymentMethod,
    content: {
      envelopeCount: defaultEnvelopeCount,
      parcelsCount: numberOfParcels,
      totalWeight,
      contents: awbContent,
      parcels,
    },
    externalClientLocation: warehouseId,
    externalOrderId: order.orderId,
    sourceChannel: awbSourceChannel,
    extra: {
      declaredValue: value / constants.price_multiplier,
      bankRepaymentAmount: payment,
    },
  }

  if (courierId) {
    orderPayload.courierId = courierId
  }

  if (order.shippingData.address.addressType === constants.pickup) {
    orderPayload.serviceId = pickupServiceId
    orderPayload.addressTo.fixedLocationId =
      order.shippingData.address.addressId

    orderPayload.addressTo.localityId = order.shippingData.address.neighborhood
    orderPayload.addressTo.countyName = order.shippingData.address.state
    orderPayload.addressTo.localityName = order.shippingData.address.city
    orderPayload.addressTo.addressText = order.shippingData.address.street
    orderPayload.addressTo.postalCode = order.shippingData.address.postalCode
  }

  return orderPayload
}

type FormDataAcceptedTypes =
  | string
  | number
  | { isFile: boolean; filename: string; value: unknown; contentType: string }

type FanCourierRequestPayloadType = { [key: string]: FormDataAcceptedTypes }

export default class Fancourier extends CarrierClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super('', ctx, options)
  }

  public async getServicesFromFancourier(
    body: IAuthDataFancourier
  ): Promise<unknown> {
    return this.requestToFanCourier(
      'export_servicii_integrat.php',
      // body is much more stricter than the payload therefore we say to TS explicitly that they are assignable
      (body as unknown) as FanCourierRequestPayloadType,
      {
        responseType: 'text',
      }
    )
  }

  protected async requestAWB({
    settings,
    invoiceData,
    order,
  }: IBodyForRequestAwb): Promise<{
    _: string
    lineNumber: string
    rate: string
    trackingNumber: string
  }> {
    const fancourierOrderPayload = createFancourierOrderPayload(
      order,
      settings.fancourier__warehouseId,
      invoiceData
    )

    // Order of the keys in fileData is important because of the generation column flow for the csv-object
    const fileData = [
      {
        'Type of service': fancourierOrderPayload?.service,
        Bank: '',
        IBAN: '',
        'Nr. of envelopes': fancourierOrderPayload?.content?.envelopeCount,
        'Nr. of parcels': fancourierOrderPayload?.content?.parcelsCount,
        Weight: fancourierOrderPayload?.content?.totalWeight,
        'Payment of shipment': 'destinatar',
        Reimbursement: fancourierOrderPayload?.extra?.bankRepaymentAmount,
        'Reimbursement transport payment': 'destinatar',
        'Declared Value': fancourierOrderPayload?.extra?.declaredValue,
        'Contact person': fancourierOrderPayload?.addressTo?.name,
        Observations: '',
        Contains: fancourierOrderPayload?.content?.contents,
        'Recipient name': fancourierOrderPayload?.addressTo?.name,
        'Contact person 1': fancourierOrderPayload?.addressTo?.name,
        Phone: fancourierOrderPayload?.addressTo?.phone,
        Fax: '',
        Email: fancourierOrderPayload?.addressTo?.email,
        County: fancourierOrderPayload?.addressTo?.countyName,
        Town: fancourierOrderPayload?.addressTo?.localityName
          .replace(/\(.*\)/, '')
          .trim(),
        Street: fancourierOrderPayload?.addressTo?.street,
        Number: fancourierOrderPayload?.addressTo?.number,
        'Postal Code': fancourierOrderPayload?.addressTo?.postalCode,
        'Block(building)': fancourierOrderPayload?.addressTo?.reference,
        Entrance: '',
        Floor: '',
        Flat: '',
        'Height of packet': '',
        'Width of packet': '',
        'Lenght of packet': '',
      },
    ]

    const csv = new ObjectsToCsv(fileData)
    const csvData = await csv.toString()

    const res = await this.requestToFanCourier(
      'import_awb_integrat.php',
      {
        client_id: settings.fancourier__clientId,
        user_pass: settings.fancourier__password,
        username: settings.fancourier__username,
        fisier: {
          isFile: true,
          filename: 'fisier.csv',
          value: csvData,
          contentType: 'text/plain',
        },
      },
      { responseType: 'text' }
    )

    if (typeof res !== 'string') {
      // eslint-disable-next-line no-console
      console.log(
        'Fancourier validation failed, please check if the sent fileData was right.',
        JSON.stringify(fileData, null, 2)
      )
      throw new Error(
        `Fancourier validation failed, please check if the sent fileData was right. ${JSON.stringify(
          fileData
        )}`
      )
    }

    const [lineNumber, _, trackingNumber, rate] = res?.split(',') ?? []

    return {
      lineNumber,
      trackingNumber,
      rate,
      _,
    }
  }

  public async printAWB({
    settings,
    payload,
  }: PrintAWBParams<{ awbTrackingNumber: string }>): Promise<unknown> {
    const { awbTrackingNumber } = payload

    return this.requestToFanCourier(
      'view_awb_integrat_pdf.php',
      {
        client_id: settings.fancourier__clientId,
        user_pass: settings.fancourier__password,
        username: settings.fancourier__username,
        nr: awbTrackingNumber,
        page: 'A4',
      },
      { responseType: 'blob' }
    )
  }

  public async requestAWBForInvoice({
    order,
    settings,
    invoiceData,
  }: {
    order: IVtexOrder
    settings: IOContext['settings']
    invoiceData: IVtexInvoiceData
  }) {
    const { trackingNumber } = await this.requestAWB({
      settings,
      order,
      invoiceData,
    })

    const { items } = order

    return {
      orderId: order.orderId,
      trackingNumber,
      items,
      courier: 'Fancourier',
      trackingUrl: `https://www.fancourier.ro/awb-tracking/?metoda=tracking&awb=${trackingNumber}`,
    }
  }

  public async getAWBInfo({ settings, order }: GetAWBInfoParams) {
    const formData: IAuthDataFancourier = {
      client_id: settings.fancourier__clientId,
      user_pass: settings.fancourier__password,
      username: settings.fancourier__username,
    }

    // @TODO: Change to the first element of an array after we will have only one packageAttachment per order
    const packageItem = order?.packageAttachment?.packages?.pop()
    const trackingNumber = packageItem?.trackingNumber

    const invoiceNumber = packageItem?.invoiceNumber

    const updatedAwbInfo = (await this.requestToFanCourier(
      'awb_tracking_integrat.php',
      {
        ...formData,
        AWB: trackingNumber,
        display_mode: 3,
      },
      { responseType: 'text' }
    )) as string

    const trackingHistory = updatedAwbInfo.split('\n')

    let trackingEvents: VtexEvent[] = []
    let isDelivered = false

    if (trackingHistory.length) {
      trackingEvents = trackingHistory.map((event) => {
        // event[0] is a status number (2 — is delivered)
        const [, description] = event.split(',')

        return {
          description,
        }
      })

      isDelivered = trackingHistory.some((event) => event.split(',')[0] === '2')
    }

    return {
      pathParams: {
        orderId: order.orderId,
        invoiceNumber,
      },
      payload: {
        isDelivered,
        events: trackingEvents,
      },
    }
  }

  private requestToFanCourier(
    url: string,
    payload: FanCourierRequestPayloadType,
    options: { responseType: 'text' | 'blob' }
  ) {
    if (!url) {
      throw new Error('URL is required')
    }

    const form = new FormData()

    for (const propName in payload) {
      const value: FormDataAcceptedTypes = payload[propName]

      if (typeof value === 'object' && value?.isFile) {
        form.append(propName, value.value, {
          filename: value.filename,
          contentType: value.contentType,
        })
      } else {
        form.append(propName, value)
      }
    }

    return new Promise((resolve, reject) => {
      form.submit(`https://www.selfawb.ro/${url}`, (err, _res) => {
        if (err) {
          return reject(err)
        }

        const body: string[] | Uint8Array[] = []

        _res.on('data', (chunk) => {
          body.push(chunk)
        })

        _res.on('end', () => {
          if (options.responseType === 'text') {
            return resolve(body.join(''))
          }

          if (options.responseType === 'blob') {
            return resolve(Buffer.concat(body as Uint8Array[]))
          }

          resolve(body)
        })

        _res.on('error', () => reject(body))
      })
    })
  }
}
