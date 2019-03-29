/**
 * Pipeline builder module.
 *
 * This module define the mongo → standard pipeline steps implementation.
 */

import { PipelineStep, ReplaceStep } from './steps';

/**
 * MongoStep interface. For now, it's basically an object with any property.
 */
export interface MongoStep {
  [propName: string]: any;
}

/**
 * Transform a mongo `$match` step into a list of pipeline steps.
 * If a `domain` key is found in the `$match` step, generate a `Domain`
 * pipeline step. After that, generate a `Filter` step with all the remaining
 * properties.
 *
 * @param matchStep the match mongo step
 * @returns the corresponding pipeline steps
 */
function transformMatch(matchStep: MongoStep): Array<PipelineStep> {
  const output: Array<PipelineStep> = [];
  if (matchStep.$match.domain !== undefined) {
    output.push({ name: 'domain', domain: matchStep.$match.domain });
  }
  for (const column of Object.keys(matchStep.$match).sort()) {
    if (column !== 'domain') {
      output.push({ name: 'filter', column, value: matchStep.$match[column] });
    }
  }
  return output;
}

/**
 * Transform a mongo `$project` step into a list of pipeline steps.
 *
 * @param matchStep the match mongo step
 * @returns the corresponding pipeline steps
 */
function transformProject(matchStep: MongoStep): Array<PipelineStep> {
  const output: Array<PipelineStep> = [];
  // NOTE: we have to tell typescript that `needsRenaming`, `needsDeletion` and
  // `computedColumns` are arrays of `PipelineStep` because it can't otherwise
  // infer the "name" property literal type correctly.
  // cf.https://github.com/Microsoft/TypeScript/issues/15311 or
  // https://stackoverflow.com/questions/50762772/typescript-why-cant-this-string-literal-type-be-inferred
  const needsRenaming: Array<PipelineStep> = [];
  const needsDeletion: Array<PipelineStep> = [];
  const computedColumns: Array<PipelineStep> = [];
  const select = [];
  for (let [outcol, incol] of Object.entries(matchStep.$project)) {
    if (typeof incol === 'string') {
      if (incol[0] === '$' && incol.slice(1) !== outcol) {
        // case { $project: { zone: '$Region' } }
        needsRenaming.push({ name: 'rename', oldname: incol.slice(1), newname: outcol });
      } else if (incol.slice(1) === outcol) {
        select.push(outcol);
      }
    } else if (typeof incol === 'number') {
      if (incol === 0) {
        // case { $project: { zone: 0 } }
        needsDeletion.push({ name: 'delete', columns: [outcol] });
      } else {
        // case { $project: { zone: 1 } }
        select.push(outcol);
      }
    } else if (typeof incol === 'object') {
      computedColumns.push({ name: 'newcolumn', column: outcol, query: incol });
    }
  }
  if (select.length) {
    output.push({ name: 'select', columns: select });
  }
  output.push(...needsRenaming, ...needsDeletion, ...computedColumns);
  return output;
}

function transformFallback(step: MongoStep): Array<PipelineStep> {
  return [
    {
      name: 'custom',
      query: step,
    },
  ];
}

/**
 * Transform a list of mongo steps into a standard pipeline, as understood
 * by the Pipeline vue.
 *
 * @param mongoSteps the list of input mongo steps
 *
 * @returns the standard pipeline
 */
export function mongoToPipe(mongoSteps: Array<MongoStep>): Array<PipelineStep> {
  const listOfSteps: Array<PipelineStep> = [];
  for (const step of mongoSteps) {
    let transformer;
    if (step.$match !== undefined) {
      transformer = transformMatch;
    } else if (step.$project !== undefined) {
      transformer = transformProject;
    } else {
      transformer = transformFallback;
    }
    listOfSteps.push(...transformer(step));
  }
  return listOfSteps;
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
    } else if (step.name === 'replace') {
      mongoSteps.push(transformReplaceStep(step));
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

function transformReplaceStep(step: ReplaceStep): MongoStep {
  return {
    $project: {
      // <all other columns>: 1
      [step.new_column || step.search_column]: {
        $cond: [
          {
            $eq: [`$${step.search_column}`, `${step.oldvalue}`]
          },
          `${step.newvalue}`,
          `$${step.search_column}`
        ]
      }
    }
  }
}
