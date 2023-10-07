export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Convert duration column to text step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['fromduration'],
    },
    column: {
      type: 'string',
      minLength: 1,
      title: 'Column to convert',
      description: 'Column to convert',
      attrs: {
        placeholder: 'Select a column',
      },
    },
    format: {
      type: 'string',
      minLength: 1,
      title: 'Duration format',
    },
  },
  required: ['name', 'column', 'format'],
  additionalProperties: false,
};
