import aggregateBuildSchema from './aggregate';
import appendSchema from './append';
import argmaxSchema from './argmax';
import argminSchema from './argmin';
import concatenateBuildSchema from './concatenate';
import convertSchema from './convert';
import customSchema from './custom';
import dateextractSchema from './dateextract';
import deleteSchema from './delete';
import domainSchema from './domain';
import duplicateSchema from './duplicate';
import evolutionSchema from './evolution';
import fillnaSchema from './fillna';
import filterSchema from './filter';
import formulaSchema from './formula';
import fromDateSchema from './fromdate';
import joinSchema from './join';
import percentageBuildSchema from './percentage';
import pivotSchema from './pivot';
import renameBuildSchema from './rename';
import replaceSchema from './replace';
import rollupSchema from './rollup';
import selectSchema from './select';
import sortSchema from './sort';
import splitSchema from './split';
import substringSchema from './substring';
import textSchema from './text';
import toDateSchema from './todate';
import toLowerSchema from './tolower';
import topBuildSchema from './top';
import toUpperSchema from './toupper';
import uniqueGroupsSchema from './uniquegroups';
import unpivotSchema from './unpivot';

type buildSchemaType = ((form: any) => object) | object;

const factories: { [stepname: string]: buildSchemaType } = {
  aggregate: aggregateBuildSchema,
  append: appendSchema,
  argmax: argmaxSchema,
  argmin: argminSchema,
  concatenate: concatenateBuildSchema,
  convert: convertSchema,
  custom: customSchema,
  dateextract: dateextractSchema,
  delete: deleteSchema,
  duplicate: duplicateSchema,
  domain: domainSchema,
  evolution: evolutionSchema,
  fillna: fillnaSchema,
  filter: filterSchema,
  formula: formulaSchema,
  fromdate: fromDateSchema,
  join: joinSchema,
  lowercase: toLowerSchema,
  percentage: percentageBuildSchema,
  pivot: pivotSchema,
  rename: renameBuildSchema,
  replace: replaceSchema,
  rollup: rollupSchema,
  select: selectSchema,
  sort: sortSchema,
  split: splitSchema,
  substring: substringSchema,
  text: textSchema,
  todate: toDateSchema,
  top: topBuildSchema,
  unpivot: unpivotSchema,
  uniquegroups: uniqueGroupsSchema,
  uppercase: toUpperSchema,
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
