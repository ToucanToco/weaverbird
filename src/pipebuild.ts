/**
 * Pipeline builder module.
 *
 * This module define the mongo → standard pipeline steps implementation.
 */

/**
 * MongoStep interface. For now, it's basically an object with any property.
 */
export interface MongoStep {
    [propName: string]: any;
}

export interface PipelineStep {
    step: string;
    [propName: string]: any;
}

/**
 * Transform a mongo `$match` step into a list of pipeline steps.
 * If a `domain` key is found in the `$match` step, generate a `Domain`
 * pipeline step. After that, generate a `Filter` step with all the remaining
 * properties.
 *
 * @param matchStep the match mongo step
 */
function transformMatch(matchStep: MongoStep): Array<PipelineStep> {
    const output: Array<PipelineStep> = [];
    if (matchStep.$match.domain !== undefined) {
        output.push({ step: 'Domain', query: { $match: { domain: matchStep.$match.domain } } });
    }
    const nodomain = { ...matchStep.$match };
    delete nodomain.domain;
    if (Object.keys(nodomain).length) {
        output.push({ step: 'Filter', query: { $match: nodomain } });
    }
    return output;
}

function transformFallback(step: MongoStep): Array<PipelineStep> {
    return [
        {
            step: 'Fallback',
            input: step,
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
        const transformer = step.$match ? transformMatch : transformFallback;
        listOfSteps.push(...transformer(step));
    }
    return listOfSteps;
}
