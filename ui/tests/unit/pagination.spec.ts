import * as P from '@/lib/dataset/pagination';

describe('pagination tests', () => {
  it('should compute number of pages correctly', () => {
    const context: P.PaginationContext = {
      pageno: 1,
      pagesize: 20,
      totalCount: 208,
    };
    expect(P.numberOfPages(context)).toEqual(11);
  });

  it('should compute page offset correctly', () => {
    expect(P.pageOffset(20, -1)).toEqual(0);
    expect(P.pageOffset(20, 0)).toEqual(0);
    expect(P.pageOffset(20, 1)).toEqual(0);
    expect(P.pageOffset(20, 2)).toEqual(20);
  });

  it('should return correctly the min and max row of a page offset on the first page', () => {
    const context: P.PaginationContext = {
      pageno: 1,
      pagesize: 20,
      totalCount: 208,
    };
    expect(P.pageMinMax(context)).toEqual({ min: 1, max: 20 });
  });

  it('should return last page of pagination', () => {
    const context: P.PaginationContext = {
      pageno: 0,
      pagesize: 50,
      totalCount: 100,
    };
    expect(P.numberOfPages(context)).toEqual(2);
  });

  it('should return correctly the min and max row of a page offset on the last page', () => {
    const context: P.PaginationContext = {
      pageno: 2,
      pagesize: 50,
      totalCount: 100,
    };
    expect(P.pageMinMax(context)).toEqual({ min: 51, max: 100 });
  });

  it('should return correctly the min and max row of a page offset on the last page with total count less than the page count', () => {
    const context: P.PaginationContext = {
      pageno: 11,
      pagesize: 20,
      totalCount: 208,
    };
    expect(P.pageMinMax(context)).toEqual({ min: 201, max: 208 });
  });
});
