export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Statistics step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      const: 'statistics',
    },
    column: {
      type: 'string',
      minLength: 1,
    },
    groupbyColumns: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
    },
    statistics: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['count', 'max', 'min', 'median', 'average', 'variance', 'standard deviation'],
      },
    },
    quantiles: {
      type: 'array',
      items: {
        type: 'object',
        required: ['nth', 'order'],
        properties: {
          label: { type: 'string' },
          nth: { type: 'number' },
          order: { type: 'number' },
        },
      },
    },
  },
  required: ['name', 'column', 'statistics', 'quantiles'],
  additionalProperties: false,
};
