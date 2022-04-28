export default {
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
      description: 'The columns used to group the data for dissolve',
      attrs: {
        placeholder: 'Add columns',
      },
    },
    aggregations: {
      type: 'array',
      items: {
        type: 'object',
        minLength: 1,
        properties: {
          column: { type: 'string' },
          agg_function: {
            type: 'string',
            enum: ['sum', 'avg', 'count', 'count distinct', 'min', 'max', 'first', 'last'],
          },
        },
        required: ['column', 'agg_function'],
        additionalProperties: false,
        title: 'Aggregations',
        description: 'The aggregations to execute',
      },
    },
    include_nulls: {
      type: 'boolean',
    },
  },
  required: ['name', 'groups', 'aggregations'],
  additionalProperties: false,
};
