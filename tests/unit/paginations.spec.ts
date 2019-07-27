import { PaginationContext } from '@/store/state';
import * as P from '@/lib/dataset/pagination';

describe('pagination tests', () => {
  it('should compute handle empty total count', () => {
    const context: PaginationContext = {
      pageno: 1,
      pagesize: 20,
    };
    expect(P.numberOfPages(context)).toEqual(0);
  });

  it('should compute number of pages correctly', () => {
    const context: PaginationContext = {
      pageno: 1,
      pagesize: 20,
      totalCount: 208,
    };
    expect(P.numberOfPages(context)).toEqual(11);
  });

  it('should compute page offset correctly', () => {
    const context: PaginationContext = {
      pageno: 1,
      pagesize: 20,
      totalCount: 208,
    };
    expect(P.pageOffset(context, 0)).toEqual(0);
    expect(P.pageOffset(context, 1)).toEqual(20);
  });
});
