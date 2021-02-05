/** This module contains mongo specific translation operations */

import _ from 'lodash';
import * as math from 'mathjs';

import { $$, combinations, escapeForUseInRegExp } from '@/lib/helpers';
import { OutputStep, StepMatcher } from '@/lib/matcher';
import * as S from '@/lib/steps';
import { BaseTranslator, ValidationError } from '@/lib/translators/base';
import { VariableDelimiters } from '@/lib/variables';

type PropMap<T> = { [prop: string]: T };

/**
 * MongoStep interface. For now, it's basically an object with any property.
 */
export interface MongoStep {
  [propName: string]: any;
}

type ComboOperator = 'and' | 'or';

export type DateGranularity = 'day' | 'month' | 'year';

type DateOperationMap = {
  [OP in S.DateExtractPropertyStep['operation']]: string;
};

type DurationMultiplierMap = {
  [D in S.ComputeDurationStep['durationIn']]: number;
};

type FilterComboAndMongo = {
  $and: MongoStep[];
};

const DATE_EXTRACT_MAP: DateOperationMap = {
  year: '$year',
  month: '$month',
  day: '$dayOfMonth',
  hour: '$hour',
  minutes: '$minute',
  seconds: '$second',
  milliseconds: '$millisecond',
  dayOfYear: '$dayOfYear',
  dayOfWeek: '$dayOfWeek',
  week: '$week',
};

// A mapping of multiplier to apply to convert milliseconds in days, hours, minutes or seconds
const DURATION_MULTIPLIER_MAP: DurationMultiplierMap = {
  days: 24 * 60 * 60 * 1000,
  hours: 60 * 60 * 1000,
  minutes: 60 * 1000,
  seconds: 1000,
};

/**
 * Transform a list of column names into a mongo map `colname` -> `$colname`
 *
 * This kind of construction is very frequent in mongo steps (e.g. in `$group` or
 * `$project` steps).
 *
 * @param colnames list of column names
 */
function columnMap(colnames: string[]) {
  return _.fromPairs(colnames.map(col => [col, $$(col)]));
}

/**
 * Generate a mongo [user variable](https://docs.mongodb.com/manual/reference/aggregation-variables/#user-variables)
 * valid identifier from a column name.
 *
 * @param colname
 */
function columnToUserVariable(colname: string): string {
  // User variable names can contain the ascii characters [_a-zA-Z0-9] and any non-ascii character.
  const colnameWithoutInvalidChars = colname.replace(/[^_a-zA-Z0-9]/g, '_');

  // User variable names must begin with a lowercase ascii letter [a-z] or a non-ascii character.
  // Starting with the `vqb_` prefix guaranties that.
  return `vqb_${colnameWithoutInvalidChars}`;
}

export function _simplifyAndCondition(filterAndCond: FilterComboAndMongo): MongoStep {
  let simplifiedBlock: MongoStep = {};
  const andList: MongoStep[] = [];
  const counter: PropMap<number> = {};

  for (const cond of filterAndCond.$and) {
    for (const key in cond) {
      counter[key] = Object.prototype.hasOwnProperty.call(counter, key) ? counter[key] + 1 : 1;
    }
  }

  for (const cond of filterAndCond.$and) {
    for (const key in cond) {
      if (counter[key] > 1 && key !== '$or') {
        andList.push({ [key]: cond[key] });
      } else {
        simplifiedBlock = { ...simplifiedBlock, [key]: cond[key] };
      }
    }
  }

  if (andList.length > 0) {
    simplifiedBlock = { ...simplifiedBlock, $and: andList };
  }

  return simplifiedBlock;
}

/**
 * Simplify a list of mongo steps (i.e. merge them whenever possible)
 *
 * - if multiple `$match` steps are chained, merge them,
 * - if multiple `$project` steps are chained, merge them.
 *
 * @param mongoSteps the input pipeline
 *
 * @returns the list of simplified mongo steps
 */
export function _simplifyMongoPipeline(mongoSteps: MongoStep[]): MongoStep[] {
  if (!mongoSteps.length) {
    return [];
  }
  let merge = true;
  const outputSteps: MongoStep[] = [];
  let lastStep: MongoStep = mongoSteps[0];
  outputSteps.push(lastStep);

  for (const step of mongoSteps.slice(1)) {
    const [stepOperator] = Object.keys(step);
    const isMergeable = stepOperator === '$project' || stepOperator === '$match';
    if (isMergeable && lastStep[stepOperator] !== undefined) {
      for (const key in step[stepOperator]) {
        /**
         * In Mongo, exclusions cannot be combined with any inclusion, so if we
         * have an exclusion in a $project step, and that the previous one
         * includes any inclusion, we do not want to merge those steps.
         */
        if (stepOperator === '$project') {
          const included = Boolean(step.$project[key]);
          merge = Object.values(lastStep.$project).every(value => Boolean(value) === included);
        }
        if (Object.prototype.hasOwnProperty.call(lastStep[stepOperator], key)) {
          // We do not want to merge two $project with common keys
          merge = false;
          break;
        }
        if (stepOperator !== '$match') {
          // We do not want to merge two $project or $addFields with a `step`
          // key referencing as value a`lastStep` key
          const valueString: string = JSON.stringify(step[stepOperator][key]);
          for (const lastKey in lastStep[stepOperator]) {
            const regex = new RegExp(`.*['"]\\$${lastKey}(\\..+)?['"].*`);
            if (regex.test(valueString)) {
              merge = false;
              break;
            }
          }
        }
      }
      if (merge) {
        // merge $project steps together
        lastStep[stepOperator] = { ...lastStep[stepOperator], ...step[stepOperator] };
        continue;
      }
    }
    lastStep = step;
    outputSteps.push(lastStep);
    merge = true;
  }
  return outputSteps;
}

function getOperator(op: string) {
  const operators: PropMap<string> = {
    '+': '$add',
    '-': '$subtract',
    '*': '$multiply',
    '/': '$divide',
  };
  if (operators[op] === undefined) {
    throw new Error(`Unsupported operator ${op}`);
  } else {
    return operators[op];
  }
}

/**
  Transform a formula expression into a MathNode
  1. Replace in formula all column name between `[]` and variables by a "pseudo"
  2. Parse the formula into a MathNode
  3. Replace all pseudo into MathNode by there original name
*/
function buildFormulaTree(
  formula: string | number,
  variableDelimiters?: VariableDelimiters,
): math.MathNode {
  // Formulas other than strings contains only one value
  if (typeof formula !== 'string') {
    return new math.ConstantNode(formula);
  }

  const COLS_ESCAPE_OPEN = '[';
  const COLS_ESCAPE_CLOSE = ']';

  // 1. Replace in formula some elements by a "pseudo"
  let formulaPseudotised = formula;
  // 1a. Column names between `[]`
  const pseudoCols: Record<string, string> = {};
  let indexCols = 0;
  const regexCols = new RegExp(
    `${escapeForUseInRegExp(COLS_ESCAPE_OPEN)}(.*?)${escapeForUseInRegExp(COLS_ESCAPE_CLOSE)}`,
    'g',
  );
  for (const match of formula.match(regexCols) || []) {
    pseudoCols[`__vqb_col_${indexCols}__`] = match;
    formulaPseudotised = formulaPseudotised.replace(match, `__vqb_col_${indexCols}__`);
    indexCols++;
  }
  // 1b. Variables
  const pseudoVars: Record<string, string> = {};
  if (variableDelimiters) {
    let indexVars = 0;
    const regexVars = new RegExp(
      `${escapeForUseInRegExp(variableDelimiters.start)}(.*?)${escapeForUseInRegExp(
        variableDelimiters.end,
      )}`,
      'g',
    );
    for (const match of formula.match(regexVars) || []) {
      pseudoVars[`__vqb_var_${indexVars}__`] = match;
      formulaPseudotised = formulaPseudotised.replace(match, `__vqb_var_${indexVars}__`);
      indexVars++;
    }
  }

  // 2. Parse the formula into a MathNode
  const mathjsTree: math.MathNode = math.parse(formulaPseudotised);

  // 3. Replace all pseudo into MathNode by there original name
  return mathjsTree.transform(function(node: math.MathNode): math.MathNode {
    if (node.type === 'SymbolNode') {
      if (pseudoCols[node.name]) {
        node.name = pseudoCols[node.name]
          .replace(COLS_ESCAPE_OPEN, '')
          .replace(COLS_ESCAPE_CLOSE, '');
      }
      if (variableDelimiters && pseudoVars[node.name]) {
        // Variables should be considered as constants, and not columns, by the parser
        return new math.ConstantNode(pseudoVars[node.name]);
      }
    }
    return node;
  });
}

function buildCondExpression(
  cond: S.FilterSimpleCondition | S.FilterComboAnd | S.FilterComboOr,
  unsupportedOperators: S.FilterSimpleCondition['operator'][],
): MongoStep {
  const operatorMapping = {
    eq: '$eq',
    ne: '$ne',
    lt: '$lt',
    le: '$lte',
    gt: '$gt',
    ge: '$gte',
    in: '$in',
    nin: '$in',
    isnull: '$eq',
    notnull: '$ne',
    matches: '$regexMatch',
    notmatches: '$regexMatch',
  };

  if (S.isFilterComboAnd(cond)) {
    if (cond.and.length == 1) {
      return buildCondExpression(cond.and[0], unsupportedOperators);
    } else {
      // if cond.and.length > 1 we need to bind conditions in a $and operator,
      // as we need a unique document to be used as the first argument of the
      // $cond operator
      return { $and: cond.and.map(elem => buildCondExpression(elem, unsupportedOperators)) };
    }
  }
  if (S.isFilterComboOr(cond)) {
    return { $or: cond.or.map(elem => buildCondExpression(elem, unsupportedOperators)) };
  }

  if (unsupportedOperators.includes(cond.operator)) {
    throw new Error(`Unsupported operator ${cond.operator} in conditions`);
  }

  // $regexMatch arguments are provided differently from the others operators
  // https://docs.mongodb.com/manual/reference/operator/aggregation/regexMatch/
  if (cond.operator === 'matches' || cond.operator === 'notmatches') {
    let condExpression: MongoStep = {
      $regexMatch: {
        input: $$(cond.column),
        regex: cond.value,
      },
    };
    // There is not 'regexNotMatch' operator
    if (cond.operator === 'notmatches') {
      condExpression = { $not: condExpression };
    }
    return condExpression;
  } else {
    let condExpression: MongoStep = {
      [operatorMapping[cond.operator]]: [$$(cond.column), cond.value],
    };
    // There is not 'not in' operator
    if (cond.operator === 'nin') {
      condExpression = { $not: condExpression };
    }
    return condExpression;
  }
}

function buildMatchTree(
  cond: S.FilterSimpleCondition | S.FilterComboAnd | S.FilterComboOr,
  parentComboOp: ComboOperator = 'and',
): MongoStep {
  const operatorMapping = {
    eq: '$eq',
    ne: '$ne',
    lt: '$lt',
    le: '$lte',
    gt: '$gt',
    ge: '$gte',
    in: '$in',
    nin: '$nin',
    isnull: '$eq',
    notnull: '$ne',
  };
  if (S.isFilterComboAnd(cond) && parentComboOp !== 'or') {
    return _simplifyAndCondition({ $and: cond.and.map(elem => buildMatchTree(elem, 'and')) });
  }
  if (S.isFilterComboAnd(cond)) {
    return { $and: cond.and.map(elem => buildMatchTree(elem, 'and')) };
  }
  if (S.isFilterComboOr(cond)) {
    return { $or: cond.or.map(elem => buildMatchTree(elem, 'or')) };
  }
  if (cond.operator === 'matches') {
    return { [cond.column]: { $regex: cond.value } };
  } else if (cond.operator === 'notmatches') {
    return { [cond.column]: { $not: { $regex: cond.value } } };
  }
  return { [cond.column]: { [operatorMapping[cond.operator]]: cond.value } };
}

/**
 * Translate a mathjs logical tree describing a formula into a Mongo step
 * @param node a mathjs node object (usually received after parsing an string expression)
 * This node is the root node of the logical tree describing the formula
 */
function buildMongoFormulaTree(node: math.MathNode): MongoStep | string | number {
  switch (node.type) {
    case 'OperatorNode':
      if (node.args.length === 1) {
        const factor = node.op === '+' ? 1 : -1;
        return {
          $multiply: [factor, buildMongoFormulaTree(node.args[0])],
        };
      }
      return {
        [getOperator(node.op)]: node.args.map(e => buildMongoFormulaTree(e)),
      };
    case 'SymbolNode':
      // For column names
      return $$(node.name);
    case 'ConstantNode':
      return node.value;
    case 'ParenthesisNode':
      return buildMongoFormulaTree(node.content);
  }
}

/** Takes a mongo date as input and returns a new date object at the specified granularity */
export function _generateDateFromParts(mongoDate: string, granularity: DateGranularity) {
  const dateFromParts: MongoStep = { year: { $year: mongoDate } };
  if (granularity === 'day' || granularity === 'month') {
    dateFromParts['month'] = { $month: mongoDate };
  }
  if (granularity === 'day') {
    dateFromParts['day'] = { $dayOfMonth: mongoDate };
  }
  return dateFromParts;
}

/** specific function to translate addmissingdates at year granularity (for performance gains) */
function addMissingDatesYear(step: Readonly<S.AddMissingDatesStep>): MongoStep[] {
  const groups: Array<string> = step.groups ?? [];

  // add missing dates by looping over the unique dates array and adding a given date
  // if it's not already present in the original dataset
  const addMissingYearsAsDates: MongoStep = {
    $map: {
      // loop over a sorted array of all years between min and max year
      input: { $range: ['$_vqbMinYear', { $add: ['$_vqbMaxYear', 1] }] },
      // use a variable "currentYear" as cursor
      as: 'currentYear',
      // and apply the following expression to every "currentYear"
      in: {
        $let: {
          // use a variable yearIndex that represents the index of the "currentYear"
          // cursor in the original array
          vars: {
            yearIndex: { $indexOfArray: ['$_vqbArray._vqbYear', '$$currentYear'] },
          },
          in: {
            $cond: [
              // if "currentYear" is found in the original array
              { $ne: ['$$yearIndex', -1] },
              // just get the original document in the original array
              { $arrayElemAt: ['$_vqbArray', '$$yearIndex'] },
              // else add a new document with the missing date (we convert the year back to a date object)
              // and the group fields (every other field will be undefined)
              {
                ...Object.fromEntries(groups.map(col => [col, `$_id.${col}`])),
                [step.datesColumn]: { $dateFromParts: { year: '$$currentYear' } },
              },
            ],
          },
        },
      },
    },
  };

  return [
    // Extract the year of the date in a new column
    { $addFields: { _vqbYear: { $year: $$(step.datesColumn) } } },
    // Group by logic to create an array with all original documents, and get the
    // min and max date of all documents confounded
    {
      $group: {
        _id: step.groups ? columnMap(groups) : null,
        _vqbArray: { $push: '$$ROOT' },
        _vqbMinYear: { $min: '$_vqbYear' },
        _vqbMaxYear: { $max: '$_vqbYear' },
      },
    },
    // That at this stage that all the magic happens (cf. supra)
    { $addFields: { _vqbAllDates: addMissingYearsAsDates } },
  ];
}

/** specific function to translate addmissingdates at day or month granularity */
function addMissingDatesDayOrMonth(step: Readonly<S.AddMissingDatesStep>): MongoStep[] {
  const groups: Array<string> = step.groups ?? [];

  // Create a sorted array of all dates (in days) ranging from min to max dates found in the whole dataset.
  // At this stage for the month granularity, we will get duplicate dates because we need to first generate
  // all days one by one to increment the calendar safely, before converting every day of a given
  // month to the 1st of this month (via the $dateFromPart expression). We take care of making month dates
  // unique in a '$reduce' stage explained later
  const allDaysRange: MongoStep = {
    $map: {
      // create a array of integers ranging from 0 to the number of days separating the min and max date
      input: { $range: [0, { $add: ['$_vqbMinMaxDiffInDays', 1] }] },
      // use a cursor 'currentDurationInDays' that will loop over the array
      as: 'currentDurationInDays',
      // apply the following operations to every element of the array via the cursor 'currentDurationInDays'
      in: {
        $let: {
          // create a variable 'currentDay' that will correspond to the day resulting from the addition of the
          // duration 'currentDurationInDays' (converted back to milliseconds) to the min date.
          vars: {
            currentDay: {
              $add: [
                '$_vqbMinDay',
                { $multiply: ['$$currentDurationInDays', 60 * 60 * 24 * 1000] },
              ],
            },
          },
          // use the variable in the following expression, in which we recreate a date which granularity will
          // depend on the user-specified granularity
          in: {
            $dateFromParts: _generateDateFromParts('$$currentDay', step.datesGranularity),
          },
        },
      },
    },
  };

  // For the month granularity only, use a $reduce stage to reduce the allDaysRange
  // array into an array of unique days.
  const uniqueDaysForMonthGranularity: MongoStep = {
    $reduce: {
      input: allDaysRange,
      initialValue: [],
      in: {
        $cond: [
          // if the date is not found in the reduced array
          { $eq: [{ $indexOfArray: ['$$value', '$$this'] }, -1] },
          // then add the date to it
          { $concatArrays: ['$$value', ['$$this']] },
          // else add nothing to it
          { $concatArrays: ['$$value', []] },
        ],
      },
    },
  };

  // add missing dates by looping over the unique dates array and adding a given date
  // if it's not already present in the original dataset
  const addMissingDates: MongoStep = {
    $map: {
      // loop over unique dates array
      input: step.datesGranularity === 'day' ? allDaysRange : uniqueDaysForMonthGranularity,
      // use a variable "date" as cursor
      as: 'date',
      // and apply the following expression to every "date"
      in: {
        $let: {
          // use a variable dateIndex that represents the index of the "date" cursor in the original array of documents
          vars: { dateIndex: { $indexOfArray: ['$_vqbArray._vqbDay', '$$date'] } },
          in: {
            $cond: [
              // if "date" is found in the original array
              { $ne: ['$$dateIndex', -1] },
              // just get the original document in the original array
              { $arrayElemAt: ['$_vqbArray', '$$dateIndex'] },
              // else add a new document with the missing date and the group fieldds (every other field will be undefined)
              {
                ...Object.fromEntries(groups.map(col => [col, `$_id.${col}`])),
                [step.datesColumn]: '$$date',
              },
            ],
          },
        },
      },
    },
  };

  return [
    {
      $addFields: {
        _vqbDay: {
          $dateFromParts: _generateDateFromParts($$(step.datesColumn), step.datesGranularity),
        },
      },
    },
    // Group by logic to create an array with all original documents, and get the
    // min and max date of all documents confounded
    {
      $group: {
        _id: step.groups ? columnMap(groups) : null,
        _vqbArray: { $push: '$$ROOT' },
        _vqbMinDay: { $min: '$_vqbDay' },
        _vqbMaxDay: { $max: '$_vqbDay' },
      },
    },
    // Compute the time difference between the min and max date in days (the
    // subtraction between two dates in mongo gives a duration in milliseconds)
    {
      $addFields: {
        _vqbMinMaxDiffInDays: {
          $divide: [{ $subtract: ['$_vqbMaxDay', '$_vqbMinDay'] }, 60 * 60 * 24 * 1000],
        },
      },
    },
    // That at this stage that all the magic happens (cf. supra)
    { $addFields: { _vqbAllDates: addMissingDates } },
  ];
}

/** transform a 'addmissingdates' step into corresponding mongo steps */
function transformAddMissingDates(step: Readonly<S.AddMissingDatesStep>): MongoStep[] {
  return [
    ...(step.datesGranularity === 'year'
      ? addMissingDatesYear(step)
      : addMissingDatesDayOrMonth(step)),
    // Get back to 1 row per document
    { $unwind: '$_vqbAllDates' },
    // Change the root to get back to the document granularity
    { $replaceRoot: { newRoot: '$_vqbAllDates' } },
    // Remove remaining temporary column
    { $project: { [step.datesGranularity === 'year' ? '_vqbYear' : '_vqbDay']: 0 } },
  ];
}

/** transform an 'aggregate' step into corresponding mongo steps */
function transformAggregate(step: Readonly<S.AggregateStep>): MongoStep[] {
  const idblock: PropMap<string> = columnMap(step.on);
  const group: { [id: string]: {} } = {};
  const project: PropMap<any> = {};

  group._id = idblock;

  for (const aggfStep of step.aggregations) {
    // We support simple string sfor retrocompatibility purposes
    const cols = aggfStep.column ? [aggfStep.column] : aggfStep.columns;
    const newcols = aggfStep.newcolumn ? [aggfStep.newcolumn] : aggfStep.newcolumns;

    if (aggfStep.aggfunction === 'count') {
      // There is no `$count` operator in Mongo, we have to `$sum` 1s to get
      // an equivalent result
      for (let i = 0; i < cols.length; i++) {
        // cols and newcols are always of same length
        group[newcols[i]] = { $sum: 1 };
      }
    } else {
      for (let i = 0; i < cols.length; i++) {
        // cols and newcols are always of same length (checked at validation)
        group[newcols[i]] = { [$$(aggfStep.aggfunction)]: $$(cols[i]) };
      }
    }
  }

  if (step.keepOriginalGranularity) {
    // we keep track of all columns
    group['_vqbDocsArray'] = { $push: '$$ROOT' };
    return [
      { $group: group },
      { $unwind: '$_vqbDocsArray' },
      { $replaceRoot: { newRoot: { $mergeObjects: ['$_vqbDocsArray', '$$ROOT'] } } },
      { $project: { _vqbDocsArray: 0 } },
    ];
  } else {
    for (const groupKey of Object.keys(group)) {
      if (groupKey === '_id') {
        for (const idkey of Object.keys(group[groupKey])) {
          project[idkey] = `$_id.${idkey}`;
        }
      } else {
        project[groupKey] = 1;
      }
    }
    return [{ $group: group }, { $project: project }];
  }
}

/** transform an 'argmax' or 'argmin' step into corresponding mongo steps */
function transformArgmaxArgmin(step: Readonly<S.ArgmaxStep> | Readonly<S.ArgminStep>): MongoStep[] {
  const groupMongo: MongoStep = {};
  const stepMapping = { argmax: '$max', argmin: '$min' };

  groupMongo.$group = {
    _id: step.groups ? columnMap(step.groups) : null,
    _vqbAppArray: { $push: '$$ROOT' },
    _vqbAppValueToCompare: { [stepMapping[step.name]]: $$(step.column) },
  };

  return [
    groupMongo,
    { $unwind: '$_vqbAppArray' },
    { $replaceRoot: { newRoot: { $mergeObjects: ['$_vqbAppArray', '$$ROOT'] } } },
    { $project: { _vqbAppArray: 0 } },
    {
      /**
       * shortcut operator to avoid to firstly create a boolean column via $project
       * and then filter on 'true' rows via $match.
       * "$$KEEP" (resp. $$PRUNE") keeps (resp. exlcludes) rows matching (resp.
       * not matching) the condition.
       */
      $redact: {
        $cond: [
          {
            $eq: [$$(step.column), '$_vqbAppValueToCompare'],
          },
          '$$KEEP',
          '$$PRUNE',
        ],
      },
    },
    { $project: { _vqbAppValueToCompare: 0 } },
  ];
}

/** transform a 'cumsum' step into corresponding mongo steps */
function transformCumSum(step: Readonly<S.CumSumStep>): MongoStep {
  const groupby = step.groupby ?? [];
  return [
    { $sort: { [step.referenceColumn]: 1 } },
    {
      $group: {
        _id: step.groupby ? columnMap(groupby) : null,
        [step.valueColumn]: { $push: $$(step.valueColumn) },
        _vqbArray: { $push: '$$ROOT' },
      },
    },
    { $unwind: { path: '$_vqbArray', includeArrayIndex: '_VQB_INDEX' } },
    {
      $project: {
        ...Object.fromEntries(groupby.map(col => [col, `$_id.${col}`])),
        [step.newColumn ?? `${step.valueColumn}_CUMSUM`]: {
          $sum: {
            $slice: [$$(step.valueColumn), { $add: ['$_VQB_INDEX', 1] }],
          },
        },
        _vqbArray: 1,
      },
    },
    { $replaceRoot: { newRoot: { $mergeObjects: ['$_vqbArray', '$$ROOT'] } } },
    { $project: { _vqbArray: 0 } },
  ];
}

/** transform a 'concatenate' step into corresponding mongo steps */
function transformConcatenate(step: Readonly<S.ConcatenateStep>): MongoStep {
  const concatArr: string[] = [$$(step.columns[0])];
  for (const colname of step.columns.slice(1)) {
    concatArr.push(step.separator, $$(colname));
  }
  return { $addFields: { [step.new_column_name]: { $concat: concatArr } } };
}

/** transform an 'evolution' step into corresponding mongo steps */
function transformEvolution(step: Readonly<S.EvolutionStep>): MongoStep {
  const newColumn = step.newColumn ?? `${step.valueCol}_EVOL_${step.evolutionFormat.toUpperCase()}`;
  const errorMsg = 'Error: More than one previous date found for the specified index columns';
  const addFieldDatePrev: PropMap<any> = {};
  const addFieldResult: PropMap<any> = {};

  if (step.evolutionFormat === 'abs') {
    addFieldResult[newColumn] = {
      $cond: [
        { $eq: ['$_VQB_VALUE_PREV', 'Error'] },
        errorMsg,
        { $subtract: [$$(step.valueCol), '$_VQB_VALUE_PREV'] },
      ],
    };
  } else {
    addFieldResult[newColumn] = {
      $switch: {
        branches: [
          { case: { $eq: ['$_VQB_VALUE_PREV', 'Error'] }, then: errorMsg },
          { case: { $eq: ['$_VQB_VALUE_PREV', 0] }, then: null },
        ],
        default: {
          $divide: [{ $subtract: [$$(step.valueCol), '$_VQB_VALUE_PREV'] }, '$_VQB_VALUE_PREV'],
        },
      },
    };
  }

  if (step.evolutionType === 'vsLastYear') {
    addFieldDatePrev['_VQB_DATE_PREV'] = {
      $dateFromParts: {
        year: { $subtract: [{ $year: $$(step.dateCol) }, 1] },
        month: { $month: $$(step.dateCol) },
        day: { $dayOfMonth: $$(step.dateCol) },
      },
    };
  } else if (step.evolutionType === 'vsLastMonth') {
    addFieldDatePrev['_VQB_DATE_PREV'] = {
      $dateFromParts: {
        year: {
          $cond: [
            { $eq: [{ $month: $$(step.dateCol) }, 1] },
            { $subtract: [{ $year: $$(step.dateCol) }, 1] },
            { $year: $$(step.dateCol) },
          ],
        },
        month: {
          $cond: [
            { $eq: [{ $month: $$(step.dateCol) }, 1] },
            12,
            { $subtract: [{ $month: $$(step.dateCol) }, 1] },
          ],
        },
        day: { $dayOfMonth: $$(step.dateCol) },
      },
    };
  } else {
    addFieldDatePrev['_VQB_DATE_PREV'] = {
      $subtract: [
        $$(step.dateCol),
        60 * 60 * 24 * 1000 * (step.evolutionType === 'vsLastWeek' ? 7 : 1),
      ],
    };
  }
  return [
    { $addFields: addFieldDatePrev },
    {
      $facet: {
        _VQB_ORIGINALS: [{ $project: { _id: 0 } }],
        _VQB_COPIES_ARRAY: [{ $group: { _id: null, _VQB_ALL_DOCS: { $push: '$$ROOT' } } }],
      },
    },
    { $unwind: '$_VQB_ORIGINALS' },
    {
      $project: {
        _VQB_ORIGINALS: {
          $mergeObjects: ['$_VQB_ORIGINALS', { $arrayElemAt: ['$_VQB_COPIES_ARRAY', 0] }],
        },
      },
    },
    { $replaceRoot: { newRoot: '$_VQB_ORIGINALS' } },
    {
      $addFields: {
        _VQB_ALL_DOCS: {
          $filter: {
            input: '$_VQB_ALL_DOCS',
            as: 'item',
            cond: {
              $and: [
                { $eq: ['$_VQB_DATE_PREV', `$$item.${step.dateCol}`] },
                ...step.indexColumns.map(col => ({ $eq: [$$(col), `$$item.${col}`] })),
              ],
            },
          },
        },
      },
    },
    {
      $addFields: {
        _VQB_VALUE_PREV: {
          $cond: [
            { $gt: [{ $size: `$_VQB_ALL_DOCS.${step.valueCol}` }, 1] },
            'Error',
            { $arrayElemAt: [`$_VQB_ALL_DOCS.${step.valueCol}`, 0] },
          ],
        },
      },
    },
    { $addFields: addFieldResult },
    {
      $project: {
        _VQB_ALL_DOCS: 0,
        _VQB_DATE_PREV: 0,
        _VQB_VALUE_PREV: 0,
      },
    },
  ];
}

/** transform a 'fillna' step into corresponding mongo steps */
function transformFillna(step: Readonly<S.FillnaStep>): MongoStep {
  let cols: string[] = [];
  if (step.column) {
    // For retrocompatibility with old configurations
    cols = [step.column];
  } else {
    cols = [...step.columns];
  }

  const addFields = Object.fromEntries(cols.map(x => [x, { $ifNull: [$$(x), step.value] }]));

  return { $addFields: addFields };
}

/** transform a 'filter' step into corresponding mongo step */
function transformFilterStep(step: Readonly<S.FilterStep>): MongoStep {
  const condition = step.condition;
  return { $match: buildMatchTree(condition) };
}

/** transform a 'fromdate' step into corresponding mongo steps */
function transformFromDate(step: Readonly<S.FromDateStep>): MongoStep {
  const smallMonthReplace = {
    $switch: {
      branches: [
        { case: { $eq: ['$_vqbTempMonth', '01'] }, then: 'Jan' },
        { case: { $eq: ['$_vqbTempMonth', '02'] }, then: 'Feb' },
        { case: { $eq: ['$_vqbTempMonth', '03'] }, then: 'Mar' },
        { case: { $eq: ['$_vqbTempMonth', '04'] }, then: 'Apr' },
        { case: { $eq: ['$_vqbTempMonth', '05'] }, then: 'May' },
        { case: { $eq: ['$_vqbTempMonth', '06'] }, then: 'Jun' },
        { case: { $eq: ['$_vqbTempMonth', '07'] }, then: 'Jul' },
        { case: { $eq: ['$_vqbTempMonth', '08'] }, then: 'Aug' },
        { case: { $eq: ['$_vqbTempMonth', '09'] }, then: 'Sep' },
        { case: { $eq: ['$_vqbTempMonth', '10'] }, then: 'Oct' },
        { case: { $eq: ['$_vqbTempMonth', '11'] }, then: 'Nov' },
        { case: { $eq: ['$_vqbTempMonth', '12'] }, then: 'Dec' },
      ],
    },
  };

  const fullMonthReplace = {
    $switch: {
      branches: [
        { case: { $eq: ['$_vqbTempMonth', '01'] }, then: 'January' },
        { case: { $eq: ['$_vqbTempMonth', '02'] }, then: 'February' },
        { case: { $eq: ['$_vqbTempMonth', '03'] }, then: 'March' },
        { case: { $eq: ['$_vqbTempMonth', '04'] }, then: 'April' },
        { case: { $eq: ['$_vqbTempMonth', '05'] }, then: 'May' },
        { case: { $eq: ['$_vqbTempMonth', '06'] }, then: 'June' },
        { case: { $eq: ['$_vqbTempMonth', '07'] }, then: 'July' },
        { case: { $eq: ['$_vqbTempMonth', '08'] }, then: 'August' },
        { case: { $eq: ['$_vqbTempMonth', '09'] }, then: 'September' },
        { case: { $eq: ['$_vqbTempMonth', '10'] }, then: 'October' },
        { case: { $eq: ['$_vqbTempMonth', '11'] }, then: 'November' },
        { case: { $eq: ['$_vqbTempMonth', '12'] }, then: 'December' },
      ],
    },
  };

  switch (step.format) {
    /**
     * `%d %b %Y`, `%d-%b-%Y`, `%d %B %Y`, `%b %Y` are date format `$dateToString`
     * cannot handle. Therefore we design special query to handle these formats
     */
    case '%d %b %Y':
      return [
        {
          $addFields: {
            [step.column]: {
              $dateToString: { date: $$(step.column), format: '%d-%m-%Y' },
            },
          },
        },
        { $addFields: { _vqbTempArray: { $split: [$$(step.column), '-'] } } },
        {
          $addFields: {
            _vqbTempDay: { $arrayElemAt: ['$_vqbTempArray', 0] },
            _vqbTempMonth: { $arrayElemAt: ['$_vqbTempArray', 1] },
            _vqbTempYear: { $arrayElemAt: ['$_vqbTempArray', 2] },
          },
        },
        {
          $addFields: { _vqbTempMonth: smallMonthReplace },
        },
        {
          $addFields: {
            [step.column]: {
              $concat: ['$_vqbTempDay', ' ', '$_vqbTempMonth', ' ', '$_vqbTempYear'],
            },
          },
        },
        { $project: { _vqbTempArray: 0, _vqbTempDay: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
      ];
    case '%d-%b-%Y':
      return [
        {
          $addFields: {
            [step.column]: {
              $dateToString: { date: $$(step.column), format: '%d-%m-%Y' },
            },
          },
        },
        { $addFields: { _vqbTempArray: { $split: [$$(step.column), '-'] } } },
        {
          $addFields: {
            _vqbTempDay: { $arrayElemAt: ['$_vqbTempArray', 0] },
            _vqbTempMonth: { $arrayElemAt: ['$_vqbTempArray', 1] },
            _vqbTempYear: { $arrayElemAt: ['$_vqbTempArray', 2] },
          },
        },
        {
          $addFields: { _vqbTempMonth: smallMonthReplace },
        },
        {
          $addFields: {
            [step.column]: {
              $concat: ['$_vqbTempDay', '-', '$_vqbTempMonth', '-', '$_vqbTempYear'],
            },
          },
        },
        { $project: { _vqbTempArray: 0, _vqbTempDay: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
      ];
    case '%d %B %Y':
      return [
        {
          $addFields: {
            [step.column]: {
              $dateToString: { date: $$(step.column), format: '%d-%m-%Y' },
            },
          },
        },
        { $addFields: { _vqbTempArray: { $split: [$$(step.column), '-'] } } },
        {
          $addFields: {
            _vqbTempDay: { $arrayElemAt: ['$_vqbTempArray', 0] },
            _vqbTempMonth: { $arrayElemAt: ['$_vqbTempArray', 1] },
            _vqbTempYear: { $arrayElemAt: ['$_vqbTempArray', 2] },
          },
        },
        {
          $addFields: { _vqbTempMonth: fullMonthReplace },
        },
        {
          $addFields: {
            [step.column]: {
              $concat: ['$_vqbTempDay', ' ', '$_vqbTempMonth', ' ', '$_vqbTempYear'],
            },
          },
        },
        { $project: { _vqbTempArray: 0, _vqbTempDay: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
      ];
    case '%b %Y':
      return [
        {
          $addFields: {
            [step.column]: {
              $dateToString: { date: $$(step.column), format: '%m-%Y' },
            },
          },
        },
        { $addFields: { _vqbTempArray: { $split: [$$(step.column), '-'] } } },
        {
          $addFields: {
            _vqbTempMonth: { $arrayElemAt: ['$_vqbTempArray', 0] },
            _vqbTempYear: { $arrayElemAt: ['$_vqbTempArray', 1] },
          },
        },
        {
          $addFields: { _vqbTempMonth: smallMonthReplace },
        },
        {
          $addFields: {
            [step.column]: {
              $concat: ['$_vqbTempMonth', ' ', '$_vqbTempYear'],
            },
          },
        },
        { $project: { _vqbTempArray: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
      ];
    case '%b-%Y':
      return [
        {
          $addFields: {
            [step.column]: {
              $dateToString: { date: $$(step.column), format: '%m-%Y' },
            },
          },
        },
        { $addFields: { _vqbTempArray: { $split: [$$(step.column), '-'] } } },
        {
          $addFields: {
            _vqbTempMonth: { $arrayElemAt: ['$_vqbTempArray', 0] },
            _vqbTempYear: { $arrayElemAt: ['$_vqbTempArray', 1] },
          },
        },
        {
          $addFields: { _vqbTempMonth: smallMonthReplace },
        },
        {
          $addFields: {
            [step.column]: {
              $concat: ['$_vqbTempMonth', '-', '$_vqbTempYear'],
            },
          },
        },
        { $project: { _vqbTempArray: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
      ];
    case '%B %Y':
      return [
        {
          $addFields: {
            [step.column]: {
              $dateToString: { date: $$(step.column), format: '%m-%Y' },
            },
          },
        },
        { $addFields: { _vqbTempArray: { $split: [$$(step.column), '-'] } } },
        {
          $addFields: {
            _vqbTempMonth: { $arrayElemAt: ['$_vqbTempArray', 0] },
            _vqbTempYear: { $arrayElemAt: ['$_vqbTempArray', 1] },
          },
        },
        {
          $addFields: { _vqbTempMonth: fullMonthReplace },
        },
        {
          $addFields: {
            [step.column]: {
              $concat: ['$_vqbTempMonth', ' ', '$_vqbTempYear'],
            },
          },
        },
        { $project: { _vqbTempArray: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
      ];
    default:
      return [
        {
          $addFields: {
            [step.column]: {
              $dateToString: { date: $$(step.column), format: step.format },
            },
          },
        },
      ];
  }
}

/** transform an 'ifthenelse' step into corresponding mongo step */
function transformIfThenElseStep(
  step: Readonly<Omit<S.IfThenElseStep, 'name' | 'newColumn'>>,
  unsupportedOperatorsInConditions: S.FilterSimpleCondition['operator'][],
  variableDelimiters?: VariableDelimiters,
): MongoStep {
  const ifExpr: MongoStep = buildCondExpression(step.if, unsupportedOperatorsInConditions);
  const thenExpr = buildMongoFormulaTree(buildFormulaTree(step.then, variableDelimiters));
  let elseExpr: MongoStep | string | number;
  if (typeof step.else === 'object') {
    elseExpr = transformIfThenElseStep(
      step.else,
      unsupportedOperatorsInConditions,
      variableDelimiters,
    );
  } else {
    elseExpr = buildMongoFormulaTree(buildFormulaTree(step.else, variableDelimiters));
  }
  return { $cond: { if: ifExpr, then: thenExpr, else: elseExpr } };
}

/** transform a 'movingaverage' step into corresponding mongo steps */
function transformMovingAverage(step: Readonly<S.MovingAverageStep>): MongoStep[] {
  return [
    // Ensure the reference column is sorted to prepare for the moving average computation
    { $sort: { [step.columnToSort]: 1 } },
    // If needing to group the computation, provide for the columns, else _id is set to null
    {
      $group: { _id: step.groups ? columnMap(step.groups) : null, _vqbArray: { $push: '$$ROOT' } },
    },
    // Prepare an array of documents with a new moving average field. One array per group (if any)
    {
      $addFields: {
        _vqbArray: {
          // We use $map to apply operations while looping over the _vqbArray documents
          $map: {
            // We create an index ("idx") variable that will go from 0 to the size of _vqbArray
            input: { $range: [0, { $size: '$_vqbArray' }] },
            as: 'idx',
            // We will use the idx variable in the following stages
            in: {
              $cond: [
                // If the index is less than the moving window minus 1...
                { $lt: ['$$idx', (step.movingWindow as number) - 1] }, // explicit type for typescript
                //... then we cannot apply the moving average computation, and
                // we just keep the original document without any new field...
                { $arrayElemAt: ['$_vqbArray', '$$idx'] },
                //... else we compute the value average over the last N documents starting
                // from the current index document, N being equal to the moving window)
                {
                  $mergeObjects: [
                    // Keep track of original document
                    { $arrayElemAt: ['$_vqbArray', '$$idx'] },
                    // and add the new moving average column
                    {
                      [step.newColumnName ?? `${step.valueColumn}_MOVING_AVG`]: {
                        $avg: {
                          $slice: [
                            `$_vqbArray.${step.valueColumn}`,
                            { $subtract: ['$$idx', (step.movingWindow as number) - 1] }, // explicit type for typescript
                            step.movingWindow as number,
                          ],
                        },
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    },
    // Flatten the array(s) to get back to 1 row per document (at this stage in the field "_vqbArray")
    { $unwind: '$_vqbArray' },
    // Set the _vqbArray field as the new root to get back to the original document granularity
    { $replaceRoot: { newRoot: '$_vqbArray' } },
  ];
}

/** transform an 'percentage' step into corresponding mongo steps */
function transformPercentage(step: Readonly<S.PercentageStep>): MongoStep[] {
  return [
    {
      $group: {
        _id: step.group ? columnMap(step.group) : null,
        _vqbAppArray: { $push: '$$ROOT' },
        _vqbTotalDenum: { $sum: $$(step.column) },
      },
    },
    { $unwind: '$_vqbAppArray' },
    {
      $project: {
        [step.newColumnName ?? `${step.column}_PCT`]: {
          $cond: [
            { $eq: ['$_vqbTotalDenum', 0] },
            null,
            { $divide: [`$_vqbAppArray.${step.column}`, '$_vqbTotalDenum'] },
          ],
        },
        _vqbAppArray: 1, // we need to keep track of this key for the next operation
      },
    },
    // Line below: Keep all columns that were not used in computation, 'stored' in _vqbAppArray
    { $replaceRoot: { newRoot: { $mergeObjects: ['$_vqbAppArray', '$$ROOT'] } } },
    { $project: { _vqbAppArray: 0 } }, // We do not want to keep that column at the end
  ];
}

/** transform an 'pivot' step into corresponding mongo steps */
function transformPivot(step: Readonly<S.PivotStep>): MongoStep[] {
  const groupCols2: PropMap<string> = {};
  const addFieldsStep: PropMap<string> = {};

  // Prepare groupCols to populate the `_id` field sof Mongo `$group` steps and addFields step
  for (const col of step.index) {
    groupCols2[col] = `$_id.${col}`;
    addFieldsStep[`_vqbAppTmpObj.${col}`] = `$_id.${col}`;
  }

  const pivotMongoAggStages: MongoStep[] = [
    /**
     * First we perform the aggregation with the _id including the column to pivot
     */
    {
      $group: {
        _id: { ...columnMap(step.index), [step.column_to_pivot]: $$(step.column_to_pivot) },
        [step.value_column]: { [$$(step.agg_function)]: $$(step.value_column) },
      },
    },
    /**
     * Then we group with with index columns as _id and we push documents as an array of sets
     * including a column for the column to pivot and a column for the corresponding value
     */
    {
      $group: {
        _id: groupCols2,
        _vqbAppArray: {
          $addToSet: {
            [step.column_to_pivot]: `$_id.${step.column_to_pivot}`,
            [step.value_column]: $$(step.value_column),
          },
        },
      },
    },
    /**
     * Then we project a tmp key to get an object from the array of couples [column_to_pivot, corresponding_value]
     * including a column for the column to pivot and a column for the corresponding value
     */
    {
      $project: {
        _vqbAppTmpObj: {
          $arrayToObject: {
            $zip: {
              inputs: [
                `$_vqbAppArray.${step.column_to_pivot}`,
                `$_vqbAppArray.${step.value_column}`,
              ],
            },
          },
        },
      },
    },
  ];

  if (Object.keys(addFieldsStep).length > 0) {
    /**
     * Then we include the index columns back in every document created in the previous step
     * (still accessible in the _id object)
     */
    pivotMongoAggStages.push({ $addFields: addFieldsStep });
  }
  /**
   * Then we replace the root of the documents tree to get our columns ready for
   * our needed table-like, unnested format
   */
  pivotMongoAggStages.push({ $replaceRoot: { newRoot: '$_vqbAppTmpObj' } });

  return pivotMongoAggStages;
}

/** transform a 'rank' step into corresponding mongo steps */
function transformRank(step: Readonly<S.RankStep>): MongoStep {
  let vqbVarOrder: MongoStep = {};

  /**
   * Here we define the order variable that will be used in the '$reduce' step
   * defined below. The order definition depends on the ranking method chosen.
   *
   * Example of ranking output depending on method chosen:
   *
   *  - standard: [10, 15, 15, 15, 20, 20, 22] => [1, 2, 2, 2, 5, 5, 7]
   *  - dense: [10, 15, 15, 15, 20, 20, 22] => [1, 2, 2, 2, 3, 3, 4]
   *
   * Notes on special Mongo variables used in the '$reduce' step defined below:
   *
   *  - '$$this' refers to the element being processed
   *  - '$$value' refers to the cumulative value of the expression
   */
  if (step.method === 'dense') {
    vqbVarOrder = {
      $cond: [
        { $ne: [`$$this.${step.valueCol}`, '$$value.prevValue'] },
        { $add: ['$$value.order', 1] },
        '$$value.order',
      ],
    };
  } else {
    vqbVarOrder = { $add: ['$$value.order', 1] };
  }

  /**
   * This is the variable object used in the '$reduce' step described below (see
   * the object structure in the 'rankedArray' doc below). It's here that we
   * compute the rank, that compares two consecutive documents in sorted arrays
   * and which definition depends on the ranking method chosen (see above)
   *
   * Notes on special Mongo variables used in the '$reduce' step defined below:
   *
   *  - '$$this' refers to the element being processed
   *  - '$$value' refers to the cumulative value of the expression
   */
  const vqbVarObj: MongoStep = {
    $let: {
      vars: {
        order: vqbVarOrder,
        rank: {
          $cond: [
            { $ne: [`$$this.${step.valueCol}`, '$$value.prevValue'] },
            { $add: ['$$value.order', 1] },
            '$$value.prevRank',
          ],
        },
      },
      in: {
        a: {
          $concatArrays: [
            '$$value.a',
            [
              {
                $mergeObjects: [
                  '$$this',
                  { [step.newColumnName ?? `${step.valueCol}_RANK`]: '$$rank' },
                ],
              },
            ],
          ],
        },
        order: '$$order',
        prevValue: `$$this.${step.valueCol}`,
        prevRank: '$$rank',
      },
    },
  };

  /**
   * This step transforms sorted arrays (1 array per group as specified by the
   * 'groupby' parameter) of documents into an array of the same sorted documents,
   * with the information of ranking of each document added ionto each(key 'rank).
   *
   * To do so we reduce orignal arrays in one document each with the structure:
   * {
   *   a: [ < list of sorted documents with rank key added > ],
   *   order: < an order counter >,
   *   prevValue: < to keep track of previous document value >,
   *   prevRank: < to keep track of previous document rank >
   * }
   *
   * At the end we just extract the 'a' array (as other keys were only useful as
   * variables in the '$reduce' step)
   */
  const rankedArray: MongoStep = {
    $let: {
      vars: {
        reducedArrayInObj: {
          $reduce: {
            input: '$_vqbArray',
            initialValue: {
              a: [],
              order: 0,
              prevValue: undefined,
              prevRank: undefined,
            },
            in: vqbVarObj,
          },
        },
      },
      in: '$$reducedArrayInObj.a',
    },
  };
  return [
    { $sort: { [step.valueCol]: step.order == 'asc' ? 1 : -1 } },
    {
      $group: {
        _id: step.groupby ? columnMap(step.groupby) : null,
        _vqbArray: { $push: '$$ROOT' },
      },
    },
    { $project: { _vqbSortedArray: rankedArray } },
    { $unwind: '$_vqbSortedArray' },
    { $replaceRoot: { newRoot: '$_vqbSortedArray' } },
  ];
}

function transformRename(step: Readonly<S.RenameStep>): MongoStep[] {
  // For retrocompatibility with old configurations
  if (step.oldname && step.newname) {
    return [
      { $addFields: { [step.newname]: $$(step.oldname) } },
      { $project: { [step.oldname]: 0 } },
    ];
  }

  return [
    { $addFields: Object.fromEntries(step.toRename.map(a => [a[1], $$(a[0])])) },
    { $project: Object.fromEntries(step.toRename.map(a => [a[0], 0])) },
  ];
}

/** transform an 'replace' step into corresponding mongo steps */
function transformReplace(step: Readonly<S.ReplaceStep>): MongoStep {
  const branches: MongoStep[] = step.to_replace.map(([oldval, newval]) => ({
    case: { $eq: [$$(step.search_column), oldval] },
    then: newval,
  }));
  return {
    $addFields: {
      [step.search_column]: {
        $switch: { branches: branches, default: $$(step.search_column) },
      },
    },
  };
}

/** transform a 'rollup' step into corresponding mongo pipeline steps */
function transformRollup(step: Readonly<S.RollupStep>): MongoStep {
  const facet: { [id: string]: MongoStep[] } = {};
  const labelCol = step.labelCol ?? 'label';
  const levelCol = step.levelCol ?? 'level';
  const parentLabelCol = step.parentLabelCol ?? 'parent';

  for (const [idx, elem] of step.hierarchy.entries()) {
    const id = columnMap([...step.hierarchy.slice(0, idx + 1), ...(step.groupby ?? [])]);
    const aggs: { [id: string]: {} } = {};
    for (const aggfStep of step.aggregations) {
      // We support simple string sfor retrocompatibility purposes
      const cols = aggfStep.column ? [aggfStep.column] : aggfStep.columns;
      const newcols = aggfStep.newcolumn ? [aggfStep.newcolumn] : aggfStep.newcolumns;

      if (aggfStep.aggfunction === 'count') {
        for (let i = 0; i < cols.length; i++) {
          // cols and newcols are always of same length
          aggs[newcols[i]] = { $sum: 1 };
        }
      } else {
        for (let i = 0; i < cols.length; i++) {
          // cols and newcols are always of same length
          aggs[newcols[i]] = { [$$(aggfStep.aggfunction)]: $$(cols[i]) };
        }
      }
    }
    const project: { [id: string]: string | number } = {
      _id: 0,
      ...Object.fromEntries(Object.keys(id).map(col => [col, `$_id.${col}`])),
      ...Object.fromEntries(Object.keys(aggs).map(col => [col, 1])),
      [labelCol]: `$_id.${elem}`,
      [levelCol]: elem,
    };
    if (idx > 0) {
      project[parentLabelCol] = `$_id.${step.hierarchy[idx - 1]}`;
    }
    facet[`level_${idx}`] = [
      {
        $group: {
          _id: id,
          ...aggs,
        },
      },
      {
        $project: project,
      },
    ];
  }
  return [
    { $facet: facet },
    {
      $project: {
        _vqbRollupLevels: {
          $concatArrays: Object.keys(facet)
            .sort()
            .map(col => $$(col)),
        },
      },
    },
    { $unwind: '$_vqbRollupLevels' },
    { $replaceRoot: { newRoot: '$_vqbRollupLevels' } },
  ];
}

/** transform a 'sort' step into corresponding mongo steps */
function transformSort(step: Readonly<S.SortStep>): MongoStep {
  const sortMongo: PropMap<number> = {};
  for (const sortColumn of step.columns) {
    sortMongo[sortColumn.column] = sortColumn.order === 'asc' ? 1 : -1;
  }
  return { $sort: sortMongo };
}

/** transform a 'split' step into corresponding mongo steps */
function transformSplit(step: Readonly<S.SplitStep>): MongoStep {
  const addFieldsStep: PropMap<object> = {};
  for (let i = 1; i <= step.number_cols_to_keep; i++) {
    addFieldsStep[`${step.column}_${i}`] = { $arrayElemAt: ['$_vqbTmp', i - 1] };
  }
  return [
    { $addFields: { _vqbTmp: { $split: [$$(step.column), step.delimiter] } } },
    { $addFields: addFieldsStep },
    { $project: { _vqbTmp: 0 } },
  ];
}

/** transform a 'statistics' step into corresponding mongo steps */
function transformStatistics(step: Readonly<S.StatisticsStep>): MongoStep {
  /** Get n-th p-quantile.
   * Examples:
   * - the median is the first quantile of order 2.
   * - the last decile is the 9-th quantile of order 10.
   */
  const _getQuantile = (n: number, p: number): any => ({
    $avg: [
      {
        $arrayElemAt: [
          '$data',
          {
            $trunc: {
              $subtract: [{ $multiply: [{ $divide: ['$count', p] }, n] }, 1],
            },
          },
        ],
      },
      {
        $arrayElemAt: [
          '$data',
          {
            $trunc: { $multiply: [{ $divide: ['$count', p] }, n] },
          },
        ],
      },
    ],
  });

  const varianceFormula: any = { $subtract: ['$average_sum_square', { $pow: ['$average', 2] }] }; // I am using this formula of the variance: avg(x^2) - avg(x)^2
  const statisticsFormula: any = {
    count: 1,
    max: 1,
    min: 1,
    average: 1,
    variance: varianceFormula,
    'standard deviation': { $pow: [varianceFormula, 0.5] },
  };

  const doWeNeedTo: any = {
    computeColumnSquare: (step: Readonly<S.StatisticsStep>): boolean =>
      step.statistics.includes('variance') || step.statistics.includes('standard deviation'),
    computeAverage: (step: Readonly<S.StatisticsStep>): boolean =>
      step.statistics.includes('average') ||
      step.statistics.includes('variance') ||
      step.statistics.includes('standard deviation'),
    sort: (step: Readonly<S.StatisticsStep>): boolean => step.quantiles.length > 0,
    count: (step: Readonly<S.StatisticsStep>): boolean =>
      step.quantiles.length > 0 || step.statistics.includes('count'),
  };

  return [
    {
      $project: {
        ...Object.fromEntries(step.groupbyColumns.map(groupByColumn => [groupByColumn, 1])),
        column: $$(step.column),
        ...(doWeNeedTo.computeColumnSquare(step)
          ? { column_square: { $pow: [$$(step.column), 2] } }
          : {}),
      },
    },
    {
      $match: {
        column: { $ne: null },
      },
    },
    ...(doWeNeedTo.sort(step) ? [{ $sort: { column: 1 } }] : []),
    {
      $group: {
        _id:
          Object.fromEntries(
            step.groupbyColumns.map(groupByColumn => [groupByColumn, $$(groupByColumn)]),
          ) || null,
        data: { $push: '$column' },
        ...(doWeNeedTo.count(step) ? { count: { $sum: 1 } } : {}),
        ...(step.statistics.includes('max') ? { max: { $max: '$column' } } : {}),
        ...(step.statistics.includes('min') ? { min: { $min: '$column' } } : {}),
        ...(doWeNeedTo.computeColumnSquare(step)
          ? { average_sum_square: { $avg: '$column_square' } }
          : {}),
        ...(doWeNeedTo.computeAverage(step) ? { average: { $avg: '$column' } } : {}),
      },
    },
    {
      $project: {
        // groupByColumn
        ...Object.fromEntries(
          step.groupbyColumns.map(groupByColumn => [groupByColumn, `$_id.${groupByColumn}`]),
        ),
        // statistics
        ...Object.fromEntries(
          step.statistics.map(statistic => [statistic, statisticsFormula[statistic]]),
        ),
        // quantiles
        ...Object.fromEntries(
          step.quantiles.map(({ label, order, nth }) => [
            label || `${nth}-th ${order}-quantile`,
            _getQuantile(nth, order),
          ]),
        ),
      },
    },
  ];
}

function $add(...args: any[]) {
  return {
    $add: args,
  };
}

/** transform a 'substring' step into corresponding mongo steps */
function transformSubstring(step: Readonly<S.SubstringStep>): MongoStep {
  const posStartIndex: number | PropMap<any> =
    step.start_index > 0
      ? step.start_index - 1
      : $add({ $strLenCP: $$(step.column) }, step.start_index);

  const posEndIndex: number | PropMap<any> =
    step.end_index > 0 ? step.end_index - 1 : $add({ $strLenCP: $$(step.column) }, step.end_index);

  const lengthToKeep = {
    $add: [
      {
        $subtract: [posEndIndex, posStartIndex],
      },
      1,
    ],
  };

  const substrMongo = { $substrCP: [$$(step.column), posStartIndex, lengthToKeep] };

  return { $addFields: { [step.newColumnName ?? `${step.column}_SUBSTR`]: substrMongo } };
}

/** transform an 'top' step into corresponding mongo steps */
function transformTop(step: Readonly<S.TopStep>): MongoStep[] {
  const sortOrder = step.sort === 'asc' ? 1 : -1;
  const groupCols = step.groups ? columnMap(step.groups) : null;

  return [
    { $sort: { [step.rank_on]: sortOrder } },
    { $group: { _id: groupCols, _vqbAppArray: { $push: '$$ROOT' } } },
    { $project: { _vqbAppTopElems: { $slice: ['$_vqbAppArray', step.limit] } } },
    { $unwind: '$_vqbAppTopElems' },
    { $replaceRoot: { newRoot: '$_vqbAppTopElems' } },
  ];
}

/** transform a 'totals' step into corresponding mongo pipeline steps */
function transformTotals(step: Readonly<S.AddTotalRowsStep>): MongoStep {
  const facet: { [id: string]: MongoStep[] } = {};
  const groups: string[] = step.groups ?? [];
  const addFields: MongoStep = {};
  const project: MongoStep = { _id: 0 }; // ensures $project stage will never be empty
  // list of columns to combine
  const toCombine: string[] = [...step.totalDimensions.map(c => c.totalColumn)];
  // get combinations, remove first combo (most granular combination of columns
  // so not useful to compute total rows) and add[](to compute the grand total)
  const combos: string[][] = combinations(toCombine).slice(1);
  combos.push([]);

  //Keep original data in first facet
  for (const aggfStep of step.aggregations) {
    for (let i = 0; i < aggfStep.columns.length; i++) {
      addFields[aggfStep.newcolumns[i]] = $$(aggfStep.columns[i]);
      if (aggfStep.newcolumns[i] !== aggfStep.columns[i]) {
        project[aggfStep.columns[i]] = 0;
      }
    }
  }
  facet['originalData'] = [{ $addFields: addFields }, { $project: project }];

  for (let i = 0; i < combos.length; i++) {
    const comb = combos[i];
    // List of columns that that will be used to group the aggregations computation
    // i.e. we will compute total rows for dimensions not included in this group id
    const id = columnMap([...comb, ...groups]);
    const aggs: { [id: string]: {} } = {};
    // get columns not in aggregation, i.e. columns that will hold the total rows labels
    const totalColumns: string[] = toCombine.filter(x => !comb.includes(x));
    for (const aggfStep of step.aggregations) {
      for (let j = 0; j < aggfStep.columns.length; j++) {
        const valueCol = aggfStep.columns[j];
        const aggregatedCol = aggfStep.newcolumns[j];
        const aggFunc = aggfStep.aggfunction;
        aggs[aggregatedCol] = aggFunc == 'count' ? { $sum: 1 } : { [$$(aggFunc)]: $$(valueCol) };
      }
    }
    facet[`combo_${i}`] = [
      {
        $group: {
          _id: id,
          ...aggs,
        },
      },
      {
        $project: {
          _id: 0,
          // Return id fields (untouched)
          ...Object.fromEntries(Object.keys(id).map(c => [c, `$_id.${c}`])),
          // Return computed aggregation fields
          ...Object.fromEntries(Object.keys(aggs).map(c => [c, 1])),
          // Project the label of total rows for those columns
          ...Object.fromEntries(
            step.totalDimensions
              .filter(x => totalColumns.includes(x.totalColumn))
              .map(t => [t.totalColumn, t.totalRowsLabel]),
          ),
        },
      },
    ];
  }

  return [
    { $facet: facet },
    {
      $project: {
        _vqbCombos: { $concatArrays: Object.keys(facet).map(col => $$(col)) },
      },
    },
    { $unwind: '$_vqbCombos' },
    { $replaceRoot: { newRoot: '$_vqbCombos' } },
  ];
}

/** transform an 'uniquegroups' step into corresponding mongo steps */
function transformUniqueGroups(step: Readonly<S.UniqueGroupsStep>): MongoStep[] {
  const id = columnMap(step.on);
  const project = Object.fromEntries(Object.keys(id).map(col => [col, `$_id.${col}`]));
  return [{ $group: { _id: id } }, { $project: project }];
}

/** transform an 'unpivot' step into corresponding mongo steps */
function transformUnpivot(step: Readonly<S.UnpivotStep>): MongoStep[] {
  // projectCols to be included in Mongo $project steps
  const projectCols: PropMap<string> = _.fromPairs(step.keep.map(col => [col, `$${col}`]));
  // objectToArray to be included in the first Mongo $project step
  const objectToArray: PropMap<object> = _.fromPairs(
    step.unpivot.map(col => [col, { $ifNull: [$$(col), null] }]),
  );
  const mongoPipeline: MongoStep[] = [
    {
      $project: { ...projectCols, _vqbToUnpivot: { $objectToArray: objectToArray } },
    },
    {
      $unwind: '$_vqbToUnpivot',
    },
    {
      $project: {
        ...projectCols,
        [step.unpivot_column_name]: '$_vqbToUnpivot.k',
        [step.value_column_name]: '$_vqbToUnpivot.v',
      },
    },
  ];

  if (step.dropna) {
    mongoPipeline.push({ $match: { [step.value_column_name]: { $ne: null } } });
  }

  return mongoPipeline;
}

/** transform a 'waterfall' step into corresponding mongo steps */
function transformWaterfall(step: Readonly<S.WaterfallStep>): MongoStep[] {
  let concatMongo = {};
  let facet = {};
  const groupby = step.groupby ?? [];
  const parents = step.parentsColumn !== undefined ? [step.parentsColumn] : [];

  // Pipeline that will be executed to get the array of results for the starting
  // and ending milestone of the waterfall
  const facetStartEnd = [
    {
      $group: {
        _id: columnMap([...groupby, step.milestonesColumn]),
        [step.valueColumn]: { $sum: $$(step.valueColumn) },
      },
    },
    {
      $project: {
        ...Object.fromEntries(groupby.map(col => [col, `$_id.${col}`])),
        LABEL_waterfall: `$_id.${step.milestonesColumn}`,
        GROUP_waterfall:
          step.parentsColumn !== undefined ? `$_id.${step.milestonesColumn}` : undefined,
        TYPE_waterfall: null,
        [step.valueColumn]: 1,
        _vqbOrder: { $cond: [{ $eq: [`$_id.${step.milestonesColumn}`, step.start] }, -1, 1] },
      },
    },
  ];

  // Pipeline that will be executed to get the array of results for the children
  // elements of the waterfall
  const facetChildren = [
    {
      $group: {
        _id: columnMap([...groupby, ...parents, step.labelsColumn, step.milestonesColumn]),
        [step.valueColumn]: { $sum: $$(step.valueColumn) },
      },
    },
    {
      $addFields: {
        _vqbOrder: { $cond: [{ $eq: [`$_id.${step.milestonesColumn}`, step.start] }, 1, 2] },
      },
    },
    { $sort: { _vqbOrder: 1 } },
    {
      $group: {
        _id: {
          ...Object.fromEntries(
            [...groupby, ...parents, step.labelsColumn].map(col => [col, `$_id.${col}`]),
          ),
        },
        _vqbValuesArray: { $push: $$(step.valueColumn) },
      },
    },
    {
      $project: {
        ...Object.fromEntries(groupby.map(col => [col, `$_id.${col}`])),
        LABEL_waterfall: `$_id.${step.labelsColumn}`,
        GROUP_waterfall:
          step.parentsColumn !== undefined ? `$_id.${step.parentsColumn}` : undefined,
        TYPE_waterfall: step.parentsColumn !== undefined ? 'child' : 'parent',
        [step.valueColumn]: {
          $reduce: {
            input: '$_vqbValuesArray',
            initialValue: 0,
            in: { $subtract: ['$$this', '$$value'] },
          },
        },
        _vqbOrder: { $literal: 0 },
      },
    },
  ];

  // If parentsColumn is define, we set the pipeline that will be executed to
  // get the array of results for the parents elements of the waterfall. In such
  // a case we add it to the concatenation of all the pipelines results arrays
  if (step.parentsColumn) {
    const facetParents = [
      {
        $group: {
          _id: columnMap([...groupby, ...parents, step.milestonesColumn]),
          [step.valueColumn]: { $sum: $$(step.valueColumn) },
        },
      },
      {
        $addFields: {
          _vqbOrder: { $cond: [{ $eq: [`$_id.${step.milestonesColumn}`, step.start] }, 1, 2] },
        },
      },
      { $sort: { _vqbOrder: 1 } },
      {
        $group: {
          _id: { ...Object.fromEntries([...groupby, ...parents].map(col => [col, `$_id.${col}`])) },
          _vqbValuesArray: { $push: $$(step.valueColumn) },
        },
      },
      {
        $project: {
          ...Object.fromEntries(groupby.map(col => [col, `$_id.${col}`])),
          LABEL_waterfall: `$_id.${step.parentsColumn}`,
          GROUP_waterfall: `$_id.${step.parentsColumn}`,
          TYPE_waterfall: 'parent',
          [step.valueColumn]: {
            $reduce: {
              input: '$_vqbValuesArray',
              initialValue: 0,
              in: { $subtract: ['$$this', '$$value'] },
            },
          },
          _vqbOrder: { $literal: 0 },
        },
      },
    ];

    facet = {
      _vqb_start_end: facetStartEnd,
      _vqb_parents: facetParents,
      _vqb_children: facetChildren,
    };
    concatMongo = { $concatArrays: ['$_vqb_start_end', '$_vqb_parents', '$_vqb_children'] };
  } else {
    facet = { _vqb_start_end: facetStartEnd, _vqb_children: facetChildren };
    concatMongo = { $concatArrays: ['$_vqb_start_end', '$_vqb_children'] };
  }

  return [
    { $match: { [step.milestonesColumn]: { $in: [step.start, step.end] } } },
    { $facet: facet },
    { $project: { _vqbFullArray: concatMongo } },
    { $unwind: '$_vqbFullArray' },
    { $replaceRoot: { newRoot: '$_vqbFullArray' } },
    {
      $sort: {
        _vqbOrder: 1,
        [step.sortBy === 'label' ? 'LABEL_waterfall' : step.valueColumn]:
          step.order === 'asc' ? 1 : -1,
      },
    },
    { $project: { _vqbOrder: 0 } },
  ];
}

const mapper: Partial<StepMatcher<MongoStep>> = {
  addmissingdates: transformAddMissingDates,
  aggregate: transformAggregate,
  argmax: transformArgmaxArgmin,
  argmin: transformArgmaxArgmin,
  concatenate: transformConcatenate,
  cumsum: transformCumSum,
  custom: (step: Readonly<S.CustomStep>) => JSON.parse(step.query),
  dateextract: (step: Readonly<S.DateExtractPropertyStep>) => ({
    $addFields: {
      [`${step.new_column_name ?? step.column + '_' + step.operation}`]: {
        [`${DATE_EXTRACT_MAP[step.operation]}`]: `$${step.column}`,
      },
    },
  }),
  delete: (step: Readonly<S.DeleteStep>) => ({
    $project: _.fromPairs(step.columns.map(col => [col, 0])),
  }),
  domain: (step: Readonly<S.DomainStep>) => ({ $match: { domain: step.domain } }),
  duplicate: (step: Readonly<S.DuplicateColumnStep>) => ({
    $addFields: { [step.new_column_name]: $$(step.column) },
  }),
  duration: (step: Readonly<S.ComputeDurationStep>) => ({
    $addFields: {
      [step.newColumnName]: {
        $divide: [
          // a time difference between dates is returned in milliseconds by Mongo
          { $subtract: [$$(step.endDateColumn), $$(step.startDateColumn)] },
          DURATION_MULTIPLIER_MAP[step.durationIn],
        ],
      },
    },
  }),
  evolution: transformEvolution,
  fillna: transformFillna,
  filter: transformFilterStep,
  fromdate: transformFromDate,
  lowercase: (step: Readonly<S.ToLowerStep>) => ({
    $addFields: { [step.column]: { $toLower: $$(step.column) } },
  }),
  movingaverage: transformMovingAverage,
  percentage: transformPercentage,
  pivot: transformPivot,
  rank: transformRank,
  rename: transformRename,
  replace: transformReplace,
  rollup: transformRollup,
  select: (step: Readonly<S.SelectStep>) => ({
    $project: _.fromPairs(step.columns.map(col => [col, 1])),
  }),
  split: transformSplit,
  sort: transformSort,
  statistics: transformStatistics,
  strcmp: (step: Readonly<S.CompareTextStep>) => ({
    $addFields: {
      [step.newColumnName]: {
        $cond: [{ $eq: [$$(step.strCol1), $$(step.strCol2)] }, true, false],
      },
    },
  }),
  substring: transformSubstring,
  text: (step: Readonly<S.AddTextColumnStep>) => ({
    $addFields: { [step.new_column]: { $literal: step.text } },
  }),
  todate: (step: Readonly<S.ToDateStep>) => ({
    $addFields: { [step.column]: { $dateFromString: { dateString: $$(step.column) } } },
  }),
  top: transformTop,
  totals: transformTotals,
  uniquegroups: transformUniqueGroups,
  unpivot: transformUnpivot,
  uppercase: (step: Readonly<S.ToUpperStep>) => ({
    $addFields: { [step.column]: { $toUpper: $$(step.column) } },
  }),
  waterfall: transformWaterfall,
};

export class Mongo36Translator extends BaseTranslator {
  static label = 'Mongo 3.6';

  domainToCollection(domain: string) {
    return domain;
  }

  constructor() {
    super();
  }

  setDomainToCollection(domainToCollectionFunc: (domain: string) => string) {
    this.domainToCollection = domainToCollectionFunc;
  }

  translate(pipeline: S.Pipeline) {
    const mongoSteps = super
      .translate(pipeline)
      .reduce((acc: OutputStep[], val) => acc.concat(val), []) as MongoStep[];
    if (mongoSteps.length) {
      return _simplifyMongoPipeline([...mongoSteps, { $project: { _id: 0 } }]);
    }
    return _simplifyMongoPipeline(mongoSteps);
  }

  /** transform an 'append' step into corresponding mongo steps */
  append(step: Readonly<S.AppendStep>): MongoStep[] {
    const pipelines = step.pipelines as S.Pipeline[];
    const pipelinesNames: string[] = ['$_vqbPipelineInline'];
    const lookups: MongoStep[] = [];
    for (let i = 0; i < pipelines.length; i++) {
      const domainStep = pipelines[i][0] as S.DomainStep;
      const pipelineWithoutDomain = pipelines[i].slice(1);
      lookups.push({
        $lookup: {
          from: this.domainToCollection(domainStep.domain),
          pipeline: this.translate(pipelineWithoutDomain),
          as: `_vqbPipelineToAppend_${i}`,
        },
      });
      pipelinesNames.push(`$_vqbPipelineToAppend_${i}`);
    }
    return [
      { $group: { _id: null, _vqbPipelineInline: { $push: '$$ROOT' } } },
      ...lookups,
      { $project: { _vqbPipelinesUnion: { $concatArrays: pipelinesNames } } },
      { $unwind: '$_vqbPipelinesUnion' },
      { $replaceRoot: { newRoot: '$_vqbPipelinesUnion' } },
    ];
  }

  formula(step: Readonly<S.FormulaStep>): MongoStep {
    return {
      $addFields: {
        [step.new_column]: buildMongoFormulaTree(
          buildFormulaTree(step.formula, BaseTranslator.variableDelimiters),
        ),
      },
    };
  }

  // The $regexMatch operator is not supported until mongo 4.2
  protected unsupportedOperatorsInConditions: S.FilterSimpleCondition['operator'][] = [
    'matches',
    'notmatches',
  ];

  ifthenelse(step: Readonly<S.IfThenElseStep>): MongoStep {
    return {
      $addFields: {
        [step.newColumn]: transformIfThenElseStep(
          _.omit(step, ['name', 'newColumn']),
          this.unsupportedOperatorsInConditions,
          BaseTranslator.variableDelimiters,
        ),
      },
    };
  }

  /** transform a 'join' step into corresponding mongo steps */
  join(step: Readonly<S.JoinStep>): MongoStep[] {
    const mongoPipeline: MongoStep[] = [];
    const right = step.right_pipeline as S.Pipeline;
    const rightDomain = right[0] as S.DomainStep;
    const rightWithoutDomain = right.slice(1);
    const mongoLet: { [k: string]: string } = {};
    const mongoExprAnd: { [k: string]: object }[] = [];
    for (const [leftOn, rightOn] of step.on) {
      mongoLet[columnToUserVariable(leftOn)] = $$(leftOn);
      mongoExprAnd.push({
        $eq: [$$(rightOn), $$($$(columnToUserVariable(leftOn)))],
      });
    }
    mongoPipeline.push({
      $lookup: {
        from: this.domainToCollection(rightDomain.domain),
        let: mongoLet,
        pipeline: [
          ...this.translate(rightWithoutDomain),
          { $match: { $expr: { $and: mongoExprAnd } } },
        ],
        as: '_vqbJoinKey',
      },
    });
    if (step.type === 'inner') {
      mongoPipeline.push({ $unwind: '$_vqbJoinKey' });
    } else if (step.type === 'left') {
      mongoPipeline.push({ $unwind: { path: '$_vqbJoinKey', preserveNullAndEmptyArrays: true } });
    } else {
      mongoPipeline.push(
        { $match: { _vqbJoinKey: { $eq: [] } } },
        { $unwind: { path: '$_vqbJoinKey', preserveNullAndEmptyArrays: true } },
      );
    }
    mongoPipeline.push(
      {
        $replaceRoot: { newRoot: { $mergeObjects: ['$_vqbJoinKey', '$$ROOT'] } },
      },
      {
        $project: { _vqbJoinKey: 0 },
      },
    );
    return mongoPipeline;
  }

  validate(customEditedStep: S.CustomStep): ValidationError[] | null {
    try {
      JSON.parse(customEditedStep.query);
      return null;
    } catch (e) {
      return [
        {
          keyword: 'json',
          dataPath: '.query',
          message: e.message,
        },
      ];
    }
  }
}

Object.assign(Mongo36Translator.prototype, mapper);
