/**
 * This module contains pagination helpers.
 */

export interface PaginationContext {
  /**
   * pagination context (i.e. number of results displayed per page and current page number)
   */
  pagesize: number;
  pageno: number;
  totalCount: number;
}

/**
 * Get number of total pages
 */
export function numberOfPages(paginationContext: PaginationContext) {
  return Math.ceil(paginationContext.totalCount / paginationContext.pagesize);
}

/**
 * Get page offset
 */
export function pageOffset(pagesize: number, pageno: number) {
  return Math.max(pageno - 1, 0) * pagesize;
}

/**
 * Get page min/max row
 */
export function pageMinMax(paginationContext: PaginationContext) {
  const pageRowMin = pageOffset(paginationContext.pagesize, paginationContext.pageno);
  let pageRowMax;
  if (paginationContext.pageno === numberOfPages(paginationContext)) {
    pageRowMax = paginationContext.totalCount;
  } else {
    pageRowMax = pageRowMin + paginationContext.pagesize;
  }
  const pageRows = {
    min: pageRowMin + 1,
    max: pageRowMax,
  };
  return pageRows;
}
