import * as P from '@/lib/dataset/pagination';

describe('pagination tests', () => {
  it('should compute handle empty total count', () => {
    const context: P.PaginationContext = {
      pageno: 1,
      pagesize: 20,
    };
    expect(P.numberOfPages(context)).toEqual(0);
  });

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
});
