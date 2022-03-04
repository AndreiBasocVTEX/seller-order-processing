import React from 'react'
import type { FC } from 'react'
import { Link, PageHeader, Tag } from 'vtex.styleguide'
import { useRuntime } from 'vtex.render-runtime'
import { useIntl } from 'react-intl'

import type { IOrderHeaderProps } from '../../types/order'

const OrderHeader: FC<IOrderHeaderProps> = ({ orderId, orderStatus }) => {
  const runtime = useRuntime()
  const intl = useIntl()
  const handleLinkClick = () => {
    runtime.history.goBack()
  }

  return (
    <>
      <div className="flex items-center">
        <PageHeader
          linkLabel={intl.formatMessage({
            id: 'order-detail.header.link-label',
          })}
          onLinkClick={handleLinkClick}
          title={`${intl.formatMessage({
            id: 'order-detail.header.title',
          })} #${orderId}`}
        >
          <span className="flex items-center h-100 ml6">
            <span className="mv0 mr2 f5">
              {intl.formatMessage({
                id: 'order-detail.header.order-status',
              })}
              :
            </span>
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
                href={`/admin/checkout/#/orders/${orderId}`}
                target="_blank"
              >
                {intl.formatMessage({
                  id: 'order-detail.header.standard-page',
                })}
              </Link>
            </span>
          </span>
        </PageHeader>
      </div>
    </>
  )
}

export default OrderHeader
