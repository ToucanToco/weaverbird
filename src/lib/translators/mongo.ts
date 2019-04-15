/** This module contains mongo specific translation operations */

import { AggregationStep, FilterStep, PipelineStep, ReplaceStep } from '@/lib/steps';
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
  if (step.operator === undefined || step.operator === 'eq') {
    return { $match: { [step.column]: step.value } };
  } else {
    throw new Error(`Operator ${step.operator} is not handled yet.`);
  }
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
    group[aggf_step.name] = {
      [`$${aggf_step.aggfunction}`]: `$${aggf_step.column}`,
    };
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
