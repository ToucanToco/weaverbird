export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Convert column to uppercase',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['uppercase'],
    },
    column: {
      type: 'string',
      minLength: 1,
      title: 'Column to convert',
      description: 'Column to convert',
      attrs: {
        placeholder: 'Enter a column',
      },
    },
  },
  required: ['name', 'column'],
  additionalProperties: false,
};
