import addmissingdatesSchema from './addmissingdates';
import aggregateBuildSchema from './aggregate';
import appendSchema from './append';
import argmaxSchema from './argmax';
import argminSchema from './argmin';
import concatenateBuildSchema from './concatenate';
import convertSchema from './convert';
import cumsumSchema from './cumsum';
import customSchema from './custom';
import dateextractSchema from './dateextract';
import deleteSchema from './delete';
import domainSchema from './domain';
import duplicateSchema from './duplicate';
import durationSchema from './duration';
import evolutionSchema from './evolution';
import fillnaSchema from './fillna';
import filterSchema from './filter';
import formulaSchema from './formula';
import fromDateSchema from './fromdate';
import ifthenelseSchema from './ifthenelse';
import joinSchema from './join';
import movingAverageBuildSchema from './movingaverage';
import percentageBuildSchema from './percentage';
import pivotSchema from './pivot';
import rankSchema from './rank';
import renameSchema from './rename';
import replaceSchema from './replace';
import rollupSchema from './rollup';
import selectSchema from './select';
import sortSchema from './sort';
import splitSchema from './split';
import statisticsSchema from './statistics';
import strcmpSchema from './strcmp';
import substringSchema from './substring';
import textSchema from './text';
import toDateSchema from './todate';
import toLowerSchema from './tolower';
import topBuildSchema from './top';
import totalsSchema from './totals';
import toUpperSchema from './toupper';
import uniqueGroupsSchema from './uniquegroups';
import unpivotSchema from './unpivot';
import waterfallSchema from './waterfall';

type buildSchemaType = ((form: any) => object) | object;

const factories: { [stepname: string]: buildSchemaType } = {
  addmissingdates: addmissingdatesSchema,
  aggregate: aggregateBuildSchema,
  append: appendSchema,
  argmax: argmaxSchema,
  argmin: argminSchema,
  concatenate: concatenateBuildSchema,
  convert: convertSchema,
  cumsum: cumsumSchema,
  custom: customSchema,
  dateextract: dateextractSchema,
  delete: deleteSchema,
  domain: domainSchema,
  duplicate: duplicateSchema,
  duration: durationSchema,
  evolution: evolutionSchema,
  fillna: fillnaSchema,
  filter: filterSchema,
  formula: formulaSchema,
  fromdate: fromDateSchema,
  ifthenelse: ifthenelseSchema,
  join: joinSchema,
  lowercase: toLowerSchema,
  movingaverage: movingAverageBuildSchema,
  percentage: percentageBuildSchema,
  pivot: pivotSchema,
  rank: rankSchema,
  rename: renameSchema,
  replace: replaceSchema,
  rollup: rollupSchema,
  select: selectSchema,
  sort: sortSchema,
  split: splitSchema,
  statistics: statisticsSchema,
  strcmp: strcmpSchema,
  substring: substringSchema,
  text: textSchema,
  todate: toDateSchema,
  top: topBuildSchema,
  totals: totalsSchema,
  unpivot: unpivotSchema,
  uniquegroups: uniqueGroupsSchema,
  uppercase: toUpperSchema,
  waterfall: waterfallSchema,
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
