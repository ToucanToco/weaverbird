import absolutevalueSchema from './absolutevalue';
import addmissingdatesSchema from './addmissingdates';
import aggregateBuildSchema from './aggregate';
import appendSchema from './append';
import argmaxSchema from './argmax';
import argminSchema from './argmin';
import comparetextSchema from './comparetext';
import concatenateBuildSchema from './concatenate';
import convertSchema from './convert';
import cumsumSchema from './cumsum';
import customSchema from './custom';
import customSqlSchema from './customsql';
import dateextractSchema from './dateextract';
import deleteSchema from './delete';
import dissolveSchema from './dissolve';
import domainSchema from './domain';
import duplicateSchema from './duplicate';
import durationSchema from './duration';
import evolutionSchema from './evolution';
import fillnaSchema from './fillna';
import filterSchema from './filter';
import formulaSchema from './formula';
import fromDateSchema from './fromdate';
import hierarchySchema from './hierarchy';
import ifthenelseSchema from './ifthenelse';
import joinSchema from './join';
import movingAverageBuildSchema from './movingaverage';
import percentageBuildSchema from './percentage';
import pivotSchema from './pivot';
import rankSchema from './rank';
import renameSchema from './rename';
import replaceSchema from './replace';
import replaceTextSchema from './replaceText';
import rollupSchema from './rollup';
import selectSchema from './select';
import simplifySchema from './simplify';
import sortSchema from './sort';
import splitSchema from './split';
import statisticsSchema from './statistics';
import substringSchema from './substring';
import textSchema from './text';
import toDateSchema from './todate';
import toLowerSchema from './tolower';
import topBuildSchema from './top';
import totalsSchema from './totals';
import toUpperSchema from './toupper';
import trimSchema from './trim';
import uniqueGroupsSchema from './uniquegroups';
import unpivotSchema from './unpivot';
import waterfallSchema from './waterfall';

type buildSchemaType = ((form: any) => object) | object;

const factories: { [stepname: string]: buildSchemaType } = {
  absolutevalue: absolutevalueSchema,
  addmissingdates: addmissingdatesSchema,
  aggregate: aggregateBuildSchema,
  append: appendSchema,
  argmax: argmaxSchema,
  argmin: argminSchema,
  comparetext: comparetextSchema,
  concatenate: concatenateBuildSchema,
  convert: convertSchema,
  cumsum: cumsumSchema,
  custom: customSchema,
  customsql: customSqlSchema,
  dateextract: dateextractSchema,
  delete: deleteSchema,
  dissolve: dissolveSchema,
  domain: domainSchema,
  duplicate: duplicateSchema,
  duration: durationSchema,
  evolution: evolutionSchema,
  fillna: fillnaSchema,
  filter: filterSchema,
  formula: formulaSchema,
  fromdate: fromDateSchema,
  hierarchy: hierarchySchema,
  ifthenelse: ifthenelseSchema,
  join: joinSchema,
  lowercase: toLowerSchema,
  movingaverage: movingAverageBuildSchema,
  percentage: percentageBuildSchema,
  pivot: pivotSchema,
  rank: rankSchema,
  rename: renameSchema,
  replace: replaceSchema,
  replacetext: replaceTextSchema,
  rollup: rollupSchema,
  select: selectSchema,
  simplify: simplifySchema,
  sort: sortSchema,
  split: splitSchema,
  statistics: statisticsSchema,
  substring: substringSchema,
  text: textSchema,
  todate: toDateSchema,
  top: topBuildSchema,
  totals: totalsSchema,
  trim: trimSchema,
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
