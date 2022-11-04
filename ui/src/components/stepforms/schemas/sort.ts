export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Sort column step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['sort'],
    },
    columns: {
      type: 'array',
      minItems: 1,
      title: 'Columns to sort',
      description: 'Columns to sort',
      attrs: {
        placeholder: 'Enter columns',
      },
      items: {
        type: 'object',
        title: 'Column to sort',
        description: 'Column to sort',
        properties: {
          column: {
            type: 'string',
            minLength: 1,
          },
          order: {
            type: 'string',
            enum: ['asc', 'desc'],
          },
        },
      },
    },
  },
  required: ['name', 'columns'],
  additionalProperties: false,
};
