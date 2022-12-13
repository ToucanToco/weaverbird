import { computeHeight } from '@/components/domutil';

describe('domutil', () => {
  describe('computeHeight', () => {
    it('should return undefined when there is enough space to display', () => {
      const ctx = {
        body: { height: 500, top: 0 },
        parent: { height: 40, top: 200 },
        element: { offsetHeight: 400 },
        window: { innerHeight: 500 },
      };
      expect(computeHeight(true, ctx)).toBe(undefined);
    });

    it('should return 200 when there is not enough space to display', () => {
      const ctx = {
        body: { height: 500, top: 0 },
        parent: { height: 40, top: 300 },
        element: { offsetHeight: 400 },
        window: { innerHeight: 500 },
      };
      expect(computeHeight(true, ctx)).toBe(160);
    });
  });
});