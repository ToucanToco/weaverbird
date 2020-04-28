import { $$, castFromString, enumerate, generateNewColumnName } from '@/lib/helpers';

describe('castFromString', () => {
  it('should cast numeric string to number type', () => {
    const string1 = '42';
    const string2 = '4.2';
    expect(castFromString(string1, 'integer')).toEqual(42);
    expect(castFromString(string2, 'float')).toEqual(4.2);
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
});
