import React, { useEffect, useState } from 'react'
import type { FC } from 'react'
import { Button, IconDownload, Tooltip } from 'vtex.styleguide'
import axios from 'axios'

import { SMARTBILL } from '../../utils/constants'
import type { InvoiceButtonProps } from '../../types/common'

const InvoiceButton: FC<InvoiceButtonProps> = ({
  orderId,
  invoiceKey,
  invoiceNumber,
  invoiceUrl,
  orderStatus,
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [invoiceAvailable, setInvoiceAvailable] = useState<string | null>(null)

  const isFactureUrlAvailable = (
    invoiceType?: string | null
  ): string | null => {
    if (invoiceType === SMARTBILL) {
      return SMARTBILL
    }

    if (invoiceNumber) {
      return invoiceUrl || 'noUrl'
    }

    if (invoiceUrl) {
      return invoiceUrl
    }

    return null
  }

  const printInvoice = async (_orderId: string) => {
    setIsLoading(true)
    const { data } = await axios.get(`/opa/orders/${_orderId}/get-invoice`, {
      params: {
        paperSize: 'A4',
      },
      responseType: 'blob',
    })

    const blob = new Blob([data], { type: 'application/pdf' })
    const blobURL = URL.createObjectURL(blob)

    window.open(blobURL)
    setIsLoading(false)
  }

  useEffect(() => {
    setInvoiceAvailable(isFactureUrlAvailable(invoiceKey))
    setIsLoading(false)
  }, [orderId, invoiceKey])

  const invoiceButton = () => (
    <Button
      variation="secondary"
      block
      isLoading={isLoading}
      disabled={orderStatus === 'canceled' || invoiceAvailable === 'noUrl'}
      onClick={() => {
        invoiceAvailable && invoiceAvailable !== SMARTBILL
          ? window.open(`https://${invoiceAvailable}`)
          : printInvoice(orderId)
      }}
    >
      <span style={{ paddingRight: '10px' }}>
        <IconDownload />
      </span>

      <span className="mw-100 truncate f6">{invoiceNumber}</span>
    </Button>
  )

  return invoiceAvailable ? (
    invoiceAvailable !== 'noUrl' ? (
      <Tooltip label={invoiceNumber}>{invoiceButton()}</Tooltip>
    ) : (
      invoiceButton()
    )
  ) : null
}

export default InvoiceButton
