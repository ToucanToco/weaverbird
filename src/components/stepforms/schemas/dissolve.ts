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
    agg_function: {
      type: 'string',
      enum: [
        'sum',
        'avg',
        'count',
        'count distinct',
        'count distinct with null values',
        'min',
        'max',
        'first',
        'last',
      ],
    },
  },
  required: ['name', 'groups', 'agg_function'],
  additionalProperties: false,
};
