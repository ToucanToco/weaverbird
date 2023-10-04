import { expect, test } from 'vitest';

import { formatCellValue } from '@/components/format-cell-value';
import type { DataSetColumnType } from '@/types';

test.each([
  [1, 'integer' as const, '1'],
  [1.2, 'float' as const, '1.2'],
  [1.2, 'long' as const, '1.2'],
  [true, 'boolean' as const, 'true'],
  ['abc', 'string' as const, 'abc'],
  [new Date('1970-01-02T10:12:03.123Z'), 'date' as const, '1970-01-02 10:12:03.123'],
  [295923123, 'time' as const, '3d 10:12:03.123'],
  [[1], 'object' as const, '[1]'],
  [{ a: 1 }, 'object' as const, '{"a":1}'],
])('formatCellValue(%s, %s) should return %s', (value: any, type: DataSetColumnType, expected: any) => {
  expect(formatCellValue(value, type)).toBe(expected);
});
