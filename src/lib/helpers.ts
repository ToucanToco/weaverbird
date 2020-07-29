import { DataSetColumnType } from './dataset';

type ValueType = number | boolean | string | null;

function isBooleanString(string: string): boolean {
  return (
    string === 'true' ||
    string === 'false' ||
    string === 'True' ||
    string === 'False' ||
    string === 'TRUE' ||
    string === 'FALSE' ||
    string === '1' ||
    string === '0'
  );
}

/**
 * Determines if a value canto be be cast to number
 *
 * @param value the value to be tested
 * @returns a boolean to determine if the value can be connverted to a number
 */
export function castFromString(value: string, type: DataSetColumnType) {
  if ((type === 'integer' || type === 'float') && value !== null && !isNaN(Number(value))) {
    return Number(value);
  } else if (type === 'boolean' && isBooleanString(value)) {
    return value === 'true' || value === 'True' || value === 'TRUE' || value === '1';
  }
  return value;
}

/**
 * Takes a proposed new column name and returns a valid name that does not erase
 * an existing column name. So if the proposed new name already exists in
 * existing columns names, it appends an integer that increments until the new
 * name becomes unique.
 *
 * @param newName the proposed new column name
 * @param existingNames the existing columns names
 */
export function generateNewColumnName(newName: string, existingNames: string[]): string {
  let i = 1;
  let validNewName = newName;
  while (existingNames.includes(validNewName)) {
    validNewName = `${newName}${i++}`;
  }
  return validNewName;
}

/**
 * small helper / shortcut for `$${mycol}` in mongo translations
 *
 * @param colname the column name
 */
export function $$(colname: string) {
  return `$${colname}`;
}

/**
 * enumerate(iterable[, start]) -> iterator for index, value of iterable
 *
 * enumerate yields pairs containing a count (from `start`, which defaults to
 * zero) and a value yielded by the iterable argument.
 *
 * @param values
 */
export function* enumerate<T>(values: Iterable<T>, start = 0): Generator<[number, T]> {
  let idx = start;
  for (const value of values) {
    yield [idx++, value];
  }
}

/**
 * Return default value if selected value has different typeof
 *
 * @param value the selected value
 * @param defaultValue the default to compare
 */
export function keepCurrentValueIfCompatibleType(
  value: ValueType | ValueType[],
  defaultValue: ValueType,
): ValueType {
  if (Array.isArray(value)) return defaultValue;
  return typeof value === typeof defaultValue ? value : defaultValue;
}

/**
 * Return default value if selected value is not an array
 *
 * @param value the selected value
 * @param defaultValue the default to compare
 */
export function keepCurrentValueIfArrayType(
  value: ValueType | ValueType[],
  defaultValue: ValueType[],
): ValueType[] {
  return Array.isArray(value) ? value : defaultValue;
}
