import _ from 'lodash';
import { Ajv } from 'ajv';

type JsonPropSchema = {
  [prop: string]: any;
};

type JsonSchema = {
  properties: { [prop: string]: JsonPropSchema };
};

export type StepFormType = {
  columnNames: string[];
};

/**
 * extend standard JsonSchema with custom keywords (e.g. `columnNameAlreadyUsed`)
 *
 * @param ajv the schema validator instance
 */
export function addAjvKeywords(ajv: Ajv) {
  // `columnAlreadyUsed` is actually just a shortcut for `{not: enum: columnNames}`
  // but:
  // - using the `not` directly would generate more obscur error messages
  // - using `macro` instead of `validate` would generate two errors, one with
  //   `columnNameAlreadyUsed` and one with `not`.
  ajv.addKeyword('columnNameAlreadyUsed', {
    type: 'string',
    validate: function(schema: { columnNames: string[] }, data: string) {
      return !schema.columnNames.includes(data);
    },
  });
}

/**
 * Extend a step's jsonschema with a "check this column is not already used" constraint.
 *
 * @param model the original jsonschema
 * @param fieldname the field path inside the schema the constraint should be put on
 * @param colnames the list of existing column names to check on
 */
export function addNotInColumnNamesConstraint(
  model: JsonSchema,
  fieldname: string,
  colnames: string[],
) {
  if (colnames.length) {
    _.set(model, `properties.${fieldname}.columnNameAlreadyUsed`, { columnNames: colnames });
  }
  return model;
}
