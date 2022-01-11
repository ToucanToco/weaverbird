export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Trim spaces column step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['trim'],
    },
    columns: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Trim spaces in columns',
      description: 'Columns to trim',
      attrs: {
        placeholder: 'Select columns to trim',
      },
    },
  },
  required: ['name', 'columns'],
  additionalProperties: false,
};
