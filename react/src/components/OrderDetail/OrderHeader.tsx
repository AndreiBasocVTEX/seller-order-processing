import React, { useEffect, useState } from 'react'
import type { FC } from 'react'
import { PageHeader, Tag } from 'vtex.styleguide'
import { useRuntime } from 'vtex.render-runtime'

interface HeaderProps {
  orderId: string
  orderStatus?: string
}
interface OrderStatus {
  tagBgColor: string
  tagColor: string
  tagText: string
}

const OrderHeader: FC<HeaderProps> = ({ orderId, orderStatus }) => {
  const [status, setStatus] = useState<OrderStatus>()
  const { navigate } = useRuntime()
  const handleLinkClick = () => navigate({ to: '/admin/app/seller-dashboard' })

  const getOrderStatus = (_status: string | undefined) => {
    switch (_status) {
      case 'ready-for-handling':
        return {
          tagBgColor: '#44c767',
          tagColor: '#FFF',
          tagText: 'Ready for handling',
        }

      case 'waiting-for-sellers-confirmation':
        return {
          tagBgColor: '#44c767',
          tagColor: '#FFF',
          tagText: 'Waiting for sellers confirmation',
        }

      case 'payment-approved':
        return {
          tagBgColor: '#8bc34a',
          tagColor: '#FFF',
          tagText: 'Paid',
        }

      case 'canceled':
        return {
          tagBgColor: '#FF4136',
          tagColor: '#FFF',
          tagText: 'Canceled',
        }

      case 'invoiced':
        return {
          tagBgColor: '#00449E',
          tagColor: '#FFF',
          tagText: 'Invoiced',
        }

      case 'handling':
        return {
          tagBgColor: '#357EDD',
          tagColor: '#FFF',
          tagText: 'Handling',
        }

      case 'payment-pending':
        return {
          tagBgColor: '#98b13d',
          tagColor: '#FFF',
          tagText: 'Pending',
        }

      case 'cancellation-requested':
        return {
          tagBgColor: '#FF725C',
          tagColor: '#FFF',
          tagText: 'Cancellation requested',
        }

      default:
        return {
          tagBgColor: '#979899',
          tagColor: '#FFF',
          tagText: 'Necunoscut',
        }
    }
  }

  useEffect(() => {
    const handledOrderStatus = getOrderStatus(orderStatus)

    setStatus(handledOrderStatus)
  }, [orderStatus])

  return (
    <>
      <div className="flex items-center">
        <PageHeader
          linkLabel="Orders"
          onLinkClick={handleLinkClick}
          title={`Order #${orderId}`}
        >
          <span className="flex items-center h-100 ml6">
            <h5 className="t-heading-5 mv0">
              Statut comanda:{' '}
              <Tag bgColor={status?.tagBgColor} color={status?.tagColor}>
                {status?.tagText}
              </Tag>
            </h5>
          </span>
        </PageHeader>
      </div>
    </>
  )
}

export default OrderHeader
