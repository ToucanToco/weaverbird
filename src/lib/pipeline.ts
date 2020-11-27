/**
 * Pipeline builder module.
 *
 * This module define the mongo → standard pipeline steps implementation.
 */

import { Pipeline } from './steps';
import { MongoStep } from './translators/mongo';

/**
 * extract the requested domain from the first step and return the rest of the
 * pipeline unchanged. This is useful in the GUI where the domain steps is
 * handled differently from the rest of the pipeline. It's also useful in
 * backends such as mongo where the first step corresponds to the collection
 * that has to be queried.
 *
 * @param pipeline the complete pipeline
 * @return an object with 2 keys: `domain` for the domain of the first step and
 * `pipeline` for the rest of the pipeline.
 */
export function filterOutDomain(pipeline: Pipeline): { domain: string; pipeline: Pipeline } {
  if (pipeline.length === 0) {
    throw new Error('pipeline should like [DomainStep, ...otherSteps]');
  }
  const [domainStep, ...subpipeline] = pipeline;
  if (domainStep.name !== 'domain') {
    throw new Error('pipeline should like [DomainStep, ...otherSteps]');
  }
  return {
    domain: domainStep.domain,
    pipeline: subpipeline,
  };
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
function transformMatch(matchStep: MongoStep): Pipeline {
  const output: Pipeline = [];
  if (matchStep.$match.domain !== undefined) {
    output.push({ name: 'domain', domain: matchStep.$match.domain });
  }
  for (const column of Object.keys(matchStep.$match).sort()) {
    if (column !== 'domain') {
      output.push({
        name: 'filter',
        condition: { column, value: matchStep.$match[column], operator: 'eq' },
      });
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
function transformProject(matchStep: MongoStep): Pipeline {
  const output: Pipeline = [];
  // NOTE: we have to tell typescript that `needsRenaming`, `needsDeletion` and
  // `computedColumns` are arrays of `PipelineStep` because it can't otherwise
  // infer the "name" property literal type correctly.
  // cf.https://github.com/Microsoft/TypeScript/issues/15311 or
  // https://stackoverflow.com/questions/50762772/typescript-why-cant-this-string-literal-type-be-inferred
  const needsRenaming: Pipeline = [];
  const needsDeletion: Pipeline = [];
  const computedColumns: Pipeline = [];
  const select = [];
  for (const [outcol, incol] of Object.entries(matchStep.$project)) {
    if (typeof incol === 'string') {
      if (incol[0] === '$' && incol.slice(1) !== outcol) {
        // case { $project: { zone: '$Region' } }
        needsRenaming.push({ name: 'rename', toRename: [[incol.slice(1), outcol]] });
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
    }
  }
  if (select.length) {
    output.push({ name: 'select', columns: select });
  }
  output.push(...needsRenaming, ...needsDeletion, ...computedColumns);
  return output;
}

function transformFallback(step: MongoStep): Pipeline {
  return [
    {
      name: 'custom',
      query: JSON.stringify(step),
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
export function mongoToPipe(mongoSteps: MongoStep[]): Pipeline {
  const listOfSteps: Pipeline = [];
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
