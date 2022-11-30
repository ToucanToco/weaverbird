import type { StepFormType } from './utils';
import { addNotInColumnNamesConstraint } from './utils';

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Concatenate step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['concatenate'],
    },
    columns: {
      type: 'array',
      items: {
        type: ['string'],
        minLength: 1,
      },
      minItems: 1,
      title: 'To concatenate',
      description: 'Columns to concatenate',
    },
    separator: {
      type: 'string',
      minLength: 0,
      title: 'Separator',
      description: 'The separator used to concatenate strings',
      attrs: {
        placeholder: 'Enter a string of any length',
      },
    },
    newColumnName: {
      type: 'string',
      minLength: 1,
      title: 'New column name',
      description: 'The new column that will be created with the concatenated string',
      attrs: {
        placeholder: 'Enter a column name',
      },
    },
  },
  required: ['name', 'columns', 'separator', 'newColumnName'],
  additionalProperties: false,
};

export default function buildSchema(form: StepFormType) {
  return addNotInColumnNamesConstraint(schema, 'newColumnName', form.columnNames);
}
