export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Convert time column to text step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['fromtime'],
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
      title: 'Time format',
    },
  },
  required: ['name', 'column', 'format'],
  additionalProperties: false,
};
