/* eslint-disable no-console */

import React, { useState, useEffect, useCallback } from 'react'
import type { FC } from 'react'
import axios from 'axios'
import {
  Button,
  Table,
  Tag,
  ActionMenu,
  Tooltip,
  Pagination,
  Toggle,
  Totalizer,
  InputSearch,
} from 'vtex.styleguide'
import { FormattedCurrency } from 'vtex.format-currency'

import fancourier from '../logos/fancourier.png'
import cargus from '../logos/cargus.png'
import innoship from '../logos/innoship.png'
import '../src/style.css'
import type { IOrder } from '../typings/order'

const OrdersList: FC = () => {
  const [paginationParams, setPaginationParams] = useState({
    items: [],
    currentItemFrom: 1,
    currentItemTo: 2,
    itemsLength: 0,
    paging: {
      total: 0,
      currentPage: 1,
      perPage: 15,
      pages: 1,
    },
  })

  const courierOptions = [
    // useMemo
    {
      label: (
        <>
          <img
            alt="logo"
            style={{ width: '20px', paddingRight: '6px' }}
            src={cargus}
          />{' '}
          Cargus
        </>
      ),
      // onClick: () =>{
      // }
    },
    {
      label: (
        <>
          <img
            alt="logo"
            style={{ width: '20px', paddingRight: '6px' }}
            src={innoship}
          />{' '}
          Innoship
        </>
      ),
      // onClick: () =>{}
    },
    {
      label: (
        <>
          <img
            alt="logo"
            style={{ width: '20px', paddingRight: '6px' }}
            src={fancourier}
          />{' '}
          Fan Courier
        </>
      ),
      // onClick: () => {},
    },
    {
      label: 'Download PDF',
      isDangerous: 'true',
      // onClick: ()=>{},
    },
  ]

  const downloadOptions = [
    {
      label: 'Descarca AWB',
      // onClick: () => {
      // },
    },
    {
      label: 'Descarca Factura',
      // onClick: () => {},
    },
  ]

  const getItems = useCallback(async (newParams) => {
    const url = `/api/oms/pvt/orders?f_creationdate&page=${newParams.paging.currentPage}&per_page=${newParams.paging.perPage}` // &_=${Date.now()}

    try {
      const { data } = await axios.get(url, {
        headers: { Accept: 'application/json' },
        params: {},
      })

      // placeholder values for demonstration purposes, delete me l8r!
      data.list.forEach((item: IOrder) => {
        if (Math.round(Math.random()) === 0) {
          item.paymentNames = 'Card'
        } else {
          item.paymentNames = 'Ramburs'
        }
      })

      setPaginationParams({
        ...newParams,
        items: data.list,
        paging: data.paging,
        currentItemTo: data.paging.perPage * data.paging.currentPage,
      })
      console.log('getItems', data.list)
      console.log('getItemsDATA', data)
    } catch (err) {
      console.log(err)
    }
  }, [])

  type SchemeDataType = {
    rowData: IOrder
    cellData: IOrder
  }
  const displayStatus = (cellData: string) => {
    if (cellData === 'ready-for-handling') {
      return (
        <>
          <Tooltip label="Ready for handling" position="bottom">
            <div
              style={{
                backgroundColor: '#44c767',
                borderRadius: '14px',
                display: 'inline-block',
                color: '#fff',
                fontSize: '14px',
                padding: '4px 26px',
                fontWeight: '500',
              }}
            >
              RFH
            </div>
          </Tooltip>
        </>
      )
    }

    if (cellData === 'livrat') {
      return <Tag type="success">Shipped</Tag>
    }

    if (cellData === 'canceled') {
      return (
        <Tag bgColor="#FF4136" color="#fff">
          Canceled
        </Tag>
      )
    }

    if (cellData === 'invoiced') {
      return (
        <Tag bgColor="#00449E" color="#fff">
          Invoiced
        </Tag>
      )
    }

    if (cellData === 'handling') {
      return (
        <Tag bgColor="#357EDD" color="#fff">
          Handling
        </Tag>
      )
    }

    if (cellData === 'cancellation-requested') {
      return (
        <>
          <Tooltip label="Cancellation requested" position="bottom">
            <div
              style={{
                backgroundColor: '#FF725C',
                borderRadius: '14px',
                display: 'inline-block',
                color: '#fff',
                fontSize: '14px',
                padding: '4px 30px',
                fontWeight: '500',
              }}
            >
              CR
            </div>
          </Tooltip>
        </>
      )
    }

    return <span>missing tag</span>
  }

  const tableOrdersSchema = {
    properties: {
      status: {
        title: 'Status',
        width: 100,
        cellRenderer: ({ cellData }: { cellData: string }): JSX.Element => {
          return displayStatus(cellData)
        },
      },
      marketPlaceOrderId: {
        title: 'Elefant #',
        width: 90,
      },
      orderId: {
        title: 'VTEX #',
        width: 170,
      },
      creationDate: {
        title: 'Creation Date',
        width: 140,
        cellRenderer: ({ cellData }: { cellData: string }): string => {
          return new Intl.DateTimeFormat('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
            timeZone: 'Europe/Bucharest',
          }).format(new Date(cellData))
        },
      },
      ShippingEstimatedDateMax: {
        title: 'Shipping ETA',
        width: 120,
        cellRenderer: ({ cellData }: { cellData: string }): string => {
          return new Intl.DateTimeFormat('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'Europe/Bucharest',
          }).format(new Date(cellData))
        },
      },
      clientName: {
        title: 'Receiver',
        width: 150,
      },
      totalItems: {
        title: 'Items',
        width: 70,
        cellRenderer: ({ cellData }: SchemeDataType) => {
          return (
            <span className="f6 lh-copy">
              <Tag
                style={{ fontSize: '14px', lineHeight: '1.15rem' }}
                size="small"
              >
                {cellData}
              </Tag>
            </span>
          )
        },
      },
      totalValue: {
        title: 'Total Value',
        width: 100,
        cellRenderer: ({ cellData }: SchemeDataType) => {
          return <FormattedCurrency key={cellData} value={cellData} />
        },
      },
      paymentNames: {
        title: 'Pay Method',
        width: 100,
      },
      awbShipping: {
        title: 'AWB Shipping',
        width: 200,
        cellRenderer: ({ cellData }: SchemeDataType) => {
          console.log(cellData)

          return (
            <ActionMenu
              label="Generate"
              buttonProps={{
                variation: 'primary',
                size: 'small',
                id: 'dropdownBut',
              }}
              options={courierOptions}
            />
          )
        },
      },
      awbStatus: {
        title: 'AWB Status',
        width: 100,
        cellRenderer: ({ cellData }: { cellData: string }): JSX.Element => {
          return displayStatus(cellData)
        },
      },
      invoice: {
        title: 'Invoice',
        width: 150,
        cellRenderer: ({ cellData }: SchemeDataType) => {
          return (
            <Button
              style={{ width: '100%', justifyContent: 'end' }}
              variation="primary"
              className="self-end pl7"
              size="small"
              onClick={{ cellData }}
            >
              Generate
            </Button>
          )
        },
      },
    },
  }

  const handleNextClick = () => {
    const { currentPage } = paginationParams.paging
    const { currentItemTo } = paginationParams
    const { perPage } = paginationParams.paging
    const newParams = {
      ...paginationParams,
      currentItemFrom: currentPage * perPage,
      currentItemTo: currentItemTo * perPage,
      paging: { ...paginationParams.paging, currentPage: currentPage + 1 },
    }

    setPaginationParams(newParams)
    getItems(newParams)
  }

  const handlePrevClick = () => {
    const { currentPage } = paginationParams.paging
    const { currentItemTo } = paginationParams
    const { perPage } = paginationParams.paging
    const newParams = {
      ...paginationParams,
      paging: { ...paginationParams.paging, currentPage: currentPage - 1 },
      currentItemFrom: (currentPage - 2) * perPage,
      currentItemTo: currentItemTo * perPage,
    }

    setPaginationParams(newParams)
    getItems(newParams)
  }

  const handleRowsChange = useCallback((e: unknown, value: number) => {
    console.log(e)
    const newParams = {
      ...paginationParams,
      paging: { ...paginationParams.paging, perPage: Number(value) },
    }

    setPaginationParams(newParams)
    getItems(newParams)
  }, [])

  useEffect(() => {
    getItems(paginationParams)
  }, [])

  return (
    <div className="f6 lh-copy">
      <div className="mb5">
        <div style={{ width: '50%' }}>
          <InputSearch
            placeholder="Cautati numarul comenzii, destinatarul, plata"
            value=""
            size="regular"
            onChange={() => console.log('asd')}
          />
        </div>
      </div>
      <Totalizer
        horizontalLayout
        items={[
          {
            label: 'Orders',
            value: '566',
            inverted: true,
          },
          {
            label: 'Average Ticket',
            value: 'US$ 55.47',
            inverted: true,
          },
          {
            label: 'Gross',
            value: 'US$ 554.70',
            inverted: true,
          },
        ]}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            justifyContent: 'space-between',
          }}
        >
          <div
            className="dib pt5"
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '300px',
            }}
          >
            <Toggle
            // label={state.checked ? "Activated" : "Deactivated"}
            // checked={state.checked}
            // onChange={e => setState(prevState => ({ checked: !prevState.checked }))}
            />
            <span>&nbsp;&nbsp;Dezactivati actualizarea automata AWB</span>
          </div>
          <div className="pt5">
            <ActionMenu
              className="pt5"
              label="Descarca"
              buttonProps={{
                variation: 'secondary',
                size: 'small',
              }}
              options={downloadOptions}
            />
          </div>
          <div className="pagination" style={{ width: '300px' }}>
            <Pagination
              rowsOptions={[15, 25, 50, 100]}
              currentItemFrom={paginationParams.currentItemFrom}
              currentItemTo={paginationParams.currentItemTo}
              textOf="of"
              textShowRows="Pe pagina"
              totalItems={paginationParams.paging.total}
              onRowsChange={handleRowsChange}
              onNextClick={handleNextClick}
              onPrevClick={handlePrevClick}
            />
          </div>
        </div>
      </div>
      <Table
        density="medium"
        fullWidth
        items={paginationParams.items}
        schema={tableOrdersSchema}
        bulkActions={{
          texts: {
            secondaryActionsLabel: 'Actions',
            rowsSelected: (qty: React.ReactNode) => (
              <React.Fragment>Selected rows: {qty}</React.Fragment>
            ),
            selectAll: 'Select all',
            allRowsSelected: (qty: React.ReactNode) => (
              <React.Fragment>All rows selected: {qty}</React.Fragment>
            ),
          },
          totalItems: paginationParams.paging.total,
          onChange: (params: unknown) => console.log(params),
          others: [
            {
              label: 'GENEREAZA AWB',
              handleCallback: (params: unknown) => console.log(params),
            },
            {
              label: 'GENEREAZA AWB',
              handleCallback: (params: unknown) => console.log(params),
            },
          ],
        }}
      />
    </div>
  )
}

export default OrdersList
