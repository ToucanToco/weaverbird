/** This module contains mongo specific translation operations */

import { PipelineStep } from '@/lib/steps';

/**
 * MongoStep interface. For now, it's basically an object with any property.
 */
export interface MongoStep {
  [propName: string]: any;
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
  const mongoSteps: Array<MongoStep> = [];
  for (const step of pipeline) {
    if (step.name === 'domain') {
      mongoSteps.push({ $match: { domain: step.domain } });
    } else if (step.name === 'select') {
      const projection: { [propName: string]: number } = {};
      for (const column of step.columns) {
        projection[column] = 1;
      }
      mongoSteps.push({ $project: projection });
    } else if (step.name === 'rename') {
      mongoSteps.push({ $project: { [step.newname]: `$${step.oldname}` } });
    } else if (step.name === 'delete') {
      const projection: { [propName: string]: number } = {};
      for (const column of step.columns) {
        projection[column] = 0;
      }
      mongoSteps.push({ $project: projection });
    } else if (step.name === 'filter') {
      if (step.operator === undefined || step.operator === 'eq') {
        mongoSteps.push({ $match: { [step.column]: step.value } });
      } else {
        throw new Error(`Operator ${step.operator} is not handled yet.`);
      }
    } else if (step.name === 'newcolumn') {
      mongoSteps.push({ $project: { [step.column]: step.query } });
    } else if (step.name === 'custom') {
      mongoSteps.push(step.query);
    }
  }
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
