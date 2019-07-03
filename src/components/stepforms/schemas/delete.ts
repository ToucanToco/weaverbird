export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Delete column step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['delete'],
    },
    columns: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Delete columns',
      description: 'Columns to delete',
      attrs: {
        placeholder: 'Select columns to delete',
      },
    },
  },
  required: ['name', 'columns'],
  additionalProperties: false,
};
