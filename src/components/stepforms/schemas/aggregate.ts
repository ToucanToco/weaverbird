import { addNotInColumnNamesConstraint, StepFormType } from './utils';

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Aggregate step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['aggregate'],
    },
    on: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Group by',
      description: 'The columns used to group the data for aggregation',
      attrs: {
        placeholder: 'Add columns',
      },
    },
    aggregations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          column: {
            type: 'string',
            minLength: 1,
          },
          aggfunction: {
            type: 'string',
            enum: ['sum', 'avg', 'count', 'min', 'max', 'first', 'last'],
          },
          newcolumn: {
            type: 'string',
            minLength: 1,
          },
        },
        required: ['column', 'aggfunction', 'newcolumn'],
        additionalProperties: false,
      },
      minItems: 1,
      title: 'Aggregations',
      description: 'The aggregations to be performed',
    },
  },
  required: ['name', 'on', 'aggregations'],
  additionalProperties: false,
};

export default function buildSchema(form: StepFormType) {
  return addNotInColumnNamesConstraint(schema, 'aggregations.items.newcolumn', form.columnNames);
}
