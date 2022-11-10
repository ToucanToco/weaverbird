export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Keep columns',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['select'],
    },
    columns: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Keep columns',
      description: 'Columns to keep',
      attrs: {
        placeholder: 'Select columns to keep',
      },
    },
  },
  required: ['name', 'columns'],
  additionalProperties: false,
};
