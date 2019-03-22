/**
 * Pipeline builder module.
 *
 * This module define the mongo → standard pipeline steps implementation.
 */

import { PipelineStep } from './steps';
import { MongoStep } from '@/lib/translators/mongo';

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
