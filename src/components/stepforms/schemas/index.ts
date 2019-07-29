import aggregateBuildSchema from './aggregate';
import argmaxSchema from './argmax';
import argminSchema from './argmin';
import deleteSchema from './delete';
import duplicateSchema from './duplicate';
import domainSchema from './domain';
import fillnaSchema from './fillna';
import filterSchema from './filter';
import formulaSchema from './formula';
import percentageBuildSchema from './percentage';
import pivotSchema from './pivot';
import renameBuildSchema from './rename';
import replaceBuildSchema from './replace';
import selectSchema from './select';
import topBuildSchema from './top';
import unpivotSchema from './unpivot';
import sortSchema from './sort';

type buildSchemaType = ((form: any) => object) | object;

const factories: { [stepname: string]: buildSchemaType } = {
  aggregate: aggregateBuildSchema,
  argmax: argmaxSchema,
  argmin: argminSchema,
  delete: deleteSchema,
  duplicate: duplicateSchema,
  domain: domainSchema,
  fillna: fillnaSchema,
  filter: filterSchema,
  formula: formulaSchema,
  percentage: percentageBuildSchema,
  pivot: pivotSchema,
  rename: renameBuildSchema,
  replace: replaceBuildSchema,
  select: selectSchema,
  top: topBuildSchema,
  unpivot: unpivotSchema,
  sort: sortSchema,
};

/**
 * Return the jsonschema associated with a given step. In simple cases,
 * it's a static object but in more complicated cases, the schema is computed
 * dynamically according to the form state (e.g. a schema might depend on actual
 * column names).
 *
 * @param stepname the transformation step name
 * @param form the VQB StepForm component the schema will be used in
 */
export default function schemaFactory(stepname: string, form: any) {
  const factoryOrSchema = factories[stepname];
  if (typeof factoryOrSchema === 'function') {
    return factoryOrSchema(form);
  } else {
    return factoryOrSchema;
  }
}
