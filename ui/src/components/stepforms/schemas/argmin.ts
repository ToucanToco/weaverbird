export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Argmin step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['argmin'],
    },
    column: {
      type: 'string',
      minLength: 1,
      title: 'Search min in:',
      description: 'The column in which to find min value',
      attrs: {
        placeholder: 'Add a column',
      },
    },
    groups: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Group by',
      description: 'The columns used to group the data if needing to find a min for several groups',
      attrs: {
        placeholder: 'Add columns',
      },
    },
  },
  required: ['column'],
  additionalProperties: false,
};
