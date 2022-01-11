import {
  $$,
  castFromString,
  combinations,
  enumerate,
  generateNewColumnName,
  keepCurrentValueIfArrayType,
  keepCurrentValueIfCompatibleDate,
  keepCurrentValueIfCompatibleRelativeDate,
  keepCurrentValueIfCompatibleType,
  setAggregationsNewColumnsInStep,
} from '@/lib/helpers';
import { AddTotalRowsStep } from '@/lib/steps';

describe('castFromString', () => {
  it('should cast numeric string to number type', () => {
    const string1 = '42';
    const string2 = '4.2';
    expect(castFromString(string1, 'integer')).toEqual(42);
    expect(castFromString(string2, 'float')).toEqual(4.2);
  });

  it('should cast date string to date', () => {
    const string1 = '2021-01-01';
    expect(castFromString(string1, 'date')).toEqual(new Date(string1));
  });

  it('should cast date variable to string', () => {
    const variable = '<%= lala %>';
    expect(castFromString(variable, 'date')).toEqual(variable);
  });

  it('should not cast a string that does not convert to number type', () => {
    const string = 'Hey';
    expect(castFromString(string, 'integer')).toEqual('Hey');
    expect(castFromString(string, 'float')).toEqual('Hey');
  });

  it('should cast numeric string to boolean type', () => {
    const string1 = 'true';
    const string2 = 'True';
    const string3 = 'TRUE';
    const string4 = '1';
    const string5 = 'false';
    const string6 = 'False';
    const string7 = 'FALSE';
    const string8 = '0';
    expect(castFromString(string1, 'boolean')).toEqual(true);
    expect(castFromString(string2, 'boolean')).toEqual(true);
    expect(castFromString(string3, 'boolean')).toEqual(true);
    expect(castFromString(string4, 'boolean')).toEqual(true);
    expect(castFromString(string5, 'boolean')).toEqual(false);
    expect(castFromString(string6, 'boolean')).toEqual(false);
    expect(castFromString(string7, 'boolean')).toEqual(false);
    expect(castFromString(string8, 'boolean')).toEqual(false);
  });

  it('should not cast a string that does not convert to boolean type', () => {
    const string = 'FaLsE';
    expect(castFromString(string, 'boolean')).toEqual('FaLsE');
  });

  describe('generateNewColumnName', () => {
    it('should return a valid new column name', () => {
      const existingNames = ['bar'];
      const newName = 'foo';
      expect(generateNewColumnName(newName, existingNames)).toEqual('foo');
      existingNames.push('foo');
      expect(generateNewColumnName(newName, existingNames)).toEqual('foo1');
      existingNames.push('foo1');
      expect(generateNewColumnName(newName, existingNames)).toEqual('foo2');
    });
  });

  describe('$$: mongo column name', () => {
    it('should return a formatted mongo column name', () => {
      expect($$('test')).toEqual('$test');
    });
  });

  describe('enumerate', () => {
    it('should handle empty arrays', () => {
      const got = Array.from(enumerate([]));
      expect(got).toEqual([]);
    });

    it('should emit index / value pairs on arrays', () => {
      const got = Array.from(enumerate(['foo', 'bar', 'baz']));
      expect(got).toEqual([
        [0, 'foo'],
        [1, 'bar'],
        [2, 'baz'],
      ]);
    });

    it('should emit index / value pairs on arrays, starting at 1', () => {
      const got = Array.from(enumerate(['foo', 'bar', 'baz'], 3));
      expect(got).toEqual([
        [3, 'foo'],
        [4, 'bar'],
        [5, 'baz'],
      ]);
    });

    it('should emit index / value pairs on strings', () => {
      const got = Array.from(enumerate('hello'));
      expect(got).toEqual([
        [0, 'h'],
        [1, 'e'],
        [2, 'l'],
        [3, 'l'],
        [4, 'o'],
      ]);
    });

    it('should emit index / value pairs on generators', () => {
      function* f() {
        yield 'foo';
        yield 'bar';
        yield 'baz';
      }
      const got = Array.from(enumerate(f()));
      expect(got).toEqual([
        [0, 'foo'],
        [1, 'bar'],
        [2, 'baz'],
      ]);
    });
  });

  describe('keepCurrentValueIfCompatibleType', () => {
    it('should return default if selected value is an array', () => {
      expect(keepCurrentValueIfCompatibleType(['a'], '')).toEqual('');
    });
    it("should return default if its type doesn't match selected value", () => {
      expect(keepCurrentValueIfCompatibleType(3, '')).toEqual('');
    });
    it('should return selected value if its type match default one', () => {
      expect(keepCurrentValueIfCompatibleType('3', '')).toEqual('3');
    });
  });

  describe('keepCurrentValueIfCompatibleDate', () => {
    it('should return default if selected value is not a date', () => {
      expect(keepCurrentValueIfCompatibleDate(3, null)).toEqual(null);
      expect(keepCurrentValueIfCompatibleDate(null, null)).toEqual(null);
    });
    it('should return default if selected value is not a well formatted date', () => {
      expect(keepCurrentValueIfCompatibleDate(new Date('toto'), null)).toEqual(null);
    });
    it('should return selected value if its a well formatted date', () => {
      const value = new Date('12/04/2021');
      expect(keepCurrentValueIfCompatibleDate(value, null)).toEqual(value);
    });
    it('should return selected value if its a string', () => {
      expect(keepCurrentValueIfCompatibleDate('<%= lala %>', null)).toEqual('<%= lala %>');
    });
  });

  describe('keepCurrentValueIfCompatibleRelativeDate', () => {
    it('should return default if selected value is not a date/relative date or string', () => {
      expect(keepCurrentValueIfCompatibleRelativeDate(3, null)).toEqual(null);
      expect(keepCurrentValueIfCompatibleRelativeDate(null, null)).toEqual(null);
    });
    it('should return selected value if its a well formatted date', () => {
      const value = new Date('12/04/2021');
      expect(keepCurrentValueIfCompatibleRelativeDate(value, null)).toEqual(value);
    });
    it('should return selected value if its a well formatted relative date', () => {
      const value = { quantity: 2, duration: 'year', operator: 'until', date: '{{today}}' };
      expect(keepCurrentValueIfCompatibleRelativeDate(value, null)).toEqual(value);
    });
    it('should return selected value if its a string', () => {
      expect(keepCurrentValueIfCompatibleRelativeDate('<%= lala %>', null)).toEqual('<%= lala %>');
    });
  });

  describe('keepCurrentValueIfArrayType', () => {
    it('should return default if selected value is not an array', () => {
      expect(keepCurrentValueIfArrayType('a', [])).toEqual([]);
    });
    it('should return selected value if its type is an array', () => {
      expect(keepCurrentValueIfArrayType(['a'], [])).toEqual(['a']);
    });
  });

  describe('combinations', () => {
    it('should return an empty array if input array is empty', () => {
      expect(combinations([])).toEqual([]);
    });
    it('should return the right sorted array of combinations', () => {
      expect(combinations(['A', 'B', 'C'])).toEqual([
        ['A', 'B', 'C'],
        ['A', 'B'],
        ['A', 'C'],
        ['B', 'C'],
        ['A'],
        ['B'],
        ['C'],
      ]);
    });
  });

  describe('setAggregationsNewColumnsInStep', () => {
    it('should use the input column names as new column names if no clever renaming is required', () => {
      const step: AddTotalRowsStep = {
        name: 'totals',
        totalDimensions: [{ totalColumn: 'foo', totalRowsLabel: 'bar' }],
        aggregations: [
          { columns: ['foo', 'bar'], newcolumns: ['', ''], aggfunction: 'sum' },
          { columns: ['toto', 'tata'], newcolumns: ['', ''], aggfunction: 'avg' },
        ],
      };
      const expected = {
        ...step,
        aggregations: [
          { columns: ['foo', 'bar'], newcolumns: ['foo', 'bar'], aggfunction: 'sum' },
          { columns: ['toto', 'tata'], newcolumns: ['toto', 'tata'], aggfunction: 'avg' },
        ],
      };
      setAggregationsNewColumnsInStep(step);
      expect(step).toEqual(expected);
    });

    it('should set new column names cleverly if sevral aggregations have to be performed on the same input clumn', () => {
      const step: AddTotalRowsStep = {
        name: 'totals',
        totalDimensions: [{ totalColumn: 'foo', totalRowsLabel: 'bar' }],
        aggregations: [
          { columns: ['foo', 'bar'], newcolumns: ['', ''], aggfunction: 'sum' },
          { columns: ['foo', 'bar'], newcolumns: ['', ''], aggfunction: 'avg' },
        ],
      };
      const expected = {
        ...step,
        aggregations: [
          { columns: ['foo', 'bar'], newcolumns: ['foo-sum', 'bar-sum'], aggfunction: 'sum' },
          { columns: ['foo', 'bar'], newcolumns: ['foo-avg', 'bar-avg'], aggfunction: 'avg' },
        ],
      };
      setAggregationsNewColumnsInStep(step);
      expect(step).toEqual(expected);
    });
  });
});
