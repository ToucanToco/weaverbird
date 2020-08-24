/**
 * The JavaScript translator turns pipelines steps into functions.
 *
 * With it, pipelines can be executed right in the browser, without any
 * database engine. This is very useful for testing, getting an idea of how
 * transformations works and provide a specification for transformations steps.
 * For web apps, it can also enable offline data processing.
 *
 * Input data must be of the form:
 * ```
 * {
 *   "domainA": [{
 *     "column1": 123,
 *     "column2": 456,
 *     ...
 *   }, ...],
 *  "domainB": [...],
 *  ...
 *  }
 *  ```
 */
import * as S from '@/lib/steps';
import { BaseTranslator } from '@/lib/translators/base';

type ColumnName = string | number;
type DataRow = Record<ColumnName, any>;
export type DataTable = DataRow[];
export type DataDomains = Record<string, DataTable>;

/**
 * Each step will be translated into a function that outputs a data table. We call these StepFunctions.
 *
 * Some step functions needs the entire library of data domains as argument (domain and combination steps),
 * but most only needs the current data table. They all have the same signature so they can be called easily in a loop.
 */
type JsStepFunction = (data: Readonly<DataTable>, domains: Readonly<DataDomains>) => DataTable;

export class JavaScriptTranslator extends BaseTranslator {
  static label = 'JavaScript';

  constructor() {
    super();
  }

  translate(pipeline: S.Pipeline): JsStepFunction[] {
    return super.translate(pipeline) as JsStepFunction[];
  }

  // transform a "domain" step into corresponding function
  domain(domainStep: Readonly<S.DomainStep>): JsStepFunction {
    return function(_data: Readonly<DataTable>, dataDomains: Readonly<DataDomains>) {
      return dataDomains[domainStep.domain];
    };
  }
}

/**
 * The execute function provides a simple way to execute all the translated JsStepFunctions sequentially, to return the
 * result of the data transformation.
 */
export function execute(
  dataDomains: Readonly<DataDomains>,
  jsStepFunctions: Readonly<JsStepFunction[]>,
): DataTable {
  let result: DataTable = [];
  for (const jsStepFunction of jsStepFunctions) {
    result = jsStepFunction(result, dataDomains);
  }
  return result;
}
