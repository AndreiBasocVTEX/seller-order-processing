import React from 'react'
import { Alert } from 'vtex.styleguide'
import { useRuntime } from 'vtex.render-runtime'
import type { FC } from 'react'

const ErrorNotification: FC<{ errorMessage: string }> = ({ errorMessage }) => {
  const { navigate } = useRuntime()
  const handleLinkClick = () => navigate({ to: '/admin/app/seller-dashboard' })

  return (
    <>
      <Alert type="error" onClose={handleLinkClick}>
        {errorMessage}
      </Alert>
    </>
  )
}

export default ErrorNotification
