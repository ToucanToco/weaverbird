/** This module contains mongo specific translation operations */

import _ from 'lodash';
import * as math from 'mathjs';

import { $$ } from '@/lib/helpers';
import { OutputStep, StepMatcher } from '@/lib/matcher';
import * as S from '@/lib/steps';
import { BaseTranslator, ValidationError } from '@/lib/translators/base';
import { MathNode } from '@/typings/mathjs';

type PropMap<T> = { [prop: string]: T };

/**
 * MongoStep interface. For now, it's basically an object with any property.
 */
export interface MongoStep {
  [propName: string]: any;
}

type ComboOperator = 'and' | 'or';

type FilterComboAndMongo = {
  $and: MongoStep[];
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
  return { [cond.column]: { [operatorMapping[cond.operator]]: cond.value } };
}

function filterstepToMatchstep(step: Readonly<S.FilterStep>): MongoStep {
  const condition = step.condition;
  return { $match: buildMatchTree(condition) };
}

/** transform an 'aggregate' step into corresponding mongo steps */
function transformAggregate(step: Readonly<S.AggregationStep>): MongoStep[] {
  const idblock: PropMap<string> = columnMap(step.on);
  const group: { [id: string]: {} } = {};
  const project: PropMap<any> = {};
  group._id = idblock;
  for (const aggfStep of step.aggregations) {
    if (aggfStep.aggfunction === 'count') {
      // There is no `$count` operator in Mongo, we have to `$sum` 1s to get
      // an equivalent result
      group[aggfStep.newcolumn] = {
        $sum: 1,
      };
    } else {
      group[aggfStep.newcolumn] = {
        [$$(aggfStep.aggfunction)]: $$(aggfStep.column),
      };
    }
  }
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

/** transform a 'concatenate' step into corresponding mongo steps */
function transformConcatenate(step: Readonly<S.ConcatenateStep>): MongoStep {
  const concatArr: string[] = [$$(step.columns[0])];
  for (const colname of step.columns.slice(1)) {
    concatArr.push(step.separator, $$(colname));
  }
  return { $addFields: { [step.new_column_name]: { $concat: concatArr } } };
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
        [step.column]: {
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

  return [
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

/** transform a 'substring' step into corresponding mongo steps */
function transformSubstring(step: Readonly<S.SubstringStep>): MongoStep {
  const posStartIndex: number | PropMap<any> =
    step.start_index > 0
      ? step.start_index - 1
      : {
        $add: [
          {
            $strLenCP: $$(step.column),
          },
          step.start_index,
        ],
      };

  const posEndIndex: number | PropMap<any> =
    step.end_index > 0
      ? step.end_index - 1
      : {
        $add: [
          {
            $strLenCP: $$(step.column),
          },
          step.end_index,
        ],
      };

  const lengthToKeep = {
    $add: [
      {
        $subtract: [posEndIndex, posStartIndex],
      },
      1,
    ],
  };

  const substrMongo = { $substrCP: [$$(step.column), posStartIndex, lengthToKeep] };

  return { $addFields: { [step.column]: substrMongo } };
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

/** transform an 'unpivot' step into corresponding mongo steps */
function transformUnpivot(step: Readonly<S.UnpivotStep>): MongoStep[] {
  // projectCols to be included in Mongo $project steps
  const projectCols: PropMap<string> = _.fromPairs(step.keep.map(col => [col, `$${col}`]));
  // objectToArray to be included in the first Mongo $project step
  const objectToArray: PropMap<string> = _.fromPairs(step.unpivot.map(col => [col, `$${col}`]));
  const mongoPipeline: MongoStep[] = [
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
      return $$(node.name);
    case 'ConstantNode':
      return node.value;
    case 'ParenthesisNode':
      return buildMongoFormulaTree(node.content);
  }
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
            const regex = new RegExp(`.*['"]\\$${lastKey}['"].*`);
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

const mapper: Partial<StepMatcher<MongoStep>> = {
  aggregate: transformAggregate,
  argmax: transformArgmaxArgmin,
  argmin: transformArgmaxArgmin,
  concatenate: transformConcatenate,
  custom: (step: Readonly<S.CustomStep>) => JSON.parse(step.query),
  delete: (step: Readonly<S.DeleteStep>) => ({
    $project: _.fromPairs(step.columns.map(col => [col, 0])),
  }),
  domain: (step: Readonly<S.DomainStep>) => ({ $match: { domain: step.domain } }),
  duplicate: (step: Readonly<S.DuplicateColumnStep>) => ({
    $addFields: { [step.new_column_name]: $$(step.column) },
  }),
  fillna: (step: Readonly<S.FillnaStep>) => ({
    $addFields: {
      [step.column]: {
        $ifNull: [$$(step.column), step.value],
      },
    },
  }),
  filter: filterstepToMatchstep,
  formula: (step: Readonly<S.FormulaStep>) => ({
    $addFields: {
      [step.new_column]: buildMongoFormulaTree(math.parse(step.formula)),
    },
  }),
  fromdate: (step: Readonly<S.FromDateStep>) => ({
    $addFields: {
      [step.column]: { $dateToString: { date: $$(step.column), format: `${step.format}` } },
    },
  }),
  lowercase: (step: Readonly<S.ToLowerStep>) => ({
    $addFields: { [step.column]: { $toLower: $$(step.column) } },
  }),
  percentage: transformPercentage,
  pivot: transformPivot,
  rename: (step: Readonly<S.RenameStep>) => [
    { $addFields: { [step.newname]: $$(step.oldname) } },
    { $project: { [step.oldname]: 0 } },
  ],
  replace: transformReplace,
  select: (step: Readonly<S.SelectStep>) => ({
    $project: _.fromPairs(step.columns.map(col => [col, 1])),
  }),
  split: transformSplit,
  sort: transformSort,
  substring: transformSubstring,
  text: step => ({ $addFields: { [step.new_column]: step.text } }),
  todate: (step: Readonly<S.ToDateStep>) => ({
    $addFields: { [step.column]: { $dateFromString: { dateString: $$(step.column) } } },
  }),
  top: transformTop,
  unpivot: transformUnpivot,
  uppercase: (step: Readonly<S.ToUpperStep>) => ({
    $addFields: { [step.column]: { $toUpper: $$(step.column) } },
  }),
};

export class Mongo36Translator extends BaseTranslator {
  static label = 'Mongo 3.6';

  domainCollectionMap: { [k: string]: string };

  constructor() {
    super();
    this.domainCollectionMap = {};
  }

  setDomainCollectionMap(domColMap: { [k: string]: string }) {
    this.domainCollectionMap = domColMap;
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
          from: this.domainCollectionMap[domainStep.domain] || domainStep.domain,
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

  /** transform a 'join' step into corresponding mongo steps */
  join(step: Readonly<S.JoinStep>): MongoStep[] {
    const mongoPipeline: MongoStep[] = [];
    const right = step.right_pipeline as S.Pipeline;
    const rightDomain = right[0] as S.DomainStep;
    const rightWithoutDomain = right.slice(1);
    const mongoLet: { [k: string]: string } = {};
    const mongoExprAnd: { [k: string]: object }[] = [];
    for (const [leftOn, rightOn] of step.on) {
      mongoLet[`vqb_${leftOn}`] = $$(leftOn);
      mongoExprAnd.push({ $eq: [$$(rightOn), $$($$(`vqb_${leftOn}`))] });
    }
    mongoPipeline.push({
      $lookup: {
        from: this.domainCollectionMap[rightDomain.domain] || rightDomain.domain,
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
