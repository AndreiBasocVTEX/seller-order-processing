import React from 'react'
import type { FC } from 'react'
import { Link, PageHeader, Tag } from 'vtex.styleguide'
import { useRuntime } from 'vtex.render-runtime'

import type { IOrderHeaderProps } from '../../types/order'

const OrderHeader: FC<IOrderHeaderProps> = ({ orderId, orderStatus }) => {
  const { navigate } = useRuntime()
  const handleLinkClick = () => navigate({ to: '/admin/app/seller-dashboard' })

  return (
    <>
      <div className="flex items-center">
        <PageHeader
          linkLabel="Orders"
          onLinkClick={handleLinkClick}
          title={`Order #${orderId}`}
        >
          <span className="flex items-center h-100 ml6">
            <span className="mv0 mr2 f5">Statut comanda:</span>
            <Tag
              bgColor={orderStatus?.bgColor ?? '#979899'}
              color={orderStatus?.color ?? '#FFF'}
            >
              <span className="f7">
                {' '}
                {orderStatus?.longText ?? 'Necunoscut'}
              </span>
            </Tag>
            <span className="ml5 underline">
              <Link
                href={`/admin/checkout/#/orders/GCB-${orderId}`}
                target="_blank"
              >
                Vezi pagina standard
              </Link>
            </span>
          </span>
        </PageHeader>
      </div>
    </>
  )
}

export default OrderHeader
