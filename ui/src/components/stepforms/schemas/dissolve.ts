import aggregations from './aggregations';
import type { StepFormType } from './utils';
import { addNotInColumnNamesConstraint } from './utils';

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Dissolve step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['dissolve'],
    },
    groups: {
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
    aggregations,
    includeNulls: {
      type: 'boolean',
      description: 'If true, include null values',
    },
  },
  required: ['name', 'groups', 'aggregations'],
  additionalProperties: false,
};

export default function buildSchema(form: StepFormType) {
  return addNotInColumnNamesConstraint(schema, 'aggregations.items.newcolumn', form.columnNames);
}
