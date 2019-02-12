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
 * @returns the corresponding pipeline steps
 */
function transformMatch(matchStep: MongoStep): Array<PipelineStep> {
    const output: Array<PipelineStep> = [];
    if (matchStep.$match.domain !== undefined) {
        output.push({ step: 'domain', domain: matchStep.$match.domain });
    }
    for (const column of Object.keys(matchStep.$match).sort()) {
        if (column !== 'domain') {
            output.push({ step: 'filter', column, value: matchStep.$match[column] });
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
    const needsRenaming = [];
    const needsDeletion = [];
    const select = [];
    for (let [outcol, incol] of Object.entries(matchStep.$project)) {
        if (typeof incol === 'string') {
            if (incol[0] === '$' && incol.slice(1) !== outcol) {
                // case { $project: { zone: '$Region' } }
                needsRenaming.push({ step: 'rename', oldname: incol.slice(1), newname: outcol });
            } else if (incol.slice(1) === outcol) {
                select.push(outcol);
            }
        } else if (typeof incol === 'number') {
            if (incol === 0) {
                // case { $project: { zone: 0 } }
                needsDeletion.push({ step: 'delete', columns: [outcol] });
            } else {
                // case { $project: { zone: 1 } }
                select.push(outcol);
            }
        }
    }
    if (select.length) {
        output.push({ step: 'select', columns: select });
    }
    output.push(...needsRenaming, ...needsDeletion);
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
