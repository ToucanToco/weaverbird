export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Top step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['top'],
    },
    rank_on: {
      type: 'string',
      minLength: 1,
      title: 'Sort column...',
      description: 'The column used to sort rows',
      attrs: {
        placeholder: 'Select a column',
      },
    },
    sort: {
      type: 'string',
      title: 'Sort order',
      description: 'The order used to sort values',
      attrs: {
        placeholder: 'Select an order',
      },
      enum: ['asc', 'desc'],
    },
    limit: {
      type: 'integer',
      title: 'Number of top rows',
      description: 'The number of top rows to get after sorting',
      attrs: {
        placeholder: 'Enter an integer',
      },
    },
    groups: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Group by',
      description:
        'The columns used to group the data if needing to get top rows in several groups',
      attrs: {
        placeholder: 'Add columns',
      },
    },
  },
  required: ['rank_on', 'sort', 'limit'],
  additionalProperties: false,
};
