import React, { useEffect, useState } from 'react'
import type { FC } from 'react'
import { Button, IconDownload, Tooltip } from 'vtex.styleguide'
import { useIntl } from 'react-intl'

import { deliveryStatus, SMARTBILL } from '../../utils/constants'
import type { InvoiceButtonProps } from '../../types/common'
import ErrorPopUpMessage from '../ErrorPopUpMessage'
import { downloadInvoice } from '../../utils/api'

const InvoiceButton: FC<InvoiceButtonProps> = ({
  orderId,
  invoiceKey,
  invoiceNumber,
  invoiceUrl,
  orderStatus,
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [invoiceAvailable, setInvoiceAvailable] = useState<string | null>(null)
  const [axiosError, setAxiosError] = useState({
    isError: false,
    errorMessage: '',
    errorDetails: '',
  })

  const intl = useIntl()

  const isFactureUrlAvailable = (
    invoiceType?: string | null
  ): string | null => {
    if (invoiceType === SMARTBILL) {
      return SMARTBILL
    }

    if (invoiceNumber) {
      return invoiceUrl ?? 'noUrl'
    }

    if (invoiceUrl) {
      return invoiceUrl
    }

    return null
  }

  const printInvoice = async (_orderId: string) => {
    setIsLoading(true)
    downloadInvoice(_orderId)
      .catch((e) => {
        setAxiosError({
          ...axiosError,
          isError: true,
          errorDetails: e.details,
          errorMessage: String(e.message),
        })
      })
      .finally(() => setIsLoading(false))
  }

  const removeAxiosError = () => {
    setAxiosError({
      ...axiosError,
      isError: false,
    })
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
      disabled={
        orderStatus === deliveryStatus.CANCELED ||
        invoiceAvailable === 'noUrl' ||
        (invoiceAvailable && invoiceAvailable !== SMARTBILL)
      }
      onClick={(e: Event) => {
        e.stopPropagation()
        invoiceAvailable === SMARTBILL && printInvoice(orderId)
      }}
    >
      <div className="tl">
        <span className="pr3">
          <IconDownload />
        </span>
      </div>

      <span className="w-100 pr3 tc truncate f6">{invoiceNumber}</span>
    </Button>
  )

  return (
    <>
      {invoiceAvailable ? (
        invoiceAvailable !== 'noUrl' && invoiceAvailable === SMARTBILL ? (
          <Tooltip
            label={` ${intl.formatMessage({
              id: 'seller-dashboard.table-column.download-invoice',
            })} ${invoiceKey} ${invoiceNumber}`}
          >
            {invoiceButton()}
          </Tooltip>
        ) : (
          invoiceButton()
        )
      ) : null}
      {axiosError.isError && (
        <ErrorPopUpMessage
          errorMessage={axiosError.errorMessage}
          errorDetails={axiosError.errorDetails}
          resetError={removeAxiosError}
        />
      )}
    </>
  )
}

export default InvoiceButton
