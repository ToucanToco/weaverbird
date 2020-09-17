import aggregations from './aggregations';
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
    aggregations,
    keepOriginalGranularity: {
      type: 'boolean',
      description:
        'If true, keeps the original granularity and adds the aggregation(s) in new column(s)',
    },
  },
  required: ['name', 'on', 'aggregations'],
  additionalProperties: false,
};

export default function buildSchema(form: StepFormType) {
  return addNotInColumnNamesConstraint(schema, 'aggregations.items.newcolumn', form.columnNames);
}
