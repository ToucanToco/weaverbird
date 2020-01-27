import { $$, castFromString, generateNewColumnName } from '@/lib/helpers';

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
});
