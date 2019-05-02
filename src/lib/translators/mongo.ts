/** This module contains mongo specific translation operations */

import {
  AggregationStep,
  ArgmaxStep,
  ArgminStep,
  FilterStep,
  PipelineStep,
  PivotStep,
  PercentageStep,
  ReplaceStep,
  SortStep,
  TopStep,
  UnpivotStep,
} from '@/lib/steps';
import { StepMatcher } from '@/lib/matcher';
import { BaseTranslator } from '@/lib/translators/base';
import * as math from 'mathjs';
import { MathNode } from '@/typings/mathjs';
import _ from 'lodash';

type PropMap<T> = { [prop: string]: T };

/**
 * MongoStep interface. For now, it's basically an object with any property.
 */
export interface MongoStep {
  [propName: string]: any;
}

function fromkeys(keys: Array<string>, value = 0) {
  const out: { [propname: string]: any } = {};
  for (const key of keys) {
    out[key] = value;
  }
  return out;
}

function filterstepToMatchstep(step: FilterStep): MongoStep {
  const operatorMapping = {
    eq: '$eq',
    ne: '$ne',
    lt: '$lt',
    le: '$lte',
    gt: '$gt',
    ge: '$gte',
    in: '$in',
    nin: '$nin',
  };
  const operator = step.operator || 'eq';
  return { $match: { [step.column]: { [operatorMapping[operator]]: step.value } } };
}

/** transform an 'aggregate' step into corresponding mongo steps */
function transformAggregate(step: AggregationStep): Array<MongoStep> {
  const idblock: PropMap<string> = {};
  const group: { [id: string]: {} } = {};
  const project: PropMap<any> = {};
  group._id = idblock;
  for (const colname of step.on) {
    idblock[colname] = `$${colname}`;
  }
  for (const aggf_step of step.aggregations) {
    if (aggf_step.aggfunction === 'count') {
      // There is no `$count` operator in Mongo, we have to `$sum` 1s to get
      // an equivalent result
      group[aggf_step.newcolumn] = {
        $sum: 1,
      };
    } else {
      group[aggf_step.newcolumn] = {
        [`$${aggf_step.aggfunction}`]: `$${aggf_step.column}`,
      };
    }
  }
  for (const group_key of Object.keys(group)) {
    if (group_key === '_id') {
      for (const idkey of Object.keys(group[group_key])) {
        project[idkey] = `$_id.${idkey}`;
      }
    } else {
      project[group_key] = 1;
    }
  }
  return [{ $group: group }, { $project: project }];
}

/** transform an 'argmax' or 'argmin' step into corresponding mongo steps */
function transformArgmaxArgmin(step: ArgmaxStep | ArgminStep): Array<MongoStep> {
  const groupMongo: MongoStep = {};
  let groupCols: PropMap<string> | null = {};
  const stepMapping = { argmax: '$max', argmin: '$min' };

  // Prepare the $group Mongo step
  if (step.groups) {
    for (const col of step.groups) {
      groupCols[col] = `$${col}`;
    }
  } else {
    groupCols = null;
  }
  groupMongo.$group = {
    _id: groupCols,
    _vqbAppArray: { $push: '$$ROOT' },
    _vqbAppValueToCompare: { [stepMapping[step.name]]: `$${step.column}` },
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
            $eq: [`$${step.column}`, '$_vqbAppValueToCompare'],
          },
          '$$KEEP',
          '$$PRUNE',
        ],
      },
    },
  ];
}

/** transform an 'percentage' step into corresponding mongo steps */
function transformPercentage(step: PercentageStep): Array<MongoStep> {
  const groupMongo: MongoStep = {};
  let groupCols: PropMap<string> | null = {};
  const projectMongo: MongoStep = {};
  const newCol = step.new_column || step.column;

  // Prepare the $group Mongo step
  if (step.group) {
    for (const col of step.group) {
      groupCols[col] = `$${col}`;
    }
  } else {
    groupCols = null;
  }
  groupMongo['$group'] = {
    _id: groupCols,
    _vqbAppArray: { $push: '$$ROOT' },
    _vqbTotalDenum: { $sum: `$${step.column}` },
  };

  // Prepare the $project Mongo step
  projectMongo['$project'] = {
    [newCol]: {
      $cond: [
        { $eq: ['$_vqbTotalDenum', 0] },
        null,
        { $divide: [`$_vqbAppArray.${step.column}`, '$_vqbTotalDenum'] },
      ],
    },
    _vqbAppArray: 1, // we need to keep track of this key for the next operation
  };

  return [
    groupMongo,
    { $unwind: '$_vqbAppArray' },
    projectMongo,
    // Line below: Keep all columns that were not used in computation, 'stored' in _vqbAppArray
    { $replaceRoot: { newRoot: { $mergeObjects: ['$_vqbAppArray', '$$ROOT'] } } },
    { $project: { _vqbAppArray: 0 } }, // We do not want to keep that column at the end
  ];
}

/** transform an 'pivot' step into corresponding mongo steps */
function transformPivot(step: PivotStep): Array<MongoStep> {
  let groupCols1: PropMap<string> = {};
  let groupCols2: PropMap<string> = {};
  let addFieldsStep: PropMap<string> = {};

  // Prepare groupCols to populate the `_id` field sof Mongo `$group` steps and addFields step
  for (const col of step.index) {
    groupCols1[col] = `$${col}`;
    groupCols2[col] = `$_id.${col}`;
    addFieldsStep[`_vqbAppTmpObj.${col}`] = `$_id.${col}`;
  }

  return [
    /**
     * First we perform the aggregation with the _id including the column to pivot
     */
    {
      $group: {
        _id: { ...groupCols1, [step.column_to_pivot]: `$${step.column_to_pivot}` },
        [step.value_column]: { [`$${step.agg_function}`]: `$${step.value_column}` },
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
            [step.value_column]: `$${step.value_column}`,
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
    /**
     * Then we include back in every document created in the previous step the index columns
     * (still accessible in the _id object)
     */
    { $addFields: addFieldsStep },
    /**
     * Then we replace the root of the documents tree to get our columns ready for
     * our needed table-like, unnested format
     */
    { $replaceRoot: { newRoot: '$_vqbAppTmpObj' } },
  ];
}

/** transform an 'replace' step into corresponding mongo steps */
function transformReplace(step: ReplaceStep): MongoStep {
  return {
    $addFields: {
      [step.new_column || step.search_column]: {
        $cond: [
          {
            $eq: [`$${step.search_column}`, `${step.oldvalue}`],
          },
          `${step.newvalue}`,
          `$${step.search_column}`,
        ],
      },
    },
  };
}

/** transform a 'sort' step into corresponding mongo steps */
function transformSort(step: SortStep): MongoStep {
  const sortMongo: PropMap<number> = {};
  const sortOrders = step.order === undefined ? Array(step.columns.length).fill('asc') : step.order;
  for (let i = 0; i < step.columns.length; i++) {
    const order = sortOrders[i] === 'asc' ? 1 : -1;
    sortMongo[step.columns[i]] = order;
  }
  return { $sort: sortMongo };
}

/** transform an 'top' step into corresponding mongo steps */
function transformTop(step: TopStep): Array<MongoStep> {
  const sortOrder = step.sort === 'asc' ? 1 : -1;
  let groupCols: PropMap<string> | null = {};

  // Prepare the $group Mongo step
  if (step.groups) {
    for (const col of step.groups) {
      groupCols[col] = `$${col}`;
    }
  } else {
    groupCols = null;
  }

  return [
    { $sort: { [step.rank_on]: sortOrder } },
    { $group: { _id: groupCols, _vqbAppArray: { $push: '$$ROOT' } } },
    { $project: { _vqbAppTopElems: { $slice: ['$_vqbAppArray', step.limit] } } },
    { $unwind: '$_vqbAppTopElems' },
    { $replaceRoot: { newRoot: '$_vqbAppTopElems' } },
  ];
}

/** transform an 'unpivot' step into corresponding mongo steps */
function transformUnpivot(step: UnpivotStep): Array<MongoStep> {
  let mongoPipeline: Array<MongoStep> = [];
  // projectCols to be included in Mongo $project steps
  const projectCols: PropMap<string> = _.fromPairs(step.keep.map(col => [col, `$${col}`]));
  // objectToArray to be included in the first Mongo $project step
  const objectToArray: PropMap<string> = _.fromPairs(step.unpivot.map(col => [col, `$${col}`]));

  mongoPipeline = [
    {
      $project: { ...projectCols, _vqbToUnpivot: { $objectToArray: objectToArray } },
    },
    { $unwind: '$_vqbToUnpivot' },
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
 * Translate a mathjs logical tree describing a formula into a Mongo step
 * @param node a mathjs node object (usually received after parsing an string expression)
 * This node is the root node of the logical tree describing the formula
 */
function buildMongoFormulaTree(node: MathNode): MongoStep | string | number {
  // For type checking in `case: 'OperatorNode'` in the`switch`clause below,
  // do not let`args` and `op` be potentially`undefined`
  switch (node.type) {
    case 'OperatorNode':
      if (node.args.length === 1) {
        const factor = node.op === '+' ? 1 : -1;
        return {
          $multiply: [factor, buildMongoFormulaTree(node.args[0])],
        };
      }
      return {
        [getOperator(node.op)]: node.args.map(buildMongoFormulaTree),
      };
    case 'SymbolNode':
      return `$${node.name}`;
    case 'ConstantNode':
      return node.value;
    case 'ParenthesisNode':
      return buildMongoFormulaTree(node.content);
  }
}

const mapper: StepMatcher<MongoStep> = {
  aggregate: transformAggregate,
  argmax: transformArgmaxArgmin,
  argmin: transformArgmaxArgmin,
  custom: step => step.query,
  delete: step => ({ $project: fromkeys(step.columns, 0) }),
  domain: step => ({ $match: { domain: step.domain } }),
  fillna: step => ({
    $addFields: {
      [step.column]: {
        $cond: [{ $eq: [`$${step.column}`, null] }, `${step.value}`, `$${step.column}`],
      },
    },
  }),
  filter: filterstepToMatchstep,
  formula: step => ({
    $addFields: {
      [step.new_column]: buildMongoFormulaTree(math.parse(step.formula)),
    },
  }),
  percentage: transformPercentage,
  pivot: transformPivot,
  rename: step => [
    { $addFields: { [step.newname]: `$${step.oldname}` } },
    { $project: { [step.oldname]: 0 } },
  ],
  replace: transformReplace,
  select: step => ({ $project: fromkeys(step.columns, 1) }),
  sort: transformSort,
  top: transformTop,
  unpivot: transformUnpivot,
};

export class Mongo36Translator extends BaseTranslator {
  translate(pipeline: Array<PipelineStep>) {
    const mongoSteps = super.translate(pipeline).flat();
    return _simplifyMongoPipeline(mongoSteps);
  }
}
Object.assign(Mongo36Translator.prototype, mapper);

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
export function _simplifyMongoPipeline(mongoSteps: Array<MongoStep>): Array<MongoStep> {
  let merge = true;
  const outputSteps: Array<MongoStep> = [];
  let lastStep: MongoStep = mongoSteps[0];
  outputSteps.push(lastStep);

  for (const step of mongoSteps.slice(1)) {
    const [stepOperator] = Object.keys(step);
    const isMergeable =
      stepOperator === '$project' || stepOperator === '$addFields' || stepOperator === '$match';
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
        if (lastStep[stepOperator].hasOwnProperty(key)) {
          // We do not want to merge two $project with common keys
          merge = false;
          break;
        }
        if (stepOperator !== '$match') {
          // We do not want to merge two $project or $addFields with a `step`
          // key referencing as value a`lastStep` key
          const valueString: string = JSON.stringify(step[stepOperator][key]);
          for (const lastKey in lastStep[stepOperator]) {
            const regex: RegExp = new RegExp(`.*['"]\\$${lastKey}['"].*`);
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
