export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Argmax step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['argmax'],
    },
    column: {
      type: 'string',
      minLength: 1,
      title: 'Search max in:',
      description: 'The column in which to find max value',
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
      description: 'The columns used to group the data if needing to find a max for several groups',
      attrs: {
        placeholder: 'Add columns',
      },
    },
  },
  required: ['column'],
  additionalProperties: false,
};
