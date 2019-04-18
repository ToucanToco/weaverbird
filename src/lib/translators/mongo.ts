/** This module contains mongo specific translation operations */

import {
  AggregationStep,
  FilterStep,
  PipelineStep,
  ReplaceStep,
  SortStep,
  TopStep,
  PercentageStep,
} from '@/lib/steps';
import { StepMatcher } from '@/lib/matcher';
import { BaseTranslator } from '@/lib/translators/base';

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

/** transform an 'percentage' step into corresponding mongo steps */
function transformPercentage(step: PercentageStep): Array<MongoStep> {
  const mongoPipeline: Array<MongoStep> = [];
  const groupMongo: MongoStep = {};
  let groupCols: PropMap<string> | null = {};
  const addFieldsMongo: MongoStep = {};
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
    tcAppArray: { $push: '$$ROOT' },
    tcTotalDenum: { $sum: `$${step.column}` },
  };

  // Prepare the $addFields Mongo step
  addFieldsMongo['$addFields'] = {
    [newCol]: {
      $cond: [
        { $eq: ['$tcTotalDenum', 0] },
        null,
        { $divide: [`$tcAppArray.${step.column}`, '$tcTotalDenum'] },
      ],
    },
  };

  return [groupMongo, { $unwind: '$tcAppArray' }, addFieldsMongo];
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
    { $group: { _id: groupCols, _tcAppArray: { $push: '$$ROOT' } } },
    { $project: { _tcAppTopElems: { $slice: ['$_tcAppArray', step.limit] } } },
    { $unwind: '$_tcAppTopElems' },
    { $replaceRoot: { newRoot: '$_tcAppTopElems' } },
  ];
}

const mapper: StepMatcher<MongoStep> = {
  domain: step => ({ $match: { domain: step.domain } }),
  filter: filterstepToMatchstep,
  select: step => ({ $project: fromkeys(step.columns, 1) }),
  rename: step => [
    { $addFields: { [step.newname]: `$${step.oldname}` } },
    { $project: { [step.oldname]: 0 } },
  ],
  delete: step => ({ $project: fromkeys(step.columns, 0) }),
  newcolumn: step => ({ $addFields: { [step.column]: step.query } }),
  aggregate: transformAggregate,
  custom: step => step.query,
  replace: transformReplace,
  sort: transformSort,
  fillna: step => ({
    $addFields: {
      [step.column]: {
        $cond: [{ $eq: [`$${step.column}`, null] }, `${step.value}`, `$${step.column}`],
      },
    },
  }),
  top: transformTop,
  percentage: transformPercentage,
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
        // We do not want to merge two $project with common keys
        if (lastStep[stepOperator].hasOwnProperty(key)) {
          merge = false;
          break;
        } else if (stepOperator !== '$match') {
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
