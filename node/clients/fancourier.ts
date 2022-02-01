/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { ExternalClient } from '@vtex/api'
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
} from '../utils/fancourierConstants'
import type {
  IAuthDataFancourier,
  IFancourierAwbPayload,
} from '../types/fancourier'
import type OrderApi from './orderApi'
import type { VtexAuthData } from '../types/VtexAuthData'
import type {
  Item,
  ITrackAwbInfoPayload,
  IVtexInvoiceData,
  IVtexInvoiceRequest,
  IVtexOrder,
  VtexEvent,
} from '../types/orderApi'
import type { IPrintPDFRequest } from '../types/printPDFRequest'
import type { IBodyForRequestAwb } from '../types/bodyForRequestAwb'

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

export default class Fancourier extends ExternalClient {
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

  // eslint-disable-next-line max-params
  private async requestAwbFromFancourier(
    bodyForRequestAwb: IBodyForRequestAwb
  ): Promise<{
    _: string
    lineNumber: string
    rate: string
    trackingNumber: string
  }> {
    const { orderApi, settings, orderId, invoiceData } = bodyForRequestAwb

    const vtexAuthData: VtexAuthData = {
      vtex_appKey: settings.vtex_appKey,
      vtex_appToken: settings.vtex_appToken,
    }

    const formData: IAuthDataFancourier = {
      client_id: settings.fancourier__clientId,
      user_pass: settings.fancourier__password,
      username: settings.fancourier__username,
    }

    const warehouseId = settings.fancourier__warehouseId

    const vtexOrder = await orderApi.getVtexOrderData(vtexAuthData, orderId)

    const order = createFancourierOrderPayload(
      vtexOrder,
      warehouseId,
      invoiceData
    )

    // Order of the keys in fileData is important because of the generation column flow for the csv-object
    const fileData = [
      {
        'Type of service': order?.service,
        Bank: '',
        IBAN: '',
        'Nr. of envelopes': order?.content?.envelopeCount,
        'Nr. of parcels': order?.content?.parcelsCount,
        Weight: order?.content?.totalWeight,
        'Payment of shipment': 'destinatar',
        Reimbursement: order?.extra?.bankRepaymentAmount,
        'Reimbursement transport payment': 'destinatar',
        'Declared Value': order?.extra?.declaredValue,
        'Contact person': order?.addressTo?.name,
        Observations: '',
        Contains: order?.content?.contents,
        'Recipient name': order?.addressTo?.name,
        'Contact person 1': order?.addressTo?.name,
        Phone: order?.addressTo?.phone,
        Fax: '',
        Email: order?.addressTo?.email,
        County: order?.addressTo?.countyName,
        Town: order?.addressTo?.localityName.replace(/\(.*\)/, '').trim(),
        Street: order?.addressTo?.street,
        Number: order?.addressTo?.number,
        'Postal Code': order?.addressTo?.postalCode,
        'Block(building)': order?.addressTo?.reference,
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
        ...formData,
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

  public async printAwbFromFancourier(
    formData: IAuthDataFancourier,
    req: IPrintPDFRequest
  ): Promise<unknown> {
    const { awbTrackingNumber } = req

    return this.requestToFanCourier(
      'view_awb_integrat_pdf.php',
      {
        ...formData,
        nr: awbTrackingNumber,
        page: 'A4',
      },
      { responseType: 'blob' }
    )
  }

  // eslint-disable-next-line max-params
  public async sendInvoiceInfoFancourier(
    orderApi: OrderApi,
    settings: IOContext['settings'],
    orderId: string,
    invoiceData: IVtexInvoiceData
  ) {
    const vtexAuthData: VtexAuthData = {
      vtex_appKey: settings.vtex_appKey,
      vtex_appToken: settings.vtex_appToken,
    }

    const bodyForRequestAwb = {
      orderApi,
      settings,
      orderId,
      invoiceData,
    }

    const { trackingNumber } = await this.requestAwbFromFancourier(
      bodyForRequestAwb
    )

    const order: IVtexOrder = await orderApi.getVtexOrderData(
      vtexAuthData,
      orderId
    )

    const { items } = order

    const body: IVtexInvoiceRequest = {
      ...invoiceData,
      orderId,
      trackingNumber,
      items,
      courier: 'Fancourier',
      trackingUrl: `https://www.fancourier.ro/awb-tracking/?metoda=tracking&awb=${trackingNumber}`,
    }

    const invoiceInfo = await orderApi.sendInvoiceInfo(vtexAuthData, body)

    return {
      invoiceInfo,
      updatedItems: {
        orderId,
        trackingNumber,
        items,
        courier: body.courier,
      },
    }
  }

  public async getAWBInfo({
    settings,
    orderApi,
    orderId,
  }: {
    settings: IOContext['settings']
    orderApi: OrderApi
    orderId: string
  }): Promise<unknown> {
    const vtexAuthData: VtexAuthData = {
      vtex_appKey: settings.vtex_appKey,
      vtex_appToken: settings.vtex_appToken,
    }

    const formData: IAuthDataFancourier = {
      client_id: settings.fancourier__clientId,
      user_pass: settings.fancourier__password,
      username: settings.fancourier__username,
    }

    const order: IVtexOrder = await orderApi.getVtexOrderData(
      vtexAuthData,
      orderId
    )

    // TODO Change to the first element of an array after we will have only one packageAttachment per order
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

    const updateTrackingInfoPayload: ITrackAwbInfoPayload = {
      vtexAuthData,
      pathParams: {
        orderId,
        invoiceNumber,
      },
      payload: {
        isDelivered,
        events: trackingEvents,
      },
    }

    const trackAwbInfoVtexRes = await orderApi.trackAWBInfo(
      updateTrackingInfoPayload
    )

    return {
      trackAwbInfoVtexRes,
      isDelivered,
      trackingEvents,
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
