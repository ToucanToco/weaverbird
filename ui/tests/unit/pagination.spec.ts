import { describe, expect, it } from 'vitest';

import {
  type PaginationContext,
  getPaginationTotalRowsCount,
  numberOfPages,
  pageOffset,
  shouldPaginate,
  shouldUseArrowPagination,
} from '@/lib/dataset/pagination';

describe('pagination tests', () => {
  describe('shouldPaginate', () => {
    it('should return true if there is previous or next page', () => {
      expect(
        shouldPaginate({
          next_page: { offset: 50, limit: 50 },
          parameters: { offset: 50, limit: 50 },
          pagination_info: {
            type: 'unknown_size',
            is_last_page: true,
          },
        }),
      ).toBe(true);
    });
    it('should return false if there is one uniq page', () => {
      expect(
        shouldPaginate({
          parameters: { offset: 50, limit: 50 },
          pagination_info: {
            type: 'unknown_size',
            is_last_page: true,
          },
        }),
      ).toBe(false);
    });
    it('should return false if pagination is not set', () => {
      expect(shouldPaginate()).toBe(false);
    });
  });

  describe('getPaginationTotalRowsCount', () => {
    it('should return total rows count', () => {
      expect(
        getPaginationTotalRowsCount({
          parameters: { offset: 50, limit: 50 },
          pagination_info: {
            type: 'known_size',
            is_last_page: false,
            total_rows: 300,
          },
        }),
      ).toBe(300);
    });
    it('should return undefined if total rows count is unknown', () => {
      expect(
        getPaginationTotalRowsCount({
          parameters: { offset: 50, limit: 50 },
          pagination_info: {
            type: 'unknown_size',
            is_last_page: true,
          },
        }),
      ).toBeUndefined();
    });
    it('should return undefined if pagination is not set', () => {
      expect(getPaginationTotalRowsCount()).toBeUndefined();
    });
  });

  describe('shouldUseArrowPagination', () => {
    it('should return false if there is one uniq page', () => {
      expect(
        shouldUseArrowPagination(
          {
            shouldPaginate: false,
            totalCount: undefined,
            pageSize: 50,
            pageNumber: 1,
            isLastPage: true,
          },
          undefined,
        ),
      ).toBe(false);
    });

    it('should return true if current page has unknown total count', () => {
      expect(
        shouldUseArrowPagination(
          {
            shouldPaginate: true,
            totalCount: undefined,
            pageSize: 50,
            pageNumber: 1,
            isLastPage: false,
          },
          undefined,
        ),
      ).toBe(true);
    });

    it('should return false if current and previous pages has both known total count', () => {
      expect(
        shouldUseArrowPagination(
          {
            shouldPaginate: true,
            totalCount: 100,
            pageSize: 50,
            pageNumber: 2,
            isLastPage: false,
          },
          {
            shouldPaginate: true,
            totalCount: 100,
            pageSize: 50,
            pageNumber: 1,
            isLastPage: false,
          },
        ),
      ).toBe(false);
    });

    it('should return true if one last page and previous page had unknown total count', () => {
      expect(
        shouldUseArrowPagination(
          {
            shouldPaginate: true,
            totalCount: 100,
            pageSize: 50,
            pageNumber: 2,
            isLastPage: true,
          },
          {
            shouldPaginate: true,
            totalCount: undefined,
            pageSize: 50,
            pageNumber: 1,
            isLastPage: false,
          },
        ),
      ).toBe(true);
    });
  });

  it('should compute number of pages correctly', () => {
    const context: PaginationContext = {
      shouldPaginate: true,
      pageNumber: 1,
      pageSize: 20,
      totalCount: 208,
      isLastPage: false,
    };
    expect(numberOfPages(context)).toEqual(11);
  });

  it('should compute page offset correctly', () => {
    expect(pageOffset(20, -1)).toEqual(0);
    expect(pageOffset(20, 0)).toEqual(0);
    expect(pageOffset(20, 1)).toEqual(0);
    expect(pageOffset(20, 2)).toEqual(20);
  });

  it('should return last page of pagination', () => {
    const context: PaginationContext = {
      shouldPaginate: true,
      pageNumber: 0,
      pageSize: 50,
      totalCount: 100,
      isLastPage: false,
    };
    expect(numberOfPages(context)).toEqual(2);
  });
});
