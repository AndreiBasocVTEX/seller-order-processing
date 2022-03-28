export const OpenTextFields = {
  vendor: 'Magazin',
  vendorOrderId: 'Elefant order ID',
  paymentMethod: 'Metoda de plata',
}

export function parseStringIntoObject(source: string): Record<string, string> {
  const rows = source.split(/(?:\r?\n)+/)
  const mappedData = rows.reduce((map, row) => {
    const [key, value] = row.split(':').map((item) => item.trim())

    return {
      ...map,
      [key]: value,
    }
  }, {})

  return mappedData
}

export function getPaymentMethodFromTextField(
  openTextField: string | null
): string | null {
  if (!openTextField) {
    return null
  }

  const textFieldValues = parseStringIntoObject(openTextField)
  const paymentMethod = textFieldValues[OpenTextFields.paymentMethod]

  return paymentMethod ?? null
}
