import aggregateBuildSchema from './aggregate';
import argmaxSchema from './argmax';
import argminSchema from './argmin';
import deleteSchema from './delete';
import domainSchema from './domain';
import fillnaSchema from './fillna';
import filterSchema from './filter';
import percentageBuildSchema from './percentage';
import renameBuildSchema from './rename';
import unpivotSchema from './unpivot';

type buildSchemaType = ((form: any) => object) | object;

const factories: { [stepname: string]: buildSchemaType } = {
  aggregate: aggregateBuildSchema,
  argmax: argmaxSchema,
  argmin: argminSchema,
  delete: deleteSchema,
  domain: domainSchema,
  fillna: fillnaSchema,
  filter: filterSchema,
  percentage: percentageBuildSchema,
  rename: renameBuildSchema,
  unpivot: unpivotSchema,
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
