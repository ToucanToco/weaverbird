import { DataSetColumnType } from './dataset';
import { AddTotalRowsStep, RollupStep } from './steps';

type ValueType = number | boolean | string | null;
/** We do not include AggregateStep as this step has some specifities that do
 *  not factorize well in the setAggregationsNewColumnsInStep helper function
 *  defined below */
type StepWithAggregations = AddTotalRowsStep | RollupStep;

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

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
export function escapeForUseInRegExp(string: string): string {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Returns all the combinations of elements in an array.
 * e.g. combinations(['A', 'B', 'C']) => [['A', 'B', 'C'], ['A', 'B'], ['A', 'C'], ['B', 'C'], ['A'], ['B'], ['C']]
 *
 * @param arr the array of elements
 *
 */
export function combinations(arr: any[]): any[][] {
  if (arr.length == 0) return [];
  const rest = arr.slice(1);
  const comb: any[] = combinations(rest);
  return [[arr[0]], ...comb.map(d => [arr[0], ...d]), ...comb].sort((a, b) => b.length - a.length);
}

/**
 * Modifies inplace a step that includes aggregations to set the parameter
 * `newcolumns` cleverly: if different aggregations have to be performed on the
 * same column, the new column name will be suffixed accordingly.
 *
 * @param step a step that includes an aggregation parameter of the form:
 *  { columns: ['A', 'B'], aggfunction: 'sum', newcolumns: []}
 */
export function setAggregationsNewColumnsInStep(step: StepWithAggregations) {
  const newcolumnOccurences: { [prop: string]: number } = {};
  for (const agg of step.aggregations) {
    agg.newcolumns = [...agg.columns];
    for (const c of agg.newcolumns) {
      newcolumnOccurences[c] = (newcolumnOccurences[c] || 0) + 1;
    }
  }
  for (const agg of step.aggregations) {
    for (let i = 0; i < agg.newcolumns.length; i++) {
      if (newcolumnOccurences[agg.newcolumns[i]] > 1) {
        agg.newcolumns.splice(i, 1, `${agg.newcolumns[i]}-${agg.aggfunction}`);
      }
    }
  }
}
