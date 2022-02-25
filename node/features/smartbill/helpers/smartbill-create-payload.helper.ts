import type {
  CreateInvoicePayload,
  SmartbillInvoiceRequestDTO,
} from '../dto/smartbill.dto'
import getProducts from './smartbill.helpers'

export default function createSmartbillOrderPayload({
  settings,
  order,
  productTaxNames,
}: CreateInvoicePayload) {
  const issueDate = new Date().toISOString().slice(0, 10) // '2022-02-01'
  const {
    clientProfileData: client,
    invoiceData: { address },
  } = order

  const clientData: SmartbillInvoiceRequestDTO = {
    country: 'Romania',
    name: `${client.lastName} ${client.firstName}`,
    address: `${address.street} ${address.number}`,
    city: `${address.city}`,
    county: `${address.state}`,
  }

  if (client.isCorporate) {
    clientData.vatCode = client.stateInscription
    clientData.name = client.tradeName ?? client.corporateName
  }

  const products = getProducts({ settings, order, productTaxNames })

  const smartBillPayload = {
    client: clientData,
    companyVatCode: settings.smartbill__vatCode,
    issueDate,
    products,
    seriesName: settings.smartbill__seriesName,
  }

  return smartBillPayload
}
