/** This module contains mongo specific translation operations */

import { AggregationStep, FilterStep, PipelineStep } from '@/lib/steps';
import { matchStep } from '@/lib/matcher';

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

/**
 * Transform a standard pipeline into a list of mongo steps.
 *
 * - 'domain' steps are transformed into `$match` statements,
 * - 'select', 'rename', 'delete' and 'newcolumn' steps are transformed into
 *   `$project` statements,
 * - 'filter' steps are transformed into `match` statements.
 *
 * @param pipeline the input pipeline
 *
 * @returns the list of corresponding mongo steps
 */
export function pipeToMongo(pipeline: Array<PipelineStep>): Array<MongoStep> {
  const mongoSteps: Array<MongoStep> = pipeline
    .map(
      matchStep({
        domain: step => ({ $match: { domain: step.domain } }),
        filter: filterstepToMatchstep,
        select: step => ({ $project: fromkeys(step.columns, 1) }),
        rename: step => ({ $project: { [step.newname]: `$${step.oldname}` } }),
        delete: step => ({ $project: fromkeys(step.columns, 0) }),
        newcolumn: step => ({ $project: { [step.column]: step.query } }),
        aggregate: transformAggregate,
        custom: step => step.query,
      }),
    )
    .flat();
  return simplifyMongoPipeline(mongoSteps);
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
function simplifyMongoPipeline(mongoSteps: Array<MongoStep>): Array<MongoStep> {
  const outputSteps: Array<MongoStep> = [];
  let lastStep: MongoStep = mongoSteps[0];
  outputSteps.push(lastStep);

  for (const step of mongoSteps.slice(1)) {
    if (step.$project !== undefined && lastStep.$project !== undefined) {
      // merge $project steps together
      lastStep.$project = { ...lastStep.$project, ...step.$project };
      continue;
    } else if (step.$match !== undefined && lastStep.$match !== undefined) {
      // merge $match steps together
      lastStep.$match = { ...lastStep.$match, ...step.$match };
      continue;
    }
    lastStep = step;
    outputSteps.push(lastStep);
  }
  return outputSteps;
}

export const translators = {
  mongo36: pipeToMongo,
};
