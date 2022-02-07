import type { Item } from '../../vtex/dto/order.dto'
import type { CreateInvoicePayload, TaxName } from '../dto/smartbill.dto'

type SmartBillTagType = { [key: string]: string | boolean | number }

function generateTaxName(taxes: TaxName[], value: string | number) {
  return taxes.find(
    (item: TaxName) => item.percentage === parseInt(value as string, 10)
  )?.name
}

export default function getProducts({
  settings,
  order,
  productTaxNames,
}: CreateInvoicePayload) {
  const items = order.items.map((item: Item) => {
    let vatPercent = item.taxCode || settings.smartbill__defaultVATPercentage

    if (settings.smartbill__useVtexProductTaxValue) {
      vatPercent = item.priceTags.reduce(
        (result: string, tag: SmartBillTagType) => {
          if (typeof tag.value === 'string') {
            if (tag.isPercentual) {
              result = tag.value
            }
          }

          return result
        },
        vatPercent
      )
    }

    const taxName = generateTaxName(productTaxNames.taxes, vatPercent)

    return {
      code: item.uniqueId,
      currency: order.storePreferencesData.currencyCode,
      isTaxIncluded: true,
      measuringUnitName: 'buc',
      name: item.name,
      price: item.sellingPrice,
      quantity: item.quantity,
      taxName,
      taxPercentage: vatPercent,
    }
  })

  if (
    settings.smartbill__invoiceShippingCost &&
    Object.prototype.hasOwnProperty.call(order, 'shippingTotal') &&
    order.shippingTotal > 0
  ) {
    const taxName = generateTaxName(
      productTaxNames.taxes,
      settings.smartbill__defaultVATPercentage
    )

    items.push({
      code: settings.smartbill__invoiceShippingProductCode,
      currency: order.storePreferencesData.currencyCode,
      isTaxIncluded: true,
      measuringUnitName: 'buc',
      name: settings.smartbill__invoiceShippingProductName,
      price: order.shippingTotal,
      quantity: 1,
      taxName,
      taxPercentage: settings.smartbill__defaultVATPercentage,
      isService: true,
    })
  }

  return items
}
