import { act, renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router'
import {
  buildRequestQuery,
  useTicketsUrlParams,
  defaultSort,
  defaultPage,
  defaultFilters,
  type TicketsParams,
} from './useTicketsUrlParams'
import {
  TicketSortColumn,
  SortOrder,
  TicketStatus,
  TicketCategory,
  DEFAULT_PAGE_SIZE,
} from '@helpdesk/core'

function renderUseTicketsUrlParams() {
  return renderHook(() => ({ ticketsUrlParams: useTicketsUrlParams(), location: useLocation() }), {
    wrapper: ({ children }) => <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>,
  })
}

describe('buildRequestQuery', () => {
  it('correctly builds required URL params', () => {
    const params: TicketsParams = {
      sort: { column: TicketSortColumn.subject, order: SortOrder.asc },
      filters: { search: '', status: [], category: [] },
      page: 2,
    }

    const query = buildRequestQuery(params)

    expect(query.get('sortBy')).toBe('subject')
    expect(query.get('sortOrder')).toBe('asc')
    expect(query.get('page')).toBe('2')
    expect(query.get('pageSize')).toBe(String(DEFAULT_PAGE_SIZE))
  })

  it('correctly builds optional URL params', () => {
    const params: TicketsParams = {
      sort: { column: TicketSortColumn.status, order: SortOrder.desc },
      filters: {
        search: 'login',
        status: [TicketStatus.open, TicketStatus.closed],
        category: [TicketCategory.technical_question, TicketCategory.general_question],
      },
      page: 2,
    }

    const query = buildRequestQuery(params)

    expect(query.get('search')).toBe('login')
    expect(query.getAll('status')).toEqual(['open', 'closed'])
    expect(query.getAll('category')).toEqual(['technical_question', 'general_question'])
  })
})

describe('useTicketsUrlParams', () => {
  describe('setting URL params', () => {
    it('correctly sets required URL params', () => {
      const { result } = renderUseTicketsUrlParams()

      act(() => {
        result.current.ticketsUrlParams.setUrlParams({
          sort: { column: TicketSortColumn.subject, order: SortOrder.asc },
          filters: defaultFilters,
          page: 2,
        })
      })

      //Unlike in 'buildRequestQuery', 'pageSize' is not present in URL
      const urlParams = new URLSearchParams(result.current.location.search)
      expect(urlParams.get('sortBy')).toBe('subject')
      expect(urlParams.get('sortOrder')).toBe('asc')
      expect(urlParams.get('page')).toBe('2')
    })

    it('correctly sets optional URL params', () => {
      const { result } = renderUseTicketsUrlParams()

      act(() => {
        result.current.ticketsUrlParams.setUrlParams({
          sort: defaultSort,
          filters: {
            search: 'billing',
            status: [TicketStatus.open, TicketStatus.closed],
            category: [TicketCategory.refund_request, TicketCategory.general_question],
          },
          page: defaultPage,
        })
      })

      const urlParams = new URLSearchParams(result.current.location.search)
      expect(urlParams.get('search')).toBe('billing')
      expect(urlParams.getAll('status')).toEqual(['open', 'closed'])
      expect(urlParams.getAll('category')).toEqual(['refund_request', 'general_question'])
    })

    it('produces empty URL when required params match the defaults and optional params are missing', () => {
      const { result } = renderUseTicketsUrlParams()

      act(() => {
        result.current.ticketsUrlParams.setUrlParams({
          sort: defaultSort,
          filters: defaultFilters,
          page: defaultPage,
        })
      })

      expect(result.current.location.search).toBe('')
    })
  })

  describe('reading URL params', () => {
    it('correctly reads params', () => {
      const { result } = renderUseTicketsUrlParams()

      act(() => {
        result.current.ticketsUrlParams.setUrlParams({
          sort: { column: TicketSortColumn.subject, order: SortOrder.asc },
          filters: {
            search: 'refund',
            status: [TicketStatus.open, TicketStatus.resolved],
            category: [TicketCategory.refund_request, TicketCategory.general_question],
          },
          page: 3,
        })
      })

      expect(result.current.ticketsUrlParams.sort).toEqual({
        column: TicketSortColumn.subject,
        order: SortOrder.asc,
      })
      expect(result.current.ticketsUrlParams.filters).toEqual({
        search: 'refund',
        status: [TicketStatus.open, TicketStatus.resolved],
        category: [TicketCategory.refund_request, TicketCategory.general_question],
      })
      expect(result.current.ticketsUrlParams.page).toBe(3)
    })

    it('returns default values for missing required URL params', () => {
      const { result } = renderUseTicketsUrlParams()

      expect(result.current.ticketsUrlParams.sort).toEqual(defaultSort)
      expect(result.current.ticketsUrlParams.filters).toEqual(defaultFilters)
      expect(result.current.ticketsUrlParams.page).toBe(defaultPage)
    })
  })
})
