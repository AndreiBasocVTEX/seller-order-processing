import React, { useState } from 'react'
import { Modal, Button, Collapsible, Divider } from 'vtex.styleguide'
import type { FC } from 'react'

import type { IErrorPopUpMessage } from '../../types/errorModalMessage'

const ErrorPopUpMessage: FC<IErrorPopUpMessage> = ({
  errorMessage,
  errorDetails,
  resetError,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(true)
  const [isCollapseOpen, setIsCollapseOpen] = useState(false)
  const onCLoseModal = (e: Event) => {
    e.stopPropagation()
    setIsModalOpen(false)
    resetError?.()
  }

  return (
    <>
      <Modal isOpen={isModalOpen} showCloseIcon={false} onClose={onCLoseModal}>
        <div className="flex-column center pl6">
          <h3 className="t-heading-3 red">ERROR</h3>
          <h5 className="t-heading-5 black">{errorMessage}</h5>
          <div className="mv6">
            <Divider orientation="horizontal" />
          </div>
          {errorDetails && (
            <div className="flex flex-column mb4">
              <Collapsible
                header={<span className="gray mb-4">Details</span>}
                onClick={() => setIsCollapseOpen(!isCollapseOpen)}
                isOpen={isCollapseOpen}
                caretColor="muted"
              >
                <div className="bg-muted-5 pa4 mb6 mt4">
                  <p className="center w-100 mb4 pre overflow-auto">
                    {errorDetails}
                  </p>
                </div>
              </Collapsible>
            </div>
          )}
          <div className="flex">
            <Button onClick={onCLoseModal}>ok</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default ErrorPopUpMessage
