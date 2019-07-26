import { DataSetColumnType } from './dataset';

function issStringBoolean(string: string): boolean {
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
  if ((type === 'integer' || type === 'float') && !isNaN(Number(value))) {
    return Number(value);
  } else if (type === 'boolean' && issStringBoolean(value)) {
    return value === 'true' || value === 'True' || value === 'TRUE' || value === '1';
  }
  return value;
}
