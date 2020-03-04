import { addNotInColumnNamesConstraint, StepFormType } from './utils';

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Cumulated sum step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      const: 'cumsum',
    },
    valueColumn: {
      type: 'string',
      minLength: 1,
      title: 'Value column name',
      description: 'The name of the value column to sum',
    },
    referenceColumn: {
      type: 'string',
      minLength: 1,
      title: 'Reference column name',
      description: 'The name of the reference column that will be sorted (usually dates)',
    },
    groupby: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Group by',
      description: 'The columns used to group cumsum computation',
    },
    newColumn: {
      type: 'string',
      minLength: 1,
      title: 'Reference column name',
      description: 'The name of the new column to be created',
    },
  },
  required: ['name', 'valueColumn', 'referenceColumn'],
  additionalProperties: false,
};

export default function buildSchema(form: StepFormType) {
  return addNotInColumnNamesConstraint(schema, 'newColumn', form.columnNames);
}
