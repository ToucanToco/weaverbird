/**
 * This module contains pagination helpers.
 */

export interface PaginationContext {
  /**
   * pagination context (i.e. number of results displayed per page and current page number)
   */
  shouldPaginate: boolean;
  pageSize: number;
  pageNumber: number;
  totalCount?: number;
  isLastPage?: boolean;
}

/**
 * Get number of total pages
 */
export function numberOfPages(paginationContext: PaginationContext) {
  if (!paginationContext.totalCount) {
    return;
  }
  return Math.ceil(paginationContext.totalCount / paginationContext.pageSize);
}

/**
 * Get page offset
 */
export function pageOffset(pageSize: number, pageNumber: number) {
  return Math.max(pageNumber - 1, 0) * pageSize;
}

export function counterText({
  useArrowPagination,
  paginationContext,
  pageCount,
}: {
  useArrowPagination: boolean;
  paginationContext: PaginationContext;
  pageCount?: number;
}): string | undefined {
  // when the total count is unknown - i.e. when data come from an external db
  if (!paginationContext.totalCount || useArrowPagination) {
    return;
    // when we don't need a pagination - i.e. the rows fits one page
  } else if (!paginationContext.shouldPaginate) {
    return `${paginationContext.totalCount} rows`;
  } else {
    const { pageSize, pageNumber, totalCount } = paginationContext;
    const firstRowNumber = (pageNumber - 1) * pageSize + 1;
    const lastRowNumber = pageCount === pageNumber ? totalCount : pageNumber * pageSize;
    return `${firstRowNumber} - ${lastRowNumber} of ${totalCount} rows`;
  }
}

export function shouldUseArrowPagination(
  currentPaginationContext: PaginationContext,
  oldPaginationContext?: PaginationContext,
): boolean {
  // case 1: we have one uniq page, no need to use arrow pagination
  if (!currentPaginationContext.shouldPaginate) return false;
  // case 2: there is no totalCount on this page, use arrow navigation.
  if (!currentPaginationContext.totalCount) return true;
  // case 3: if we didn't had totalCount on previous page while reaching last page, keep navigation unchanged
  // nb: it happen when targetting connectors data for example. We can know the total count only when reaching the last page
  // avoid to have different navigation by keeping arrow navigation on last page
  if (
    currentPaginationContext.isLastPage &&
    oldPaginationContext &&
    !oldPaginationContext.totalCount
  ) {
    return true;
  }
  // case 4: we have totalCount on every pages, we can use page numbers, do not use arrow navigation
  return false;
}
