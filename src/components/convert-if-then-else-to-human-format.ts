import {
  FilterCondition,
  FilterSimpleCondition,
  IfThenElseStep,
  isFilterComboAnd,
  isFilterComboOr,
} from '@/lib/steps';

type IfThenElseStepName = 'if' | 'then' | 'else';
type IfThenElseValue = string | number;
export const EMPTY_CONDITION_SIGN = '...';

/**
 * Handle regular and interpolated values.
 */
function _valueToHumanString(value: IfThenElseValue): string {
  const interpolatedMatch = /\{\{\s*(\S*)\s*\}\}/.exec(value as string);
  const interpolatedValue = interpolatedMatch && interpolatedMatch[1];
  if (interpolatedValue) {
    return `<em>${interpolatedValue}</em>`;
  } else {
    return typeof value === 'string' && value ? `'${value}'` : value + '';
  }
}

function _valueOrArrayToString(value: IfThenElseValue | IfThenElseValue[]): string {
  if (Array.isArray(value)) {
    return value.map(_valueToHumanString).join(', ');
  } else {
    return _valueToHumanString(value);
  }
}

const CONDITION_HUMAN_STRINGS: any = {
  eq: ({ column, value }: FilterSimpleCondition) => `${column} is ${_valueToHumanString(value)}`,
  in: ({ column, value }: FilterSimpleCondition) =>
    `${column} is in (${_valueOrArrayToString(value)})`,
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

const SEPARATOR_HUMAN_STRINGS: any = {
  or: ' <strong>OR</strong> ',
  and: ' <strong>AND</strong> ',
  then: ' <strong>THEN</strong> ',
  else: ' <strong>ELSE</strong> ',
};

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
        .join(SEPARATOR_HUMAN_STRINGS['or']),
    );
  } else if (isFilterComboAnd(condition)) {
    return _parenthesesUnlessTopLevel(isOnTopLevel)(
      condition.and
        .map((c: FilterCondition) => _conditionToHumanString(c, false))
        .join(SEPARATOR_HUMAN_STRINGS['and']),
    );
  } else {
    return _conditionUnitToHumanString(condition);
  }
}

/**
 * Convert a ifthenelse step into a human readable format.
 *
 * THEN and ELSE should be prefixed by their name
 *
 * @param {String} name
 * @param {FilterCondition} condition
 */
function _ifThenElseStepToHumanFormat(
  name: IfThenElseStepName,
  condition: FilterCondition | string,
): string {
  const separator = name in SEPARATOR_HUMAN_STRINGS ? SEPARATOR_HUMAN_STRINGS[name] : '';
  if (!condition) {
    return separator + EMPTY_CONDITION_SIGN;
  } else if (typeof condition === 'string') {
    return separator + _valueToHumanString(condition);
  } else {
    return separator + _conditionToHumanString(condition, true);
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
  const stepsNames = Object.keys(ifthenelse) as IfThenElseStepName[];
  if (typeof ifthenelse.else !== 'string') stepsNames.pop();

  return stepsNames
    .map((name: IfThenElseStepName) =>
      _ifThenElseStepToHumanFormat(name, ifthenelse[name] as FilterCondition),
    )
    .join('');
}
