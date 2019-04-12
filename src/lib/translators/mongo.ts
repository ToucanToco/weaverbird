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
  } else if (step.operator === 'ne') {
    return { $match: { [step.column]: { $ne: step.value } } };
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
  const outputSteps: Array<MongoStep> = [];
  let lastStep: MongoStep = mongoSteps[0];
  outputSteps.push(lastStep);

  for (const step of mongoSteps.slice(1)) {
    if (step.$project !== undefined && lastStep.$project !== undefined) {
      for (const key in step.$project) {
        // We do not want to merge two $project with common keys
        if (lastStep.$project.hasOwnProperty(key)) {
          outputSteps.push(step);
          lastStep = step;
          continue;
        } else {
          // We do not want to merge two $project with a `step` key referencing
          //as value a`lastStep` key
          const projectString: string = JSON.stringify(step.$project[key]);
          for (const lastKey in lastStep.$project) {
            const regex: RegExp = new RegExp(`.*['"]\\$${lastKey}['"].*`);
            if (regex.test(projectString)) {
              outputSteps.push(step);
              lastStep = step;
              continue;
            }
          }
        }
      }
      // merge $project steps together
      lastStep.$project = { ...lastStep.$project, ...step.$project };
      continue;
    } else if (step.$addFields !== undefined && lastStep.$addFields !== undefined) {
      for (const key in step.$addFields) {
        // We do not want to merge two $addFields with common keys
        if (lastStep.$addFields.hasOwnProperty(key)) {
          outputSteps.push(step);
          lastStep = step;
          continue;
        } else {
          // We do not want to merge two $addFields with a `step` key referencing
          //as value a`lastStep` key
          const addFieldsString: string = JSON.stringify(step.$addFields[key]);
          for (const lastKey in lastStep.$addFields) {
            const regex: RegExp = new RegExp(`.*['"]\\$${lastKey}['"].*`);
            if (regex.test(addFieldsString)) {
              outputSteps.push(step);
              lastStep = step;
              continue;
            }
          }
        }
      }
      // merge $project steps together
      lastStep.$addFields = { ...lastStep.$addFields, ...step.$addFields };
      continue;
    } else if (step.$match !== undefined && lastStep.$match !== undefined) {
      for (const key in step.$match) {
        // We do not want to merge two $project with common keys
        if (lastStep.$match.hasOwnProperty(key)) {
          outputSteps.push(step);
          lastStep = step;
          continue;
        }
      }
      // merge $match steps together
      lastStep.$match = { ...lastStep.$match, ...step.$match };
      continue;
    }
    lastStep = step;
    outputSteps.push(lastStep);
  }
  return outputSteps;
}
