import React, { useState, useEffect } from 'react'
import { Modal, Button } from 'vtex.styleguide'
import type { FC } from 'react'

import type { IErrorPopUpMessage } from '../../types/errorModalMessage'

const ErrorPopUpMessage: FC<IErrorPopUpMessage> = ({
  errorStatus,
  errorMessage,
  timeSeconds,
  resetError,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setIsModalOpen(false)
      resetError?.()
    }, (timeSeconds && timeSeconds * 1000) || 3000)
  }, [])

  const onCLoseModal = () => {
    setIsModalOpen(false)
    resetError?.()
  }

  return (
    <>
      <Modal isOpen={isModalOpen} showCloseIcon={false} onClose={onCLoseModal}>
        <div className="flex flex-column items-center">
          {errorStatus && (
            <h4 className="t-heading-4 red">ERROR {errorStatus}</h4>
          )}
          <h5 className="t-heading-5 black">{errorMessage}</h5>
          <div>
            <Button size="large" onClick={onCLoseModal}>
              ok
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default ErrorPopUpMessage
