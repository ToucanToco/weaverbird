/**
 * This module contains pagination helpers.
 */

import { PaginationContext } from '@/store/state';

/**
 * Get number of total pages
 */
export function numberOfPages(paginationContext: PaginationContext) {
  return Math.ceil((paginationContext.totalCount || 0) / paginationContext.pagesize);
}

/**
 * Get page offset
 */
export function pageOffset(paginationContext: PaginationContext, pageno: number) {
  return pageno * paginationContext.pagesize;
}
