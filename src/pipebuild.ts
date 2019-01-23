/**
 * Pipeline builder module.
 *
 * This module define the mongo → standard pipeline steps implementation.
 */


/**
 * MongoStep interface. For now, it's basically an object with any property.
 */
interface MongoStep {
    [propName: string]: any;
}


/**
 * Transform a list of mongo steps into a standard pipeline, as understood
 * by the Pipeline vue.
 *
 * @param mongoSteps the list of input mongo steps
 *
 * @returns the standard pipeline
 */
export function mongoToPipe(mongoSteps: Array<MongoStep>) {
    return mongoSteps.map(s => ({ ...s, translated: true }));
}
