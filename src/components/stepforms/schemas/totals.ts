import aggregations from './aggregations';

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Add Total Rows step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['totals'],
    },
    totalDimensions: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          totalColumn: {
            type: 'string',
            minLength: 1,
          },
          totalRowsLabel: {
            type: 'string',
            minLength: 1,
          },
        },
      },
      title: 'Columns to compute total rows in',
      description: 'Select a column and enter a label for computed total rows',
    },
    aggregations,
    groups: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Group by',
      description: 'The columns used to scope the compuation by group of rows if needed',
      attrs: {
        placeholder: 'Add columns',
      },
    },
  },
  required: ['name', 'totalDimensions', 'aggregations'],
  additionalProperties: false,
};
