import {
  FilterCondition,
  FilterSimpleCondition,
  Formula,
  IfThenElseStep,
  isFilterComboAnd,
  isFilterComboOr,
} from '@/lib/steps';

export const EMPTY_CONDITION_SIGN = '<span class="empty">[null]</span>';

/**
 * Handle regular and interpolated values.
 */
function _valueToHumanString(value: string | number): string {
  if (typeof value === 'string') {
    const interpolatedMatch = /\{\{\s*(\S*)\s*\}\}/.exec(value);
    const interpolatedValue = interpolatedMatch && interpolatedMatch[1];
    return interpolatedValue ? `<em>${interpolatedValue}</em>` : `'${value}'`;
  }
  return value + '';
}

function _valueOrArrayToString(value: string | string[]): string {
  if (!Array.isArray(value)) {
    return _valueToHumanString(value);
  } else {
    return value.map(v => _valueToHumanString(v)).join(', ');
  }
}

const CONDITION_HUMAN_STRINGS: any = {
  eq: ({ column, value }: FilterSimpleCondition) => `${column} = ${_valueToHumanString(value)}`,
  ne: ({ column, value }: FilterSimpleCondition) => `${column} ≠ ${_valueToHumanString(value)}`,
  gt: ({ column, value }: FilterSimpleCondition) => `${column} > ${_valueToHumanString(value)}`,
  ge: ({ column, value }: FilterSimpleCondition) => `${column} ≥ ${_valueToHumanString(value)}`,
  lt: ({ column, value }: FilterSimpleCondition) => `${column} < ${_valueToHumanString(value)}`,
  le: ({ column, value }: FilterSimpleCondition) => `${column} ≤ ${_valueToHumanString(value)}`,
  in: ({ column, value }: FilterSimpleCondition) =>
    `${column} is in (${_valueOrArrayToString(value)})`,
  nin: ({ column, value }: FilterSimpleCondition) =>
    `${column} is not in (${_valueOrArrayToString(value)})`,
  matches: ({ column, value }: FilterSimpleCondition) =>
    `${column} matches regex ${_valueToHumanString(value)}`,
  notmatches: ({ column, value }: FilterSimpleCondition) =>
    `${column} doesn't match regex ${_valueToHumanString(value)}`,
  null: ({ column }: FilterSimpleCondition) => `${column} is null`,
  notnull: ({ column }: FilterSimpleCondition) => `${column} is not null`,
};

function _conditionUnitToHumanString({ column, operator, value }: FilterSimpleCondition): string {
  if (!column && !value) {
    return EMPTY_CONDITION_SIGN;
  } else if (operator in CONDITION_HUMAN_STRINGS) {
    return CONDITION_HUMAN_STRINGS[operator]({ column, operator, value });
  } else {
    // Unhandled operators
    return `${column} ${operator} ${_valueToHumanString(value)}`;
  }
}

function _parenthesesUnlessTopLevel(isOnTopLevel: boolean) {
  return (v: string) => (isOnTopLevel ? v : `(${v})`);
}

/**
 * Convert a condition into a human readable format.
 *
 * Top level conditions shouldn't be surrounded by parentheses, but lower levels should.
 *
 * @param {Object} condition
 * @param {Boolean} isOnTopLevel
 */
function _conditionToHumanString(condition: FilterCondition, isOnTopLevel: boolean): string {
  if (isFilterComboOr(condition)) {
    return _parenthesesUnlessTopLevel(isOnTopLevel)(
      condition.or
        .map((c: FilterCondition) => _conditionToHumanString(c, false))
        .join(' <strong>OR</strong> '),
    );
  } else if (isFilterComboAnd(condition)) {
    return _parenthesesUnlessTopLevel(isOnTopLevel)(
      condition.and
        .map((c: FilterCondition) => _conditionToHumanString(c, false))
        .join(' <strong>AND</strong> '),
    );
  } else {
    return _conditionUnitToHumanString(condition);
  }
}

/**
 * Convert a ifthenelse step into a human readable format prefixed by name
 *
 * @param {String} prefix
 * @param {FilterCondition} condition
 */
function _ifThenElseStepToHumanFormat(
  prefix: string,
  condition: FilterCondition | Formula,
): string {
  if (!condition) {
    return prefix + EMPTY_CONDITION_SIGN;
  } else if (typeof condition === 'string' || typeof condition === 'number') {
    return prefix + _valueToHumanString(condition);
  } else {
    return prefix + _conditionToHumanString(condition, true);
  }
}

/**
 * Convert a ifthenelse into a human readable format.
 *
 * Delete else step if elseif mode is on
 *
 * @param {IfThenElseStep} ifthenelse
 */

export default function convertIfThenElseToHumanFormat(
  ifthenelse: Omit<IfThenElseStep, 'name' | 'newColumn'>,
): string {
  const ifStep: string = _ifThenElseStepToHumanFormat('', ifthenelse.if);
  const thenStep: string = _ifThenElseStepToHumanFormat(' <strong>THEN</strong> ', ifthenelse.then);
  const elseStep: string =
    typeof ifthenelse.else === 'string'
      ? _ifThenElseStepToHumanFormat(' <strong>ELSE</strong> ', ifthenelse.else)
      : ''; //keep elseif empty

  return ifStep + thenStep + elseStep;
}
