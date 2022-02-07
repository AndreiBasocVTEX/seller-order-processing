import React from 'react'
import type { FC } from 'react'
import { PageHeader, Tag } from 'vtex.styleguide'
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
            <h5 className="t-heading-5 mv0">
              Statut comanda:{' '}
              <Tag
                bgColor={orderStatus?.bgColor ?? '#979899'}
                color={orderStatus?.color ?? '#FFF'}
              >
                {orderStatus?.longText ?? 'Necunoscut'}
              </Tag>
            </h5>
          </span>
        </PageHeader>
      </div>
    </>
  )
}

export default OrderHeader
